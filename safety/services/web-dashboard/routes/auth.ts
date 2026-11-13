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
import { invalidateMailConfigCache, sendTestEmail } from '../../shared/email';

export function registerAuthRoutes(app: express.Express, context: any) {
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
  banUserFromVRChatGroup,
  unbanUserFromVRChatGroup,
  getGuildDiscordClient,
  leaveVRChatGroupIfOrphaned,
  syncCustomBotForGuild,
  downloadImageForScan,
  scanImageBufferWithNsfwjs,
  customBotsMap,
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

  const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character] || character);

  const sendDiscordAuthResult = (res: express.Response, options: { token?: string; error?: string; title?: string; message?: string }) => {
    const title = options.title || (options.token ? 'Discord Login Successful' : 'Discord Login Failed');
    const message = options.message || options.error || (options.token ? 'Signing you in to BeSafe Network...' : 'Unable to complete Discord login.');
    const script = options.token
      ? `<script>
          try {
            localStorage.setItem('gg_token', ${JSON.stringify(options.token)});
            localStorage.setItem('adminToken', ${JSON.stringify(options.token)});
          } catch (e) {}
          window.location.replace('/dashboard');
        </script>`
      : '';

    res.status(options.error ? 400 : 200).type('html').send(`<!doctype html>
<html>
  <head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head>
  <body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#09090b;color:#fafafa;font-family:monospace;">
    <main style="max-width:28rem;padding:2rem;text-align:center;">
      <h1 style="font-size:1.5rem;text-transform:uppercase;letter-spacing:.08em;">${escapeHtml(title)}</h1>
      <p style="color:#a1a1aa;line-height:1.6;">${escapeHtml(message)}</p>
      ${options.error ? '<p><a href="/dashboard" style="color:#818cf8;">Return to dashboard</a></p>' : ''}
    </main>
    ${script}
  </body>
</html>`);
  };

  const discordOAuthRedirectUri = (req: express.Request) => (
    process.env.DISCORD_OAUTH_REDIRECT_URI || `${getBaseUrl(req)}/api/auth/discord/callback`
  ).trim();

  const generateUniqueUsername = async (preferred: string, discordId: string) => {
    const sanitize = (value: string) => value
      .toLowerCase()
      .replace(/[^a-z0-9_.-]/g, '')
      .replace(/^[._-]+|[._-]+$/g, '')
      .slice(0, 24);
    const base = sanitize(preferred) || `user-${discordId.slice(-6)}`;

    for (let i = 0; i < 20; i++) {
      const candidate = `${base}${i === 0 ? '' : `-${cryptoNode.randomBytes(2).toString('hex')}`}`;
      const exists = await Admin.exists({ username: candidate });
      if (!exists) return candidate;
    }
    return `user-${discordId}-${Date.now().toString(36)}`.slice(0, 40);
  };

