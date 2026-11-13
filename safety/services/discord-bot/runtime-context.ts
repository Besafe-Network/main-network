import { Client } from 'discord.js';
import * as models from '../shared/models';
import { notifyAdmins } from '../shared/email';
import { restoreGuildBackup } from '../web-dashboard/backup-restore';
import { findUserByQuery } from '../web-dashboard/user-lookup';

export function createDiscordRuntimeContext(fetchVRChatDisplayName: (vrchatUserId: string) => Promise<string | null>) {
  const clientRef: { current?: Client } = {};
  const guildClientResolverRef: { current?: (guildId: string) => any } = {};

  async function cleanupUserDatabaseForTrustedOnly() {
    try {
      await models.User.updateMany({}, {
        $unset: {
          isBanned: 1,
          banReason: 1,
          banType: 1,
          bannedBy: 1,
          bannedAt: 1,
          banExpiresAt: 1,
          banCaseId: 1,
        },
      });
      const result = await models.User.deleteMany({
        isTrusted: { $ne: true },
        isAgeVerified: { $ne: true },
        $or: [{ reputation: { $in: [0, null] } }, { reputation: { $exists: false } }],
        $and: [{ 'warnings.0': { $exists: false } }],
      });
      console.log(`[User DB Cleanup] Purged ${result.deletedCount || 0} non-trusted records.`);
      return result.deletedCount || 0;
    } catch (error) {
      console.error('[User DB Cleanup Error]:', error);
      return 0;
    }
  }

  async function checkAndAutoVerifyFromDiscord(options: {
    email?: string | null;
    adminId?: any;
    discordId?: string | null;
  }) {
    try {
      const email = options.email ? String(options.email).trim().toLowerCase() : null;
      const discordId = options.discordId ? String(options.discordId).trim() : null;
      if (!email && !discordId) return null;

      let verifiedUser: any = email
        ? await models.User.findOne({ email, isAgeVerified: true })
        : null;
      if (!verifiedUser && discordId) {
        verifiedUser = await models.User.findOne({ id: discordId, isAgeVerified: true });
      }

      let approvedRequest: any = email
        ? await models.VerificationRequest.findOne({ email, status: 'approved' }).sort({ updatedAt: -1 })
        : null;
      if (!approvedRequest && discordId) {
        approvedRequest = await models.VerificationRequest.findOne({ userId: discordId, status: 'approved' }).sort({ updatedAt: -1 });
      }
      if (!verifiedUser && approvedRequest?.userId) {
        verifiedUser = await models.User.findOne({ id: approvedRequest.userId, isAgeVerified: true });
      }
      if (!verifiedUser && !approvedRequest) return null;

      const rawDob = verifiedUser?.dob || approvedRequest?.dob;
      const dob = rawDob ? new Date(rawDob) : new Date('2000-01-01');
      const ageVerifiedAt = verifiedUser?.ageVerifiedAt || approvedRequest?.updatedAt || new Date();
      const matchedDiscordId = verifiedUser?.id || (approvedRequest?.source === 'discord' ? approvedRequest.userId : discordId);
      const adminQuery = options.adminId
        ? { _id: options.adminId }
        : email
          ? { email }
          : matchedDiscordId
            ? { discordId: matchedDiscordId }
            : null;
      let admin: any = null;
      if (adminQuery) {
        admin = await models.Admin.findOneAndUpdate(adminQuery, {
          $set: {
            isAgeVerified: true,
            dob,
            ageVerifiedAt,
            isEmailVerified: true,
            ...(matchedDiscordId ? { discordId: matchedDiscordId } : {}),
          },
        }, { new: true });
      }

      if (matchedDiscordId) {
        await models.User.findOneAndUpdate({ id: matchedDiscordId }, {
          $set: { isAgeVerified: true, dob, ageVerifiedAt, ...(email ? { email } : {}) },
        }, { upsert: true });
      }

      const existingRequest = await models.VerificationRequest.findOne({
        $or: [
          ...(email ? [{ email, status: 'approved' as const }] : []),
          ...(matchedDiscordId ? [{ userId: matchedDiscordId, status: 'approved' as const }] : []),
        ],
      });
      if (!existingRequest && (email || matchedDiscordId)) {
        await new models.VerificationRequest({
          userId: matchedDiscordId || admin?._id?.toString() || 'web',
          username: admin?.username || verifiedUser?.username || '',
          email: email || verifiedUser?.email || '',
          source: 'discord',
          dob,
          status: 'approved',
          adminNotes: 'Auto-verified: email matches already verified Discord user',
        }).save().catch(() => null);
      }
      await new models.Log({
        action: 'AUTO_AGE_VERIFIED',
        adminId: 'SYSTEM',
        targetId: email || matchedDiscordId || 'User',
        details: `Auto-verified account: email ${email || 'N/A'} matches verified Discord user (${matchedDiscordId || 'N/A'}). DOB: ${dob.toISOString().split('T')[0]}`,
      }).save().catch(() => null);
      return { matched: true, email: email || verifiedUser?.email || approvedRequest?.email, discordId: matchedDiscordId, dob, ageVerifiedAt, admin, verifiedDiscordUser: verifiedUser, approvedReq: approvedRequest };
    } catch (error) {
      console.error('Error in checkAndAutoVerifyFromDiscord:', error);
      return null;
    }
  }

  async function getDesiredGlobalDiscordBans() {
    const desired = new Map<string, string>();
    const activeCases = await models.BanCase.find({ status: 'active' }).catch(() => []);
    for (const banCase of activeCases) {
      const reason = `Ban Case #${banCase.caseNumber}: ${banCase.reason}`;
      for (const account of banCase.discordAccounts || []) {
        const id = String(account?.discordId || '').trim();
        if (id && models.isValidDiscordSnowflake(id) && !desired.has(id)) {
          desired.set(id, reason);
        }
      }
    }

    const legacyBannedUsers = await models.User.find({ isBanned: true })
      .select('id isTrusted banReason')
      .lean()
      .catch(() => []);
    for (const user of legacyBannedUsers) {
      const id = String((user as any).id || '').trim();
      if (!id || !models.isValidDiscordSnowflake(id) || (user as any).isTrusted) continue;
      if (!desired.has(id)) {
        desired.set(id, (user as any).banReason || 'Global Banlist Violation');
      }
    }

    const candidateIds = [...desired.keys()];
    if (candidateIds.length > 0) {
      const knownUsers = await models.User.find({ id: { $in: candidateIds } })
        .select('id isTrusted')
        .lean()
        .catch(() => []);
      for (const knownUser of knownUsers) {
        if ((knownUser as any).isTrusted) desired.delete(String((knownUser as any).id));
      }
    }

    return { activeCases, desired };
  }

  async function syncAllBansAcrossPlatforms() {
    const discordClient = clientRef.current;
    const { activeCases, desired } = await getDesiredGlobalDiscordBans();
    const enabledGuilds = await models.Guild.find({ 'settings.autoBanEnabled': true }).catch(() => []);
    let discordBansCount = 0;
    let skippedCount = 0;

    for (const guildData of enabledGuilds) {
      const guildId = guildData.id;
      const targetClient = guildClientResolverRef.current?.(guildId) || discordClient;
      if (!targetClient?.guilds?.cache) continue;
      const guild = targetClient.guilds.cache.get(guildId);
      if (!guild) continue;

      const selectionMode = guildData.settings?.banlistSelectionMode || 'global';
      const allowGlobalBans = selectionMode !== 'custom';
      const channelId = guildData.settings?.staffChannelId || guildData.settings?.logChannelId;
      const channel = channelId ? guild.channels.cache.get(channelId) : null;

      let existingBans: any = null;
      try {
        existingBans = await guild.bans.fetch();
      } catch {
        existingBans = null;
      }
      const bannedIds = existingBans ? new Set(existingBans.keys()) : null;

      if (allowGlobalBans) {
        for (const [userId, reason] of desired) {
          let alreadyBanned = false;
          if (bannedIds) {
            alreadyBanned = bannedIds.has(userId);
          } else {
            try {
              alreadyBanned = !!(await guild.bans.fetch(userId));
            } catch {
              alreadyBanned = false;
            }
          }
          if (alreadyBanned) continue;

          try {
            await guild.bans.create(userId, { reason: `BeSafe Network Global Ban: ${reason}` });
            discordBansCount += 1;
            if (channel?.isTextBased()) {
              await channel.send(`🚨 **Global Ban Enforced**: User ${userId} was automatically banned.\nReason: ${reason}`).catch(() => null);
            }
          } catch {
            skippedCount += 1;
          }
        }
      }

      // Unbans are only performed via explicit admin actions (e.g. admin dashboard
      // unban / ban-case lift), never by this periodic sync.
    }

    return { activeCasesCount: activeCases.length, discordBansCount, discordUnbansCount: 0, vrchatBansCount: 0, skippedCount, discordSkippedCount: skippedCount, vrchatSkippedCount: 0 };
  }

  return {
    context: {
      ...models,
      cleanupUserDatabaseForTrustedOnly,
      syncAllBansAcrossPlatforms,
      findUserByQuery,
      serviceClient: { fetchVRChatDisplayName },
      resolveDiscordUser: models.resolveDiscordUser,
      getWatchlistAvatar: models.getWatchlistAvatar,
      checkAndAutoVerifyFromDiscord,
      restoreGuildBackup,
      notifyAdmins,
      serviceName: 'discord-bot',
      setSyncDiscordCommandsRef: () => {},
    },
    setClient(client: Client) {
      clientRef.current = client;
    },
    setGuildClientResolver(resolver?: (guildId: string) => any) {
      guildClientResolverRef.current = resolver;
    },
  };
}