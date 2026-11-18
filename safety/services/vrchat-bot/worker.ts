import {
  SystemConfig,
  BanCase,
  CustomBanlist,
  Guild,
  UserVRChatGroup,
  User,
  Log,
  VRChatGroupMemberSnapshot,
} from '../shared/models';
import {
  getBotForGroup,
  getVRChatAuthHeadersForBot,
  getVRChatAuthHeaders,
  removeGroupFromBotDb,
  banUserFromSpecificVRChatGroup,
  fetchVRChatDisplayName,
  syncAllVRChatBots,
  knownGroupBansCache,
  markUserBannedInGroupCache,
  requestVRChatDashboardCommand,
  runVRChatMutualsCheck,
  syncVRChatAgeVerifiedFlag,
} from './vrchat-client';
import { config as appConfig } from '../shared/config';
import { resolve4 } from 'node:dns/promises';

let scanInterval: NodeJS.Timeout | null = null;
let displayNamesInterval: NodeJS.Timeout | null = null;
let mutualsInterval: NodeJS.Timeout | null = null;
let ageSyncInterval: NodeJS.Timeout | null = null;
let isScanning = false;
let isCheckingMutuals = false;
let isSyncingAgeFlags = false;

export async function getVRChatShardTopology() {
  const instanceId = appConfig.vrcInstanceId;
  let totalInstances = appConfig.vrcTotalInstances;

  if (appConfig.vrcDiscoveryHost) {
    const podIps = [...new Set(await resolve4(appConfig.vrcDiscoveryHost))];
    if (podIps.length === 0) {
      throw new Error(`No VRChat worker pods discovered at ${appConfig.vrcDiscoveryHost}`);
    }
    totalInstances = podIps.length;
  }

  if (instanceId < 0 || instanceId >= totalInstances) {
    throw new Error(`VRChat worker instance ${instanceId} is outside the discovered range of ${totalInstances} pods`);
  }

  return { instanceId, totalInstances };
}