// --- API Routes ---

  // Admin Auth Routes
  app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username or email and password required' });

    const identifier = String(username).trim();
    const adminUser = await Admin.findOne(identifier.includes('@')
      ? { email: identifier.toLowerCase() }
      : { username: identifier });
    if (!adminUser) return res.status(401).json({ error: 'Invalid credentials' });

    const validPassword = await bcrypt.compare(password, adminUser.password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

    if (adminUser.isBanned) {
      return res.status(403).json({
        error: `Your account has been blocked by an administrator.${adminUser.banReason ? ` Reason: ${adminUser.banReason}` : ''}`,
        isBanned: true,
        banReason: adminUser.banReason || ''
      });
    }

    // Auto-verify age if the account email matches an already age-verified Discord user
    if (!adminUser.isAgeVerified && adminUser.email) {
      const match = await checkAndAutoVerifyFromDiscord({
        email: adminUser.email,
        adminId: adminUser._id,
        discordId: adminUser.discordId
      });
      if (match) {
        adminUser.isAgeVerified = true;
        adminUser.dob = match.dob;
        adminUser.ageVerifiedAt = match.ageVerifiedAt;
        if (match.discordId && !adminUser.discordId) {
          adminUser.discordId = match.discordId;
        }
        await adminUser.save();
      }
    }

    const token = jwt.sign({ id: adminUser._id, username: adminUser.username, role: adminUser.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '24h' });
    res.json({ token, username: adminUser.username, role: adminUser.role, isAgeVerified: adminUser.isAgeVerified });
  });

  app.post('/api/auth/register', async (_req, res) => {
    res.status(403).json({
      error: 'New account registration is disabled. Please create an account with Discord.'
    });
  });

  app.post('/api/auth/password', authenticateToken, async (req: any, res: any) => {
    try {
      const password = typeof req.body?.password === 'string' ? req.body.password : '';
      const currentPassword = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '';
      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
      }

      const adminUser = await Admin.findById(req.user.id);
      if (!adminUser) return res.status(404).json({ error: 'Account not found' });

      if (adminUser.passwordSet !== false) {
        if (!currentPassword) {
          return res.status(400).json({ error: 'Current password is required to change your password.' });
        }
        const validPassword = await bcrypt.compare(currentPassword, adminUser.password);
        if (!validPassword) return res.status(401).json({ error: 'Current password is incorrect.' });
      }

      adminUser.password = await bcrypt.hash(password, 10);
      adminUser.passwordSet = true;
      await adminUser.save();

      res.json({ success: true, passwordSet: true });
    } catch (error) {
      console.error('Password update error:', error);
      res.status(500).json({ error: 'Failed to update password' });
    }
  });

  app.get('/api/auth/discord', (req, res) => {
    const clientId = process.env.DISCORD_CLIENT_ID;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return sendDiscordAuthResult(res, {
        error: 'Discord login is not configured. Set DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET.'
      });
    }

    const state = jwt.sign(
      { purpose: 'discord-oauth', nonce: cryptoNode.randomBytes(16).toString('hex') },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '10m' }
    );
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: discordOAuthRedirectUri(req),
      response_type: 'code',
      scope: 'identify email',
      state
    });

    res.redirect(`https://discord.com/api/oauth2/authorize?${params.toString()}`);
  });

  app.get('/api/auth/discord/callback', async (req, res) => {
    try {
      const { code, state, error } = req.query;
      if (error) {
        return sendDiscordAuthResult(res, {
          error: `Discord login was cancelled or denied (${String(error)}).`
        });
      }
      if (!code || !state) {
        return sendDiscordAuthResult(res, { error: 'Discord login callback is missing required parameters.' });
      }

      const clientId = process.env.DISCORD_CLIENT_ID;
      const clientSecret = process.env.DISCORD_CLIENT_SECRET;
      if (!clientId || !clientSecret) {
        return sendDiscordAuthResult(res, {
          error: 'Discord login is not configured. Set DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET.'
        });
      }

      const jwtSecret = process.env.JWT_SECRET || 'secret';
      const statePayload: any = jwt.verify(String(state), jwtSecret);
      if (statePayload?.purpose !== 'discord-oauth') {
        return sendDiscordAuthResult(res, { error: 'Invalid Discord login state.' });
      }

      const tokenResponse = await axios.post(
        'https://discord.com/api/oauth2/token',
        new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'authorization_code',
          code: String(code),
          redirect_uri: discordOAuthRedirectUri(req)
        }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      const accessToken = tokenResponse.data?.access_token;
      if (!accessToken) throw new Error('Discord did not return an access token');

      const discordResponse = await axios.get('https://discord.com/api/users/@me', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const discordUser = discordResponse.data || {};
      const discordId = String(discordUser.id || '').trim();
      if (!discordId) throw new Error('Discord profile did not include a user ID');

      const discordEmailVerified = Boolean(discordUser.verified);
      const discordEmail = discordEmailVerified && typeof discordUser.email === 'string'
        ? discordUser.email.trim().toLowerCase()
        : '';
      const avatarUrl = discordUser.avatar
        ? `https://cdn.discordapp.com/avatars/${discordId}/${discordUser.avatar}.png?size=256`
        : `https://cdn.discordapp.com/embed/avatars/${Number(discordUser.discriminator || 0) % 5}.png`;
      const displayName = discordUser.global_name || discordUser.username || `Discord User ${discordId}`;

      let adminUser = await Admin.findOne({ discordId });
      if (!adminUser && discordEmail) {
        adminUser = await Admin.findOne({ email: discordEmail });
        if (adminUser?.discordId && adminUser.discordId !== discordId) {
          return sendDiscordAuthResult(res, {
            error: 'This Discord email is already linked to a different Discord account.'
          });
        }
      }

      const isNewAccount = !adminUser;
      if (adminUser) {
        if (!adminUser.discordId) adminUser.discordId = discordId;
        if (discordEmail && (!adminUser.email || adminUser.email === discordEmail)) {
          adminUser.email = discordEmail;
          adminUser.isEmailVerified = true;
        }
        if (!adminUser.avatarUrl) adminUser.avatarUrl = avatarUrl;
        if (!adminUser.displayName) adminUser.displayName = displayName;
        await adminUser.save();
      } else {
        const username = await generateUniqueUsername(discordUser.username || discordUser.global_name || '', discordId);
        adminUser = new Admin({
          username,
          email: discordEmail,
          password: await bcrypt.hash(cryptoNode.randomBytes(32).toString('hex'), 10),
          passwordSet: false,
          role: 'user',
          displayName,
          avatarUrl,
          discordId,
          isEmailVerified: true
        });
        await adminUser.save();
      }

      if (!adminUser.isAgeVerified) {
        const autoMatch = await checkAndAutoVerifyFromDiscord({
          email: adminUser.email || discordEmail || undefined,
          adminId: adminUser._id,
          discordId
        });
        if (autoMatch) {
          adminUser = await Admin.findById(adminUser._id) || adminUser;
        }
      }

      const token = jwt.sign(
        { id: adminUser._id, username: adminUser.username, role: adminUser.role },
        jwtSecret,
        { expiresIn: '24h' }
      );

      return sendDiscordAuthResult(res, {
        token,
        title: isNewAccount ? 'Discord Account Created' : 'Discord Login Successful',
        message: isNewAccount
          ? 'Your BeSafe Network account was created. Please add a dashboard password to secure email login.'
          : 'Signing you in to BeSafe Network...'
      });
    } catch (error: any) {
      console.error('Discord OAuth callback error:', error?.response?.data || error);
      return sendDiscordAuthResult(res, { error: 'Discord login failed. Please try again.' });
    }
  });

  app.get('/api/auth/verify-email', async (_req, res) => {
    res.status(403).json({ error: 'Email verification is disabled.' });
  });

  app.post('/api/auth/resend-verification', async (_req, res) => {
    res.status(403).json({ error: 'Email verification is disabled.' });
  });

  app.post('/api/auth/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const cleanEmail = String(email).trim().toLowerCase();
    const admin = await Admin.findOne({ email: cleanEmail });
    if (!admin) return res.status(404).json({ error: 'No account with that email' });

    const token = cryptoNode.randomBytes(20).toString('hex');
    admin.resetPasswordToken = token;
    admin.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await admin.save();

    const baseUrl = getBaseUrl(req);
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;
    const emailData = EmailTemplates.getPasswordResetEmail(resetUrl);
    await sendMail(cleanEmail, emailData.subject, emailData.text, emailData.html);

    res.json({ success: true, message: 'Password reset link sent to your email.' });
  });

  app.post('/api/auth/reset-password', async (req, res) => {
    const { token, password } = req.body;
    const admin = await Admin.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!admin) return res.status(400).json({ error: 'Password reset token is invalid or has expired.' });

    admin.password = await bcrypt.hash(password, 10);
    admin.resetPasswordToken = undefined;
    admin.resetPasswordExpires = undefined;
    await admin.save();

    res.json({ success: true });
  });

  // Public report endpoint
  app.post('/api/public/report', async (req, res) => {
    try {
      const { targetUserId, targetDisplayName, reporterUserId, reporterEmail, reason, evidenceLinks, vrchatAccount, attachments } = req.body;
      if (!targetUserId || !reporterUserId || !reporterEmail || !reason) {
        return res.status(400).json({ error: 'Missing required report fields' });
      }

      const cleanedVrchat = extractVRChatUserId(vrchatAccount || "");
      const report = new Report({
        targetUserId,
        reporterUserId,
        reporterEmail,
        reason,
        evidenceLinks: Array.isArray(evidenceLinks) ? evidenceLinks.filter(Boolean) : [],
        attachments: Array.isArray(attachments) ? attachments.filter(Boolean) : [],
        vrchatAccount: cleanedVrchat
      });
      await safeSaveReport(report);

      await notifyAdmins('New Subject Report', `A new safety report has been filed against ${targetDisplayName || targetUserId} (${targetUserId}) by ${reporterUserId}.${cleanedVrchat ? ` Connected VRChat Account ID: ${cleanedVrchat}` : ''}`);

      res.json({ success: true, reportId: report._id });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to submit report' });
    }
  });

  // Initial admin setup (only if no admins exist)
  app.post('/api/auth/setup', async (req, res) => {
    const count = await Admin.countDocuments({ role: 'admin' });
    if (count > 0) return res.status(403).json({ error: 'Setup already completed' });

    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = new Admin({ 
      username, 
      password: hashedPassword, 
      role: 'admin', 
      email: 'admin@besafe.network',
      isEmailVerified: true 
    });
    await newAdmin.save();
    res.json({ success: true });
  });

  // Age Verification Routes (Handles direct website submissions, Discord submissions, and instant auto-verify)
  app.post('/api/verify/auto-check', async (req: any, res: any) => {
    try {
      let email = req.body?.email || req.body?.mail;
      let discordId = req.body?.discordId || req.body?.userId;
      let adminId: string | null = null;

      // Check if user is logged in
      const authHeader = req.headers['authorization'];
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.split(' ')[1];
          const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
          if (decoded && decoded.id) {
            adminId = decoded.id;
            const adminUser = await Admin.findById(adminId);
            if (adminUser) {
              if (!email && adminUser.email) email = adminUser.email;
              if (!discordId && adminUser.discordId) discordId = adminUser.discordId;
            }
          }
        } catch (e) {}
      }

      if (!email && !discordId) {
        return res.status(400).json({ error: 'Please provide an email address or Discord ID to check.' });
      }

      const match = await checkAndAutoVerifyFromDiscord({ email, adminId, discordId });
      if (match) {
        return res.json({
          success: true,
          verified: true,
          autoVerified: true,
          email: match.email,
          discordId: match.discordId,
          dob: match.dob ? match.dob.toISOString().split('T')[0] : null,
          message: 'Account verified! Your account email matches an already verified Discord user.'
        });
      }

      return res.json({
        success: false,
        verified: false,
        autoVerified: false,
        message: 'No verified Discord user was found with that email address. Please submit your verification documents below.'
      });
    } catch (e) {
      console.error('Auto-check error:', e);
      return res.status(500).json({ error: 'Auto-verification check failed' });
    }
  });

  app.post('/api/verify/request', async (req: any, res: any) => {
    try {
      let { userId, username, email, idPhoto, facePhoto, dob, source } = req.body;
      let adminUser: any = null;

      // Check if user is logged into the web dashboard
      const authHeader = req.headers['authorization'];
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.split(' ')[1];
          const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
          if (decoded && decoded.id) {
            adminUser = await Admin.findById(decoded.id);
            if (adminUser) {
              userId = userId || adminUser.discordId || adminUser._id.toString();
              username = username || adminUser.displayName || adminUser.username;
              email = email || adminUser.email;
              source = source || 'web';
            }
          }
        } catch (e) {
          // Token expired or invalid, fallback to body params
        }
      }

      // 1. Auto-verify check: If email matches an already verified Discord user, approve instantly!
      const candidateEmail = (email || '').trim().toLowerCase();
      if (candidateEmail || userId) {
        const autoMatch = await checkAndAutoVerifyFromDiscord({
          email: candidateEmail || undefined,
          adminId: adminUser?._id,
          discordId: userId
        });

        if (autoMatch) {
          const matchedDob = autoMatch.dob || (dob ? new Date(dob) : new Date('2000-01-01'));
          const request = new VerificationRequest({
            userId: String(userId || autoMatch.discordId || 'web').trim(),
            username: username || adminUser?.username || '',
            email: candidateEmail || autoMatch.email || '',
            source: source || 'web',
            idPhoto: idPhoto || 'auto-verified-discord-match',
            facePhoto: facePhoto || 'auto-verified-discord-match',
            dob: matchedDob,
            status: 'approved',
            adminNotes: 'Auto-verified: email matches already verified Discord user'
          });
          await request.save();

          await notifyAdmins('Age Verification Auto-Verified', `User ${username || userId} (${candidateEmail || 'No email'}) was automatically age-verified because their email matches an already verified Discord user.`);

          return res.json({ 
            success: true, 
            autoVerified: true, 
            message: 'Instant Verification! Your account has been automatically verified because your email matches an already verified Discord user.' 
          });
        }
      }

      if (!userId || !idPhoto || !facePhoto || !dob) {
        return res.status(400).json({ error: 'Missing required fields: ID document photo, face selfie photo, and Date of Birth are required.' });
      }

      // Check if there is already a pending request for this user ID or username
      const existing = await VerificationRequest.findOne({ 
        $or: [
          { userId, status: 'pending' },
          ...(username ? [{ username, status: 'pending' }] : [])
        ]
      });
      if (existing) {
        return res.status(400).json({ error: 'An age verification request is already pending review for your account.' });
      }

      const request = new VerificationRequest({
        userId: String(userId).trim(),
        username: username || '',
        email: candidateEmail || '',
        source: source || 'web',
        idPhoto,
        facePhoto,
        dob: new Date(dob)
      });
      await request.save();

      await notifyAdmins('New Age Verification Request', `A new verification request has been submitted by ${username ? `${username} (${userId})` : userId} via ${source || 'web'}.`);

      res.json({ success: true, message: 'Age verification documents submitted successfully! Our staff will review your request.' });
    } catch (error) {
      console.error('Failed to submit verification request:', error);
      res.status(500).json({ error: 'Failed to submit verification request' });
    }
  });

  app.get('/api/admin/config', authenticateToken, isAdmin, async (req, res) => {
    const config = await SystemConfig.findOne({ id: 'main' });
    res.json(config || { 
      id: 'main', 
      notificationEmail: '',
      smtpHost: '',
      smtpPort: 587,
      smtpSecure: false,
      smtpUser: '',
      smtpPass: '',
      smtpFrom: '',
      smtpRejectUnauthorized: false,
      vrchatUsername: '',
      vrchatPassword: '',
      vrchatCookie: '',
      vrchatGroupId: '',
      vrchatBotEnabled: false,
      twoFactorAuthApiUrl: '',
      twoFactorAuthApiToken: '',
      twoFactorAuthAccountId: '',
      vrchatBots: [],
      disableAgeVerifyCommand: false
    });
  });

  app.post('/api/admin/config', authenticateToken, isAdmin, async (req: any, res) => {
    const { 
      action,
      testEmail,
      recipientEmail,
      notificationEmail,
      smtpHost,
      smtpPort,
      smtpSecure,
      smtpUser,
      smtpPass,
      smtpFrom,
      smtpRejectUnauthorized,
      vrchatUsername, 
      vrchatPassword, 
      vrchatCookie, 
      vrchatGroupId, 
      vrchatBotEnabled,
      twoFactorAuthApiUrl,
      twoFactorAuthApiToken,
      twoFactorAuthAccountId,
      vrchatBots,
      disableAgeVerifyCommand
    } = req.body || {};

    if (action === 'test-email' || testEmail === true) {
      try {
        const parsedPort = Number.parseInt(String(smtpPort ?? '587'), 10);
        if (typeof smtpHost === 'string' && smtpHost.trim()) {
          await SystemConfig.findOneAndUpdate(
            { id: 'main' },
            {
              ...(typeof notificationEmail === 'string' ? { notificationEmail: notificationEmail.trim() } : {}),
              smtpHost: smtpHost.trim(),
              smtpPort: Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 587,
              smtpSecure: Boolean(smtpSecure),
              smtpUser: typeof smtpUser === 'string' ? smtpUser.trim() : '',
              smtpPass: typeof smtpPass === 'string' ? smtpPass : '',
              smtpFrom: typeof smtpFrom === 'string' ? smtpFrom.trim() : '',
              smtpRejectUnauthorized: Boolean(smtpRejectUnauthorized),
              updatedAt: new Date(),
            },
            { upsert: true, new: true }
          );
          invalidateMailConfigCache();
        }

        const targetRecipient = String(recipientEmail || notificationEmail || '').trim();
        const result = await sendTestEmail(targetRecipient, {
          smtpHost,
          smtpPort,
          smtpSecure,
          smtpUser,
          smtpPass,
          smtpFrom,
          smtpRejectUnauthorized,
        });

        if (!result.sent) {
          return res.status(400).json({
            success: false,
            error: result.error || 'Failed to send test email',
            errorDetails: result.errorDetails || null,
            elapsedMs: result.elapsedMs,
            host: result.host,
            port: result.port,
            secure: result.secure,
            logs: result.logs || [],
          });
        }

        return res.json({
          success: true,
          elapsedMs: result.elapsedMs,
          host: result.host,
          port: result.port,
          secure: result.secure,
          from: result.from,
          recipient: targetRecipient,
          logs: result.logs || [],
          message: `Test email delivered to ${targetRecipient} in ${result.elapsedMs}ms (${result.host}:${result.port}).`,
        });
      } catch (err: any) {
        return res.status(500).json({
          success: false,
          error: err?.message || 'Unexpected error while testing SMTP configuration',
          logs: [`[ERROR] Unexpected exception: ${err?.stack || err?.message || err}`],
        });
      }
    }

    const cleanedGroupId = extractVRChatGroupId(vrchatGroupId);
    const parsedSmtpPort = Number.parseInt(String(smtpPort ?? '587'), 10);
    const updatePayload: any = { 
      notificationEmail: typeof notificationEmail === 'string' ? notificationEmail.trim() : '',
      smtpHost: typeof smtpHost === 'string' ? smtpHost.trim() : '',
      smtpPort: Number.isFinite(parsedSmtpPort) && parsedSmtpPort > 0 ? parsedSmtpPort : 587,
      smtpSecure: Boolean(smtpSecure),
      smtpUser: typeof smtpUser === 'string' ? smtpUser.trim() : '',
      smtpPass: typeof smtpPass === 'string' ? smtpPass : '',
      smtpFrom: typeof smtpFrom === 'string' ? smtpFrom.trim() : '',
      smtpRejectUnauthorized: Boolean(smtpRejectUnauthorized),
      vrchatUsername, 
      vrchatPassword, 
      vrchatCookie, 
      vrchatGroupId: cleanedGroupId, 
      vrchatBotEnabled,
      twoFactorAuthApiUrl,
      twoFactorAuthApiToken,
      twoFactorAuthAccountId,
      vrchatBots: vrchatBots || [],
      updatedAt: new Date() 
    };
    if (typeof disableAgeVerifyCommand === 'boolean') {
      updatePayload.disableAgeVerifyCommand = disableAgeVerifyCommand;
    }
    const updatedConfig = await SystemConfig.findOneAndUpdate(
      { id: 'main' },
      updatePayload,
      { upsert: true, new: true }
    );
    invalidateMailConfigCache();
    
    if (vrchatBotEnabled) {
      // Sync group lists and auth statuses for all configured bots in background
      void serviceClient.triggerVRChatSync();
    }

    let discordSyncResult: any = null;
    if (typeof disableAgeVerifyCommand === 'boolean') {
      try {
        discordSyncResult = await serviceClient.syncDiscordCommands(disableAgeVerifyCommand);
      } catch (e: any) {
        console.error('[Discord Commands] Error during command sync on config save:', e?.message || e);
      }
    }
    
    res.json({ success: true, config: updatedConfig, discordSync: discordSyncResult });
  });

  app.all(['/api/admin/config/test-email', '/api/admin/test-email'], optionalAuth, async (req: any, res) => {
    try {
      const isAdminUser = req.user && req.user.role === 'admin';
      const sysConfig: any = await SystemConfig.findOne({ id: 'main' }).lean().catch(() => null);

      const body = req.method === 'POST' ? (req.body || {}) : {};
      const queryRecipient = String(req.query?.to || req.query?.email || req.query?.recipientEmail || '').trim();
      const targetRecipient = String(
        (isAdminUser ? (body.recipientEmail || queryRecipient) : '') ||
        sysConfig?.notificationEmail ||
        sysConfig?.smtpUser ||
        ''
      ).trim();

      const overrideSettings = isAdminUser && req.method === 'POST'
        ? {
            smtpHost: body.smtpHost,
            smtpPort: body.smtpPort,
            smtpSecure: body.smtpSecure,
            smtpUser: body.smtpUser,
            smtpPass: body.smtpPass,
            smtpFrom: body.smtpFrom,
            smtpRejectUnauthorized: body.smtpRejectUnauthorized,
          }
        : undefined;

      const result = await sendTestEmail(targetRecipient, overrideSettings);

      if (!result.sent) {
        return res.status(400).json({
          success: false,
          error: result.error || 'Failed to send test email',
          errorDetails: result.errorDetails || null,
          elapsedMs: result.elapsedMs,
          host: result.host,
          port: result.port,
          secure: result.secure,
          recipient: targetRecipient || null,
          logs: result.logs || [],
        });
      }

      return res.json({
        success: true,
        elapsedMs: result.elapsedMs,
        host: result.host,
        port: result.port,
        secure: result.secure,
        from: result.from,
        recipient: targetRecipient,
        logs: result.logs || [],
        message: `Test email delivered to ${targetRecipient} in ${result.elapsedMs}ms (${result.host}:${result.port}).`,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err?.message || 'Unexpected error while testing SMTP configuration',
        logs: [`[ERROR] Unexpected exception: ${err?.stack || err?.message || err}`],
      });
    }
  });

  // Admin API: Manually trigger synchronization of Discord application slash commands
  app.post('/api/admin/discord/sync-commands', authenticateToken, isAdmin, async (req: any, res) => {
    try {
      const { disableAgeVerifyCommand } = req.body;
      if (typeof disableAgeVerifyCommand === 'boolean') {
        await SystemConfig.findOneAndUpdate(
          { id: 'main' },
          { disableAgeVerifyCommand, updatedAt: new Date() },
          { upsert: true }
        );
      }
      const syncResult = await serviceClient.syncDiscordCommands(disableAgeVerifyCommand);
      const adminUser = await Admin.findById(req.user.id);
      await new Log({
        action: 'DISCORD_COMMANDS_SYNC',
        adminId: adminUser ? adminUser.username : req.user.username,
        details: `Synchronized Discord slash commands. /age-verify command is ${syncResult.ageVerifyDisabled ? 'DISABLED and UNSYNCED' : 'ENABLED and SYNCED'}. (${syncResult.count} commands in registry)`
      }).save();

      res.json({
        success: syncResult.success,
        count: syncResult.count,
        ageVerifyDisabled: syncResult.ageVerifyDisabled,
        error: syncResult.error,
        message: syncResult.ageVerifyDisabled 
          ? 'The /age-verify slash command has been disabled and unsynced from Discord.' 
          : 'The /age-verify slash command has been enabled and synced with Discord.'
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Failed to sync Discord slash commands' });
    }
  });

  // Admin API: Read live status of Discord command synchronization
  app.get('/api/admin/discord/commands-status', authenticateToken, isAdmin, async (req: any, res) => {
    try {
      const config = await SystemConfig.findOne({ id: 'main' });
      const isAgeVerifyDisabled = Boolean(config?.disableAgeVerifyCommand);
      res.json({
        ageVerifyDisabled: isAgeVerifyDisabled,
        hasBotToken: Boolean(process.env.DISCORD_TOKEN),
        hasClientId: Boolean(process.env.DISCORD_CLIENT_ID)
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Failed to get Discord command status' });
    }
  });

  
}
