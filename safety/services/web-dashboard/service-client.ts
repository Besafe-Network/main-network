import { workerSocketHub } from '../shared/worker-transport';
import { config } from '../shared/config';

export class ServiceClient {
  public discordShardForGuild(guildId: string): number {
    try {
      const shardCount = config.shardCount || 1;
      return Number((BigInt(guildId) >> 22n) % BigInt(shardCount));
    } catch {
      return 0;
    }
  }

  // --- VRChat Service RPCs ---
  async getVRChatStatus(): Promise<any> {
    try {
      return await workerSocketHub.request('vrchat-bot', 'status');
    } catch (e: any) {
      return { status: 'offline', error: e.message };
    }
  }

  async triggerVRChatScan(): Promise<boolean> {
    try {
      const results = await workerSocketHub.requestAll('vrchat-bot', 'scan', {}, true);
      return results.every((result) => result?.success !== false);
    } catch (e) {
      return false;
    }
  }

  async triggerVRChatSync(): Promise<boolean> {
    try {
      const result = await workerSocketHub.request('vrchat-bot', 'sync');
      return result?.success === true;
    } catch (e) {
      return false;
    }
  }

  async banVRChatUser(vrchatUserId: string, reason: string, isCustomList = false, customListId?: string): Promise<boolean> {
    const result = await this.banVRChatUserWithDetails(vrchatUserId, reason, isCustomList, customListId);
    return result.success;
  }

  async banVRChatUserWithDetails(vrchatUserId: string, reason: string, isCustomList = false, customListId?: string): Promise<{ success: boolean; bannedGroups: string[] }> {
    try {
      const result = await workerSocketHub.request('vrchat-bot', 'ban', { vrchatUserId, reason, isCustomList, customListId });
      return { success: result?.success === true, bannedGroups: result?.bannedGroups || [] };
    } catch (e) {
      return { success: false, bannedGroups: [] };
    }
  }

  async unbanVRChatUser(vrchatUserId: string): Promise<boolean> {
    try {
      const result = await workerSocketHub.request('vrchat-bot', 'unban', { vrchatUserId });
      return result?.success !== false;
    } catch (e: any) {
      console.warn(`[VRChat Unban] Skipped or failed for ${vrchatUserId}:`, e?.message || e);
      return false;
    }
  }

  async getVRChatGroupDetails(groupId: string): Promise<any> {
    return workerSocketHub.request('vrchat-bot', 'group-details', { groupId });
  }

  async assignVRChatGroup(groupId: string): Promise<any> {
    return workerSocketHub.request('vrchat-bot', 'join-group', { groupId });
  }

  async leaveVRChatGroupIfOrphaned(groupId: string): Promise<any> {
    return workerSocketHub.request('vrchat-bot', 'leave-orphaned-group', { groupId });
  }

  async fetchVRChatDisplayName(vrchatUserId: string): Promise<string | null> {
    const result = await workerSocketHub.request('vrchat-bot', 'display-name', { vrchatUserId });
    return result?.vrchatUsername || null;
  }

  async resolveVRChatUserBySearch(searchQuery: string): Promise<any> {
    return workerSocketHub.request('vrchat-bot', 'resolve-user', { searchQuery });
  }

  async broadcastVRChatAnnouncement(payload: {
    groupIds: string[];
    title: string;
    text: string;
    imageId?: string;
    sendNotification?: boolean;
    visibility?: string;
  }): Promise<any> {
    return workerSocketHub.request('vrchat-bot', 'announce', payload);
  }

  // --- Discord Service RPCs ---
  async getDiscordStatus(): Promise<any> {
    try {
      return await workerSocketHub.request('discord-bot', 'status');
    } catch (e: any) {
      return { status: 'offline', error: e.message };
    }
  }

  async fetchDiscordUser(userId: string): Promise<any> {
    try {
      return await workerSocketHub.request('discord-bot', 'user', { userId });
    } catch {
      return null;
    }
  }

  async fetchDiscordGuilds(): Promise<any[]> {
    try {
      const results = await workerSocketHub.requestAll('discord-bot', 'guilds');
      return results.flatMap((result) => result?.guilds || []);
    } catch (e) {
      return [];
    }
  }

  async getLiveDiscordGuilds(): Promise<any[]> {
    const expectedShards = config.shardCount || 1;
    const connectedShards = workerSocketHub.connectedCount('discord-bot');
    if (connectedShards < expectedShards) {
      throw new Error(`Discord workers are not fully connected (${connectedShards}/${expectedShards}); refusing to prune server records.`);
    }

    const results = await workerSocketHub.requestAll('discord-bot', 'guilds', {}, true);
    if (results.length < expectedShards) {
      throw new Error(`Discord workers returned an incomplete guild snapshot (${results.length}/${expectedShards}); refusing to prune server records.`);
    }
    return results.flatMap((result) => result?.guilds || []);
  }

  async syncDiscordCommands(ageVerifyDisabled = false): Promise<any> {
    try {
      const results = await workerSocketHub.requestAll('discord-bot', 'sync-commands', { ageVerifyDisabled });
      const primary = results.find((r) => r && typeof r.count === 'number') || results[0];
      return primary || { success: false, error: 'Discord worker unavailable' };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Discord worker unavailable' };
    }
  }

  async fetchDiscordGuildData(guildId: string): Promise<any> {
    return workerSocketHub.requestShard('discord-bot', this.discordShardForGuild(guildId), 'guild-data', { guildId });
  }

