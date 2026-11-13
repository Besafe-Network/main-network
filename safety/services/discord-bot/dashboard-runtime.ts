import axios from 'axios';
import { PassThrough } from 'stream';
import {
  Client,
  GatewayIntentBits,
  Partials,
  Events,
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActivityType,
  ContextMenuCommandBuilder,
  ApplicationCommandType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ChannelType,
  EmbedBuilder,
} from 'discord.js';
import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  StreamType,
  NoSubscriberBehavior,
  getVoiceConnection,
  VoiceConnectionStatus,
  entersState,
} from '@discordjs/voice';
import { ShardConfig } from './k8s-sharding';
import { buildTransparentBanDM, calculateDynamicTrustIndex, isValidDiscordSnowflake } from '../shared/models';

export function createDashboardDiscordRuntime(context: any, shardConfig?: ShardConfig) {
  const { SystemConfig, Guild, cleanupUserDatabaseForTrustedOnly, syncAllBansAcrossPlatforms, findUserByQuery, serviceClient, resolveDiscordUser, getWatchlistAvatar, User, VerificationRequest, Log, ReputationRating, Admin, LinkCode, checkAndAutoVerifyFromDiscord, createGuildBackup, ServerBackup, restoreGuildBackup, extractVRChatUserId, Report, safeSaveReport, notifyAdmins, BanCase, CustomBanlist, getAllVRChatAccounts, downloadImageForScan, scanImageBufferWithNsfwjs, serviceName, setSyncDiscordCommandsRef } = context;
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
  if (shardConfig?.isSharded) {
    clientOptions.shards = [shardConfig.shardId];
    clientOptions.shardCount = shardConfig.shardCount;
  }
  const client = new Client(clientOptions);

  client.on('error', (error) => {
    console.error('Discord Client encounterd an error:', error);
  });

  process.on('unhandledRejection', (reason: any) => {
    console.error('[Unhandled Rejection]', reason?.message || reason);
  });

  process.on('uncaughtException', (err: any) => {
    console.error('[Uncaught Exception]', err?.message || err);
  });

  // --- CreatorPlaza Radio Infrastructure ---
  const CREATORPLAZA_RADIO = {
    name: 'CreatorPlaza Radio',
    streamUrl: 'https://stream.creatorplaza.nl/main/',
    websiteUrl: 'https://creatorplaza.nl/radio',
    apiUrl: 'https://testing.creatorplaza.nl/api/nowplaying/creatorplaza_radio',
    color: 0xf97316,
    iconUrl: 'https://creatorplaza.nl/radio'
  };

  interface RadioSession {
    guildId: string;
    channelId: string;
    connection: any;
    player: any;
    resource: any;
    httpStream?: any;
    bufferStream?: PassThrough;
    volume: number; // 1 - 100
    startedAt: Date;
    startedBy: { id: string; username: string };
    reconnectAttempts: number;
    isStopped?: boolean;
  }

  const radioSessions = new Map<string, RadioSession>();

  function isGuildOwnedByThisShard(guildId?: string | null): boolean {
    if (!guildId) return false;
    const shardCount = shardConfig?.shardCount || 1;
    if (shardCount <= 1) return true;
    const shardId = shardConfig?.shardId ?? 0;
    try {
      return Number((BigInt(guildId) >> 22n) % BigInt(shardCount)) === shardId;
    } catch {
      return client.guilds.cache.has(guildId);
    }
  }

  function getVoiceGroupForGuild(guildId: string): string {
    const shardId = shardConfig?.shardId ?? 0;
    return `shard-${shardId}-guild-${guildId}`;
  }

  async function fetchCreatorPlazaNowPlaying(): Promise<{
    title: string;
    artist: string;
    artUrl?: string;
    listeners: number;
    isOnline: boolean;
    history?: Array<{ title: string; artist: string }>;
  }> {
    try {
      const res = await axios.get(CREATORPLAZA_RADIO.apiUrl, { timeout: 6000 });
      const data = res.data;
      const song = data?.now_playing?.song;
      let title = (song?.title || song?.text || 'CreatorPlaza Radio Live Stream').trim();
      let artist = (song?.artist || '').trim();

      // If artist is blank or empty, try extracting from "Artist - Title" format
      if (!artist && title.includes(' - ')) {
        const parts = title.split(' - ');
        artist = parts[0].trim();
        title = parts.slice(1).join(' - ').trim();
      } else if (!artist) {
        artist = 'CreatorPlaza Radio';
      }

      const listeners = data?.listeners?.current ?? data?.listeners?.total ?? 0;
      const isOnline = data?.is_online !== false;
      const artUrl = song?.art || undefined;

      const history = Array.isArray(data?.song_history)
        ? data.song_history.slice(0, 5).map((item: any) => ({
            title: item?.song?.title || item?.song?.text || 'Unknown Title',
            artist: item?.song?.artist || 'Unknown Artist',
          }))
        : [];

      return {
        title,
        artist,
        artUrl,
        listeners,
        isOnline,
        history
      };
    } catch (err: any) {
      console.error('[CreatorPlaza Radio] Failed to fetch now playing data:', err?.message || err);
      return {
        title: 'CreatorPlaza Radio Live Stream',
        artist: 'CreatorPlaza Radio',
        listeners: 0,
        isOnline: true
      };
    }
  }

  async function createRadioResource(volumePercent: number = 80, bufferMs: number = 10000): Promise<{ resource: any; httpStream: any; bufferStream: PassThrough }> {
    const response = await axios({
      method: 'get',
      url: CREATORPLAZA_RADIO.streamUrl,
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*'
      },
      decompress: false,
      timeout: 0
    });

    const httpStream = response.data;
    const bufferStream = new PassThrough({ highWaterMark: 16 * 1024 * 1024 });

    httpStream.pipe(bufferStream);

    // Pre-buffer stream audio bytes (10s by default = ~240KB of 192kbps MP3) to eliminate audio cutouts and network jitter
    if (bufferMs > 0) {
      let bytesReceived = 0;
      const goalBytes = Math.round((192 * 1024 / 8) * (bufferMs / 1000));
      const startTime = Date.now();

      await new Promise<void>((resolve) => {
        const onData = (chunk: Buffer) => {
          bytesReceived += chunk.length;
          if (bytesReceived >= goalBytes || (Date.now() - startTime) >= (bufferMs + 2000)) {
            httpStream.off('data', onData);
            resolve();
          }
        };
        httpStream.on('data', onData);
      });
    }

    const resource = createAudioResource(bufferStream, {
      inputType: StreamType.Arbitrary,
      inlineVolume: true
    });

    if (resource.volume) {
      const vol = Math.max(0.01, Math.min(1.0, volumePercent / 100));
      resource.volume.setVolume(vol);
    }

    return { resource, httpStream, bufferStream };
  }

  async function startOrResumeRadioPlayer(session: RadioSession, bufferMs: number = 10000) {
    try {
      if (session.bufferStream) {
        try { session.bufferStream.destroy(); } catch (e) {}
        session.bufferStream = undefined;
      }
      if (session.httpStream) {
        session.httpStream._destroyedByUs = true;
        try { session.httpStream.destroy(); } catch (e) {}
        session.httpStream = undefined;
      }

      const { resource, httpStream, bufferStream } = await createRadioResource(session.volume, bufferMs);
      session.resource = resource;
      session.httpStream = httpStream;
      session.bufferStream = bufferStream;

      httpStream.on('error', (err: any) => {
        if (session.isStopped || httpStream._destroyedByUs) {
          return;
        }

        const errMsg = err?.message || String(err || '');
        const errCode = err?.code || '';

        // Ignore benign teardown / stream close messages
        if (errMsg === 'aborted' || errCode === 'ECONNRESET' || errCode === 'ERR_STREAM_PREMATURE_CLOSE') {
          return;
        }

        console.error(`[CreatorPlaza Radio] HTTP stream error in guild ${session.guildId}:`, errMsg);

        // Attempt automatic reconnection if session is still active
        const activeSession = radioSessions.get(session.guildId);
        if (activeSession && activeSession.httpStream === httpStream && !activeSession.isStopped) {
          setTimeout(async () => {
            if (radioSessions.get(session.guildId) === activeSession && !activeSession.isStopped) {
              console.log(`[CreatorPlaza Radio] Auto-reconnecting radio stream for guild ${session.guildId}...`);
              await startOrResumeRadioPlayer(activeSession);
            }
          }, 2000);
        }
      });

      httpStream.on('end', () => {
        if (session.isStopped || httpStream._destroyedByUs) {
          return;
        }
        const activeSession = radioSessions.get(session.guildId);
        if (activeSession && activeSession.httpStream === httpStream && !activeSession.isStopped) {
          setTimeout(async () => {
            if (radioSessions.get(session.guildId) === activeSession && !activeSession.isStopped) {
              console.log(`[CreatorPlaza Radio] Auto-reconnecting stream after end for guild ${session.guildId}...`);
              await startOrResumeRadioPlayer(activeSession);
            }
          }, 2000);
        }
      });

      session.player.play(resource);
      session.reconnectAttempts = 0;
    } catch (err: any) {
      if (!session.isStopped) {
        console.error(`[CreatorPlaza Radio] Failed to create audio resource in guild ${session.guildId}:`, err?.message || err);
      }
    }
  }

  async function joinAndPlayRadio(guild: any, voiceChannel: any, user: any, initialVolume?: number) {
    const guildId = guild.id;
    if (!isGuildOwnedByThisShard(guildId)) {
      throw new Error(`Server ${guildId} is assigned to a different Discord shard and cannot be controlled by Shard #${shardConfig?.shardId ?? 0}.`);
    }
    const designatedClient = getGuildDiscordClient(guildId);
    const activeGuild = designatedClient.guilds.cache.get(guildId) || guild;
    const voiceGroup = getVoiceGroupForGuild(guildId);

    let session = radioSessions.get(guildId);
    const volume = typeof initialVolume === 'number' ? Math.max(1, Math.min(100, initialVolume)) : (session?.volume ?? 80);

    if (session && session.connection) {
      if (session.channelId !== voiceChannel.id) {
        session.isStopped = true;
        if (session.bufferStream) {
          try { session.bufferStream.destroy(); } catch (e) {}
        }
        if (session.httpStream) {
          session.httpStream._destroyedByUs = true;
          try { session.httpStream.destroy(); } catch (e) {}
        }
        try {
          session.connection.destroy();
        } catch (e) {}
        radioSessions.delete(guildId);
      } else {
        session.isStopped = false;
        session.volume = volume;
        await startOrResumeRadioPlayer(session);
        return session;
      }
    }

    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: activeGuild.id,
      group: voiceGroup,
      adapterCreator: activeGuild.voiceAdapterCreator,
      selfDeaf: true,
      selfMute: false
    });

    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 20_000);
    } catch (connErr) {
      console.error(`[CreatorPlaza Radio] Voice connection failed to reach Ready state in guild ${guildId}:`, connErr);
      try { connection.destroy(); } catch (e) {}
      throw new Error('Failed to establish voice connection within 20 seconds. Please check Discord bot channel permissions.');
    }

    const player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Play,
      },
    });

    const newSession: RadioSession = {
      guildId: guild.id,
      channelId: voiceChannel.id,
      connection,
      player,
      resource: null,
      volume,
      startedAt: new Date(),
      startedBy: { id: user.id, username: user.tag || user.username },
      reconnectAttempts: 0,
      isStopped: false
    };

    radioSessions.set(guildId, newSession);

    connection.subscribe(player);
    await startOrResumeRadioPlayer(newSession);

    player.on(AudioPlayerStatus.Idle, () => {
      const current = radioSessions.get(guildId);
      if (current && !current.isStopped && current.connection && current.connection.state.status !== VoiceConnectionStatus.Destroyed) {
        setTimeout(async () => {
          if (radioSessions.has(guildId) && !current.isStopped) {
            await startOrResumeRadioPlayer(current);
          }
        }, 1500);
      }
    });

    player.on('error', (error: any) => {
      const current = radioSessions.get(guildId);
      if (current && !current.isStopped) {
        console.error(`[CreatorPlaza Radio] Audio player error in guild ${guildId}:`, error?.message || error);
        current.reconnectAttempts = (current.reconnectAttempts || 0) + 1;
        if (current.reconnectAttempts < 5) {
          setTimeout(async () => {
            if (radioSessions.has(guildId) && !current.isStopped) {
              await startOrResumeRadioPlayer(current);
            }
          }, 2000);
        }
      }
    });

    connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([
          entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
          entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
        ]);
      } catch (e) {
        stopRadioInGuild(guildId);
      }
    });

    connection.on(VoiceConnectionStatus.Destroyed, () => {
      const s = radioSessions.get(guildId);
      if (s) {
        s.isStopped = true;
        if (s.bufferStream) {
          try { s.bufferStream.destroy(); } catch (e) {}
        }
        if (s.httpStream) {
          s.httpStream._destroyedByUs = true;
          try { s.httpStream.destroy(); } catch (e) {}
        }
      }
      radioSessions.delete(guildId);
    });

    return newSession;
  }

  function stopRadioInGuild(guildId: string): boolean {
    if (!isGuildOwnedByThisShard(guildId)) {
      return false;
    }
    const session = radioSessions.get(guildId);
    const existingConn = getVoiceConnection(guildId, getVoiceGroupForGuild(guildId)) || getVoiceConnection(guildId);

    if (session) {
      session.isStopped = true;
      if (session.bufferStream) {
        try { session.bufferStream.destroy(); } catch (e) {}
      }
      if (session.httpStream) {
        session.httpStream._destroyedByUs = true;
        try { session.httpStream.destroy(); } catch (e) {}
      }
      try {
        session.player?.stop(true);
      } catch (e) {}
      try {
        session.connection?.destroy();
      } catch (e) {}
      radioSessions.delete(guildId);
      return true;
    } else if (existingConn) {
      try {
        existingConn.destroy();
      } catch (e) {}
      return true;
    }
    return false;
  }

  function setRadioVolume(guildId: string, volume: number): { success: boolean; volume: number; inVoice: boolean } {
    const clampedVol = Math.max(1, Math.min(100, volume));
    if (!isGuildOwnedByThisShard(guildId)) {
      return { success: false, volume: clampedVol, inVoice: false };
    }
    const session = radioSessions.get(guildId);

    if (!session) {
      return { success: false, volume: clampedVol, inVoice: false };
    }

    session.volume = clampedVol;
    if (session.resource && session.resource.volume) {
      session.resource.volume.setVolume(clampedVol / 100);
    }
    return { success: true, volume: clampedVol, inVoice: true };
  }

  const rawDiscordCommands = [
    new SlashCommandBuilder()
      .setName('help')
      .setDescription('View available BeSafe Network commands and documentation'),

    new SlashCommandBuilder()
      .setName('status')
      .setDescription('View system and shard operational status'),

    new SlashCommandBuilder()
      .setName('radio')
      .setDescription('Play and control CreatorPlaza Radio in your voice channel')
      .addSubcommand(sub =>
        sub.setName('play')
          .setDescription('Play CreatorPlaza Radio in your current voice channel')
          .addIntegerOption(opt =>
            opt.setName('volume')
              .setDescription('Initial volume level (1-100)')
              .setMinValue(1)
              .setMaxValue(100)
              .setRequired(false)
          )
      )
      .addSubcommand(sub =>
        sub.setName('stop')
          .setDescription('Stop playing CreatorPlaza Radio and disconnect from voice')
      )
      .addSubcommand(sub =>
        sub.setName('np')
          .setDescription('Show currently playing song and artist on CreatorPlaza Radio')
      )
      .addSubcommand(sub =>
        sub.setName('volume')
          .setDescription('Adjust CreatorPlaza Radio playback volume (1-100)')
          .addIntegerOption(opt =>
            opt.setName('level')
              .setDescription('Volume level (1-100)')
              .setMinValue(1)
              .setMaxValue(100)
              .setRequired(true)
          )
      ),

    new SlashCommandBuilder()
      .setName('np')
      .setDescription('Show current song name and artist on CreatorPlaza Radio'),

    new SlashCommandBuilder()
      .setName('stop')
      .setDescription('Stop CreatorPlaza Radio and leave the voice channel'),

    new SlashCommandBuilder()
      .setName('volume')
      .setDescription('Change CreatorPlaza Radio volume')
      .addIntegerOption(opt =>
        opt.setName('level')
          .setDescription('Volume level from 1 to 100')
          .setMinValue(1)
          .setMaxValue(100)
          .setRequired(true)
      ),

    new SlashCommandBuilder()
      .setName('report')
      .setDescription('Submit a safety report via our web portal')
      .addUserOption(option => option.setName('target').setDescription('User to report (optional)').setRequired(false))
      .setIntegrationTypes([0, 1])
      .setContexts([0, 1, 2]),
    
    new SlashCommandBuilder()
      .setName('check')
      .setDescription('Check global ban status, reputation, VRChat links, or Ban Case #')
      .addUserOption(option => option.setName('user').setDescription('The Discord user to check (optional)').setRequired(false))
      .addStringOption(option => option.setName('query').setDescription('Discord ID, VRChat ID (usr_...), username, or Case # (e.g. CASE-1234)').setRequired(false))
      .setIntegrationTypes([0, 1])
      .setContexts([0, 1, 2]),

    new SlashCommandBuilder()
      .setName('warn')
      .setDescription('Issue a warning to a user')
      .addUserOption(option => option.setName('target').setDescription('The user to warn').setRequired(true))
      .addStringOption(option => option.setName('reason').setDescription('Reason for the warning').setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    new SlashCommandBuilder()
      .setName('reputation')
      .setDescription('Rate a user\'s reputation')
      .addUserOption(option => option.setName('target').setDescription('The user to rate').setRequired(true))
      .addIntegerOption(option => option.setName('rating').setDescription('Rating (1 for positive, -1 for negative)').setRequired(true).addChoices(
        { name: 'Positive', value: 1 },
        { name: 'Negative', value: -1 }
      ))
      .setIntegrationTypes([0, 1])
      .setContexts([0, 1, 2]),

    new SlashCommandBuilder()
      .setName('setup')
      .setDescription('Link this server to your BeSafe Network dashboard')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    new SlashCommandBuilder()
      .setName('verify')
      .setDescription('Verify yourself to gain access to the server'),

    new SlashCommandBuilder()
      .setName('link')
      .setDescription('Link your Discord account to the BeSafe Network dashboard')
      .addStringOption(option =>
        option.setName('code')
          .setDescription('Optional web link code generated from the dashboard (e.g. DASH-XXXXXX)')
          .setRequired(false)
      ),

    new SlashCommandBuilder()
      .setName('info')
      .setDescription('Information about BeSafe Network and its features')
      .setIntegrationTypes([0, 1])
      .setContexts([0, 1, 2]),

    new SlashCommandBuilder()
      .setName('vote')
      .setDescription('Vote for BeSafe Network on top.gg to support the community')
      .setIntegrationTypes([0, 1])
      .setContexts([0, 1, 2]),

    new SlashCommandBuilder()
      .setName('age-verify')
      .setDescription('Verify your age securely via manual staff review')
      .setIntegrationTypes([0, 1])
      .setContexts([0, 1, 2]),

    new SlashCommandBuilder()
      .setName('agerole')
      .setDescription('Sync your age role if you are verified'),

    new SlashCommandBuilder()
      .setName('agecheck')
      .setDescription('Check a user\'s age verification status')
      .addUserOption(option => option.setName('user').setDescription('The user to check').setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    new SlashCommandBuilder()
      .setName('age-delete')
      .setDescription('Delete your own age verification data and purge your records')
      .setIntegrationTypes([0, 1])
      .setContexts([0, 1, 2]),

    new SlashCommandBuilder()
      .setName('agedelete')
      .setDescription('Delete your own age verification data and purge your records')
      .setIntegrationTypes([0, 1])
      .setContexts([0, 1, 2]),

    new SlashCommandBuilder()
      .setName('backup')
      .setDescription('Anti-raid server backup and snapshot restore system')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addSubcommand(sub =>
        sub.setName('create')
          .setDescription('Take an instant full backup snapshot of roles, categories, channels, and settings')
          .addStringOption(opt => opt.setName('name').setDescription('Custom label for this backup snapshot').setRequired(false))
      )
      .addSubcommand(sub =>
        sub.setName('list')
          .setDescription('List all saved backup snapshots for this server')
      )
      .addSubcommand(sub =>
        sub.setName('restore')
          .setDescription('Roll back and restore the server to a saved backup snapshot')
          .addStringOption(opt => opt.setName('id').setDescription('The Backup ID to restore').setRequired(true))
      )
      .addSubcommand(sub =>
        sub.setName('delete')
          .setDescription('Delete a saved backup snapshot')
          .addStringOption(opt => opt.setName('id').setDescription('The Backup ID to delete').setRequired(true))
      ),

    new ContextMenuCommandBuilder()
      .setName('Report User')
      .setType(ApplicationCommandType.User)
      .setIntegrationTypes([0, 1])
      .setContexts([0, 1, 2]),

    new ContextMenuCommandBuilder()
      .setName('Report Message')
      .setType(ApplicationCommandType.Message)
      .setIntegrationTypes([0, 1])
      .setContexts([0, 1, 2]),

    new ContextMenuCommandBuilder()
      .setName('Check User Status')
      .setType(ApplicationCommandType.User)
      .setIntegrationTypes([0, 1])
      .setContexts([0, 1, 2]),

    new ContextMenuCommandBuilder()
      .setName('Warn User')
      .setType(ApplicationCommandType.User)
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    new ContextMenuCommandBuilder()
      .setName('Rate Reputation')
      .setType(ApplicationCommandType.User)
      .setIntegrationTypes([0, 1])
      .setContexts([0, 1, 2]),

    new ContextMenuCommandBuilder()
      .setName('Age Check User')
      .setType(ApplicationCommandType.User)
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  ];

  function getCommandsForRegistration(disableAgeVerify = false) {
    return rawDiscordCommands
      .filter(cmd => {
        const name = (cmd as any).name;
        if (disableAgeVerify && name === 'age-verify') {
          return false;
        }
        return true;
      })
      .map(command => (typeof (command as any).toJSON === 'function' ? (command as any).toJSON() : command));
  }

  // Base commands representation for default reference
  const commands = getCommandsForRegistration(false);

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN || '');

  const customBotsMap = new Map<string, Client>();

  async function syncGlobalDiscordCommands(): Promise<{ success: boolean; count: number; ageVerifyDisabled: boolean; error?: string }> {
    try {
      const config = await SystemConfig.findOne({ id: 'main' });
      const isAgeVerifyDisabled = Boolean(config?.disableAgeVerifyCommand);
      const commandsToSync = getCommandsForRegistration(isAgeVerifyDisabled);

      if (!shardConfig || shardConfig.shardId === 0) {
        if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_TOKEN) {
          try {
            await rest.put(
              Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
              { body: commandsToSync }
            );
            console.log(`[Discord Commands] Successfully synced ${commandsToSync.length} commands to main bot (age-verify ${isAgeVerifyDisabled ? 'DISABLED and UNSYNCED' : 'ENABLED and SYNCED'}).`);
          } catch (restErr: any) {
            console.error('[Discord Commands] Failed to put commands via Discord REST API:', restErr?.message || restErr);
            return { success: false, count: commandsToSync.length, ageVerifyDisabled: isAgeVerifyDisabled, error: restErr?.message };
          }
        } else {
          console.log(`[Discord Commands] DISCORD_CLIENT_ID or DISCORD_TOKEN missing in env; command registration skipped (${commandsToSync.length} commands configured).`);
        }
      }

      // Also sync all connected custom bots with their respective guild/global settings
      for (const [guildId, customClient] of customBotsMap.entries()) {
        try {
          const token = (customClient as any)._botToken;
          if (token && customClient.user?.id) {
            const guild = await Guild.findOne({ id: guildId });
            const guildDisable = Boolean(guild?.settings?.disableAgeVerifyCommand);
            const customCommands = getCommandsForRegistration(isAgeVerifyDisabled || guildDisable);
            const customRest = new REST({ version: '10' }).setToken(token);
            await customRest.put(
              Routes.applicationCommands(customClient.user.id),
              { body: customCommands }
            );
            console.log(`[Custom Bot Manager] Synced ${customCommands.length} commands for guild ${guildId} custom bot (age-verify ${isAgeVerifyDisabled || guildDisable ? 'DISABLED' : 'ENABLED'}).`);
          }
        } catch (cErr: any) {
          console.error(`[Custom Bot Manager] Error syncing commands for guild ${guildId}:`, cErr?.message || cErr);
        }
      }

      return { success: true, count: commandsToSync.length, ageVerifyDisabled: isAgeVerifyDisabled };
    } catch (err: any) {
      console.error('[Discord Commands] Error in syncGlobalDiscordCommands:', err);
      return { success: false, count: 0, ageVerifyDisabled: false, error: err?.message || 'Failed to sync commands' };
    }
  }

  // Hook up the hoisted reference for admin endpoints
  setSyncDiscordCommandsRef(syncGlobalDiscordCommands);

  function getActivityTypeEnum(typeStr?: string): ActivityType {
    const s = (typeStr || '').toUpperCase();
    if (s === 'PLAYING') return ActivityType.Playing;
    if (s === 'STREAMING') return ActivityType.Streaming;
    if (s === 'LISTENING') return ActivityType.Listening;
    if (s === 'WATCHING') return ActivityType.Watching;
    if (s === 'COMPETING') return ActivityType.Competing;
    if (s === 'CUSTOM') return ActivityType.Custom;
    return ActivityType.Playing;
  }

  function getGuildDiscordClient(guildId: string): Client {
    if (!isGuildOwnedByThisShard(guildId)) {
      return client;
    }
    const customClient = customBotsMap.get(guildId);
    if (customClient && customClient.isReady()) {
      return customClient;
    }
    return client;
  }

  function shouldHandleGuildOnClient(guildId: string | null | undefined, targetClient: Client): boolean {
    if (!guildId) {
      return targetClient === client && (!shardConfig || shardConfig.shardId === 0);
    }
    if (!isGuildOwnedByThisShard(guildId)) {
      return false;
    }
    const designatedClient = getGuildDiscordClient(guildId);
    if (designatedClient === targetClient) return true;
    if (designatedClient.user?.id && targetClient.user?.id && designatedClient.user.id === targetClient.user.id) {
      return true;
    }
    return false;
  }

  async function syncCustomBotForGuild(guildData: any) {
    if (!guildData) return;
    const guildId = guildData.id;
    const existingClient = customBotsMap.get(guildId);

    if (!isGuildOwnedByThisShard(guildId)) {
      if (existingClient) {
        console.log(`[Custom Bot Manager] Destroying custom bot for guild ${guildId} on Shard #${shardConfig?.shardId ?? 0} (owned by another shard).`);
        try {
          existingClient.destroy();
        } catch (e) {}
        customBotsMap.delete(guildId);
      }
      return;
    }

    const settings = guildData.settings || {};

    const isEnabled = !!settings.customBotEnabled;
    const token = (settings.customBotToken || '').trim();

    if (!isEnabled || !token) {
      if (existingClient) {
        console.log(`[Custom Bot Manager] Destroying custom bot for guild ${guildId} (disabled or empty token).`);
        try {
          existingClient.destroy();
        } catch (e) {}
        customBotsMap.delete(guildId);
      }
      return;
    }

    if (existingClient && (existingClient as any)._botToken === token) {
      if (existingClient.isReady() && existingClient.user) {
        const botStatus = (settings.customBotStatus || 'online') as any;
        const actType = getActivityTypeEnum(settings.customBotActivityType);
        const wsShardId = existingClient.guilds.cache.get(guildId)?.shardId ?? 0;
        const actText = settings.customBotActivityText || 'Keeping you safe with love ❤️';
        
        try {
          existingClient.user.setPresence({
            status: botStatus,
            activities: [{ name: actText, type: actType }],
            shardId: wsShardId,
          });
          console.log(`[Custom Bot Manager] Updated presence for custom bot in guild ${guildId}: status=${botStatus}, activity=${actText}, shardId=${wsShardId}`);
        } catch (err: any) {
          console.error(`[Custom Bot Manager] Failed to update presence for guild ${guildId}:`, err.message);
        }
      }
      return;
    }

    if (existingClient) {
      try { existingClient.destroy(); } catch (e) {}
      customBotsMap.delete(guildId);
    }

    console.log(`[Custom Bot Manager] Initializing custom bot for guild ${guildId} (${guildData.name || 'Server'})...`);
    
    const customClient = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
      ],
      partials: [Partials.Message, Partials.Channel, Partials.Reaction],
    });

    (customClient as any)._botToken = token;

    attachDiscordBotHandlers(customClient);

    customClient.on(Events.ClientReady, async () => {
      console.log(`[Custom Bot Manager] Custom Bot logged in as ${customClient.user?.tag} for guild ${guildId}`);
      
      const botStatus = (settings.customBotStatus || 'online') as any;
      const actType = getActivityTypeEnum(settings.customBotActivityType);
      const wsShardId = customClient.guilds.cache.get(guildId)?.shardId ?? 0;
      const actText = settings.customBotActivityText || 'Keeping you safe with love ❤️';
      
      try {
        customClient.user?.setPresence({
          status: botStatus,
          activities: [{ name: actText, type: actType }],
          shardId: wsShardId,
        });
      } catch (err: any) {
        console.error(`[Custom Bot Manager] Error setting initial presence for guild ${guildId}:`, err.message);
      }

      try {
        if (customClient.user?.id) {
          const customRest = new REST({ version: '10' }).setToken(token);
          const config = await SystemConfig.findOne({ id: 'main' });
          const isAgeVerifyDisabled = Boolean(config?.disableAgeVerifyCommand) || Boolean(settings?.disableAgeVerifyCommand);
          const botCommands = getCommandsForRegistration(isAgeVerifyDisabled);
          await customRest.put(
            Routes.applicationCommands(customClient.user.id),
            { body: botCommands }
          );
          console.log(`[Custom Bot Manager] Registered ${botCommands.length} slash commands for custom bot ${customClient.user.tag} (age-verify ${isAgeVerifyDisabled ? 'DISABLED/UNSYNCED' : 'ENABLED/SYNCED'})`);
        }
      } catch (cmdErr: any) {
        console.error(`[Custom Bot Manager] Failed to register slash commands for guild ${guildId}:`, cmdErr.message);
      }
    });

    customClient.on('error', (err) => {
      console.error(`[Custom Bot Manager] Error on custom client for guild ${guildId}:`, err.message);
    });

    try {
      await customClient.login(token);
      customBotsMap.set(guildId, customClient);
    } catch (loginErr: any) {
      console.error(`[Custom Bot Manager] Failed to login custom bot for guild ${guildId}:`, loginErr.message);
    }
  }

  async function syncAllCustomBots() {
    try {
      const guilds = await Guild.find({ 'settings.customBotEnabled': true });
      const ownedGuilds = guilds.filter((g: any) => isGuildOwnedByThisShard(g.id));
      console.log(`[Custom Bot Manager] Shard #${shardConfig?.shardId ?? 0} syncing custom bots for ${ownedGuilds.length} owned guild(s) (out of ${guilds.length} total)...`);
      for (const g of ownedGuilds) {
        await syncCustomBotForGuild(g);
      }
    } catch (err: any) {
      console.error(`[Custom Bot Manager] Error syncing custom bots:`, err.message);
    }
  }

  async function scanAndBanCustomBanlistDiscordUsers() {
    try {
      const guilds = await Guild.find({ 'settings.customBanlistId': { $exists: true, $ne: '' } });
      for (const guildData of guilds) {
        if (!isGuildOwnedByThisShard(guildData.id)) continue;
        const customId = guildData.settings?.customBanlistId;
        const selectionMode = guildData.settings?.banlistSelectionMode || 'global';
        if (!customId || (selectionMode !== 'both' && selectionMode !== 'custom')) continue;

        const targetClient = getGuildDiscordClient(guildData.id);
        if (!targetClient.isReady()) continue;
        const guild = targetClient.guilds.cache.get(guildData.id);
        if (!guild) continue;

        const customBanlist = await CustomBanlist.findById(customId);
        if (!customBanlist) continue;
        for (const entry of customBanlist.entries) {
          let userId: string | null = null;
          let banReason = entry.reason || 'Listed on custom banlist';
          if (entry.type === 'discord' && entry.targetId) {
            userId = entry.targetId.trim();
          } else if (entry.type === 'vrchat' && entry.targetId) {
            const targetId = entry.targetId.trim();
            const user = await User.findOne({ $or: [{ vrchatUserId: targetId }, { 'vrchatAlts.vrchatUserId': targetId }] });
            if (user && !user.isTrusted) {
              userId = user.id;
              banReason = `Linked VRChat account is blacklisted on custom banlist "${customBanlist.name}" (${entry.reason || 'No reason specified'})`;
            }
          }
          if (!userId || !isValidDiscordSnowflake(userId) || await guild.bans.fetch(userId).catch(() => null)) continue;

          try {
            await guild.members.ban(userId, { reason: `Custom Banlist (${customBanlist.name}): ${banReason}` });
            const targetUser = await targetClient.users.fetch(userId).catch(() => null);
            const targetTag = targetUser?.tag || targetUser?.username || userId;
            await new Log({
              action: 'DISCORD_AUTO_BAN_CUSTOM',
              adminId: 'SYSTEM_BOT',
              targetId: userId,
              details: `Automated custom banlist scan: Auto-banned user ${targetTag} (${userId}) from Guild ${guild.name} based on Custom Banlist "${customBanlist.name}". Reason: ${banReason}`,
            }).save();
            const channelId = guildData.settings.staffChannelId || guildData.settings.logChannelId;
            const channel = channelId ? guild.channels.cache.get(channelId) : null;
            if (channel?.isTextBased()) {
              await channel.send(`🚨 **Custom Banlist Auto-Ban Enforced**: User **${targetTag}** (${userId}) was automatically banned from this server.\nCustom Banlist: **${customBanlist.name}**\nReason: ${banReason}`).catch(() => null);
            }
          } catch (error: any) {
            console.error(`[Custom Banlist Scan] Failed to ban ${userId} in ${guild.id}:`, error?.message || error);
          }
        }
      }
    } catch (error: any) {
      console.error('[Custom Banlist Scan] Worker scan failed:', error?.message || error);
    }
  }

  let presenceUpdateInterval: ReturnType<typeof setInterval> | null = null;

  function applyMainBotShardPresence(specificShardId?: number) {
    if (!client.user) return;
    const defaultShardId = shardConfig?.shardId ?? client.shard?.ids?.[0] ?? 0;
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
  }

  client.on(Events.ShardReady, (readyShardId) => {
    applyMainBotShardPresence(readyShardId);
  });

  const postTopggServerCount = async () => {
    try {
      if (!client.user?.id || !process.env.DISCORD_TOKEN) return;
      const shardCount = (client.options as any)?.shardCount || shardConfig?.shardCount || 1;
      await fetch(`https://top.gg/api/bots/${client.user.id}/stats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: process.env.DISCORD_TOKEN,
        },
        body: JSON.stringify({
          server_count: client.guilds.cache.size,
          shard_count: shardCount,
        }),
      });
    } catch (err: any) {
      console.warn('[Top.gg] Failed to post server count:', err?.message || err);
    }
  };

  client.on(Events.ClientReady, async () => {
    console.log(`Logged in as ${client.user?.tag}!`);
    
    // Set real-time per-shard bot status and refresh per shard every 5 minutes
    applyMainBotShardPresence();
    if (presenceUpdateInterval) clearInterval(presenceUpdateInterval);
    presenceUpdateInterval = setInterval(() => applyMainBotShardPresence(), 5 * 60 * 1000);

    // Report server count to top.gg on boot and every 30 minutes
    void postTopggServerCount();
    setInterval(() => void postTopggServerCount(), 30 * 60 * 1000);

    setTimeout(() => void scanAndBanCustomBanlistDiscordUsers(), 20000);
    setInterval(() => void scanAndBanCustomBanlistDiscordUsers(), 2 * 60 * 1000);
    syncAllBansAcrossPlatforms().catch((err: any) => console.error('[Ban Sync Error on Startup]:', err));
    setInterval(() => {
      syncAllBansAcrossPlatforms().catch((err: any) => console.error('[Periodic Ban Sync Error]:', err));
    }, 15 * 60 * 1000);

    // Every shard independently syncs custom bots for its own guilds
    await syncAllCustomBots();

    if (shardConfig && shardConfig.shardId !== 0) return;

    try {
      await syncGlobalDiscordCommands();
    } catch (error) {
      console.error('[Discord Commands] Startup sync failed:', error);
    }

    // Purge User database of legacy ban flags and reserve it for trusted members
    cleanupUserDatabaseForTrustedOnly().catch((err: any) => console.error('[Startup DB Cleanup Error]:', err));

  });

  async function checkUserStatus(target: any, interaction: any, rawQuery?: string) {
    try {
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ ephemeral: true });
      }
    } catch (e) {
      console.error('Failed to defer reply in checkUserStatus', e);
    }

    const queryStr = (rawQuery || target?.id || target?.username || '').trim();
    const { user: foundUser, banCase, cleaned } = await findUserByQuery(queryStr);
    let user = foundUser;

    if (!user && !banCase) {
      if (cleaned.startsWith('usr_')) {
        const vName = await serviceClient.fetchVRChatDisplayName(cleaned).catch(() => null);
        const embed = new EmbedBuilder()
          .setTitle(`🎮 VRChat Account: ${vName || cleaned}`)
          .setColor(0x10B981)
          .setDescription('✅ **CLEAN / NO INFRACTIONS**\nThis VRChat account has no recorded ban cases or security flags in the BeSafe Network.')
          .addFields(
            { name: '🆔 VRChat User ID', value: `\`${cleaned}\``, inline: true },
            { name: '👤 VRChat Username', value: vName ? `\`${vName}\`` : '*(Uncached)*', inline: true },
            { name: '🛡️ Global Standing', value: '`ALL CLEAR` (Active)', inline: true }
          )
          .setFooter({ text: 'BeSafe Network • Global Threat & Identity Registry' })
          .setTimestamp();

        try {
          return await interaction.editReply({ embeds: [embed] });
        } catch (e) {
          console.error(e);
          return;
        }
      }

      const emptyEmbed = new EmbedBuilder()
        .setTitle(`🔍 Check Result: ${target?.tag || target?.username || queryStr}`)
        .setColor(0x10B981)
        .setDescription('✅ **CLEAN / NO INCIDENTS RECORDED**\nNo active ban cases, warnings, or threat reports exist for this identifier in the BeSafe global registry.')
        .addFields(
          { name: 'Identifier Queried', value: `\`${queryStr || target?.id || 'Unknown'}\``, inline: true },
          { name: 'Trust Index', value: '`ALL CLEAR`', inline: true }
        )
        .setFooter({ text: 'BeSafe Network Database' })
        .setTimestamp();

      try {
        return await interaction.editReply({ embeds: [emptyEmbed] });
      } catch (e) {
        console.error(e);
        return;
      }
    }

    const isCaseActive = banCase && banCase.status === 'active';
    const isBanned = !!user?.isBanned || isCaseActive;
    const isDangerous = !!user?.isDangerous || !!banCase?.isDangerous;
    const repScore = user?.reputation || 0;
    const isSuspicious = !isBanned && repScore <= -5;
    const trustIndex = calculateDynamicTrustIndex({
      isDangerous,
      isBanned: !!isBanned,
      reputation: repScore,
      isTrusted: !!user?.isTrusted
    });

    let embedColor = 0x10B981; // Green
    if (isDangerous) embedColor = 0x000000; // Black / Critical Danger
    else if (isBanned || repScore <= -10) embedColor = 0xDC2626; // Red
    else if (isSuspicious) embedColor = 0xF59E0B; // Amber

    const primaryDisc = banCase?.discordAccounts?.[0];
    const primaryVRC = banCase?.vrchatAccounts?.[0];
    const resolved = user ? await resolveDiscordUser(client, user.id, user).catch(() => null) : null;
    const userName = banCase?.title || target?.displayName || target?.username || primaryDisc?.displayName || primaryDisc?.username || (user as any)?.displayName || user?.username || resolved?.displayName || resolved?.username || primaryVRC?.vrchatUsername || queryStr;
    const avatarUrl = target?.displayAvatarURL?.() || primaryDisc?.avatarUrl || (user ? await getWatchlistAvatar(client, user) : resolved?.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png');

    const embed = new EmbedBuilder()
      .setTitle(`${isBanned ? '🚨 GLOBAL BAN DETECTED' : '🛡️ IDENTITY & TRUST CHECK'}: ${userName}`)
      .setThumbnail(avatarUrl)
      .setColor(embedColor)
      .setFooter({ text: 'BeSafe Network • Global Threat & Identity Registry' })
      .setTimestamp();

    if (banCase) {
      embed.addFields(
        { name: '📋 Ban Case Number', value: `\`#${banCase.caseNumber}\``, inline: true },
        { name: '⚡ Case Status', value: isCaseActive ? '🛑 **ACTIVE GLOBAL BAN**' : '✅ **PARDONED / LIFTED**', inline: true },
        { name: '🛡️ Trust Index', value: `\`${trustIndex}\``, inline: true },
        { name: '⚖️ Severity Level', value: `\`${(banCase.severity || 'permanent').toUpperCase()}\``, inline: true },
        { name: '👤 Banned By', value: `\`${banCase.bannedBy || 'Administrator'}\``, inline: true },
        { name: '📅 Case Established', value: `<t:${Math.floor(new Date(banCase.createdAt || Date.now()).getTime() / 1000)}:R>`, inline: true },
        { name: '🚨 Violation Reason', value: `>>> "${banCase.reason}"`, inline: false }
      );

      // Linked Discord accounts
      if (Array.isArray(banCase.discordAccounts) && banCase.discordAccounts.length > 0) {
        const discList = banCase.discordAccounts.map((d: any) => `• <@${d.discordId}> (\`${d.discordId}\`) - **${d.displayName || d.username || 'User'}**`);
        embed.addFields({
          name: `💬 Linked Discord Accounts (${banCase.discordAccounts.length})`,
          value: discList.slice(0, 10).join('\n') + (discList.length > 10 ? `\n*...and ${discList.length - 10} more*` : ''),
          inline: false
        });
      }

      // Linked VRChat accounts
      if (Array.isArray(banCase.vrchatAccounts) && banCase.vrchatAccounts.length > 0) {
        const vrcList = banCase.vrchatAccounts.map((v: any) => `• **${v.vrchatUsername || 'No Username'}** (\`${v.vrchatUserId}\`)${v.isPrimary ? ' ⭐ Primary' : ''}`);
        embed.addFields({
          name: `🎮 Linked VRChat Accounts (${banCase.vrchatAccounts.length})`,
          value: vrcList.slice(0, 10).join('\n') + (vrcList.length > 10 ? `\n*...and ${vrcList.length - 10} more*` : ''),
          inline: false
        });
      }
    } else if (user) {
      let statusStr = '✅ Clean / In Good Standing';
      if (user.isBanned) statusStr = `🛑 Banned: ${user.banReason || 'Manual Ban'}`;
      else if (isSuspicious) statusStr = '⚠️ Low Reputation Warning';

      embed.addFields(
        { name: '👤 Primary Name', value: user.username || target?.username || user.id, inline: true },
        { name: '🆔 Account ID', value: `\`${user.id}\``, inline: true },
        { name: '🛡️ Trust Index', value: `\`${trustIndex}\``, inline: true },
        { name: '📊 Community Reputation', value: `**${user.reputation || 0}** pts`, inline: true },
        { name: '⚠️ Recorded Warnings', value: `**${user.warnings?.length || 0}**`, inline: true },
        { name: '🔞 Age Verification', value: user.isAgeVerified ? '✅ 18+ Verified' : '❌ Unverified', inline: true },
        { name: '⚡ Security Status', value: statusStr, inline: false }
      );

      const vrcAccounts = [];
      if (user.vrchatUserId || user.vrchatUsername) {
        vrcAccounts.push(`• **${user.vrchatUsername || 'No Username'}** (\`${user.vrchatUserId || 'No ID'}\`) [Primary]`);
      }
      if (user.vrchatAlts && Array.isArray(user.vrchatAlts)) {
        for (const alt of user.vrchatAlts) {
          if (alt.vrchatUserId || alt.vrchatUsername) {
            vrcAccounts.push(`• **${alt.vrchatUsername || 'No Username'}** (\`${alt.vrchatUserId || 'No ID'}\`) [Alt]`);
          }
        }
      }
      if (vrcAccounts.length > 0) {
        embed.addFields({
          name: `🎮 Connected VRChat Accounts (${vrcAccounts.length})`,
          value: vrcAccounts.join('\n'),
          inline: false
        });
      }
    }

    if (isDangerous) {
      const appUrl = process.env.APP_URL || 'https://besafe.network';
      const dossierId = banCase?.caseNumber || user?.id;
      embed.setDescription(`☣️ **ENROLLED IN HIGH-RISK THREAT WATCHLIST**\nThis subject is marked as a critical security threat.\n\n🔗 [**Click Here to View Threat Intelligence Dossier & Evidence**](${appUrl}/watchlist/${dossierId})`);
    }

    try {
      await interaction.editReply({ embeds: [embed] });
    } catch (e) {
      console.error('Failed to editReply in checkUserStatus', e);
    }
  }

  async function runAgeCheck(target: any, interaction: any) {
    try {
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ ephemeral: true });
      }
    } catch (e) {
      console.error('Failed to defer reply in runAgeCheck', e);
    }

    const user = await User.findOne({ id: target.id });
    if (!user) {
      try {
        return await interaction.editReply({ content: `No record found for ${target.tag || target.username}.` });
      } catch (e) {
        console.error('Failed to editReply in runAgeCheck', e);
        return;
      }
    }

    const status = user.isAgeVerified ? '✅ VERIFIED' : '❌ NOT VERIFIED';
    let ageInfo = 'N/A';
    if (user.isAgeVerified && user.dob) {
      const year = user.dob.getFullYear();
      ageInfo = `Born in ${year} (Exact date hidden for privacy)`;
    }

    try {
      await interaction.editReply({
        content: `🛡️ **Age Check: ${target.tag || target.username}**\nStatus: ${status}\nInformation: ${ageInfo}`
      });
    } catch (e) {
      console.error('Failed to editReply in runAgeCheck', e);
    }
  }

  async function runAgeDelete(target: any, interaction: any) {
    try {
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ ephemeral: true });
      }
    } catch (e) {
      console.error('Failed to defer reply in runAgeDelete', e);
    }

    const executorId = interaction.user.id;
    const isSelf = target && target.id === executorId;

    if (!isSelf) {
      try {
        return await interaction.editReply({
          content: '❌ **Access Restricted:** You can only delete your own age verification data. Server administrators and moderators cannot delete age verification data for other users.'
        });
      } catch (e) {
        console.error(e);
        return;
      }
    }

    const userId = executorId;

    try {
      // 1. Purge all verification requests for this user
      const requestDelete = await VerificationRequest.deleteMany({ userId });

      // 2. Reset age verification status and DOB on User model
      await User.findOneAndUpdate(
        { id: userId },
        { 
          $set: { isAgeVerified: false }, 
          $unset: { dob: 1, ageVerifiedAt: 1 } 
        }
      );

      // 3. Unassign age role if in a guild
      let roleRemovedMsg = '';
      if (interaction.guild) {
        try {
          const guildData = await Guild.findOne({ id: interaction.guild.id });
          if (guildData?.settings?.ageRoleId) {
            const member = await interaction.guild.members.fetch(userId).catch(() => null);
            if (member && member.roles.cache.has(guildData.settings.ageRoleId)) {
              await member.roles.remove(guildData.settings.ageRoleId).catch(() => null);
              roleRemovedMsg = `\n• **Server Role:** Removed <@&${guildData.settings.ageRoleId}> role in this server.`;
            }
          }
        } catch (roleErr) {
          console.error('Error removing age role during deletion:', roleErr);
        }
      }

      // 4. Record audit log
      await new Log({
        action: 'AGE_VERIFICATION_DELETED',
        adminId: interaction.user.tag || interaction.user.username || executorId,
        targetId: userId,
        details: `Age verification records and date of birth purged for ${target.tag || target.username || userId} by ${isSelf ? 'user self-service' : 'staff member ' + executorId}.`
      }).save();

      const embed = {
        title: '🗑️ Age Verification Data Deleted',
        description: `Successfully wiped all age verification records and reset verification status for **${target.tag || target.username}** (\`${userId}\`).`,
        fields: [
          { name: 'Target User', value: `<@${userId}> (\`${userId}\`)`, inline: true },
          { name: 'Executed By', value: `<@${executorId}>`, inline: true },
          { name: 'Status Now', value: '❌ Unverified', inline: true },
          { 
            name: 'Audit Details', 
            value: `• **Verification Requests Purged:** \`${requestDelete.deletedCount || 0}\` record(s)\n• **Personal Identifiers:** Date of Birth & Verification Timestamp Erased\n• **Verification Status:** Reset to Unverified${roleRemovedMsg}` 
          }
        ],
        color: 0xef4444,
        footer: { text: 'BeSafe Network • Privacy & Age Verification System' },
        timestamp: new Date().toISOString()
      };

      return await interaction.editReply({ embeds: [embed] });
    } catch (err: any) {
      console.error('Error in runAgeDelete:', err);
      try {
        return await interaction.editReply({ content: `❌ Failed to delete age verification data: ${err?.message || 'Internal error'}` });
      } catch (e) {
        console.error(e);
      }
    }
  }

  function attachDiscordBotHandlers(targetClient: Client) {
    targetClient.on(Events.InteractionCreate, async interaction => {
      if (interaction.guildId && !shouldHandleGuildOnClient(interaction.guildId, targetClient)) {
        return;
      }
    if (interaction.isChatInputCommand()) {
      const { commandName, options, user: reporter } = interaction;

      if (commandName === 'help') {
        return interaction.reply({
          content: 'Use `/info` for BeSafe Network information. Commands include `/check`, `/report`, `/setup`, `/verify`, `/link`, `/vote`, `/age-verify`, `/backup`, `/radio`, `/reputation`, and moderation tools.',
          ephemeral: true,
        });
      }

      if (commandName === 'status') {
        const uptimeSeconds = Math.floor((client.uptime || 0) / 1000);
        const shardId = shardConfig?.shardId ?? 0;
        const shardCount = shardConfig?.shardCount ?? 1;
        const embed = new EmbedBuilder()
          .setTitle('BeSafe Network | Shard Status')
          .setColor(0x10b981)
          .addFields(
            { name: 'Shard ID', value: `${shardId} / ${shardCount}`, inline: true },
            { name: 'Gateway Ping', value: `${client.ws.ping}ms`, inline: true },
            { name: 'Cached Guilds', value: `${client.guilds.cache.size}`, inline: true },
            { name: 'Uptime', value: `${uptimeSeconds}s`, inline: true },
            { name: 'Mode', value: shardConfig?.isSharded ? 'Distributed Shard' : 'Standalone', inline: true }
          );
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      if (commandName === 'report') {
        const target = options.getUser('target');
        const reporterId = reporter?.id || interaction.user?.id;
        const reporterTag = reporter?.tag || reporter?.username || interaction.user?.tag || interaction.user?.username;

        const baseUrl = process.env.APP_URL || 'https://besafe.network';
        const params = new URLSearchParams();
        if (target) {
          params.set('targetId', target.id);
          params.set('targetDisplayName', target.tag || target.username);
        }
        if (reporterId) {
          params.set('reporterId', reporterId);
        }
        if (reporterTag) {
          params.set('reporterTag', reporterTag);
        }

        const reportUrl = `${baseUrl}/report${params.toString() ? '?' + params.toString() : ''}`;

        try {
          if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply({ ephemeral: true });
          }
        } catch (e) {
          console.error('Failed to defer in report command', e);
        }

        try {
          await interaction.editReply({
            content: `📢 **Submit a Safety Report**\nReports are now submitted directly on our website for enhanced evidence handling, screenshot uploads, and security.\n\n👉 **[Click here to submit your report on our website](${reportUrl})**\nDirect Link: ${reportUrl}`
          });
        } catch (e) {
          console.error('Failed to reply in report command', e);
        }
      }

      if (commandName === 'check') {
        const target = options.getUser('user');
        const query = options.getString('query');
        if (!target && !query) {
          return interaction.reply({
            content: '❌ **Please specify a subject to check:** Provide a Discord `@user` mention OR a query string (Discord ID, VRChat User ID `usr_...`, username, or Case `#CASE-XXXX`).',
            ephemeral: true
          }).catch(() => null);
        }
        await checkUserStatus(target, interaction, query || undefined);
      }

      if (commandName === 'warn') {
        const target = options.getUser('target');
        const reason = options.getString('reason');
        if (!target || !reason) return;

        try {
          if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply({ ephemeral: false });
          }
        } catch (e) {
          console.error('Failed to defer in warn command', e);
        }

        let user = await User.findOne({ id: target.id });
        if (user && user.isTrusted) {
          try {
            return await interaction.editReply({ content: `❌ ${target.tag} is a Trusted Whitelist user and cannot be warned.` });
          } catch (e) {
            console.error(e);
            return;
          }
        }
        const warning = { reason, adminId: reporter.id, guildId: interaction.guildId };

        if (!user) {
          user = new User({
            id: target.id,
            username: target.username,
            warnings: [warning]
          });
        } else {
          user.warnings.push(warning);
        }
        await user.save();

        const guildData = await Guild.findOne({ id: interaction.guildId });
        const warnThreshold = guildData?.settings?.warningThreshold ?? 3;
        const localWarnings = user.warnings.filter((w: any) => w.guildId === interaction.guildId).length;

        if (localWarnings >= warnThreshold) {
          try {
            const member = await interaction.guild?.members.fetch(target.id);
            if (member) {
              const dmPayload = buildTransparentBanDM({
                userId: target.id,
                reason: `Warning threshold reached in ${interaction.guild?.name || 'server'} (${localWarnings}/${warnThreshold}): ${reason}`,
                severity: 'permanent',
                serverName: interaction.guild?.name,
                baseUrl: process.env.APP_URL || 'https://besafe.network'
              });
              await member.send(dmPayload).catch(() => null);
              await member.ban({ reason: `BeSafe Network: Warning threshold reached (${localWarnings}/${warnThreshold})` });
              await interaction.followUp({ content: `🚨 ${target.tag} has reached the server's warning threshold (${warnThreshold}) and has been automatically banned from this server.`, ephemeral: false }).catch(() => null);
            }
          } catch (e) {
            console.error('Failed to auto-ban on warnings', e);
          }
        }

        try {
          await interaction.editReply({ content: `Warned ${target.tag} for: ${reason}` });
        } catch (e) {
          console.error('Failed to reply in warn command', e);
        }
        try { await target.send(`You have received a warning in a server for: ${reason}`).catch(() => null); } catch (e) {}
      }

      if (commandName === 'reputation') {
        const target = options.getUser('target');
        const rating = options.getInteger('rating');
        if (!target || rating === null) return;
        if (target.id === interaction.user.id) {
          return interaction.reply({ content: "You cannot rate yourself.", ephemeral: true }).catch(() => null);
        }

        try {
          if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply({ ephemeral: true });
          }
        } catch (e) {
          console.error('Failed to defer in reputation command', e);
        }

        let user = await User.findOne({ id: target.id });
        if (!user) {
          user = new User({ id: target.id, username: target.username, reputation: 0 });
        }

        if (user.isTrusted) {
          try {
            return await interaction.editReply({ content: `${target.tag} is a Trusted User. Their reputation is locked at 100.` });
          } catch (e) {
            console.error(e);
            return;
          }
        }

        // Check for existing rating
        const existingRating = await ReputationRating.findOne({ userId: target.id, raterId: interaction.user.id });
        
        if (existingRating) {
          if (existingRating.rating === rating) {
            try {
              return await interaction.editReply({ content: `You have already given a ${rating > 0 ? 'positive' : 'negative'} rating to ${target.tag}.` });
            } catch (e) {
              console.error(e);
              return;
            }
          }
          
          // Update reputation (remove old, add new)
          user.reputation = (user.reputation || 0) - existingRating.rating + rating;
          existingRating.rating = rating;
          existingRating.updatedAt = new Date();
          await existingRating.save();
        } else {
          // New rating
          user.reputation = (user.reputation || 0) + rating;
          await new ReputationRating({
            userId: target.id,
            raterId: interaction.user.id,
            rating: rating
          }).save();
        }

        // Auto-ban check based on guild settings
        const guildSettings = await Guild.findOne({ id: interaction.guildId });
        const threshold = guildSettings?.settings?.autoBanThreshold ?? -10;

        if (user.reputation <= threshold) {
          try {
            const member = await interaction.guild?.members.fetch(target.id);
            if (member && !user.isBanned) {
              const dmPayload = buildTransparentBanDM({
                userId: target.id,
                reason: `Reputation fell below server threshold (${user.reputation} <= ${threshold})`,
                severity: 'permanent',
                serverName: interaction.guild?.name,
                baseUrl: process.env.APP_URL || 'https://besafe.network'
              });
              await member.send(dmPayload).catch(() => null);
              await member.ban({ reason: `BeSafe Network: Reputation below server threshold (${user.reputation} <= ${threshold})` });
              await interaction.followUp({ content: `${target.tag} has been automatically banned from this server due to low reputation.`, ephemeral: false }).catch(() => null);
            }
          } catch (e) {
            console.error('Failed to auto-ban in guild', e);
          }
        }
        user.trustIndex = calculateDynamicTrustIndex({
          isDangerous: !!user.isDangerous,
          isBanned: !!user.isBanned,
          reputation: user.reputation,
          isTrusted: !!user.isTrusted
        });
        await user.save();

        try {
          await interaction.editReply({ content: `Reputation updated for ${target.tag} (${user.reputation} pts • Trust Index: \`${user.trustIndex}\`).` });
        } catch (e) {
          console.error('Failed to reply in reputation command', e);
        }
      }

      if (commandName === 'setup') {
        if (!interaction.guild) return;
        
        const guildId = interaction.guild.id;
        const guildName = interaction.guild.name;

        try {
          if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply({ ephemeral: true });
          }
        } catch (e) {
          console.error('Failed to defer in setup command', e);
        }

        // Check if server is already linked to another user
        const existingGuild = await Guild.findOne({ id: guildId });
        if (existingGuild && existingGuild.ownerId && existingGuild.ownerId !== interaction.user.id) {
          try {
            return await interaction.editReply({ content: '❌ This server is already linked to another administrator.' });
          } catch (e) {
            console.error(e);
            return;
          }
        }

        // Check if the user has an account
        const adminAccount = await Admin.findOne({ discordId: interaction.user.id });
        if (!adminAccount) {
          try {
            return await interaction.editReply({ 
              content: '❌ You need to create an account on our dashboard first and link your Discord account before you can set up a server.\nVisit: ' + process.env.APP_URL + '/dashboard'
            });
          } catch (e) {
            console.error(e);
            return;
          }
        }
        
        await Guild.findOneAndUpdate(
          { id: guildId },
          { $set: { name: guildName, ownerId: interaction.user.id } },
          { upsert: true }
        );

        try {
          await interaction.editReply({ 
            content: `Server **${guildName}** linked successfully. You can now manage settings at: ${process.env.APP_URL}/dashboard`
          });
        } catch (e) {
          console.error(e);
        }
      }

      if (commandName === 'verify') {
        try {
          if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply({ ephemeral: true });
          }
        } catch (e) {
          console.error('Failed to defer in verify command', e);
        }

        const guildData = await Guild.findOne({ id: interaction.guildId });
        if (!guildData?.settings?.verificationEnabled) {
          try {
            return await interaction.editReply({ content: 'Verification is not enabled for this server.' });
          } catch (e) {
            console.error(e);
            return;
          }
        }

        const roleId = guildData.settings.verificationRoleId;
        if (!roleId) {
          try {
            return await interaction.editReply({ content: 'Verification role not configured.' });
          } catch (e) {
            console.error(e);
            return;
          }
        }

        const member = interaction.member as any;
        try {
          await member.roles.add(roleId);
          await interaction.editReply({ content: 'You have been verified!' });
        } catch (e) {
          try {
            await interaction.editReply({ content: 'Failed to assign role. Check bot permissions.' });
          } catch (err) {
            console.error(err);
          }
        }
      }

      if (commandName === 'link') {
        try {
          if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply({ ephemeral: true });
          }
        } catch (e) {
          console.error('Failed to defer in link command', e);
        }

        const inputCode = interaction.options.getString('code')?.trim()?.toUpperCase();

        if (inputCode) {
          const linkData = await LinkCode.findOne({ code: inputCode });
          if (!linkData) {
            return await interaction.editReply({ 
              content: '❌ Invalid or expired link code. Please generate a code from your web dashboard or run `/link` without a code.' 
            });
          }

          if (linkData.adminId) {
            await Admin.findByIdAndUpdate(linkData.adminId, { $set: { discordId: interaction.user.id } });
            await LinkCode.deleteOne({ _id: linkData._id });

            // Auto-verify if either account was verified
            const autoMatch = await checkAndAutoVerifyFromDiscord({
              adminId: linkData.adminId,
              discordId: interaction.user.id
            });

            return await interaction.editReply({ 
              content: `✅ Successfully linked your Discord account (**${interaction.user.tag}**) to your web dashboard account!${autoMatch ? ' 🔞 Your account has also been automatically age-verified!' : ''}` 
            });
          } else if (linkData.discordId) {
            return await interaction.editReply({ 
              content: `❌ Code **${inputCode}** was generated for Discord user <@${linkData.discordId}>. Please enter this code into your web dashboard instead!` 
            });
          }
        }

        // Check if user is already linked
        const alreadyLinked = await Admin.findOne({ discordId: interaction.user.id });
        if (alreadyLinked) {
          try {
            return await interaction.editReply({ content: `✅ Your Discord account is already linked to dashboard account: **${alreadyLinked.username}**.` });
          } catch (e) {
            console.error(e);
            return;
          }
        }

        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        await LinkCode.findOneAndUpdate(
          { discordId: interaction.user.id },
          { $set: { code, discordId: interaction.user.id }, $unset: { adminId: 1 } },
          { upsert: true }
        );
        try {
          await interaction.editReply({ 
            content: `Your Discord linking code is: **${code}**\n\nGo to your web dashboard -> **Discord Link** tab and enter this code to connect your account. This code expires in 10 minutes.`
          });
        } catch (e) {
          console.error(e);
        }
      }

      if (commandName === 'age-verify') {
        const config = await SystemConfig.findOne({ id: 'main' });
        const isGlobalDisabled = Boolean(config?.disableAgeVerifyCommand);
        let isGuildDisabled = false;
        if (interaction.guildId) {
          const guild = await Guild.findOne({ id: interaction.guildId });
          if (guild?.settings?.disableAgeVerifyCommand) {
            isGuildDisabled = true;
          }
        }

        if (isGlobalDisabled || isGuildDisabled) {
          try {
            if (!interaction.deferred && !interaction.replied) {
              await interaction.deferReply({ ephemeral: true });
            }
            return await interaction.editReply({
              content: `❌ **Command Disabled:** The \`/age-verify\` slash command has been disabled by the ${isGlobalDisabled ? 'system' : 'server'} administrator and has been unsynced from Discord.`
            });
          } catch (e) {
            console.error('Failed to reply to disabled age-verify command', e);
            return;
          }
        }

        try {
          if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply({ ephemeral: true });
          }
        } catch (e) {
          console.error('Failed to defer in age-verify command', e);
        }

        const user = await User.findOne({ id: interaction.user.id });
        if (user?.isAgeVerified) {
          try {
            return await interaction.editReply({ content: `✅ You are already age-verified! Use \`/agerole\` to sync your roles in this server.` });
          } catch (e) {
            console.error(e);
            return;
          }
        }

        const verifyUrl = `${process.env.APP_URL}/verify?user_id=${interaction.user.id}`;
        
        try {
          await interaction.editReply({ 
            content: `🛡️ **Internal Age Verification**\nTo access age-restricted content, please verify your age by uploading your ID and a face photo on our website.\n\n[Click here to start verification](${verifyUrl})\n\n**Note: Your data is handled securely and reviewed by our administrators.**`
          });
        } catch (e) {
          console.error(e);
        }
      }

      if (commandName === 'agerole') {
        if (!interaction.guild) return;

        try {
          if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply({ ephemeral: true });
          }
        } catch (e) {
          console.error('Failed to defer in agerole command', e);
        }

        const guildData = await Guild.findOne({ id: interaction.guild.id });
        if (!guildData?.settings?.ageRoleEnabled) {
          try {
            return await interaction.editReply({ content: 'Age verification roles are not enabled on this server.' });
          } catch (e) {
            console.error(e);
            return;
          }
        }

        const user = await User.findOne({ id: interaction.user.id });
        if (!user?.isAgeVerified) {
          const cfg = await SystemConfig.findOne({ id: 'main' });
          const isAgeVerifyOff = Boolean(cfg?.disableAgeVerifyCommand) || Boolean(guildData?.settings?.disableAgeVerifyCommand);
          try {
            return await interaction.editReply({ 
              content: isAgeVerifyOff 
                ? '❌ You are not age-verified. (The `/age-verify` slash command is currently disabled by administrator).'
                : '❌ You are not age-verified. Use `/age-verify` to start the process.' 
            });
          } catch (e) {
            console.error(e);
            return;
          }
        }

        // Check if 18+
        if (!user.dob) {
          try {
            return await interaction.editReply({ content: 'Verification data incomplete. Please re-verify.' });
          } catch (e) {
            console.error(e);
            return;
          }
        }
        const age = new Date().getFullYear() - user.dob.getFullYear();
        const m = new Date().getMonth() - user.dob.getMonth();
        const isAdult = age > 18 || (age === 18 && m >= 0);

        if (!isAdult) {
          try {
            return await interaction.editReply({ content: '🔞 You must be at least 18 years old to receive this role.' });
          } catch (e) {
            console.error(e);
            return;
          }
        }

        const roleId = guildData.settings.ageRoleId;
        if (!roleId) {
          try {
            return await interaction.editReply({ content: 'Age role not configured by server admins.' });
          } catch (e) {
            console.error(e);
            return;
          }
        }

        const member = interaction.member as any;
        try {
          await member.roles.add(roleId);
          await interaction.editReply({ content: '✅ Your age role has been synced!' });
        } catch (e) {
          try {
            await interaction.editReply({ content: 'Failed to assign role. Check bot permissions.' });
          } catch (err) {
            console.error(err);
          }
        }
      }

      if (commandName === 'agecheck') {
        const target = options.getUser('user');
        if (!target) return;
        await runAgeCheck(target, interaction);
      }

      if (commandName === 'age-delete' || commandName === 'agedelete') {
        await runAgeDelete(interaction.user, interaction);
      }

      if (commandName === 'backup') {
        if (!interaction.guild) {
          return interaction.reply({ content: '❌ This command can only be used inside a Discord server.', ephemeral: true }).catch(() => null);
        }

        const sub = options.getSubcommand();
        try {
          if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply({ ephemeral: true });
          }
        } catch (e) {
          console.error('Failed to defer in backup command', e);
        }

        const memberPermissions = interaction.memberPermissions;
        if (!memberPermissions || !memberPermissions.has(PermissionFlagsBits.Administrator)) {
          return interaction.editReply({ content: '❌ You must have Administrator permissions to manage server backups.' }).catch(() => null);
        }

        const guild = interaction.guild;

        if (sub === 'create') {
          const customName = options.getString('name');
          try {
            const backup = await createGuildBackup(guild, interaction.user.id, interaction.user.tag || interaction.user.username, customName || undefined);
            return await interaction.editReply({
              content: `✅ **Server Backup Snapshot Created!**\n\n` +
                `• **Backup ID:** \`${backup._id}\`\n` +
                `• **Label:** ${backup.name}\n` +
                `• **Roles Saved:** ${backup.roles.length}\n` +
                `• **Categories Saved:** ${backup.categories.length}\n` +
                `• **Channels Saved:** ${backup.channels.length}\n` +
                `• **Bans Saved:** ${backup.bans ? backup.bans.length : 0}\n\n` +
                `In case of a raid or accidental changes, roll back using \`/backup restore id:${backup._id}\` or through your web dashboard!`
            });
          } catch (err: any) {
            console.error('Failed to create backup:', err);
            return await interaction.editReply({ content: `❌ Failed to create backup snapshot: ${err?.message || 'Unknown error'}` });
          }
        }

        if (sub === 'list') {
          try {
            const backups = await ServerBackup.find({ guildId: guild.id }).sort({ createdAt: -1 }).limit(10);
            if (!backups || backups.length === 0) {
              return await interaction.editReply({ content: '📦 No backups found for this server. Use \`/backup create\` to take a snapshot.' });
            }

            const listStr = backups.map((b: any, idx: number) => 
              `**${idx + 1}. ${b.name}**\n` +
              `> ID: \`${b._id}\` | Created: ${new Date(b.createdAt).toLocaleString()}\n` +
              `> ${b.roles.length} Roles, ${b.categories.length} Categories, ${b.channels.length} Channels`
            ).join('\n\n');

            return await interaction.editReply({
              content: `🛡️ **Saved Backups for ${guild.name}** (${backups.length} snapshot${backups.length > 1 ? 's' : ''}):\n\n${listStr}\n\nTo restore a backup, run: \`/backup restore id:<BACKUP_ID>\``
            });
          } catch (err: any) {
            return await interaction.editReply({ content: `❌ Failed to list backups: ${err?.message}` });
          }
        }

        if (sub === 'restore') {
          const backupId = options.getString('id');
          if (!backupId) return interaction.editReply({ content: '❌ Backup ID is required.' }).catch(() => null);

          try {
            let backup = await ServerBackup.findById(backupId).catch(() => null);
            if (!backup) {
              backup = await ServerBackup.findOne({ id: backupId, guildId: guild.id }).catch(() => null);
            }
            if (!backup || backup.guildId !== guild.id) {
              return await interaction.editReply({ content: '❌ Backup ID not found for this server.' }).catch(() => null);
            }

            await interaction.editReply({ content: `🔄 **Initiating Server Rollback...** Restoring ${backup.roles?.length || 0} roles, ${backup.categories?.length || 0} categories, and ${backup.channels?.length || 0} channels. Please wait...` }).catch(() => null);

            await restoreGuildBackup(guild, backup);

            return await interaction.followUp({
              content: `🛡️ **Server Rollback Completed Successfully!**\n\nServer **${guild.name}** has been restored to backup **"${backup.name}"** (${new Date(backup.createdAt).toLocaleString()}).`,
              ephemeral: true
            }).catch(async () => {
              try {
                await interaction.user.send(`🛡️ **Server Rollback Completed Successfully!**\n\nServer **${guild.name}** has been restored to backup **"${backup.name}"**.`);
              } catch (e) {}
            });
          } catch (err: any) {
            console.error('Failed to restore backup:', err?.message || err);
            return await interaction.followUp({ content: `❌ Error during restore process: ${err?.message}`, ephemeral: true }).catch(async () => {
              try {
                await interaction.user.send(`❌ Error during restore process on ${guild.name}: ${err?.message}`);
              } catch (e) {}
            });
          }
        }

        if (sub === 'delete') {
          const backupId = options.getString('id');
          if (!backupId) return interaction.editReply({ content: '❌ Backup ID is required.' });

          try {
            let deleted = await ServerBackup.findOneAndDelete({ _id: backupId, guildId: guild.id }).catch(() => null);
            if (!deleted) {
              deleted = await ServerBackup.findOneAndDelete({ id: backupId, guildId: guild.id }).catch(() => null);
            }
            if (!deleted) {
              return await interaction.editReply({ content: '❌ Backup snapshot not found or already deleted.' });
            }
            return await interaction.editReply({ content: `🗑️ Server backup \`${backupId}\` deleted successfully.` });
          } catch (err: any) {
            return await interaction.editReply({ content: `❌ Failed to delete backup: ${err?.message}` });
          }
        }
      }

      if (commandName === 'info') {
        const baseUrl = process.env.APP_URL || 'https://besafe.network';
        const infoConfig = await SystemConfig.findOne({ id: 'main' });
        const isAgeVerifyOff = Boolean(infoConfig?.disableAgeVerifyCommand);
        const infoEmbed = {
          title: '🛡️ BeSafe Network | Global Safety Network',
          description: 'BeSafe Network is an advanced global security platform protecting Discord communities and VRChat groups from malicious actors, predators, exploiters, and raid attacks.',
          color: 0x6366f1,
          thumbnail: { url: 'https://cdn-icons-png.flaticon.com/512/2092/2092663.png' },
          fields: [
            {
              name: '🌐 Threat Intelligence & Global Banlist',
              value: '• **Global Banlist:** Synchronized ban enforcement across connected servers.\n• **Reputation System:** Community-driven trust scores and rating history.\n• **Auto-Moderation:** Instant containment of known threats and bad actors.',
              inline: false
            },
            {
              name: '📻 CreatorPlaza Radio (24/7 Stream)',
              value: '• `/radio [play|stop|np|volume]` — Stream CreatorPlaza Radio in your voice channel.\n• `/np` — Fetch current song name & artist.\n• `/volume <1-100>` — Adjust playback volume.\n• `/stop` — Stop radio and leave voice channel.',
              inline: false
            },
            {
              name: '🆔 Manual Age & Identity Verification',
              value: isAgeVerifyOff
                ? '• **Manual Review Process:** Secure photo ID and selfie review by staff.\n• **Role Synchronization:** Automatic verified age role assignment.\n• **Status:** ⚠️ */age-verify slash command is currently disabled & unsynced by admin.*'
                : '• **Manual Review Process:** Secure photo ID and selfie review by staff to prevent data leaks.\n• **Role Synchronization:** Automatic verified age role assignment.\n• **Anti-Predator Shield:** Keep age-restricted channels safe.',
              inline: false
            },
            {
              name: '📦 Anti-Raid Backups & Rollbacks',
              value: '• **Full Snapshots:** Capture roles, channels, categories, and permissions.\n• **Instant Restore:** 1-click server rollback after raid attacks.',
              inline: false
            },
            {
              name: '🎮 VRChat Group Moderation & Sync',
              value: '• **Cross-Platform Sync:** Automatically sync Discord bans to VRChat Groups.\n• **Group Bot Integration:** Automated bot invite and group member moderation.',
              inline: false
            },
            {
              name: '📜 Command Reference',
              value: `• \`/check <user>\` — View global standing & ban history\n• \`/report [user]\` — Submit evidence on web portal\n• \`/reputation <user> <+1/-1>\` — Rate user reputation\n• \`/warn <user> <reason>\` — Issue moderation warning\n• \`/radio play\` — Play CreatorPlaza Radio in VC\n• \`/np\` — Now playing track & artist\n• \`/volume <1-100>\` — Set radio volume\n• \`/stop\` — Stop radio & disconnect\n• \`/verify\` — Server member verification\n${isAgeVerifyOff ? '• `[DISABLED]` `/age-verify` — (Unsynced / Disabled by Admin)\n' : '• `/age-verify` — Launch manual age verification\n'}• \`/agerole\` — Sync verified age role\n• \`/age-delete\` — Self-service deletion of your own age verification data & records\n• \`/backup <create|list|restore>\` — Server anti-raid backup system\n• \`/setup\` — Link server to web dashboard\n• \`/vote\` — Vote for BeSafe on top.gg`,
              inline: false
            },
            {
              name: '🔗 Web Dashboard & Portal',
              value: `[**Open Dashboard**](${baseUrl}) • [**CreatorPlaza Radio**](https://creatorplaza.nl/radio) • [**Submit Report**](${baseUrl}/report)`,
              inline: false
            }
          ],
          footer: {
            text: 'BeSafe Network • Community Security Network',
            icon_url: 'https://cdn-icons-png.flaticon.com/512/1063/1063376.png'
          },
          timestamp: new Date().toISOString()
        };

        await interaction.reply({
          embeds: [infoEmbed],
          ephemeral: false
        }).catch(() => null);
      }

      if (commandName === 'vote') {
        const botId = targetClient.user?.id || client.user?.id || process.env.DISCORD_CLIENT_ID || '';
        const voteUrl = botId ? `https://top.gg/bot/${botId}/vote` : 'https://top.gg';
        return interaction.reply({
          content: `🗳️ **Support BeSafe Network!**\nVoting helps keep the bots online and the banlist growing.\n\n👉 **[Vote on top.gg](${voteUrl})**\nYou can vote once every 12 hours — thank you!`,
          ephemeral: false,
        }).catch(() => null);
      }

      if (commandName === 'radio') {
        if (!interaction.guild) {
          return interaction.reply({ content: '❌ Radio commands can only be used in a Discord server.', ephemeral: true }).catch(() => null);
        }

        const sub = options.getSubcommand(false) || 'play';

        if (sub === 'play') {
          try {
            if (!interaction.deferred && !interaction.replied) {
              await interaction.deferReply();
            }
          } catch (e) {}

          const member = interaction.member as any;
          const voiceChannel = member?.voice?.channel;

          if (!voiceChannel) {
            return await interaction.editReply({
              content: '❌ **You must be in a voice channel** to play CreatorPlaza Radio! Join a voice channel and try again.'
            });
          }

          const permissions = voiceChannel.permissionsFor(interaction.client.user?.id || interaction.guild.members.me?.id);
          if (permissions && (!permissions.has(PermissionFlagsBits.Connect) || !permissions.has(PermissionFlagsBits.Speak))) {
            return await interaction.editReply({
              content: '❌ **Missing Permissions:** The bot needs permissions to **Connect** and **Speak** in your voice channel.'
            });
          }

          const initialVol = options.getInteger('volume') ?? undefined;

          await interaction.editReply({
            content: '⏳ **Connecting to CreatorPlaza Radio & pre-buffering 10 seconds of audio...**\n*Building 10-second anti-stutter buffer cushion to eliminate audio cutouts...*'
          }).catch(() => null);

          try {
            const session = await joinAndPlayRadio(interaction.guild, voiceChannel, interaction.user, initialVol);
            const np = await fetchCreatorPlazaNowPlaying();

            const playEmbed = {
              title: '📻 CreatorPlaza Radio | Now Streaming',
              description: `🎶 **Now Playing:** **${np.title}**\n🎤 **Artist:** **${np.artist}**\n\n🔊 **Volume:** \`${session.volume}%\`\n📡 **Voice Channel:** <#${voiceChannel.id}>\n👥 **Listeners:** \`${np.listeners}\`\n⚡ **Audio Buffer:** \`10s Anti-Stutter Cushion Active\``,
              color: 0xf97316,
              thumbnail: np.artUrl ? { url: np.artUrl } : { url: 'https://creatorplaza.nl/radio' },
              fields: [
                {
                  name: '🌐 Radio Website',
                  value: '[**creatorplaza.nl/radio**](https://creatorplaza.nl/radio)',
                  inline: true
                },
                {
                  name: '🔗 Stream URL',
                  value: '[**stream.creatorplaza.nl/main**](https://stream.creatorplaza.nl/main)',
                  inline: true
                },
                {
                  name: '🎛️ Radio Commands',
                  value: '• `/np` — Show current song & artist\n• `/volume <1-100>` — Adjust playback volume\n• `/stop` — Stop radio & leave voice channel',
                  inline: false
                }
              ],
              footer: {
                text: 'CreatorPlaza Radio • 24/7 Shoutcast Stream',
                icon_url: 'https://cdn-icons-png.flaticon.com/512/3845/3845868.png'
              },
              timestamp: new Date().toISOString()
            };

            return await interaction.editReply({ embeds: [playEmbed] });
          } catch (err: any) {
            console.error('[CreatorPlaza Radio] Failed to start radio:', err);
            return await interaction.editReply({ content: `❌ Failed to connect or start CreatorPlaza Radio: ${err?.message || 'Unknown error'}` });
          }
        }

        if (sub === 'stop') {
          try {
            if (!interaction.deferred && !interaction.replied) {
              await interaction.deferReply();
            }
          } catch (e) {}

          const stopped = stopRadioInGuild(interaction.guild.id);
          if (stopped) {
            const stopEmbed = {
              title: '⏹️ CreatorPlaza Radio Stopped',
              description: 'Successfully stopped the stream and left the voice channel.\n\nUse `/radio play` anytime to start listening again!',
              color: 0xef4444,
              footer: {
                text: 'CreatorPlaza Radio • creatorplaza.nl/radio',
                icon_url: 'https://cdn-icons-png.flaticon.com/512/3845/3845868.png'
              }
            };
            return await interaction.editReply({ embeds: [stopEmbed] });
          } else {
            return await interaction.editReply({ content: 'ℹ️ CreatorPlaza Radio is not currently playing in this server.' });
          }
        }

        if (sub === 'np') {
          try {
            if (!interaction.deferred && !interaction.replied) {
              await interaction.deferReply();
            }
          } catch (e) {}

          const np = await fetchCreatorPlazaNowPlaying();
          const session = radioSessions.get(interaction.guild.id);

          const npEmbed: any = {
            title: '📻 CreatorPlaza Radio | Now Playing',
            description: `🎶 **Track:** **${np.title}**\n🎤 **Artist:** **${np.artist}**`,
            color: 0xf97316,
            thumbnail: np.artUrl ? { url: np.artUrl } : undefined,
            fields: [
              {
                name: '👥 Live Listeners',
                value: `\`${np.listeners}\``,
                inline: true
              },
              {
                name: '🔊 Voice Volume',
                value: session ? `\`${session.volume}%\`` : '`Not playing in VC`',
                inline: true
              },
              {
                name: '🌐 Radio Page',
                value: '[**creatorplaza.nl/radio**](https://creatorplaza.nl/radio)',
                inline: true
              },
              {
                name: '📡 Stream URL',
                value: '[**stream.creatorplaza.nl/main**](https://stream.creatorplaza.nl/main)',
                inline: false
              }
            ],
            footer: {
              text: 'CreatorPlaza Radio • Live Shoutcast Stream',
              icon_url: 'https://cdn-icons-png.flaticon.com/512/3845/3845868.png'
            },
            timestamp: new Date().toISOString()
          };

          if (np.history && np.history.length > 0) {
            npEmbed.fields.push({
              name: '🕒 Recently Played',
              value: np.history.map((h: any, idx: number) => `\`${idx + 1}.\` **${h.title}** - *${h.artist}*`).join('\n'),
              inline: false
            });
          }

          return await interaction.editReply({ embeds: [npEmbed] });
        }

        if (sub === 'volume') {
          const level = options.getInteger('level', true);
          const res = setRadioVolume(interaction.guild.id, level);

          if (res.inVoice) {
            return await interaction.reply({
              content: `🔊 **CreatorPlaza Radio** volume adjusted to **${res.volume}%**`
            }).catch(() => null);
          } else {
            return await interaction.reply({
              content: `🔊 Set default **CreatorPlaza Radio** volume to **${res.volume}%** (Use \`/radio play\` to connect and stream).`
            }).catch(() => null);
          }
        }
      }

      if (commandName === 'np') {
        try {
          if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply();
          }
        } catch (e) {}

        const np = await fetchCreatorPlazaNowPlaying();
        const session = interaction.guildId ? radioSessions.get(interaction.guildId) : null;

        const npEmbed: any = {
          title: '📻 CreatorPlaza Radio | Now Playing',
          description: `🎶 **Track:** **${np.title}**\n🎤 **Artist:** **${np.artist}**`,
          color: 0xf97316,
          thumbnail: np.artUrl ? { url: np.artUrl } : undefined,
          fields: [
            {
              name: '👥 Live Listeners',
              value: `\`${np.listeners}\``,
              inline: true
            },
            {
              name: '🔊 Voice Volume',
              value: session ? `\`${session.volume}%\`` : '`Not playing in VC`',
              inline: true
            },
            {
              name: '🌐 Radio Page',
              value: '[**creatorplaza.nl/radio**](https://creatorplaza.nl/radio)',
              inline: true
            },
            {
              name: '📡 Stream URL',
              value: '[**stream.creatorplaza.nl/main**](https://stream.creatorplaza.nl/main)',
              inline: false
            }
          ],
          footer: {
            text: 'CreatorPlaza Radio • Live Shoutcast Stream',
            icon_url: 'https://cdn-icons-png.flaticon.com/512/3845/3845868.png'
          },
          timestamp: new Date().toISOString()
        };

        if (np.history && np.history.length > 0) {
          npEmbed.fields.push({
            name: '🕒 Recently Played',
            value: np.history.map((h: any, idx: number) => `\`${idx + 1}.\` **${h.title}** - *${h.artist}*`).join('\n'),
            inline: false
          });
        }

        return await interaction.editReply({ embeds: [npEmbed] });
      }

      if (commandName === 'stop') {
        if (!interaction.guild) {
          return interaction.reply({ content: '❌ This command must be used in a Discord server.', ephemeral: true }).catch(() => null);
        }

        try {
          if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply();
          }
        } catch (e) {}

        const stopped = stopRadioInGuild(interaction.guild.id);
        if (stopped) {
          const stopEmbed = {
            title: '⏹️ CreatorPlaza Radio Stopped',
            description: 'Successfully stopped the stream and left the voice channel.\n\nUse `/radio play` anytime to start listening again!',
            color: 0xef4444,
            footer: {
              text: 'CreatorPlaza Radio • creatorplaza.nl/radio',
              icon_url: 'https://cdn-icons-png.flaticon.com/512/3845/3845868.png'
            }
          };
          return await interaction.editReply({ embeds: [stopEmbed] });
        } else {
          return await interaction.editReply({ content: 'ℹ️ CreatorPlaza Radio is not currently playing in this server.' });
        }
      }

      if (commandName === 'volume') {
        if (!interaction.guild) {
          return interaction.reply({ content: '❌ This command must be used in a Discord server.', ephemeral: true }).catch(() => null);
        }

        const level = options.getInteger('level', true);
        const res = setRadioVolume(interaction.guild.id, level);

        if (res.inVoice) {
          return await interaction.reply({
            content: `🔊 **CreatorPlaza Radio** volume adjusted to **${res.volume}%**`
          }).catch(() => null);
        } else {
          return await interaction.reply({
            content: `🔊 Set default **CreatorPlaza Radio** volume to **${res.volume}%** (Use \`/radio play\` to connect and stream).`
          }).catch(() => null);
        }
      }
    }

    // Handle User Context Menu Commands
    if (interaction.isUserContextMenuCommand()) {
      const { commandName, targetUser } = interaction;

      if (commandName === 'Check User Status') {
        await checkUserStatus(targetUser, interaction);
      }

      if (commandName === 'Age Check User') {
        await runAgeCheck(targetUser, interaction);
      }

      if (commandName === 'Delete Age Data') {
        await runAgeDelete(targetUser, interaction);
      }

      if (commandName === 'Report User') {
        const modal = new ModalBuilder()
          .setCustomId(`report_modal:${targetUser.id}:${encodeURIComponent(targetUser.tag || targetUser.username)}`)
          .setTitle(`Report ${targetUser.username.substring(0, 25)}`);

        const reasonInput = new TextInputBuilder()
          .setCustomId('reason')
          .setLabel('Violation Reason & Incident Details')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setPlaceholder('Describe the violation, harassment, scam, or safety incident...');

        const evidenceInput = new TextInputBuilder()
          .setCustomId('evidence')
          .setLabel('Evidence Links / Proof (Optional)')
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setPlaceholder('https://imgur.com/... or Discord screenshot link');

        const vrchatInput = new TextInputBuilder()
          .setCustomId('vrchat')
          .setLabel('Subject VRChat Account / ID (Optional)')
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setPlaceholder('usr_... or VRChat profile link');

        const emailInput = new TextInputBuilder()
          .setCustomId('email')
          .setLabel('Your Email Address (For Email Updates)')
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setPlaceholder('name@example.com (Optional - receive email notifications)');

        modal.addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(reasonInput),
          new ActionRowBuilder<TextInputBuilder>().addComponents(evidenceInput),
          new ActionRowBuilder<TextInputBuilder>().addComponents(vrchatInput),
          new ActionRowBuilder<TextInputBuilder>().addComponents(emailInput)
        );

        await interaction.showModal(modal);
      }

      if (commandName === 'Warn User') {
        const modal = new ModalBuilder()
          .setCustomId(`warn_modal:${targetUser.id}`)
          .setTitle(`Warn ${targetUser.username.substring(0, 30)}`);

        const reasonInput = new TextInputBuilder()
          .setCustomId('reason')
          .setLabel('Reason for the warning')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setPlaceholder('Enter reason for this warning...');

        const row = new ActionRowBuilder<TextInputBuilder>().addComponents(reasonInput);
        modal.addComponents(row);

        await interaction.showModal(modal);
      }

      if (commandName === 'Rate Reputation') {
        const modal = new ModalBuilder()
          .setCustomId(`rep_modal:${targetUser.id}`)
          .setTitle(`Rate ${targetUser.username.substring(0, 30)}`);

        const ratingInput = new TextInputBuilder()
          .setCustomId('rating')
          .setLabel('Rating (Value: +1 or -1)')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setPlaceholder('Enter +1 for Positive, or -1 for Negative')
          .setValue('+1');

        const row = new ActionRowBuilder<TextInputBuilder>().addComponents(ratingInput);
        modal.addComponents(row);

        await interaction.showModal(modal);
      }
    }

    // Handle Message Context Menu Commands
    if (interaction.isMessageContextMenuCommand()) {
      const { commandName, targetMessage } = interaction;

      if (commandName === 'Report Message') {
        const targetAuthor = targetMessage.author;

        const modal = new ModalBuilder()
          .setCustomId(`report_msg_modal:${targetAuthor.id}:${encodeURIComponent(targetAuthor.tag || targetAuthor.username)}:${encodeURIComponent(targetMessage.url)}`)
          .setTitle(`Report Msg by ${targetAuthor.username.substring(0, 20)}`);

        const reasonInput = new TextInputBuilder()
          .setCustomId('reason')
          .setLabel('Violation Reason & Incident Details')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setPlaceholder('Describe why this message violates safety rules...');

        const evidenceInput = new TextInputBuilder()
          .setCustomId('evidence')
          .setLabel('Additional Evidence Links (Optional)')
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setValue(targetMessage.url)
          .setPlaceholder('https://... Message URL auto-attached');

        const vrchatInput = new TextInputBuilder()
          .setCustomId('vrchat')
          .setLabel('Subject VRChat Account / ID (Optional)')
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setPlaceholder('usr_... or VRChat profile link');

        const emailInput = new TextInputBuilder()
          .setCustomId('email')
          .setLabel('Your Email Address (For Email Updates)')
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setPlaceholder('name@example.com (Optional - receive email notifications)');

        modal.addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(reasonInput),
          new ActionRowBuilder<TextInputBuilder>().addComponents(evidenceInput),
          new ActionRowBuilder<TextInputBuilder>().addComponents(vrchatInput),
          new ActionRowBuilder<TextInputBuilder>().addComponents(emailInput)
        );

        await interaction.showModal(modal);
      }
    }

    // Handle Modal Submissions
    if (interaction.isModalSubmit()) {
      const { customId, fields } = interaction;
      const [modalType, targetUserId] = customId.split(':');

      if (modalType === 'report_modal' || modalType === 'report_msg_modal') {
        await interaction.deferReply({ ephemeral: true });

        const parts = customId.split(':');
        const tId = parts[1];
        const targetDisplayName = decodeURIComponent(parts[2] || tId);
        const autoMsgUrl = parts[3] ? decodeURIComponent(parts[3]) : '';

        const reason = fields.getTextInputValue('reason');
        const rawEvidence = fields.getTextInputValue('evidence') || '';
        const rawVrchat = fields.getTextInputValue('vrchat') || '';
        let rawEmail = '';
        try {
          rawEmail = fields.getTextInputValue('email') || '';
        } catch (e) {}

        // Extract VRChat User ID ONLY
        const cleanedVrchat = extractVRChatUserId(rawVrchat);

        const evidenceLinks: string[] = [];
        if (autoMsgUrl) evidenceLinks.push(autoMsgUrl);
        if (rawEvidence && rawEvidence !== autoMsgUrl) {
          evidenceLinks.push(rawEvidence);
        }

        const reporterTag = interaction.user.tag || interaction.user.username;
        const reporterUserId = interaction.user.id;
        const reporterEmail = rawEmail.trim() || `${interaction.user.username}@discord.user`;

        const report = new Report({
          targetUserId: tId,
          targetDisplayName,
          reporterUserId: `${reporterTag} (${reporterUserId})`,
          reporterEmail,
          reason,
          evidenceLinks,
          vrchatAccount: cleanedVrchat,
          status: 'pending',
          createdAt: new Date()
        });

        await safeSaveReport(report);
        await notifyAdmins(
          'New Incident Report (Discord Context Menu)',
          `A new report ticket was filed against **${targetDisplayName}** (${tId}) by ${reporterTag}.${reporterEmail.endsWith('@discord.user') ? '' : ` (Email: ${reporterEmail})`}\nReason: ${reason}${cleanedVrchat ? `\nVRChat ID: ${cleanedVrchat}` : ''}`
        );

        const baseUrl = process.env.APP_URL || 'https://besafe.network';
        const webUploadUrl = `${baseUrl}/report?targetId=${tId}&targetDisplayName=${encodeURIComponent(targetDisplayName)}&reporterId=${reporterUserId}&reporterEmail=${encodeURIComponent(reporterEmail)}&vrchatAccount=${encodeURIComponent(cleanedVrchat)}`;

        const embed = new EmbedBuilder()
          .setTitle('🛡️ Incident Intelligence Report Transmitted')
          .setColor(0xd97706)
          .setDescription(`Your safety report against **${targetDisplayName}** (\`${tId}\`) has been logged in the intelligence queue.`)
          .addFields(
            { name: 'Report ID', value: `\`${report._id}\``, inline: true },
            { name: 'Status', value: '`PENDING TRIAGE`', inline: true },
            { name: 'Violation Reason', value: reason.length > 200 ? reason.substring(0, 200) + '...' : reason, inline: false }
          );

        if (cleanedVrchat) {
          embed.addFields({ name: 'Extracted VRChat User ID', value: `\`${cleanedVrchat}\``, inline: true });
        }

        if (evidenceLinks.length > 0) {
          embed.addFields({ name: 'Evidence Links', value: evidenceLinks.join('\n'), inline: false });
        }

        embed.addFields({
          name: '📸 Screenshot File Uploads',
          value: `Need to upload screenshot images? [**Click here to attach screenshots on the Web Portal**](${webUploadUrl})`,
          inline: false
        });

        embed.setFooter({ text: 'BeSafe Network • Security Intelligence Registry' });

        await interaction.followUp({
          embeds: [embed],
          ephemeral: true
        });
        return;
      }

      if (modalType === 'warn_modal') {
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.ModerateMembers)) {
          await interaction.reply({ content: '❌ You do not have permissions (Moderate Members) to warn users.', ephemeral: true });
          return;
        }
        await interaction.deferReply({ ephemeral: false });

        const targetUser = await interaction.client.users.fetch(targetUserId).catch(() => null);
        if (!targetUser) {
          await interaction.followUp({ content: 'Could not fetch target user data.', ephemeral: true }).catch(() => null);
          return;
        }
        const reason = fields.getTextInputValue('reason');

        let user = await User.findOne({ id: targetUser.id });
        if (user && user.isTrusted) {
          await interaction.followUp({ content: `❌ ${targetUser.tag} is a Trusted Whitelist user and cannot be warned.`, ephemeral: true }).catch(() => null);
          return;
        }
        const warning = { reason, adminId: interaction.user.id, guildId: interaction.guildId };

        if (!user) {
          user = new User({
            id: targetUser.id,
            username: targetUser.username,
            warnings: [warning]
          });
        } else {
          user.warnings.push(warning);
        }
        await user.save();

        const guildData = await Guild.findOne({ id: interaction.guildId });
        const warnThreshold = guildData?.settings?.warningThreshold ?? 3;
        const localWarnings = user.warnings.filter((w: any) => w.guildId === interaction.guildId).length;

        if (localWarnings >= warnThreshold) {
          try {
            const member = await interaction.guild?.members.fetch(targetUser.id);
            if (member) {
              const dmPayload = buildTransparentBanDM({
                userId: targetUser.id,
                reason: `Warning threshold reached in ${interaction.guild?.name || 'server'} (${localWarnings}/${warnThreshold}): ${reason}`,
                severity: 'permanent',
                serverName: interaction.guild?.name,
                baseUrl: process.env.APP_URL || 'https://besafe.network'
              });
              await member.send(dmPayload).catch(() => null);
              await member.ban({ reason: `BeSafe Network: Warning threshold reached (${localWarnings}/${warnThreshold})` });
              await interaction.followUp({ content: `🚨 ${targetUser.tag} has reached the server's warning threshold (${warnThreshold}) and has been automatically banned from this server.`, ephemeral: false }).catch(() => null);
            }
          } catch (e) {
            console.error('Failed to auto-ban on warnings', e);
          }
        }

        await interaction.followUp({ content: `Warned ${targetUser.tag} for: ${reason}`, ephemeral: false }).catch(() => null);
        try { await targetUser.send(`You have received a warning in a server for: ${reason}`); } catch (e) {}
      }

      if (modalType === 'rep_modal') {
        await interaction.deferReply({ ephemeral: true });
        const targetUser = await interaction.client.users.fetch(targetUserId).catch(() => null);
        if (!targetUser) {
          await interaction.followUp({ content: 'Could not fetch target user data.', ephemeral: true }).catch(() => null);
          return;
        }
        const ratingStr = fields.getTextInputValue('rating').trim();
        let rating = parseInt(ratingStr);
        if (ratingStr === '+1') rating = 1;
        
        if (isNaN(rating) || (rating !== 1 && rating !== -1)) {
          await interaction.followUp({ content: '❌ Invalid rating. Please enter standard ratings of 1, +1 or -1.', ephemeral: true }).catch(() => null);
          return;
        }

        if (targetUser.id === interaction.user.id) {
          await interaction.followUp({ content: "You cannot rate yourself.", ephemeral: true }).catch(() => null);
          return;
        }

        let user = await User.findOne({ id: targetUser.id });
        if (!user) {
          user = new User({ id: targetUser.id, username: targetUser.username, reputation: 0 });
        }

        if (user.isTrusted) {
          await interaction.followUp({ content: `${targetUser.tag} is a Trusted User. Their reputation is locked at 100.`, ephemeral: true }).catch(() => null);
          return;
        }

        // Check for existing rating
        const existingRating = await ReputationRating.findOne({ userId: targetUser.id, raterId: interaction.user.id });
        
        if (existingRating) {
          if (existingRating.rating === rating) {
            await interaction.followUp({ content: `You have already given a ${rating > 0 ? 'positive' : 'negative'} rating to ${targetUser.tag}.`, ephemeral: true }).catch(() => null);
            return;
          }
          
          // Update reputation
          user.reputation = (user.reputation || 0) - existingRating.rating + rating;
          existingRating.rating = rating;
          existingRating.updatedAt = new Date();
          await existingRating.save();
        } else {
          // New rating
          user.reputation = (user.reputation || 0) + rating;
          await new ReputationRating({
            userId: targetUser.id,
            raterId: interaction.user.id,
            rating: rating
          }).save();
        }

        // Auto-ban check based on guild settings
        const guildSettings = await Guild.findOne({ id: interaction.guildId });
        const threshold = guildSettings?.settings?.autoBanThreshold ?? -10;

        if (user.reputation <= threshold) {
          try {
            const member = await interaction.guild?.members.fetch(targetUser.id);
            if (member && !user.isBanned) {
              const dmPayload = buildTransparentBanDM({
                userId: targetUser.id,
                reason: `Reputation fell below server threshold (${user.reputation} <= ${threshold})`,
                severity: 'permanent',
                serverName: interaction.guild?.name,
                baseUrl: process.env.APP_URL || 'https://besafe.network'
              });
              await member.send(dmPayload).catch(() => null);
              await member.ban({ reason: `BeSafe Network: Reputation below server threshold (${user.reputation} <= ${threshold})` });
              await interaction.followUp({ content: `${targetUser.tag} has been automatically banned from this server due to low reputation.`, ephemeral: false }).catch(() => null);
            }
          } catch (e) {
            console.error('Failed to auto-ban in guild', e);
          }
        }
        user.trustIndex = calculateDynamicTrustIndex({
          isDangerous: !!user.isDangerous,
          isBanned: !!user.isBanned,
          reputation: user.reputation,
          isTrusted: !!user.isTrusted
        });
        await user.save();

        await interaction.followUp({ content: `Reputation updated for ${targetUser.tag} (${user.reputation} pts • Trust Index: \`${user.trustIndex}\`).`, ephemeral: true }).catch(() => null);
      }
    }
  });

  // Auto-moderation on member join
  targetClient.on(Events.GuildMemberAdd, async member => {
    if (!shouldHandleGuildOnClient(member.guild?.id, targetClient)) return;
    const user = await User.findOne({ id: member.id });
    const activeBanCase = await BanCase.findOne({ 'discordAccounts.discordId': member.id, status: 'active' });
    const guildData = await Guild.findOne({ id: member.guild.id });
    const selectionMode = guildData?.settings?.banlistSelectionMode || 'global';
    const autoBan = guildData?.settings?.autoBanEnabled ?? false;
    const staffChannelId = guildData?.settings?.staffChannelId || guildData?.settings?.logChannelId;
    const staffRoleId = guildData?.settings?.staffRoleId;

    const isGlobalBanned = (user?.isBanned || !!activeBanCase) && !user?.isTrusted;
    const effectiveBanReason = activeBanCase ? `Ban Case #${activeBanCase.caseNumber}: ${activeBanCase.reason}` : (user?.banReason || 'Global Banlist Violation');

    // Existing global ban check
    if (isGlobalBanned && (selectionMode === 'both' || selectionMode === 'global')) {
      if (staffChannelId) {
        const channel = member.guild.channels.cache.get(staffChannelId) as any;
        if (channel) {
          const ping = staffRoleId ? `<@&${staffRoleId}> ` : '';
          const caseBadge = activeBanCase ? `[**Case #${activeBanCase.caseNumber}**] ` : '';
          channel.send(`🚨 **Global Ban Detected**: ${member.user.tag} (${member.id}) has joined. ${autoBan ? 'Automatically banned.' : 'Manual review required.'}\n${ping}${caseBadge}Reason: ${effectiveBanReason}`).catch(() => null);
        }
      }

      if (autoBan) {
        try {
          const dmPayload = buildTransparentBanDM({
            userId: member.id,
            reason: activeBanCase ? activeBanCase.reason : (user?.banReason || 'Global Banlist Violation'),
            caseNumber: activeBanCase?.caseNumber || (user as any)?.banCaseId,
            severity: activeBanCase?.severity || (user as any)?.banType || 'permanent',
            evidenceLinks: activeBanCase?.evidenceLinks || (user as any)?.evidenceLinks || [],
            serverName: member.guild.name,
            baseUrl: process.env.APP_URL || 'https://besafe.network'
          });
          await member.send(dmPayload).catch(() => null);
          await member.ban({ reason: `BeSafe Network Global Ban: ${effectiveBanReason}` });
        } catch (e) {
          console.error('Failed to auto-ban member', e);
        }
        return; // Stop further checks if already banned
      }
    }

    // Custom Banlist check
    if (guildData?.settings?.customBanlistId && (selectionMode === 'both' || selectionMode === 'custom')) {
      try {
        const customBanlist = await CustomBanlist.findById(guildData.settings.customBanlistId);
        if (customBanlist) {
          // Double check: trusted users can NOT be blacklisted/banned!
          if (user && user.isTrusted) {
            console.log(`[Custom Banlist] Skipping banlist check for trusted user: ${member.id}`);
          } else {
            let isBlacklisted = false;
            let blacklistReason = 'Listed on connected custom banlist';

            // Check Discord ID match
            const discordEntry = customBanlist.entries.find((e: any) => e.type === 'discord' && e.targetId === member.id);
            if (discordEntry) {
              isBlacklisted = true;
              blacklistReason = discordEntry.reason || blacklistReason;
            } else if (user) {
              // Check connected VRChat accounts
              const accounts = getAllVRChatAccounts(user);
              for (const account of accounts) {
                if (account.vrchatUserId) {
                  const vrchatEntry = customBanlist.entries.find((e: any) => e.type === 'vrchat' && e.targetId.toLowerCase() === account.vrchatUserId.toLowerCase());
                  if (vrchatEntry) {
                    isBlacklisted = true;
                    blacklistReason = vrchatEntry.reason || blacklistReason;
                    break;
                  }
                }
              }
            }

            if (isBlacklisted) {
              if (staffChannelId) {
                const channel = member.guild.channels.cache.get(staffChannelId) as any;
                if (channel) {
                  const ping = staffRoleId ? `<@&${staffRoleId}> ` : '';
                  channel.send(`🚨 **Custom Banlist Hit**: ${member.user.tag} (${member.id}) has joined and matches a record on the custom banlist **"${customBanlist.name}"**.\nReason: ${blacklistReason}\n${autoBan ? 'Automatically banning...' : 'Auto-ban is disabled — manual review required.'}`).catch(() => null);
                }
              }

              if (autoBan) {
                try {
                  const dmPayload = buildTransparentBanDM({
                    userId: member.id,
                    reason: blacklistReason,
                    banlistName: customBanlist.name,
                    serverName: member.guild.name,
                    baseUrl: process.env.APP_URL || 'https://besafe.network'
                  });
                  await member.send(dmPayload).catch(() => null);
                  await member.ban({ reason: `Custom Banlist (${customBanlist.name}): ${blacklistReason}` });
                } catch (e) {
                  console.error('[Custom Banlist] Failed to ban member on custom banlist match:', e);
                }
              }
              return; // Stop further checks on a blacklist hit
            }
          }
        }
      } catch (err) {
        console.error('[Custom Banlist] Error processing join check:', err);
      }
    }

    // Local Threshold Checks (Autonomous Settings)
    if (user && guildData) {
      if (user.isTrusted) {
        console.log(`[Local Threshold checks] Skipping local checks for trusted user: ${user.id}`);
        return;
      }
      const reputationThreshold = guildData.settings.autoBanThreshold ?? -10;
      const warningThreshold = guildData.settings.warningThreshold ?? 3;
      const localWarnings = user.warnings.filter((w: any) => w.guildId === member.guild.id).length;

      let localReason = '';
      if (user.reputation <= reputationThreshold) {
        localReason = `Low Reputation (${user.reputation} <= ${reputationThreshold})`;
      } else if (localWarnings >= warningThreshold) {
        localReason = `Warning Threshold Reached (${localWarnings} >= ${warningThreshold})`;
      }

      if (localReason) {
        if (staffChannelId) {
          const channel = member.guild.channels.cache.get(staffChannelId) as any;
          if (channel) {
            channel.send(autoBan
              ? `🛡️ **Local Auto-Ban**: ${member.user.tag} was automatically banned based on this server's autonomous settings.\nReason: ${localReason}`
              : `⚠️ **Local Threshold Flag**: ${member.user.tag} (${member.id}) joined and matches this server's autonomous settings.\nReason: ${localReason}\nAuto-ban is disabled — manual review required.`
            ).catch(() => null);
          }
        }
        if (autoBan) {
          try {
            const dmPayload = buildTransparentBanDM({
              userId: member.id,
              reason: localReason,
              severity: 'permanent',
              serverName: member.guild.name,
              baseUrl: process.env.APP_URL || 'https://besafe.network'
            });
            await member.send(dmPayload).catch(() => null);
            await member.ban({ reason: `BeSafe Network Local Auto-Ban: ${localReason}` });
          } catch (e) {
            console.error('Failed to local auto-ban member', e);
          }
          return;
        }
      }
    }

    // New age role auto-assign
    if (user?.isAgeVerified && guildData?.settings?.ageRoleEnabled && guildData?.settings?.autoAssignAgeRole) {
      const roleId = guildData.settings.ageRoleId;
      if (roleId && user.dob) {
        const age = new Date().getFullYear() - user.dob.getFullYear();
        const m = new Date().getMonth() - user.dob.getMonth();
        const isAdult = age > 18 || (age === 18 && m >= 0);
        
        if (isAdult) {
          try {
            await member.roles.add(roleId);
          } catch (e) {
            console.error('Failed to auto-assign age role', e);
          }
        }
      }
    }
  });

  // Update server name automatically when server name changes in Discord
  targetClient.on(Events.GuildUpdate, async (oldGuild: any, newGuild: any) => {
    if (!shouldHandleGuildOnClient(newGuild?.id, targetClient)) return;
    try {
      if (newGuild && newGuild.name && oldGuild && oldGuild.name !== newGuild.name) {
        console.log(`[Guild Update] Server name changed for ${newGuild.id}: "${oldGuild.name}" -> "${newGuild.name}"`);
        await Guild.updateOne(
          { id: newGuild.id },
          { $set: { name: newGuild.name, updatedAt: new Date() } }
        );
      }
    } catch (err: any) {
      console.error(`[Guild Update Error] Failed to update guild name for ${newGuild?.id}:`, err?.message);
    }
  });

  // Send configuration message when bot joins a new guild if it's not registered
  targetClient.on(Events.GuildCreate, async (guild) => {
    if (!shouldHandleGuildOnClient(guild?.id, targetClient)) return;
    try {
      if (guild && guild.name) {
        await Guild.updateOne(
          { id: guild.id },
          { $set: { name: guild.name, updatedAt: new Date() } }
        );
      }
      const existingGuild = await Guild.findOne({ id: guild.id });
      if (!existingGuild || !existingGuild.ownerId) {
        // Find first available writable channel
        let targetChannel: any = null;
        
        // Try systemChannel first
        if (guild.systemChannel && guild.members.me && guild.systemChannel.permissionsFor(guild.members.me).has(PermissionFlagsBits.SendMessages)) {
          targetChannel = guild.systemChannel;
        } else {
          const channels = [...guild.channels.cache.values()].sort((a: any, b: any) => a.position - b.position);
          // Try text channels
          for (const channel of channels) {
            if (channel.isTextBased() && guild.members.me && channel.permissionsFor(guild.members.me).has(PermissionFlagsBits.SendMessages)) {
              if (channel.type === 0) { // GuildText
                targetChannel = channel;
                break;
              }
            }
          }
          // If no GuildText found, try any writable text-based channel
          if (!targetChannel) {
            for (const channel of channels) {
              if (channel.isTextBased() && guild.members.me && channel.permissionsFor(guild.members.me).has(PermissionFlagsBits.SendMessages)) {
                targetChannel = channel;
                break;
              }
            }
          }
        }

        if (targetChannel) {
          await targetChannel.send({
            embeds: [{
              title: 'Setup Required',
              description: `This server has not been configured yet. Please complete the initialization process:\n\n💻 **Account**: Sign up at https://besafesondiscord.com/\n\n🔗 **Link**: Use the /link command to connect your account.\n\n⚙️ **Setup**: Use the /setup command in your server to finish.\n\n⚙️ **Settings**: Go to our web dashboard to controll you settings.`,
              color: 0x3b82f6
            }]
          });
          console.log(`[Bot Join] Sent setup announcement to guild ${guild.name} (${guild.id}) in channel ${targetChannel.name}`);
        } else {
          console.warn(`[Bot Join] Could not find any writable channel in guild ${guild.name} (${guild.id}) to send setup required message`);
        }
      }
    } catch (e: any) {
      console.error(`[Bot Join] Error during GuildCreate handling for guild ${guild.id}:`, e.message);
    }
  });

  // --- REAL-TIME NSFW IMAGE BLOCKER (Events.MessageCreate) ---
  targetClient.on(Events.MessageCreate, async (message: any) => {
    try {
      if (!message || message.author?.bot || !message.guild) return;

      // Ensure this shard and client is the designated handler for this guild
      if (!shouldHandleGuildOnClient(message.guild.id, targetClient)) {
        return;
      }

      // Pre-filter: Check if message contains attachments, embeds, or possible image links
      const hasAttachments = message.attachments && message.attachments.size > 0;
      const hasEmbeds = message.embeds && message.embeds.length > 0;
      const hasLinks = message.content && /(https?:\/\/[^\s]+)/i.test(message.content);

      if (!hasAttachments && !hasEmbeds && !hasLinks) {
        return;
      }

      // Check guild settings (off by default)
      const guildDoc = await Guild.findOne({ id: message.guild.id });
      if (!guildDoc || !guildDoc.settings?.nsfwBlockerEnabled) {
        return;
      }

      const settings = guildDoc.settings;

      // Check if channel is specifically allowed for NSFW content
      const allowedChannelIds: string[] = Array.isArray(settings.nsfwBlockerAllowedChannelIds)
        ? settings.nsfwBlockerAllowedChannelIds
        : [];
      if (allowedChannelIds.includes(message.channel.id)) {
        return; // Explicitly allowed channel for NSFW
      }
      if ((message.channel as any)?.parentId && allowedChannelIds.includes((message.channel as any).parentId)) {
        return; // Entire parent category is allowed for NSFW
      }

      const isChannelNsfw = Boolean((message.channel as any)?.nsfw);
      if (isChannelNsfw && !settings.nsfwBlockerScanNsfwChannels) {
        return;
      }

      // Collect candidate image URLs
      const candidateUrls: string[] = [];

      // 1. Attachments
      if (hasAttachments) {
        for (const [_, att] of message.attachments) {
          const ct = (att.contentType || '').toLowerCase();
          const name = (att.name || '').toLowerCase();
          const isImg = ct.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp)(\?.*)?$/i.test(name) || /\.(png|jpe?g|webp|gif|bmp)(\?.*)?$/i.test(att.url);
          if (isImg && att.url) {
            candidateUrls.push(att.url);
          }
        }
      }

      // 2. Embeds
      if (hasEmbeds) {
        for (const emb of message.embeds) {
          if (emb.image?.url) candidateUrls.push(emb.image.url);
          if (emb.thumbnail?.url) candidateUrls.push(emb.thumbnail.url);
        }
      }

      // 3. URLs in message text
      if (hasLinks) {
        const matchedUrls = message.content.match(/(https?:\/\/[^\s]+)/gi) || [];
        for (const u of matchedUrls) {
          if (/\.(png|jpe?g|webp|gif|bmp)(\?.*)?$/i.test(u) || u.includes('tenor.com') || u.includes('giphy.com') || u.includes('discordapp.com/attachments/')) {
            if (!candidateUrls.includes(u)) candidateUrls.push(u);
          }
        }
      }

      if (candidateUrls.length === 0) return;

      const threshold = typeof settings.nsfwBlockerSensitivity === 'number' && settings.nsfwBlockerSensitivity > 0
        ? settings.nsfwBlockerSensitivity
        : 0.65;

      // Scan candidate images (up to 4 images per message)
      for (const imgUrl of candidateUrls.slice(0, 4)) {
        const buffer = await downloadImageForScan(imgUrl);
        if (!buffer) continue;

        const evalResult = await scanImageBufferWithNsfwjs(buffer, threshold);
        if (evalResult && evalResult.isNsfw) {
          console.log(`[NSFW Blocker] Blocked adult content from ${message.author.tag} (${message.author.id}) in guild "${message.guild.name}" (#${(message.channel as any).name || message.channel.id}): ${evalResult.topCategory} (${(evalResult.confidence * 100).toFixed(1)}%)`);

          const action = settings.nsfwBlockerAction || 'delete_and_warn';
          const shouldDelete = action === 'delete_and_warn' || action === 'delete';
          const shouldWarn = action === 'delete_and_warn' || action === 'warn';

          // 1. Delete message
          let deleted = false;
          if (shouldDelete) {
            try {
              if (message.deletable) {
                await message.delete();
                deleted = true;
              }
            } catch (delErr: any) {
              console.warn('[NSFW Blocker] Failed to delete message:', delErr?.message);
            }
          }

          // 2. Warn author in channel
          if (shouldWarn) {
            try {
              const warnMsg = await message.channel.send({
                content: `🛡️ **NSFW Content Blocked:** ${message.author}, posting explicit or adult visual content is strictly prohibited in this server.\n*Detection: \`${evalResult.topCategory}\` (${(evalResult.confidence * 100).toFixed(0)}% AI confidence via BeSafe Blocker)*`
              });
              setTimeout(() => {
                warnMsg.delete().catch(() => {});
              }, 8000);
            } catch (warnErr: any) {
              console.warn('[NSFW Blocker] Failed to send warning in channel:', warnErr?.message);
            }
          }

          // 3. Post alert to staff / audit log channel
          const logChannelId = settings.nsfwBlockerLogChannelId || settings.logChannelId;
          if (logChannelId) {
            try {
              const logChan = message.guild.channels.cache.get(logChannelId) as any;
              if (logChan && logChan.isTextBased()) {
                const embed = new EmbedBuilder()
                  .setTitle('🚨 [NSFW BLOCKER] Explicit Image Intercepted')
                  .setColor(0xE11D48)
                  .setDescription(`The BeSafe Neural NSFW Filter intercepted prohibited content using \`@tensorflow/tfjs\` and \`nsfwjs\`.`)
                  .addFields(
                    { name: '👤 Author', value: `${message.author.tag} (<@${message.author.id}>\nID: \`${message.author.id}\`)`, inline: true },
                    { name: '📍 Channel', value: `<#${message.channel.id}> (\`${(message.channel as any).name || message.channel.id}\`)`, inline: true },
                    { name: '🎯 Detection Category', value: `**${evalResult.topCategory}**`, inline: true },
                    { name: '📊 Model Confidence', value: `**${(evalResult.confidence * 100).toFixed(1)}%** (Threshold: ${(threshold * 100).toFixed(0)}%)`, inline: true },
                    { name: '⚡ Action Enforced', value: deleted ? '🗑️ Message Deleted' : (shouldWarn ? '⚠️ Author Warned' : '📋 Logged Only'), inline: true },
                    { name: '🧠 Neural Engine', value: 'NSFWJS (InceptionV3 + TensorFlow.js)', inline: true }
                  )
                  .setTimestamp();

                if (message.content) {
                  embed.addFields({ name: '💬 Message Content', value: message.content.substring(0, 500) });
                }

                await logChan.send({ embeds: [embed] });
              }
            } catch (logChanErr: any) {
              console.warn('[NSFW Blocker] Failed to post to log channel:', logChanErr?.message);
            }
          }

          // 4. Save to database log
          try {
            await new Log({
              action: 'NSFW_BLOCKER_TRIGGER',
              adminId: 'SYSTEM_BOT',
              targetId: message.author.id,
              details: `NSFW Blocker detected ${evalResult.topCategory} (${(evalResult.confidence * 100).toFixed(1)}%) in #${(message.channel as any).name || message.channel.id} in server "${message.guild.name}" (${message.guild.id}). Action: ${action}. Deleted: ${deleted}`
            }).save();
          } catch {}

          // Break once violation is flagged for this message
          break;
        }
      }
    } catch (msgErr: any) {
      console.error('[NSFW Blocker Message Handler Error]:', msgErr?.message || msgErr);
    }
  });
  }

  // Attach handlers to main client
  attachDiscordBotHandlers(client);

  if (serviceName === 'discord' || serviceName === 'discord-bot' || serviceName === 'all') {
    if (process.env.DISCORD_TOKEN) {
      client.login(process.env.DISCORD_TOKEN).catch((loginErr: any) => {
        console.error('[Discord Client] Failed to login:', loginErr?.message || loginErr);
      });
    }
  } else {
    console.log('[Web Dashboard Service] Standalone dashboard mode: Skipping local Discord Gateway login.');
  }


  return { client, customBotsMap, getGuildDiscordClient, syncCustomBotForGuild, syncGlobalDiscordCommands };
}