export async function scanAndBanBlacklistedUsers(
  instanceId?: number,
  totalInstances?: number
) {
  if (isScanning) return;
  isScanning = true;

  try {
    const topology = await getVRChatShardTopology();
    const activeInstanceId = instanceId ?? topology.instanceId;
    const activeInstanceCount = totalInstances ?? topology.totalInstances;

    const config = await SystemConfig.findOne({ id: 'main' });
    if (!config || !config.vrchatBotEnabled) {
      isScanning = false;
      return;
    }

    if ((!config.vrchatUsername || !config.vrchatPassword) && !config.vrchatCookie) {
      isScanning = false;
      return;
    }

    const activeBanCases = await BanCase.find({ status: 'active' });
    const blacklistedVRChatUserIds = new Set<string>();

    for (const bCase of activeBanCases) {
      if (Array.isArray(bCase.vrchatAccounts)) {
        for (const va of bCase.vrchatAccounts) {
          const vId = va.vrchatUserId ? va.vrchatUserId.trim() : '';
          if (vId && vId.startsWith('usr_')) {
            blacklistedVRChatUserIds.add(vId);
          }
        }
      }
    }

    const customBanlists = await CustomBanlist.find();
    const hasCustomEntries = customBanlists.some((list) =>
      list.entries && list.entries.some((e) => e.type === 'vrchat' && e.targetId && e.targetId.trim().startsWith('usr_'))
    );

    if (blacklistedVRChatUserIds.size === 0 && !hasCustomEntries) {
      isScanning = false;
      return;
    }

    const groupIds = new Set<string>();
    if (config.vrchatGroupId && config.vrchatGroupId.trim()) {
      groupIds.add(config.vrchatGroupId.trim());
    }

    const activeGuilds = await Guild.find({ 'settings.vrchatBotEnabled': true });
    for (const guild of activeGuilds) {
      const gId = guild.settings?.vrchatGroupId?.trim();
      if (gId) groupIds.add(gId);
    }

    const userScannerGroups = await UserVRChatGroup.find({ autoBanEnabled: true });
    for (const ug of userScannerGroups) {
      if (ug.groupId && ug.groupId.trim()) {
        groupIds.add(ug.groupId.trim());
      }
    }

    if (groupIds.size === 0) {
      isScanning = false;
      return;
    }

    // Partition groups for horizontal sharding across Kubernetes pods
    const allGroups = Array.from(groupIds);
    const assignedGroups = allGroups.filter((_, idx) => idx % activeInstanceCount === activeInstanceId);

    console.log(
      `[VRChat Worker (Instance ${activeInstanceId}/${activeInstanceCount})] Scanning ${assignedGroups.length}/${allGroups.length} assigned groups.`
    );

    for (const groupId of assignedGroups) {
      let bot;
      try {
        bot = await getBotForGroup(config, groupId);
      } catch (botErr: any) {
        continue;
      }

      let headers: any, apiKey: string;
      try {
        const auth = await getVRChatAuthHeadersForBot(bot, config);
        headers = auth.headers;
        apiKey = auth.apiKey;
      } catch (authErr: any) {
        continue;
      }

      const guildsForGroup = activeGuilds.filter((g) => g.settings?.vrchatGroupId?.trim() === groupId);
      const isCentralGroup = config.vrchatGroupId && config.vrchatGroupId.trim() === groupId;
      const guildsWithAutoBan = guildsForGroup.filter((g) => g.settings?.vrchatAutoBanEnabled !== false);

      const finalGroupBannedVRChatIds = new Set<string>();
      const groupBanReasons = new Map<string, string>();

      const hasGlobalEnabled =
        isCentralGroup ||
        guildsForGroup.some((g) => {
          const mode = g.settings?.banlistSelectionMode || 'global';
          return mode === 'both' || mode === 'global';
        });

      if (hasGlobalEnabled) {
        for (const id of blacklistedVRChatUserIds) {
          finalGroupBannedVRChatIds.add(id);
          groupBanReasons.set(id.toLowerCase(), 'Automatically banned: User is on the global blacklist');
        }
      }

      for (const g of guildsForGroup) {
        const mode = g.settings?.banlistSelectionMode || 'global';
        const customId = g.settings?.customBanlistId;
        if (customId && (mode === 'both' || mode === 'custom')) {
          const list = await CustomBanlist.findById(customId);
          if (list) {
            for (const entry of list.entries) {
              if (entry.type === 'vrchat' && entry.targetId && entry.targetId.trim().startsWith('usr_')) {
                const targetIdNorm = entry.targetId.trim();
                finalGroupBannedVRChatIds.add(targetIdNorm);
                groupBanReasons.set(
                  targetIdNorm.toLowerCase(),
                  `Automatically banned: Listed on custom banlist "${list.name}" (${entry.reason || 'Custom blacklisted'})`
                );
              }
            }
          }
        }
      }

      // Filter out trusted users
      for (const targetId of finalGroupBannedVRChatIds) {
        const dbUser = await User.findOne({
          $or: [{ vrchatUserId: targetId }, { 'vrchatAlts.vrchatUserId': targetId }],
        });
        if (dbUser && dbUser.isTrusted) {
          finalGroupBannedVRChatIds.delete(targetId);
          groupBanReasons.delete(targetId.toLowerCase());
        }
      }

      // Fetch current group bans (seeded with in-memory cache of already-known bans)
      const bannedUserIdsInGroup = new Set<string>(knownGroupBansCache.get(groupId) || []);
      try {
        let response = await fetch(`https://api.vrchat.cloud/api/1/groups/${groupId}/bans?n=100&offset=0&apiKey=${apiKey}`, {
          method: 'GET',
          headers,
        });

        if (response.status === 401 && config.vrchatCookie && config.vrchatUsername && config.vrchatPassword) {
          await SystemConfig.findOneAndUpdate({ id: 'main' }, { vrchatCookie: '' });
          const freshConfig = await SystemConfig.findOne({ id: 'main' });
          if (freshConfig) {
            const fresh = await getVRChatAuthHeaders(freshConfig);
            headers = fresh.headers;
            apiKey = fresh.apiKey;
            response = await fetch(`https://api.vrchat.cloud/api/1/groups/${groupId}/bans?n=100&offset=0&apiKey=${apiKey}`, {
              method: 'GET',
              headers,
            });
          }
        }

        if (response.ok) {
          const bans = (await response.json()) as any[];
          if (Array.isArray(bans)) {
            for (const b of bans) {
              const uId = b.userId || b.bannedUserId || b.id;
              if (uId) {
                const lower = uId.toString().toLowerCase();
                bannedUserIdsInGroup.add(lower);
                markUserBannedInGroupCache(groupId, lower);
              }
            }
          }
        } else {
          const errText = await response.text().catch(() => '');
          if (response.status === 403 && (errText.includes('not a member') || errText.includes('Not a member'))) {
            if (bot && bot.id) {
              await removeGroupFromBotDb(bot.id, groupId);
            }
          }
          continue;
        }
      } catch (e: any) {
        continue;
      }

      // Preventative bans
      if (isCentralGroup || guildsWithAutoBan.length > 0) {
        for (const blacklistedId of finalGroupBannedVRChatIds) {
          if (!bannedUserIdsInGroup.has(blacklistedId.toLowerCase())) {
            const customReason =
              groupBanReasons.get(blacklistedId.toLowerCase()) || 'Automatically banned: User is on the blacklist';
            const banSuccess = await banUserFromSpecificVRChatGroup(
              blacklistedId,
              groupId,
              customReason,
              headers,
              apiKey,
              bot
            );

            await new Promise((r) => setTimeout(r, 1200));

            if (banSuccess) {
              bannedUserIdsInGroup.add(blacklistedId.toLowerCase());
              const dbUser = await User.findOne({
                $or: [{ vrchatUserId: blacklistedId }, { 'vrchatAlts.vrchatUserId': blacklistedId }],
              });
              const displayName = dbUser?.username || 'Unknown';
              const logTargetId = dbUser ? dbUser.id : blacklistedId;

              await new Log({
                action: 'VRCHAT_AUTO_BAN',
                adminId: `VRCHAT_BOT_SHARD_${activeInstanceId}`,
                targetId: logTargetId,
                details: `Automated scan: Auto-banned user ${displayName} (${blacklistedId}) from Group ${groupId}. Reason: ${customReason}`,
              }).save();
            }
          }
        }
      }
    }
  } catch (err: any) {
    console.error(`[VRChat Worker] Error during blacklist scan:`, err?.message || err);
  } finally {
    isScanning = false;
  }
}

