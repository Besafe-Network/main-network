import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

const ENV_CANDIDATE_PATHS = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '..', '.env'),
  path.resolve(process.cwd(), 'safety', '.env'),
  '/app/.env',
  '/app/safety/.env',
];

let cachedFileEnv: Record<string, string> = {};
let lastEnvLoadAt = 0;

export function loadDotEnvSettings(force = false): Record<string, string> {
  const now = Date.now();
  if (!force && lastEnvLoadAt > 0 && now - lastEnvLoadAt < 5000) {
    return cachedFileEnv;
  }

  const mergedFromFiles: Record<string, string> = {};
  for (const envPath of ENV_CANDIDATE_PATHS) {
    try {
      if (fs.existsSync(envPath) && fs.statSync(envPath).isFile()) {
        const raw = fs.readFileSync(envPath, 'utf8');
        const parsed = dotenv.parse(raw);
        for (const [key, val] of Object.entries(parsed)) {
          if (val !== undefined && val !== '') {
            mergedFromFiles[key] = val;
            process.env[key] = val;
          } else if (process.env[key] === undefined) {
            process.env[key] = val;
          }
        }
      }
    } catch {}
  }

  cachedFileEnv = mergedFromFiles;
  lastEnvLoadAt = now;
  return mergedFromFiles;
}

loadDotEnvSettings(true);

function unquote(val?: string): string {
  if (!val) return '';
  const trimmed = val.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

export function getMailConfigFromEnv() {
  const fileEnv = loadDotEnvSettings();
  const readKey = (...keys: string[]): string => {
    for (const k of keys) {
      if (fileEnv[k] !== undefined && String(fileEnv[k]).trim() !== '') {
        return String(fileEnv[k]).trim();
      }
    }
    for (const k of keys) {
      if (process.env[k] !== undefined && String(process.env[k]).trim() !== '') {
        return String(process.env[k]).trim();
      }
    }
    return '';
  };

  const host = unquote(readKey('SMTP_HOST', 'MAIL_HOST', 'EMAIL_HOST'));
  const rawPort = unquote(readKey('SMTP_PORT', 'MAIL_PORT', 'EMAIL_PORT'));
  const port = parseInt(rawPort || '587', 10) || 587;
  const user = unquote(readKey('SMTP_USER', 'SMTP_USERNAME', 'MAIL_USER', 'MAIL_USERNAME', 'EMAIL_USER', 'EMAIL_USERNAME'));
  const pass = unquote(readKey('SMTP_PASS', 'SMTP_PASSWORD', 'MAIL_PASS', 'MAIL_PASSWORD', 'EMAIL_PASS', 'EMAIL_PASSWORD'));
  const from =
    readKey('SMTP_FROM', 'MAIL_FROM', 'EMAIL_FROM', 'FROM_EMAIL') ||
    (user ? `"BeSafe Network" <${user}>` : '"BeSafe Network" <noreply@besafe.network>');
  const service = unquote(readKey('SMTP_SERVICE', 'MAIL_SERVICE', 'EMAIL_SERVICE'));
  const rawSecure = unquote(readKey('SMTP_SECURE', 'MAIL_SECURE', 'EMAIL_SECURE', 'SMTP_TLS', 'MAIL_TLS')).toLowerCase();

  const secure =
    rawSecure === 'true' || rawSecure === '1' || rawSecure === 'yes' || rawSecure === 'ssl'
      ? true
      : rawSecure === 'false' || rawSecure === '0' || rawSecure === 'no' || rawSecure === 'starttls'
      ? false
      : port === 465;

  const rawRequireTls = unquote(readKey('SMTP_REQUIRE_TLS', 'MAIL_REQUIRE_TLS')).toLowerCase();
  const requireTLS =
    rawRequireTls === 'true' || rawRequireTls === '1'
      ? true
      : rawRequireTls === 'false' || rawRequireTls === '0'
      ? false
      : undefined;

  const rawIgnoreTls = unquote(readKey('SMTP_IGNORE_TLS', 'MAIL_IGNORE_TLS')).toLowerCase();
  const ignoreTLS = rawIgnoreTls === 'true' || rawIgnoreTls === '1';

  const rawRejectUnauthorized = unquote(readKey('SMTP_TLS_REJECT_UNAUTHORIZED', 'MAIL_TLS_REJECT_UNAUTHORIZED')).toLowerCase();
  const rejectUnauthorized =
    rawRejectUnauthorized === 'true' || rawRejectUnauthorized === '1'
      ? true
      : false;

  // Derive a clean FQDN for EHLO to prevent 10-20s reverse-DNS stalls on container hostnames
  const emailDomainMatch = (user || from).match(/@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  const ehloName =
    unquote(readKey('SMTP_EHLO_DOMAIN', 'SMTP_NAME', 'MAIL_EHLO_DOMAIN')) ||
    (emailDomainMatch ? emailDomainMatch[1] : '') ||
    host ||
    'besafe.network';

  return {
    host,
    port,
    secure,
    user,
    pass,
    from,
    service,
    requireTLS,
    ignoreTLS,
    rejectUnauthorized,
    ehloName,
  };
}

const initialMail = getMailConfigFromEnv();

export const config = {
  serviceName: (process.env.SERVICE_NAME || 'web-dashboard').toLowerCase(),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',

  // Ports
  port: parseInt(process.env.PORT || '3000', 10),
  vrchatBotPort: parseInt(process.env.VRCHAT_BOT_PORT || '3001', 10),
  discordBotPort: parseInt(process.env.DISCORD_BOT_PORT || '3002', 10),

  // Inter-service discovery URLs
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  dashboardSocketUrl: process.env.DASHBOARD_SOCKET_URL || process.env.APP_URL || 'http://localhost:3000',
  workerAuthToken: process.env.WORKER_AUTH_TOKEN || '',

  // Database
  mongoUri: process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/besafe',

  // Discord Credentials & Sharding
  discordToken: process.env.DISCORD_TOKEN || '',
  discordClientId: process.env.DISCORD_CLIENT_ID || '',
  discordShardingMode: process.env.DISCORD_SHARDING_MODE || 'stateful', // 'stateful' | 'manager' | 'single'
  shardId: process.env.SHARD_ID ? parseInt(process.env.SHARD_ID, 10) : undefined,
  shardCount: process.env.SHARD_COUNT || process.env.TOTAL_SHARDS
    ? parseInt((process.env.SHARD_COUNT || process.env.TOTAL_SHARDS)!, 10)
    : undefined,

  // VRChat Bot Partitioning / Sharding
  vrcInstanceId: parseInt(
    process.env.VRC_INSTANCE_ID ||
      process.env.POD_NAME?.match(/-(\d+)$/)?.[1] ||
      process.env.HOSTNAME?.match(/-(\d+)$/)?.[1] ||
      '0',
    10
  ),
  vrcTotalInstances: parseInt(process.env.VRC_TOTAL_INSTANCES || '1', 10),
  vrcDiscoveryHost: process.env.VRC_DISCOVERY_HOST || '',

  // Security & Auth
  jwtSecret: process.env.JWT_SECRET || 'besafe-jwt-super-secret-key-change-in-prod',
  apiKeySalt: process.env.API_KEY_SALT || 'besafe-key-salt-production',

  // Email (sourced from .env)
  smtpHost: initialMail.host,
  smtpPort: initialMail.port,
  smtpSecure: initialMail.secure,
  smtpUser: initialMail.user,
  smtpPass: initialMail.pass,
  smtpFrom: initialMail.from,
};
