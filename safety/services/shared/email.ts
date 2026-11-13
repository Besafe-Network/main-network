import dns from 'node:dns';
import net from 'node:net';
import util from 'node:util';
import nodemailer from 'nodemailer';
import { config } from './config';
import * as EmailTemplates from '../../emailService';
import { SystemConfig } from './models';

export interface DashboardMailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  rejectUnauthorized: boolean;
  ehloName: string;
}

let pooledTransportV6: nodemailer.Transporter | null = null;
let pooledTransportV6Ip = '';
let pooledTransportV4: nodemailer.Transporter | null = null;
let pooledTransportV4Ip = '';
let pooledConfigKey = '';
let cachedMailConfig: DashboardMailConfig | null = null;
let cachedMailConfigAt = 0;
const MAIL_CONFIG_CACHE_TTL_MS = 10_000;

// Track whether IPv6 is currently reachable for the active host:port (re-checked every 5 minutes if it previously failed)
let ipv6StatusCache: { key: string; working: boolean; checkedAt: number } | null = null;
const IPV6_RETRY_AFTER_MS = 5 * 60_000;

function extractDomainFromAddress(value: string): string {
  const match = String(value || '').match(/@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  return match ? match[1].toLowerCase() : '';
}

function stripBrackets(host: string): string {
  return String(host || '').trim().replace(/^\[|\]$/g, '');
}

function normalizeMailConfig(raw: any): DashboardMailConfig {
  const host = stripBrackets(raw?.smtpHost ?? '');
  const parsedPort = Number.parseInt(String(raw?.smtpPort ?? '587').trim(), 10);
  const port = Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 587;
  const secure = port === 465 ? true : Boolean(raw?.smtpSecure);
  const user = String(raw?.smtpUser ?? '').trim();
  const pass = String(raw?.smtpPass ?? '');
  const rawFrom = String(raw?.smtpFrom ?? '').trim();
  const from = rawFrom || (user.includes('@') ? user : host && !net.isIP(host) ? `noreply@${host.replace(/^mail\./i, '')}` : '');
  const rejectUnauthorized = Boolean(raw?.smtpRejectUnauthorized);
  const ehloName =
    extractDomainFromAddress(from) ||
    extractDomainFromAddress(user) ||
    (!net.isIP(host) ? host.replace(/^mail\./i, '') : '') ||
    'localhost';

  return {
    host,
    port,
    secure,
    user,
    pass,
    from,
    rejectUnauthorized,
    ehloName,
  };
}

export function invalidateMailConfigCache(): void {
  cachedMailConfig = null;
  cachedMailConfigAt = 0;
  ipv6StatusCache = null;
  if (pooledTransportV6) {
    try {
      pooledTransportV6.close();
    } catch {}
    pooledTransportV6 = null;
    pooledTransportV6Ip = '';
  }
  if (pooledTransportV4) {
    try {
      pooledTransportV4.close();
    } catch {}
    pooledTransportV4 = null;
    pooledTransportV4Ip = '';
  }
  pooledConfigKey = '';
}

export async function getDashboardMailConfig(forceRefresh = false): Promise<DashboardMailConfig> {
  const now = Date.now();
  if (!forceRefresh && cachedMailConfig && now - cachedMailConfigAt < MAIL_CONFIG_CACHE_TTL_MS) {
    return cachedMailConfig;
  }

  const sysConfig = await SystemConfig.findOne({ id: 'main' }).lean().catch(() => null);
  const resolved = normalizeMailConfig(sysConfig || {});
  cachedMailConfig = resolved;
  cachedMailConfigAt = now;
  return resolved;
}

async function resolveIpv6Addresses(hostname: string): Promise<string[]> {
  const cleanHost = stripBrackets(hostname);
  if (!cleanHost) return [];
  if (net.isIP(cleanHost) === 6) return [cleanHost];
  if (net.isIP(cleanHost) === 4) return [];

  try {
    const records = await dns.promises.resolve6(cleanHost);
    if (Array.isArray(records) && records.length > 0) {
      return records;
    }
  } catch {}

  try {
    const lookedUp = await dns.promises.lookup(cleanHost, { family: 6, all: true });
    return lookedUp.map((entry) => entry.address).filter(Boolean);
  } catch {
    return [];
  }
}

async function resolveIpv4Addresses(hostname: string): Promise<string[]> {
  const cleanHost = stripBrackets(hostname);
  if (!cleanHost) return [];
  if (net.isIP(cleanHost) === 4) return [cleanHost];
  if (net.isIP(cleanHost) === 6) return [];

  try {
    const records = await dns.promises.resolve4(cleanHost);
    if (Array.isArray(records) && records.length > 0) {
      return records;
    }
  } catch {}

  try {
    const lookedUp = await dns.promises.lookup(cleanHost, { family: 4, all: true });
    return lookedUp.map((entry) => entry.address).filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Pass the resolved literal IPv6 or IPv4 address directly as `host` so Nodemailer 8's internal
 * `resolveHostname` does not resolve the domain to an IPv4 A record when `family: 6` is set,
 * while keeping the original domain in `tls.servername` for SNI and certificate validation.
 */
function createTransportOptions(
  mailConfig: DashboardMailConfig,
  targetIpOrHost: string,
  family: 6 | 4,
  pooled: boolean,
  customLogger?: any
): any {
  const connTimeout = family === 6 ? 5000 : 10000;
  const sniServername = !net.isIP(mailConfig.host) ? mailConfig.host : undefined;

  return {
    host: stripBrackets(targetIpOrHost),
    port: mailConfig.port,
    pool: pooled,
    ...(pooled ? { maxConnections: 5, maxMessages: Infinity } : {}),
    secure: mailConfig.secure,
    name: mailConfig.ehloName,
    auth: mailConfig.user ? { user: mailConfig.user, pass: mailConfig.pass } : undefined,
    connectionTimeout: connTimeout,
    greetingTimeout: 8000,
    socketTimeout: 15000,
    tls: {
      rejectUnauthorized: mailConfig.rejectUnauthorized,
      ...(sniServername ? { servername: sniServername } : {}),
    },
    ...(customLogger ? { logger: customLogger, debug: true } : {}),
  };
}

function getConfigKey(mailConfig: DashboardMailConfig): string {
  return JSON.stringify({
    host: mailConfig.host,
    port: mailConfig.port,
    secure: mailConfig.secure,
    user: mailConfig.user,
    pass: mailConfig.pass,
    rejectUnauthorized: mailConfig.rejectUnauthorized,
    ehloName: mailConfig.ehloName,
  });
}

export async function sendMail(
  to: string,
  subject: string,
  text: string,
  html?: string,
  attachments?: any[]
): Promise<{ sent: boolean; error?: string }> {
  const mailConfig = await getDashboardMailConfig();
  if (!mailConfig.host) {
    console.warn('[Email] SMTP not configured in Admin Dashboard Settings. Skipping email to:', to);
    return { sent: false, error: 'SMTP is not configured in Admin Dashboard Settings' };
  }

  const configKey = getConfigKey(mailConfig);
  if (pooledConfigKey !== configKey) {
    invalidateMailConfigCache();
    pooledConfigKey = configKey;
  }

  const messagePayload = {
    from: mailConfig.from,
    to,
    subject,
    text,
    html: html || text,
    attachments,
  };

  const now = Date.now();
  const shouldTryIpv6First =
    !ipv6StatusCache ||
    ipv6StatusCache.key !== configKey ||
    ipv6StatusCache.working ||
    now - ipv6StatusCache.checkedAt > IPV6_RETRY_AFTER_MS;

  if (shouldTryIpv6First) {
    const startV6 = Date.now();
    try {
      const v6Addresses = await resolveIpv6Addresses(mailConfig.host);
      if (v6Addresses.length > 0) {
        const targetV6Ip = v6Addresses[0];
        if (!pooledTransportV6 || pooledTransportV6Ip !== targetV6Ip) {
          if (pooledTransportV6) {
            try {
              pooledTransportV6.close();
            } catch {}
          }
          pooledTransportV6 = nodemailer.createTransport(
            createTransportOptions(mailConfig, targetV6Ip, 6, true)
          );
          pooledTransportV6Ip = targetV6Ip;
        }

        const info = await pooledTransportV6.sendMail(messagePayload);
        const elapsedMs = Date.now() - startV6;
        ipv6StatusCache = { key: configKey, working: true, checkedAt: Date.now() };
        console.log(
          `[Email] Sent via IPv6 ([${targetV6Ip}]:${mailConfig.port}, host=${mailConfig.host}) to ${to} in ${elapsedMs}ms (secure=${mailConfig.secure}, messageId=${info?.messageId || 'n/a'}): ${subject}`
        );
        return { sent: true };
      }
    } catch (v6Err: any) {
      ipv6StatusCache = { key: configKey, working: false, checkedAt: Date.now() };
      console.warn(
        `[Email] IPv6 delivery to ${mailConfig.host}:${mailConfig.port} failed (${v6Err?.code || v6Err?.message || v6Err}); falling back to IPv4...`
      );
      if (pooledTransportV6) {
        try {
          pooledTransportV6.close();
        } catch {}
        pooledTransportV6 = null;
        pooledTransportV6Ip = '';
      }
    }
  }

  // Fallback (or cached preference) to IPv4
  const startV4 = Date.now();
  try {
    const v4Addresses = await resolveIpv4Addresses(mailConfig.host);
    const targetV4Ip = v4Addresses[0] || mailConfig.host;

    if (!pooledTransportV4 || pooledTransportV4Ip !== targetV4Ip) {
      if (pooledTransportV4) {
        try {
          pooledTransportV4.close();
        } catch {}
      }
      pooledTransportV4 = nodemailer.createTransport(
        createTransportOptions(mailConfig, targetV4Ip, 4, true)
      );
      pooledTransportV4Ip = targetV4Ip;
    }

    const info = await pooledTransportV4.sendMail(messagePayload);
    const elapsedMs = Date.now() - startV4;
    console.log(
      `[Email] Sent via IPv4 (${targetV4Ip}:${mailConfig.port}, host=${mailConfig.host}) to ${to} in ${elapsedMs}ms (secure=${mailConfig.secure}, messageId=${info?.messageId || 'n/a'}): ${subject}`
    );
    return { sent: true };
  } catch (err: any) {
    const errorMessage = err?.message || String(err || 'Failed to send email');
    console.error(
      `[Email] Failed to send email via IPv4 to ${to} (${mailConfig.host}:${mailConfig.port}, secure=${mailConfig.secure}, code=${err?.code || 'n/a'}):`,
      errorMessage
    );
    if (pooledTransportV4) {
      try {
        pooledTransportV4.close();
      } catch {}
      pooledTransportV4 = null;
      pooledTransportV4Ip = '';
    }
    return { sent: false, error: errorMessage };
  }
}

export async function sendTestEmail(
  recipientEmail: string,
  overrideSettings?: Partial<{
    smtpHost: string;
    smtpPort: number | string;
    smtpSecure: boolean;
    smtpUser: string;
    smtpPass: string;
    smtpFrom: string;
    smtpRejectUnauthorized: boolean;
  }>
): Promise<{
  sent: boolean;
  elapsedMs: number;
  host: string;
  port: number;
  secure: boolean;
  from: string;
  logs: string[];
  error?: string;
  errorDetails?: Record<string, any>;
}> {
  const startMs = Date.now();
  const logs: string[] = [];
  const pushLog = (level: string, msg: string) => {
    const relMs = Date.now() - startMs;
    const entry = `[+${String(relMs).padStart(5, ' ')}ms] [${level.toUpperCase()}] ${msg}`;
    logs.push(entry);
    console.log(`[Email Test] ${entry}`);
  };

  pushLog('INFO', 'Starting SMTP diagnostic test (IPv6 preferred with automatic IPv4 fallback)...');

  const sysConfig = await SystemConfig.findOne({ id: 'main' }).lean().catch((err) => {
    pushLog('WARN', `Failed to read SystemConfig from MongoDB: ${err?.message || err}`);
    return null;
  });

  const mergedRaw = {
    ...(sysConfig || {}),
    ...(overrideSettings || {}),
  };
  const mailConfig = normalizeMailConfig(mergedRaw);
  const targetEmail = String(recipientEmail || '').trim();

  pushLog(
    'CONFIG',
    `Host="${mailConfig.host || '(empty)'}", Port=${mailConfig.port}, Secure=${mailConfig.secure} (${
      mailConfig.secure ? 'Implicit SSL/TLS' : 'STARTTLS/Plain'
    }), EHLO="${mailConfig.ehloName}", SNI="${!net.isIP(mailConfig.host) ? mailConfig.host : '(ip-literal)'}", StrictTLS=${mailConfig.rejectUnauthorized}`
  );
  pushLog(
    'CONFIG',
    `AuthUser="${mailConfig.user || '(none)'}", PasswordSet=${Boolean(mailConfig.pass)} (len=${
      mailConfig.pass ? mailConfig.pass.length : 0
    }), From="${mailConfig.from || '(empty)'}", To="${targetEmail || '(empty)'}"`
  );

  if (!mailConfig.host) {
    const errMsg = 'SMTP Host is required. Enter your mail server hostname (e.g. mail.creatorplaza.nl).';
    pushLog('ERROR', errMsg);
    return {
      sent: false,
      elapsedMs: Date.now() - startMs,
      host: '',
      port: mailConfig.port,
      secure: mailConfig.secure,
      from: mailConfig.from,
      logs,
      error: errMsg,
    };
  }

  if (!targetEmail) {
    const errMsg = 'Recipient email address is required to send a test email.';
    pushLog('ERROR', errMsg);
    return {
      sent: false,
      elapsedMs: Date.now() - startMs,
      host: mailConfig.host,
      port: mailConfig.port,
      secure: mailConfig.secure,
      from: mailConfig.from,
      logs,
      error: errMsg,
    };
  }

  // Step 1: Resolve IPv6 (AAAA) and IPv4 (A) records
  pushLog('DNS-IPv6', `Resolving IPv6 (AAAA) records for "${mailConfig.host}"...`);
  const dns6Start = Date.now();
  const v6Addresses = await resolveIpv6Addresses(mailConfig.host);
  if (v6Addresses.length > 0) {
    pushLog(
      'DNS-IPv6',
      `Resolved IPv6 AAAA -> ${v6Addresses.join(', ')} in ${Date.now() - dns6Start}ms`
    );
  } else {
    pushLog('DNS-IPv6', `No IPv6 (AAAA) records found for "${mailConfig.host}"`);
  }

  pushLog('DNS-IPv4', `Resolving IPv4 (A) records for "${mailConfig.host}"...`);
  const dns4Start = Date.now();
  const v4Addresses = await resolveIpv4Addresses(mailConfig.host);
  if (v4Addresses.length > 0) {
    pushLog(
      'DNS-IPv4',
      `Resolved IPv4 A -> ${v4Addresses.join(', ')} in ${Date.now() - dns4Start}ms`
    );
  } else {
    pushLog('DNS-IPv4', `No IPv4 (A) records found for "${mailConfig.host}"`);
  }

  const createFamilyLogger = (familyLabel: 'IPv6' | 'IPv4') => {
    const formatNodemailerLog = (level: string, args: any[]) => {
      try {
        const prefixParts: string[] = [];
        const msgArgs: any[] = [];

        for (const arg of args) {
          if (arg && typeof arg === 'object' && !(arg instanceof Error)) {
            if (arg.tnx === 'client' || arg.tnx === 'server') {
              prefixParts.push(`[${arg.tnx.toUpperCase()}]`);
            }
            if (arg.cid) {
              prefixParts.push(`(conn#${arg.cid})`);
            }
            if (arg.err && arg.err.message) {
              prefixParts.push(`err="${arg.err.message}"`);
            }
          } else {
            msgArgs.push(arg);
          }
        }

        const formattedMsg = msgArgs.length > 0 ? util.format(...msgArgs) : '';
        const line = [...prefixParts, formattedMsg]
          .filter(Boolean)
          .join(' ')
          .replace(/\r?\n/g, ' ⏎ ')
          .trim();

        if (line) {
          pushLog(`SMTP-${familyLabel}-${level}`, line);
        }
      } catch {}
    };

    return {
      level: () => 'trace',
      trace: (...args: any[]) => formatNodemailerLog('TRACE', args),
      debug: (...args: any[]) => formatNodemailerLog('DEBUG', args),
      info: (...args: any[]) => formatNodemailerLog('INFO', args),
      warn: (...args: any[]) => formatNodemailerLog('WARN', args),
      error: (...args: any[]) => formatNodemailerLog('ERROR', args),
      fatal: (...args: any[]) => formatNodemailerLog('FATAL', args),
    };
  };

  const buildMessage = (protocolUsed: 'IPv6' | 'IPv4', targetIp: string) => {
    const subject = `SMTP Diagnostic Test (${protocolUsed}) — BeSafe Network Admin Dashboard`;
    const timestamp = new Date().toISOString();
    const text = [
      'Your SMTP configuration in the Admin Dashboard is working properly.',
      '',
      `Transport Protocol: ${protocolUsed} (${targetIp})`,
      `Host: ${mailConfig.host}:${mailConfig.port}`,
      `Encryption: ${mailConfig.secure ? 'Implicit SSL/TLS' : 'STARTTLS / Standard'}`,
      `Authenticated User: ${mailConfig.user || '(none)'}`,
      `From Address: ${mailConfig.from}`,
      `Dispatched At: ${timestamp}`,
    ].join('\n');

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e4e4e7; border-radius: 12px; background: #ffffff; color: #18181b;">
        <h2 style="margin: 0 0 12px; font-size: 18px; color: #18181b;">SMTP Connection Verified (${protocolUsed})</h2>
        <p style="margin: 0 0 16px; font-size: 14px; color: #52525b; line-height: 1.5;">
          This test email confirms that your Admin Dashboard mail settings are valid and able to deliver outgoing emails.
        </p>
        <div style="background: #f4f4f5; border-radius: 8px; padding: 14px; font-family: monospace; font-size: 12px; color: #27272a; line-height: 1.6;">
          <div><strong>IP Transport:</strong> ${protocolUsed} (${targetIp})</div>
          <div><strong>Server:</strong> ${mailConfig.host}:${mailConfig.port}</div>
          <div><strong>Encryption:</strong> ${mailConfig.secure ? 'SSL/TLS (Secure)' : 'STARTTLS'}</div>
          <div><strong>Username:</strong> ${mailConfig.user || '(unauthenticated)'}</div>
          <div><strong>From:</strong> ${mailConfig.from}</div>
          <div><strong>Timestamp:</strong> ${timestamp}</div>
        </div>
      </div>
    `;

    return {
      from: mailConfig.from,
      to: targetEmail,
      subject,
      text,
      html,
    };
  };

  const attemptSendToIp = async (
    targetIp: string,
    family: 6 | 4
  ): Promise<{ sent: boolean; error?: any }> => {
    const familyLabel = family === 6 ? 'IPv6' : 'IPv4';
    const displayEndpoint = family === 6 ? `[${targetIp}]:${mailConfig.port}` : `${targetIp}:${mailConfig.port}`;
    const transport = nodemailer.createTransport(
      createTransportOptions(mailConfig, targetIp, family, false, createFamilyLogger(familyLabel))
    );

    try {
      pushLog(
        `VERIFY-${familyLabel}`,
        `Connecting directly to ${familyLabel} address ${displayEndpoint} (TLS servername="${mailConfig.host}")...`
      );
      const verifyStart = Date.now();
      await transport.verify();
      pushLog(
        `VERIFY-${familyLabel}`,
        `${familyLabel} SMTP handshake and authentication succeeded in ${Date.now() - verifyStart}ms!`
      );

      pushLog(
        `SEND-${familyLabel}`,
        `Dispatching test message over ${familyLabel} (${displayEndpoint}) from "${mailConfig.from}" to "${targetEmail}"...`
      );
      const sendStart = Date.now();
      const info = await transport.sendMail(buildMessage(familyLabel, targetIp));
      pushLog(
        `SEND-${familyLabel}`,
        `Message accepted over ${familyLabel} in ${Date.now() - sendStart}ms! MessageId=${
          info?.messageId || 'n/a'
        }, Response="${info?.response || 'OK'}", Accepted=${JSON.stringify(info?.accepted || [])}, Rejected=${JSON.stringify(
          info?.rejected || []
        )}`
      );

      try {
        transport.close();
      } catch {}
      return { sent: true };
    } catch (err: any) {
      try {
        transport.close();
      } catch {}
      return { sent: false, error: err };
    }
  };

  // Step 2: Prefer IPv6 by passing the resolved IPv6 literal directly to `host`
  if (v6Addresses.length > 0) {
    const targetV6Ip = v6Addresses[0];
    pushLog(
      'INFO',
      `Attempting preferred IPv6 connection directly to [${targetV6Ip}]:${mailConfig.port} (SNI=${mailConfig.host})...`
    );
    const v6Result = await attemptSendToIp(targetV6Ip, 6);
    if (v6Result.sent) {
      const elapsedMs = Date.now() - startMs;
      pushLog('SUCCESS', `Total SMTP test completed over IPv6 ([${targetV6Ip}]) in ${elapsedMs}ms.`);
      return {
        sent: true,
        elapsedMs,
        host: mailConfig.host,
        port: mailConfig.port,
        secure: mailConfig.secure,
        from: mailConfig.from,
        logs,
      };
    }

    const v6Err = v6Result.error;
    pushLog(
      'WARN',
      `IPv6 attempt to [${targetV6Ip}]:${mailConfig.port} failed (${v6Err?.code || v6Err?.message || v6Err}). Automatically falling back to IPv4...`
    );
  } else {
    pushLog('INFO', 'Skipping IPv6 attempt because no AAAA record was found; proceeding with IPv4...');
  }

  // Step 3: Fallback to IPv4 by passing the resolved IPv4 literal directly to `host`
  if (v4Addresses.length === 0 && v6Addresses.length > 0) {
    const errMsg = 'IPv6 connection failed and no IPv4 (A) record is available for fallback.';
    pushLog('ERROR', errMsg);
    return {
      sent: false,
      elapsedMs: Date.now() - startMs,
      host: mailConfig.host,
      port: mailConfig.port,
      secure: mailConfig.secure,
      from: mailConfig.from,
      logs,
      error: errMsg,
    };
  }

  const targetV4Ip = v4Addresses[0] || mailConfig.host;
  pushLog(
    'INFO',
    `Attempting IPv4 connection directly to ${targetV4Ip}:${mailConfig.port} (SNI=${mailConfig.host})...`
  );
  const v4Result = await attemptSendToIp(targetV4Ip, 4);
  const elapsedMs = Date.now() - startMs;

  if (v4Result.sent) {
    pushLog('SUCCESS', `Total SMTP test completed over IPv4 (${targetV4Ip}) in ${elapsedMs}ms.`);
    return {
      sent: true,
      elapsedMs,
      host: mailConfig.host,
      port: mailConfig.port,
      secure: mailConfig.secure,
      from: mailConfig.from,
      logs,
    };
  }

  const err = v4Result.error;
  const errorDetails = {
    message: err?.message || String(err || 'SMTP test failed'),
    code: err?.code || null,
    command: err?.command || null,
    response: err?.response || null,
    responseCode: err?.responseCode || null,
    syscall: err?.syscall || null,
    address: err?.address || null,
    port: err?.port || null,
  };
  pushLog(
    'ERROR',
    `SMTP Test Failed after ${elapsedMs}ms: ${errorDetails.message} | Details=${JSON.stringify(errorDetails)}`
  );

  return {
    sent: false,
    elapsedMs,
    host: mailConfig.host,
    port: mailConfig.port,
    secure: mailConfig.secure,
    from: mailConfig.from,
    logs,
    error: errorDetails.message,
    errorDetails,
  };
}

export async function notifyAdmins(subject: string, text: string) {
  try {
    const sysConfig = await SystemConfig.findOne({ id: 'main' });
    if (sysConfig?.notificationEmail) {
      const email = EmailTemplates.getGeneralAlertEmail(subject, text, `${config.appUrl}/dashboard`);
      await sendMail(sysConfig.notificationEmail, email.subject, email.text, email.html);
    }
  } catch (err: any) {
    console.error('[Email] Failed to notify admins:', err?.message || err);
  }
}
