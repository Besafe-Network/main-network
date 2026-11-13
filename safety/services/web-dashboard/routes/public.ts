import express from 'express';
import { findUserByQuery as sharedFindUserByQuery } from '../user-lookup';
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

export function registerPublicRoutes(app: express.Express, context: any) {
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

  // Cached top.gg server count lookup (5 minute TTL)
  let topggCache: { ts: number; count: number | null } = { ts: 0, count: null };
  async function fetchTopggServerCount(): Promise<number | null> {
    const botId = process.env.DISCORD_CLIENT_ID || '1480627580636893356';
    if (Date.now() - topggCache.ts < 5 * 60 * 1000) return topggCache.count;
    try {
      const headers: Record<string, string> = {};
      if (process.env.DISCORD_TOKEN) headers.Authorization = process.env.DISCORD_TOKEN;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      try {
        const response = await fetch(`https://top.gg/api/bots/${botId}/stats`, { headers, signal: controller.signal });
        if (response.ok) {
          const data: any = await response.json();
          const count = typeof data?.server_count === 'number' ? data.server_count : null;
          topggCache = { ts: Date.now(), count };
          return count;
        }
      } finally {
        clearTimeout(timeout);
      }
    } catch {}
    topggCache = { ts: Date.now(), count: topggCache.count };
    return topggCache.count;
  }

const findUserByQuery = sharedFindUserByQuery;

  // ==========================================
  // --- PUBLIC API V1 & LEGACY ALIAS ROUTES ---
  // ==========================================

  // 1. Get User Profile & Reputation Profile
  app.get(['/api/v1/public/user/:userId', '/api/user/:userId'], async (req, res) => {
    try {
      const rawInput = req.params.userId || '';
      const { user: foundUser, cleaned } = await findUserByQuery(rawInput);
      let user = foundUser;
      
      if (!user) {
        user = new User({ id: cleaned, reputation: 0 });
        await user.save();
      }

      const age = user.dob ? (new Date().getFullYear() - user.dob.getFullYear()) : null;
      const isAdult = age !== null ? (age > 18 || (age === 18 && (new Date().getMonth() - user.dob.getMonth() >= 0))) : false;

      res.json({
        id: user.id,
        username: (user as any).username || (user as any).tag || user.id,
        displayName: (user as any).displayName || (user as any).username || user.id,
        avatarUrl: (user as any).avatarUrl || null,
        reputation: {
          score: user.reputation || 0,
          isTrusted: !!user.isTrusted,
          warningsCount: user.warnings ? user.warnings.length : 0
        },
        ban: {
          isBanned: !!user.isBanned,
          reason: user.banReason || null,
          type: user.banType || null,
          expiresAt: user.banExpiresAt || null
        },
        verification: {
          isVerified: !!user.isAgeVerified,
          isAdult: isAdult,
          verifiedAt: user.ageVerifiedAt || null
        },
        age: {
          isVerified: !!user.isAgeVerified,
          isAdult: isAdult,
          verifiedAt: user.ageVerifiedAt || null
        },
        vrchat: {
          vrchatUserId: user.vrchatUserId || null,
          vrchatUsername: user.vrchatUsername || null,
          linkedAlts: user.vrchatAlts || []
        },
        isDangerous: !!user.isDangerous,
        trustIndex: calculateDynamicTrustIndex({
          isDangerous: !!user.isDangerous,
          isBanned: !!user.isBanned,
          reputation: user.reputation || 0,
          isTrusted: !!user.isTrusted
        })
      });
    } catch (e) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // 2. Comprehensive Security & Ban Threat Check
  app.get(['/api/v1/public/check/:userId', '/api/check/:userId'], async (req, res) => {
    try {
      const rawInput = req.params.userId || '';
      const { user: foundUser, banCase, cleaned } = await findUserByQuery(rawInput);
      let user = foundUser;
      
      if (!user) {
        if (cleaned.startsWith('usr_')) {
          const vName = await serviceClient.fetchVRChatDisplayName(cleaned).catch(() => null);
          return res.json({
            found: true,
            id: null,
            username: vName || cleaned,
            reputation: 0,
            isBanned: false,
            isThreat: false,
            reputationScore: 0,
            isVerified: false,
            threatLevel: 'LOW',
            banReason: null,
            bannedBy: null,
            bannedAt: null,
            banType: null,
            banExpiresAt: null,
            unbanHistory: [],
            warningsCount: 0,
            isSuspicious: false,
            isDangerous: false,
            trustIndex: 'ALL CLEAR',
            watchlistUrl: null,
            banCase: null,
            vrchatAccounts: [{
              vrchatUserId: cleaned,
              vrchatUsername: vName || cleaned,
              isPrimary: true
            }]
          });
        }
        return res.json({
          found: false,
          isBanned: false,
          isThreat: false,
          reputationScore: 0,
          isVerified: false,
          threatLevel: 'LOW',
          trustIndex: 'ALL CLEAR',
          banCase: null,
          message: 'No safety incidents or records found for this identifier.'
        });
      }

      const isCaseActive = !!(banCase && banCase.status === 'active');
      const isEffectivelyBanned = !!user.isBanned || isCaseActive;
      const isEffectivelyDangerous = !!user.isDangerous || !!banCase?.isDangerous;
      const repScore = user.reputation || 0;
      const dynamicTrustIndex = calculateDynamicTrustIndex({
        isDangerous: isEffectivelyDangerous,
        isBanned: isEffectivelyBanned,
        reputation: repScore,
        isTrusted: !!user.isTrusted
      });

      const threatLevel = isEffectivelyDangerous || (isEffectivelyBanned && (user.banType === 'permanent' || banCase?.severity === 'permanent'))
        ? 'CRITICAL' 
        : isEffectivelyBanned || repScore <= -10
          ? 'HIGH' 
          : ((user as any).isSuspicious || repScore <= -5 || (user.warnings && user.warnings.length > 0)) 
            ? 'MEDIUM' 
            : 'LOW';

      const vrchatAccounts: any[] = [];
      if (user.vrchatUserId || user.vrchatUsername) {
        vrchatAccounts.push({
          vrchatUserId: user.vrchatUserId || "",
          vrchatUsername: user.vrchatUsername || "No Username",
          isPrimary: true
        });
      }
      if (user.vrchatAlts && Array.isArray(user.vrchatAlts)) {
        for (const alt of user.vrchatAlts) {
          if (alt.vrchatUserId || alt.vrchatUsername) {
            vrchatAccounts.push({
              vrchatUserId: alt.vrchatUserId || "",
              vrchatUsername: alt.vrchatUsername || "No Username",
              isPrimary: false
            });
          }
        }
      }

      // Add accounts from banCase if not already present
      if (banCase && Array.isArray(banCase.vrchatAccounts)) {
        for (const vc of banCase.vrchatAccounts) {
          if (vc && (vc.vrchatUserId || vc.vrchatUsername)) {
            const exists = vrchatAccounts.some(a => (vc.vrchatUserId && a.vrchatUserId === vc.vrchatUserId) || (vc.vrchatUsername && a.vrchatUsername === vc.vrchatUsername));
            if (!exists) {
              vrchatAccounts.push({
                vrchatUserId: vc.vrchatUserId || "",
                vrchatUsername: vc.vrchatUsername || "No Username",
                isPrimary: vrchatAccounts.length === 0
              });
            }
          }
        }
      }

      const primaryDisc = banCase?.discordAccounts?.[0];
      const primaryVRC = banCase?.vrchatAccounts?.[0];
      const resolved = user ? await resolveDiscordUser(client, user.id, user).catch(() => null) : null;
      const avatarUrl = primaryDisc?.avatarUrl || (user ? await getWatchlistAvatar(client, user) : resolved?.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png');
      const displayName = banCase?.title || primaryDisc?.displayName || primaryDisc?.username || (user as any)?.displayName || user?.username || resolved?.displayName || resolved?.username || primaryVRC?.vrchatUsername || (user as any)?.tag || user?.id;
      const resolvedUsername = primaryDisc?.username || user?.username || resolved?.username || primaryVRC?.vrchatUsername || (user as any)?.tag || user?.id;

      res.json({
        found: true,
        id: user.id,
        username: resolvedUsername,
        displayName: displayName || resolvedUsername,
        avatarUrl: avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png',
        reputation: user.reputation || 0,
        reputationScore: user.reputation || 0,
        isBanned: !!user.isBanned || (banCase && banCase.status === 'active'),
        isThreat: !!(user.isDangerous || user.isBanned || (banCase && banCase.status === 'active')),
        isVerified: !!user.isAgeVerified,
        threatLevel,
        banReason: user.banReason || banCase?.reason || null,
        bannedBy: (user as any).bannedBy || banCase?.bannedBy || null,
        bannedAt: (user as any).bannedAt || banCase?.createdAt || null,
        banType: user.banType || banCase?.severity || null,
        banExpiresAt: user.banExpiresAt || null,
        unbanHistory: user.unbanHistory || (banCase as any)?.unbanHistory || [],
        warningsCount: user.warnings ? user.warnings.length : 0,
        isSuspicious: !isEffectivelyBanned && repScore <= -5,
        isDangerous: isEffectivelyDangerous,
        trustIndex: dynamicTrustIndex,
        watchlistUrl: isEffectivelyDangerous ? `/watchlist/${banCase?.caseNumber || user.id}` : null,
        banCase: banCase ? {
          caseNumber: banCase.caseNumber,
          title: banCase.title,
          reason: banCase.reason,
          severity: banCase.severity,
          status: banCase.status,
          discordAccounts: banCase.discordAccounts || [],
          vrchatAccounts: banCase.vrchatAccounts || []
        } : null,
        vrchatAccounts
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // 3. User Reputation & Trust Breakdown
  app.get(['/api/v1/public/reputation/:userId', '/api/reputation/:userId'], async (req, res) => {
    try {
      const rawInput = req.params.userId || '';
      const { user: foundUser } = await findUserByQuery(rawInput);
      
      if (!foundUser) {
        return res.json({
          userId: rawInput,
          score: 0,
          tier: 'ALL CLEAR',
          trustIndex: 'ALL CLEAR',
          vouchCount: 0,
          negativeCount: 0,
          incidentCount: 0,
          lastEvaluated: new Date()
        });
      }

      const ratings = await ReputationRating.find({ userId: foundUser.id });
      const vouchCount = ratings.filter(r => r.rating > 0).length;
      const negativeCount = ratings.filter(r => r.rating < 0).length;
      const warningsCount = foundUser.warnings ? foundUser.warnings.length : 0;

      const dynamicTier = calculateDynamicTrustIndex({
        isDangerous: !!foundUser.isDangerous,
        isBanned: !!foundUser.isBanned,
        reputation: foundUser.reputation || 0,
        isTrusted: !!foundUser.isTrusted
      });

      res.json({
        userId: foundUser.id,
        score: foundUser.reputation || 0,
        tier: dynamicTier,
        trustIndex: dynamicTier,
        vouchCount,
        negativeCount,
        incidentCount: warningsCount + (foundUser.isBanned ? 1 : 0),
        lastEvaluated: foundUser.updatedAt || new Date()
      });
    } catch (e) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // 4. Cross-Platform Subject Lookup
  app.get(['/api/v1/public/lookup/:query', '/api/lookup/:query'], async (req, res) => {
    try {
      const q = (req.params.query || '').trim();
      if (!q) return res.json({ count: 0, results: [] });

      const regex = new RegExp(q, 'i');
      const users = await User.find({
        $or: [
          { id: q },
          { tag: regex },
          { vrchatUserId: q },
          { vrchatUsername: regex },
          { 'vrchatAlts.vrchatUserId': q },
          { 'vrchatAlts.vrchatUsername': regex }
        ]
      }).limit(20);

      const results = users.map(u => ({
        platform: u.vrchatUserId === q || u.vrchatUsername?.toLowerCase() === q.toLowerCase() ? 'vrchat' : 'discord',
        id: u.id,
        discordId: u.id,
        tag: (u as any).tag,
        vrchatUserId: u.vrchatUserId,
        vrchatUsername: u.vrchatUsername,
        isBanned: !!u.isBanned,
        isDangerous: !!u.isDangerous,
        reputation: u.reputation || 0,
        isVerified: !!u.isAgeVerified
      }));

      if (results.length === 0 && q.startsWith('usr_')) {
        const vName = await serviceClient.fetchVRChatDisplayName(q).catch(() => null);
        if (vName) {
          results.push({
            platform: 'vrchat',
            id: null as any,
            discordId: null as any,
            tag: null as any,
            vrchatUserId: q,
            vrchatUsername: vName,
            isBanned: false,
            isDangerous: false,
            reputation: 0,
            isVerified: false
          });
        }
      }

      res.json({ count: results.length, results });
    } catch (e) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // 5. Watchlist & Dangerous People Feed
  app.get(['/api/v1/public/watchlist', '/api/public/watchlist', '/api/public/dangerous'], async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const severity = req.query.severity as string;

      // 1. Fetch Watchlisted Ban Cases
      const dangerousCases = await BanCase.find({ isDangerous: true }).sort({ updatedAt: -1 });
      const formattedCases = await Promise.all(dangerousCases.map(async (c) => {
        const primaryDisc = c.discordAccounts[0];
        const primaryVRC = c.vrchatAccounts[0];
        let avatarUrl = primaryDisc?.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png';
        let displayName = c.title || primaryDisc?.displayName || primaryDisc?.username || primaryVRC?.vrchatUsername || `Case #${c.caseNumber}`;
        let username = primaryDisc?.username || primaryVRC?.vrchatUsername || c.caseNumber;
        const mainId = primaryDisc?.discordId || primaryVRC?.vrchatUserId || c.caseNumber;

        return {
          id: mainId,
          _id: c._id,
          caseNumber: c.caseNumber,
          isBanCase: true,
          tag: primaryDisc?.username || c.caseNumber,
          displayName,
          username,
          avatarUrl,
          reason: c.dangerousNotes || c.reason,
          dangerousNotes: c.dangerousNotes || c.notes,
          banReason: c.reason,
          severity: c.severity === 'critical' ? 'CRITICAL' : 'HIGH',
          threatType: 'CONFIRMED_HIGH_RISK_THREAT',
          trustIndex: 'BLACKLISTED',
          addedAt: c.createdAt || new Date(),
          updatedAt: c.updatedAt,
          evidenceCount: (c.evidenceLinks || []).length,
          evidence: (c.evidenceLinks || []).filter(Boolean),
          discordAccounts: c.discordAccounts || [],
          vrchatAccounts: c.vrchatAccounts || [],
          vrchatUserId: primaryVRC?.vrchatUserId || '',
          vrchatUsername: primaryVRC?.vrchatUsername || '',
          isBanned: c.status === 'active',
          isDangerous: true,
          isSuspicious: false
        };
      }));

      // 2. Fetch Watchlisted Legacy Users
      let query: any = {
        $or: [
          { isDangerous: true },
          { isSuspicious: true }
        ]
      };

      if (severity === 'CRITICAL') {
        query = { isDangerous: true, isBanned: true };
      } else if (severity === 'HIGH') {
        query = { isDangerous: true };
      } else if (severity === 'MEDIUM') {
        query = { isSuspicious: true };
      }

      const dangerousUsers = await User.find(query).limit(limit).sort({ updatedAt: -1 });
      
      const formattedUsers = await Promise.all(dangerousUsers.map(async (u) => {
        // Skip if this user is already represented by a watchlisted Ban Case
        if (formattedCases.some(c => c.discordAccounts?.some((d: any) => d.discordId === u.id) || c.vrchatAccounts?.some((v: any) => v.vrchatUserId === u.vrchatUserId))) {
          return null;
        }

        const resolved = await resolveDiscordUser(client, u.id, u);
        const avatarUrl = await getWatchlistAvatar(client, u);
        const vrchatAccounts: any[] = [];
        if (u.vrchatUserId || u.vrchatUsername) {
          vrchatAccounts.push({
            vrchatUserId: u.vrchatUserId || "",
            vrchatUsername: u.vrchatUsername || "No Username",
            isPrimary: true
          });
        }
        if (u.vrchatAlts && Array.isArray(u.vrchatAlts)) {
          for (const alt of u.vrchatAlts) {
            if (alt.vrchatUserId || alt.vrchatUsername) {
              vrchatAccounts.push({
                vrchatUserId: alt.vrchatUserId || "",
                vrchatUsername: alt.vrchatUsername || "No Username",
                isPrimary: false
              });
            }
          }
        }

        const userDiscordAccounts: any[] = [];
        if (u.id) {
          userDiscordAccounts.push({
            discordId: u.id,
            username: resolved.username || (u as any).tag || u.id,
            displayName: resolved.displayName || resolved.username || u.id,
            avatarUrl: avatarUrl || resolved.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png',
            isPrimary: true
          });
        }
        if ((u as any).discordAccounts && Array.isArray((u as any).discordAccounts)) {
          for (const d of (u as any).discordAccounts) {
            if (!userDiscordAccounts.some(x => x.discordId === d.discordId)) {
              userDiscordAccounts.push({
                discordId: d.discordId,
                username: d.username || d.displayName || d.discordId,
                displayName: d.displayName || d.username || d.discordId,
                avatarUrl: d.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png',
                isPrimary: false
              });
            }
          }
        }
        if ((u as any).altDiscordAccounts && Array.isArray((u as any).altDiscordAccounts)) {
          for (const alt of (u as any).altDiscordAccounts) {
            const aid = alt.discordId || alt.id;
            if (aid && !userDiscordAccounts.some(x => x.discordId === aid)) {
              userDiscordAccounts.push({
                discordId: aid,
                username: alt.username || alt.tag || aid,
                displayName: alt.displayName || alt.username || aid,
                avatarUrl: alt.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png',
                isPrimary: false
              });
            }
          }
        }

        return {
          id: u.id,
          _id: u._id,
          isBanCase: false,
          tag: (u as any).tag || u.id,
          displayName: resolved.displayName,
          username: resolved.username,
          avatarUrl: avatarUrl || resolved.avatarUrl,
          reason: u.dangerousNotes || u.banReason || 'Flagged security threat',
          dangerousNotes: u.dangerousNotes,
          banReason: u.banReason,
          severity: u.isDangerous && u.isBanned ? 'CRITICAL' : (u.isDangerous ? 'HIGH' : 'MEDIUM'),
          threatType: u.isDangerous ? 'CONFIRMED_HIGH_RISK_THREAT' : 'SUSPICIOUS_ACTIVITY',
          trustIndex: calculateDynamicTrustIndex({
            isDangerous: !!u.isDangerous,
            isBanned: !!u.isBanned,
            reputation: u.reputation || 0,
            isTrusted: !!u.isTrusted
          }),
          addedAt: u.updatedAt || new Date(),
          updatedAt: u.updatedAt,
          evidenceCount: (u.evidenceLinks || (u as any).evidencePhotos || []).length,
          evidence: (u.evidenceLinks || (u as any).evidencePhotos || []).filter(Boolean),
          discordAccounts: userDiscordAccounts,
          vrchatAccounts,
          vrchatUserId: u.vrchatUserId,
          vrchatUsername: u.vrchatUsername,
          isBanned: !!u.isBanned,
          isDangerous: !!u.isDangerous,
          isSuspicious: !!(u as any).isSuspicious
        };
      }));

      const combined = [...formattedCases, ...formattedUsers.filter(Boolean)].slice(0, limit);

      // If calling /api/v1/public/watchlist, return enveloped JSON
      if (req.path.startsWith('/api/v1')) {
        return res.json({
          count: combined.length,
          entries: combined
        });
      }
      
      // Legacy routes return raw list
      res.json(combined);
    } catch (e) {
      res.status(500).json({ error: 'Failed to fetch watchlist' });
    }
  });

  // 6. Watchlist Individual Threat Dossier
  app.get(['/api/v1/public/watchlist/:userId', '/api/public/dangerous/:id'], async (req, res) => {
    try {
      const id = req.params.userId || req.params.id;
      const { user, banCase } = await findUserByQuery(id);
      
      if (banCase && banCase.isDangerous) {
        const primaryDisc = banCase.discordAccounts?.[0];
        const primaryVRC = banCase.vrchatAccounts?.[0];
        const avatarUrl = primaryDisc?.avatarUrl || (user ? await getWatchlistAvatar(client, user) : 'https://cdn.discordapp.com/embed/avatars/0.png');
        const displayName = banCase.title || primaryDisc?.displayName || primaryDisc?.username || primaryVRC?.vrchatUsername || `Case #${banCase.caseNumber}`;
        const username = primaryDisc?.username || primaryVRC?.vrchatUsername || banCase.caseNumber;

        const caseDiscordAccounts = (banCase.discordAccounts && banCase.discordAccounts.length > 0)
          ? banCase.discordAccounts
          : (primaryDisc ? [primaryDisc] : []);

        return res.json({
          id: primaryDisc?.discordId || primaryVRC?.vrchatUserId || banCase.caseNumber,
          userId: primaryDisc?.discordId || primaryVRC?.vrchatUserId || banCase.caseNumber,
          caseNumber: banCase.caseNumber,
          isBanCase: true,
          displayName,
          username,
          avatarUrl,
          alias: primaryDisc?.username || primaryVRC?.vrchatUsername || banCase.caseNumber,
          threatType: 'CONFIRMED_HIGH_RISK_THREAT',
          status: banCase.status === 'active' ? 'GLOBALLY_BANNED' : 'UNDER_SURVEILLANCE',
          reason: banCase.dangerousNotes || banCase.reason,
          dangerousNotes: banCase.dangerousNotes,
          banReason: banCase.reason,
          evidence: banCase.evidenceLinks || [],
          discordAccounts: caseDiscordAccounts,
          vrchatAccounts: banCase.vrchatAccounts || [],
          reputation: user?.reputation || 0,
          warningsCount: user?.warnings ? user.warnings.length : 0,
          isAgeVerified: user?.isAgeVerified || false,
          trustIndex: 'BLACKLISTED',
          updatedAt: banCase.updatedAt || new Date(),
          createdAt: banCase.createdAt || new Date()
        });
      }

      if (!user) {
        return res.status(404).json({ error: 'Threat dossier not found' });
      }

      const resolved = await resolveDiscordUser(client, user.id, user);
      const avatarUrl = await getWatchlistAvatar(client, user);

      const userDiscordAccounts: any[] = [];
      if (user.id) {
        userDiscordAccounts.push({
          discordId: user.id,
          username: resolved.username || (user as any).tag || user.id,
          displayName: resolved.displayName || resolved.username || user.id,
          avatarUrl: avatarUrl || resolved.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png',
          isPrimary: true
        });
      }
      if ((user as any).discordAccounts && Array.isArray((user as any).discordAccounts)) {
        for (const d of (user as any).discordAccounts) {
          if (!userDiscordAccounts.some(x => x.discordId === d.discordId)) {
            userDiscordAccounts.push({
              discordId: d.discordId,
              username: d.username || d.displayName || d.discordId,
              displayName: d.displayName || d.username || d.discordId,
              avatarUrl: d.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png',
              isPrimary: false
            });
          }
        }
      }
      if ((user as any).altDiscordAccounts && Array.isArray((user as any).altDiscordAccounts)) {
        for (const alt of (user as any).altDiscordAccounts) {
          const aid = alt.discordId || alt.id;
          if (aid && !userDiscordAccounts.some(x => x.discordId === aid)) {
            userDiscordAccounts.push({
              discordId: aid,
              username: alt.username || alt.tag || aid,
              displayName: alt.displayName || alt.username || aid,
              avatarUrl: alt.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png',
              isPrimary: false
            });
          }
        }
      }

      const vrchatAccounts: any[] = [];
      if (user.vrchatUserId || user.vrchatUsername) {
        vrchatAccounts.push({
          vrchatUserId: user.vrchatUserId || "",
          vrchatUsername: user.vrchatUsername || "No Username",
          isPrimary: true
        });
      }
      if (user.vrchatAlts && Array.isArray(user.vrchatAlts)) {
        for (const alt of user.vrchatAlts) {
          if (alt.vrchatUserId || alt.vrchatUsername) {
            vrchatAccounts.push({
              vrchatUserId: alt.vrchatUserId || "",
              vrchatUsername: alt.vrchatUsername || "No Username",
              isPrimary: false
            });
          }
        }
      }

      res.json({
        id: user.id,
        userId: user.id,
        displayName: resolved.displayName,
        username: resolved.username,
        avatarUrl: avatarUrl || resolved.avatarUrl,
        alias: (user as any).tag || user.vrchatUsername || user.id,
        threatType: user.isDangerous ? 'CONFIRMED_HIGH_RISK_THREAT' : 'SUSPICIOUS_ACTIVITY',
        status: user.isBanned ? 'GLOBALLY_BANNED' : 'UNDER_SURVEILLANCE',
        reason: user.dangerousNotes || user.banReason || 'Under security review',
        banReason: user.banReason,
        dangerousNotes: user.dangerousNotes,
        trustIndex: calculateDynamicTrustIndex({
          isDangerous: !!user.isDangerous,
          isBanned: !!user.isBanned,
          reputation: user.reputation || 0,
          isTrusted: !!user.isTrusted
        }),
        evidence: (user.evidenceLinks || (user as any).evidencePhotos || []).filter(Boolean),
        reputation: user.reputation || 0,
        isAgeVerified: !!user.isAgeVerified,
        warningsCount: user.warnings?.length || 0,
        discordAccounts: userDiscordAccounts,
        vrchatAccounts,
        updatedAt: user.updatedAt,
        createdAt: user.createdAt
      });
    } catch (e) {
      res.status(500).json({ error: 'Failed to fetch threat dossier' });
    }
  });

  // 7. Public Incident Report Submission
  app.post(['/api/v1/public/report', '/api/public/report'], async (req, res) => {
    try {
      const { targetUserId, reason, evidence, reporterUserId, reporterEmail, vrchatUsername, vrchatAccount, customBanlistId } = req.body;
      if (!targetUserId || !reason) {
        return res.status(400).json({ error: 'targetUserId and reason are required' });
      }

      const evidenceLinks = Array.isArray(evidence) ? evidence : (evidence ? [evidence] : []);

      const report = new Report({
        targetUserId: targetUserId.trim(),
        targetDisplayName: targetUserId.trim(),
        reason: reason.trim(),
        evidenceLinks,
        reporterUserId: reporterUserId || 'Public Community Member',
        reporterEmail: reporterEmail || (reporterUserId?.includes('@') ? reporterUserId : 'public-report@besafe.network'),
        vrchatAccount: vrchatUsername || vrchatAccount || '',
        customBanlistId: customBanlistId || ''
      });

      await report.save();

      await notifyAdmins('New Incident Report', `A new safety report was submitted for target: ${targetUserId}.\nReason: ${reason}`);

      res.json({
        success: true,
        reportId: report._id,
        message: 'Report logged and assigned to staff triage queue.'
      });
    } catch (e) {
      res.status(500).json({ error: 'Failed to submit report' });
    }
  });

  // 8. Public Ban Appeal Submission
  app.post(['/api/v1/public/appeal', '/api/appeal'], async (req, res) => {
    try {
      const { userId, email, reason, vrchatAccount, evidence } = req.body;
      if (!userId || !email || !reason) {
        return res.status(400).json({ error: 'userId, email, and reason are required' });
      }

      const appeal = new Appeal({
        userId: userId.trim(),
        email: email.trim(),
        reason: reason.trim(),
        vrchatAccount: vrchatAccount || "",
        evidenceLinks: Array.isArray(evidence) ? evidence : (evidence ? [evidence] : [])
      });

      await safeSaveAppeal(appeal);
      await notifyAdmins('New Ban Appeal', `User ${userId} filed a ban appeal (${email}).\nReason: ${reason}${vrchatAccount ? `\nVRChat Account: ${vrchatAccount}` : ''}`);

      res.json({
        success: true,
        appealId: appeal._id,
        status: 'PENDING_REVIEW',
        message: 'Appeal successfully submitted. You will receive an email upon review.'
      });
    } catch (e) {
      res.status(500).json({ error: 'Failed to submit appeal' });
    }
  });

  // 9. Public Appeal Status Check
  app.get(['/api/v1/public/appeal-status/:userId', '/api/appeal/status/:userId'], async (req, res) => {
    try {
      const userId = (req.params.userId || '').trim();
      const latestAppeal = await Appeal.findOne({ userId }).sort({ createdAt: -1 });

      if (!latestAppeal) {
        return res.json({
          hasActiveAppeal: false,
          status: 'NO_APPEAL_FOUND',
          submittedAt: null,
          lastStaffNote: null
        });
      }

      res.json({
        hasActiveAppeal: latestAppeal.status === 'pending' || (latestAppeal.status as string) === 'under_review',
        status: latestAppeal.status.toUpperCase(),
        submittedAt: latestAppeal.createdAt,
        lastStaffNote: latestAppeal.adminNotes || 'Appeal is currently queued with trust and safety investigators.'
      });
    } catch (e) {
      res.status(500).json({ error: 'Failed to fetch appeal status' });
    }
  });

  // Public stats endpoint
  app.get(['/api/public/stats', '/api/v1/public/stats', '/api/stats'], async (req, res) => {
    try {
      const [activeBanCases, activeBanCasesDocs, guildCount, trustedUserCount, totalUsersInDb] = await Promise.all([
        BanCase.find({ status: 'active' }).lean(),
        BanCase.countDocuments({ status: 'active' }),
        Guild.countDocuments(),
        User.countDocuments({ isTrusted: true }),
        User.countDocuments()
      ]);

      // Calculate total banned accounts (all linked Discord and VRChat accounts) or cases count
      let totalBannedAccounts = 0;
      for (const c of activeBanCases) {
        const discCount = (c.discordAccounts || []).length;
        const vrcCount = (c.vrchatAccounts || []).length;
        totalBannedAccounts += Math.max(1, discCount + vrcCount);
      }
      const banCount = Math.max(activeBanCasesDocs, totalBannedAccounts);

      // Calculate total protected users across connected Discord guilds
      const discordGuilds = await serviceClient.fetchDiscordGuilds();
      const liveDiscordMembers = discordGuilds.reduce((total, guild) => total + (guild.memberCount || 0), 0);

      const userCount = Math.max(liveDiscordMembers, totalUsersInDb + (guildCount * 150), 100);
      const serverCount = await fetchTopggServerCount();

      res.json({ userCount, banCount, guildCount, serverCount, trustedCount: trustedUserCount });
    } catch (e) {
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  // Admin endpoints
  app.get('/api/admin/stats', authenticateToken, isModOrAdmin, async (req, res) => {
    try {
      const [banCount, reportCount, appealCount, guildCount, trustedCount] = await Promise.all([
        BanCase.countDocuments({ status: 'active' }),
        Report.countDocuments(),
        Appeal.countDocuments(),
        Guild.countDocuments(),
        User.countDocuments({ isTrusted: true })
      ]);
      res.json({ banCount, reportCount, appealCount, guildCount, trustedCount });
    } catch (e) {
      res.status(500).send();
    }
  });

  app.get('/api/admin/logs', authenticateToken, isModOrAdmin, async (req, res) => {
    const logs = await Log.find().sort({ timestamp: -1 }).limit(100);
    res.json(logs);
  });

  app.get('/api/admin/reports', authenticateToken, isModOrAdmin, async (req, res) => {
    try {
      const reports = await Report.find({ status: 'pending' }).sort({ createdAt: -1 }).limit(50).lean();
      const targetUserIds = reports.map(r => r.targetUserId);
      const users = await User.find({ id: { $in: targetUserIds } }).lean();
      const userMap = new Map<string, any>(users.map((user: any) => [user.id, user]));

      const enrichedReports = await Promise.all(reports.map(async (report) => {
        const user = userMap.get(report.targetUserId);
        const resolved = await resolveDiscordUser(client, report.targetUserId, user);

        return {
          ...report,
          targetDisplayName: resolved.displayName,
          warnings: user?.warnings || []
        };
      }));

      res.json(enrichedReports);
    } catch (e) {
      res.status(500).json({ error: 'Failed to fetch reports' });
    }
  });

  app.post('/api/appeal', async (req, res) => {
    try {
      const { userId, email, reason, vrchatAccount, attachments } = req.body;
      if (!userId || !email || !reason) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const cleanedVrchat = extractVRChatUserId(vrchatAccount || "");
      const appeal = new Appeal({
        userId,
        email,
        reason,
        vrchatAccount: cleanedVrchat,
        attachments: Array.isArray(attachments) ? attachments.filter(Boolean) : [],
        status: 'pending'
      });
      await safeSaveAppeal(appeal);

      await notifyAdmins('New Ban Appeal', `A new appeal has been submitted for user ${userId}.\nReason: ${reason}`);

      res.json({ success: true, appealId: appeal._id });
    } catch (e) {
      console.error('Error submitting appeal:', e);
      res.status(500).json({ error: 'Failed to submit appeal' });
    }
  });

  app.get('/api/admin/appeals', authenticateToken, isModOrAdmin, async (req, res) => {
    try {
      const appeals = await Appeal.find({
        status: 'pending',
        $or: [
          { claimedBy: null },
          { claimedBy: "" },
          { claimedBy: { $exists: false } }
        ]
      }).sort({ createdAt: -1 }).limit(50).lean();
      const userIds = appeals.map(a => a.userId);
      
      const [users, reports] = await Promise.all([
        User.find({ id: { $in: userIds } }).lean(),
        Report.find({ targetUserId: { $in: userIds }, status: 'reviewed' }).sort({ createdAt: -1 }).lean()
      ]);

      const userMap = new Map<string, any>(users.map((user: any) => [user.id, user]));
      const reportMap = new Map();
      for (const r of reports) {
        if (!reportMap.has(r.targetUserId)) {
          reportMap.set(r.targetUserId, r);
        }
      }

      const enrichedAppeals = await Promise.all(appeals.map(async (appeal) => {
        const user = userMap.get(appeal.userId);
        const report = reportMap.get(appeal.userId);
        const resolved = await resolveDiscordUser(client, appeal.userId, user);

        return {
          ...appeal,
          userDisplayName: resolved.displayName,
          originalBanReason: user?.banReason || 'Unknown',
          evidence: (report?.evidenceLinks || []).join('\n') || 'No evidence found from original report.'
        };
      }));
      
      res.json(enrichedAppeals);
    } catch (e) {
      res.status(500).json({ error: 'Failed to fetch appeals' });
    }
  });

  app.post('/api/admin/appeals/:id/claim', authenticateToken, isModOrAdmin, async (req: any, res) => {
    try {
      const appeal = await Appeal.findById(req.params.id);
      if (!appeal) return res.status(404).json({ error: 'Appeal not found' });
      if (appeal.status === 'approved' || appeal.status === 'denied') {
        return res.status(400).json({ error: 'Cannot claim a closed appeal' });
      }

      appeal.claimedBy = req.user.username;
      appeal.claimedAt = new Date();
      appeal.status = 'claimed';
      await safeSaveAppeal(appeal);

      await new Log({
        action: 'CLAIM_APPEAL',
        adminId: req.user.username,
        targetId: appeal.userId,
        details: `Claimed appeal ${appeal._id} as case`
      }).save();

      res.json({ success: true, appeal });
    } catch (e) {
      res.status(500).json({ error: 'Failed to claim appeal' });
    }
  });

  app.post('/api/admin/appeals/:id/unclaim', authenticateToken, isModOrAdmin, async (req: any, res) => {
    try {
      const appeal = await Appeal.findById(req.params.id);
      if (!appeal) return res.status(404).json({ error: 'Appeal not found' });

      appeal.claimedBy = null;
      (appeal as any).claimedAt = undefined;
      appeal.status = 'pending';
      await safeSaveAppeal(appeal);

      await new Log({
        action: 'UNCLAIM_APPEAL',
        adminId: req.user.username,
        targetId: appeal.userId,
        details: `Unclaimed appeal ${appeal._id}`
      }).save();

      res.json({ success: true, appeal });
    } catch (e) {
      res.status(500).json({ error: 'Failed to unclaim appeal' });
    }
  });

  app.post('/api/admin/reports/:id/claim', authenticateToken, isModOrAdmin, async (req: any, res) => {
    try {
      const report = await Report.findById(req.params.id);
      if (!report) return res.status(404).json({ error: 'Report not found' });
      if (report.status === 'reviewed' || report.status === 'dismissed') {
        return res.status(400).json({ error: 'Cannot claim a closed report' });
      }

      report.claimedBy = req.user.username;
      report.claimedAt = new Date();
      report.status = 'claimed';
      await safeSaveReport(report);

      await new Log({
        action: 'CLAIM_REPORT',
        adminId: req.user.username,
        targetId: report.targetUserId,
        details: `Claimed report ${report._id} as case ticket`
      }).save();

      res.json({ success: true, report });
    } catch (e) {
      res.status(500).json({ error: 'Failed to claim report' });
    }
  });

  app.post('/api/admin/reports/:id/unclaim', authenticateToken, isModOrAdmin, async (req: any, res) => {
    try {
      const report = await Report.findById(req.params.id);
      if (!report) return res.status(404).json({ error: 'Report not found' });

      report.claimedBy = null;
      (report as any).claimedAt = undefined;
      report.status = 'pending';
      await safeSaveReport(report);

      await new Log({
        action: 'UNCLAIM_REPORT',
        adminId: req.user.username,
        targetId: report.targetUserId,
        details: `Unclaimed report ${report._id}`
      }).save();

      res.json({ success: true, report });
    } catch (e) {
      res.status(500).json({ error: 'Failed to unclaim report' });
    }
  });

  app.get('/api/admin/cases', authenticateToken, isModOrAdmin, async (req: any, res) => {
    try {
      const showAll = req.query.all === 'true';
      const query = showAll
        ? { claimedBy: { $ne: null, $exists: true } }
        : { claimedBy: req.user.username };

      const [appeals, reports] = await Promise.all([
        Appeal.find(query).sort({ claimedAt: -1, createdAt: -1 }).lean(),
        Report.find({ ...query, status: 'claimed' }).sort({ claimedAt: -1, createdAt: -1 }).lean()
      ]);

      const appealUserIds = appeals.map(a => a.userId);
      const reportTargetUserIds = reports.map(r => r.targetUserId);
      const allUserIds = Array.from(new Set([...appealUserIds, ...reportTargetUserIds]));

      const [users, relatedReports] = await Promise.all([
        User.find({ id: { $in: allUserIds } }).lean(),
        Report.find({ targetUserId: { $in: appealUserIds }, status: 'reviewed' }).sort({ createdAt: -1 }).lean()
      ]);

      const userMap = new Map<string, any>(users.map((user: any) => [user.id, user]));
      const reportMap = new Map();
      for (const r of relatedReports) {
        if (!reportMap.has(r.targetUserId)) {
          reportMap.set(r.targetUserId, r);
        }
      }

      const enrichedAppeals = await Promise.all(appeals.map(async (appeal) => {
        const user = userMap.get(appeal.userId);
        const report = reportMap.get(appeal.userId);
        const resolved = await resolveDiscordUser(client, appeal.userId, user);

        return {
          ...appeal,
          caseType: 'appeal',
          userDisplayName: resolved.displayName,
          originalBanReason: user?.banReason || 'Unknown',
          evidence: (report?.evidenceLinks || []).join('\n') || 'No evidence found from original report.'
        };
      }));

      const enrichedReports = await Promise.all(reports.map(async (report) => {
        const user = userMap.get(report.targetUserId);
        const resolved = await resolveDiscordUser(client, report.targetUserId, user);

        return {
          ...report,
          caseType: 'report',
          userId: report.targetUserId,
          userDisplayName: (report as any).targetDisplayName || resolved.displayName,
          email: report.reporterEmail,
          originalBanReason: user?.banReason || 'Reported Violation',
          evidence: (report.evidenceLinks || []).join('\n') || 'No evidence links provided.'
        };
      }));

      const allCases = [...enrichedAppeals, ...enrichedReports].sort((a, b) => {
        const timeA = new Date(a.claimedAt || a.createdAt).getTime();
        const timeB = new Date(b.claimedAt || b.createdAt).getTime();
        return timeB - timeA;
      });

      res.json(allCases);
    } catch (e) {
      res.status(500).json({ error: 'Failed to fetch cases' });
    }
  });

  app.post('/api/admin/reports/:id/message', authenticateToken, isModOrAdmin, async (req: any, res) => {
    try {
      const { content, attachments } = req.body;
      const report = await Report.findById(req.params.id);
      if (!report) return res.status(404).json({ error: 'Report not found' });

      const filteredAttachments = Array.isArray(attachments) ? attachments.filter(Boolean) : [];

      (report as any).messages.push({
        sender: 'admin',
        content: content || '',
        attachments: filteredAttachments,
        timestamp: new Date()
      });
      await safeSaveReport(report);

      const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
      const replyUrl = `${baseUrl}/report-reply?id=${report._id}`;

      // DM reporter on Discord if reporter has a Discord User ID
      const discordIdMatch = report.reporterUserId ? report.reporterUserId.match(/(\d{17,20})/) : null;
      const rawDiscordUserId = discordIdMatch ? discordIdMatch[1] : (report.reporterUserId && /^\d{17,20}$/.test(report.reporterUserId) ? report.reporterUserId : null);

      if (rawDiscordUserId && client) {
        try {
          await serviceClient.sendDiscordDM(rawDiscordUserId, `🛡️ **BeSafe Network: Mod Communication**\n\nAn administrator sent an update regarding your report (ID: \`${report._id}\`):\n\n> ${content}\n\n[Click here to view full discussion / reply on web](${replyUrl})`);
        } catch (e) {
          console.error(`Failed to DM report message to Discord user ${rawDiscordUserId}:`, e);
        }
      }

      // Send email if a valid email address is provided
      if (report.reporterEmail && report.reporterEmail.includes('@') && !report.reporterEmail.endsWith('@discord.user') && !report.reporterEmail.endsWith('@besafe.network')) {
        try {
          const email = EmailTemplates.getReportMessageEmail(report.targetUserId, content, replyUrl, filteredAttachments);
          await sendMail(report.reporterEmail, email.subject, email.text, email.html, email.mailAttachments);
        } catch (e) {
          console.error('Failed to send report message email:', e);
        }
      }

      await new Log({
        action: 'REPORT_MESSAGE_SENT',
        adminId: req.user.username,
        targetId: report.targetUserId,
        details: `Sent message to reporter regarding report ${report._id}`
      }).save();

      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to send message' });
    }
  });

  app.post('/api/admin/appeals/:id/message', authenticateToken, isModOrAdmin, async (req: any, res) => {
    try {
      const { content, attachments } = req.body;
      const appeal = await Appeal.findById(req.params.id);
      if (!appeal) return res.status(404).json({ error: 'Appeal not found' });

      const filteredAttachments = Array.isArray(attachments) ? attachments.filter(Boolean) : [];

      (appeal as any).messages.push({
        sender: 'admin',
        content,
        attachments: filteredAttachments
      });
      await safeSaveAppeal(appeal);

      const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
      const replyUrl = `${baseUrl}/appeal-reply?id=${appeal._id}`;
      const email = EmailTemplates.getAppealMessageEmail(appeal.userId, content, replyUrl, filteredAttachments);
      await sendMail(appeal.email, email.subject, email.text, email.html, email.mailAttachments);

      await new Log({
        action: 'APPEAL_MESSAGE_SENT',
        adminId: req.user.username,
        targetId: appeal.userId,
        details: `Sent message to user regarding appeal ${appeal._id}`
      }).save();

      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to send message' });
    }
  });

  app.post('/api/appeal/:id/reply', async (req, res) => {
    try {
      const { content, attachments } = req.body;
      if (!content && (!attachments || attachments.length === 0)) {
        return res.status(400).json({ error: 'Message content or attachment required' });
      }
      
      const appeal = await Appeal.findById(req.params.id);
      if (!appeal) return res.status(404).json({ error: 'Appeal not found' });
      if (appeal.status === 'approved' || appeal.status === 'denied') {
        return res.status(403).json({ error: 'Appeal session is closed.' });
      }

      (appeal as any).messages.push({
        sender: 'user',
        content: content || '',
        attachments: Array.isArray(attachments) ? attachments.filter(Boolean) : []
      });
      await safeSaveAppeal(appeal);

      await notifyAdmins('APPEAL TICKET REPLY', `User ${appeal.userId} has replied to their appeal ticket (${appeal._id}).`);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to submit reply' });
    }
  });

  app.post('/api/report/:id/reply', async (req, res) => {
    try {
      const { content, attachments } = req.body;
      if (!content && (!attachments || attachments.length === 0)) {
        return res.status(400).json({ error: 'Message content or attachment required' });
      }
      
      const report = await Report.findById(req.params.id);
      if (!report) return res.status(404).json({ error: 'Report ticket not found' });
      if (report.status === 'reviewed' || report.status === 'dismissed') {
        return res.status(403).json({ error: 'Report session is closed.' });
      }

      (report as any).messages.push({
        sender: 'user',
        content: content || '',
        attachments: Array.isArray(attachments) ? attachments.filter(Boolean) : [],
        timestamp: new Date()
      });
      await safeSaveReport(report);

      await notifyAdmins('REPORT TICKET REPLY', `Reporter for user ${report.targetUserId} has replied to report ticket (${report._id}).`);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to submit reply' });
    }
  });

  app.get('/api/report/:id/public', async (req, res) => {
    try {
      const report = await Report.findById(req.params.id).select('targetUserId targetDisplayName reporterUserId reason attachments evidenceLinks status claimedBy messages vrchatAccount createdAt');
      if (!report) return res.status(404).json({ error: 'Report ticket not found' });
      res.json(report);
    } catch (e) {
      res.status(500).json({ error: 'Failed to fetch report' });
    }
  });

  app.post('/api/admin/users/:id/evidence', authenticateToken, isModOrAdmin, async (req: any, res) => {
    try {
      const { links } = req.body;
      const user = await User.findOneAndUpdate(
        { id: req.params.id },
        { $set: { evidenceLinks: links, updatedAt: new Date() } },
        { new: true }
      );
      if (!user) return res.status(404).json({ error: 'User not found' });

      await new Log({
        action: 'UPDATE_EVIDENCE',
        adminId: req.user.username,
        targetId: req.params.id,
        details: `Updated evidence links for ${req.params.id}`
      }).save();

      res.json({ success: true, evidenceLinks: user.evidenceLinks });
    } catch (e) {
      res.status(500).json({ error: 'Failed to update evidence' });
    }
  });

  app.get('/api/admin/dashboard/summary', authenticateToken, isModOrAdmin, async (req, res) => {
    try {
      const [
        reports,
        appeals,
        verifications,
        apiRequests,
        bannedCount,
        trustedCount
      ] = await Promise.all([
        Report.countDocuments({ status: 'pending' }),
        Appeal.countDocuments({ status: 'pending' }),
        VerificationRequest.countDocuments({ status: 'pending' }),
        ApiKeyRequest.countDocuments({ status: 'pending' }),
        BanCase.countDocuments({ status: 'active' }),
        User.countDocuments({ isTrusted: true })
      ]);

      res.json({
        pending: {
          reports,
          appeals,
          verifications,
          apiRequests
        },
        stats: {
          totalBans: bannedCount,
          totalTrusted: trustedCount
        }
      });
    } catch (e) {
      res.status(500).send();
    }
  });

  app.get('/api/admin/bans', authenticateToken, isModOrAdmin, async (req, res) => {
    try {
      const activeBanCases = await BanCase.find({ status: 'active' }).sort({ createdAt: -1 }).limit(150).lean();
      
      const enrichedBans = await Promise.all(activeBanCases.map(async (bCase) => {
        const primaryDiscord = (bCase.discordAccounts || [])[0];
        const primaryVRChat = (bCase.vrchatAccounts || []).find((v: any) => v.isPrimary) || (bCase.vrchatAccounts || [])[0];
        const primaryId = primaryDiscord?.discordId || primaryVRChat?.vrchatUserId || bCase.caseNumber;
        
        let displayName = primaryDiscord?.displayName || primaryDiscord?.username || primaryVRChat?.vrchatUsername || bCase.title || bCase.caseNumber;
        if (primaryDiscord?.discordId && client) {
          const resolved = await resolveDiscordUser(client, primaryDiscord.discordId).catch(() => null);
          if (resolved?.displayName) displayName = resolved.displayName;
        }

        return {
          id: primaryId,
          caseNumber: bCase.caseNumber,
          username: displayName,
          displayName,
          banReason: bCase.reason,
          banType: bCase.severity,
          bannedAt: bCase.bannedAt || bCase.createdAt,
          bannedBy: bCase.bannedBy,
          isDangerous: !!bCase.isDangerous,
          dangerousNotes: bCase.dangerousNotes,
          trustIndex: bCase.trustIndex,
          discordAccounts: bCase.discordAccounts || [],
          vrchatAccounts: bCase.vrchatAccounts || [],
          evidenceLinks: bCase.evidenceLinks || [],
          notes: bCase.notes,
          vrchatUserId: primaryVRChat?.vrchatUserId || '',
          vrchatUsername: primaryVRChat?.vrchatUsername || '',
          vrchatAlts: (bCase.vrchatAccounts || []).filter((v: any) => v.vrchatUserId !== primaryVRChat?.vrchatUserId)
        };
      }));

      res.json(enrichedBans);
    } catch (e) {
      res.status(500).json({ error: 'Failed to fetch bans' });
    }
  });

  app.get('/api/admin/trusted', authenticateToken, isModOrAdmin, async (req, res) => {
    try {
      const trustedUsers = await User.find({ isTrusted: true }).sort({ updatedAt: -1 }).limit(100).lean();
      
      const enrichedTrusted = await Promise.all(trustedUsers.map(async (user) => {
        const resolved = await resolveDiscordUser(client, user.id, user);
        return {
          ...user,
          displayName: resolved.displayName,
          id: user.id
        };
      }));

      res.json(enrichedTrusted);
    } catch (e) {
      res.status(500).json({ error: 'Failed to fetch trusted users' });
    }
  });

  app.get('/api/admin/user/:id', authenticateToken, isModOrAdmin, async (req, res) => {
    try {
      const rawInput = req.params.id || '';
      const { user } = await findUserByQuery(rawInput);
      if (!user) return res.status(404).json({ error: 'User or VRChat Account not found in database' });
      
      const userObj = (user as any).toObject ? (user as any).toObject() : user;
      const resolved = await resolveDiscordUser(client, user.id, userObj);

      res.json({ ...userObj, displayName: resolved.displayName });
    } catch (e) {
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  });

  app.post('/api/admin/user/:id/connect-vrchat', authenticateToken, isAdmin, async (req: any, res) => {
    try {
      const { vrchatUserId, vrchatUsername } = req.body;
      if (!vrchatUserId) return res.status(400).json({ error: 'VRChat User ID is required' });

      const user = await User.findOne({ id: req.params.id });
      if (!user) return res.status(404).json({ error: 'User not found' });

      const targetId = vrchatUserId.trim();
      let targetName = (vrchatUsername || '').trim();

      // Automatically fetch actual display name from the VRChat API
      const fetchedName = await serviceClient.fetchVRChatDisplayName(targetId).catch(() => null);
      if (fetchedName) {
        targetName = fetchedName;
      }

      // If there's no primary VRChat ID connected, make this the primary.
      if (!user.vrchatUserId || user.vrchatUserId === targetId) {
        user.vrchatUserId = targetId;
        user.vrchatUsername = targetName;
      } else {
        // If there is already a primary, add to alts if it doesn't exist
        const alreadyExistsInAlts = (user as any).vrchatAlts?.some((alt: any) => alt.vrchatUserId === targetId);
        if (!alreadyExistsInAlts) {
          if (!(user as any).vrchatAlts) {
            (user as any).vrchatAlts = [];
          }
          (user as any).vrchatAlts.push({ vrchatUserId: targetId, vrchatUsername: targetName });
        }
      }

      user.updatedAt = new Date();
      await user.save();

      if (user.isBanned) {
        await serviceClient.banVRChatUser(targetId, user.banReason || 'Global Ban synchronised');
      }

      await new Log({
        action: 'CONNECT_VRCHAT',
        adminId: req.user.username,
        targetId: user.id,
        details: `Connected VRChat Account: ${targetName} (${targetId}) (Multiple registry)`
      }).save();

      res.json({ success: true, user });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to connect VRChat account' });
    }
  });

  app.post('/api/admin/user/:id/disconnect-vrchat', authenticateToken, isAdmin, async (req: any, res) => {
    try {
      const { vrchatUserId } = req.body;
      if (!vrchatUserId) return res.status(400).json({ error: 'VRChat User ID is required' });

      const user = await User.findOne({ id: req.params.id });
      if (!user) return res.status(404).json({ error: 'User not found' });

      const targetId = vrchatUserId.trim();
      let removedName = '';

      if (user.vrchatUserId === targetId) {
        removedName = user.vrchatUsername || '';
        // If there's an alt, promote the first alt to primary
        const alts = (user as any).vrchatAlts || [];
        if (alts.length > 0) {
          const promo = alts[0];
          user.vrchatUserId = promo.vrchatUserId;
          user.vrchatUsername = promo.vrchatUsername;
          (user as any).vrchatAlts = alts.slice(1);
        } else {
          user.vrchatUserId = "";
          user.vrchatUsername = "";
        }
      } else {
        const alts = (user as any).vrchatAlts || [];
        const found = alts.find((alt: any) => alt.vrchatUserId === targetId);
        if (found) removedName = found.vrchatUsername || '';
        (user as any).vrchatAlts = alts.filter((alt: any) => alt.vrchatUserId !== targetId);
      }

      user.updatedAt = new Date();
      await user.save();

      // If user is banned, unban that specific connected account
      if (user.isBanned) {
        await serviceClient.unbanVRChatUser(targetId);
      }

      await new Log({
        action: 'DISCONNECT_VRCHAT',
        adminId: req.user.username,
        targetId: user.id,
        details: `Disconnected VRChat Account: ${removedName || 'Unknown'} (${targetId})`
      }).save();

      res.json({ success: true, user });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to disconnect VRChat account' });
    }
  });

  app.post('/api/admin/users/:id/update-vrchat-accounts', authenticateToken, isAdmin, async (req: any, res) => {
    try {
      const { vrchatUserId, vrchatUsername, vrchatAlts } = req.body;
      const user = await User.findOne({ id: req.params.id });
      if (!user) return res.status(404).json({ error: 'User not found' });

      const oldPrimaryId = user.vrchatUserId;
      const oldAlts = (user as any).vrchatAlts || [];
      const oldAllIds = new Set<string>();
      if (oldPrimaryId) oldAllIds.add(oldPrimaryId);
      for (const alt of oldAlts) {
        if (alt.vrchatUserId) oldAllIds.add(alt.vrchatUserId);
      }

      // Update primary
      user.vrchatUserId = (vrchatUserId || "").trim();
      let primaryName = (vrchatUsername || "").trim();
      if (user.vrchatUserId) {
        const fetchedPrimaryName = await serviceClient.fetchVRChatDisplayName(user.vrchatUserId).catch(() => null);
        if (fetchedPrimaryName) {
          primaryName = fetchedPrimaryName;
        }
      }
      user.vrchatUsername = primaryName;

      // Update alts
      const updatedAlts: any[] = [];
      if (Array.isArray(vrchatAlts)) {
        for (const alt of vrchatAlts) {
          const uid = (alt.vrchatUserId || "").trim();
          let uname = (alt.vrchatUsername || "").trim();
          if (uid) {
            const fetchedAltName = await serviceClient.fetchVRChatDisplayName(uid).catch(() => null);
            if (fetchedAltName) {
              uname = fetchedAltName;
            }
            updatedAlts.push({
              vrchatUserId: uid,
              vrchatUsername: uname,
              linkedAt: alt.linkedAt || new Date()
            });
          }
        }
      }
      (user as any).vrchatAlts = updatedAlts;
      user.updatedAt = new Date();
      await user.save();

      // Determine new IDs
      const newAllIds = new Set<string>();
      if (user.vrchatUserId) newAllIds.add(user.vrchatUserId);
      for (const alt of updatedAlts) {
        if (alt.vrchatUserId) newAllIds.add(alt.vrchatUserId);
      }

      // Unban removed IDs if the user is banned
      if (user.isBanned) {
        for (const oldId of oldAllIds) {
          if (!newAllIds.has(oldId)) {
            await serviceClient.unbanVRChatUser(oldId);
          }
        }
        for (const newId of newAllIds) {
          if (!oldAllIds.has(newId)) {
            await serviceClient.banVRChatUser(newId, user.banReason || 'Global Ban synchronised');
          }
        }
      }

      await new Log({
        action: 'UPDATE_VRCHAT_ACCOUNTS',
        adminId: req.user.username,
        targetId: user.id,
        details: `Updated VRChat accounts for user. Primary: ${user.vrchatUsername} (${user.vrchatUserId}), Alts count: ${updatedAlts.length}`
      }).save();

      res.json({ success: true, user });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to update VRChat accounts' });
    }
  });

  app.post(['/api/admin/vrchat/invite-bot', '/api/vrchat/invite-bot'], authenticateToken, async (req: any, res) => {
    try {
      let { groupId } = req.body;
      if (groupId) {
        groupId = extractVRChatGroupId(groupId);
      }
      if (!groupId || !groupId.startsWith('grp_')) {
        return res.status(400).json({ error: 'Valid VRChat Group ID starting with grp_ is required' });
      }

      const config = await SystemConfig.findOne({ id: 'main' });
      if (!config) {
        return res.status(400).json({ error: 'System Config has not been initialized.' });
      }

      const data = await serviceClient.assignVRChatGroup(groupId);
      
      await new Log({
        action: 'VRCHAT_BOT_INVITE',
        adminId: req.user.username,
        targetId: groupId,
        details: `Requested VRChat Bot to join Group: ${groupId}`
      }).save();

      res.json({ success: true, response: data });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to request VRChat group join' });
    }
  });

  app.post('/api/admin/reports/:id/update-reason', authenticateToken, isModOrAdmin, async (req: any, res) => {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ error: 'Reason required' });
    await Report.findByIdAndUpdate(req.params.id, { reason });
    res.json({ success: true });
  });

  app.post('/api/admin/users/:id/update-ban-reason', authenticateToken, isModOrAdmin, async (req: any, res) => {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ error: 'Reason required' });
    const user = await User.findOneAndUpdate(
      { id: req.params.id },
      { $set: { banReason: reason, updatedAt: new Date() } },
      { new: true }
    );
    if (user) {
      enforceGlobalBan(user.id, reason);
      await new Log({
        action: 'UPDATE_BAN_REASON',
        adminId: req.user.username,
        targetId: req.params.id,
        details: `Updated ban reason for ${req.params.id} to: ${reason}`
      }).save();
    }
    res.json({ success: true });
  });

  app.post('/api/admin/users/:id/toggle-dangerous', authenticateToken, isModOrAdmin, async (req: any, res) => {
    try {
      const user = await User.findOne({ id: req.params.id });
      if (!user) return res.status(404).json({ error: 'User not found' });
      
      user.isDangerous = !user.isDangerous;
      user.trustIndex = calculateDynamicTrustIndex({
        isDangerous: !!user.isDangerous,
        isBanned: !!user.isBanned,
        reputation: user.reputation || 0,
        isTrusted: !!user.isTrusted
      });
      user.updatedAt = new Date();

      await user.save();

      await new Log({
        action: 'TOGGLE_DANGEROUS',
        adminId: req.user.username,
        targetId: req.params.id,
        details: `${user.isDangerous ? 'Marked' : 'Unmarked'} as HIGHLY DANGEROUS: ${req.params.id}`
      }).save();

      res.json({ success: true, isDangerous: user.isDangerous, trustIndex: user.trustIndex });
    } catch (e) {
      res.status(500).json({ error: 'Failed to toggle status' });
    }
  });

  app.post('/api/admin/users/:id/refresh-saved-avatar', authenticateToken, isModOrAdmin, async (req: any, res) => {
    try {
      const { customAvatarUrl } = req.body || {};
      const user = await User.findOne({ id: req.params.id });
      if (!user) return res.status(404).json({ error: 'User not found' });

      let targetUrl = customAvatarUrl;
      if (!targetUrl) {
        const resolved = await resolveDiscordUser(client, user.id, user);
        targetUrl = resolved.avatarUrl || user.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png';
      }

      user.avatarUrl = targetUrl;
      user.updatedAt = new Date();
      await user.save();

      res.json({ success: true, avatarUrl: user.avatarUrl });
    } catch (e) {
      res.status(500).json({ error: 'Failed to refresh avatar' });
    }
  });

  app.post('/api/admin/users/:id/update-dangerous-notes', authenticateToken, isModOrAdmin, async (req: any, res) => {
    try {
      const { notes } = req.body;
      const user = await User.findOneAndUpdate(
        { id: req.params.id },
        { $set: { dangerousNotes: notes, updatedAt: new Date() } },
        { new: true }
      );
      if (!user) return res.status(404).json({ error: 'User not found' });

      await new Log({
        action: 'UPDATE_DANGEROUS_NOTES',
        adminId: req.user.username,
        targetId: req.params.id,
        details: `Updated dangerous notes for ${req.params.id}`
      }).save();

      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to update notes' });
    }
  });

  app.post('/api/admin/users/:id/update-trust-index', authenticateToken, isModOrAdmin, async (req: any, res) => {
    try {
      const { trustIndex } = req.body;
      const user = await User.findOneAndUpdate(
        { id: req.params.id },
        { $set: { trustIndex: trustIndex, updatedAt: new Date() } },
        { new: true }
      );
      if (!user) return res.status(404).json({ error: 'User not found' });

      await new Log({
        action: 'UPDATE_TRUST_INDEX',
        adminId: req.user.username,
        targetId: req.params.id,
        details: `Updated trust index for ${req.params.id} to ${trustIndex}`
      }).save();

      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to update trust index' });
    }
  });

  app.get('/api/admin/api-keys', authenticateToken, isModOrAdmin, async (req, res) => {
    try {
      const keys = await ApiKey.find({ isRevoked: { $ne: true } }).sort({ createdAt: -1 });
      res.json(keys);
    } catch (e) {
      res.status(500).json({ error: 'Failed to fetch API keys' });
    }
  });

  const handleRevokeKeyEndpoint = async (req: any, res: any) => {
    try {
      const reason = req.body?.reason || req.query?.reason || 'Manually revoked by administrator';
      const key = await ApiKey.findByIdAndUpdate(req.params.id, {
        $set: {
          isRevoked: true,
          revocationReason: reason,
          revokedAt: new Date()
        }
      }, { new: true });

      if (key) {
        const botDisplayName = key.botName || (key as any).applicationName || 'Bot';
        await new Log({
          action: 'API_KEY_REVOKED',
          adminId: req.user?.username || req.user?.id || 'Admin',
          targetId: key.botId || key._id.toString(),
          details: `Revoked API key for ${botDisplayName}. Reason: ${reason}`
        }).save().catch(() => null);

        if (key.ownerEmail) {
          try {
            const emailData = EmailTemplates.getApiKeyRevokedEmail(botDisplayName);
            await sendMail(key.ownerEmail, emailData.subject, emailData.text, emailData.html);
          } catch (mailErr) {
            console.error('Failed to send revocation notification email:', mailErr);
          }
        }

        res.json({ success: true, key });
      } else {
        res.status(404).json({ error: 'API key not found' });
      }
    } catch (e: any) {
      console.error('Error revoking API key:', e);
      res.status(500).json({ error: e?.message || 'Internal server error while revoking key' });
    }
  };

  app.delete('/api/admin/api-keys/:id', authenticateToken, isModOrAdmin, handleRevokeKeyEndpoint);
  app.post('/api/admin/api-keys/:id/revoke', authenticateToken, isModOrAdmin, handleRevokeKeyEndpoint);
  app.post('/api/admin/reports/:id/action', authenticateToken, isModOrAdmin, async (req: any, res) => {
    const { status, adminNotes } = req.body;
    const report = await Report.findById(req.params.id);
    
    if (report) {
      if (status === 'reviewed') {
        // Approve ban -> Create/Update structured BanCase in the new case system
        // 1. Move all evidence from all reports of this user to evidenceLinks
        const allReports = await Report.find({ targetUserId: report.targetUserId });
        const aggregatedEvidence = allReports
          .flatMap(r => r.evidenceLinks || [])
          .filter(e => e?.startsWith('http')); // Simple URL check

        // 2. Parse all linked VRChat accounts across all reports for this subject
        const vrchatAccountsToBan: Array<{ vrchatUserId: string; vrchatUsername: string }> = [];
        for (const r of allReports) {
          const raw = r.vrchatAccount || (r as any).vrchatAccount;
          if (raw && typeof raw === 'string' && raw.trim()) {
            const parsed = parseVRChatAccountString(raw);
            for (const item of parsed) {
              if (item.vrchatUserId || item.vrchatUsername) {
                vrchatAccountsToBan.push(item);
              }
            }
          }
        }

        // Build Discord & VRChat accounts for the BanCase
        const discordAccounts: any[] = [];
        if (report.targetUserId && !report.targetUserId.startsWith('usr_')) {
          discordAccounts.push({
            discordId: report.targetUserId,
            username: report.targetDisplayName || report.targetUserId,
            displayName: report.targetDisplayName || report.targetUserId
          });
        }

        const processedVRC: any[] = [];
        for (const item of vrchatAccountsToBan) {
          let vId = item.vrchatUserId;
          let vName = item.vrchatUsername;

          if (!vId && vName) {
            const resolved = await serviceClient.resolveVRChatUserBySearch(vName).catch(() => null);
            if (resolved && resolved.vrchatUserId) {
              vId = resolved.vrchatUserId;
              if (resolved.vrchatUsername) vName = resolved.vrchatUsername;
            }
          } else if (vId && !vName) {
            const fetchedName = await serviceClient.fetchVRChatDisplayName(vId).catch(() => null);
            if (fetchedName) vName = fetchedName;
          }

          if (vId && vId.startsWith('usr_') && !processedVRC.some(x => x.vrchatUserId === vId)) {
            processedVRC.push({
              vrchatUserId: vId,
              vrchatUsername: vName || vId,
              isPrimary: processedVRC.length === 0
            });
          }
        }

        // If targetUserId itself is a VRChat user ID
        if (report.targetUserId.startsWith('usr_') && !processedVRC.some(x => x.vrchatUserId === report.targetUserId)) {
          processedVRC.push({
            vrchatUserId: report.targetUserId,
            vrchatUsername: report.targetDisplayName || report.targetUserId,
            isPrimary: processedVRC.length === 0
          });
        }

        // Create or update the Ban Case in the new system
        const banCase = await createOrUpdateBanCase({
          title: `Reported: ${report.targetDisplayName || report.targetUserId}`,
          reason: report.reason,
          severity: 'permanent',
          discordAccounts,
          vrchatAccounts: processedVRC,
          evidenceLinks: Array.from(new Set(aggregatedEvidence)),
          notes: adminNotes ? `Admin review notes: ${adminNotes}` : `Created from approved safety report #${report._id}`
        }, req.user?.username || report.claimedBy || 'Moderator');

        console.log(`[Report Action] Created/Updated Ban Case #${banCase.caseNumber} for reported subject ${report.targetUserId}`);
      }

      // Send outcome notification to reporter (Discord DM if Discord user ID present, and/or Email if valid email address provided)
      const discordIdMatch = report.reporterUserId ? report.reporterUserId.match(/(\d{17,20})/) : null;
      const rawDiscordUserId = discordIdMatch ? discordIdMatch[1] : (report.reporterUserId && /^\d{17,20}$/.test(report.reporterUserId) ? report.reporterUserId : null);

      if (rawDiscordUserId && client) {
        try {
          const outcomeMessage = status === 'reviewed'
            ? `🛡️ **BeSafe Network: Safety Report Outcome**\n\nThank you for submitting a report. Your intelligence submission regarding Subject **${report.targetUserId}** has been processed.\n\n**OUTCOME:** ENFORCEMENT ACTION TAKEN\n\nBased on your evidence, our administrative team has issued a global ban case for this subject. Your contribution helps keep the ecosystem safe.`
            : `🛡️ **BeSafe Network: Safety Report Outcome**\n\nThank you for submitting a report. Your intelligence submission regarding Subject **${report.targetUserId}** has been processed.\n\n**OUTCOME:** NO ACTION TAKEN (DISMISSED)\n\nAfter careful review, our administrative team has determined that the provided evidence was insufficient for global enforcement action. This report has been archived.`;
          await serviceClient.sendDiscordDM(rawDiscordUserId, outcomeMessage);
        } catch (e) {
          console.error(`Failed to DM report outcome to Discord reporter ${report.reporterUserId}:`, e);
        }
      }

      if (report.reporterEmail && report.reporterEmail.includes('@') && !report.reporterEmail.endsWith('@discord.user') && !report.reporterEmail.endsWith('@besafe.network')) {
        try {
          const emailData = EmailTemplates.getReportOutcomeEmail(report.targetUserId, status);
          await sendMail(report.reporterEmail, emailData.subject, emailData.text, emailData.html);
        } catch (e) {
          console.error('Failed to send report outcome email:', e);
        }
      }

      await new Log({
        action: 'REPORT_ACTION',
        adminId: req.user.username,
        targetId: report.targetUserId,
        details: `Report ${req.params.id} marked as ${status}. Report record and all associated data permanently removed. ${status === 'reviewed' ? 'User added to new Ban Case system and evidence synchronized.' : ''}`
      }).save();

      // Completely remove report record and all its data upon review/dismissal
      await Report.findByIdAndDelete(req.params.id);
    }
    
    res.json({ success: true });
  });

  app.post('/api/admin/users/:id/reputation', authenticateToken, isModOrAdmin, async (req: any, res) => {
    try {
      const { score } = req.body;
      if (score === undefined) return res.status(400).json({ error: 'Score required' });
      const parsedScore = parseInt(score);
      if (isNaN(parsedScore)) return res.status(400).json({ error: 'Valid numeric score required' });

      const existingUser = await User.findOne({ id: req.params.id });
      if (!existingUser) return res.status(404).json({ error: 'User not found' });

      const activeCase = await BanCase.findOne({ 'discordAccounts.discordId': req.params.id, status: 'active' });
      existingUser.reputation = parsedScore;
      existingUser.trustIndex = calculateDynamicTrustIndex({
        isDangerous: !!existingUser.isDangerous || !!activeCase?.isDangerous,
        isBanned: !!existingUser.isBanned || !!activeCase,
        reputation: parsedScore,
        isTrusted: !!existingUser.isTrusted
      });
      existingUser.updatedAt = new Date();
      await existingUser.save();

      await new Log({
        action: 'MANUAL_REPUTATION_UPDATE',
        adminId: req.user.username,
        targetId: req.params.id,
        details: `Manually set reputation to ${parsedScore} (Trust Index: ${existingUser.trustIndex})`
      }).save();

      res.json({ success: true, reputation: existingUser.reputation, trustIndex: existingUser.trustIndex });
    } catch (e) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.post('/api/admin/appeals/:id/action', authenticateToken, isModOrAdmin, async (req: any, res) => {
    const { status, adminNotes } = req.body;
    const appeal = await Appeal.findById(req.params.id);
    
    if (appeal) {
      if (status === 'approved') {
        // Find linked active Ban Case if one exists
        const linkedCase = await BanCase.findOne({
          $or: [
            { caseNumber: appeal.userId.toUpperCase() },
            { caseNumber: appeal.userId },
            { 'discordAccounts.discordId': appeal.userId },
            { 'vrchatAccounts.vrchatUserId': appeal.userId }
          ],
          status: 'active'
        });

        if (linkedCase) {
          // Lift the entire ban case across all associated Discord and VRChat accounts
          await liftBanCase(
            linkedCase._id.toString(),
            req.user.username || 'System',
            `Appeal #${appeal._id} Approved: ${adminNotes || appeal.reason || 'Pardoned by Staff'}`
          );
        } else {
          // Fallback legacy unban
          await recordUnbanAndUnbanUser(
            appeal.userId,
            req.user.username || 'System',
            `Appeal #${appeal._id} Approved: ${adminNotes || 'Pardoned by Staff'}`
          );
        }
      } else if (status === 'denied') {
        // If appeal is denied, ensure the ban is recorded in the Ban Case system
        const existingCase = await BanCase.findOne({
          $or: [
            { caseNumber: appeal.userId.toUpperCase() },
            { caseNumber: appeal.userId },
            { 'discordAccounts.discordId': appeal.userId },
            { 'vrchatAccounts.vrchatUserId': appeal.userId }
          ]
        });

        if (!existingCase) {
          // Create Ban Case for the upheld ban
          const discordAccounts: any[] = [];
          if (appeal.userId && !appeal.userId.startsWith('usr_')) {
            discordAccounts.push({
              discordId: appeal.userId,
              username: appeal.userId,
              displayName: appeal.userId
            });
          }
          const vrchatAccounts: any[] = [];
          if (appeal.vrchatAccount) {
            vrchatAccounts.push({
              vrchatUserId: appeal.vrchatAccount,
              vrchatUsername: appeal.vrchatAccount,
              isPrimary: true
            });
          } else if (appeal.userId.startsWith('usr_')) {
            vrchatAccounts.push({
              vrchatUserId: appeal.userId,
              vrchatUsername: appeal.userId,
              isPrimary: true
            });
          }

          await createOrUpdateBanCase({
            title: `Upheld Ban: ${appeal.userId}`,
            reason: appeal.reason ? `Ban Appeal Denied: ${appeal.reason}` : 'Violations of Community Safety Standards (Appeal Denied)',
            severity: 'permanent',
            discordAccounts,
            vrchatAccounts,
            notes: adminNotes ? `Admin notes on appeal denial: ${adminNotes}` : `Appeal #${appeal._id} denied by ${req.user?.username || 'Moderator'}`
          }, req.user?.username || 'Staff').catch(err => console.error('Failed to create BanCase on appeal denial:', err));
        }
      }

      // Send email notification to user
      try {
        if (appeal.email) {
          const emailData = EmailTemplates.getAppealOutcomeEmail(appeal.userId, status, adminNotes);
          await sendMail(appeal.email, emailData.subject, emailData.text, emailData.html);
        }
      } catch (e) {
        console.error('Failed to send appeal outcome email:', e);
      }

      await new Log({
        action: 'APPEAL_ACTION',
        adminId: req.user.username,
        targetId: appeal.userId,
        details: `Appeal ${req.params.id} marked as ${status}. Case record and all associated data permanently removed. ${status === 'approved' ? 'Linked Ban Case lifted and all accounts unbanned.' : 'Ban upheld and registered in Ban Case system.'}`
      }).save();

      // Completely delete case record and all its data from database upon approval or denial
      await Appeal.findByIdAndDelete(req.params.id);
    }
    
    res.json({ success: true });
  });

  app.post('/api/admin/users/:id/reset-reputation', authenticateToken, isAdmin, async (req: any, res) => {
    const existingUser = await User.findOne({ id: req.params.id });
    if (existingUser) {
      const activeCase = await BanCase.findOne({ 'discordAccounts.discordId': req.params.id, status: 'active' });
      existingUser.reputation = 0;
      existingUser.trustIndex = calculateDynamicTrustIndex({
        isDangerous: !!existingUser.isDangerous || !!activeCase?.isDangerous,
        isBanned: !!existingUser.isBanned || !!activeCase,
        reputation: 0,
        isTrusted: !!existingUser.isTrusted
      });
      existingUser.updatedAt = new Date();
      await existingUser.save();

      await new Log({
        action: 'RESET_REPUTATION',
        adminId: req.user.username,
        targetId: req.params.id,
        details: `Reset reputation for user ${req.params.id} (Trust Index: ${existingUser.trustIndex})`
      }).save();
    }
    res.json({ success: true, reputation: 0, trustIndex: existingUser?.trustIndex || 'ALL CLEAR' });
  });

  app.post('/api/admin/users/:id/warn', authenticateToken, isModOrAdmin, async (req: any, res) => {
    try {
      const { reason, guildId } = req.body;
      if (!reason) return res.status(400).json({ error: 'Warning reason is required' });

      let user = await User.findOne({ id: req.params.id });
      if (!user) {
        user = new User({ id: req.params.id, username: req.params.id });
      }

      const warning = {
        reason,
        adminId: req.user.username || 'Admin',
        guildId: guildId || 'Global Dashboard',
        timestamp: new Date()
      };

      if (!user.warnings) {
        (user as any).warnings = [warning];
      } else {
        (user.warnings as any).push(warning);
      }
      user.updatedAt = new Date();
      await user.save();

      await new Log({
        action: 'ISSUE_WARNING',
        adminId: req.user.username,
        targetId: req.params.id,
        details: `Issued warning to user ${req.params.id}: ${reason}`
      }).save();

      res.json({ success: true, warnings: user.warnings });
    } catch (e) {
      res.status(500).json({ error: 'Failed to issue warning' });
    }
  });

  app.post('/api/admin/users/:id/toggle-trusted', authenticateToken, isAdmin, async (req: any, res) => {
    const user = await User.findOne({ id: req.params.id });
    if (user) {
      user.isTrusted = !user.isTrusted;
      if (user.isTrusted) user.reputation = 100;
      user.trustIndex = calculateDynamicTrustIndex({
        isDangerous: !!user.isDangerous,
        isBanned: !!user.isBanned,
        reputation: user.reputation || 0,
        isTrusted: !!user.isTrusted
      });
      user.updatedAt = new Date();
      await user.save();

      await new Log({
        action: 'TOGGLE_TRUSTED',
        adminId: req.user.username,
        targetId: req.params.id,
        details: `${user.isTrusted ? 'Granted' : 'Revoked'} trusted rank for user ${req.params.id} (Trust Index: ${user.trustIndex})`
      }).save();
    }
    res.json({ success: true, isTrusted: user?.isTrusted, trustIndex: user?.trustIndex });
  });

  app.post('/api/admin/users/trusted/add', authenticateToken, isAdmin, async (req: any, res) => {
    try {
      const { userId, reason } = req.body;
      if (!userId) return res.status(400).json({ error: 'User ID is required' });

      let displayName = userId;
      let avatarUrl = '';
      try {
        const discordUser = await serviceClient.fetchDiscordUser(userId);
        displayName = discordUser?.displayName || discordUser?.global_name || discordUser?.username || userId;
        avatarUrl = discordUser?.avatarUrl || (discordUser?.avatar ? `https://cdn.discordapp.com/avatars/${userId}/${discordUser.avatar}.png?size=128` : '');
      } catch (e) {}

      let user = await User.findOne({ id: userId });
      const wasBanned = user?.isBanned;
      const oldBanReason = user?.banReason;
      const oldBannedAt = user?.bannedAt;

      const trustedUnbanReason = `Granted Trusted Whitelist (${reason || 'No reason specified'})`;
      if (wasBanned) await enforceGlobalUnban(userId, trustedUnbanReason);

      if (!user) {
        user = new User({ id: userId });
      }

      user.isTrusted = true;
      user.reputation = 100;
      user.trustIndex = 'TRUSTED';
      user.username = displayName;
      if (avatarUrl) user.avatarUrl = avatarUrl;

      if (wasBanned) {
        const unbanRecord = {
          bandate: oldBannedAt || user.updatedAt || user.createdAt || new Date(),
          unbandate: new Date(),
          banreason: oldBanReason || 'Prior Global Ban',
          username: displayName || user.username || userId,
          unbannedBy: req.user.username || 'Admin',
          unbanReason: `Granted Trusted Whitelist (${reason || 'No reason specified'})`
        };
        if (!user.unbanHistory) {
          (user as any).unbanHistory = [unbanRecord];
        } else {
          (user.unbanHistory as any).push(unbanRecord);
        }
      }

      user.isBanned = false;
      user.banReason = undefined;
      user.updatedAt = new Date();
      await user.save();

      await new Log({
        action: 'GRANT_TRUSTED',
        adminId: req.user.username,
        targetId: userId,
        details: `Manually added trusted user ${userId}. Reason/Notes: ${reason || 'None'}`
      }).save();

      res.json({ success: true, user: { ...user.toObject(), displayName } });
    } catch (e: any) {
      console.error('Failed to manually trust user:', e);
      res.status(503).json({ error: e?.message || 'Failed to trust user' });
    }
  });

  app.post('/api/admin/bans/manual', authenticateToken, isAdmin, async (req: any, res) => {
    try {
      const { userId, reason } = req.body;
      if (!userId || !reason) return res.status(400).json({ error: 'User ID and reason required' });

      const rawId = userId.trim();
      const discordAccounts: any[] = [];
      const vrchatAccounts: any[] = [];

      if (rawId.startsWith('usr_')) {
        vrchatAccounts.push({
          vrchatUserId: rawId,
          vrchatUsername: rawId,
          isPrimary: true
        });
      } else {
        discordAccounts.push({
          discordId: rawId,
          username: rawId,
          displayName: rawId
        });
      }

      const banCase = await createOrUpdateBanCase({
        title: `Manual Global Ban: ${rawId}`,
        reason: reason.trim(),
        severity: 'permanent',
        discordAccounts,
        vrchatAccounts,
        bannedBy: req.user?.username || 'Admin',
        notes: `Manually enrolled ban case by ${req.user?.username || 'Admin'}`
      }, req.user?.username || 'Admin');

      await new Log({
        action: 'MANUAL_BAN',
        adminId: req.user.username,
        targetId: rawId,
        details: `Created Ban Case #${banCase.caseNumber} for subject ${rawId}. Reason: ${reason}`
      }).save();

      res.json({ success: true, banCase });
    } catch (error: any) {
      console.error('[Manual Ban] Enforcement failed:', error?.message || error);
      res.status(503).json({ error: error?.message || 'Failed to enforce the ban in Discord.' });
    }
  });

  // Staff & Moderator Management Endpoints
  app.get('/api/admin/staff', authenticateToken, isAdmin, async (req, res) => {
    try {
      const staff = await Admin.find().select('-password').sort({ createdAt: -1 });
      res.json(staff);
    } catch (e) {
      res.status(500).json({ error: 'Failed to fetch staff list' });
    }
  });

  app.post('/api/admin/staff/:id/role', authenticateToken, isAdmin, async (req: any, res) => {
    try {
      const { role } = req.body;
      if (!['admin', 'moderator', 'user'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role provided' });
      }

      const targetUser = await Admin.findById(req.params.id);
      if (!targetUser) return res.status(404).json({ error: 'User account not found' });

      if (targetUser.role === 'admin' && role !== 'admin') {
        const adminCount = await Admin.countDocuments({ role: 'admin' });
        if (adminCount <= 1) {
          return res.status(400).json({ error: 'Cannot demote the sole system administrator' });
        }
      }

      targetUser.role = role;
      await targetUser.save();

      await new Log({
        action: 'UPDATE_STAFF_ROLE',
        adminId: req.user.username,
        targetId: targetUser.username,
        details: `Updated role for ${targetUser.username} to: ${role}`
      }).save();

      res.json({ success: true, role: targetUser.role });
    } catch (e) {
      res.status(500).json({ error: 'Failed to update user role' });
    }
  });

  app.post('/api/admin/staff/:id/verify', authenticateToken, isAdmin, async (req: any, res) => {
    try {
      const { isEmailVerified, isAgeVerified, dob } = req.body;
      const targetUser = await Admin.findById(req.params.id);
      if (!targetUser) return res.status(404).json({ error: 'User account not found' });

      const changes: string[] = [];
      if (typeof isEmailVerified === 'boolean') {
        targetUser.isEmailVerified = isEmailVerified;
        if (isEmailVerified) {
          targetUser.emailVerificationToken = undefined;
        }
        changes.push(`Email Verified = ${isEmailVerified ? 'YES' : 'NO'}`);
      }

      if (typeof isAgeVerified === 'boolean') {
        targetUser.isAgeVerified = isAgeVerified;
        if (isAgeVerified) {
          targetUser.ageVerifiedAt = new Date();
          if (dob) {
            targetUser.dob = new Date(dob);
          } else if (!targetUser.dob) {
            targetUser.dob = new Date('2000-01-01');
          }
        } else {
          targetUser.ageVerifiedAt = undefined;
        }
        changes.push(`Age Verified (18+) = ${isAgeVerified ? 'YES' : 'NO'}`);

        if (targetUser.discordId) {
          await User.findOneAndUpdate(
            { id: targetUser.discordId },
            {
              $set: {
                isAgeVerified,
                ...(isAgeVerified
                  ? { ageVerifiedAt: targetUser.ageVerifiedAt, dob: targetUser.dob }
                  : { ageVerifiedAt: null })
              }
            },
            { upsert: true }
          ).catch(() => null);
        }
      }

      await targetUser.save();

      await new Log({
        action: 'MANUAL_ACCOUNT_VERIFY',
        adminId: req.user?.username || 'Admin',
        targetId: targetUser.username,
        details: `Manually updated verification status for ${targetUser.username} (${targetUser.email}): ${changes.join(', ')}`
      }).save().catch(() => null);

      const sanitized = targetUser.toObject();
      delete (sanitized as any).password;
      res.json({
        success: true,
        account: sanitized,
        message: `Updated verification status for ${targetUser.username} (${changes.join(', ')}).`
      });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'Failed to update verification status' });
    }
  });

  app.post('/api/admin/staff/:id/resend-verification', authenticateToken, isAdmin, async (_req: any, res) => {
    res.status(403).json({ error: 'Email verification is disabled.' });
  });

  app.post('/api/admin/staff/:id/ban', authenticateToken, isAdmin, async (req: any, res) => {
    try {
      const { isBanned, reason } = req.body;
      const targetUser = await Admin.findById(req.params.id);
      if (!targetUser) return res.status(404).json({ error: 'User account not found' });

      const shouldBan = typeof isBanned === 'boolean' ? isBanned : !targetUser.isBanned;

      if (shouldBan) {
        if (String(targetUser._id) === String(req.user?.id) || targetUser.username === req.user?.username) {
          return res.status(400).json({ error: 'You cannot block your own administrator account' });
        }
        if (targetUser.role === 'admin') {
          const activeAdminCount = await Admin.countDocuments({ role: 'admin', isBanned: { $ne: true } });
          if (activeAdminCount <= 1) {
            return res.status(400).json({ error: 'Cannot block the sole active system administrator' });
          }
        }
      }

      const banReasonText = String(reason || '').trim() || 'Violation of BeSafe Network Terms of Service or Safety Policies';
      targetUser.isBanned = shouldBan;
      targetUser.banReason = shouldBan ? banReasonText : '';
      targetUser.bannedAt = shouldBan ? new Date() : undefined;
      targetUser.bannedBy = shouldBan ? (req.user?.username || 'Admin') : '';
      await targetUser.save();

      const baseUrl = getBaseUrl(req);
      let emailSent = false;
      if (targetUser.email) {
        if (shouldBan) {
          const emailData = EmailTemplates.getAccountBannedEmail(
            targetUser.username,
            banReasonText,
            `${baseUrl}/appeal`
          );
          const mailResult = await sendMail(targetUser.email, emailData.subject, emailData.text, emailData.html);
          emailSent = Boolean(mailResult?.sent);
        } else {
          const emailData = EmailTemplates.getAccountUnbannedEmail(
            targetUser.username,
            `${baseUrl}/login`
          );
          const mailResult = await sendMail(targetUser.email, emailData.subject, emailData.text, emailData.html);
          emailSent = Boolean(mailResult?.sent);
        }
      }

      await new Log({
        action: shouldBan ? 'ACCOUNT_BLOCKED' : 'ACCOUNT_UNBLOCKED',
        adminId: req.user?.username || 'Admin',
        targetId: targetUser.username,
        details: shouldBan
          ? `Blocked account ${targetUser.username} (${targetUser.email}). Reason: ${banReasonText}. Ban email sent: ${emailSent}`
          : `Unblocked account ${targetUser.username} (${targetUser.email}). Notification email sent: ${emailSent}`
      }).save().catch(() => null);

      const sanitized = targetUser.toObject();
      delete (sanitized as any).password;
      res.json({
        success: true,
        account: sanitized,
        emailSent,
        message: shouldBan
          ? `Account ${targetUser.username} has been blocked${emailSent ? ` and a ban notification email was sent to ${targetUser.email}` : ''}.`
          : `Account ${targetUser.username} has been unblocked${emailSent ? ` and a restoration email was sent to ${targetUser.email}` : ''}.`
      });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'Failed to update account block status' });
    }
  });

  app.post('/api/admin/bans/remove', authenticateToken, isAdmin, async (req: any, res) => {
    try {
      const { userId, unbanReason } = req.body;
      if (!userId) return res.status(400).json({ error: 'User ID required' });

      const rawId = userId.trim();
      const banCase = await BanCase.findOne({
        $or: [
          { caseNumber: rawId.toUpperCase() },
          { caseNumber: rawId },
          { 'discordAccounts.discordId': rawId },
          { 'vrchatAccounts.vrchatUserId': rawId }
        ],
        status: 'active'
      });

      if (banCase) {
        await liftBanCase(
          banCase._id.toString(),
          req.user?.username || 'Admin',
          unbanReason || 'Manual Admin Unban'
        );
      } else if (rawId.startsWith('usr_')) {
        const linkedUser = await User.findOne({
          $or: [{ vrchatUserId: rawId }, { 'vrchatAlts.vrchatUserId': rawId }],
        });
        if (linkedUser) {
          await recordUnbanAndUnbanUser(
            linkedUser.id,
            req.user?.username || 'Admin',
            unbanReason || 'Manual Admin Unban'
          );
        } else {
          await serviceClient.unbanVRChatUser(rawId);
        }
      } else {
        await recordUnbanAndUnbanUser(
          rawId,
          req.user?.username || 'Admin',
          unbanReason || 'Manual Admin Unban'
        );
      }

      await new Log({
        action: 'MANUAL_UNBAN',
        adminId: req.user.username,
        targetId: rawId,
        details: `Manually unbanned user ${rawId}`
      }).save();

      res.json({ success: true });
    } catch (err: any) {
      console.error('[Manual Unban] Enforcement failed:', err?.message || err);
      res.status(503).json({ error: err?.message || 'Failed to unban user in Discord.' });
    }
  });

  
}
