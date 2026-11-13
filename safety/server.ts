import express from 'express';
import { createServer } from 'node:http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { PassThrough } from 'stream';
import { Client, GatewayIntentBits, Partials, Events, REST, Routes, SlashCommandBuilder, PermissionFlagsBits, ActivityType, ContextMenuCommandBuilder, ApplicationCommandType, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ChannelType, EmbedBuilder } from 'discord.js';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import cryptoNode from 'crypto';
import axios from 'axios';
import ffmpegPath from 'ffmpeg-static';
import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  StreamType,
  NoSubscriberBehavior,
  getVoiceConnection,
  VoiceConnectionStatus,
  entersState
} from '@discordjs/voice';
import * as EmailTemplates from './emailService';
import * as tf from '@tensorflow/tfjs';
import * as nsfwjs from 'nsfwjs';
import geoip from 'geoip-lite';
import { workerSocketHub } from './services/shared/worker-transport';
import {
  Admin,
  ApiBot,
  ApiKey,
  ApiKeyRequest,
  Appeal,
  BanCase,
  CustomBanlist,
  EnterpriseEndpoint,
  EnterpriseVerificationLog,
  GeoRule,
  Guild,
  LinkCode,
  Log,
  Report,
  ReputationRating,
  ServerBackup,
  SystemConfig,
  TrustedCompany,
  User,
  UserVRChatGroup,
  VerificationRequest,
  VRChatAlertTracker,
  VRChatAnnouncementHistory,
  cleanupSavedWatchlistAvatars,
  createGuildBackup,
  extractVRChatGroupId,
  extractVRChatUserId,
  getAllVRChatAccounts,
  getWatchlistAvatar,
  parseVRChatAccountString,
  resolveDiscordUser,
  safeSaveAppeal,
  safeSaveReport,
  buildTransparentBanDM,
  TransparentBanDMOptions,
  calculateDynamicTrustIndex,
  isValidDiscordSnowflake,
  isValidVRChatUserId,
  decodeImageBufferToTensor3D,
} from './services/shared/models';
import { restoreGuildBackup } from './services/web-dashboard/backup-restore';
import { notifyAdmins, sendMail } from './services/shared/email';
import { registerSystemRoutes } from './services/web-dashboard/system-routes';
import { registerAuthRoutes } from './services/web-dashboard/routes/auth';
import { registerDirectoryRoutes } from './services/web-dashboard/routes/directory';
import { registerIntegrationsRoutes } from './services/web-dashboard/routes/integrations';
import { registerPublicRoutes } from './services/web-dashboard/routes/public';
import { registerBanCasesRoutes } from './services/web-dashboard/routes/ban-cases';
import { createDashboardDiscordRuntime } from './services/discord-bot/dashboard-runtime';
import { findUserByQuery } from './services/web-dashboard/user-lookup';
import { serviceClient } from './services/web-dashboard/service-client';
import { startDashboardHttpServer } from './services/web-dashboard/http-server';

