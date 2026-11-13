import express from 'express';
import { SystemConfig, UserVRChatGroup } from '../shared/models';
import { config as appConfig } from '../shared/config';
import {
  banUserFromVRChatGroup,
  banUserFromVRChatGroupDetailed,
  fetchVRChatDisplayName,
  getBotForGroup,
  getVRChatAuthHeadersForBot,
  getVRChatBots,
  leaveVRChatGroupIfOrphaned,
  resolveVRChatUserBySearch,
  syncAllVRChatBots,
  unbanUserFromVRChatGroup,
} from './vrchat-client';
import { getVRChatShardTopology, scanAndBanBlacklistedUsers } from './worker';

export function createVRChatWorkerCommands() {
  return {
    status: async () => {
      const config = await SystemConfig.findOne({ id: 'main' });
      if (!config) return { enabled: false, bots: [] };

      const sharding = await getVRChatShardTopology();
      const bots = getVRChatBots(config);
      const activeGroups = await UserVRChatGroup.countDocuments({ status: 'active' });
      return {
        enabled: config.vrchatBotEnabled,
        status: config.vrchatBotStatus,
        lastCheckedAt: config.vrchatBotLastCheckedAt,
        error: config.vrchatBotError,
        botCount: bots.length,
        bots: bots.map((bot) => ({
          id: bot.id,
          username: bot.vrchatUsername,
          groupCount: bot.groupCount,
          status: bot.status,
          error: bot.error,
        })),
        activeGroups,
        sharding,
      };
    },
    scan: async () => {
      void scanAndBanBlacklistedUsers();
      return { success: true, message: 'VRChat blacklist scan initiated.' };
    },
    sync: async () => {
      const config = await SystemConfig.findOne({ id: 'main' });
      if (!config) throw new Error('Config not found');
      await syncAllVRChatBots(config);
      return { success: true, config: await SystemConfig.findOne({ id: 'main' }) };
    },
    ban: async ({ vrchatUserId, reason, isCustomList, customListId }: {
      vrchatUserId?: string;
      reason?: string;
      isCustomList?: boolean;
      customListId?: string;
    }) => {
      if (!vrchatUserId) throw new Error('vrchatUserId is required');
      const result = await banUserFromVRChatGroupDetailed(
        vrchatUserId,
        reason || 'Manual ban requested',
        isCustomList || false,
        customListId
      );
      return { ...result, vrchatUserId };
    },
    unban: async ({ vrchatUserId }: { vrchatUserId?: string }) => {
      if (!vrchatUserId) throw new Error('vrchatUserId is required');
      await unbanUserFromVRChatGroup(vrchatUserId);
      return { success: true, vrchatUserId };
    },
    'group-details': async ({ groupId }: { groupId?: string }) => {
      if (!groupId) throw new Error('groupId is required');
      const config = await SystemConfig.findOne({ id: 'main' });
      if (!config) throw new Error('Config not found');
      const bot = await getBotForGroup(config, groupId);
      const { headers, apiKey } = await getVRChatAuthHeadersForBot(bot, config);
      const response = await fetch(`https://api.vrchat.cloud/api/1/groups/${groupId}?apiKey=${apiKey}`, { headers });
      if (!response.ok) throw new Error(`VRChat group lookup failed: HTTP ${response.status}`);
      return { ...(await response.json() as Record<string, any>), botAssigned: bot.vrchatUsername };
    },
    'join-group': async ({ groupId }: { groupId?: string }) => {
      if (!groupId) throw new Error('groupId is required');
      const config = await SystemConfig.findOne({ id: 'main' });
      if (!config) throw new Error('Config not found');
      const bot = await getBotForGroup(config, groupId);
      return { success: true, botAssigned: bot.vrchatUsername };
    },
    'leave-orphaned-group': async ({ groupId }: { groupId?: string }) => {
      if (!groupId) throw new Error('groupId is required');
      await leaveVRChatGroupIfOrphaned(groupId);
      return { success: true };
    },
    'display-name': async ({ vrchatUserId }: { vrchatUserId?: string }) => {
      if (!vrchatUserId) throw new Error('vrchatUserId is required');
      return { vrchatUsername: await fetchVRChatDisplayName(vrchatUserId) };
    },
    'resolve-user': async ({ searchQuery }: { searchQuery?: string }) => {
      if (!searchQuery) throw new Error('searchQuery is required');
      return resolveVRChatUserBySearch(searchQuery);
    },
    announce: async ({ groupIds, title, text, imageId, sendNotification, visibility }: {
      groupIds?: string[];
      title?: string;
      text?: string;
      imageId?: string;
      sendNotification?: boolean;
      visibility?: string;
    }) => {
      if (!Array.isArray(groupIds) || groupIds.length === 0) throw new Error('At least one groupId is required');
      if (!title?.trim() || !text?.trim()) throw new Error('Announcement title and text are required');

      const groupResults: any[] = [];
      for (const groupId of groupIds) {
        let groupName = `Group (${groupId})`;
        try {
          const config = await SystemConfig.findOne({ id: 'main' });
          if (!config) throw new Error('Config not found');
          const bot = await getBotForGroup(config, groupId);
          const { headers, apiKey } = await getVRChatAuthHeadersForBot(bot, config);

          try {
            const details = await fetch(`https://api.vrchat.cloud/api/1/groups/${groupId}?apiKey=${apiKey}`, { headers });
            if (details.ok) groupName = (await details.json() as any).name || groupName;
          } catch {}

          const body: Record<string, any> = {
            title: title.trim(),
            text: text.trim(),
            sendNotification: sendNotification !== false,
            visibility: visibility || 'group',
          };
          if (imageId?.trim()) body.imageId = imageId.trim();

          const response = await fetch(`https://api.vrchat.cloud/api/1/groups/${groupId}/posts?apiKey=${apiKey}`, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

          if (response.ok) {
            const post = await response.json() as any;
            groupResults.push({ groupId, groupName, success: true, postId: post.id || null, postedAt: new Date().toISOString() });
          } else {
            const error = await response.text();
            groupResults.push({ groupId, groupName, success: false, error: `HTTP ${response.status}: ${error.slice(0, 150)}` });
          }
        } catch (error: any) {
          groupResults.push({ groupId, groupName, success: false, error: error?.message || 'Announcement request failed' });
        }
      }

      return {
        groupResults,
        successCount: groupResults.filter((result) => result.success).length,
        failedCount: groupResults.filter((result) => !result.success).length,
      };
    },
  };
}

export function createVRChatProbeRouter(): express.Router {
  const router = express.Router();

  router.get('/healthz', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'vrchat-bot' });
  });

  router.get('/readyz', async (_req, res) => {
    try {
      const config = await SystemConfig.findOne({ id: 'main' }).select('_id');
      res.status(config ? 200 : 503).json({
        status: config ? 'ready' : 'not-ready',
        service: 'vrchat-bot',
        instanceId: appConfig.vrcInstanceId,
        totalInstances: appConfig.vrcTotalInstances,
      });
    } catch (error: any) {
      res.status(503).json({ status: 'not-ready', error: error?.message });
    }
  });

  return router;
}