async function fetchVRChatGroupMemberIds(
  groupId: string,
  headers: any,
  apiKey: string
): Promise<string[]> {
  const ids = new Set<string>();
  for (let offset = 0; offset < 2000; offset += 100) {
    const res = await fetch(
      `https://api.vrchat.cloud/api/1/groups/${groupId}/members?n=100&offset=${offset}&apiKey=${apiKey}`,
      { headers }
    );
    if (!res.ok) break;
    const page = (await res.json()) as any[];
    if (!Array.isArray(page) || page.length === 0) break;
    for (const m of page) {
      const id = String(m?.userId || m?.id || '').trim();
      if (id.startsWith('usr_')) ids.add(id);
    }
    if (page.length < 100) break;
  }
  return [...ids];
}

export async function checkNewVRChatGroupMembers(
  instanceId?: number,
  totalInstances?: number
) {
  if (isCheckingMutuals) return;
  isCheckingMutuals = true;

  try {
    const topology = await getVRChatShardTopology();
    const activeInstanceId = instanceId ?? topology.instanceId;
    const activeInstanceCount = totalInstances ?? topology.totalInstances;

    const config = await SystemConfig.findOne({ id: 'main' });
    if (!config || !config.vrchatBotEnabled) return;
    if ((!config.vrchatUsername || !config.vrchatPassword) && !config.vrchatCookie) return;

    const guilds = await Guild.find({
      'settings.vrchatBotEnabled': true,
      'settings.vrchatMutualsCheckEnabled': true,
      'settings.vrchatGroupId': { $nin: ['', null] },
    }).catch(() => []);
    if (guilds.length === 0) return;

    const guildsByGroup = new Map<string, any[]>();
    for (const g of guilds) {
      const gid = String(g.settings?.vrchatGroupId || '').trim();
      if (!gid) continue;
      const list = guildsByGroup.get(gid) || [];
      list.push(g);
      guildsByGroup.set(gid, list);
    }

    const allGroups = [...guildsByGroup.keys()].sort();
    const assignedGroups = allGroups.filter((_, idx) => idx % activeInstanceCount === activeInstanceId);
    if (assignedGroups.length === 0) return;

    for (const groupId of assignedGroups) {
      const groupGuilds = guildsByGroup.get(groupId) || [];
      let bot;
      try {
        bot = await getBotForGroup(config, groupId);
      } catch {
        continue;
      }

      let headers: any, apiKey: string;
      try {
        const auth = await getVRChatAuthHeadersForBot(bot, config);
        headers = auth.headers;
        apiKey = auth.apiKey;
      } catch {
        continue;
      }

      let memberIds: string[] = [];
      try {
        memberIds = await fetchVRChatGroupMemberIds(groupId, headers, apiKey);
      } catch {
        continue;
      }
      if (memberIds.length === 0) continue;

      const snapshot = await VRChatGroupMemberSnapshot.findOneAndUpdate(
        { groupId },
        { $setOnInsert: { groupId, memberIds: [], checkedUserIds: [], initialized: false } },
        { upsert: true, new: true }
      ).catch(() => null);
      if (!snapshot) continue;

      const currentSet = new Set(memberIds);
      const knownSet = new Set(snapshot.memberIds || []);
      const checkedSet = new Set(snapshot.checkedUserIds || []);

      if (!snapshot.initialized) {
        // First sighting: record the baseline roster without flagging existing members
        snapshot.memberIds = memberIds.slice(0, 5000);
        snapshot.initialized = true;
        snapshot.updatedAt = new Date();
        await snapshot.save().catch(() => null);
        continue;
      }

      const newMemberIds = memberIds.filter((id) => !knownSet.has(id) && !checkedSet.has(id)).slice(0, 10);

      for (const newId of newMemberIds) {
        try {
          const result = await runVRChatMutualsCheck(newId, {
            groupId,
            guildId: groupGuilds[0]?.id,
          });
          checkedSet.add(newId);

          if (result.blacklistedFriends.length > 0) {
            const friendLines = result.blacklistedFriends
              .slice(0, 10)
              .map((f) => `• **${f.displayName}** (\`${f.vrchatUserId}\`) — ${f.reason}`)
              .join('\n');
            const embed = {
              title: '🔗 Mutuals Background Check — Blacklisted Connection Found',
              color: 0xf59e0b,
              description: `A new member of your linked VRChat group has **${result.blacklistedFriends.length} friend(s) on the blacklist**. No action was taken automatically — review and decide.`,
              fields: [
                { name: '👤 New Member', value: `**${result.displayName || 'Unknown'}** (\`${result.vrchatUserId}\`)`, inline: true },
                { name: '👥 Friends Checked', value: `\`${result.friendCount}\``, inline: true },
                { name: '🤝 Mutual Groups', value: `\`${result.mutualGroupCount}\`${result.mutualGroupNames.length ? ` (${result.mutualGroupNames.slice(0, 3).join(', ')})` : ''}`, inline: true },
                { name: '🚨 Blacklisted Friends', value: friendLines + (result.blacklistedFriends.length > 10 ? `\n*...and ${result.blacklistedFriends.length - 10} more*` : ''), inline: false },
              ],
              footer: { text: 'BeSafe Network • VRChat Mutuals Background Check' },
              timestamp: new Date().toISOString(),
            };

            for (const g of groupGuilds) {
              const channelId =
                g.settings?.vrchatMutualsCheckChannelId ||
                g.settings?.staffChannelId ||
                g.settings?.logChannelId;
              if (!channelId) continue;
              await requestVRChatDashboardCommand('send-group-log', {
                guildId: g.id,
                channelId,
                message: { embeds: [embed] },
              }).catch(() => null);
            }
          }
        } catch (e: any) {
          checkedSet.add(newId);
        }
        await new Promise((r) => setTimeout(r, 800));
      }

      // Persist roster: keep current members + recently checked users
      snapshot.memberIds = memberIds.slice(0, 5000);
      snapshot.checkedUserIds = [...checkedSet].slice(-5000);
      snapshot.updatedAt = new Date();
      await snapshot.save().catch(() => null);
    }
  } catch (err: any) {
    console.error('[VRChat Worker] Error during mutuals join check:', err?.message || err);
  } finally {
    isCheckingMutuals = false;
  }
}

