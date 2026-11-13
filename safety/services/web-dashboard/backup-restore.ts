import { ChannelType } from 'discord.js';

export async function restoreGuildBackup(guild: any, backup: any) {
  if (!guild || !backup) return false;

  // 1. Snapshot current members and their role names before wiping roles
  const currentMembers = await guild.members.fetch().catch(() => null);
  const existingMemberRolesMap = new Map<string, string[]>();
  if (currentMembers) {
    currentMembers.forEach((m: any) => {
      if (m.user?.bot) return;
      const rNames = m.roles.cache
        .filter((r: any) => r.name !== '@everyone' && !r.managed)
        .map((r: any) => r.name.toLowerCase());
      if (rNames.length > 0) {
        existingMemberRolesMap.set(m.id, rNames);
      }
    });
  }

  // 2. Delete ALL existing non-managed, deletable roles
  const currentRoles = await guild.roles.fetch().catch(() => new Map());
  for (const [, role] of currentRoles) {
    if (!role) continue;
    if (role.id === guild.id || role.name === '@everyone') continue;
    if (role.managed) continue;
    if (!role.editable) continue;

    try {
      await role.delete('Anti-Raid Server Rollback - Wiping Existing Roles').catch((e: any) => {
        console.error(`Failed to delete role "${role.name}" (${role.id}):`, e?.message);
      });
    } catch (e: any) {
      console.error(`Error deleting role "${role.name}":`, e?.message);
    }
  }

  const roleIdMap = new Map<string, string>();
  const roleNameMap = new Map<string, string>();

  const rolesList = Array.isArray(backup.roles) ? backup.roles : [];
  const everyoneBackupRole = rolesList.find((r: any) => r.name === '@everyone' || r.id === guild.id);
  if (everyoneBackupRole) {
    try {
      if (guild.roles.everyone && guild.roles.everyone.editable) {
        const perms = everyoneBackupRole.permissions?.toString() || '0';
        await guild.roles.everyone.setPermissions(BigInt(perms)).catch((e: any) => console.error('Set everyone perms failed:', e?.message));
      }
      if (guild.roles.everyone) {
        roleIdMap.set(everyoneBackupRole.id, guild.roles.everyone.id);
        roleNameMap.set('@everyone', guild.roles.everyone.id);
      }
    } catch (e: any) {
      console.error('Error restoring @everyone permissions:', e?.message);
    }
  }

  // 3. Recreate all roles from backup (sort descending so highest roles are created first and pushed to the top)
  const rolesToCreate = rolesList.filter((r: any) => r && r.name !== '@everyone' && !r.isManaged);
  rolesToCreate.sort((a: any, b: any) => (b.position || 0) - (a.position || 0));

  for (const r of rolesToCreate) {
    try {
      const perms = r.permissions?.toString() || '0';
      const createdRole = await guild.roles.create({
        name: r.name,
        color: r.color,
        hoist: r.hoist,
        mentionable: r.mentionable,
        permissions: BigInt(perms),
        reason: 'Anti-Raid Server Rollback - Recreating Role'
      });
      roleIdMap.set(r.id, createdRole.id);
      roleNameMap.set(r.name, createdRole.id);
      roleNameMap.set(r.name.toLowerCase(), createdRole.id);
    } catch (e: any) {
      console.error(`Error recreating role ${r.name}:`, e?.message);
    }
  }

  const existingChannels = await guild.channels.fetch().catch(() => new Map());
  const nonCategories: any[] = [];
  const categories: any[] = [];
  for (const [, ch] of existingChannels) {
    if (!ch) continue;
    if (ch.type === ChannelType.GuildCategory || ch.type === 4) {
      categories.push(ch);
    } else {
      nonCategories.push(ch);
    }
  }

  for (const ch of nonCategories) {
    try {
      await ch.delete('Anti-Raid Rollback Cleanup').catch(() => null);
    } catch (e) {}
  }
  for (const ch of categories) {
    try {
      await ch.delete('Anti-Raid Rollback Cleanup').catch(() => null);
    } catch (e) {}
  }

  const resolveOverwrites = (overwrites: any[]) => {
    if (!Array.isArray(overwrites)) return [];
    const resolved: any[] = [];
    const guildMemberIds = guild.members?.cache ? new Set(guild.members.cache.keys()) : null;

    for (const po of overwrites) {
      if (!po) continue;
      
      let overwriteType = 0; // 0 = Role, 1 = Member
      if (
        po.type === 1 || 
        po.type === '1' || 
        po.type === 'member' || 
        po.type === 'user' || 
        po.type === 'Member' || 
        po.type === 'User'
      ) {
        overwriteType = 1;
      }

      let targetId: string | undefined = undefined;

      if (overwriteType === 0) {
        targetId = roleIdMap.get(po.id);
        if (!targetId && po.roleName) {
          targetId = roleNameMap.get(po.roleName);
        }
        if (!targetId && (po.id === guild.id || po.roleName === '@everyone')) {
          targetId = guild.roles.everyone?.id || guild.id;
        }
        if (!targetId && currentRoles.has && currentRoles.has(po.id)) {
          targetId = po.id;
        }
      } else {
        if (!guildMemberIds || guildMemberIds.has(po.id)) {
          targetId = po.id;
        }
      }

      if (targetId) {
        try {
          const allowStr = po.allow?.toString() || '0';
          const denyStr = po.deny?.toString() || '0';
          resolved.push({
            id: targetId,
            type: overwriteType,
            allow: BigInt(allowStr),
            deny: BigInt(denyStr)
          });
        } catch (e) {}
      }
    }
    return resolved;
  };

  const categoryMap = new Map<string, string>();
  const categoryNameMap = new Map<string, string>();

  const backupCategories = Array.isArray(backup.categories) ? backup.categories : [];
  const sortedCategories = [...backupCategories].sort((a, b) => (a.position || 0) - (b.position || 0));
  for (const cat of sortedCategories) {
    if (!cat || !cat.name) continue;
    const catName = String(cat.name).trim().substring(0, 100);
    try {
      const createdCat = await guild.channels.create({
        name: catName,
        type: ChannelType.GuildCategory,
        position: typeof cat.position === 'number' ? cat.position : undefined,
        permissionOverwrites: resolveOverwrites(cat.permissionOverwrites),
        reason: 'Anti-Raid Server Rollback'
      });
      categoryMap.set(cat.id, createdCat.id);
      categoryNameMap.set(catName, createdCat.id);
    } catch (e: any) {
      console.warn(`Error recreating category ${catName} with overwrites:`, e?.message);
      try {
        const createdCat = await guild.channels.create({
          name: catName,
          type: ChannelType.GuildCategory,
          reason: 'Anti-Raid Server Rollback Fallback'
        });
        categoryMap.set(cat.id, createdCat.id);
        categoryNameMap.set(catName, createdCat.id);
      } catch (e2: any) {
        console.error(`Failed category ${catName}:`, e2?.message);
      }
    }
  }

  const hasCommunity = guild.features && (
    (Array.isArray(guild.features) && (guild.features.includes('COMMUNITY') || guild.features.includes('NEWS'))) ||
    (typeof guild.features.has === 'function' && (guild.features.has('COMMUNITY') || guild.features.has('NEWS')))
  );

  const backupChannels = Array.isArray(backup.channels) ? backup.channels : [];
  const sortedChannels = [...backupChannels].sort((a, b) => (a.position || 0) - (b.position || 0));

  for (const ch of sortedChannels) {
    if (!ch || !ch.name) continue;

    let parentId: string | undefined = undefined;
    if (ch.parentId) parentId = categoryMap.get(ch.parentId);
    if (!parentId && ch.parentName) parentId = categoryNameMap.get(ch.parentName);

    let channelType = ChannelType.GuildText;
    let rawType = ch.type;

    if (typeof rawType === 'string') {
      if (rawType === 'GUILD_TEXT' || rawType === '0') channelType = ChannelType.GuildText;
      else if (rawType === 'GUILD_VOICE' || rawType === '2') channelType = ChannelType.GuildVoice;
      else if (rawType === 'GUILD_ANNOUNCEMENT' || rawType === 'GUILD_NEWS' || rawType === '5') {
        channelType = hasCommunity ? ChannelType.GuildAnnouncement : ChannelType.GuildText;
      }
      else if (rawType === 'GUILD_STAGE_VOICE' || rawType === '13') {
        channelType = hasCommunity ? ChannelType.GuildStageVoice : ChannelType.GuildVoice;
      }
      else if (rawType === 'GUILD_FORUM' || rawType === '15') {
        channelType = hasCommunity ? ChannelType.GuildForum : ChannelType.GuildText;
      }
      else if (rawType === 'GUILD_MEDIA' || rawType === '16') {
        channelType = hasCommunity ? ChannelType.GuildMedia : ChannelType.GuildText;
      }
      else if (!isNaN(Number(rawType))) {
        rawType = Number(rawType);
      }
    }

    if (typeof rawType === 'number') {
      if (rawType === 0) channelType = ChannelType.GuildText;
      else if (rawType === 2) channelType = ChannelType.GuildVoice;
      else if (rawType === 4) channelType = ChannelType.GuildCategory;
      else if (rawType === 5) channelType = hasCommunity ? ChannelType.GuildAnnouncement : ChannelType.GuildText;
      else if (rawType === 13) channelType = hasCommunity ? ChannelType.GuildStageVoice : ChannelType.GuildVoice;
      else if (rawType === 15) channelType = hasCommunity ? ChannelType.GuildForum : ChannelType.GuildText;
      else if (rawType === 16) channelType = hasCommunity ? ChannelType.GuildMedia : ChannelType.GuildText;
      else channelType = ChannelType.GuildText;
    }

    const channelName = String(ch.name || 'unnamed-channel').trim().substring(0, 100);
    const isTextOrNews = channelType === ChannelType.GuildText || channelType === ChannelType.GuildAnnouncement;
    const isVoiceOrStage = channelType === ChannelType.GuildVoice || channelType === ChannelType.GuildStageVoice;

    const channelOptions: any = {
      name: channelName,
      type: channelType,
      reason: 'Anti-Raid Server Rollback'
    };

    if (parentId && guild.channels.cache.has(parentId)) {
      channelOptions.parent = parentId;
    }

    if (typeof ch.position === 'number') {
      channelOptions.position = ch.position;
    }

    const cleanOverwrites = resolveOverwrites(ch.permissionOverwrites);
    if (cleanOverwrites.length > 0) {
      channelOptions.permissionOverwrites = cleanOverwrites;
    }

    if (isTextOrNews) {
      if (ch.topic) channelOptions.topic = String(ch.topic).substring(0, 1024);
      if (typeof ch.rateLimitPerUser === 'number') {
        channelOptions.rateLimitPerUser = Math.min(Math.max(ch.rateLimitPerUser, 0), 21600);
      }
      if (typeof ch.nsfw === 'boolean') {
        channelOptions.nsfw = ch.nsfw;
      }
    }

    if (isVoiceOrStage) {
      if (typeof ch.bitrate === 'number' && ch.bitrate >= 8000) {
        channelOptions.bitrate = Math.min(ch.bitrate, guild.maximumBitrate || 96000);
      }
      if (typeof ch.userLimit === 'number' && ch.userLimit > 0) {
        channelOptions.userLimit = Math.min(Math.max(ch.userLimit, 0), 99);
      }
    }

    try {
      await guild.channels.create(channelOptions);
    } catch (err1: any) {
      console.warn(`Primary creation failed for channel "${channelName}" (${err1?.message}). Attempting secondary creation...`);
      try {
        const secType = isVoiceOrStage ? ChannelType.GuildVoice : ChannelType.GuildText;
        const secOptions: any = {
          name: channelName,
          type: secType,
          reason: 'Anti-Raid Server Rollback Fallback'
        };
        if (parentId && guild.channels.cache.has(parentId)) secOptions.parent = parentId;
        if (cleanOverwrites.length > 0) secOptions.permissionOverwrites = cleanOverwrites;
        if (ch.topic && secType === ChannelType.GuildText) secOptions.topic = String(ch.topic).substring(0, 1024);

        await guild.channels.create(secOptions);
      } catch (err2: any) {
        console.warn(`Secondary creation failed for channel "${channelName}" (${err2?.message}). Attempting bare minimum creation...`);
        try {
          const bareType = isVoiceOrStage ? ChannelType.GuildVoice : ChannelType.GuildText;
          await guild.channels.create({
            name: channelName,
            type: bareType,
            reason: 'Anti-Raid Server Rollback Bare Fallback'
          });
        } catch (err3: any) {
          console.error(`Error recreating channel ${channelName}:`, err3?.message);
        }
      }
    }
  }

  if (backup.serverDetails) {
    try {
      const editData: any = {};
      if (backup.serverDetails.name) editData.name = backup.serverDetails.name;
      if (backup.serverDetails.verificationLevel !== undefined) editData.verificationLevel = backup.serverDetails.verificationLevel;
      if (backup.serverDetails.explicitContentFilter !== undefined) editData.explicitContentFilter = backup.serverDetails.explicitContentFilter;
      if (backup.serverDetails.defaultMessageNotifications !== undefined) editData.defaultMessageNotifications = backup.serverDetails.defaultMessageNotifications;
      if (backup.serverDetails.afkTimeout !== undefined) editData.afkTimeout = backup.serverDetails.afkTimeout;
      if (Object.keys(editData).length > 0) {
        await guild.edit(editData).catch((e: any) => console.error('Guild edit failed:', e?.message));
      }
    } catch (e: any) {
      console.error('Error restoring server details:', e?.message);
    }
  }

  // Unban all currently banned users in the server first
  try {
    const currentBans = await guild.bans.fetch().catch(() => null);
    if (currentBans) {
      for (const [userId] of currentBans) {
        try {
          await guild.bans.remove(userId, 'Anti-Raid Server Rollback - Unbanning existing bans prior to restore').catch((e: any) => {
            console.error(`Failed to unban user ${userId}:`, e?.message);
          });
        } catch (e: any) {
          console.error(`Error unbanning user ${userId}:`, e?.message);
        }
      }
    }
  } catch (e: any) {
    console.error('Error fetching current server bans during restore:', e?.message);
  }

  // Ban everyone from the restore point
  if (Array.isArray(backup.bans) && backup.bans.length > 0) {
    for (const ban of backup.bans) {
      if (!ban || !ban.userId) continue;
      try {
        await guild.bans.create(ban.userId, { reason: ban.reason || 'Restored from Anti-Raid Server Backup' }).catch((e: any) => {
          console.error(`Failed to ban user ${ban.userId} from restore point:`, e?.message);
        });
      } catch (e: any) {
        console.error(`Error banning user ${ban.userId} from restore point:`, e?.message);
      }
    }
  }

  // 4. Re-assign newly recreated roles back on members
  try {
    const targetMembers = await guild.members.fetch().catch(() => currentMembers);
    if (targetMembers) {
      const backupMembers = Array.isArray(backup.members) ? backup.members : [];
      const backupMembersMap = new Map<string, { roles: string[]; roleNames: string[] }>();
      for (const bm of backupMembers) {
        if (bm && bm.userId) {
          backupMembersMap.set(bm.userId, {
            roles: Array.isArray(bm.roles) ? bm.roles : [],
            roleNames: Array.isArray(bm.roleNames) ? bm.roleNames : []
          });
        }
      }

      for (const [, member] of targetMembers) {
        if (!member || member.user?.bot) continue;

        const rolesToAddIds = new Set<string>();

        // 1. Check if member has role mappings in backup.members
        const bMember = backupMembersMap.get(member.id);
        if (bMember) {
          for (const oldRoleId of bMember.roles) {
            const newRoleId = roleIdMap.get(oldRoleId);
            if (newRoleId) rolesToAddIds.add(newRoleId);
          }
          for (const roleName of bMember.roleNames) {
            if (roleName) {
              const newRoleId = roleNameMap.get(roleName.toLowerCase());
              if (newRoleId) rolesToAddIds.add(newRoleId);
            }
          }
        }

        // 2. Fallback: if backup.members didn't list this member, check pre-wipe member roles
        if (rolesToAddIds.size === 0 && existingMemberRolesMap.has(member.id)) {
          const preWipeRoleNames = existingMemberRolesMap.get(member.id) || [];
          for (const rName of preWipeRoleNames) {
            const newRoleId = roleNameMap.get(rName);
            if (newRoleId) rolesToAddIds.add(newRoleId);
          }
        }

        if (rolesToAddIds.size > 0) {
          try {
            await member.roles.add(Array.from(rolesToAddIds), 'Anti-Raid Server Rollback - Restoring Member Roles').catch((e: any) => {
              console.error(`Failed to re-assign roles to member ${member.user?.tag || member.id}:`, e?.message);
            });
          } catch (e: any) {
            console.error(`Error adding roles back to member ${member.id}:`, e?.message);
          }
        }
      }
    }
  } catch (e: any) {
    console.error('Error re-assigning member roles during restore:', e?.message);
  }

  return true;
}
