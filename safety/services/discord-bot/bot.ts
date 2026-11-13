import {
  Client,
  GatewayIntentBits,
  Partials,
  Events,
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
  ActivityType,
} from 'discord.js';
import { ShardConfig, getShardConfiguration } from './k8s-sharding';
import { config as appConfig } from '../shared/config';
import {
  User,
  BanCase,
  Guild,
  CustomBanlist,
  Log,
  ServerBackup,
  createGuildBackup,
  buildTransparentBanDM,
} from '../shared/models';

export async function createDiscordBot(shardConfig: ShardConfig = getShardConfiguration()): Promise<Client> {
  const clientOptions: any = {
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildVoiceStates,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
  };

  if (shardConfig.isSharded) {
    clientOptions.shards = [shardConfig.shardId];
    clientOptions.shardCount = shardConfig.shardCount;
    console.log(`[Discord Bot] Configuring client for Shard ${shardConfig.shardId} of ${shardConfig.shardCount}`);
  } else {
    console.log('[Discord Bot] Configuring client in standalone / single-shard mode.');
  }

  const client = new Client(clientOptions);

  client.on('error', (error) => {
    console.error(`[Discord Client Shard ${shardConfig.shardId}] Error:`, error);
  });

  let presenceUpdateInterval: ReturnType<typeof setInterval> | null = null;

  const applyBotPresence = (specificShardId?: number) => {
    if (!client.user) return;
    const defaultShardId = shardConfig.shardId ?? client.shard?.ids?.[0] ?? 0;
    const wsShardIds = client.ws?.shards?.size
      ? Array.from(client.ws.shards.keys())
      : client.shard?.ids?.length
      ? [...client.shard.ids]
      : [defaultShardId];

    const targetShardIds = typeof specificShardId === 'number' ? [specificShardId] : wsShardIds;
    const statusText = 'Keeping you safe with love ❤️';

    for (const sId of targetShardIds) {
      client.user.setPresence({
        activities: [{ name: statusText, type: ActivityType.Custom }],
        status: 'online',
        shardId: sId,
      });
    }
  };

  client.on(Events.ShardReady, (readyShardId) => {
    applyBotPresence(readyShardId);
  });

  client.on(Events.ClientReady, (readyClient) => {
    console.log(
      `[Discord Bot] Logged in as ${readyClient.user.tag}! (Shard ${shardConfig.shardId}/${shardConfig.shardCount}) Serving ${readyClient.guilds.cache.size} guilds.`
    );
    applyBotPresence();
    if (presenceUpdateInterval) clearInterval(presenceUpdateInterval);
    presenceUpdateInterval = setInterval(() => applyBotPresence(), 5 * 60 * 1000);
  });

  // Attach command and event listeners
  attachCommandHandlers(client, shardConfig);
  attachModerationHandlers(client, shardConfig);

  // Sync slash commands globally if we are Shard 0 or single shard
  if (shardConfig.shardId === 0 && appConfig.discordToken) {
    registerSlashCommands(client).catch((err) => {
      console.warn('[Discord Bot] Initial slash command sync notice:', err?.message || err);
    });
  }

  return client;
}