export async function checkAndSyncVRChatDisplayNames() {
  try {
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    const users = await User.find({
      $and: [
        {
          $or: [{ vrchatUserId: { $ne: '' } }, { 'vrchatAlts.0': { $exists: true } }],
        },
        {
          $or: [{ vrchatLastCheckedAt: { $exists: false } }, { vrchatLastCheckedAt: { $lte: tenDaysAgo } }],
        },
      ],
    }).limit(50);

    for (const user of users) {
      let changed = false;

      if (user.vrchatUserId) {
        const fetchedName = await fetchVRChatDisplayName(user.vrchatUserId);
        await new Promise((r) => setTimeout(r, 1200));
        if (fetchedName && fetchedName !== user.vrchatUsername) {
          user.vrchatUsername = fetchedName;
          changed = true;
        }
      }

      if (user.vrchatAlts && Array.isArray(user.vrchatAlts)) {
        const updatedAlts: any[] = [];
        for (const alt of user.vrchatAlts) {
          if (alt.vrchatUserId) {
            const fetchedAltName = await fetchVRChatDisplayName(alt.vrchatUserId);
            await new Promise((r) => setTimeout(r, 1200));
            if (fetchedAltName && fetchedAltName !== alt.vrchatUsername) {
              updatedAlts.push({
                vrchatUserId: alt.vrchatUserId,
                vrchatUsername: fetchedAltName,
                linkedAt: alt.linkedAt || new Date(),
              });
              changed = true;
            } else {
              updatedAlts.push(alt);
            }
          } else {
            updatedAlts.push(alt);
          }
        }
        if (changed) {
          user.vrchatAlts = updatedAlts as any;
        }
      }

      user.vrchatLastCheckedAt = new Date();
      user.updatedAt = new Date();
      await user.save();
    }
  } catch (err: any) {
    console.error('[VRChat Worker] Error syncing display names:', err?.message || err);
  }
}

