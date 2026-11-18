import cryptoNode from 'crypto';
import type { Socket } from 'socket.io-client';
import {
  SystemConfig,
  Admin,
  Guild,
  User,
  UserVRChatGroup,
  BanCase,
  Log,
  VRChatAlertTracker,
  CustomBanlist,
  VRChatLinkRequest,
  getAllVRChatAccounts,
} from '../shared/models';
import { config as appConfig } from '../shared/config';
import { requestDashboardCommand } from '../shared/worker-client';

const verifiedCookiesCache = new Map<string, { verifiedAt: number; cookie: string }>();
const botLoginCooldowns = new Map<string, number>();
let lastStatusUpdateAt = 0;
let vrchatWorkerSocket: Socket | null = null;

export function setVRChatWorkerSocket(socket: Socket) {
  vrchatWorkerSocket = socket;
}

export async function requestVRChatDashboardCommand(command: string, payload: any = {}): Promise<any> {
  if (!vrchatWorkerSocket) throw new Error('VRChat worker is not connected to the dashboard');
  return requestDashboardCommand(vrchatWorkerSocket, command, payload);
}

export async function notifyVRChatGroupLogChannel(
  _groupId: string,
  _message: string,
  _specificGuildId?: string
): Promise<void> {
  // Disabled: silently ignore skipped/failed VRChat group operations without posting to Discord logs
  return;
}

export async function notifyVRChatGroupLogChannelOnce(
  _groupId: string,
  _vrchatUserId: string,
  _message: string
): Promise<void> {
  // Disabled: silently ignore skipped/failed VRChat group operations without posting to Discord logs
  return;
}

export async function fetch2FACode(
  apiUrl: string,
  apiToken: string,
  selectKey: string,
  fallbackUsername?: string
): Promise<string> {
  const cleanUrl = apiUrl.replace(/\/+$/, '');
  const url = `${cleanUrl}/api/v1/twofaccounts`;

  console.log(`[2FAuth API] Fetching accounts list from ${url}...`);
  const headers = {
    Authorization: `Bearer ${apiToken}`,
    Accept: 'application/json',
    'User-Agent': 'BeSafeDiscordBot/1.0.0 (ossscott40@gmail.com)',
  };

  const res = await fetch(url, { method: 'GET', headers });
  if (!res.ok) {
    throw new Error(`2FAuth API request failed with HTTP ${res.status}`);
  }

  const body: any = await res.json();
  const dataList = body.data || body;
  if (!Array.isArray(dataList)) {
    throw new Error('2FAuth API did not return a valid accounts list');
  }

  const getAttr = (obj: any, keys: string[]): any => {
    if (!obj) return undefined;
    for (const k of keys) {
      if (obj[k] !== undefined && obj[k] !== null) return obj[k];
      if (obj.attributes && obj.attributes[k] !== undefined && obj.attributes[k] !== null) return obj.attributes[k];
    }
    return undefined;
  };

  let account = null;
  if (selectKey && selectKey.trim()) {
    const matchKey = selectKey.trim().toLowerCase();
    account = dataList.find((item: any) => {
      const id = getAttr(item, ['id'])?.toString().trim().toLowerCase();
      const label = getAttr(item, ['label', 'name', 'title', 'service', 'account'])?.toString().trim().toLowerCase();
      return id === matchKey || label === matchKey;
    });
  }

  if (!account && fallbackUsername && fallbackUsername.trim()) {
    const cleanUsername = fallbackUsername.trim().toLowerCase();
    account = dataList.find((item: any) => {
      const label = getAttr(item, ['label', 'name', 'title', 'service', 'account'])?.toString().trim().toLowerCase() || '';
      return label.includes(cleanUsername) || cleanUsername.includes(label);
    });
  }

  if (!account) {
    account = dataList.find((item: any) => {
      const label = getAttr(item, ['label', 'name', 'title', 'service', 'account'])?.toString().trim().toLowerCase() || '';
      return label.includes('vrchat');
    });
  }

  if (!account) {
    throw new Error(`No matching account found in 2FAuth for selection: "${selectKey || fallbackUsername || 'VRChat'}"`);
  }

  const accountId = getAttr(account, ['id']);
  if (!accountId) {
    throw new Error(`Matching account found but did not contain a valid ID.`);
  }

  const label = getAttr(account, ['service', 'label', 'name', 'title', 'account']) || 'unnamed';
  const detailUrl = `${cleanUrl}/api/v1/twofaccounts/${accountId}`;

  const detailRes = await fetch(detailUrl, { method: 'GET', headers });
  if (!detailRes.ok) {
    throw new Error(`2FAuth API show request failed with HTTP ${detailRes.status}`);
  }

  const detailBody: any = await detailRes.json();
  const detailAccount = detailBody.data || detailBody;

  let code = getAttr(detailAccount, ['one_time_password', 'otp', 'otp_code', 'token', 'code']);

  if (!code) {
    const secret = getAttr(detailAccount, ['secret']);
    if (secret) {
      const digits = parseInt(getAttr(detailAccount, ['digits']) || '6', 10);
      const period = parseInt(getAttr(detailAccount, ['period']) || '30', 10);
      const algorithm = getAttr(detailAccount, ['algorithm']) || 'sha1';
      try {
        code = generateLocalTOTP(secret, period, digits, algorithm);
      } catch (err: any) {
        console.error(`[2FAuth API] Local TOTP calculation failed:`, err);
      }
    }
  }

  if (!code) {
    throw new Error(`Account "${label}" found, but did not contain active TOTP code or secret.`);
  }

  return code.toString().trim();
}

export function generateLocalTOTP(secretStr: string, period: number, digits: number, algorithm: string): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = secretStr.toUpperCase().replace(/[\s-]/g, '').replace(/=+$/, '');
  const length = clean.length;
  let bits = 0;
  let value = 0;
  let index = 0;
  const buffer = Buffer.alloc(Math.floor((length * 5) / 8));

  for (let i = 0; i < length; i++) {
    const val = alphabet.indexOf(clean[i]);
    if (val === -1) continue;
    value = (value << 5) | val;
    bits += 5;
    if (bits >= 8) {
      if (index < buffer.length) {
        buffer[index++] = (value >> (bits - 8)) & 255;
      }
      bits -= 8;
    }
  }

  const epoch = Math.floor(Date.now() / 1000);
  const counter = Math.floor(epoch / period);

  const counterBuffer = Buffer.alloc(8);
  let tmp = counter;
  for (let i = 7; i >= 0; i--) {
    counterBuffer[i] = tmp & 0xff;
    tmp >>= 8;
  }

  const hmac = cryptoNode.createHmac(algorithm.toLowerCase(), buffer);
  hmac.update(counterBuffer);
  const digest = hmac.digest();

  const offset = digest[digest.length - 1] & 0xf;
  const codeBin =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  const otp = codeBin % Math.pow(10, digits);
  return otp.toString().padStart(digits, '0');
}