if (ffmpegPath) {
  process.env.FFMPEG_PATH = ffmpegPath;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- VRChat API Rate Limit Cache & Cooldown helpers ---
const verifiedCookiesCache = new Map<string, { verifiedAt: number; cookie: string }>();
const botLoginCooldowns = new Map<string, number>();
let lastStatusUpdateAt = 0;

async function startServer() {
  const serviceName = (process.env.SERVICE_NAME || 'web-dashboard').toLowerCase();
  console.log(`[Service Orchestrator] Service Mode: ${serviceName}`);

  if (serviceName === 'vrchat' || serviceName === 'vrchat-bot') {
    try {
      await import('./services/vrchat-bot/index.js');
    } catch {
      await import('./services/vrchat-bot/index.ts');
    }
    return;
  }

  if (serviceName === 'discord' || serviceName === 'discord-bot') {
    try {
      await import('./services/discord-bot/index.js');
    } catch {
      await import('./services/discord-bot/index.ts');
    }
    return;
  }

  if (serviceName === 'discord-sharder') {
    try {
      await import('./services/discord-bot/shard-manager.js');
    } catch {
      await import('./services/discord-bot/shard-manager.ts');
    }
    return;
  }

  const app = express();
  // Determine port: prioritize CLI args (--port <number>), DEFAULT_APP_PORT, or fallback to 3000
  // Note: Ignore PORT=8080 because port 8080 is reserved for Nginx ingress proxy in this environment
  let PORT = 3000;
  const portArgIndex = process.argv.indexOf('--port');
  if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
    const parsed = parseInt(process.argv[portArgIndex + 1], 10);
    if (!isNaN(parsed) && parsed > 0) PORT = parsed;
  } else if (process.env.DEFAULT_APP_PORT) {
    const parsed = parseInt(process.env.DEFAULT_APP_PORT, 10);
    if (!isNaN(parsed) && parsed > 0) PORT = parsed;
  } else if (process.env.PORT && process.env.PORT !== '8080') {
    const parsed = parseInt(process.env.PORT, 10);
    if (!isNaN(parsed) && parsed > 0) PORT = parsed;
  }

  // Connect to MongoDB
  mongoose.set('bufferCommands', false);
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (mongoUri) {
    try {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      });
      console.log('Connected to MongoDB');
      // Migrate any legacy base64 image strings to local image files
      // Clean up any previously saved watchlist avatars
      cleanupSavedWatchlistAvatars().catch(() => {});
    } catch (err) {
      console.error('MongoDB connection error:', err);
    }
  } else {
    console.warn('MONGODB_URI not found in environment variables.');
  }

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  registerSystemRoutes(app, serviceName, PORT);

  // Hoisted reference for synchronizing Discord application commands from admin APIs
  let syncDiscordCommandsRef: () => Promise<{ success: boolean; count: number; ageVerifyDisabled: boolean; error?: string }> = async () => ({
    success: false,
    count: 0,
    ageVerifyDisabled: false
  });

  // =========================================================================
  // --- NSFW BLOCKER ENGINE (@tensorflow/tfjs & nsfwjs) ---
  // =========================================================================
  let nsfwModelInstance: any = null;
  let nsfwModelLoadingPromise: Promise<any> | null = null;

  async function getOrLoadNsfwModel(): Promise<any> {
    if (nsfwModelInstance) return nsfwModelInstance;
    if (nsfwModelLoadingPromise) return nsfwModelLoadingPromise;

    nsfwModelLoadingPromise = (async () => {
      try {
        console.log('[NSFW Blocker] Initializing NSFWJS model (InceptionV3, high precision) with @tensorflow/tfjs...');
        nsfwModelInstance = await nsfwjs.load('InceptionV3', { size: 299 });
        console.log('[NSFW Blocker] NSFWJS InceptionV3 high-precision neural model loaded successfully!');
        return nsfwModelInstance;
      } catch (err: any) {
        console.error('[NSFW Blocker] Failed to load NSFWJS neural model:', err?.message || err);
        nsfwModelInstance = null;
        return null;
      } finally {
        nsfwModelLoadingPromise = null;
      }
    })();

    return nsfwModelLoadingPromise;
  }

  interface NsfwEvaluation {
    isNsfw: boolean;
    topCategory: string;
    confidence: number;
    predictions: Array<{ className: string; probability: number }>;
    flagReason?: string;
  }

  async function scanImageBufferWithNsfwjs(buffer: Buffer, threshold = 0.65): Promise<NsfwEvaluation | null> {
    let tensor3d: any = null;
    try {
      const model = await getOrLoadNsfwModel();
      if (!model) return null;

      tensor3d = await decodeImageBufferToTensor3D(tf, buffer);
      if (!tensor3d) return null;

      const predictions = await model.classify(tensor3d);

      const pornProb = predictions.find((p: any) => p.className === 'Porn')?.probability || 0;
      const hentaiProb = predictions.find((p: any) => p.className === 'Hentai')?.probability || 0;

      let isNsfw = false;
      let topCategory = 'Neutral';
      let confidence = 0;
      let flagReason = '';

      // The 'Sexy' label is completely ignored per specification; only Porn and Hentai are evaluated as violations.
      if (pornProb >= threshold) {
        isNsfw = true;
        topCategory = 'Pornography';
        confidence = pornProb;
        flagReason = `Pornographic visual content detected (${(pornProb * 100).toFixed(1)}% confidence)`;
      } else if (hentaiProb >= threshold) {
        isNsfw = true;
        topCategory = 'Hentai / Illustrated Explicit';
        confidence = hentaiProb;
        flagReason = `Explicit illustrated/anime content detected (${(hentaiProb * 100).toFixed(1)}% confidence)`;
      } else {
        // Exclude 'Sexy' when determining the primary classification category
        const relevantPredictions = predictions.filter((p: any) => p.className !== 'Sexy');
        const top = [...relevantPredictions].sort((a: any, b: any) => b.probability - a.probability)[0];
        topCategory = top ? top.className : 'Neutral';
        confidence = top ? top.probability : 0;
      }

      return {
        isNsfw,
        topCategory,
        confidence,
        predictions,
        flagReason
      };
    } catch (err: any) {
      console.warn('[NSFW Blocker] Image decoding or classification skipped:', err?.message || err);
      return null;
    } finally {
      try {
        if (tensor3d) tensor3d.dispose();
      } catch {}
    }
  }

  async function downloadImageForScan(url: string): Promise<Buffer | null> {
    try {
      let targetUrl = url;
      if (targetUrl.startsWith('/')) {
        targetUrl = `http://127.0.0.1:${PORT}${targetUrl}`;
      }
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(targetUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) BeSafe-NSFW-Scanner/1.0'
        }
      });
      clearTimeout(timeout);
      if (!res.ok) return null;
      const arrayBuffer = await res.arrayBuffer();
      if (!arrayBuffer || arrayBuffer.byteLength > 15 * 1024 * 1024) return null;
      return Buffer.from(arrayBuffer);
    } catch {
      return null;
    }
  }


  // --- Auth Middleware ---
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1];
    if (!token && req.query.token) {
      token = req.query.token as string;
    }

    if (!token) return res.status(401).json({ error: 'Authentication token required. Please sign in.' });

    jwt.verify(token, process.env.JWT_SECRET || 'secret', async (err: any, user: any) => {
      if (err) return res.status(403).json({ error: 'Session expired or invalid token. Please sign in again.' });
      try {
        if (user?.id) {
          const dbAdmin = await Admin.findById(user.id).select('isBanned banReason role username').lean();
          if (dbAdmin?.isBanned) {
            return res.status(403).json({
              error: `Your account has been blocked by an administrator.${dbAdmin.banReason ? ` Reason: ${dbAdmin.banReason}` : ''}`,
              isBanned: true,
              banReason: dbAdmin.banReason || ''
            });
          }
          if (dbAdmin?.role) {
            user.role = dbAdmin.role;
          }
        }
      } catch {}
      req.user = user;
      next();
    });
  };

  const optionalAuth = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1];
    if (!token && req.query.token) {
      token = req.query.token as string;
    }
    if (token) {
      jwt.verify(token, process.env.JWT_SECRET || 'secret', (err: any, user: any) => {
        if (!err && user) {
          req.user = user;
        }
        next();
      });
    } else {
      next();
    }
  };

  async function recordUnbanAndUnbanUser(userId: string, unbannedBy: string = 'System', unbanReason: string = 'Manual Unban') {
    let user = await User.findOne({ id: userId });
    if (!user) {
      user = new User({ id: userId, username: userId });
    }

    let currentUsername = user.username || userId;
    try {
      if (typeof client !== 'undefined' && client) {
        const resolved = await resolveDiscordUserFromWorker(client, userId, user);
        if (resolved?.displayName) {
          currentUsername = resolved.displayName;
        }
      }
    } catch (e) {}

    const bandate = user.bannedAt || user.updatedAt || user.createdAt || new Date();
    const unbandate = new Date();
    const banreason = user.banReason || 'No ban reason recorded';

    const unbanRecord = {
      bandate,
      unbandate,
      banreason,
      username: currentUsername,
      bannedBy: (user as any).bannedBy || 'System / Moderator',
      unbannedBy,
      unbanReason
    };

    await enforceGlobalUnban(userId, unbanReason);

    user.isBanned = false;
    user.banReason = undefined;
    (user as any).bannedBy = undefined;
    (user as any).bannedAt = undefined;
    user.trustIndex = calculateDynamicTrustIndex({
      isDangerous: !!user.isDangerous,
      isBanned: false,
      reputation: user.reputation ?? 0,
      isTrusted: !!user.isTrusted,
    });
    if (!user.unbanHistory) {
      (user as any).unbanHistory = [unbanRecord];
    } else {
      user.unbanHistory.push(unbanRecord as any);
    }
    user.updatedAt = new Date();

    await user.save();

    return user;
  }

  async function cleanupUserDatabaseForTrustedOnly() {
    try {
      // 1. Strip all legacy ban fields from all documents in User collection
      await User.updateMany({}, {
        $unset: {
          isBanned: 1,
          banReason: 1,
          banType: 1,
          bannedBy: 1,
          bannedAt: 1,
          banExpiresAt: 1,
          banCaseId: 1
        }
      });

      // 2. Remove placeholder user docs that are NOT trusted members and have no profile/custom data
      const result = await User.deleteMany({
        isTrusted: { $ne: true },
        isAgeVerified: { $ne: true },
        $or: [
          { reputation: { $in: [0, null] } },
          { reputation: { $exists: false } }
        ],
        $and: [
          { 'warnings.0': { $exists: false } }
        ]
      });

      console.log(`[User DB Cleanup] Purged ${result.deletedCount || 0} non-trusted records. User collection is now exclusively reserved for trusted members & whitelist.`);
      return result.deletedCount || 0;
    } catch (e) {
      console.error('[User DB Cleanup Error]:', e);
      return 0;
    }
  }

  async function migrateLegacyBansToBanCases(adminUsername: string = 'AdminMigration'): Promise<{ migratedCount: number; totalBanned: number; clearedCount: number; details: string[] }> {
    const bannedUsers = await User.find({ isBanned: true });
    let migratedCount = 0;
    const details: string[] = [];

    for (const user of bannedUsers) {
      // Check if this user already belongs to an active BanCase
      const existingCase = await BanCase.findOne({
        $or: [
          { caseNumber: (user as any).banCaseId || 'NON_EXISTENT' },
          { 'discordAccounts.discordId': user.id },
          { 'vrchatAccounts.vrchatUserId': user.vrchatUserId || 'NON_EXISTENT' }
        ]
      });

      if (existingCase) {
        continue;
      }

      // Build Discord & VRChat accounts for this legacy user
      const discordAccounts: any[] = [];
      if (user.id && !user.id.startsWith('usr_')) {
        discordAccounts.push({
          discordId: user.id,
          username: user.username || user.id,
          displayName: (user as any).displayName || user.username || user.id,
          avatarUrl: user.avatarUrl || '',
          linkedAt: user.createdAt || new Date()
        });
      }

      const vrchatAccounts: any[] = [];
      if (user.vrchatUserId) {
        vrchatAccounts.push({
          vrchatUserId: user.vrchatUserId,
          vrchatUsername: user.vrchatUsername || user.vrchatUserId,
          isPrimary: true,
          linkedAt: user.createdAt || new Date()
        });
      }
      if (user.vrchatAlts && Array.isArray(user.vrchatAlts)) {
        for (const alt of user.vrchatAlts) {
          if (alt.vrchatUserId && !vrchatAccounts.some(v => v.vrchatUserId === alt.vrchatUserId)) {
            vrchatAccounts.push({
              vrchatUserId: alt.vrchatUserId,
              vrchatUsername: alt.vrchatUsername || alt.vrchatUserId,
              isPrimary: false,
              linkedAt: (alt as any).linkedAt || new Date()
            });
          }
        }
      }

      // If user.id itself is a VRChat user ID
      if (user.id.startsWith('usr_') && !vrchatAccounts.some(v => v.vrchatUserId === user.id)) {
        vrchatAccounts.push({
          vrchatUserId: user.id,
          vrchatUsername: user.username || user.id,
          isPrimary: vrchatAccounts.length === 0,
          linkedAt: user.createdAt || new Date()
        });
      }

      const nextNum = 'CASE-' + Math.floor(1000 + Math.random() * 9000);
      const newCase = new BanCase({
        caseNumber: nextNum,
        title: user.username ? `Legacy Ban - ${user.username}` : `Legacy Ban #${user.id}`,
        reason: (user as any).banReason || 'Legacy Global Ban',
        severity: (user as any).banType === 'temporary' ? 'temporary' : ((user as any).isDangerous ? 'critical' : 'permanent'),
        status: 'active',
        isDangerous: !!(user as any).isDangerous,
        dangerousNotes: (user as any).dangerousNotes || '',
        trustIndex: 'BLACKLISTED',
        discordAccounts,
        vrchatAccounts,
        evidenceLinks: (user as any).evidenceLinks || [],
        notes: (user as any).dangerousNotes || '',
        bannedBy: (user as any).bannedBy || 'Legacy System',
        bannedAt: (user as any).bannedAt || user.updatedAt || new Date()
      });

      await newCase.save();
      migratedCount++;
      details.push(`Migrated ${user.username || user.id} -> Case #${nextNum}`);
    }

    // Completely purge bans from User DB
    const clearedCount = await cleanupUserDatabaseForTrustedOnly();

    return {
      migratedCount,
      totalBanned: bannedUsers.length,
      clearedCount,
      details
    };
  }

  async function createOrUpdateBanCase(params: {
    caseId?: string;
    caseNumber?: string;
    title?: string;
    reason: string;
    severity?: 'permanent' | 'temporary' | 'critical' | 'warning';
    discordAccounts?: Array<{ discordId: string; username?: string; displayName?: string; avatarUrl?: string }>;
    vrchatAccounts?: Array<{ vrchatUserId: string; vrchatUsername?: string; isPrimary?: boolean }>;
    evidenceLinks?: string[];
    notes?: string;
    bannedBy?: string;
  }, adminUsername: string = 'Admin') {
    let caseDoc: any = null;
    if (params.caseId) {
      caseDoc = await BanCase.findById(params.caseId);
    }
    if (!caseDoc && params.caseNumber) {
      caseDoc = await BanCase.findOne({ caseNumber: params.caseNumber });
    }

    const isNew = !caseDoc;
    if (!caseDoc) {
      const nextNum = 'CASE-' + Math.floor(1000 + Math.random() * 9000);
      caseDoc = new BanCase({
        caseNumber: params.caseNumber || nextNum,
        title: params.title || `Ban Case ${params.caseNumber || nextNum}`,
        reason: params.reason,
        severity: params.severity || 'permanent',
        status: 'active',
        bannedBy: params.bannedBy || adminUsername,
        bannedAt: new Date(),
        discordAccounts: [],
        vrchatAccounts: [],
        evidenceLinks: params.evidenceLinks || [],
        notes: params.notes || ''
      });
    } else {
      if (params.title !== undefined) caseDoc.title = params.title;
      if (params.reason) caseDoc.reason = params.reason;
      if (params.severity) caseDoc.severity = params.severity;
      if (params.notes !== undefined) caseDoc.notes = params.notes;
      if (params.evidenceLinks) caseDoc.evidenceLinks = params.evidenceLinks;
      caseDoc.status = 'active';
      caseDoc.updatedAt = new Date();
    }

    // Normalize Discord Accounts
    const processedDiscord: any[] = [];
    if (Array.isArray(params.discordAccounts)) {
      for (const d of params.discordAccounts) {
        const dId = (d.discordId || (d as any).id || '').trim();
        if (!dId) continue;
        
        let uName = d.username || '';
        let dName = d.displayName || uName || dId;
        let avatar = d.avatarUrl || '';
        
        if (typeof client !== 'undefined' && client) {
          try {
            const resolved = await resolveDiscordUserFromWorker(client, dId);
            if (resolved) {
              dName = resolved.displayName || dName;
              uName = resolved.username || uName;
              avatar = resolved.avatarUrl || avatar;
            }
          } catch (e) {}
        }
        
        processedDiscord.push({
          discordId: dId,
          username: uName || dId,
          displayName: dName || uName || dId,
          avatarUrl: avatar,
          linkedAt: (d as any).linkedAt || new Date()
        });
      }
    }

    // Normalize VRChat Accounts
    const processedVRC: any[] = [];
    if (Array.isArray(params.vrchatAccounts)) {
      for (const v of params.vrchatAccounts) {
        const vId = extractVRChatUserId(v.vrchatUserId || (v as any).id || '');
        if (!vId) continue;
        
        let vName = (v.vrchatUsername || '').trim();
        if (!vName) {
          try {
            const fetchedName = await serviceClient.fetchVRChatDisplayName(vId);
            if (fetchedName) vName = fetchedName;
          } catch (e) {}
        }
        
        processedVRC.push({
          vrchatUserId: vId,
          vrchatUsername: vName || vId,
          isPrimary: !!v.isPrimary,
          linkedAt: (v as any).linkedAt || new Date()
        });
      }
    }

    caseDoc.discordAccounts = processedDiscord;
    caseDoc.vrchatAccounts = processedVRC;
    caseDoc.trustIndex = 'BLACKLISTED';
    caseDoc.updatedAt = new Date();
    await caseDoc.save();

    // Enforce bans on all Discord accounts directly across connected servers
    for (const disc of processedDiscord) {
      if (disc.discordId && isValidDiscordSnowflake(disc.discordId)) {
        try {
          await sendTransparentBanNotificationDM({
            userId: disc.discordId,
            reason: caseDoc.reason,
            caseNumber: caseDoc.caseNumber,
            severity: caseDoc.severity,
            evidenceLinks: caseDoc.evidenceLinks || []
          });
          // Cross-server ban on Discord
          await enforceGlobalBan(disc.discordId, `Ban Case #${caseDoc.caseNumber}: ${caseDoc.reason}`);
        } catch (err) {
          console.error(`[Create/Update Ban Case] Skipped failed Discord ban for ${disc.discordId}:`, err);
        }
      }
    }

    // Enforce bans on all VRChat accounts directly in connected VRChat groups
    for (const vrc of processedVRC) {
      if (vrc.vrchatUserId && isValidVRChatUserId(vrc.vrchatUserId)) {
        try {
          await serviceClient.banVRChatUser(vrc.vrchatUserId, `Ban Case #${caseDoc.caseNumber}: ${caseDoc.reason}`);
        } catch (err) {
          console.error(`[Create/Update Ban Case] Skipped failed VRChat ban for ${vrc.vrchatUserId}:`, err);
        }
      }
    }

    // Trigger background scan to enforce bans in connected VRChat groups
    void serviceClient.triggerVRChatScan();

    await new Log({
      action: isNew ? 'CREATE_BAN_CASE' : 'UPDATE_BAN_CASE',
      adminId: params.bannedBy || adminUsername,
      targetId: caseDoc.caseNumber,
      details: `${isNew ? 'Created' : 'Updated'} Ban Case ${caseDoc.caseNumber} with ${processedDiscord.length} Discord account(s) and ${processedVRC.length} VRChat account(s). Reason: ${caseDoc.reason}`
    }).save().catch(() => null);

    return caseDoc;
  }

  async function liftBanCase(caseIdOrNumber: string, unbannedBy: string = 'Admin', unbanReason: string = 'Ban Case Lifted') {
    let caseDoc = await BanCase.findOne({
      $or: [
        { _id: mongoose.isValidObjectId(caseIdOrNumber) ? caseIdOrNumber : undefined },
        { caseNumber: caseIdOrNumber }
      ].filter(Boolean)
    });

    if (!caseDoc) return null;

    // 1. Unban all associated Discord accounts across guilds
    if (Array.isArray(caseDoc.discordAccounts)) {
      for (const disc of caseDoc.discordAccounts) {
        if (disc.discordId) {
          await recordUnbanAndUnbanUser(disc.discordId, unbannedBy, `Ban Case ${caseDoc.caseNumber} Lifted: ${unbanReason}`);
        }
      }
    }

    // 2. Unban all associated VRChat accounts across groups
    if (Array.isArray(caseDoc.vrchatAccounts)) {
      for (const vrc of caseDoc.vrchatAccounts) {
        if (vrc.vrchatUserId) {
          await serviceClient.unbanVRChatUser(vrc.vrchatUserId);
        }
      }
    }

    caseDoc.status = 'lifted';
    caseDoc.trustIndex = caseDoc.isDangerous ? 'BLACKLISTED' : 'ALL CLEAR';
    caseDoc.unbannedBy = unbannedBy;
    caseDoc.unbannedAt = new Date();
    caseDoc.unbanReason = unbanReason;
    caseDoc.updatedAt = new Date();
    await caseDoc.save();

    await new Log({
      action: 'LIFT_BAN_CASE',
      adminId: unbannedBy,
      targetId: caseDoc.caseNumber,
      details: `Lifted Ban Case ${caseDoc.caseNumber}. Unbanned all associated Discord (${caseDoc.discordAccounts?.length || 0}) and VRChat (${caseDoc.vrchatAccounts?.length || 0}) accounts. Reason: ${unbanReason}`
    }).save().catch(() => null);

    return caseDoc;
  }

  async function rebanBanCase(caseIdOrNumber: string, adminUsername: string = 'Admin', newReason?: string) {
    let caseDoc = await BanCase.findOne({
      $or: [
        { _id: mongoose.isValidObjectId(caseIdOrNumber) ? caseIdOrNumber : undefined },
        { caseNumber: caseIdOrNumber }
      ].filter(Boolean)
    });

    if (!caseDoc) return null;

    caseDoc.status = 'active';
    caseDoc.trustIndex = 'BLACKLISTED';
    if (newReason) caseDoc.reason = newReason;
    caseDoc.bannedBy = adminUsername;
    caseDoc.bannedAt = new Date();
    caseDoc.unbannedBy = undefined;
    caseDoc.unbannedAt = undefined;
    caseDoc.unbanReason = undefined;
    caseDoc.updatedAt = new Date();
    await caseDoc.save();

    // Re-ban Discord accounts
    for (const disc of caseDoc.discordAccounts || []) {
      if (disc.discordId) {
        let user = await User.findOne({ id: disc.discordId });
        if (!user) user = new User({ id: disc.discordId, username: disc.displayName || disc.username });
        user.isBanned = true;
        user.banReason = caseDoc.reason;
        user.bannedBy = adminUsername;
        user.bannedAt = new Date();
        user.banCaseId = caseDoc._id.toString();
        user.updatedAt = new Date();
        await user.save();
        await sendTransparentBanNotificationDM({
          userId: disc.discordId,
          reason: caseDoc.reason,
          caseNumber: caseDoc.caseNumber,
          severity: caseDoc.severity,
          evidenceLinks: caseDoc.evidenceLinks || []
        });
        await enforceGlobalBan(disc.discordId, caseDoc.reason);
      }
    }

    // Re-ban VRChat accounts
    for (const vrc of caseDoc.vrchatAccounts || []) {
      if (vrc.vrchatUserId) {
        if ((caseDoc.discordAccounts || []).length === 0) {
          let user = await User.findOne({ $or: [{ id: vrc.vrchatUserId }, { vrchatUserId: vrc.vrchatUserId }] });
          if (!user) user = new User({ id: vrc.vrchatUserId, username: vrc.vrchatUsername, vrchatUserId: vrc.vrchatUserId });
          user.isBanned = true;
          user.banReason = caseDoc.reason;
          user.bannedBy = adminUsername;
          user.bannedAt = new Date();
          user.banCaseId = caseDoc._id.toString();
          user.updatedAt = new Date();
          await user.save();
        }
        await serviceClient.banVRChatUser(vrc.vrchatUserId, caseDoc.reason);
      }
    }

    void serviceClient.triggerVRChatScan();

    await new Log({
      action: 'REBAN_BAN_CASE',
      adminId: adminUsername,
      targetId: caseDoc.caseNumber,
      details: `Re-activated Ban Case ${caseDoc.caseNumber}. Re-enforced bans on all ${caseDoc.discordAccounts?.length || 0} Discord and ${caseDoc.vrchatAccounts?.length || 0} VRChat accounts.`
    }).save().catch(() => null);

    return caseDoc;
  }

  async function addAccountToBanCase(caseIdOrNumber: string, account: { type: 'discord' | 'vrchat'; id: string; name?: string }, adminUsername: string = 'Admin') {
    let caseDoc = await BanCase.findOne({
      $or: [
        { _id: mongoose.isValidObjectId(caseIdOrNumber) ? caseIdOrNumber : undefined },
        { caseNumber: caseIdOrNumber }
      ].filter(Boolean)
    });

    if (!caseDoc) return null;

    if (account.type === 'discord') {
      const rawId = account.id.trim();
      const exists = (caseDoc.discordAccounts || []).some((a: any) => a.discordId === rawId);
      if (!exists) {
        let uName = account.name || rawId;
        let dName = account.name || rawId;
        let avatar = '';
        if (typeof client !== 'undefined' && client) {
          try {
            const resolved = await resolveDiscordUserFromWorker(client, rawId);
            if (resolved) {
              dName = resolved.displayName || dName;
              uName = resolved.username || uName;
              avatar = resolved.avatarUrl || avatar;
            }
          } catch (e) {}
        }

        caseDoc.discordAccounts.push({
          discordId: rawId,
          username: uName,
          displayName: dName,
          avatarUrl: avatar,
          linkedAt: new Date()
        });

        if (caseDoc.status === 'active') {
          let user = await User.findOne({ id: rawId });
          if (!user) user = new User({ id: rawId, username: dName });
          user.isBanned = true;
          user.banReason = caseDoc.reason;
          user.bannedBy = adminUsername;
          user.bannedAt = new Date();
          user.banCaseId = caseDoc._id.toString();
          user.updatedAt = new Date();
          await sendTransparentBanNotificationDM({
            userId: rawId,
            reason: caseDoc.reason,
            caseNumber: caseDoc.caseNumber,
            severity: caseDoc.severity,
            evidenceLinks: caseDoc.evidenceLinks || []
          });
          await enforceGlobalBan(rawId, caseDoc.reason);
          await user.save();
        }
      }
    } else if (account.type === 'vrchat') {
      const vId = extractVRChatUserId(account.id.trim());
      const exists = (caseDoc.vrchatAccounts || []).some((a: any) => a.vrchatUserId === vId);
      if (!exists) {
        let vName = (account.name || '').trim();
        if (!vName) {
          try {
            const fetchedName = await serviceClient.fetchVRChatDisplayName(vId);
            if (fetchedName) vName = fetchedName;
          } catch (e) {}
        }

        caseDoc.vrchatAccounts.push({
          vrchatUserId: vId,
          vrchatUsername: vName || vId,
          isPrimary: caseDoc.vrchatAccounts.length === 0,
          linkedAt: new Date()
        });

        if (caseDoc.status === 'active') {
          if ((caseDoc.discordAccounts || []).length === 0) {
            let user = await User.findOne({ $or: [{ id: vId }, { vrchatUserId: vId }] });
            if (!user) user = new User({ id: vId, username: vName || vId, vrchatUserId: vId });
            user.isBanned = true;
            user.banReason = caseDoc.reason;
            user.bannedBy = adminUsername;
            user.bannedAt = new Date();
            user.banCaseId = caseDoc._id.toString();
            user.updatedAt = new Date();
            await user.save();
          }
          await serviceClient.banVRChatUser(vId, caseDoc.reason);
          void serviceClient.triggerVRChatScan();
        }
      }
    }

    caseDoc.updatedAt = new Date();
    await caseDoc.save();

    await new Log({
      action: 'ADD_ACCOUNT_TO_BAN_CASE',
      adminId: adminUsername,
      targetId: caseDoc.caseNumber,
      details: `Added ${account.type.toUpperCase()} account ${account.id} to Ban Case ${caseDoc.caseNumber}`
    }).save().catch(() => null);

    return caseDoc;
  }

  async function removeAccountFromBanCase(caseIdOrNumber: string, targetId: string, type?: string, adminUsername: string = 'Admin') {
    let caseDoc = await BanCase.findOne({
      $or: [
        { _id: mongoose.isValidObjectId(caseIdOrNumber) ? caseIdOrNumber : undefined },
        { caseNumber: caseIdOrNumber }
      ].filter(Boolean)
    });

    if (!caseDoc) return null;

    const rawId = targetId.trim();
    const isDiscord = type === 'discord' || (caseDoc.discordAccounts || []).some((a: any) => a.discordId === rawId);
    const isVRChat = type === 'vrchat' || (caseDoc.vrchatAccounts || []).some((a: any) => a.vrchatUserId === rawId);

    if (isDiscord) {
      (caseDoc as any).discordAccounts = (caseDoc.discordAccounts || []).filter((a: any) => a.discordId !== rawId);
      if (caseDoc.status === 'active') {
        await recordUnbanAndUnbanUser(rawId, adminUsername, `Removed from Ban Case ${caseDoc.caseNumber}`);
      }
    }

    if (isVRChat) {
      const vId = extractVRChatUserId(rawId);
      (caseDoc as any).vrchatAccounts = (caseDoc.vrchatAccounts || []).filter((a: any) => a.vrchatUserId !== vId && a.vrchatUserId !== rawId);
      if (caseDoc.status === 'active') {
        await serviceClient.unbanVRChatUser(vId);
        const user = await User.findOne({ $or: [{ id: vId }, { vrchatUserId: vId }] });
        if (user && user.isBanned) {
          user.isBanned = false;
          user.banReason = undefined;
          user.updatedAt = new Date();
          await user.save();
        }
      }
    }

    caseDoc.updatedAt = new Date();
    await caseDoc.save();

    await new Log({
      action: 'REMOVE_ACCOUNT_FROM_BAN_CASE',
      adminId: adminUsername,
      targetId: caseDoc.caseNumber,
      details: `Removed account ${rawId} from Ban Case ${caseDoc.caseNumber}`
    }).save().catch(() => null);

    return caseDoc;
  }

  async function syncAllBansAcrossPlatforms(): Promise<{
    discordBansCount: number;
    vrchatBansCount: number;
    activeCasesCount: number;
    skippedCount: number;
    discordSkippedCount: number;
    vrchatSkippedCount: number;
  }> {
    const activeCases = await BanCase.find({ status: 'active' });
    let discordBansCount = 0;
    let vrchatBansCount = 0;
    let discordSkippedCount = 0;
    let vrchatSkippedCount = 0;

    for (const bCase of activeCases) {
      // 1. Enforce Discord Bans (skipping invalid non-snowflake IDs or per-account errors without stopping)
      if (Array.isArray(bCase.discordAccounts)) {
        for (const disc of bCase.discordAccounts) {
          const rawDiscordId = disc?.discordId ? String(disc.discordId).trim() : '';
          if (!rawDiscordId) continue;

          if (!isValidDiscordSnowflake(rawDiscordId)) {
            discordSkippedCount++;
            continue;
          }

          try {
            const result = await enforceGlobalBan(rawDiscordId, `Ban Case #${bCase.caseNumber}: ${bCase.reason}`);
            if (result && (result.bannedCount > 0 || result.alreadyBannedCount > 0 || result.attemptedGuildCount === 0)) {
              discordBansCount++;
            } else if (result && result.failedGuilds && result.failedGuilds.length > 0 && result.bannedCount === 0 && result.alreadyBannedCount === 0) {
              discordSkippedCount++;
            } else {
              discordBansCount++;
            }
          } catch (err) {
            console.warn(`[Sync Bans] Skipping Discord account ${rawDiscordId} due to error:`, err);
            discordSkippedCount++;
          }
        }
      }

      // 2. Enforce VRChat Bans (skipping invalid IDs or per-account errors without stopping)
      if (Array.isArray(bCase.vrchatAccounts)) {
        for (const vrc of bCase.vrchatAccounts) {
          const vId = vrc?.vrchatUserId ? String(vrc.vrchatUserId).trim() : '';
          if (!vId) continue;

          if (!isValidVRChatUserId(vId)) {
            vrchatSkippedCount++;
            continue;
          }

          try {
            const ok = await serviceClient.banVRChatUser(vId, `Ban Case #${bCase.caseNumber}: ${bCase.reason}`);
            if (ok) {
              vrchatBansCount++;
            } else {
              vrchatSkippedCount++;
            }
          } catch (err) {
            console.warn(`[Sync Bans] Skipping VRChat account ${vId} due to error:`, err);
            vrchatSkippedCount++;
          }
        }
      }
    }

    // Trigger full background scan to enforce bans in all connected VRChat groups
    try {
      void serviceClient.triggerVRChatScan();
    } catch {}

    return {
      activeCasesCount: activeCases.length,
      discordBansCount,
      vrchatBansCount,
      skippedCount: discordSkippedCount + vrchatSkippedCount,
      discordSkippedCount,
      vrchatSkippedCount,
    };
  }

  const isAdmin = async (req: any, res: any, next: any) => {
    try {
      if (req.user && req.user.role === 'admin') {
        return next();
      }
      const user = await Admin.findById(req.user?.id);
      if (user && user.role === 'admin') {
        return next();
      }
      return res.status(403).json({ error: 'Admin access required' });
    } catch (e) {
      if (req.user && req.user.role === 'admin') {
        return next();
      }
      return res.status(500).json({ error: 'Internal server error' });
    }
  };

  const isModOrAdmin = async (req: any, res: any, next: any) => {
    try {
      if (req.user && (req.user.role === 'admin' || req.user.role === 'moderator')) {
        return next();
      }
      const user = await Admin.findById(req.user?.id);
      if (user && (user.role === 'admin' || user.role === 'moderator')) {
        return next();
      }
      return res.status(403).json({ error: 'Moderator or Admin access required' });
    } catch (e) {
      if (req.user && (req.user.role === 'admin' || req.user.role === 'moderator')) {
        return next();
      }
      return res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Helper to determine the application base URL safely
  const getBaseUrl = (req?: express.Request): string => {
    if (process.env.APP_URL && process.env.APP_URL.trim() !== '' && process.env.APP_URL !== 'undefined') {
      return process.env.APP_URL.trim().replace(/\/$/, '');
    }
    if (req) {
      const rawProto = req.headers['x-forwarded-proto'];
      let protocol = 'http';
      if (typeof rawProto === 'string') {
        protocol = rawProto.split(',')[0].trim();
      } else if (Array.isArray(rawProto) && rawProto.length > 0) {
        protocol = rawProto[0].split(',')[0].trim();
      } else if (req.protocol) {
        protocol = req.protocol;
      }
      
      const rawHost = req.headers['x-forwarded-host'] || req.get('host') || 'localhost:3000';
      const host = Array.isArray(rawHost) ? rawHost[0] : rawHost.split(',')[0].trim();
      
      return `${protocol}://${host}`.replace(/\/$/, '');
    }
    return 'http://localhost:3000';
  };

  async function sendTransparentBanNotificationDM(options: Omit<TransparentBanDMOptions, 'baseUrl'> & { baseUrl?: string }) {
    if (!options?.userId || options.userId.startsWith('usr_')) return false;
    try {
      const dmPayload = buildTransparentBanDM({
        ...options,
        baseUrl: options.baseUrl || getBaseUrl()
      });
      const result = await serviceClient.sendDiscordDM(options.userId, dmPayload);
      if (result?.success) return true;
      if (typeof client !== 'undefined' && client?.isReady()) {
        const discordUser = await client.users.fetch(options.userId).catch(() => null);
        if (discordUser) {
          await discordUser.send(dmPayload).catch(() => null);
          return true;
        }
      }
    } catch (e) {}
    return false;
  }

  // --- Auto-Verification Matching Helper ---
  // Automatically verify an account if its email matches an already verified Discord user
  async function checkAndAutoVerifyFromDiscord(options: {
    email?: string | null;
    adminId?: any;
    discordId?: string | null;
  }) {
    try {
      const email = options.email ? String(options.email).trim().toLowerCase() : null;
      const discordId = options.discordId ? String(options.discordId).trim() : null;

      if (!email && !discordId) return null;

      // 1. Check for verified Discord User in User collection
      let verifiedDiscordUser: any = null;
      if (email) {
        verifiedDiscordUser = await User.findOne({
          email,
          isAgeVerified: true
        });
      }
      if (!verifiedDiscordUser && discordId) {
        verifiedDiscordUser = await User.findOne({
          id: discordId,
          isAgeVerified: true
        });
      }

      // 2. Check for approved VerificationRequest
      let approvedReq: any = null;
      if (email) {
        approvedReq = await VerificationRequest.findOne({
          email,
          status: 'approved'
        }).sort({ updatedAt: -1 });
      }
      if (!approvedReq && discordId) {
        approvedReq = await VerificationRequest.findOne({
          userId: discordId,
          status: 'approved'
        }).sort({ updatedAt: -1 });
      }

      // If approvedReq has a userId that is a Discord user, let's also grab that Discord user if not yet loaded
      if (!verifiedDiscordUser && approvedReq?.userId) {
        const u = await User.findOne({ id: approvedReq.userId, isAgeVerified: true });
        if (u) verifiedDiscordUser = u;
      }

      // If neither a verified Discord User nor an approved VerificationRequest was found, return null
      if (!verifiedDiscordUser && !approvedReq) {
        return null;
      }

      const rawDob = verifiedDiscordUser?.dob || approvedReq?.dob;
      const dob: Date = rawDob ? new Date(rawDob) : new Date('2000-01-01');
      const ageVerifiedAt: Date = verifiedDiscordUser?.ageVerifiedAt || approvedReq?.updatedAt || new Date();
      const matchedDiscordId = verifiedDiscordUser?.id || (approvedReq?.source === 'discord' ? approvedReq?.userId : (discordId || null));

      // 3. Update Admin account if requested or found by email
      let updatedAdmin: any = null;
      const adminQuery: any = options.adminId
        ? { _id: options.adminId }
        : email
          ? { email }
          : matchedDiscordId
            ? { discordId: matchedDiscordId }
            : null;

      if (adminQuery) {
        updatedAdmin = await Admin.findOneAndUpdate(
          adminQuery,
          {
            $set: {
              isAgeVerified: true,
              dob,
              ageVerifiedAt,
              ...(matchedDiscordId ? { discordId: matchedDiscordId } : {})
            }
          },
          { new: true }
        );
      }

      // 4. Update or sync User document
      if (matchedDiscordId) {
        await User.findOneAndUpdate(
          { id: matchedDiscordId },
          {
            $set: {
              isAgeVerified: true,
              dob,
              ageVerifiedAt,
              ...(email ? { email } : {})
            }
          },
          { upsert: true }
        );
      }

      // 5. Ensure an approved VerificationRequest exists for records/audit
      const existingReq = await VerificationRequest.findOne({
        $or: [
          ...(email ? [{ email, status: 'approved' as const }] : []),
          ...(matchedDiscordId ? [{ userId: matchedDiscordId, status: 'approved' as const }] : [])
        ]
      });

      if (!existingReq && (email || matchedDiscordId)) {
        await new VerificationRequest({
          userId: matchedDiscordId || updatedAdmin?._id?.toString() || 'web',
          username: updatedAdmin?.username || verifiedDiscordUser?.username || '',
          email: email || verifiedDiscordUser?.email || '',
          source: 'discord',
          dob,
          status: 'approved',
          adminNotes: 'Auto-verified: email matches already verified Discord user'
        }).save().catch(() => null);
      }

      await new Log({
        action: 'AUTO_AGE_VERIFIED',
        adminId: 'SYSTEM',
        targetId: email || matchedDiscordId || 'User',
        details: `Auto-verified account: email ${email || 'N/A'} matches verified Discord user (${matchedDiscordId || 'N/A'}). DOB: ${dob.toISOString().split('T')[0]}`
      }).save().catch(() => null);

      return {
        matched: true,
        email: email || verifiedDiscordUser?.email || approvedReq?.email,
        discordId: matchedDiscordId,
        dob,
        ageVerifiedAt,
        admin: updatedAdmin,
        verifiedDiscordUser,
        approvedReq
      };
    } catch (err) {
      console.error('Error in checkAndAutoVerifyFromDiscord:', err);
      return null;
    }
  }

    // auth routes registered from services/web-dashboard/routes/auth.ts
  // directory routes registered from services/web-dashboard/routes/directory.ts
  // integrations routes registered from services/web-dashboard/routes/integrations.ts
  // public routes registered from services/web-dashboard/routes/public.ts
  // ban-cases routes registered from services/web-dashboard/routes/ban-cases.ts
// --- Discord Bot ---
  // --- Vite Setup ---
  let vite: any;
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
  }

  // Dashboard startup follows all API and worker helper declarations.

  async function enforceGlobalBan(userId: string, reason: string) {
    const cleanId = (userId || '').trim();
    if (!isValidDiscordSnowflake(cleanId)) {
      return { bannedCount: 0, alreadyBannedCount: 0, failedGuilds: [], permissionWarnings: [], missingGuildIds: [], skippedInvalidId: true };
    }

    let user: any = null;
    try {
      user = await User.findOne({ id: cleanId });
      if (user) {
        const accounts = getAllVRChatAccounts(user);
        for (const account of accounts) {
          if (account.vrchatUserId && isValidVRChatUserId(account.vrchatUserId)) {
            await serviceClient.banVRChatUser(account.vrchatUserId, reason).catch(() => false);
          }
        }
      }
    } catch (err) {
    }

    const guilds = await Guild.find({ 'settings.autoBanEnabled': true }).catch(() => []);
    const eligibleGuilds = guilds.filter((guildData) => (guildData.settings?.banlistSelectionMode || 'global') !== 'custom');
    if (eligibleGuilds.length === 0) {
      return { bannedCount: 0, alreadyBannedCount: 0, failedGuilds: [], permissionWarnings: [], missingGuildIds: [] };
    }

    let targetTag = cleanId;
    try {
      const discordUser = await serviceClient.fetchDiscordUser(cleanId);
      targetTag = discordUser?.tag || discordUser?.username || cleanId;
    } catch (e) {}

    const enforcement = await serviceClient.enforceDiscordBan(cleanId, targetTag, reason, eligibleGuilds.map((guildData) => ({
      id: guildData.id,
      staffChannelId: guildData.settings?.staffChannelId,
      logChannelId: guildData.settings?.logChannelId,
    }))).catch(() => ({
      bannedCount: 0,
      alreadyBannedCount: 0,
      failedGuilds: [],
      permissionWarnings: [],
      missingGuildIds: [],
    }));
    return enforcement;
  }

  async function enforceGlobalUnban(userId: string, unbanReason: string = 'Global Appeal Approved') {
    const isVRChatId = userId.startsWith('usr_');
    const user = isVRChatId
      ? await User.findOne({ $or: [{ vrchatUserId: userId }, { 'vrchatAlts.vrchatUserId': userId }] })
      : await User.findOne({ id: userId });
    const discordUserId = isVRChatId ? user?.id : userId;
    const vrchatUserIds = new Set<string>(isVRChatId ? [userId] : []);
    if (user) {
      for (const account of getAllVRChatAccounts(user)) {
        if (account.vrchatUserId) vrchatUserIds.add(account.vrchatUserId);
      }
    }

    const discordUnban = (async () => {
      if (!discordUserId) return null;
      let targetTag = user?.username || discordUserId;
      try {
        const discordUser = await serviceClient.fetchDiscordUser(discordUserId);
        targetTag = discordUser?.tag || discordUser?.username || targetTag;
      } catch (e) {}
      const guilds = await Guild.find();
      const eligibleGuilds = guilds
        .filter((guildData) => guildData.settings?.autoUnbanDiscordEnabled !== false)
        .map((guildData) => ({
          id: guildData.id,
          staffChannelId: guildData.settings?.staffChannelId,
          logChannelId: guildData.settings?.logChannelId,
        }));
      return serviceClient.enforceDiscordUnban(
        discordUserId,
        eligibleGuilds,
        unbanReason,
        targetTag
      );
    })();
    const vrchatUnban = Promise.all([...vrchatUserIds].map((vrchatId) => serviceClient.unbanVRChatUser(vrchatId)));
    const [discordResult, vrchatResult] = await Promise.allSettled([discordUnban, vrchatUnban]);
    if (discordResult.status === 'rejected') {
      console.warn('[Discord Unban] Skipped or failed:', discordResult.reason?.message || discordResult.reason);
    }
    if (vrchatResult.status === 'rejected') {
      console.warn('[VRChat Unban] Skipped or failed:', vrchatResult.reason?.message || vrchatResult.reason);
    }

    // Retry VRChat propagation after its API rate-limit window.
    setTimeout(() => {
      void Promise.all([...vrchatUserIds].map((vrchatId) => serviceClient.unbanVRChatUser(vrchatId)))
        .catch((error: any) => console.error('[VRChat Unban Retry] Failed:', error?.message || error));
    }, 20000);
    return { discord: discordResult.status === 'fulfilled' ? discordResult.value : null, vrchat: true };
  }

  async function unbanCustomBanlistEntry(entry: { type: string; targetId: string }, listId?: string, listName?: string) {
    const targetId = entry?.targetId?.trim();
    if (!targetId) return;
    const customUnbanReason = `Removed from Custom Banlist (${listName || 'Custom Banlist'})`;

    try {
      if (entry.type === 'discord') {
        // 1. Unban globally across Discord guilds and any associated VRChat accounts
        await enforceGlobalUnban(targetId, customUnbanReason);

        // 2. Explicitly unban in guilds configured with this specific custom banlist
        if (listId) {
          const linkedGuilds = await Guild.find({
            $or: [
              { 'settings.customBanlistId': listId },
              { 'settings.customBanlistId': listId.toString() }
            ]
          });
          await serviceClient.enforceDiscordUnban(
            targetId,
            linkedGuilds.map((guildData) => ({
              id: guildData.id,
              staffChannelId: guildData.settings?.staffChannelId,
              logChannelId: guildData.settings?.logChannelId,
            })),
            customUnbanReason
          );
        }
      } else if (entry.type === 'vrchat') {
        // 1. Unban from all VRChat groups
        await serviceClient.unbanVRChatUser(targetId);

        // 2. Check if a User doc exists for this VRChat account and unban their Discord too
        const dbUser = await User.findOne({
          $or: [
            { vrchatUserId: targetId },
            { 'vrchatAlts.vrchatUserId': targetId }
          ]
        });
        if (dbUser) {
          await enforceGlobalUnban(dbUser.id, customUnbanReason);
        }
      }
    } catch (err: any) {
      console.error(`[Custom Banlist Unban] Failed for ${targetId}:`, err?.message || err);
      throw err;
    }
  }

  async function enforceCustomBanlistEntry(entry: { type: string; targetId: string; reason?: string }, listId: string, listName: string) {
    const targetId = entry?.targetId?.trim();
    if (!targetId) return;
    const reason = entry.reason?.trim() || `Custom Banlist (${listName})`;

    try {
      if (entry.type === 'discord') {
        const linkedGuilds = await Guild.find({
          $or: [
            { 'settings.customBanlistId': listId },
            { 'settings.customBanlistId': listId.toString() }
          ]
        });

        const eligibleGuilds = linkedGuilds.filter((guildData) => {
          const mode = guildData.settings?.banlistSelectionMode || 'global';
          return mode !== 'global';
        });
        await sendTransparentBanNotificationDM({
          userId: targetId,
          reason,
          banlistName: listName
        });
        await serviceClient.enforceDiscordBan(
          targetId,
          targetId,
          `Custom Banlist (${listName}): ${reason}`,
          eligibleGuilds.map((guildData) => ({
            id: guildData.id,
            staffChannelId: guildData.settings?.staffChannelId,
            logChannelId: guildData.settings?.logChannelId,
          }))
        );
      } else if (entry.type === 'vrchat') {
        await serviceClient.banVRChatUser(targetId, `Custom Banlist (${listName}): ${reason}`, true, listId);
      }
    } catch (err: any) {
      console.error(`[Custom Banlist Enforcement] Failed for ${targetId}:`, err?.message || err);
      throw err;
    }
  }

  async function scanAndBanCustomBanlistDiscordUsers() {
    try {
      const guilds = await Guild.find();
      for (const guildData of guilds) {
        const customId = guildData.settings?.customBanlistId;
        const selectionMode = guildData.settings?.banlistSelectionMode || 'global';
        
        // Only run if a custom banlist is set AND selectionMode permits custom banlist
        if (customId && (selectionMode === 'both' || selectionMode === 'custom')) {
          const customBanlist = await CustomBanlist.findById(customId);
          if (!customBanlist) continue;

          const targetClient = getGuildDiscordClient(guildData.id);
          const guild = targetClient.guilds.cache.get(guildData.id);
          if (!guild) {
            continue;
          }

          for (const entry of customBanlist.entries) {
            let discordUserIdToBan: string | null = null;
            let banReason = entry.reason || 'Listed on custom banlist';

            if (entry.type === 'discord' && entry.targetId) {
              discordUserIdToBan = entry.targetId.trim();
            } else if (entry.type === 'vrchat' && entry.targetId) {
              // Try to find if this VRChat account is linked to a database Discord user
              const vrchatIdNorm = entry.targetId.trim();
              const dbUser = await User.findOne({
                $or: [
                  { vrchatUserId: vrchatIdNorm },
                  { 'vrchatAlts.vrchatUserId': vrchatIdNorm }
                ]
              });
              if (dbUser && !dbUser.isTrusted) {
                discordUserIdToBan = dbUser.id;
                banReason = `Linked VRChat account is blacklisted on custom banlist "${customBanlist.name}" (${entry.reason || 'No reason specified'})`;
              }
            }

            if (discordUserIdToBan && isValidDiscordSnowflake(discordUserIdToBan)) {
              try {
                // Check if already banned on Discord
                const existingBan = await guild.bans.fetch(discordUserIdToBan).catch(() => null);
                if (existingBan) {
                  continue;
                }

                // Attempt to fetch user tag for logging
                let targetTag = discordUserIdToBan;
                try {
                  const discordUser = await client.users.fetch(discordUserIdToBan);
                  targetTag = discordUser.tag || discordUser.username;
                } catch (e) {}

                // Send transparent ban notification DM before banning
                await sendTransparentBanNotificationDM({
                  userId: discordUserIdToBan,
                  reason: banReason,
                  banlistName: customBanlist.name,
                  serverName: guild.name
                });

                // Ban user
                await guild.members.ban(discordUserIdToBan, { reason: `Custom Banlist (${customBanlist.name}): ${banReason}` });

                // Log to database
                await new Log({
                  action: 'DISCORD_AUTO_BAN_CUSTOM',
                  adminId: 'SYSTEM_BOT',
                  targetId: discordUserIdToBan,
                  details: `Automated custom banlist scan: Auto-banned user ${targetTag} (${discordUserIdToBan}) from Guild ${guild.name} based on Custom Banlist "${customBanlist.name}". Reason: ${banReason}`
                }).save();

                // Send alerts
                const staffChannelId = guildData.settings?.staffChannelId || guildData.settings?.logChannelId;
                if (staffChannelId) {
                  const channel = guild.channels.cache.get(staffChannelId) as any;
                  if (channel) {
                    await channel.send(`🚨 **Custom Banlist Auto-Ban Enforced**: User **${targetTag}** (${discordUserIdToBan}) was automatically banned from this server.\nCustom Banlist: **${customBanlist.name}**\nReason: ${banReason}`).catch(() => null);
                  }
                }
              } catch (banErr: any) {
              }
            }
          }
        }
      }
    } catch (err: any) {
    }
  }

  let client: Client;
  let customBotsMap: Map<string, Client>;
  let getGuildDiscordClient: (guildId: string) => Client;
  let syncCustomBotForGuild: (guildData: any) => Promise<void>;
  const discordRuntime = createDashboardDiscordRuntime({
    SystemConfig, Guild, cleanupUserDatabaseForTrustedOnly, syncAllBansAcrossPlatforms,
    findUserByQuery, serviceClient, resolveDiscordUser, getWatchlistAvatar, User,
    VerificationRequest, Log, ReputationRating, Admin, LinkCode, checkAndAutoVerifyFromDiscord,
    createGuildBackup, ServerBackup, restoreGuildBackup, extractVRChatUserId, Report,
    safeSaveReport, notifyAdmins, BanCase, CustomBanlist, getAllVRChatAccounts,
    downloadImageForScan, scanImageBufferWithNsfwjs, serviceName,
    setSyncDiscordCommandsRef: (sync: typeof syncDiscordCommandsRef) => { syncDiscordCommandsRef = sync; },
  });
  client = discordRuntime.client;
  customBotsMap = discordRuntime.customBotsMap;
  getGuildDiscordClient = discordRuntime.getGuildDiscordClient;
  syncCustomBotForGuild = discordRuntime.syncCustomBotForGuild;
  syncDiscordCommandsRef = discordRuntime.syncGlobalDiscordCommands;

  async function resolveDiscordUserFromWorker(_client: any, userId: string, dbUser?: any) {
    const discordUser = await serviceClient.fetchDiscordUser(userId).catch(() => null);
    if (!discordUser) return resolveDiscordUser(null, userId, dbUser);

    const username = discordUser.username || dbUser?.username || 'unknown';
    const displayName = discordUser.displayName || discordUser.global_name || username;
    const avatarUrl = discordUser.avatarUrl || (discordUser.avatar
      ? `https://cdn.discordapp.com/avatars/${userId}/${discordUser.avatar}.${discordUser.avatar.startsWith('a_') ? 'gif' : 'png'}?size=256`
      : 'https://cdn.discordapp.com/embed/avatars/0.png');
    if (dbUser) {
      User.updateOne({ id: userId }, { $set: { username, avatarUrl } }).catch(() => {});
    }
    return { displayName, username, avatarUrl };
  }

  async function getWatchlistAvatarFromWorker(_client: any, user: any): Promise<string> {
    const resolved = await resolveDiscordUserFromWorker(null, user.id, user);
    return resolved.avatarUrl || user.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png';
  }

  async function pruneStaleDiscordGuilds() {
    const liveGuilds = await serviceClient.getLiveDiscordGuilds();
    const liveGuildIds = new Set(liveGuilds.map((guild: any) => guild.id));
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const guildRecords = await Guild.find({});
    const staleGuilds = guildRecords.filter((guild: any) => {
      if (liveGuildIds.has(guild.id)) return false;
      const createdAt = guild.createdAt || guild._id?.getTimestamp?.() || guild.updatedAt;
      return createdAt && new Date(createdAt).getTime() <= cutoff;
    });
    const prunedGuilds: Array<{ id: string; name: string }> = [];

    for (const guild of staleGuilds) {
      const settings: any = guild.settings || {};
      if (settings.customBotEnabled) {
        await serviceClient.syncDiscordCustomBot({
          id: guild.id,
          name: guild.name,
          settings: { ...settings, customBotEnabled: false },
        });
      }
      if (settings.vrchatGroupId) {
        await serviceClient.leaveVRChatGroupIfOrphaned(settings.vrchatGroupId);
      }

      await Guild.deleteOne({ _id: guild._id });
      await VRChatAlertTracker.deleteMany({ guildId: guild.id });
      prunedGuilds.push({ id: guild.id, name: guild.name || guild.id });
      await new Log({
        action: 'PRUNE_STALE_DISCORD_GUILD',
        adminId: 'SYSTEM',
        targetId: guild.id,
        details: `Automatically removed stale Discord server record for ${guild.name || guild.id}.`,
      }).save().catch(() => null);
    }

    return { prunedCount: prunedGuilds.length, prunedGuilds };
  }

  const routeContext = {
    Admin,
    ApiBot,
    ApiKey,
    ApiKeyRequest,
    Appeal,
    BanCase,
    CustomBanlist,
    EnterpriseEndpoint,
    EnterpriseVerificationLog,
    GeoRule,
    Guild,
    LinkCode,
    Log,
    Report,
    ReputationRating,
    ServerBackup,
    SystemConfig,
    TrustedCompany,
    User,
    UserVRChatGroup,
    VerificationRequest,
    VRChatAlertTracker,
    VRChatAnnouncementHistory,
    cleanupSavedWatchlistAvatars,
    createGuildBackup,
    extractVRChatGroupId,
    extractVRChatUserId,
    getAllVRChatAccounts,
    getWatchlistAvatar: getWatchlistAvatarFromWorker,
    parseVRChatAccountString,
    resolveDiscordUser: resolveDiscordUserFromWorker,
    safeSaveAppeal,
    safeSaveReport,
    getBaseUrl,
    authenticateToken,
    optionalAuth,
    isAdmin,
    isModOrAdmin,
    checkAndAutoVerifyFromDiscord,
    syncDiscordCommandsRef: () => syncDiscordCommandsRef(),
    pruneStaleDiscordGuilds,
    enforceGlobalBan,
    enforceGlobalUnban,
    enforceCustomBanlistEntry,
    unbanCustomBanlistEntry,
    sendTransparentBanNotificationDM,
    buildTransparentBanDM,
    getGuildDiscordClient,
    syncCustomBotForGuild,
    customBotsMap,
    downloadImageForScan,
    scanImageBufferWithNsfwjs,
    createOrUpdateBanCase,
    liftBanCase,
    recordUnbanAndUnbanUser,
    rebanBanCase,
    addAccountToBanCase,
    removeAccountFromBanCase,
    migrateLegacyBansToBanCases,
    cleanupUserDatabaseForTrustedOnly,
    syncAllBansAcrossPlatforms,
    calculateDynamicTrustIndex,
    getOrLoadNsfwModel,
    notifyAdmins,
    sendMail,
    serviceName,
    port: PORT,
    client,
    workerSocketHub,
    __dirname,
    __filename,
  };

  workerSocketHub.setWorkerRequestHandler(async (workerService, command, payload) => {
    if (command === 'vrchat-display-name') {
      if (!payload?.vrchatUserId) throw new Error('VRChat user ID is required');
      return serviceClient.fetchVRChatDisplayName(payload.vrchatUserId);
    }
    if (command === 'send-group-log') {
      if (!payload?.message) throw new Error('Log message is required');
      const sentViaWorker = await serviceClient.sendGuildLogMessage({
        groupId: payload.groupId,
        guildId: payload.guildId,
        channelId: payload.channelId,
        message: payload.message,
      });
      if (!sentViaWorker && client?.isReady()) {
        const guildDocs = payload.guildId
          ? await Guild.find({ id: payload.guildId }).catch(() => [])
          : payload.groupId
            ? await Guild.find({ 'settings.vrchatGroupId': String(payload.groupId).trim() }).catch(() => [])
            : [];
        for (const gDoc of guildDocs) {
          const targetClient = getGuildDiscordClient ? getGuildDiscordClient(gDoc.id) : client;
          const dGuild = targetClient?.guilds?.cache?.get(gDoc.id);
          const chId = payload.channelId || gDoc.settings?.logChannelId || gDoc.settings?.staffChannelId;
          if (dGuild && chId) {
            const ch = dGuild.channels.cache.get(chId) || (await dGuild.channels.fetch(chId).catch(() => null));
            if (ch?.isTextBased()) {
              await (ch as any).send(payload.message).catch(() => null);
            }
          }
        }
      }
      return { success: true };
    }
    throw new Error(`Unsupported dashboard request from ${workerService}: ${command}`);
  });

  startDashboardHttpServer(app, {
    serviceName,
    port: PORT,
    workerAuthToken: process.env.WORKER_AUTH_TOKEN,
    vite,
    routeContext,
    findUserByQuery,
    resolveDiscordUser: resolveDiscordUserFromWorker,
    getWatchlistAvatar: getWatchlistAvatarFromWorker,
    client,
    User,
    BanCase,
  });

  if (serviceName === 'web-dashboard' || serviceName === 'dashboard') {
    const runGuildPrune = () => {
      void pruneStaleDiscordGuilds().catch((error: any) => {
        console.warn('[Discord Guild Prune] Skipped:', error?.message || error);
      });
    };
    setTimeout(runGuildPrune, 60 * 1000);
    setInterval(runGuildPrune, 15 * 60 * 1000);
  }

  if (serviceName !== 'dashboard' && serviceName !== 'web-dashboard') {
    // Set up interval for scanning custom banlist Discord users every 2 minutes
    setInterval(scanAndBanCustomBanlistDiscordUsers, 2 * 60 * 1000);

    // Run initial custom banlist Discord scan after 20 seconds of startup
    setTimeout(scanAndBanCustomBanlistDiscordUsers, 20 * 1000);

  } else {
    console.log('[Web Dashboard Service] Standalone dashboard mode: VRChat work is delegated to the connected worker.');
  }
}

startServer();