export async function syncVRChatAgeVerificationFlags(
  instanceId?: number,
  totalInstances?: number
) {
  if (isSyncingAgeFlags) return;
  isSyncingAgeFlags = true;
  try {
    const topology = await getVRChatShardTopology();
    const activeInstanceId = instanceId ?? topology.instanceId;
    const activeInstanceCount = totalInstances ?? topology.totalInstances;

    const config = await SystemConfig.findOne({ id: 'main' });
    if (!config || !config.vrchatBotEnabled) return;
    if ((!config.vrchatUsername || !config.vrchatPassword) && !config.vrchatCookie) return;

    const staleCutoff = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const candidates = await User.find({
      vrchatUserId: { $nin: ['', null] },
      isAgeVerified: { $ne: true },
      $or: [
        { vrchatLastCheckedAt: { $exists: false } },
        { vrchatLastCheckedAt: { $lte: staleCutoff } },
      ],
    }).limit(50 * activeInstanceCount).catch(() => []);
    const users = candidates.filter((_, idx) => idx % activeInstanceCount === activeInstanceId).slice(0, 50);

    for (const user of users) {
      try {
        const verified = await syncVRChatAgeVerifiedFlag(user.vrchatUserId);
        if (verified) {
          await new Log({
            action: 'VRCHAT_AGE_FLAG_SYNCED',
            adminId: 'VRCHAT_BOT',
            targetId: user.id,
            details: `Age verification flag synced from VRChat system_age_verified tag for linked account ${user.vrchatUsername || user.vrchatUserId} (${user.vrchatUserId}).`,
          }).save().catch(() => null);
        }
      } catch {}
      user.vrchatLastCheckedAt = new Date();
      await user.save().catch(() => null);
      await new Promise((r) => setTimeout(r, 1200));
    }
  } catch (err: any) {
    console.error('[VRChat Worker] Error syncing age verification flags:', err?.message || err);
  } finally {
    isSyncingAgeFlags = false;
  }
}

export function startVRChatWorkers(
  instanceId = appConfig.vrcInstanceId,
  totalInstances = appConfig.vrcTotalInstances
) {
  console.log(`[VRChat Worker] Starting background worker tasks (Shard: ${instanceId}/${totalInstances})...`);

  // Initial tasks
  setTimeout(async () => {
    try {
      const config = await SystemConfig.findOne({ id: 'main' });
      if (config && config.vrchatBotEnabled) {
        await syncAllVRChatBots(config);
      }
    } catch (e) {}
  }, 5000);

  setTimeout(() => scanAndBanBlacklistedUsers(), 15000);
  setTimeout(checkAndSyncVRChatDisplayNames, 45000);
  setTimeout(checkNewVRChatGroupMembers, 60000);
  setTimeout(() => syncVRChatAgeVerificationFlags(), 90000);

  // Intervals
  scanInterval = setInterval(() => scanAndBanBlacklistedUsers(), 2 * 60 * 1000);
  displayNamesInterval = setInterval(checkAndSyncVRChatDisplayNames, 12 * 60 * 60 * 1000);
  mutualsInterval = setInterval(checkNewVRChatGroupMembers, 5 * 60 * 1000);
  ageSyncInterval = setInterval(syncVRChatAgeVerificationFlags, 6 * 60 * 60 * 1000);
}

export function stopVRChatWorkers() {
  if (scanInterval) clearInterval(scanInterval);
  if (displayNamesInterval) clearInterval(displayNamesInterval);
  if (mutualsInterval) clearInterval(mutualsInterval);
  if (ageSyncInterval) clearInterval(ageSyncInterval);
  scanInterval = null;
  displayNamesInterval = null;
  mutualsInterval = null;
  ageSyncInterval = null;
  console.log('[VRChat Worker] Background worker tasks stopped.');
}