  async createDiscordBackup(guildId: string, creatorId: string, creatorTag: string, name?: string): Promise<any> {
    return workerSocketHub.requestShard('discord-bot', this.discordShardForGuild(guildId), 'create-backup', { guildId, creatorId, creatorTag, name });
  }

  async restoreDiscordBackup(guildId: string, backup: any): Promise<any> {
    return workerSocketHub.requestShard('discord-bot', this.discordShardForGuild(guildId), 'restore-backup', { guildId, backup });
  }

  async sendDiscordDM(userId: string, message: any): Promise<any> {
    try {
      return await workerSocketHub.request('discord-bot', 'send-dm', { userId, message });
    } catch (e: any) {
      return { success: false, error: e?.message || 'Discord worker unavailable' };
    }
  }

  async sendGuildLogMessage(payload: { groupId?: string; guildId?: string; channelId?: string; message: string }): Promise<boolean> {
    try {
      if (payload.guildId) {
        const targetShard = this.discordShardForGuild(payload.guildId);
        const result = await workerSocketHub.requestShard('discord-bot', targetShard, 'send-guild-log', payload);
        return (result?.sentCount || 0) > 0;
      }
      const results = await workerSocketHub.requestAll('discord-bot', 'send-guild-log', payload);
      return results.some((r) => (r?.sentCount || 0) > 0);
    } catch (e: any) {
      console.warn('[Guild Log] Could not dispatch log message via discord-bot worker:', e?.message || e);
      return false;
    }
  }

  async enforceDiscordBan(userId: string, userTag: string, reason: string, guilds: any[]): Promise<any> {
    const guildsByShard = new Map<number, any[]>();
    for (const g of guilds) {
      if (!g?.id) continue;
      const shardId = this.discordShardForGuild(g.id);
      const list = guildsByShard.get(shardId) || [];
      list.push(g);
      guildsByShard.set(shardId, list);
    }

    const results = guildsByShard.size
      ? await Promise.all(
          Array.from(guildsByShard.entries()).map(([shardId, shardGuilds]) =>
            workerSocketHub
              .requestShard('discord-bot', shardId, 'ban-guilds', { userId, userTag, reason, guilds: shardGuilds })
              .catch(() => null)
          )
        )
      : [];
    const validResults = results.filter(Boolean);
    const handledGuildIds = new Set(validResults.flatMap((result) => result?.handledGuildIds || []));
    const result = {
      attemptedGuildCount: guilds.length,
      bannedCount: validResults.reduce((total, result) => total + (result?.bannedCount || 0), 0),
      alreadyBannedCount: validResults.reduce((total, result) => total + (result?.alreadyBannedCount || 0), 0),
      failedGuilds: validResults.flatMap((result) => result?.failedGuilds || []),
      permissionWarnings: validResults.flatMap((result) => result?.permissionWarnings || []),
      missingGuildIds: guilds.map((guild) => guild.id).filter((guildId) => !handledGuildIds.has(guildId)),
    };
    return result;
  }

  async enforceDiscordUnban(
    userId: string,
    guildIdsOrGuilds: Array<string | { id: string; staffChannelId?: string; logChannelId?: string }>,
    reason?: string,
    userTag?: string
  ): Promise<any> {
    const guilds = guildIdsOrGuilds.map((entry) => (typeof entry === 'string' ? { id: entry } : entry));
    const guildIds = guilds.map((g) => g.id);

    const guildsByShard = new Map<number, Array<{ id: string; staffChannelId?: string; logChannelId?: string }>>();
    for (const g of guilds) {
      if (!g?.id) continue;
      const shardId = this.discordShardForGuild(g.id);
      const list = guildsByShard.get(shardId) || [];
      list.push(g);
      guildsByShard.set(shardId, list);
    }

    const results = guildsByShard.size
      ? await Promise.all(
          Array.from(guildsByShard.entries()).map(([shardId, shardGuilds]) =>
            workerSocketHub
              .requestShard('discord-bot', shardId, 'unban-guilds', {
                userId,
                userTag,
                guildIds: shardGuilds.map((sg) => sg.id),
                guilds: shardGuilds,
                reason,
              })
              .catch(() => null)
          )
        )
      : [];
    const validResults = results.filter(Boolean);
    const handledGuildIds = new Set(validResults.flatMap((result) => result?.handledGuildIds || []));
    const result = {
      attemptedGuildCount: guildIds.length,
      unbannedCount: validResults.reduce((total, result) => total + (result?.unbannedCount || 0), 0),
      alreadyUnbannedCount: validResults.reduce((total, result) => total + (result?.alreadyUnbannedCount || 0), 0),
      failedGuilds: validResults.flatMap((result) => result?.failedGuilds || []),
      permissionWarnings: validResults.flatMap((result) => result?.permissionWarnings || []),
      missingGuildIds: guildIds.filter((guildId) => !handledGuildIds.has(guildId)),
    };
    return result;
  }

  async syncDiscordCustomBot(guildData: any): Promise<any> {
    if (!guildData?.id) throw new Error('Guild data with an ID is required');
    const targetShard = this.discordShardForGuild(guildData.id);
    return workerSocketHub.requestShard('discord-bot', targetShard, 'sync-custom-bot', { guildData });
  }
}

export const serviceClient = new ServiceClient();