export function getVRChatBots(config: any) {
  const list: any[] = [];
  if (config.vrchatUsername || config.vrchatCookie) {
    list.push({
      id: 'legacy',
      vrchatUsername: config.vrchatUsername || '',
      vrchatPassword: config.vrchatPassword || '',
      vrchatCookie: config.vrchatCookie || '',
      twoFactorAuthApiUrl: config.twoFactorAuthApiUrl || '',
      twoFactorAuthApiToken: config.twoFactorAuthApiToken || '',
      twoFactorAuthAccountId: config.twoFactorAuthAccountId || '',
      groupCount: config.vrchatBotGroupCount !== undefined ? config.vrchatBotGroupCount : config.vrchatGroupId ? 1 : 0,
      groups: config.vrchatBotGroups && config.vrchatBotGroups.length > 0 ? config.vrchatBotGroups : config.vrchatGroupId ? [config.vrchatGroupId] : [],
      status: config.vrchatBotStatus || 'idle',
      error: config.vrchatBotError || '',
    });
  }
  if (config.vrchatBots && config.vrchatBots.length > 0) {
    list.push(...config.vrchatBots);
  }
  return list;
}

export async function updateBotCookieInDb(botId: string, cookie: string) {
  if (botId === 'legacy') {
    await SystemConfig.findOneAndUpdate({ id: 'main' }, { vrchatCookie: cookie });
  } else {
    await SystemConfig.findOneAndUpdate(
      { id: 'main', 'vrchatBots.id': botId },
      { $set: { 'vrchatBots.$.vrchatCookie': cookie } }
    );
  }
}

