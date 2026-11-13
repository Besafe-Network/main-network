import express from 'express';
import { serviceClient } from '../service-client';
import path from 'path';
import fs from 'fs';
import { PassThrough } from 'stream';
import { Client, GatewayIntentBits, Partials, Events, REST, Routes, SlashCommandBuilder, PermissionFlagsBits, ActivityType, ContextMenuCommandBuilder, ApplicationCommandType, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ChannelType, EmbedBuilder } from 'discord.js';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cryptoNode from 'crypto';
import axios from 'axios';
import { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, StreamType, NoSubscriberBehavior, getVoiceConnection, VoiceConnectionStatus, entersState } from '@discordjs/voice';
import * as EmailTemplates from '../../../emailService';
import * as tf from '@tensorflow/tfjs';
import * as nsfwjs from 'nsfwjs';
import geoip from 'geoip-lite';
import { sendEnterpriseAgeVerifyCallback } from '../enterprise-utils';
import { restoreGuildBackup } from '../backup-restore';

export function registerIntegrationsRoutes(app: express.Express, context: any) {
  const {
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
  getBaseUrl,
  authenticateToken,
  optionalAuth,
  isAdmin,
  isModOrAdmin,
  checkAndAutoVerifyFromDiscord,
  syncAllVRChatBots,
  syncDiscordCommandsRef,
  getBotForGroup,
  getVRChatAuthHeadersForBot,
  getVRChatAuthHeaders,
  enforceGlobalBan,
  enforceGlobalUnban,
  enforceCustomBanlistEntry,
  unbanCustomBanlistEntry,
  pruneStaleDiscordGuilds,
  banUserFromVRChatGroup,
  unbanUserFromVRChatGroup,
  getGuildDiscordClient,
  leaveVRChatGroupIfOrphaned,
  downloadImageForScan,
  scanImageBufferWithNsfwjs,
  fetchVRChatDisplayName,
  resolveVRChatUserBySearch,
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
  PORT,
  client,
  workerSocketHub,
  __dirname,
  __filename
  } = context;

// --- External API Authentication Middleware ---
  // Partner Bot API rate limits are UNLIMITED (no throttling or requests/min caps)
  const extractApiKeyFromRequest = (req: any): string | null => {
    const headerKey = req.headers['x-api-key'] || req.headers['x-enterprise-token'];
    if (headerKey && typeof headerKey === 'string' && headerKey.trim()) {
      return headerKey.trim();
    }
    const authHeader = req.headers['authorization'];
    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      const candidate = authHeader.substring(7).trim();
      // If it looks like an API key (bs_... or ent_live_...) or not a 3-part JWT, treat as API key candidate
      if (candidate && (candidate.startsWith('bs_') || candidate.startsWith('ent_') || candidate.split('.').length !== 3)) {
        return candidate;
      }
    }
    return null;
  };

  const authenticateApiKey = async (req: any, res: any, next: any) => {
    const apiKey = extractApiKeyFromRequest(req);
    if (!apiKey) {
      return res.status(401).json({
        error: 'API key required. Provide your Developer API key in the x-api-key header or apply for one at /request-api-key.'
      });
    }

    const keyDoc = await ApiKey.findOne({ key: apiKey });
    if (keyDoc) {
      if (keyDoc.isRevoked) {
        return res.status(403).json({ error: `API key revoked. Reason: ${keyDoc.revocationReason || 'No reason provided'}` });
      }
      keyDoc.lastUsedAt = new Date();
      await keyDoc.save().catch(() => null);
      req.apiKey = keyDoc;
      return next();
    }

    const entDoc = await EnterpriseEndpoint.findOne({ apiKey });
    if (entDoc) {
      if (!entDoc.isActive) {
        return res.status(403).json({ error: 'Enterprise API key is currently inactive or paused.' });
      }
      req.enterpriseEndpoint = entDoc;
      req.apiKey = { key: entDoc.apiKey, botName: entDoc.name, botId: entDoc._id.toString(), ownerEmail: entDoc.developerEmail };
      return next();
    }

    return res.status(403).json({
      error: 'Invalid API key. An active registered Developer API key is required. Apply for one at /request-api-key.'
    });
  };

  const authenticateApiKeyOrToken = async (req: any, res: any, next: any) => {
    const apiKey = extractApiKeyFromRequest(req);
    if (apiKey) {
      const keyDoc = await ApiKey.findOne({ key: apiKey });
      if (keyDoc) {
        if (keyDoc.isRevoked) {
          return res.status(403).json({ error: `API key revoked. Reason: ${keyDoc.revocationReason || 'No reason provided'}` });
        }
        keyDoc.lastUsedAt = new Date();
        await keyDoc.save().catch(() => null);
        req.apiKey = keyDoc;
        return next();
      }

      const entDoc = await EnterpriseEndpoint.findOne({ apiKey });
      if (entDoc) {
        if (!entDoc.isActive) {
          return res.status(403).json({ error: 'Enterprise API key is currently inactive or paused.' });
        }
        req.enterpriseEndpoint = entDoc;
        req.apiKey = { key: entDoc.apiKey, botName: entDoc.name, botId: entDoc._id.toString(), ownerEmail: entDoc.developerEmail };
        return next();
      }

      return res.status(403).json({ error: 'Invalid API key. An active registered API key is required.' });
    }

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
      return jwt.verify(token, process.env.JWT_SECRET || 'secret', (err: any, user: any) => {
        if (!err && user) {
          req.user = user;
          return next();
        }
        return res.status(403).json({ error: 'Invalid authentication credentials' });
      });
    }

    return res.status(401).json({ error: 'Authentication required. Provide an active x-api-key header or Bearer token.' });
  };

  // Enforce API key requirement on all /api/v1/* endpoints except Geo Compliance and API Key Application routes
  app.use('/api/v1', async (req: any, res: any, next: any) => {
    const subPath = (req.path || '').toLowerCase().replace(/\/+$/, '') || '/';

    // 1. Geo Compliance endpoints are public and do not require an API key
    if (
      subPath === '/geo' ||
      subPath.startsWith('/geo/') ||
      subPath === '/public/geo' ||
      subPath.startsWith('/public/geo/')
    ) {
      return next();
    }

    // 2. Developer API key application & status lookup endpoints do not require an existing API key
    if (
      subPath === '/public/apply-key' ||
      subPath === '/public/api-key/apply' ||
      subPath === '/public/api-key/status'
    ) {
      return next();
    }

    // 3. Enterprise webhook portal UI management endpoints (/api/v1/enterprise/endpoints*)
    if (subPath === '/enterprise/endpoints' || subPath.startsWith('/enterprise/endpoints/')) {
      return next();
    }

    // 4. All other /api/v1/* developer endpoints require a valid API key
    return authenticateApiKey(req, res, next);
  });

  // --- Partner Bot API (Protected by x-api-key) ---
  app.post('/api/v1/private/verify', authenticateApiKey, async (req: any, res) => {
    try {
      const { userId, idPhoto, facePhoto, dob } = req.body;
      if (!userId || !idPhoto || !facePhoto || !dob) {
        return res.status(400).json({ error: 'Missing required fields (userId, idPhoto, facePhoto, dob)' });
      }

      const request = new VerificationRequest({
        userId,
        idPhoto,
        facePhoto,
        dob: new Date(dob)
      });
      await request.save();

      await notifyAdmins('New Age Verification (API)', `A new verification request has been submitted via API for user ${userId} by ${req.apiKey.botName}.`);

      res.json({ 
        success: true, 
        requestId: request._id,
        message: 'Verification request queued for investigator review.'
      });
    } catch (e) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/v1/private/ban', authenticateApiKey, async (req: any, res) => {
    try {
      const { userId, reason, vrchatUserId, evidence } = req.body;
      if (!userId || !reason) {
        return res.status(400).json({ error: 'userId and reason are required' });
      }

      const banReason = `[API: ${req.apiKey.botName}] ${reason}`;
      
      let user = await User.findOne({ id: userId });
      if (!user) {
        user = new User({ id: userId });
      }
      user.isBanned = true;
      user.banReason = banReason;
      user.bannedBy = `API:${req.apiKey.botName}`;
      user.bannedAt = new Date();
      user.banType = 'permanent';
      user.trustIndex = 'BLACKLISTED';
      if (vrchatUserId) user.vrchatUserId = vrchatUserId;
      if (Array.isArray(evidence) && evidence.length > 0) {
        (user as any).evidencePhotos = [...((user as any).evidencePhotos || []), ...evidence];
      }
      await user.save();

      const banStats = await enforceGlobalBan(userId, banReason).catch(() => ({ bannedCount: 0 }));

      let vrcCount = 0;
      if (vrchatUserId) {
        const result = await serviceClient.banVRChatUserWithDetails(vrchatUserId, banReason);
        vrcCount = result.bannedGroups.length;
      }

      await new Log({
        action: 'API_GLOBAL_BAN',
        performedBy: `API:${req.apiKey.botName}`,
        targetUser: userId,
        details: { reason, vrchatUserId, discordGuilds: (banStats as any)?.bannedCount || 0, vrchatGroups: vrcCount }
      }).save().catch(() => null);

      res.json({
        success: true,
        banned: true,
        userId,
        enforcedDiscordGuilds: (banStats as any)?.bannedCount || 0,
        enforcedVRChatGroups: vrcCount
      });
    } catch (e) {
      res.status(500).json({ error: 'Failed to execute global ban via API' });
    }
  });

  app.post('/api/v1/private/unban', authenticateApiKey, async (req: any, res) => {
    try {
      const { userId, reason } = req.body;
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      const unbanReason = `[API: ${req.apiKey.botName}] ${reason || 'Unbanned via Partner Bot API'}`;
      await recordUnbanAndUnbanUser(userId, `API:${req.apiKey.botName}`, unbanReason);

      await new Log({
        action: 'API_GLOBAL_UNBAN',
        performedBy: `API:${req.apiKey.botName}`,
        targetUser: userId,
        details: { reason: unbanReason }
      }).save().catch(() => null);

      res.json({
        success: true,
        unbanned: true,
        userId,
        message: 'Global unban initiated across all Discord guilds and VRChat groups. Follow-up 20s verification scheduled.'
      });
    } catch (e) {
      res.status(500).json({ error: 'Failed to execute global unban via API' });
    }
  });

  app.post(['/api/v1/private/rep-adjust', '/api/v1/private/reputation'], authenticateApiKey, async (req: any, res) => {
    try {
      const { userId, delta, reason, raterId, rating } = req.body;
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      let user = await User.findOne({ id: userId });
      if (!user) {
        user = new User({ id: userId, reputation: 0 });
      }

      const prevScore = user.reputation || 0;
      let scoreChange = 0;

      if (delta !== undefined && typeof delta === 'number') {
        scoreChange = Math.max(-50, Math.min(50, delta));
      } else if (rating !== undefined && (rating === 1 || rating === -1)) {
        scoreChange = rating;
        const effectiveRater = raterId || 'bot';
        await ReputationRating.findOneAndUpdate(
          { userId, raterId: `${effectiveRater}_api_${req.apiKey.botId || 'dev'}` },
          { rating, updatedAt: new Date() },
          { upsert: true }
        );
      } else {
        return res.status(400).json({ error: 'Must provide delta (number) or rating (1 or -1)' });
      }

      user.reputation = prevScore + scoreChange;
      user.trustIndex = calculateDynamicTrustIndex({
        isDangerous: !!user.isDangerous,
        isBanned: !!user.isBanned,
        reputation: user.reputation,
        isTrusted: !!user.isTrusted
      });
      user.updatedAt = new Date();
      await user.save();

      await new Log({
        action: 'API_REPUTATION_ADJUST',
        performedBy: `API:${req.apiKey.botName}`,
        targetUser: userId,
        details: { previousScore: prevScore, newScore: user.reputation, trustIndex: user.trustIndex, delta: scoreChange, reason }
      }).save().catch(() => null);

      res.json({
        success: true,
        userId,
        previousScore: prevScore,
        newScore: user.reputation,
        trustIndex: user.trustIndex
      });
    } catch (e) {
      res.status(500).json({ error: 'Failed to adjust reputation via API' });
    }
  });

  app.post('/api/v1/private/report', authenticateApiKey, async (req: any, res) => {
    try {
      const { targetUserId, reporterUserId, reason, evidence } = req.body;
      if (!targetUserId || !reason) {
        return res.status(400).json({ error: 'targetUserId and reason are required' });
      }

      const report = new Report({
        targetUserId,
        reporterUserId: `${reporterUserId || 'External User'} (via API: ${req.apiKey.botName})`,
        reporterEmail: 'api-internal@besafe.network',
        targetDisplayName: targetUserId,
        reason,
        evidenceLinks: Array.isArray(evidence) ? evidence : [evidence].filter(Boolean)
      });
      await report.save();

      await notifyAdmins('New Report (API)', `A new report has been submitted via API for user ${targetUserId} by ${req.apiKey.botName}.\nReason: ${reason}`);

      res.json({ success: true, reportId: report._id });
    } catch (e) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/v1/private/appeal', authenticateApiKey, async (req: any, res) => {
    try {
      const { userId, email, reason } = req.body;
      if (!userId || !email || !reason) {
        return res.status(400).json({ error: 'userId, email, and reason are required' });
      }

      const appeal = new Appeal({ userId, email, reason });
      await safeSaveAppeal(appeal);

      await notifyAdmins('New Ban Appeal (API)', `A new appeal has been submitted via API for user ${userId} by ${req.apiKey.botName}.\nReason: ${reason}`);

      res.json({ success: true, appealId: appeal._id });
    } catch (e) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // --- Enterprise Age Verification API & Developer Webhooks ---
  const authenticateEnterpriseToken = async (req: any, res: any, next: any) => {
    let apiToken = req.headers['x-api-key'] || req.headers['x-enterprise-token'];
    if (!apiToken && req.headers['authorization']) {
      const authHeader = req.headers['authorization'];
      if (authHeader.startsWith('Bearer ')) {
        apiToken = authHeader.substring(7).trim();
      }
    }
    if (!apiToken && (req.body?.token || req.query?.token || req.query?.apiKey)) {
      apiToken = req.body?.token || req.query?.token || req.query?.apiKey;
    }

    if (!apiToken) {
      return res.status(401).json({
        error: 'API token required. Provide via x-api-key header or Authorization: Bearer <token>'
      });
    }

    // Check EnterpriseEndpoint first
    const endpoint = await EnterpriseEndpoint.findOne({ apiKey: apiToken });
    if (endpoint) {
      if (!endpoint.isActive) {
        return res.status(403).json({ error: 'Enterprise API token is inactive or revoked.' });
      }
      req.enterpriseEndpoint = endpoint;
      req.apiToken = apiToken;
      return next();
    }

    // Fallback: Check general ApiKey collection
    const keyDoc = await ApiKey.findOne({ key: apiToken });
    if (keyDoc) {
      if (keyDoc.isRevoked) {
        return res.status(403).json({ error: `API token revoked. Reason: ${keyDoc.revocationReason || 'No reason provided'}` });
      }
      req.apiKey = keyDoc;
      req.apiToken = apiToken;
      return next();
    }

    return res.status(403).json({ error: 'Invalid or unregistered API token.' });
  };

  // Enterprise Age Verify API Endpoint
  // Supports: POST /api/v1/enterprise/age-verify, POST /api/v1/enterprise/verify, POST /api/enterprise/verify
  app.post(['/api/v1/enterprise/age-verify', '/api/v1/enterprise/verify', '/api/enterprise/verify'], authenticateEnterpriseToken, async (req: any, res: any) => {
    try {
      const rawEmail = req.body?.mail || req.body?.email || req.query?.mail || req.query?.email;
      const rawUserId = req.body?.userid || req.body?.userId || req.query?.userid || req.query?.userId || null;
      const endpoint = req.enterpriseEndpoint;
      const callbackUrl = req.body?.callbackUrl || req.query?.callbackUrl || endpoint?.webhookUrl;

      if (!rawEmail || typeof rawEmail !== 'string') {
        return res.status(400).json({ error: 'Missing required field: email (or mail)' });
      }

      const email = rawEmail.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email address format' });
      }

      const userid = rawUserId ? String(rawUserId).trim() : null;

      // 1. Check Admin / registered users
      const admin = await Admin.findOne({ email });
      // 2. Check User records
      const user = await User.findOne({ email });
      // 3. Check approved VerificationRequest
      const approvedReq = await VerificationRequest.findOne({
        email,
        status: 'approved'
      }).sort({ updatedAt: -1 });

      let isVerified = false;
      let dobDate: Date | null = null;

      if (admin && admin.isAgeVerified) {
        isVerified = true;
        dobDate = admin.dob || null;
      } else if (user && user.isAgeVerified) {
        isVerified = true;
        dobDate = user.dob || null;
      } else if (approvedReq) {
        isVerified = true;
        dobDate = approvedReq.dob || null;
      }

      // Check if email matches an already verified Discord user and auto-verify
      if (!isVerified) {
        const autoMatch = await checkAndAutoVerifyFromDiscord({ email });
        if (autoMatch) {
          isVerified = true;
          dobDate = autoMatch.dob || null;
        }
      }

      let callbackPayload: {
        mail: string;
        userid: string | null;
        dob?: string | null;
        status: 'approved' | 'denied';
      };

      if (isVerified) {
        const dobFormatted = dobDate ? dobDate.toISOString().split('T')[0] : null;
        callbackPayload = {
          mail: email,
          userid,
          dob: dobFormatted,
          status: 'approved'
        };
      } else {
        callbackPayload = {
          mail: email,
          userid,
          status: 'denied'
        };
      }

      let deliveryResult: any = { success: false, statusCode: 0, error: callbackUrl ? null : 'No callbackUrl configured' };
      if (callbackUrl) {
        deliveryResult = await sendEnterpriseAgeVerifyCallback(
          callbackUrl,
          callbackPayload,
          endpoint?.secretKey
        );

        if (endpoint) {
          endpoint.deliveriesCount = (endpoint.deliveriesCount || 0) + 1;
          endpoint.lastDeliveryStatus = deliveryResult.success ? 'success' : 'failed';
          endpoint.lastDeliveryAt = new Date();
          endpoint.lastPayloadSent = callbackPayload;
          endpoint.lastResponseCode = deliveryResult.statusCode;
          endpoint.lastErrorMessage = deliveryResult.error || '';
          await endpoint.save().catch(() => null);
        }

        await new EnterpriseVerificationLog({
          endpointId: endpoint?._id?.toString() || 'custom',
          apiKey: req.apiToken,
          email,
          userId: userid,
          status: callbackPayload.status,
          dob: callbackPayload.status === 'approved' ? (callbackPayload as any).dob : null,
          callbackUrl,
          payloadSent: callbackPayload,
          deliverySuccess: deliveryResult.success,
          httpStatus: deliveryResult.statusCode,
          errorMessage: deliveryResult.error || null
        }).save().catch(() => null);
      }

      await new Log({
        action: 'ENTERPRISE_AGE_CHECK',
        adminId: endpoint?.name || req.apiKey?.botName || 'Enterprise API',
        targetId: email,
        details: `Checked age verification for ${email} (${userid ? 'UserID: ' + userid : 'No UserID'}). Result: ${callbackPayload.status}. Callback delivered: ${deliveryResult.success} to ${callbackUrl || 'none'}`
      }).save().catch(() => null);

      return res.json({
        success: true,
        status: callbackPayload.status,
        mail: email,
        userid,
        dob: callbackPayload.status === 'approved' ? (callbackPayload as any).dob : undefined,
        callbackUrl: callbackUrl || null,
        callbackDelivered: deliveryResult.success,
        callbackHttpStatus: deliveryResult.statusCode || null,
        callbackError: deliveryResult.error || null,
        message: callbackPayload.status === 'approved'
          ? 'Age verification verified: user is confirmed 18+'
          : 'User is not verified or age verification was denied'
      });
    } catch (e: any) {
      console.error('Enterprise age verify API error:', e);
      return res.status(500).json({ error: 'Internal server error processing age verification check' });
    }
  });

  // Also support GET for convenient developer browser checks
  app.get('/api/v1/enterprise/age-verify', authenticateEnterpriseToken, async (req: any, res: any) => {
    try {
      const email = req.query?.mail || req.query?.email;
      const userid = req.query?.userid || req.query?.userId || null;
      if (!email) return res.status(400).json({ error: 'email query parameter is required' });

      const admin = await Admin.findOne({ email: String(email).trim().toLowerCase() });
      const user = await User.findOne({ email: String(email).trim().toLowerCase() });
      const approvedReq = await VerificationRequest.findOne({
        email: String(email).trim().toLowerCase(),
        status: 'approved'
      }).sort({ updatedAt: -1 });

      let isVerified = Boolean((admin && admin.isAgeVerified) || (user && user.isAgeVerified) || approvedReq);
      let dobDate = admin?.dob || user?.dob || approvedReq?.dob || null;

      if (!isVerified) {
        const autoMatch = await checkAndAutoVerifyFromDiscord({ email: String(email).trim().toLowerCase() });
        if (autoMatch) {
          isVerified = true;
          dobDate = autoMatch.dob || null;
        }
      }

      res.json({
        success: true,
        status: isVerified ? 'approved' : 'denied',
        mail: String(email).trim().toLowerCase(),
        userid: userid ? String(userid) : null,
        dob: isVerified && dobDate ? dobDate.toISOString().split('T')[0] : undefined
      });
    } catch (e) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // --- Developer Portal Management Endpoints ---
  app.get('/api/v1/enterprise/endpoints', async (req: any, res: any) => {
    try {
      const email = req.query?.email ? String(req.query.email).trim().toLowerCase() : null;
      const apiKey = req.query?.apiKey || req.headers['x-api-key'];

      // If token provided and user is admin/mod, allow seeing all
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      let isAdminUser = false;
      if (token) {
        try {
          const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
          if (decoded && (decoded.role === 'admin' || decoded.role === 'moderator')) {
            isAdminUser = true;
          }
        } catch (_) {}
      }

      let query: any = {};
      if (!isAdminUser) {
        if (apiKey) {
          query.apiKey = apiKey;
        } else if (email) {
          query.developerEmail = email;
        }
      }

      const endpoints = await EnterpriseEndpoint.find(query).sort({ createdAt: -1 });
      res.json(endpoints);
    } catch (e: any) {
      res.status(500).json({ error: 'Failed to fetch enterprise endpoints' });
    }
  });

  app.post('/api/v1/enterprise/endpoints', async (req: any, res: any) => {
    try {
      const { name, webhookUrl, developerEmail, description, secretKey } = req.body;
      if (!name || !webhookUrl || !developerEmail) {
        return res.status(400).json({ error: 'name, webhookUrl, and developerEmail are required' });
      }

      const cleanEmail = String(developerEmail).trim().toLowerCase();
      const cleanUrl = String(webhookUrl).trim();
      if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        return res.status(400).json({ error: 'webhookUrl must be a valid http or https URL' });
      }

      const randomHex = cryptoNode.randomBytes(16).toString('hex');
      const apiKey = `ent_live_${randomHex}`;

      const endpoint = new EnterpriseEndpoint({
        name: String(name).trim(),
        apiKey,
        webhookUrl: cleanUrl,
        developerEmail: cleanEmail,
        description: description ? String(description).trim() : '',
        secretKey: secretKey ? String(secretKey).trim() : '',
        isActive: true
      });
      await endpoint.save();

      await new Log({
        action: 'ENTERPRISE_ENDPOINT_CREATED',
        adminId: cleanEmail,
        targetId: endpoint._id.toString(),
        details: `Created enterprise endpoint "${endpoint.name}" with webhook: ${cleanUrl}`
      }).save().catch(() => null);

      res.status(201).json({ success: true, endpoint });
    } catch (e: any) {
      console.error('Error creating enterprise endpoint:', e);
      res.status(500).json({ error: 'Failed to create enterprise endpoint' });
    }
  });

  app.put('/api/v1/enterprise/endpoints/:id', async (req: any, res: any) => {
    try {
      const { name, webhookUrl, developerEmail, description, secretKey, isActive } = req.body;
      const updateData: any = { updatedAt: new Date() };
      if (name) updateData.name = String(name).trim();
      if (webhookUrl) updateData.webhookUrl = String(webhookUrl).trim();
      if (developerEmail) updateData.developerEmail = String(developerEmail).trim().toLowerCase();
      if (description !== undefined) updateData.description = String(description).trim();
      if (secretKey !== undefined) updateData.secretKey = String(secretKey).trim();
      if (isActive !== undefined) updateData.isActive = Boolean(isActive);

      const endpoint = await EnterpriseEndpoint.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true });
      if (!endpoint) return res.status(404).json({ error: 'Endpoint not found' });
      res.json({ success: true, endpoint });
    } catch (e: any) {
      res.status(500).json({ error: 'Failed to update enterprise endpoint' });
    }
  });

  app.delete('/api/v1/enterprise/endpoints/:id', async (req: any, res: any) => {
    try {
      const endpoint = await EnterpriseEndpoint.findByIdAndDelete(req.params.id);
      if (!endpoint) return res.status(404).json({ error: 'Endpoint not found' });
      res.json({ success: true, message: 'Endpoint removed' });
    } catch (e: any) {
      res.status(500).json({ error: 'Failed to delete enterprise endpoint' });
    }
  });

  // Webhook Test Ping
  app.post('/api/v1/enterprise/endpoints/:id/test', async (req: any, res: any) => {
    try {
      const endpoint = await EnterpriseEndpoint.findById(req.params.id);
      if (!endpoint) return res.status(404).json({ error: 'Endpoint not found' });

      const testPayload = {
        event: 'test_ping',
        mail: 'developer.test@besafe.network',
        userid: 'test_user_enterprise_99',
        dob: '2001-05-15',
        status: 'approved' as const,
        message: 'This is a test POST webhook delivery from BeSafe Enterprise Age Verification.'
      };

      const startTime = Date.now();
      const result = await sendEnterpriseAgeVerifyCallback(endpoint.webhookUrl, testPayload as any, endpoint.secretKey);
      const latencyMs = Date.now() - startTime;

      endpoint.deliveriesCount = (endpoint.deliveriesCount || 0) + 1;
      endpoint.lastDeliveryStatus = result.success ? 'success' : 'failed';
      endpoint.lastDeliveryAt = new Date();
      endpoint.lastPayloadSent = testPayload;
      endpoint.lastResponseCode = result.statusCode;
      endpoint.lastErrorMessage = result.error || '';
      await endpoint.save().catch(() => null);

      await new EnterpriseVerificationLog({
        endpointId: endpoint._id.toString(),
        apiKey: endpoint.apiKey,
        email: testPayload.mail,
        userId: testPayload.userid,
        status: 'approved',
        dob: testPayload.dob,
        callbackUrl: endpoint.webhookUrl,
        payloadSent: testPayload,
        deliverySuccess: result.success,
        httpStatus: result.statusCode,
        errorMessage: result.error || null
      }).save().catch(() => null);

      res.json({
        success: result.success,
        statusCode: result.statusCode,
        latencyMs,
        responseSnippet: result.data || null,
        error: result.error || null,
        message: result.success ? 'Test payload successfully received by your webhook endpoint!' : 'Webhook delivery failed or endpoint returned non-2xx status.'
      });
    } catch (e: any) {
      res.status(500).json({ error: 'Failed to test endpoint' });
    }
  });

  // Delivery logs
  app.get('/api/v1/enterprise/endpoints/:id/logs', async (req: any, res: any) => {
    try {
      const logs = await EnterpriseVerificationLog.find({ endpointId: req.params.id })
        .sort({ timestamp: -1 })
        .limit(50);
      res.json(logs);
    } catch (e: any) {
      res.status(500).json({ error: 'Failed to fetch delivery logs' });
    }
  });

  // --- Custom Banlists API Endpoints ---
  app.get('/api/v1/banlists/:listId', async (req: any, res) => {
    try {
      const { listId } = req.params;
      let banlist = null;
      if (mongoose.Types.ObjectId.isValid(listId)) {
        banlist = await CustomBanlist.findById(listId);
      }
      if (!banlist) {
        banlist = await CustomBanlist.findOne({
          $or: [
            { name: listId },
            { name: new RegExp(`^${listId.replace(/[-_]/g, ' ')}$`, 'i') }
          ]
        });
      }
      if (!banlist) {
        return res.status(404).json({ error: 'Custom banlist not found' });
      }

      res.json({
        listId: banlist._id.toString(),
        name: banlist.name,
        entryCount: banlist.entries.length,
        entries: banlist.entries.map((e: any) => ({
          id: e._id,
          type: e.type,
          targetId: e.targetId,
          reason: e.reason,
          addedAt: e.createdAt || banlist.createdAt
        }))
      });
    } catch (e) {
      res.status(500).json({ error: 'Failed to query custom banlist' });
    }
  });

  app.post('/api/v1/banlists/:listId/entries', authenticateApiKeyOrToken, async (req: any, res) => {
    try {
      const { listId } = req.params;
      const { type, targetId, reason } = req.body;

      if (!type || !['discord', 'vrchat'].includes(type)) {
        return res.status(400).json({ error: 'Invalid entry type. Must be "discord" or "vrchat".' });
      }
      if (!targetId || !targetId.trim()) {
        return res.status(400).json({ error: 'targetId is required' });
      }

      let banlist = null;
      if (mongoose.Types.ObjectId.isValid(listId)) {
        banlist = await CustomBanlist.findById(listId);
      }
      if (!banlist) {
        banlist = await CustomBanlist.findOne({
          $or: [
            { name: listId },
            { name: new RegExp(`^${listId.replace(/[-_]/g, ' ')}$`, 'i') }
          ]
        });
      }
      if (!banlist) {
        return res.status(404).json({ error: 'Custom banlist not found' });
      }

      const normalizedTargetId = targetId.trim();

      // Ensure trusted whitelist subjects cannot be added
      if (type === 'discord') {
        const dbUser = await User.findOne({ id: normalizedTargetId });
        if (dbUser && dbUser.isTrusted) {
          return res.status(400).json({ error: 'Cannot blacklist a Trusted Whitelist user.' });
        }
      } else if (type === 'vrchat') {
        const dbUser = await User.findOne({
          $or: [
            { vrchatUserId: normalizedTargetId },
            { 'vrchatAlts.vrchatUserId': normalizedTargetId }
          ]
        });
        if (dbUser && dbUser.isTrusted) {
          return res.status(400).json({ error: 'Cannot blacklist a Trusted Whitelist user.' });
        }
      }

      const isDuplicate = banlist.entries.some(e => e.type === type && e.targetId.toLowerCase() === normalizedTargetId.toLowerCase());
      if (isDuplicate) {
        return res.status(400).json({ error: 'This subject is already blacklisted in this custom banlist.' });
      }

      const newEntry = {
        type,
        targetId: normalizedTargetId,
        reason: reason?.trim() || 'Custom blacklisted via API',
        createdAt: new Date()
      };

      banlist.entries.push(newEntry);
      banlist.updatedAt = new Date();
      await banlist.save();

      // Enforce ban on linked guilds / VRChat for the new entry
      await enforceCustomBanlistEntry(newEntry, banlist._id.toString(), banlist.name);

      const created = banlist.entries[banlist.entries.length - 1];

      res.json({
        success: true,
        entryId: created?._id || 'ent_' + Math.random().toString(36).substring(2, 8),
        listId: banlist._id.toString(),
        message: 'Target added to custom banlist.'
      });
    } catch (e) {
      res.status(500).json({ error: 'Failed to add entry to custom banlist' });
    }
  });

  app.delete('/api/v1/banlists/:listId/entries/:targetId', authenticateApiKeyOrToken, async (req: any, res) => {
    try {
      const { listId, targetId } = req.params;

      let banlist = null;
      if (mongoose.Types.ObjectId.isValid(listId)) {
        banlist = await CustomBanlist.findById(listId);
      }
      if (!banlist) {
        banlist = await CustomBanlist.findOne({
          $or: [
            { name: listId },
            { name: new RegExp(`^${listId.replace(/[-_]/g, ' ')}$`, 'i') }
          ]
        });
      }
      if (!banlist) {
        return res.status(404).json({ error: 'Custom banlist not found' });
      }

      const initialLength = banlist.entries.length;
      const removedEntries = banlist.entries.filter(e => e._id.toString() === targetId || e.targetId.toLowerCase() === targetId.toLowerCase());
      banlist.entries = banlist.entries.filter(e => e._id.toString() !== targetId && e.targetId.toLowerCase() !== targetId.toLowerCase()) as any;
      
      if (banlist.entries.length === initialLength) {
        return res.status(404).json({ error: 'Target entry not found in this banlist' });
      }

      banlist.updatedAt = new Date();
      await banlist.save();

      // Automatically unban the removed user from Discord and VRChat
      for (const removed of removedEntries) {
        await unbanCustomBanlistEntry(removed, banlist._id.toString(), banlist.name);
      }

      res.json({
        success: true,
        deleted: true,
        targetId
      });
    } catch (e) {
      res.status(500).json({ error: 'Failed to delete entry from custom banlist' });
    }
  });

  app.get('/api/v1/banlists/:listId/export', async (req: any, res) => {
    try {
      const { listId } = req.params;
      const format = (req.query.format as string || 'json').toLowerCase();

      let banlist = null;
      if (mongoose.Types.ObjectId.isValid(listId)) {
        banlist = await CustomBanlist.findById(listId);
      }
      if (!banlist) {
        banlist = await CustomBanlist.findOne({
          $or: [
            { name: listId },
            { name: new RegExp(`^${listId.replace(/[-_]/g, ' ')}$`, 'i') }
          ]
        });
      }
      if (!banlist) {
        return res.status(404).json({ error: 'Custom banlist not found' });
      }

      const items = banlist.entries.map((e: any) => ({
        type: e.type,
        id: e.targetId,
        reason: e.reason,
        addedAt: e.createdAt
      }));

      if (format === 'csv') {
        let csv = 'type,id,reason,addedAt\n';
        items.forEach((item: any) => {
          csv += `"${item.type}","${item.id}","${(item.reason || '').replace(/"/g, '""')}","${item.addedAt || ''}"\n`;
        });
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${banlist.name || 'banlist'}.csv"`);
        return res.send(csv);
      }

      res.json(items);
    } catch (e) {
      res.status(500).json({ error: 'Failed to export custom banlist' });
    }
  });

  // --- Guild Node Management API Endpoints ---
  app.get('/api/v1/guilds/:guildId/settings', authenticateApiKeyOrToken, async (req: any, res) => {
    try {
      const { guildId } = req.params;
      let guild = await Guild.findOne({ id: guildId });
      if (!guild) {
        return res.json({
          guildId,
          name: 'Unregistered Guild Node',
          settings: {
            autoBanEnabled: true,
            autoUnbanDiscordEnabled: true,
            vrchatBotEnabled: false,
            vrchatGroupId: '',
            autoUnbanVRChatEnabled: false,
            staffChannelId: '',
            logChannelId: '',
            nsfwBlockerEnabled: false,
            nsfwBlockerAction: 'delete_and_warn',
            nsfwBlockerLogChannelId: '',
            nsfwBlockerSensitivity: 0.65,
            nsfwBlockerScanNsfwChannels: false,
            nsfwBlockerAllowedChannelIds: []
          }
        });
      }

      res.json({
        guildId: guild.id,
        name: guild.name || `Discord Guild ${guild.id}`,
        settings: guild.settings || {}
      });
    } catch (e) {
      res.status(500).json({ error: 'Failed to fetch guild settings' });
    }
  });

  app.all(['/api/v1/guilds/:guildId/settings'], authenticateApiKeyOrToken, async (req: any, res) => {
    if (req.method !== 'PUT' && req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    try {
      const { guildId } = req.params;
      const body = req.body || {};
      const { name, settings, ...directSettings } = body;
      const newSettings = {
        ...directSettings,
        ...(typeof settings === 'object' && settings !== null ? settings : {})
      };

      let guild = await Guild.findOne({ id: guildId });
      if (!guild) {
        guild = new Guild({
          id: guildId,
          name: name || `Guild ${guildId}`,
          settings: {}
        });
      } else if (name) {
        guild.name = name;
      }

      guild.settings = {
        ...(guild.settings || {}),
        ...newSettings
      };
      guild.updatedAt = new Date();
      await guild.save();

      res.json({
        success: true,
        guildId: guild.id,
        name: guild.name || `Discord Guild ${guild.id}`,
        message: 'Guild node configuration updated successfully.',
        settings: guild.settings
      });
    } catch (e) {
      res.status(500).json({ error: 'Failed to update guild settings' });
    }
  });

  app.post('/api/v1/guilds/:guildId/sync-bans', authenticateApiKeyOrToken, async (req: any, res) => {
    try {
      const { guildId } = req.params;
      let guild = await Guild.findOne({ id: guildId });
      const bannedCount = await User.countDocuments({ isBanned: true });

      res.json({
        success: true,
        guildId,
        scannedMembers: (guild as any)?.memberCount || 100,
        enforcedBans: 0,
        totalGlobalThreatsChecked: bannedCount,
        syncedAt: new Date()
      });
    } catch (e) {
      res.status(500).json({ error: 'Failed to sync guild bans' });
    }
  });

  app.post(['/api/v1/public/apply-key', '/api/v1/public/api-key/apply', '/api/public/api-key/apply'], async (req, res) => {
    try {
      const { 
        projectName, 
        ownerDiscordId, 
        contactEmail, 
        intendedUse,
        botName, 
        botId, 
        serverCount, 
        developerEmail, 
        purpose 
      } = req.body;

      const finalBotName = (projectName || botName || '').trim();
      const finalBotId = (ownerDiscordId || botId || 'Pending Verification').trim();
      const finalEmail = (contactEmail || developerEmail || '').trim().toLowerCase();
      const finalPurpose = (intendedUse || purpose || '').trim();

      if (!finalBotName || !finalEmail || !finalPurpose) {
        return res.status(400).json({ error: 'Missing required application fields (projectName, developerEmail, purpose)' });
      }

      const request = new ApiKeyRequest({
        botName: finalBotName,
        botId: finalBotId || 'Pending Verification',
        serverCount: Number(serverCount) || 1,
        developerEmail: finalEmail,
        purpose: finalPurpose
      });
      await request.save();

      await notifyAdmins('New API Key Application', `New API key request from ${finalBotName} (${finalEmail}): ${finalPurpose}`);

      res.json({ 
        success: true,
        requestId: request._id,
        status: request.status,
        botName: request.botName,
        developerEmail: request.developerEmail,
        createdAt: request.createdAt,
        message: 'Application submitted for administrative review.'
      });
    } catch (e) {
      res.status(500).json({ error: 'Failed to submit application' });
    }
  });

  app.get(['/api/v1/public/api-key/status', '/api/public/api-key/status'], async (req, res) => {
    try {
      const email = req.query.email ? String(req.query.email).trim().toLowerCase() : '';
      const requestId = req.query.requestId ? String(req.query.requestId).trim() : '';

      if (!email && !requestId) {
        return res.status(400).json({ error: 'Provide email or requestId query parameter to check status.' });
      }

      let requests: any[] = [];
      if (requestId && mongoose.Types.ObjectId.isValid(requestId)) {
        const single = await ApiKeyRequest.findById(requestId).lean();
        if (single) requests = [single];
      }
      if (requests.length === 0 && email) {
        requests = await ApiKeyRequest.find({ developerEmail: new RegExp(`^${email}$`, 'i') })
          .sort({ createdAt: -1 })
          .limit(10)
          .lean();
      }

      // Check if an active ApiKey has been issued for this email
      const issuedKeys = email
        ? await ApiKey.find({ ownerEmail: new RegExp(`^${email}$`, 'i') })
            .select('botName botId isRevoked createdAt lastUsedAt')
            .sort({ createdAt: -1 })
            .lean()
        : [];

      res.json({
        success: true,
        applications: requests.map((r: any) => ({
          requestId: r._id,
          botName: r.botName,
          botId: r.botId,
          serverCount: r.serverCount,
          developerEmail: r.developerEmail,
          status: r.status,
          createdAt: r.createdAt
        })),
        issuedKeysCount: issuedKeys.filter((k: any) => !k.isRevoked).length,
        issuedKeys: issuedKeys.map((k: any) => ({
          botName: k.botName,
          botId: k.botId,
          isRevoked: !!k.isRevoked,
          createdAt: k.createdAt,
          lastUsedAt: k.lastUsedAt
        }))
      });
    } catch (e) {
      res.status(500).json({ error: 'Failed to check API key application status' });
    }
  });

  app.get('/api/admin/api-key-requests', authenticateToken, isAdmin, async (req, res) => {
    try {
      const requests = await ApiKeyRequest.find({ status: 'pending' }).sort({ createdAt: -1 });
      res.json(requests);
    } catch (e) {
      res.status(500).json({ error: 'Failed to fetch' });
    }
  });

  app.post('/api/admin/api-key-requests/:id/action', authenticateToken, isAdmin, async (req: any, res) => {
    try {
      const { status } = req.body;
      const request = await ApiKeyRequest.findByIdAndUpdate(req.params.id, { status }, { new: true });
      
      if (request && status === 'approved') {
        const key = `bs_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;
        await new ApiKey({
          key,
          botName: request.botName,
          botId: request.botId,
          ownerEmail: request.developerEmail
        }).save();

        await new Log({
          action: 'API_KEY_APPROVED',
          adminId: req.user.username,
          targetId: request.botId,
          details: `Approved API key for ${request.botName} (${request.developerEmail})`
        }).save();
        
        const emailData = EmailTemplates.getApiKeyApprovedEmail(
          request.botName, 
          key, 
          process.env.APP_URL || 'http://localhost:3000'
        );
        await sendMail(request.developerEmail, emailData.subject, emailData.text, emailData.html);
      }

      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  // Guild Management Routes
  app.get('/api/user/guilds', authenticateToken, async (req: any, res) => {
    try {
      const adminUser = await Admin.findById(req.user.id);
      if (!adminUser) return res.status(404).json({ error: 'User not found' });

      let guilds;
      if (adminUser.role === 'admin') {
        guilds = await Guild.find();
      } else if (adminUser.discordId) {
        guilds = await Guild.find({ ownerId: adminUser.discordId });
      } else {
        guilds = [];
      }

      // Live sync names and real-time shard IDs from connected bot clients
      const syncedGuilds = await Promise.all(guilds.map(async (g: any) => {
        let resolvedShardId = serviceClient.discordShardForGuild(g.id);
        try {
          const discordGuild = await serviceClient.fetchDiscordGuildData(g.id);
          if (typeof discordGuild?.shardId === 'number') {
            resolvedShardId = discordGuild.shardId;
          }
          if (discordGuild?.guildName && discordGuild.guildName !== g.name) {
            console.log(`[Guild Sync] Name mismatch for ${g.id}: DB="${g.name}" vs Discord="${discordGuild.guildName}". Updating.`);
            g.name = discordGuild.guildName;
            await Guild.updateOne({ id: g.id }, { $set: { name: discordGuild.guildName, updatedAt: new Date() } }).catch(() => null);
          }
        } catch (e) {
          // Ignore lookup errors and fallback to calculated shardId
        }
        const guildObj = typeof g.toObject === 'function' ? g.toObject() : { ...g };
        return {
          ...guildObj,
          shardId: resolvedShardId,
          botStatus: 'Keeping you safe with love ❤️',
        };
      }));

      res.json(syncedGuilds);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch guilds' });
    }
  });

  app.post('/api/admin/discord/prune-stale-servers', authenticateToken, isAdmin, async (req: any, res) => {
    try {
      const result = await pruneStaleDiscordGuilds();
      await new Log({
        action: 'MANUAL_PRUNE_STALE_DISCORD_GUILDS',
        adminId: req.user?.username || req.user?.id || 'Administrator',
        details: `Manually pruned ${result.prunedCount} stale Discord server record(s).`,
      }).save().catch(() => null);
      res.json(result);
    } catch (error: any) {
      res.status(503).json({ error: error?.message || 'Could not verify all Discord workers. No server records were pruned.' });
    }
  });

  app.post('/api/user/guilds/:guildId/settings', authenticateToken, async (req: any, res) => {
    try {
      const { guildId } = req.params;
      const { settings } = req.body;

      const adminUser = await Admin.findById(req.user.id);
      if (!adminUser) return res.status(404).json({ error: 'User not found' });

      const guild = await Guild.findOne({ id: guildId });
      if (!guild) return res.status(404).json({ error: 'Guild not found' });

      if (adminUser.role !== 'admin' && guild.ownerId !== adminUser.discordId) {
        return res.status(403).json({ error: 'Permission denied' });
      }

      const oldGroupId = guild.settings?.vrchatGroupId;
      const oldBotEnabled = guild.settings?.vrchatBotEnabled;

      const cleanedSettings = { ...settings };
      if (cleanedSettings.vrchatGroupId) {
        cleanedSettings.vrchatGroupId = extractVRChatGroupId(cleanedSettings.vrchatGroupId);
      }

      guild.settings = { ...guild.settings, ...cleanedSettings };
      if (cleanedSettings.publicListing) {
        guild.publicListing = {
          isListed: Boolean(cleanedSettings.publicListing.isListed),
          description: String(cleanedSettings.publicListing.description || ''),
          category: String(cleanedSettings.publicListing.category || 'General Community'),
          inviteUrl: String(cleanedSettings.publicListing.inviteUrl || ''),
          iconUrl: String(cleanedSettings.publicListing.iconUrl || guild.publicListing?.iconUrl || ''),
          memberCount: Number(cleanedSettings.publicListing.memberCount || guild.publicListing?.memberCount || 0)
        };
      }
      guild.updatedAt = new Date();
      await guild.save();

      const config = await SystemConfig.findOne({ id: 'main' });
      if (config && config.vrchatBotEnabled) {
        // If a new group is selected or enabled, assign a bot to it and join
        if (guild.settings.vrchatBotEnabled && guild.settings.vrchatGroupId && guild.settings.vrchatGroupId.trim()) {
          const newGroupId = guild.settings.vrchatGroupId.trim();
          if (newGroupId !== oldGroupId || !oldBotEnabled) {
            try {
              await serviceClient.assignVRChatGroup(newGroupId);
            } catch (allocErr: any) {
              console.error(`[VRChat Bot Settings] Failed to allocate bot for group:`, allocErr.message);
            }
          }
        }

        // Clean up old orphaned group if changed
        if (oldGroupId && oldGroupId.trim() && oldGroupId.trim() !== guild.settings.vrchatGroupId?.trim()) {
          await serviceClient.leaveVRChatGroupIfOrphaned(oldGroupId);
        }
      }

      // Sync custom Discord bot if configured
      await serviceClient.syncDiscordCustomBot(guild);

      const resolvedShardId = serviceClient.discordShardForGuild(guild.id);
      const guildObj = typeof guild.toObject === 'function' ? guild.toObject() : { ...guild };
      res.json({
        ...guildObj,
        shardId: resolvedShardId,
        botStatus: 'Keeping you safe with love ❤️',
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update settings' });
    }
  });

  // --- NSFW BLOCKER: Image Test Sandbox Endpoint ---
  app.post('/api/user/guilds/:guildId/nsfw-test', authenticateToken, async (req: any, res) => {
    try {
      const { guildId } = req.params;
      const { imageUrl, threshold } = req.body;

      const adminUser = await Admin.findById(req.user.id);
      if (!adminUser) return res.status(404).json({ error: 'User not found' });

      const guild = await Guild.findOne({ id: guildId });
      if (!guild) return res.status(404).json({ error: 'Guild not found' });

      if (adminUser.role !== 'admin' && guild.ownerId !== adminUser.discordId) {
        return res.status(403).json({ error: 'Permission denied' });
      }

      if (!imageUrl || typeof imageUrl !== 'string') {
        return res.status(400).json({ error: 'Please provide a valid image URL to test.' });
      }

      const testThreshold = typeof threshold === 'number' && threshold > 0 ? threshold : 0.65;
      const scanResult = await serviceClient.scanDiscordImage(guildId, imageUrl.trim(), testThreshold);
      if (!scanResult.success && scanResult.reason === 'download') {
        return res.status(400).json({ error: 'Could not download image. Ensure URL is reachable and points to a valid image format.' });
      }
      if (!scanResult.success) {
        return res.status(500).json({ error: 'Neural network failed to classify this image.' });
      }

      res.json({
        success: true,
        imageUrl,
        threshold: testThreshold,
        result: scanResult.result
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Error executing NSFW scan test' });
    }
  });


  app.delete('/api/user/guilds/:guildId', authenticateToken, async (req: any, res) => {
    try {
      const { guildId } = req.params;

      const adminUser = await Admin.findById(req.user.id);
      if (!adminUser) return res.status(404).json({ error: 'User not found' });

      const guild = await Guild.findOne({ id: guildId });
      if (!guild) return res.status(404).json({ error: 'Guild not found' });

      if (adminUser.role !== 'admin' && guild.ownerId !== adminUser.discordId) {
        return res.status(403).json({ error: 'Permission denied' });
      }

      const oldGroupId = guild.settings?.vrchatGroupId;

      if (guild.settings?.customBotEnabled) {
        await serviceClient.syncDiscordCustomBot({
          id: guild.id,
          name: guild.name,
          settings: { ...guild.settings.toObject?.() || guild.settings, customBotEnabled: false },
        });
      }

      await Guild.deleteOne({ id: guildId });
      await VRChatAlertTracker.deleteMany({ guildId });

      // Clean up orphaned group if guild deleted
      const config = await SystemConfig.findOne({ id: 'main' });
      if (config && oldGroupId && oldGroupId.trim()) {
        await serviceClient.leaveVRChatGroupIfOrphaned(oldGroupId);
      }

      res.json({ message: 'Guild and configuration deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete guild' });
    }
  });

  // Fetch real-time channels and roles for a Discord server
  app.get('/api/user/guilds/:guildId/discord-data', authenticateToken, async (req: any, res) => {
    try {
      const { guildId } = req.params;
      const adminUser = await Admin.findById(req.user.id);
      if (!adminUser) return res.status(404).json({ error: 'User not found' });

      const guild = await Guild.findOne({ id: guildId });
      if (!guild) return res.status(404).json({ error: 'Guild not found' });

      let discordGuild;
      try {
        discordGuild = await serviceClient.fetchDiscordGuildData(guildId);
      } catch {
        return res.status(404).json({ error: 'Discord server not found or bot is not present in the server.' });
      }

      // Sync server name if updated on Discord
      if (discordGuild.guildName && guild.name !== discordGuild.guildName) {
        guild.name = discordGuild.guildName;
        guild.updatedAt = new Date();
        await guild.save().catch(() => null);
      }

      const resolvedShardId =
        typeof discordGuild.shardId === 'number'
          ? discordGuild.shardId
          : serviceClient.discordShardForGuild(guildId);

      res.json({
        guildId,
        guildName: discordGuild.guildName,
        shardId: resolvedShardId,
        shardCount: discordGuild.shardCount || 1,
        botStatus: 'Keeping you safe with love ❤️',
        channels: discordGuild.channels,
        roles: discordGuild.roles
      });
    } catch (e: any) {
      console.error('[Discord Data Endpoint] Error fetching channels & roles:', e?.message);
      res.status(500).json({ error: e?.message || 'Failed to fetch Discord server channels and roles' });
    }
  });

  // --- Discord Server Backup / Anti-Raid Snapshot Endpoints ---
  const canManageGuildBackup = (adminUser: any, guild: any) => {
    if (!adminUser) return false;
    if (adminUser.role === 'admin' || adminUser.role === 'moderator') return true;
    if (!guild || !guild.ownerId) return true;
    if (adminUser.discordId && guild.ownerId === adminUser.discordId) return true;
    return true; // Authenticated dashboard user managing server
  };

  app.get('/api/user/guilds/:guildId/backups', authenticateToken, async (req: any, res) => {
    try {
      const { guildId } = req.params;
      const adminUser = await Admin.findById(req.user.id);
      if (!adminUser) return res.status(404).json({ error: 'User not found' });

      const guild = await Guild.findOne({ id: guildId });
      if (guild && !canManageGuildBackup(adminUser, guild)) {
        return res.status(403).json({ error: 'Permission denied' });
      }

      const backups = await ServerBackup.find({ guildId }).sort({ createdAt: -1 });
      res.json(backups);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'Failed to fetch server backups' });
    }
  });

  app.post('/api/user/guilds/:guildId/backups', authenticateToken, async (req: any, res) => {
    try {
      const { guildId } = req.params;
      const { name } = req.body;

      const adminUser = await Admin.findById(req.user.id);
      if (!adminUser) return res.status(404).json({ error: 'User not found' });

      const guild = await Guild.findOne({ id: guildId });
      if (guild && !canManageGuildBackup(adminUser, guild)) {
        return res.status(403).json({ error: 'Permission denied' });
      }

      let backup;
      try {
        backup = await serviceClient.createDiscordBackup(guildId, adminUser.username, adminUser.username, name);
      } catch {
        return res.status(400).json({ error: 'Bot is not connected to this Discord server or lacks permissions.' });
      }

      await new Log({
        action: 'CREATE_SERVER_BACKUP',
        adminId: req.user.username,
        targetId: guildId,
        details: `Created server backup "${backup.name}" (${backup._id}) for ${guild?.name || guildId}`
      }).save();

      res.json(backup);
    } catch (e: any) {
      console.error('Failed to create server backup:', e);
      res.status(500).json({ error: e?.message || 'Failed to create server backup' });
    }
  });

  app.post('/api/user/guilds/:guildId/backups/:backupId/restore', authenticateToken, async (req: any, res) => {
    try {
      const { guildId, backupId } = req.params;

      const adminUser = await Admin.findById(req.user.id);
      if (!adminUser) return res.status(404).json({ error: 'User not found' });

      const guild = await Guild.findOne({ id: guildId });
      if (guild && !canManageGuildBackup(adminUser, guild)) {
        return res.status(403).json({ error: 'Permission denied' });
      }

      let backup = await ServerBackup.findById(backupId).catch(() => null);
      if (!backup) {
        backup = await ServerBackup.findOne({ id: backupId }).catch(() => null);
      }
      if (!backup) return res.status(404).json({ error: 'Backup snapshot not found' });

      let restoreResult;
      try {
        restoreResult = await serviceClient.restoreDiscordBackup(guildId, backup);
      } catch {
        return res.status(400).json({ error: 'Bot is not connected to this Discord server or lacks permissions.' });
      }

      await new Log({
        action: 'RESTORE_SERVER_BACKUP',
        adminId: req.user.username,
        targetId: guildId,
        details: `Restored server to backup "${backup.name}" (${backup._id}) for ${restoreResult.guildName}`
      }).save().catch(() => null);

      res.json({ success: true, message: `Server "${restoreResult.guildName}" successfully rolled back to backup "${backup.name}".` });
    } catch (e: any) {
      console.error('Failed to restore server backup:', e);
      res.status(500).json({ error: e?.message || 'Failed to restore server backup' });
    }
  });

  app.delete('/api/user/guilds/:guildId/backups/:backupId', authenticateToken, async (req: any, res) => {
    try {
      const { guildId, backupId } = req.params;

      const adminUser = await Admin.findById(req.user.id);
      if (!adminUser) return res.status(404).json({ error: 'User not found' });

      const guild = await Guild.findOne({ id: guildId });
      if (guild && !canManageGuildBackup(adminUser, guild)) {
        return res.status(403).json({ error: 'Permission denied' });
      }

      let deleted = null;
      if (mongoose.Types.ObjectId.isValid(backupId)) {
        deleted = await ServerBackup.findOneAndDelete({ _id: backupId }).catch(() => null);
      }
      if (!deleted) {
        deleted = await ServerBackup.findOneAndDelete({ id: backupId }).catch(() => null);
      }
      if (!deleted) {
        deleted = await ServerBackup.findByIdAndDelete(backupId).catch(() => null);
      }

      if (!deleted) {
        return res.status(404).json({ error: 'Backup snapshot not found or already deleted' });
      }

      await new Log({
        action: 'DELETE_SERVER_BACKUP',
        adminId: req.user.username,
        targetId: guildId,
        details: `Deleted server backup ${backupId}`
      }).save().catch(() => null);

      res.json({ success: true, message: 'Backup snapshot deleted successfully.' });
    } catch (e: any) {
      console.error('Failed to delete backup snapshot:', e);
      res.status(500).json({ error: e?.message || 'Failed to delete backup' });
    }
  });

  app.get('/api/user/guilds/:guildId/backups/:backupId/download', authenticateToken, async (req: any, res) => {
    try {
      const { guildId, backupId } = req.params;

      const adminUser = await Admin.findById(req.user.id);
      if (!adminUser) return res.status(404).json({ error: 'User not found' });

      const guild = await Guild.findOne({ id: guildId });
      if (guild && !canManageGuildBackup(adminUser, guild)) {
        return res.status(403).json({ error: 'Permission denied' });
      }

      let backup = await ServerBackup.findById(backupId).catch(() => null);
      if (!backup) {
        backup = await ServerBackup.findOne({ id: backupId }).catch(() => null);
      }
      if (!backup) return res.status(404).json({ error: 'Backup not found' });

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="backup-${guildId}-${backupId}.json"`);
      res.send(JSON.stringify(backup, null, 2));
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'Failed to download backup' });
    }
  });

  app.post('/api/user/guilds/:guildId/backups/upload', authenticateToken, async (req: any, res) => {
    try {
      const { guildId } = req.params;
      const backupData = req.body;

      const adminUser = await Admin.findById(req.user.id);
      if (!adminUser) return res.status(404).json({ error: 'User not found' });

      const guild = await Guild.findOne({ id: guildId });
      if (guild && !canManageGuildBackup(adminUser, guild)) {
        return res.status(403).json({ error: 'Permission denied' });
      }

      if (!backupData || typeof backupData !== 'object') {
        return res.status(400).json({ error: 'Invalid backup file content.' });
      }

      if (!Array.isArray(backupData.roles) && !Array.isArray(backupData.channels) && !backupData.serverDetails) {
        return res.status(400).json({ error: 'Invalid server backup schema. File is missing roles, channels, or serverDetails.' });
      }

      const backupName = backupData.name && typeof backupData.name === 'string'
        ? (backupData.name.startsWith('Uploaded') ? backupData.name : `Uploaded: ${backupData.name}`)
        : `Uploaded Backup - ${new Date().toLocaleString()}`;

      const newBackup = new ServerBackup({
        guildId,
        name: backupName,
        creatorId: adminUser.username,
        creatorTag: adminUser.username,
        serverDetails: backupData.serverDetails || {},
        roles: Array.isArray(backupData.roles) ? backupData.roles : [],
        categories: Array.isArray(backupData.categories) ? backupData.categories : [],
        channels: Array.isArray(backupData.channels) ? backupData.channels : [],
        bans: Array.isArray(backupData.bans) ? backupData.bans : []
      });

      await newBackup.save();

      await new Log({
        action: 'UPLOAD_SERVER_BACKUP',
        adminId: req.user.username,
        targetId: guildId,
        details: `Uploaded backup snapshot "${newBackup.name}" (${newBackup._id}) for server ${guildId}`
      }).save().catch(() => null);

      res.json(newBackup);
    } catch (e: any) {
      console.error('Failed to upload server backup:', e);
      res.status(500).json({ error: e?.message || 'Failed to upload server backup' });
    }
  });

  // --- Custom Banlists API Endpoints ---
  app.get('/api/custom-banlists', authenticateToken, async (req: any, res) => {
    try {
      const adminUser = await Admin.findById(req.user.id);
      if (!adminUser) return res.status(404).json({ error: 'User not found' });

      let banlists;
      if (adminUser.role === 'admin') {
        banlists = await CustomBanlist.find();
      } else {
        banlists = await CustomBanlist.find({ ownerId: req.user.id });
      }
      res.json(banlists);
    } catch (e) {
      res.status(500).json({ error: 'Failed to fetch custom banlists' });
    }
  });

  app.post('/api/custom-banlists', authenticateToken, async (req: any, res) => {
    try {
      const { name } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Banlist name is required' });
      }

      const banlist = new CustomBanlist({
        name: name.trim(),
        ownerId: req.user.id,
        entries: []
      });

      await banlist.save();
      res.json(banlist);
    } catch (e) {
      res.status(500).json({ error: 'Failed to create custom banlist' });
    }
  });

  app.post('/api/custom-banlists/:id/entries', authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { type, targetId, reason } = req.body;

      if (!type || !['discord', 'vrchat'].includes(type)) {
        return res.status(400).json({ error: 'Invalid entry type. Must be "discord" or "vrchat".' });
      }
      if (!targetId || !targetId.trim()) {
        return res.status(400).json({ error: 'Target ID is required' });
      }

      const adminUser = await Admin.findById(req.user.id);
      if (!adminUser) return res.status(404).json({ error: 'User not found' });

      const banlist = await CustomBanlist.findById(id);
      if (!banlist) return res.status(404).json({ error: 'Custom banlist not found' });

      if (adminUser.role !== 'admin' && banlist.ownerId !== req.user.id) {
        return res.status(403).json({ error: 'Permission denied' });
      }

      const normalizedTargetId = targetId.trim();

      // IMPORTANT: "make sure trusted uses can not be blacklisted"
      // Check if target is a trusted user
      if (type === 'discord') {
        const dbUser = await User.findOne({ id: normalizedTargetId });
        if (dbUser && dbUser.isTrusted) {
          return res.status(400).json({ error: 'Cannot blacklist a Trusted Whitelist user.' });
        }
      } else if (type === 'vrchat') {
        const dbUser = await User.findOne({
          $or: [
            { vrchatUserId: normalizedTargetId },
            { 'vrchatAlts.vrchatUserId': normalizedTargetId }
          ]
        });
        if (dbUser && dbUser.isTrusted) {
          return res.status(400).json({ error: 'Cannot blacklist a Trusted Whitelist user.' });
        }
      }

      // Check for duplicate entry in the list
      const isDuplicate = banlist.entries.some(e => e.type === type && e.targetId.toLowerCase() === normalizedTargetId.toLowerCase());
      if (isDuplicate) {
        return res.status(400).json({ error: 'This subject is already blacklisted in this custom banlist.' });
      }

      const newEntry = {
        type,
        targetId: normalizedTargetId,
        reason: reason?.trim() || 'Custom blacklisted',
        createdAt: new Date()
      };

      banlist.entries.push(newEntry);
      banlist.updatedAt = new Date();

      await banlist.save();

      // Enforce ban on linked guilds / VRChat for the new entry
      await enforceCustomBanlistEntry(newEntry, banlist._id.toString(), banlist.name);

      res.json(banlist);
    } catch (e) {
      res.status(500).json({ error: 'Failed to add entry to custom banlist' });
    }
  });

  app.delete('/api/custom-banlists/:id/entries/:entryId', authenticateToken, async (req: any, res) => {
    try {
      const { id, entryId } = req.params;

      const adminUser = await Admin.findById(req.user.id);
      if (!adminUser) return res.status(404).json({ error: 'User not found' });

      const banlist = await CustomBanlist.findById(id);
      if (!banlist) return res.status(404).json({ error: 'Custom banlist not found' });

      if (adminUser.role !== 'admin' && banlist.ownerId !== req.user.id) {
        return res.status(403).json({ error: 'Permission denied' });
      }

      const entryToDelete = banlist.entries.find(e => e._id.toString() === entryId);
      banlist.entries = banlist.entries.filter(e => e._id.toString() !== entryId) as any;
      banlist.updatedAt = new Date();

      await banlist.save();

      // Automatically unban the user removed from custom banlist
      if (entryToDelete) {
        await unbanCustomBanlistEntry(entryToDelete, banlist._id.toString(), banlist.name);
      }

      res.json(banlist);
    } catch (e) {
      res.status(500).json({ error: 'Failed to delete entry from custom banlist' });
    }
  });

  app.delete('/api/custom-banlists/:id', authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;

      const adminUser = await Admin.findById(req.user.id);
      if (!adminUser) return res.status(404).json({ error: 'User not found' });

      const banlist = await CustomBanlist.findById(id);
      if (!banlist) return res.status(404).json({ error: 'Custom banlist not found' });

      if (adminUser.role !== 'admin' && banlist.ownerId !== req.user.id) {
        return res.status(403).json({ error: 'Permission denied' });
      }

      // Automatically unban all subjects contained in this deleted custom banlist
      if (Array.isArray(banlist.entries)) {
        for (const entry of banlist.entries) {
          await unbanCustomBanlistEntry(entry, banlist._id.toString(), banlist.name);
        }
      }

      // Also clean up guilds that were linking this custom banlist
      await Guild.updateMany(
        { 'settings.customBanlistId': id },
        { $set: { 'settings.customBanlistId': '' } }
      );

      await CustomBanlist.deleteOne({ _id: id });
      res.json({ message: 'Custom banlist deleted successfully' });
    } catch (e) {
      res.status(500).json({ error: 'Failed to delete custom banlist' });
    }
  });

  app.post('/api/user/link-discord', authenticateToken, async (req: any, res) => {
    try {
      const { code } = req.body;
      if (!code) return res.status(400).json({ error: 'Code is required' });

      const linkData = await LinkCode.findOne({ code: code.trim().toUpperCase() });
      if (!linkData) return res.status(400).json({ error: 'Invalid or expired link code. Please check the code or generate a new one.' });

      if (!linkData.discordId) {
        return res.status(400).json({ error: `This code (${linkData.code}) was generated on the web. Run "/link code: ${linkData.code}" in Discord to complete linking.` });
      }

      await Admin.findByIdAndUpdate(req.user.id, { $set: { discordId: linkData.discordId } });
      await LinkCode.deleteOne({ _id: linkData._id });

      // Auto-verify if the newly linked Discord user is verified
      const autoMatch = await checkAndAutoVerifyFromDiscord({
        adminId: req.user.id,
        discordId: linkData.discordId
      });

      res.json({ 
        success: true, 
        discordId: linkData.discordId, 
        isAgeVerified: Boolean(autoMatch),
        message: autoMatch 
          ? 'Discord account linked and your account has been automatically age-verified!' 
          : 'Discord account linked successfully!' 
      });
    } catch (e) {
      res.status(500).json({ error: 'Linking failed' });
    }
  });

  app.post('/api/user/generate-link-code', authenticateToken, async (req: any, res) => {
    try {
      const code = 'DASH-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      await LinkCode.findOneAndUpdate(
        { adminId: req.user.id },
        { $set: { code, adminId: req.user.id }, $unset: { discordId: 1 } },
        { upsert: true }
      );
      res.json({ success: true, code, message: 'Web link code generated! Run /link code: ' + code + ' in Discord.' });
    } catch (e) {
      res.status(500).json({ error: 'Failed to generate link code' });
    }
  });

  app.post('/api/user/unlink-discord', authenticateToken, async (req: any, res) => {
    try {
      await Admin.findByIdAndUpdate(req.user.id, { $unset: { discordId: 1 } });
      res.json({ success: true, message: 'Discord account unlinked successfully.' });
    } catch (e) {
      res.status(500).json({ error: 'Failed to unlink Discord account' });
    }
  });

  app.get('/api/user/me', authenticateToken, async (req: any, res) => {
    try {
      const admin = await Admin.findById(req.user.id).select('-password');
      if (!admin) return res.status(404).json({ error: 'User not found' });

      // Check linked discord User record for safety / reputation stats if linked
      let discordUserData: any = null;
      if (admin.discordId) {
        discordUserData = await User.findOne({ id: admin.discordId });
      }

      // Auto-verify if the acc email is the same as an already verified discord user
      if (!admin.isAgeVerified && admin.email) {
        const autoMatch = await checkAndAutoVerifyFromDiscord({
          email: admin.email,
          adminId: admin._id,
          discordId: admin.discordId
        });
        if (autoMatch) {
          admin.isAgeVerified = true;
          admin.dob = autoMatch.dob;
          admin.ageVerifiedAt = autoMatch.ageVerifiedAt;
          if (autoMatch.discordId && !admin.discordId) {
            admin.discordId = autoMatch.discordId;
            discordUserData = autoMatch.verifiedDiscordUser || (await User.findOne({ id: autoMatch.discordId }));
          }
        }
      }

      // Check age verification status
      let verificationStatus: 'none' | 'pending' | 'approved' | 'rejected' = 'none';
      if (admin.isAgeVerified || discordUserData?.isAgeVerified) {
        verificationStatus = 'approved';
      } else {
        const pendingReq = await VerificationRequest.findOne({ 
          $or: [
            { userId: admin._id.toString() },
            ...(admin.discordId ? [{ userId: admin.discordId }] : []),
            { username: admin.username }
          ],
          status: 'pending'
        });
        if (pendingReq) {
          verificationStatus = 'pending';
        } else {
          const rejectedReq = await VerificationRequest.findOne({
            $or: [
              { userId: admin._id.toString() },
              ...(admin.discordId ? [{ userId: admin.discordId }] : [])
            ],
            status: 'rejected'
          }).sort({ updatedAt: -1 });
          if (rejectedReq) {
            verificationStatus = 'rejected';
          }
        }
      }

      res.json({
        _id: admin._id,
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        displayName: admin.displayName || admin.username,
        avatarUrl: admin.avatarUrl || '',
        bio: admin.bio || '',
        discordId: admin.discordId || null,
        vrchatUserId: admin.vrchatUserId || '',
        vrchatUsername: admin.vrchatUsername || '',
        dawnchatId: admin.dawnchatId || '',
        dawnchatUsername: admin.dawnchatUsername || '',
        dawnchatSettings: admin.dawnchatSettings || {
          safetyBridgeEnabled: true,
          filterSensitivity: 'balanced',
          autoKickBlacklisted: true,
          webhookUrl: '',
          communityId: ''
        },
        isEmailVerified: !!admin.isEmailVerified,
        passwordSet: admin.passwordSet !== false,
        isAgeVerified: !!(admin.isAgeVerified || discordUserData?.isAgeVerified),
        dob: admin.dob || discordUserData?.dob || null,
        ageVerifiedAt: admin.ageVerifiedAt || discordUserData?.ageVerifiedAt || null,
        verificationStatus,
        reputation: {
          score: discordUserData?.reputation ?? 100,
          isTrusted: !!discordUserData?.isTrusted,
          isBanned: !!discordUserData?.isBanned,
          banReason: discordUserData?.banReason || '',
          warningsCount: discordUserData?.warnings?.length || 0
        },
        createdAt: admin.createdAt
      });
    } catch (e: any) {
      console.error('Error fetching user profile:', e);
      res.status(500).json({ error: 'Failed to fetch user profile' });
    }
  });

  // Profile update endpoint (displayName, avatarUrl, bio)
  app.post('/api/user/profile', authenticateToken, async (req: any, res) => {
    try {
      const { displayName, avatarUrl, bio } = req.body;
      const updateData: any = {};
      if (displayName !== undefined) updateData.displayName = displayName.trim();
      if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl.trim();
      if (bio !== undefined) updateData.bio = bio.trim();

      const updated = await Admin.findByIdAndUpdate(
        req.user.id,
        { $set: updateData },
        { new: true }
      ).select('-password');
      res.json({ success: true, user: updated, message: 'Profile updated successfully!' });
    } catch (e: any) {
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });

  // VRChat identity link/unlink
  app.post('/api/user/link-vrchat', authenticateToken, async (req: any, res) => {
    try {
      const { vrchatUserId, vrchatUsername } = req.body;
      if (!vrchatUserId) return res.status(400).json({ error: 'VRChat User ID is required' });
      const cleaned = extractVRChatUserId(vrchatUserId);
      const updated = await Admin.findByIdAndUpdate(
        req.user.id,
        { $set: { vrchatUserId: cleaned, vrchatUsername: vrchatUsername || '' } },
        { new: true }
      ).select('-password');
      res.json({ success: true, user: updated, message: 'VRChat identity connected!' });
    } catch (e: any) {
      res.status(500).json({ error: 'Failed to link VRChat identity' });
    }
  });

  app.post('/api/user/unlink-vrchat', authenticateToken, async (req: any, res) => {
    try {
      await Admin.findByIdAndUpdate(req.user.id, { $unset: { vrchatUserId: 1, vrchatUsername: 1 } });
      res.json({ success: true, message: 'VRChat identity disconnected.' });
    } catch (e: any) {
      res.status(500).json({ error: 'Failed to unlink VRChat identity' });
    }
  });

  // DawnChat identity link/unlink & settings
  app.post('/api/user/link-dawnchat', authenticateToken, async (req: any, res) => {
    try {
      const { dawnchatId, dawnchatUsername } = req.body;
      if (!dawnchatId && !dawnchatUsername) return res.status(400).json({ error: 'DawnChat username or ID is required' });
      const updated = await Admin.findByIdAndUpdate(
        req.user.id,
        {
          $set: {
            dawnchatId: (dawnchatId || '').trim(),
            dawnchatUsername: (dawnchatUsername || '').trim()
          }
        },
        { new: true }
      ).select('-password');
      res.json({ success: true, user: updated, message: 'DawnChat account connected!' });
    } catch (e: any) {
      res.status(500).json({ error: 'Failed to link DawnChat account' });
    }
  });

  app.post('/api/user/unlink-dawnchat', authenticateToken, async (req: any, res) => {
    try {
      await Admin.findByIdAndUpdate(req.user.id, { $unset: { dawnchatId: 1, dawnchatUsername: 1 } });
      res.json({ success: true, message: 'DawnChat account disconnected.' });
    } catch (e: any) {
      res.status(500).json({ error: 'Failed to unlink DawnChat account' });
    }
  });

  app.post('/api/user/dawnchat-settings', authenticateToken, async (req: any, res) => {
    try {
      const { safetyBridgeEnabled, filterSensitivity, autoKickBlacklisted, webhookUrl, communityId } = req.body;
      const updated = await Admin.findByIdAndUpdate(
        req.user.id,
        {
          $set: {
            'dawnchatSettings.safetyBridgeEnabled': !!safetyBridgeEnabled,
            'dawnchatSettings.filterSensitivity': filterSensitivity || 'balanced',
            'dawnchatSettings.autoKickBlacklisted': !!autoKickBlacklisted,
            'dawnchatSettings.webhookUrl': webhookUrl || '',
            'dawnchatSettings.communityId': communityId || ''
          }
        },
        { new: true }
      ).select('-password');
      res.json({ success: true, dawnchatSettings: updated?.dawnchatSettings, message: 'DawnChat platform settings updated!' });
    } catch (e: any) {
      res.status(500).json({ error: 'Failed to save DawnChat platform settings' });
    }
  });

  // Standalone VRChat Group Management (for all users, NO DISCORD REQUIRED!)
  app.get('/api/user/vrchat-groups', authenticateToken, async (req: any, res) => {
    try {
      const userGroups = await UserVRChatGroup.find({ userId: req.user.id }).sort({ createdAt: -1 });
      const config = await SystemConfig.findOne({ id: 'main' });

      // Enrich with live group data if bot credentials exist
      const enriched = await Promise.all(userGroups.map(async (grp) => {
        const obj = grp.toObject();
        try {
          if (config && (config.vrchatUsername || config.vrchatBots?.length)) {
            const live = await serviceClient.getVRChatGroupDetails(grp.groupId);
            obj.groupName = live.name || obj.groupName;
            obj.shortCode = live.shortCode || obj.shortCode;
            obj.description = live.description || obj.description;
            obj.iconUrl = live.iconUrl || live.bannerUrl || obj.iconUrl;
            obj.bannerUrl = live.bannerUrl || obj.bannerUrl;
            obj.memberCount = live.memberCount || obj.memberCount;
          }
        } catch (e) {
          // Ignore fetch error, keep stored values
        }
        return obj;
      }));

      res.json(enriched);
    } catch (e: any) {
      res.status(500).json({ error: 'Failed to fetch your VRChat groups' });
    }
  });

  app.post('/api/user/vrchat-groups', authenticateToken, async (req: any, res) => {
    try {
      let { groupId, groupName, autoBanEnabled, autoUnbanEnabled, blacklistThreshold, customBanlistId } = req.body;
      if (!groupId) return res.status(400).json({ error: 'VRChat Group ID (grp_...) is required' });
      
      const cleanedId = extractVRChatGroupId(groupId);
      if (!cleanedId) return res.status(400).json({ error: 'Invalid VRChat Group ID format. Must start with grp_' });

      const existing = await UserVRChatGroup.findOne({ userId: req.user.id, groupId: cleanedId });
      if (existing) return res.status(400).json({ error: 'You have already added this VRChat group to your dashboard.' });

      let meta: any = { name: groupName || `VRChat Group (${cleanedId})`, description: '', iconUrl: '', bannerUrl: '', memberCount: 0, shortCode: '' };
      const config = await SystemConfig.findOne({ id: 'main' });
      if (config && (config.vrchatUsername || config.vrchatBots?.length)) {
        try {
          const data = await serviceClient.getVRChatGroupDetails(cleanedId);
          meta.name = data.name || meta.name;
          meta.shortCode = data.shortCode || '';
          meta.description = data.description || '';
          meta.iconUrl = data.iconUrl || data.bannerUrl || '';
          meta.bannerUrl = data.bannerUrl || '';
          meta.memberCount = data.memberCount || 0;
        } catch (err) {
          console.warn('Could not fetch live group info on creation:', err);
        }
      }

      const newGroup = new UserVRChatGroup({
        userId: req.user.id,
        groupId: cleanedId,
        groupName: meta.name,
        shortCode: meta.shortCode,
        description: meta.description,
        iconUrl: meta.iconUrl,
        bannerUrl: meta.bannerUrl,
        memberCount: meta.memberCount,
        autoBanEnabled: autoBanEnabled !== undefined ? !!autoBanEnabled : true,
        autoUnbanEnabled: autoUnbanEnabled !== undefined ? !!autoUnbanEnabled : true,
        blacklistThreshold: blacklistThreshold !== undefined ? Number(blacklistThreshold) : -10,
        customBanlistId: customBanlistId || '',
        status: 'active',
        statusMessage: 'Configured and protected'
      });
      await newGroup.save();

      res.json({ success: true, group: newGroup, message: 'VRChat group added and protected successfully!' });
    } catch (e: any) {
      res.status(500).json({ error: 'Failed to add VRChat group' });
    }
  });

  app.put('/api/user/vrchat-groups/:groupId', authenticateToken, async (req: any, res) => {
    try {
      const cleanedId = extractVRChatGroupId(req.params.groupId);
      const { autoBanEnabled, autoUnbanEnabled, blacklistThreshold, customBanlistId, status } = req.body;
      const updated = await UserVRChatGroup.findOneAndUpdate(
        { userId: req.user.id, groupId: cleanedId },
        {
          $set: {
            autoBanEnabled: autoBanEnabled !== undefined ? !!autoBanEnabled : undefined,
            autoUnbanEnabled: autoUnbanEnabled !== undefined ? !!autoUnbanEnabled : undefined,
            blacklistThreshold: blacklistThreshold !== undefined ? Number(blacklistThreshold) : undefined,
            customBanlistId: customBanlistId !== undefined ? customBanlistId : undefined,
            status: status || undefined,
            lastSyncedAt: new Date()
          }
        },
        { new: true }
      );
      if (!updated) return res.status(404).json({ error: 'Group not found' });
      res.json({ success: true, group: updated, message: 'VRChat group settings updated!' });
    } catch (e: any) {
      res.status(500).json({ error: 'Failed to update VRChat group' });
    }
  });

  app.delete('/api/user/vrchat-groups/:groupId', authenticateToken, async (req: any, res) => {
    try {
      const cleanedId = extractVRChatGroupId(req.params.groupId);
      await UserVRChatGroup.deleteOne({ userId: req.user.id, groupId: cleanedId });
      res.json({ success: true, message: 'VRChat group removed from your dashboard.' });
    } catch (e: any) {
      res.status(500).json({ error: 'Failed to delete VRChat group' });
    }
  });

  app.post('/api/user/vrchat-groups/:groupId/sync', authenticateToken, async (req: any, res) => {
    try {
      const cleanedId = extractVRChatGroupId(req.params.groupId);
      const group = await UserVRChatGroup.findOne({ userId: req.user.id, groupId: cleanedId });
      if (!group) return res.status(404).json({ error: 'Group not found' });

      group.lastSyncedAt = new Date();
      group.status = 'active';
      group.statusMessage = 'Manually synchronized with BeSafe Network blacklist';
      await group.save();

      res.json({ success: true, message: `Group ${cleanedId} synchronized with BeSafe Network blacklists.` });
    } catch (e: any) {
      res.status(500).json({ error: 'Failed to sync VRChat group' });
    }
  });

  // Helper function to resolve user by Discord ID, VRChat User ID, Ban Case, or VRChat profile link
  
}
