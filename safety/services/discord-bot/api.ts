import express from 'express';
import { Client } from 'discord.js';
import { ShardConfig } from './k8s-sharding';
import { createGuildBackup, Guild, isValidDiscordSnowflake } from '../shared/models';
import { restoreGuildBackup } from '../web-dashboard/backup-restore';

export function createDiscordWorkerCommands(
  client: Client,
  shardConfig: ShardConfig,
  syncCommands: (ageVerifyDisabled?: boolean) => Promise<{
    success: boolean;
    count: number;
    ageVerifyDisabled: boolean;
    error?: string;
  }>,
  runtimeCommands: Record<string, (payload: any) => Promise<any> | any> = {},
  getGuildDiscordClient?: (guildId: string) => Client
) {
  const ownerPermissionNoticeAt = new Map<string, number>();
  const permissionNoticeCooldownMs = 24 * 60 * 60 * 1000;

  const isUnknownBan = (error: any) =>
    error?.status === 404 ||
    Number(error?.code) === 10026 ||
    Number(error?.rawError?.code) === 10026 ||
    /unknown\s+ban/i.test(error?.message || '');
  const isPermissionFailure = (error: any) =>
    Number(error?.code) === 50013 ||
    Number(error?.rawError?.code) === 50013 ||
    Number(error?.code) === 50001 ||
    Number(error?.rawError?.code) === 50001 ||
    /missing permissions|missing access/i.test(error?.message || '');

  function resolveClientForGuild(guildId: string): Client {
    if (getGuildDiscordClient) {
      try {
        return getGuildDiscordClient(guildId) || client;
      } catch {
        return client;
      }
    }
    return client;
  }

  async function sendToGuildLogChannel(
    guild: any,
    explicitChannelId: string | undefined,
    message: string
  ): Promise<boolean> {
    try {
      let channelId = explicitChannelId;
      if (!channelId) {
        const guildDoc = await Guild.findOne({ id: guild.id }).catch(() => null);
        channelId = guildDoc?.settings?.logChannelId || guildDoc?.settings?.staffChannelId;
      }
      if (!channelId) return false;
      const channel =
        guild.channels.cache.get(channelId) ||
        (await guild.channels.fetch(channelId).catch(() => null));
      if (channel?.isTextBased()) {
        await (channel as any).send(message).catch(() => null);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async function notifyGuildOwnerOfPermissionFailure(guild: any, userId: string, action: 'ban' | 'unban') {
    const now = Date.now();
    const lastNoticeAt = ownerPermissionNoticeAt.get(guild.id) || 0;
    if (now - lastNoticeAt < permissionNoticeCooldownMs) return false;
    ownerPermissionNoticeAt.set(guild.id, now);

    try {
      const owner = await client.users.fetch(guild.ownerId);
      await owner.send(
        `BeSafe Network could not ${action} Discord user ${userId} in **${guild.name}** because the bot lacks access or permissions. Please ensure it is still in the server, grant its role **Administrator**, and move that role above members it needs to moderate. Then retry. This reminder is limited to once per day.`
      );
      return true;
    } catch (error: any) {
      console.warn(`[Discord Permissions] Could not DM owner of ${guild.name} (${guild.id}):`, error?.message || error);
      return false;
    }
  }

  async function fetchGuild(guildId?: string) {
    if (!guildId) throw new Error('Guild ID is required');
    const targetClient = resolveClientForGuild(guildId);
    const guild = targetClient.guilds.cache.get(guildId) || await targetClient.guilds.fetch(guildId).catch(() => null);
    if (!guild) throw new Error('Discord server not found or bot is not present in the server');
    return guild;
  }

  return {
    status: () => {
      const isReady = client.isReady();
      return {
        status: isReady ? 'online' : 'connecting',
        ready: isReady,
        user: client.user ? {
          id: client.user.id,
          tag: client.user.tag,
          username: client.user.username,
          avatar: client.user.avatarURL(),
        } : null,
        shard: {
          id: shardConfig.shardId,
          count: shardConfig.shardCount,
          isSharded: shardConfig.isSharded,
          source: shardConfig.source,
        },
        guildsCount: client.guilds.cache.size,
        usersCount: client.users.cache.size,
        ping: client.ws.ping,
        uptime: client.uptime || 0,
      };
    },
    guilds: () => {
      if (!client.isReady()) throw new Error('Client not ready');
      const guilds = client.guilds.cache.map((guild) => {
        const resolvedShardId =
          typeof guild.shardId === 'number' && guild.shardId > 0
            ? guild.shardId
            : shardConfig.shardId ?? guild.shardId ?? 0;
        return {
          id: guild.id,
          name: guild.name,
          memberCount: guild.memberCount,
          iconUrl: guild.iconURL(),
          shardId: resolvedShardId,
          shardCount: shardConfig.shardCount,
        };
      });
      return { guilds, count: guilds.length, shardId: shardConfig.shardId, shardCount: shardConfig.shardCount };
    },
    user: async ({ userId }: { userId?: string }) => {
      if (!userId) throw new Error('User ID is required');
      const user = await client.users.fetch(userId);
      return {
        id: user.id,
        tag: user.tag,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarURL({ size: 256 }) || user.defaultAvatarURL,
        bot: user.bot,
      };
    },
    'guild-data': async ({ guildId }: { guildId?: string }) => {
      const guild = await fetchGuild(guildId);
      const [channels, roles] = await Promise.all([
        guild.channels.fetch().catch(() => null),
        guild.roles.fetch().catch(() => null),
      ]);
      const resolvedShardId =
        typeof guild.shardId === 'number' && guild.shardId > 0
          ? guild.shardId
          : shardConfig.shardId ?? guild.shardId ?? 0;
      return {
        guildId: guild.id,
        guildName: guild.name,
        shardId: resolvedShardId,
        shardCount: shardConfig.shardCount,
        channels: channels
          ? [...channels.values()]
              .filter((channel) => channel && (channel.type === 0 || channel.type === 5 || channel.type === 15 || channel.isTextBased()))
              .map((channel: any) => ({ id: channel.id, name: channel.name, type: channel.type, parentName: channel.parent?.name }))
              .sort((left, right) => left.name.localeCompare(right.name))
          : [],
        roles: roles
          ? [...roles.values()]
              .filter(Boolean)
              .map((role) => ({ id: role.id, name: role.name, color: role.hexColor && role.hexColor !== '#000000' ? role.hexColor : '#6B7280', position: role.position }))
              .sort((left, right) => right.position - left.position)
          : [],
      };
    },
    'create-backup': async ({ guildId, creatorId, creatorTag, name }: { guildId?: string; creatorId?: string; creatorTag?: string; name?: string }) => {
      const guild = await fetchGuild(guildId);
      const backup = await createGuildBackup(guild, creatorId || 'dashboard', creatorTag || 'Dashboard', name);
      return typeof backup.toObject === 'function' ? backup.toObject() : backup;
    },
    'restore-backup': async ({ guildId, backup }: { guildId?: string; backup?: any }) => {
      if (!backup) throw new Error('Backup data is required');
      const guild = await fetchGuild(guildId);
      await restoreGuildBackup(guild, backup);
      return { success: true, guildName: guild.name };
    },
    'send-dm': async ({ userId, message }: { userId?: string; message?: any }) => {
      if (!userId || !message) throw new Error('User ID and message are required');
      try {
        const user = await client.users.fetch(userId);
        await user.send(message);
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Could not deliver DM to user' };
      }
    },
    'send-guild-log': async ({
      guildId,
      groupId,
      channelId,
      message,
    }: {
      guildId?: string;
      groupId?: string;
      channelId?: string;
      message?: string;
    }) => {
      if (!message) throw new Error('Log message is required');
      let guildDocs: any[] = [];
      if (guildId) {
        const doc = await Guild.findOne({ id: guildId }).catch(() => null);
        guildDocs = doc ? [doc] : [{ id: guildId, settings: { logChannelId: channelId } }];
      } else if (groupId) {
        guildDocs = await Guild.find({ 'settings.vrchatGroupId': groupId.trim() }).catch(() => []);
      }

      let sentCount = 0;
      for (const guildDoc of guildDocs) {
        const targetClient = resolveClientForGuild(guildDoc.id);
        const guild = targetClient.guilds.cache.get(guildDoc.id);
        if (!guild) continue;
        const targetChannelId = channelId || guildDoc.settings?.logChannelId || guildDoc.settings?.staffChannelId;
        const sent = await sendToGuildLogChannel(guild, targetChannelId, message);
        if (sent) sentCount += 1;
      }
      return { success: true, sentCount };
    },
    'ban-guilds': async ({ userId, userTag, reason, guilds }: { userId?: string; userTag?: string; reason?: string; guilds?: Array<{ id: string; staffChannelId?: string; logChannelId?: string }> }) => {
      if (!client.isReady()) throw new Error(`Discord shard ${shardConfig.shardId} is not ready`);
      if (!userId || !Array.isArray(guilds)) throw new Error('User ID and guild list are required');
      const cleanUserId = String(userId).trim();
      if (!isValidDiscordSnowflake(cleanUserId)) {
        return { bannedCount: 0, alreadyBannedCount: 0, failedGuilds: [], permissionWarnings: [], handledGuildIds: [], skippedInvalidId: true };
      }
      let bannedCount = 0;
      let alreadyBannedCount = 0;
      const failedGuilds: Array<{ id: string; error: string }> = [];
      const permissionWarnings: Array<{ id: string; ownerNotified: boolean }> = [];
      const handledGuildIds: string[] = [];
      for (const guildData of guilds) {
        const targetClient = resolveClientForGuild(guildData.id);
        const guild = targetClient.guilds.cache.get(guildData.id);
        if (!guild) continue;
        handledGuildIds.push(guildData.id);
        const logChannelId = guildData.logChannelId || guildData.staffChannelId;
        try {
          let existingBan;
          try {
            existingBan = await guild.bans.fetch(userId);
          } catch (error: any) {
            if (isUnknownBan(error)) {
              existingBan = null;
            } else if (isPermissionFailure(error)) {
              await sendToGuildLogChannel(
                guild,
                logChannelId,
                `⚠️ **Global Ban Skipped (Missing Permissions)**: Could not ban **${userTag || userId}** (\`${userId}\`) because the bot lacks \`Ban Members\` permissions. Skipping.`
              );
              permissionWarnings.push({ id: guild.id, ownerNotified: await notifyGuildOwnerOfPermissionFailure(guild, userId, 'ban') });
              continue;
            } else {
              await sendToGuildLogChannel(
                guild,
                logChannelId,
                `⚠️ **Global Ban Skipped**: Could not verify ban status for **${userTag || userId}** (\`${userId}\`) (${error?.message || 'Unknown error'}). Skipping.`
              );
              continue;
            }
          }
          if (existingBan) {
            alreadyBannedCount += 1;
            continue;
          }
          await guild.members.ban(userId, { reason: `BeSafe Network: ${reason || 'Global ban'}` });
          bannedCount += 1;
          await sendToGuildLogChannel(
            guild,
            guildData.staffChannelId || guildData.logChannelId,
            `🚨 **Global Ban Enforced**: User **${userTag || userId}** (${userId}) was automatically banned.\nReason: ${reason || 'Global ban'}`
          );
        } catch (error: any) {
          if (isPermissionFailure(error)) {
            await sendToGuildLogChannel(
              guild,
              logChannelId,
              `⚠️ **Global Ban Skipped (Missing Permissions)**: Could not ban **${userTag || userId}** (\`${userId}\`) because the bot lacks \`Ban Members\` permissions or role hierarchy access. Skipping.`
            );
            permissionWarnings.push({ id: guild.id, ownerNotified: await notifyGuildOwnerOfPermissionFailure(guild, userId, 'ban') });
          } else {
            await sendToGuildLogChannel(
              guild,
              logChannelId,
              `⚠️ **Global Ban Skipped**: Failed to ban **${userTag || userId}** (\`${userId}\`) (${error?.message || 'Discord rejected the ban'}). Skipping.`
            );
          }
        }
      }
      return { bannedCount, alreadyBannedCount, failedGuilds, permissionWarnings, handledGuildIds };
    },
    'unban-guilds': async ({
      userId,
      userTag,
      guildIds,
      guilds,
      reason,
    }: {
      userId?: string;
      userTag?: string;
      guildIds?: string[];
      guilds?: Array<{ id: string; staffChannelId?: string; logChannelId?: string }>;
      reason?: string;
    }) => {
      if (!client.isReady()) throw new Error(`Discord shard ${shardConfig.shardId} is not ready`);
      const normalizedGuilds: Array<{ id: string; staffChannelId?: string; logChannelId?: string }> = Array.isArray(guilds) && guilds.length > 0
        ? guilds
        : Array.isArray(guildIds)
          ? guildIds.map((id) => ({ id }))
          : [];
      if (!userId || normalizedGuilds.length === 0) throw new Error('User ID and guild list are required');
      const cleanUserId = String(userId).trim();
      if (!isValidDiscordSnowflake(cleanUserId)) {
        return { unbannedCount: 0, alreadyUnbannedCount: 0, failedGuilds: [], permissionWarnings: [], handledGuildIds: [], skippedInvalidId: true };
      }
      let unbannedCount = 0;
      let alreadyUnbannedCount = 0;
      const failedGuilds: Array<{ id: string; error: string }> = [];
      const permissionWarnings: Array<{ id: string; ownerNotified: boolean }> = [];
      const handledGuildIds: string[] = [];

      let resolvedUserTag = userTag || '';
      if (!resolvedUserTag || resolvedUserTag === userId) {
        try {
          const fetchedUser = await client.users.fetch(userId);
          resolvedUserTag = fetchedUser?.tag || fetchedUser?.username || userId;
        } catch {
          resolvedUserTag = userId;
        }
      }

      const cleanReason = (reason || 'BeSafe Network: Global appeal approved').replace(/^BeSafe Network:\s*/i, '');

      for (const guildEntry of normalizedGuilds) {
        const guildId = guildEntry.id;
        const targetClient = resolveClientForGuild(guildId);
        const guild = targetClient.guilds.cache.get(guildId);
        if (!guild) continue;
        handledGuildIds.push(guildId);
        const explicitLogChannel = guildEntry.logChannelId || guildEntry.staffChannelId;
        let existingBan;
        try {
          existingBan = await guild.bans.fetch(userId);
        } catch (error: any) {
          if (isUnknownBan(error)) {
            alreadyUnbannedCount += 1;
          } else if (isPermissionFailure(error)) {
            await sendToGuildLogChannel(
              guild,
              explicitLogChannel,
              `⚠️ **Global Unban Skipped (Missing Permissions)**: Could not unban **${resolvedUserTag}** (\`${userId}\`) because the bot lacks \`Ban Members\` permissions. Skipping.`
            );
            permissionWarnings.push({ id: guild.id, ownerNotified: await notifyGuildOwnerOfPermissionFailure(guild, userId, 'unban') });
          } else {
            await sendToGuildLogChannel(
              guild,
              explicitLogChannel,
              `⚠️ **Global Unban Skipped**: Could not inspect Discord ban state for **${resolvedUserTag}** (\`${userId}\`) (${error?.message || 'Unknown error'}). Skipping.`
            );
          }
          continue;
        }
        if (!existingBan) {
          alreadyUnbannedCount += 1;
          continue;
        }
        const displayTag =
          resolvedUserTag && resolvedUserTag !== userId
            ? resolvedUserTag
            : existingBan.user?.tag || existingBan.user?.username || userId;
        try {
          await guild.members.unban(userId, `BeSafe Network: ${cleanReason}`);
          unbannedCount += 1;
          await sendToGuildLogChannel(
            guild,
            explicitLogChannel,
            `✅ **Global Unban Enforced**: User **${displayTag}** (${userId}) was automatically unbanned.\nReason: ${cleanReason}`
          );
        } catch (error: any) {
          if (isUnknownBan(error)) {
            alreadyUnbannedCount += 1;
          } else if (isPermissionFailure(error)) {
            await sendToGuildLogChannel(
              guild,
              explicitLogChannel,
              `⚠️ **Global Unban Skipped (Missing Permissions)**: Could not unban **${displayTag}** (\`${userId}\`) because the bot lacks \`Ban Members\` permissions. Skipping.`
            );
            permissionWarnings.push({ id: guild.id, ownerNotified: await notifyGuildOwnerOfPermissionFailure(guild, userId, 'unban') });
          } else {
            await sendToGuildLogChannel(
              guild,
              explicitLogChannel,
              `⚠️ **Global Unban Skipped**: Failed to unban **${displayTag}** (\`${userId}\`) (${error?.message || 'Discord rejected the unban'}). Skipping.`
            );
          }
        }
      }
      return { unbannedCount, alreadyUnbannedCount, failedGuilds, permissionWarnings, handledGuildIds };
    },
    'sync-commands': async ({ ageVerifyDisabled = false }: { ageVerifyDisabled?: boolean } = {}) => {
      const result = await syncCommands(ageVerifyDisabled);
      if (!result.success) throw new Error(result.error || 'Discord command registration failed');
      return result;
    },
    ...runtimeCommands,
  };
}

export function createDiscordProbeRouter(client: Client, shardConfig: ShardConfig): express.Router {
  const router = express.Router();

  router.get('/healthz', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'discord-bot' });
  });

  router.get('/readyz', (_req, res) => {
    if (!client.isReady()) {
      return res.status(503).json({
        status: 'not-ready',
        service: 'discord-bot',
        message: 'Discord Gateway client not yet ready',
      });
    }

    res.status(200).json({
      status: 'ready',
      service: 'discord-bot',
      shardId: shardConfig.shardId,
      shardCount: shardConfig.shardCount,
      ping: client.ws.ping,
    });
  });

  return router;
}