export async function getVRChatAuthHeadersForBot(bot: any, config: any) {
  const headers: any = {
    'User-Agent': 'BeSafeDiscordBot/1.0.0 (ossscott40@gmail.com)',
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const apiKey = 'JlE5Jldo5Jibnk505hTx6XVqsJu4WJ26';
  const botKey = bot.id || bot.vrchatUsername || 'default';

  const cooldownUntil = botLoginCooldowns.get(botKey);
  if (cooldownUntil && Date.now() < cooldownUntil) {
    const remainingSeconds = Math.round((cooldownUntil - Date.now()) / 1000);
    if (bot.vrchatCookie && bot.vrchatCookie.trim()) {
      let cookieVal = bot.vrchatCookie.trim().replace(/^["']|["']$/g, '');
      if (cookieVal.includes('auth=')) {
        const match = cookieVal.match(/auth=(auth_[^;]+)/);
        cookieVal = match ? match[1] : cookieVal.replace(/auth=/, '');
      }
      headers['Cookie'] = `auth=${cookieVal}; apiKey=${apiKey}`;
      return { headers, apiKey };
    }
    throw new Error(`VRChat login rate-limiting cooldown active. Try again in ${remainingSeconds} seconds.`);
  }

  if (bot.vrchatCookie && bot.vrchatCookie.trim()) {
    let cookieVal = bot.vrchatCookie.trim().replace(/^["']|["']$/g, '');
    if (cookieVal.includes('auth=')) {
      const match = cookieVal.match(/auth=(auth_[^;]+)/);
      cookieVal = match ? match[1] : cookieVal.replace(/auth=/, '');
    }

    const cached = verifiedCookiesCache.get(botKey);
    const isCachedAndValid = cached && cached.cookie === cookieVal && Date.now() - cached.verifiedAt < 15 * 60 * 1000;

    if (isCachedAndValid) {
      headers['Cookie'] = `auth=${cookieVal}; apiKey=${apiKey}`;
      return { headers, apiKey };
    }

    const testCookieHeaders = { ...headers, Cookie: `auth=${cookieVal}; apiKey=${apiKey}` };
    if (bot.vrchatUsername && bot.vrchatPassword) {
      try {
        const testRes = await fetch(`https://api.vrchat.cloud/api/1/auth/user?apiKey=${apiKey}`, {
          method: 'GET',
          headers: testCookieHeaders,
        });
        if (testRes.status === 200 || testRes.status === 429) {
          verifiedCookiesCache.set(botKey, { verifiedAt: Date.now(), cookie: cookieVal });
          headers['Cookie'] = `auth=${cookieVal}; apiKey=${apiKey}`;
          return { headers, apiKey };
        } else {
          await updateBotCookieInDb(bot.id, '');
          bot.vrchatCookie = '';
        }
      } catch (err: any) {
        headers['Cookie'] = `auth=${cookieVal}; apiKey=${apiKey}`;
        return { headers, apiKey };
      }
    } else {
      headers['Cookie'] = `auth=${cookieVal}; apiKey=${apiKey}`;
      return { headers, apiKey };
    }
  }

  if (bot.vrchatUsername && bot.vrchatPassword) {
    const basicAuth = Buffer.from(`${bot.vrchatUsername}:${bot.vrchatPassword}`).toString('base64');
    const response = await fetch(`https://api.vrchat.cloud/api/1/auth/user?apiKey=${apiKey}`, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'User-Agent': headers['User-Agent'],
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        botLoginCooldowns.set(botKey, Date.now() + 15 * 60 * 1000);
      }
      throw new Error(`VRChat Auth Failed with HTTP ${response.status}`);
    }

    const userJson: any = await response.json();
    const setCookieHeaders = response.headers.getSetCookie
      ? response.headers.getSetCookie()
      : response.headers.get('set-cookie') ? [response.headers.get('set-cookie')!] : [];

    let authCookie = '';
    for (const cookie of setCookieHeaders) {
      if (cookie.includes('auth=')) {
        const match = cookie.match(/auth=([^;]+)/);
        if (match) {
          authCookie = match[1];
          break;
        }
      }
    }

    if (!authCookie) {
      throw new Error('Login succeeded but auth cookie was not returned.');
    }

    if (userJson.requiresTwoFactorAuth && userJson.requiresTwoFactorAuth.length > 0) {
      const apiUrl = bot.twoFactorAuthApiUrl || config.twoFactorAuthApiUrl;
      const apiToken = bot.twoFactorAuthApiToken || config.twoFactorAuthApiToken;
      const accountId = bot.twoFactorAuthAccountId || (bot.id === 'legacy' ? config.twoFactorAuthAccountId : '');

      if (apiUrl && apiToken) {
        const totpCode = await fetch2FACode(apiUrl, apiToken, accountId, bot.vrchatUsername);
        const verifyRes = await fetch(`https://api.vrchat.cloud/api/1/auth/twofactorauth/totp/verify?apiKey=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `auth=${authCookie}; apiKey=${apiKey}`,
            'User-Agent': headers['User-Agent'],
          },
          body: JSON.stringify({ code: totpCode }),
        });

        if (!verifyRes.ok) {
          throw new Error(`VRChat 2FA verification failed with status ${verifyRes.status}`);
        }

        const verifySetCookieHeaders = verifyRes.headers.getSetCookie
          ? verifyRes.headers.getSetCookie()
          : verifyRes.headers.get('set-cookie') ? [verifyRes.headers.get('set-cookie')!] : [];

        let activeAuthCookie = authCookie;
        for (const cookie of verifySetCookieHeaders) {
          if (cookie.includes('auth=')) {
            const match = cookie.match(/auth=([^;]+)/);
            if (match) {
              activeAuthCookie = match[1];
              break;
            }
          }
        }

        headers['Cookie'] = `auth=${activeAuthCookie}; apiKey=${apiKey}`;
        await updateBotCookieInDb(bot.id, activeAuthCookie);
        verifiedCookiesCache.set(botKey, { verifiedAt: Date.now(), cookie: activeAuthCookie });
        return { headers, apiKey };
      } else {
        throw new Error('VRChat login requires 2FA, but no 2FAuth API credentials are configured.');
      }
    }

    headers['Cookie'] = `auth=${authCookie}; apiKey=${apiKey}`;
    await updateBotCookieInDb(bot.id, authCookie);
    verifiedCookiesCache.set(botKey, { verifiedAt: Date.now(), cookie: authCookie });
    return { headers, apiKey };
  }

  throw new Error('VRChat credentials or active auth cookie missing for: ' + bot.vrchatUsername);
}

export async function getVRChatAuthHeaders(config: any) {
  const bots = getVRChatBots(config);
  if (bots.length === 0) {
    throw new Error('No VRChat bots configured');
  }
  return getVRChatAuthHeadersForBot(bots[0], config);
}

export async function removeGroupFromBotDb(botId: string, groupId: string) {
  try {
    if (botId === 'legacy') {
      await SystemConfig.findOneAndUpdate(
        { id: 'main' },
        {
          $pull: { vrchatBotGroups: groupId },
          $inc: { vrchatBotGroupCount: -1 },
        }
      );
    } else {
      await SystemConfig.findOneAndUpdate(
        { id: 'main', 'vrchatBots.id': botId },
        {
          $pull: { 'vrchatBots.$.groups': groupId },
          $inc: { 'vrchatBots.$.groupCount': -1 },
        }
      );
    }
  } catch (e) {}
}

export async function getBotForGroup(configPassed: any, groupId: string): Promise<any> {
  const config = (await SystemConfig.findOne({ id: 'main' })) || configPassed;
  const bots = getVRChatBots(config);
  if (bots.length === 0) {
    throw new Error('No VRChat bot accounts configured.');
  }

  for (const bot of bots) {
    if (bot.groups && bot.groups.includes(groupId)) {
      return bot;
    }
  }

  const availableBots = bots.filter((b: any) => (b.groupCount || 0) < 95);
  if (availableBots.length === 0) {
    throw new Error('All VRChat bot accounts are full (limit 95 groups each).');
  }

  availableBots.sort((a: any, b: any) => (a.groupCount || 0) - (b.groupCount || 0));
  const selectedBot = availableBots[0];

  let joinedSuccess = false;
  try {
    const { headers, apiKey } = await getVRChatAuthHeadersForBot(selectedBot, config);
    const joinRes = await fetch(`https://api.vrchat.cloud/api/1/groups/${groupId}/join?apiKey=${apiKey}`, {
      method: 'POST',
      headers,
    });
    if (joinRes.ok) {
      joinedSuccess = true;
    } else {
      const errText = await joinRes.text();
      if (errText.toLowerCase().includes('already') || errText.toLowerCase().includes('member')) {
        joinedSuccess = true;
      }
    }
  } catch (joinErr: any) {}

  if (joinedSuccess) {
    if (selectedBot.id === 'legacy') {
      await SystemConfig.findOneAndUpdate(
        { id: 'main' },
        {
          $addToSet: { vrchatBotGroups: groupId },
          $inc: { vrchatBotGroupCount: 1 },
        }
      );
    } else {
      await SystemConfig.findOneAndUpdate(
        { id: 'main', 'vrchatBots.id': selectedBot.id },
        {
          $addToSet: { 'vrchatBots.$.groups': groupId },
          $inc: { 'vrchatBots.$.groupCount': 1 },
        }
      );
    }
  } else {
    throw new Error(`Failed to join VRChat Group ${groupId} with bot ${selectedBot.vrchatUsername}.`);
  }

  return selectedBot;
}

export async function leaveVRChatGroupIfOrphaned(groupId: string) {
  const targetGroupId = groupId.trim();
  if (!targetGroupId) return;

  const activeGuild = await Guild.findOne({
    'settings.vrchatBotEnabled': true,
    'settings.vrchatGroupId': targetGroupId,
  });
  if (activeGuild) return;

  const config = await SystemConfig.findOne({ id: 'main' });
  if (!config) return;

  const assignedBot = getVRChatBots(config).find((bot: any) => bot.groups?.includes(targetGroupId));
  if (!assignedBot) return;

  try {
    const { headers, apiKey } = await getVRChatAuthHeadersForBot(assignedBot, config);
    await fetch(`https://api.vrchat.cloud/api/1/groups/${targetGroupId}/leave?apiKey=${apiKey}`, {
      method: 'DELETE',
      headers,
    });
  } catch (error: any) {
    console.warn(`[VRChat] Failed to leave orphaned group ${targetGroupId}:`, error?.message || error);
  }

  await removeGroupFromBotDb(assignedBot.id, targetGroupId);
}

export const knownGroupBansCache = new Map<string, Set<string>>();

export function markUserBannedInGroupCache(groupId: string, vrchatUserId: string) {
  const gKey = (groupId || '').trim();
  const uKey = (vrchatUserId || '').trim().toLowerCase();
  if (!gKey || !uKey) return;
  let set = knownGroupBansCache.get(gKey);
  if (!set) {
    set = new Set<string>();
    knownGroupBansCache.set(gKey, set);
  }
  set.add(uKey);
}

export function clearUserBannedInGroupCache(groupId: string, vrchatUserId: string) {
  const gKey = (groupId || '').trim();
  const uKey = (vrchatUserId || '').trim().toLowerCase();
  if (!gKey || !uKey) return;
  knownGroupBansCache.get(gKey)?.delete(uKey);
}

export async function checkIfUserIsBannedInVRChatGroup(
  vrchatUserId: string,
  groupId: string,
  headers: any,
  apiKey: string,
  bot: any
): Promise<boolean> {
  const cachedSet = knownGroupBansCache.get((groupId || '').trim());
  if (cachedSet && cachedSet.has(vrchatUserId.toLowerCase())) {
    return true;
  }

  try {
    const response = await fetch(`https://api.vrchat.cloud/api/1/groups/${groupId}/bans?apiKey=${apiKey}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      if (response.status === 403) {
        const errText = await response.text().catch(() => '');
        if (errText.includes('not a member') || errText.includes('Not a member')) {
          await removeGroupFromBotDb(bot.id, groupId);
        }
      }
      return false;
    }

    const bans = (await response.json()) as any[];
    if (!Array.isArray(bans)) return false;

    for (const b of bans) {
      const uId = b.userId || b.bannedUserId || b.id;
      if (uId) {
        markUserBannedInGroupCache(groupId, uId.toString());
      }
    }

    return bans.some((b: any) => {
      const uId = b.userId || b.bannedUserId || b.id;
      return uId && uId.toString().toLowerCase() === vrchatUserId.toLowerCase();
    });
  } catch (err: any) {
    return false;
  }
}

export async function banUserFromSpecificVRChatGroup(
  vrchatUserId: string,
  groupId: string,
  reason: string,
  headers: any,
  apiKey: string,
  bot: any
) {
  const cachedSet = knownGroupBansCache.get((groupId || '').trim());
  if (cachedSet && cachedSet.has(vrchatUserId.toLowerCase())) {
    return false;
  }

  try {
    const response = await fetch(`https://api.vrchat.cloud/api/1/groups/${groupId}/bans?apiKey=${apiKey}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ userId: vrchatUserId, reason }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      const errLower = errText.toLowerCase();
      if (errLower.includes('already banned')) {
        markUserBannedInGroupCache(groupId, vrchatUserId);
        return false;
      }
      if (response.status === 403 && errLower.includes('not a member')) {
        if (bot && bot.id) {
          await removeGroupFromBotDb(bot.id, groupId);
        }
      }
      // Silently ignore and skip
      return false;
    }

    markUserBannedInGroupCache(groupId, vrchatUserId);
    return true;
  } catch (e: any) {
    // Silently ignore and skip
    return false;
  }
}

export async function banUserFromVRChatGroup(
  vrchatUserId: string,
  reason: string,
  isCustomList = false,
  customListId?: string
) {
  const result = await banUserFromVRChatGroupDetailed(vrchatUserId, reason, isCustomList, customListId);
  return result.success;
}

export async function banUserFromVRChatGroupDetailed(
  vrchatUserId: string,
  reason: string,
  isCustomList = false,
  customListId?: string
): Promise<{ success: boolean; bannedGroups: string[] }> {
  try {
    const config = await SystemConfig.findOne({ id: 'main' });
    if (!config) return { success: true, bannedGroups: [] };

    const activeGuilds = await Guild.find({ 'settings.vrchatBotEnabled': true });
    if (activeGuilds.length === 0) return { success: true, bannedGroups: [] };

    const bannedGroups: string[] = [];

    for (const guild of activeGuilds) {
      const selectionMode = guild.settings?.banlistSelectionMode || 'global';
      if (!isCustomList && selectionMode === 'custom') continue;
      if (isCustomList && selectionMode === 'global') continue;
      if (isCustomList && customListId && guild.settings?.customBanlistId !== customListId) continue;

      const groupId = guild.settings?.vrchatGroupId?.trim();
      if (!groupId) continue;

      const autoBanEnabled = guild.settings?.vrchatAutoBanEnabled !== false;
      if (!autoBanEnabled) continue;

      let bot;
      try {
        bot = await getBotForGroup(config, groupId);
      } catch (botErr: any) {
        continue;
      }

      try {
        const { headers, apiKey } = await getVRChatAuthHeadersForBot(bot, config);
        const isAlreadyBanned = await checkIfUserIsBannedInVRChatGroup(vrchatUserId, groupId, headers, apiKey, bot);
        if (isAlreadyBanned) continue;

        const response = await fetch(`https://api.vrchat.cloud/api/1/groups/${groupId}/bans?apiKey=${apiKey}`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ userId: vrchatUserId, reason }),
        });

        await new Promise((resolve) => setTimeout(resolve, 1500));

        if (!response.ok) {
          const errText = await response.text().catch(() => '');
          const errLower = errText.toLowerCase();
          if (errLower.includes('already banned')) {
            markUserBannedInGroupCache(groupId, vrchatUserId);
            continue;
          }
          if (response.status === 403 && errLower.includes('not a member')) {
            if (bot && bot.id) {
              await removeGroupFromBotDb(bot.id, groupId);
            }
          }
          continue;
        } else {
          markUserBannedInGroupCache(groupId, vrchatUserId);
          bannedGroups.push(groupId);
        }
      } catch (err: any) {
        continue;
      }
    }

    return { success: true, bannedGroups };
  } catch (e: any) {
    return { success: true, bannedGroups: [] };
  }
}

export async function unbanUserFromVRChatGroup(vrchatUserId: string, _isSecondaryCheck = false) {
  try {
    const config = await SystemConfig.findOne({ id: 'main' });
    if (!config) return true;

    const groupMap = new Map<string, { guildName?: string; autoUnbanEnabled?: boolean }>();

    if (config.vrchatGroupId && config.vrchatGroupId.trim()) {
      groupMap.set(config.vrchatGroupId.trim(), { guildName: 'System Default' });
    }

    if (Array.isArray(config.vrchatBots)) {
      for (const bot of config.vrchatBots) {
        if (Array.isArray(bot.groups)) {
          for (const g of bot.groups) {
            if (g && typeof g === 'string' && g.trim()) {
              groupMap.set(g.trim(), { guildName: bot.vrchatUsername || 'Bot Assigned Group' });
            }
          }
        }
      }
    }

    const allGuilds = await Guild.find({
      $or: [
        { 'settings.vrchatGroupId': { $exists: true, $ne: '' } },
        { 'settings.vrchatBotEnabled': true },
      ],
    });

    for (const g of allGuilds) {
      const gid = g.settings?.vrchatGroupId?.trim();
      if (gid) {
        groupMap.set(gid, {
          guildName: g.name || g.id,
          autoUnbanEnabled: g.settings?.autoUnbanVRChatEnabled !== false,
        });
      }
    }

    const userUnbanGroups = await UserVRChatGroup.find({ autoUnbanEnabled: true });
    for (const ug of userUnbanGroups) {
      if (ug.groupId?.trim()) {
        groupMap.set(ug.groupId.trim(), {
          guildName: ug.groupName || 'User VRChat Group',
          autoUnbanEnabled: true,
        });
      }
    }

    if (groupMap.size === 0) return true;

    for (const [groupId, meta] of groupMap.entries()) {
      clearUserBannedInGroupCache(groupId, vrchatUserId);
      if (meta.autoUnbanEnabled === false) continue;

      let bot;
      try {
        bot = await getBotForGroup(config, groupId);
      } catch (botErr: any) {
        continue;
      }

      try {
        const { headers, apiKey } = await getVRChatAuthHeadersForBot(bot, config);
        const response = await fetch(
          `https://api.vrchat.cloud/api/1/groups/${groupId}/bans/${vrchatUserId}?apiKey=${apiKey}`,
          {
            method: 'DELETE',
            headers,
          }
        );

        await new Promise((resolve) => setTimeout(resolve, 1200));

        if (!response.ok) {
          const errText = await response.text().catch(() => '');
          const errLower = errText.toLowerCase();
          if (response.status === 403 && errLower.includes('not a member')) {
            if (bot && bot.id) {
              await removeGroupFromBotDb(bot.id, groupId);
            }
          }
          continue;
        }
      } catch (error: any) {
        continue;
      }
    }

    return true;
  } catch (e: any) {
    console.warn(`[VRChat Unban] Unexpected error unbanning ${vrchatUserId}:`, e?.message || e);
    return true;
  }
}

export async function fetchVRChatDisplayName(vrchatUserId: string): Promise<string | null> {
  try {
    const config = await SystemConfig.findOne({ id: 'main' });
    if (!config) return null;
    let { headers, apiKey } = await getVRChatAuthHeaders(config);
    const response = await fetch(`https://api.vrchat.cloud/api/1/users/${vrchatUserId}?apiKey=${apiKey}`, {
      method: 'GET',
      headers,
    });
    if (response.ok) {
      const data = await response.json();
      return data.displayName || data.username || null;
    }
    return null;
  } catch (err: any) {
    return null;
  }
}

export async function resolveVRChatUserBySearch(searchQuery: string): Promise<{ vrchatUserId: string; vrchatUsername: string } | null> {
  const query = searchQuery.trim();
  if (!query) return null;

  try {
    const config = await SystemConfig.findOne({ id: 'main' });
    if (!config) return null;

    const { headers, apiKey } = await getVRChatAuthHeaders(config);
    const response = await fetch(
      `https://api.vrchat.cloud/api/1/users?search=${encodeURIComponent(query)}&n=5&apiKey=${apiKey}`,
      { headers },
    );
    if (!response.ok) return null;

    const results = await response.json() as any[];
    if (!Array.isArray(results) || results.length === 0) return null;

    const normalizedQuery = query.toLowerCase();
    const match = results.find((user: any) =>
      user.displayName?.toLowerCase() === normalizedQuery ||
      user.username?.toLowerCase() === normalizedQuery ||
      user.id?.toLowerCase() === normalizedQuery
    ) || results[0];

    return match?.id
      ? { vrchatUserId: match.id, vrchatUsername: match.displayName || match.username || query }
      : null;
  } catch {
    return null;
  }
}

async function fetchVRChatUserFriends(vrchatUserId: string, headers: any, apiKey: string): Promise<any[]> {
  const friends: any[] = [];
  for (let offset = 0; offset < 500; offset += 100) {
    const res = await fetch(`https://api.vrchat.cloud/api/1/users/${vrchatUserId}/friends?n=100&offset=${offset}&apiKey=${apiKey}`, { headers });
    if (!res.ok) break;
    const page = (await res.json()) as any[];
    if (!Array.isArray(page) || page.length === 0) break;
    friends.push(...page);
    if (page.length < 100) break;
  }
  return friends;
}

async function fetchVRChatMutualGroups(vrchatUserId: string, headers: any, apiKey: string): Promise<any[]> {
  try {
    const res = await fetch(`https://api.vrchat.cloud/api/1/users/${vrchatUserId}/mutuals/groups?n=100&apiKey=${apiKey}`, { headers });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export interface VRChatMutualsCheckResult {
  vrchatUserId: string;
  displayName: string | null;
  friendCount: number;
  mutualGroupCount: number;
  mutualGroupNames: string[];
  blacklistedFriends: Array<{ vrchatUserId: string; displayName: string; reason: string }>;
  checkedAt: string;
}

export async function runVRChatMutualsCheck(
  vrchatUserId: string,
  options: { groupId?: string; guildId?: string } = {}
): Promise<VRChatMutualsCheckResult> {
  const cleanId = String(vrchatUserId || '').trim();
  if (!cleanId.startsWith('usr_')) throw new Error('A valid VRChat user ID (usr_...) is required');

  const config = await SystemConfig.findOne({ id: 'main' });
  if (!config) throw new Error('System config not found');

  let bot: any = null;
  if (options.groupId?.trim()) {
    bot = await getBotForGroup(config, options.groupId.trim()).catch(() => null);
  }
  if (!bot) {
    const bots = getVRChatBots(config);
    bot = bots[0] || null;
  }
  if (!bot) throw new Error('No VRChat bot account is configured');

  const { headers, apiKey } = await getVRChatAuthHeadersForBot(bot, config);

  // Resolve target profile
  let displayName: string | null = null;
  try {
    const userRes = await fetch(`https://api.vrchat.cloud/api/1/users/${cleanId}?apiKey=${apiKey}`, { headers });
    if (userRes.ok) {
      const u: any = await userRes.json();
      displayName = u.displayName || u.username || null;
    }
  } catch {}

  // Build the blacklist relevant to this check (guild-scoped when provided)
  let guild: any = null;
  if (options.guildId) {
    guild = await Guild.findOne({ id: options.guildId }).catch(() => null);
  }
  const banReasons = new Map<string, string>();
  const mode = guild?.settings?.banlistSelectionMode || 'global';

  if (mode === 'global' || mode === 'both') {
    const activeCases = await BanCase.find({ status: 'active' }).catch(() => []);
    for (const bCase of activeCases) {
      for (const va of bCase.vrchatAccounts || []) {
        const id = String(va?.vrchatUserId || '').trim();
        if (id.startsWith('usr_') && !banReasons.has(id)) {
          banReasons.set(id, `Global ban case #${bCase.caseNumber}: ${bCase.reason || 'Blacklisted'}`);
        }
      }
    }
  }
  if (guild && (mode === 'custom' || mode === 'both') && guild.settings?.customBanlistId) {
    const list = await CustomBanlist.findById(guild.settings.customBanlistId).catch(() => null);
    if (list) {
      for (const entry of list.entries || []) {
        const id = String(entry?.targetId || '').trim();
        if (entry?.type === 'vrchat' && id.startsWith('usr_') && !banReasons.has(id)) {
          banReasons.set(id, `Custom banlist "${list.name}": ${entry.reason || 'Blacklisted'}`);
        }
      }
    }
  }

  // Trusted users are never treated as blacklisted
  if (banReasons.size > 0) {
    const ids = [...banReasons.keys()];
    const trusted = await User.find({
      isTrusted: true,
      $or: [{ vrchatUserId: { $in: ids } }, { 'vrchatAlts.vrchatUserId': { $in: ids } }],
    }).select('vrchatUserId vrchatAlts').lean().catch(() => []);
    for (const t of trusted as any[]) {
      const allIds = [t.vrchatUserId, ...(t.vrchatAlts || []).map((a: any) => a.vrchatUserId)].filter(Boolean);
      for (const id of allIds) banReasons.delete(String(id));
    }
  }

  const [friends, mutualGroups] = await Promise.all([
    fetchVRChatUserFriends(cleanId, headers, apiKey).catch(() => [] as any[]),
    fetchVRChatMutualGroups(cleanId, headers, apiKey),
  ]);

  const blacklistedFriends = friends
    .map((f: any) => {
      const id = String(f?.id || f?.userId || '').trim();
      const reason = banReasons.get(id);
      if (!reason) return null;
      return { vrchatUserId: id, displayName: f.displayName || f.username || id, reason };
    })
    .filter(Boolean) as Array<{ vrchatUserId: string; displayName: string; reason: string }>;

  const mutualGroupNames = mutualGroups
    .map((g: any) => String(g?.name || g?.groupName || ''))
    .filter(Boolean)
    .slice(0, 10);

  return {
    vrchatUserId: cleanId,
    displayName,
    friendCount: friends.length,
    mutualGroupCount: mutualGroups.length,
    mutualGroupNames,
    blacklistedFriends,
    checkedAt: new Date().toISOString(),
  };
}

export interface VRChatUserProfileInfo {
  vrchatUserId: string;
  displayName: string | null;
  username: string | null;
  bio: string;
  tags: string[];
  ageVerified: boolean;
}

export async function getVRChatUserProfileInfo(vrchatUserId: string): Promise<VRChatUserProfileInfo | null> {
  const cleanId = String(vrchatUserId || '').trim();
  if (!cleanId.startsWith('usr_')) return null;
  try {
    const config = await SystemConfig.findOne({ id: 'main' });
    if (!config) return null;
    const { headers, apiKey } = await getVRChatAuthHeaders(config);
    const res = await fetch(`https://api.vrchat.cloud/api/1/users/${cleanId}?apiKey=${apiKey}`, { headers });
    if (!res.ok) return null;
    const u: any = await res.json();
    const bio = String(u.bio || '');
    // Some VRChat clients/profiles surface the bio under alternate fields — capture them all
    const altBio = [u.bioDescription, u.about, u.description, u.statusDescription]
      .filter((v: any) => typeof v === 'string' && v.trim())
      .join('\n');
    return {
      vrchatUserId: cleanId,
      displayName: u.displayName || u.username || null,
      username: u.username || null,
      bio: bio + (altBio ? `\n${altBio}` : ''),
      tags: Array.isArray(u.tags) ? u.tags.map(String) : [],
      ageVerified: u.ageVerified === true || (Array.isArray(u.tags) && u.tags.includes('system_age_verified')),
    };
  } catch {
    return null;
  }
}

export async function getVRChatFriendStatus(vrchatUserId: string): Promise<{ isFriend: boolean; outgoingRequest: boolean; incomingRequest: boolean } | null> {
  const cleanId = String(vrchatUserId || '').trim();
  if (!cleanId.startsWith('usr_')) return null;
  try {
    const config = await SystemConfig.findOne({ id: 'main' });
    if (!config) return null;
    const { headers, apiKey } = await getVRChatAuthHeaders(config);
    const res = await fetch(`https://api.vrchat.cloud/api/1/user/${cleanId}/friendStatus?apiKey=${apiKey}`, { headers });
    if (!res.ok) return null;
    const data: any = await res.json();
    return {
      isFriend: data?.isFriend === true,
      outgoingRequest: data?.outgoingRequest === true,
      incomingRequest: data?.incomingRequest === true,
    };
  } catch {
    return null;
  }
}

export async function sendVRChatFriendRequest(vrchatUserId: string): Promise<{ sent: boolean; alreadyFriends: boolean; alreadyRequested: boolean; error?: string }> {
  const cleanId = String(vrchatUserId || '').trim();
  if (!cleanId.startsWith('usr_')) return { sent: false, alreadyFriends: false, alreadyRequested: false, error: 'Invalid VRChat user ID' };
  try {
    const config = await SystemConfig.findOne({ id: 'main' });
    if (!config) return { sent: false, alreadyFriends: false, alreadyRequested: false, error: 'System config not found' };
    const { headers, apiKey } = await getVRChatAuthHeaders(config);

    const status = await getVRChatFriendStatus(cleanId);
    if (status?.isFriend) return { sent: false, alreadyFriends: true, alreadyRequested: false };
    if (status?.outgoingRequest) return { sent: false, alreadyFriends: false, alreadyRequested: true };

    const res = await fetch(`https://api.vrchat.cloud/api/1/user/${cleanId}/friendRequest?apiKey=${apiKey}`, {
      method: 'POST',
      headers,
    });
    if (res.ok) return { sent: true, alreadyFriends: false, alreadyRequested: false };
    const errText = await res.text().catch(() => '');
    if (res.status === 400 && /already/i.test(errText)) {
      return { sent: false, alreadyFriends: false, alreadyRequested: true };
    }
    return { sent: false, alreadyFriends: false, alreadyRequested: false, error: `HTTP ${res.status}: ${errText.slice(0, 120)}` };
  } catch (e: any) {
    return { sent: false, alreadyFriends: false, alreadyRequested: false, error: e?.message || 'Friend request failed' };
  }
}

export async function isVRChatAgeVerified(vrchatUserId: string): Promise<boolean> {
  const profile = await getVRChatUserProfileInfo(vrchatUserId);
  return profile?.ageVerified === true;
}

export async function syncVRChatAgeVerifiedFlag(vrchatUserId: string): Promise<boolean> {
  const verified = await isVRChatAgeVerified(vrchatUserId);
  if (!verified) return false;
  const cleanId = String(vrchatUserId || '').trim();
  await User.updateOne(
    { $or: [{ vrchatUserId: cleanId }, { 'vrchatAlts.vrchatUserId': cleanId }] },
    { $set: { isAgeVerified: true, vrchatAgeVerified: true, ageVerifiedAt: new Date(), updatedAt: new Date() } }
  ).catch(() => null);
  return true;
}

export async function completeVRChatLinkRequest(options: {
  discordUserId?: string;
  adminId?: string;
  requestId?: string;
}): Promise<{
  success: boolean;
  reason?: 'no-request' | 'expired' | 'completed' | 'not-friends' | 'bio-missing' | 'vrchat-error';
  vrchatUserId?: string;
  vrchatUsername?: string;
  ageVerified?: boolean;
  message?: string;
}> {
  const discordId = String(options.discordUserId || '').trim();
  const adminId = String(options.adminId || '').trim();
  const requestId = String(options.requestId || '').trim();
  if (!discordId && !adminId && !requestId) {
    return { success: false, reason: 'no-request', message: 'Missing link identifier' };
  }

  let linkReq: any = null;
  if (requestId) {
    linkReq = await VRChatLinkRequest.findById(requestId).catch(() => null);
    if (linkReq && linkReq.status !== 'pending') {
      return { success: false, reason: 'completed', message: 'This link request was already ' + linkReq.status + '.' };
    }
  }
  if (!linkReq) {
    const query: any = { status: 'pending' };
    if (discordId) query.discordUserId = discordId;
    else if (adminId) query.adminId = adminId;
    linkReq = await VRChatLinkRequest.findOne(query).sort({ createdAt: -1 }).catch(() => null);
  }
  if (!linkReq) {
    return { success: false, reason: 'no-request', message: 'No pending VRChat link request found. Start a new link request first.' };
  }
  if (linkReq.expiresAt && linkReq.expiresAt.getTime() < Date.now()) {
    linkReq.status = 'expired';
    linkReq.updatedAt = new Date();
    await linkReq.save().catch(() => null);
    return { success: false, reason: 'expired', message: 'This link request has expired. Start a new one.' };
  }

  const targetId = linkReq.vrchatUserId;
  const [friendStatus, profile] = await Promise.all([
    getVRChatFriendStatus(targetId),
    getVRChatUserProfileInfo(targetId),
  ]);
  if (!friendStatus || !profile) {
    return { success: false, reason: 'vrchat-error', message: 'Could not reach VRChat to verify the link. Try again shortly.' };
  }

  if (!friendStatus.isFriend) {
    return {
      success: false,
      reason: 'not-friends',
      vrchatUserId: targetId,
      vrchatUsername: linkReq.vrchatUsername,
      message: friendStatus.outgoingRequest
        ? 'Friend request still pending — please accept it in VRChat, add the code to your bio, then verify again.'
        : 'You must be friends with the BeSafe bot on VRChat to verify. Accept the friend request first.',
    };
  }

  let bioOk = profile.bio.toUpperCase().includes(String(linkReq.code).toUpperCase());
  if (!bioOk) {
    // VRChat profile data is cached — a freshly edited bio can take a few seconds
    // to propagate through the API. Wait briefly and re-fetch once before failing.
    await new Promise((r) => setTimeout(r, 4000));
    const refreshed = await getVRChatUserProfileInfo(targetId).catch(() => null);
    if (refreshed) {
      profile.bio = refreshed.bio || profile.bio;
      profile.displayName = refreshed.displayName || profile.displayName;
      profile.username = refreshed.username || profile.username;
      profile.ageVerified = profile.ageVerified || refreshed.ageVerified;
      bioOk = profile.bio.toUpperCase().includes(String(linkReq.code).toUpperCase());
    }
  }
  if (!bioOk) {
    console.log(`[VRChat Link] Bio check failed for ${targetId}: bio length=${profile.bio.length}, code=${linkReq.code}`);
    return {
      success: false,
      reason: 'bio-missing',
      vrchatUserId: targetId,
      vrchatUsername: profile.displayName || linkReq.vrchatUsername,
      message: `Add the code \`${linkReq.code}\` to your VRChat bio, then verify again. *(Bio changes can take a minute to appear — if you just added it, wait a moment and try again.)*`,
    };
  }

  // Verified — link the account
  const displayName = profile.displayName || profile.username || linkReq.vrchatUsername || '';
  const reqDiscordId = String(linkReq.discordUserId || discordId || '').trim();
  const reqAdminId = String(linkReq.adminId || adminId || '').trim();

  if (reqDiscordId) {
    await User.findOneAndUpdate(
      { id: reqDiscordId },
      {
        $set: {
          vrchatUserId: targetId,
          vrchatUsername: displayName,
          vrchatAgeVerified: profile.ageVerified === true,
          updatedAt: new Date(),
        },
        $setOnInsert: { id: reqDiscordId, username: '', reputation: 0, warnings: [] },
      },
      { upsert: true }
    ).catch(() => null);

    // Ensure no other Discord account claims this VRChat ID
    await User.updateMany(
      { vrchatUserId: targetId, id: { $ne: reqDiscordId } },
      { $set: { vrchatUserId: '', vrchatUsername: '' } }
    ).catch(() => null);
  }

  if (reqAdminId) {
    const adminUpdate: any = {
      $set: {
        vrchatUserId: targetId,
        vrchatUsername: displayName,
        vrchatAgeVerified: profile.ageVerified === true,
        updatedAt: new Date(),
      },
    };
    if (profile.ageVerified) {
      adminUpdate.$set.isAgeVerified = true;
      adminUpdate.$set.ageVerifiedAt = new Date();
    }
    await Admin.findByIdAndUpdate(reqAdminId, adminUpdate).catch(() => null);
    // If the admin also has a linked Discord ID, mirror the VRChat link onto the User doc
    const adminDoc = await Admin.findById(reqAdminId).select('discordId').catch(() => null);
    if (adminDoc?.discordId) {
      await User.findOneAndUpdate(
        { id: adminDoc.discordId },
        { $set: { vrchatUserId: targetId, vrchatUsername: displayName, updatedAt: new Date() } }
      ).catch(() => null);
    }
  }

  // Auto-sync age verification flag from VRChat system tag
  const ageVerified = profile.ageVerified === true || (await syncVRChatAgeVerifiedFlag(targetId));

  linkReq.status = 'completed';
  linkReq.updatedAt = new Date();
  await linkReq.save().catch(() => null);
  const cancelQuery: any = { status: 'pending', _id: { $ne: linkReq._id } };
  if (reqDiscordId) cancelQuery.discordUserId = reqDiscordId;
  else if (reqAdminId) cancelQuery.adminId = reqAdminId;
  await VRChatLinkRequest.updateMany(cancelQuery, { $set: { status: 'cancelled', updatedAt: new Date() } }).catch(() => null);

  await new Log({
    action: 'VRCHAT_ACCOUNT_LINKED',
    adminId: reqDiscordId || reqAdminId || 'unknown',
    targetId: reqDiscordId || reqAdminId || 'unknown',
    details: `Verified VRChat link for ${displayName} (${targetId}).${reqAdminId ? ' Via web dashboard.' : ''} Age verified via VRChat tag: ${ageVerified}.`,
  }).save().catch(() => null);

  return {
    success: true,
    vrchatUserId: targetId,
    vrchatUsername: displayName,
    ageVerified,
    message: `Linked **${displayName}** (\`${targetId}\`)${ageVerified ? ' — 🎂 age verification synced from VRChat' : ''}`,
  };
}

export async function syncAllVRChatBots(config: any) {
  if (!config) return;
  const bots = getVRChatBots(config);
  if (bots.length === 0) return;

  for (const bot of bots) {
    try {
      const { headers, apiKey } = await getVRChatAuthHeadersForBot(bot, config);
      const authRes = await fetch(`https://api.vrchat.cloud/api/1/auth/user?apiKey=${apiKey}`, {
        method: 'GET',
        headers,
      });

      if (!authRes.ok) throw new Error(`Profile fetch failed: ${authRes.status}`);

      const currentUser = await authRes.json();
      const userId = currentUser.id;
      if (!userId) throw new Error('No userId in response');

      const groupsRes = await fetch(`https://api.vrchat.cloud/api/1/users/${userId}/groups?apiKey=${apiKey}`, {
        method: 'GET',
        headers,
      });

      if (!groupsRes.ok) throw new Error(`Failed to fetch groups: ${groupsRes.status}`);

      const groupsData = (await groupsRes.json()) as any[];
      if (!Array.isArray(groupsData)) throw new Error('Groups is not array');

      const groupIds = groupsData
        .map((g: any) => {
          const candidate = g.groupId || g.id;
          if (candidate && candidate.startsWith('gmem_') && g.groupId) return g.groupId;
          return candidate;
        })
        .filter((id: string) => id && id.startsWith('grp_'));

      if (bot.id === 'legacy') {
        await SystemConfig.findOneAndUpdate(
          { id: 'main' },
          {
            $set: {
              vrchatGroupId: groupIds[0] || config.vrchatGroupId || '',
              vrchatBotGroups: groupIds,
              vrchatBotGroupCount: groupIds.length,
              vrchatBotStatus: 'active',
              vrchatBotError: '',
              vrchatBotLastCheckedAt: new Date(),
            },
          }
        );
      } else {
        await SystemConfig.findOneAndUpdate(
          { id: 'main', 'vrchatBots.id': bot.id },
          {
            $set: {
              'vrchatBots.$.groups': groupIds,
              'vrchatBots.$.groupCount': groupIds.length,
              'vrchatBots.$.status': 'active',
              'vrchatBots.$.error': '',
              'vrchatBots.$.lastCheckedAt': new Date(),
            },
          }
        );
      }
    } catch (err: any) {
      if (bot.id === 'legacy') {
        await SystemConfig.findOneAndUpdate(
          { id: 'main' },
          {
            $set: {
              vrchatBotStatus: 'error',
              vrchatBotError: err.message,
              vrchatBotLastCheckedAt: new Date(),
            },
          }
        );
      } else {
        await SystemConfig.findOneAndUpdate(
          { id: 'main', 'vrchatBots.id': bot.id },
          {
            $set: {
              'vrchatBots.$.status': 'error',
              'vrchatBots.$.error': err.message,
              'vrchatBots.$.lastCheckedAt': new Date(),
            },
          }
        );
      }
    }
  }
}