export async function registerSlashCommands(
  client: Client,
  ageVerifyDisabled = false
): Promise<{ success: boolean; count: number; ageVerifyDisabled: boolean; error?: string }> {
  if (!appConfig.discordToken) {
    return { success: false, count: 0, ageVerifyDisabled, error: 'DISCORD_TOKEN is not configured' };
  }

  const commands = [
    new SlashCommandBuilder().setName('help').setDescription('View available commands and documentation'),
    new SlashCommandBuilder()
      .setName('check')
      .setDescription('Check global ban status, reputation, VRChat links, or Ban Case #')
      .addUserOption((option) => option.setName('user').setDescription('The Discord user to check (optional)').setRequired(false))
      .addStringOption((option) =>
        option.setName('query').setDescription('Discord ID, VRChat ID (usr_...), username, or Case #').setRequired(false)
      ),
    new SlashCommandBuilder()
      .setName('report')
      .setDescription('Submit a safety report via the web portal')
      .addUserOption((option) => option.setName('target').setDescription('User to report (optional)').setRequired(false)),
    new SlashCommandBuilder()
      .setName('status')
      .setDescription('View system and shard operational status'),
    new SlashCommandBuilder()
      .setName('info')
      .setDescription('Information about BeSafe Network and safety tools'),
    new SlashCommandBuilder()
      .setName('setup')
      .setDescription('Link this server to your BeSafe Network dashboard')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    new SlashCommandBuilder()
      .setName('verify')
      .setDescription('Verify yourself to gain access to the server'),
    new SlashCommandBuilder()
      .setName('warn')
      .setDescription('Issue a warning to a user')
      .addUserOption((opt) => opt.setName('target').setDescription('The user to warn').setRequired(true))
      .addStringOption((opt) => opt.setName('reason').setDescription('Reason for warning').setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    new SlashCommandBuilder()
      .setName('backup')
      .setDescription('Anti-raid server backup and snapshot system')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addSubcommand((sub) =>
        sub.setName('create').setDescription('Take an instant full backup snapshot').addStringOption((opt) =>
          opt.setName('name').setDescription('Custom snapshot label').setRequired(false)
        )
      )
      .addSubcommand((sub) => sub.setName('list').setDescription('List saved backup snapshots')),
  ];

  try {
    const rest = new REST({ version: '10' }).setToken(appConfig.discordToken);
    const appId = client.application?.id || appConfig.discordClientId || client.user?.id;
    if (appId) {
      console.log(`[Discord Bot] Registering ${commands.length} application commands with Discord REST API...`);
      await rest.put(Routes.applicationCommands(appId), {
        body: commands.map((c) => c.toJSON()),
      });
      console.log('[Discord Bot] Successfully registered global application commands.');
      return { success: true, count: commands.length, ageVerifyDisabled };
    }
    return { success: false, count: 0, ageVerifyDisabled, error: 'Discord application ID is unavailable' };
  } catch (err: any) {
    console.error('[Discord Bot] Failed to register application commands:', err?.message || err);
    return { success: false, count: 0, ageVerifyDisabled, error: err?.message || 'Command registration failed' };
  }
}

function attachCommandHandlers(client: Client, shardConfig: ShardConfig) {
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    try {
      if (commandName === 'status') {
        const uptimeSeconds = Math.floor((client.uptime || 0) / 1000);
        const embed = new EmbedBuilder()
          .setTitle('🛡️ BeSafe Network | Shard Status')
          .setColor(0x10b981)
          .addFields(
            { name: 'Shard ID', value: `${shardConfig.shardId} / ${shardConfig.shardCount}`, inline: true },
            { name: 'Gateway Ping', value: `${client.ws.ping}ms`, inline: true },
            { name: 'Cached Guilds', value: `${client.guilds.cache.size}`, inline: true },
            { name: 'Uptime', value: `${uptimeSeconds}s`, inline: true },
            { name: 'Mode', value: shardConfig.isSharded ? 'Distributed Shard' : 'Standalone', inline: true }
          )
          .setFooter({ text: 'BeSafe Global Enforcement Network' });

        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      if (commandName === 'check') {
        await interaction.deferReply({ ephemeral: true });
        const targetUser = interaction.options.getUser('user');
        const query = interaction.options.getString('query');
        const searchId = targetUser?.id || query?.trim();

        if (!searchId) {
          return interaction.editReply({
            content: '❌ Please provide a user mention or a query (Discord ID, VRChat ID, username, or Case #).',
          });
        }

        const banCase = await BanCase.findOne({
          $or: [
            { caseNumber: new RegExp(`^${searchId}$`, 'i') },
            { 'discordAccounts.discordId': searchId },
            { 'discordAccounts.username': new RegExp(`^${searchId}$`, 'i') },
            { 'vrchatAccounts.vrchatUserId': searchId },
          ],
        });

        const dbUser = await User.findOne({
          $or: [{ id: searchId }, { username: new RegExp(`^${searchId}$`, 'i') }, { vrchatUserId: searchId }],
        });

        if (banCase && banCase.status === 'active') {
          const embed = new EmbedBuilder()
            .setTitle(`🚨 Security Blacklist Hit: Case #${banCase.caseNumber}`)
            .setColor(0xdc2626)
            .setDescription(`**Subject:** ${banCase.title || searchId}\n**Violation:** ${banCase.reason}\n**Severity:** ${banCase.severity}\n**Trust Index:** ${banCase.trustIndex}`)
            .addFields(
              { name: 'Status', value: 'ACTIVE BLACKLIST', inline: true },
              { name: 'Banned At', value: banCase.bannedAt ? new Date(banCase.bannedAt).toLocaleDateString() : 'Unknown', inline: true }
            );
          return interaction.editReply({ embeds: [embed] });
        }

        if (dbUser && dbUser.isBanned) {
          const embed = new EmbedBuilder()
            .setTitle('🚨 Blacklisted User')
            .setColor(0xdc2626)
            .setDescription(`**User:** ${dbUser.username || dbUser.id}\n**Reason:** ${dbUser.banReason || 'Banned'}\n**Reputation:** ${dbUser.reputation || 0}`);
          return interaction.editReply({ embeds: [embed] });
        }

        const embed = new EmbedBuilder()
          .setTitle('✅ Clean Standing')
          .setColor(0x10b981)
          .setDescription(`No active infractions found for **${searchId}**.`);
        return interaction.editReply({ embeds: [embed] });
      }

      if (commandName === 'report') {
        const target = interaction.options.getUser('target');
        const reportUrl = `${appConfig.appUrl}/report${target ? `?targetId=${target.id}` : ''}`;
        return interaction.reply({
          content: `📢 **Submit a Safety Report**\nPlease submit reports directly through our secure portal:\n👉 **[BeSafe Network Report Portal](${reportUrl})**`,
          ephemeral: true,
        });
      }

      if (commandName === 'help' || commandName === 'info') {
        const embed = new EmbedBuilder()
          .setTitle('🛡️ BeSafe Network | Documentation & Commands')
          .setColor(0x3b82f6)
          .setDescription('Automated global identity security, cross-platform reputation, and moderation network.')
          .addFields(
            { name: '/check', value: 'Check reputation and global ban standing' },
            { name: '/report', value: 'File a safety violation report' },
            { name: '/status', value: 'View bot and shard status' },
            { name: '/backup', value: 'Anti-raid server backup snapshots (Admin)' },
            { name: '/setup', value: 'Connect this server to the web dashboard (Admin)' }
          )
          .setFooter({ text: `Shard ${shardConfig.shardId}/${shardConfig.shardCount}` });
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      if (commandName === 'backup') {
        const sub = interaction.options.getSubcommand();
        if (!interaction.guild) return;

        if (sub === 'create') {
          await interaction.deferReply({ ephemeral: true });
          const name = interaction.options.getString('name') || undefined;
          const backup = await createGuildBackup(
            interaction.guild,
            interaction.user.id,
            interaction.user.tag,
            name
          );
          return interaction.editReply({
            content: `✅ Backup snapshot created successfully!\n**Snapshot ID:** \`${backup._id}\`\n**Name:** ${backup.name}\n**Channels:** ${backup.channels?.length || 0} | **Roles:** ${backup.roles?.length || 0}`,
          });
        }

        if (sub === 'list') {
          const backups = await ServerBackup.find({ guildId: interaction.guild.id }).sort({ createdAt: -1 }).limit(10);
          if (backups.length === 0) {
            return interaction.reply({ content: 'No backup snapshots found for this server.', ephemeral: true });
          }
          const list = backups.map((b) => `• \`${b._id}\` - **${b.name}** (${new Date(b.createdAt).toLocaleDateString()})`).join('\n');
          return interaction.reply({ content: `📁 **Saved Backups:**\n${list}`, ephemeral: true });
        }
      }
    } catch (err: any) {
      console.error('[Discord Command Handler Error]:', err);
      if (!interaction.replied && !interaction.deferred) {
        interaction.reply({ content: '❌ An error occurred executing this command.', ephemeral: true }).catch(() => null);
      }
    }
  });
}

function attachModerationHandlers(client: Client, _shardConfig: ShardConfig) {
  // Guild Join: auto-register guild in database
  client.on(Events.GuildCreate, async (guild) => {
    try {
      console.log(`[Discord Bot] Joined guild: ${guild.name} (${guild.id})`);
      await Guild.findOneAndUpdate(
        { id: guild.id },
        {
          $setOnInsert: {
            name: guild.name,
            ownerId: guild.ownerId,
            settings: {
              autoBanThreshold: -10,
              warningThreshold: 3,
              tempBanDuration: 7,
              autoBanEnabled: false,
            },
          },
        },
        { upsert: true, new: true }
      );
    } catch (e) {}
  });

  // Member Join: automated blacklist check & enforcement
  client.on(Events.GuildMemberAdd, async (member) => {
    try {
      const guildData = await Guild.findOne({ id: member.guild.id });
      if (!guildData || !guildData.settings?.autoBanEnabled) return;

      const banCase = await BanCase.findOne({
        status: 'active',
        'discordAccounts.discordId': member.id,
      });

      if (banCase) {
        const dmPayload = buildTransparentBanDM({
          userId: member.id,
          reason: banCase.reason,
          caseNumber: banCase.caseNumber,
          severity: banCase.severity,
          evidenceLinks: banCase.evidenceLinks || [],
          serverName: member.guild.name,
          baseUrl: appConfig.appUrl
        });
        await member.send(dmPayload).catch(() => null);
        await member.ban({ reason: `BeSafe Network Auto-Ban: Ban Case #${banCase.caseNumber}` });
        await new Log({
          action: 'DISCORD_AUTO_BAN',
          adminId: 'SYSTEM_BOT',
          targetId: member.id,
          details: `Auto-banned user ${member.user.tag} (${member.id}) from ${member.guild.name}. Reason: ${banCase.reason}`,
        }).save();

        const logChannelId = guildData.settings.logChannelId || guildData.settings.staffChannelId;
        if (logChannelId) {
          const channel = member.guild.channels.cache.get(logChannelId) as any;
          if (channel) {
            channel.send(`🚨 **Global Ban Enforced**: User **${member.user.tag}** was automatically banned.\nCase #${banCase.caseNumber}: ${banCase.reason}`).catch(() => null);
          }
        }
      }
    } catch (e: any) {
      console.error('[GuildMemberAdd Handler Error]:', e?.message || e);
    }
  });
}
