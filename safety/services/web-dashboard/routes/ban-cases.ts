import express from 'express';
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

export function registerBanCasesRoutes(app: express.Express, context: any) {
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

// --- Ban Cases API Endpoints ---
  app.get('/api/admin/ban-cases', authenticateToken, isModOrAdmin, async (req, res) => {
    try {
      const { status, search } = req.query;
      const filter: any = {};
      
      if (status && status !== 'all') {
        filter.status = status;
      }

      if (search && typeof search === 'string' && search.trim()) {
        const queryTerm = search.trim();
        const regex = new RegExp(queryTerm, 'i');
        filter.$or = [
          { caseNumber: regex },
          { title: regex },
          { reason: regex },
          { 'discordAccounts.discordId': regex },
          { 'discordAccounts.username': regex },
          { 'vrchatAccounts.vrchatUserId': regex },
          { 'vrchatAccounts.vrchatUsername': regex }
        ];
      }

      const cases = await BanCase.find(filter).sort({ createdAt: -1 }).limit(200).lean();
      res.json(cases);
    } catch (e: any) {
      console.error('Failed to fetch ban cases:', e);
      res.status(500).json({ error: 'Failed to fetch ban cases' });
    }
  });

  app.get('/api/admin/ban-cases/:id', authenticateToken, isModOrAdmin, async (req, res) => {
    try {
      const idOrNumber = req.params.id;
      let banCase = null;
      if (mongoose.Types.ObjectId.isValid(idOrNumber)) {
        banCase = await BanCase.findById(idOrNumber).lean();
      }
      if (!banCase) {
        banCase = await BanCase.findOne({ caseNumber: idOrNumber.toUpperCase() }).lean();
      }

      if (!banCase) {
        return res.status(404).json({ error: 'Ban case not found' });
      }

      res.json(banCase);
    } catch (e: any) {
      res.status(500).json({ error: 'Failed to fetch ban case' });
    }
  });

  app.post('/api/admin/ban-cases', authenticateToken, isAdmin, async (req: any, res) => {
    try {
      const {
        title,
        reason,
        severity,
        notes,
        evidenceLinks,
        discordAccounts,
        vrchatAccounts
      } = req.body;

      if (!reason || !reason.trim()) {
        return res.status(400).json({ error: 'Ban reason is required' });
      }

      const hasDiscord = Array.isArray(discordAccounts) && discordAccounts.some((d: any) => d && (d.discordId || d.id));
      const hasVRChat = Array.isArray(vrchatAccounts) && vrchatAccounts.some((v: any) => v && (v.vrchatUserId || v.vrchatUsername || v.id));

      if (!hasDiscord && !hasVRChat) {
        return res.status(400).json({ error: 'At least one Discord account or VRChat account must be linked to the ban case' });
      }

      const banCase = await createOrUpdateBanCase({
        title,
        reason,
        severity: severity || 'permanent',
        notes,
        evidenceLinks: Array.isArray(evidenceLinks) ? evidenceLinks : [],
        discordAccounts: Array.isArray(discordAccounts) ? discordAccounts : [],
        vrchatAccounts: Array.isArray(vrchatAccounts) ? vrchatAccounts : [],
        bannedBy: req.user?.username || 'Administrator'
      });

      await new Log({
        action: 'CREATE_BAN_CASE',
        adminId: req.user.username,
        targetId: banCase.caseNumber,
        details: `Created Ban Case #${banCase.caseNumber}: ${banCase.reason} (${banCase.discordAccounts.length} Discord accounts, ${banCase.vrchatAccounts.length} VRChat accounts)`
      }).save();

      res.json({ success: true, banCase });
    } catch (e: any) {
      console.error('Error creating ban case:', e);
      res.status(500).json({ error: e?.message || 'Failed to create ban case' });
    }
  });

  app.post('/api/admin/ban-cases/:id/unban', authenticateToken, isAdmin, async (req: any, res) => {
    try {
      const { unbanReason } = req.body;
      const updatedCase = await liftBanCase(
        req.params.id,
        req.user?.username || 'Administrator',
        unbanReason || 'Administrative pardon - Ban Case lifted'
      );

      if (!updatedCase) {
        return res.status(404).json({ error: 'Ban case not found' });
      }

      await new Log({
        action: 'LIFT_BAN_CASE',
        adminId: req.user.username,
        targetId: updatedCase.caseNumber,
        details: `Lifted Ban Case #${updatedCase.caseNumber}. All linked accounts unbanned. Reason: ${unbanReason || 'Ban Case lifted'}`
      }).save();

      res.json({ success: true, banCase: updatedCase });
    } catch (e: any) {
      console.error('Error lifting ban case:', e);
      res.status(500).json({ error: e?.message || 'Failed to lift ban case' });
    }
  });

  app.post('/api/admin/ban-cases/:id/reban', authenticateToken, isAdmin, async (req: any, res) => {
    try {
      const { reason } = req.body;
      const updatedCase = await rebanBanCase(
        req.params.id,
        req.user?.username || 'Administrator',
        reason
      );

      if (!updatedCase) {
        return res.status(404).json({ error: 'Ban case not found' });
      }

      await new Log({
        action: 'REBAN_BAN_CASE',
        adminId: req.user.username,
        targetId: updatedCase.caseNumber,
        details: `Reinstated Ban Case #${updatedCase.caseNumber} across all linked accounts.`
      }).save();

      res.json({ success: true, banCase: updatedCase });
    } catch (e: any) {
      console.error('Error rebanning ban case:', e);
      res.status(500).json({ error: e?.message || 'Failed to reinstate ban case' });
    }
  });

  app.all(['/api/admin/ban-cases/:id', '/api/admin/ban-cases/:id/edit'], authenticateToken, isModOrAdmin, async (req: any, res, next) => {
    if (req.method !== 'PUT' && req.method !== 'PATCH' && !(req.method === 'POST' && req.path.endsWith('/edit'))) {
      return next();
    }
    try {
      const idOrNumber = req.params.id;
      let banCase = null;
      if (mongoose.Types.ObjectId.isValid(idOrNumber)) {
        banCase = await BanCase.findById(idOrNumber);
      }
      if (!banCase) {
        banCase = await BanCase.findOne({ caseNumber: idOrNumber.toUpperCase() });
      }
      if (!banCase) {
        return res.status(404).json({ error: 'Ban case not found' });
      }

      const {
        title,
        reason,
        severity,
        notes,
        internalNotes,
        evidenceLinks,
        evidence,
        isDangerous,
        dangerousNotes,
        discordAccounts,
        vrchatAccounts
      } = req.body;

      if (reason !== undefined && !String(reason).trim()) {
        return res.status(400).json({ error: 'Ban reason cannot be empty' });
      }

      if (title !== undefined) {
        banCase.title = String(title).trim();
      }
      if (reason !== undefined) {
        banCase.reason = String(reason).trim();
      }
      if (severity !== undefined && ['permanent', 'temporary', 'critical', 'warning'].includes(String(severity).toLowerCase())) {
        banCase.severity = String(severity).toLowerCase() as any;
      }
      if (notes !== undefined || internalNotes !== undefined) {
        banCase.notes = String(notes !== undefined ? notes : internalNotes).trim();
      }
      if (evidenceLinks !== undefined || evidence !== undefined) {
        const rawEvidence = evidenceLinks !== undefined ? evidenceLinks : evidence;
        if (Array.isArray(rawEvidence)) {
          banCase.evidenceLinks = rawEvidence.map((item: any) => String(item).trim()).filter(Boolean);
        } else if (typeof rawEvidence === 'string') {
          banCase.evidenceLinks = rawEvidence
            .split(/[\n,]+/)
            .map((s) => s.trim())
            .filter(Boolean);
        }
      }
      if (isDangerous !== undefined) {
        banCase.isDangerous = Boolean(isDangerous);
      }
      if (dangerousNotes !== undefined) {
        banCase.dangerousNotes = String(dangerousNotes).trim();
      }

      // Update linked Discord account names & notes
      if (Array.isArray(discordAccounts)) {
        const updatedDiscord = banCase.discordAccounts.map((existing: any) => {
          const match = discordAccounts.find((d: any) => d.discordId === existing.discordId);
          if (match) {
            return {
              ...(existing.toObject ? existing.toObject() : existing),
              username: match.username !== undefined ? String(match.username).trim() : existing.username,
              displayName: match.displayName !== undefined ? String(match.displayName).trim() : (match.username !== undefined ? String(match.username).trim() : existing.displayName),
              notes: match.notes !== undefined ? String(match.notes).trim() : (existing.notes || '')
            };
          }
          return existing;
        });
        banCase.discordAccounts = updatedDiscord as any;
      }

      // Update linked VRChat account display names & notes
      if (Array.isArray(vrchatAccounts)) {
        const updatedVrchat = banCase.vrchatAccounts.map((existing: any) => {
          const match = vrchatAccounts.find((v: any) =>
            (v.vrchatUserId && v.vrchatUserId === existing.vrchatUserId) ||
            (!existing.vrchatUserId && v.vrchatUsername === existing.vrchatUsername)
          );
          if (match) {
            return {
              ...(existing.toObject ? existing.toObject() : existing),
              vrchatUsername: match.vrchatUsername !== undefined
                ? String(match.vrchatUsername).trim()
                : (match.displayName !== undefined ? String(match.displayName).trim() : existing.vrchatUsername),
              notes: match.notes !== undefined ? String(match.notes).trim() : (existing.notes || '')
            };
          }
          return existing;
        });
        banCase.vrchatAccounts = updatedVrchat as any;
      }

      banCase.trustIndex = calculateDynamicTrustIndex({
        isDangerous: banCase.isDangerous,
        isBanned: banCase.status === 'active',
        severity: banCase.severity
      });
      banCase.updatedAt = new Date();
      await banCase.save();

      // Synchronize updated case fields to all linked User records
      if (Array.isArray(banCase.discordAccounts)) {
        for (const disc of banCase.discordAccounts) {
          if (disc.discordId) {
            const updatePayload: any = {
              banReason: banCase.reason,
              banType: banCase.severity,
              evidenceLinks: banCase.evidenceLinks,
              isDangerous: banCase.isDangerous,
              dangerousNotes: banCase.dangerousNotes,
              trustIndex: banCase.trustIndex,
              updatedAt: new Date()
            };
            if (disc.username) {
              updatePayload.username = disc.username;
            }
            await User.findOneAndUpdate(
              { id: disc.discordId },
              { $set: updatePayload }
            ).catch(() => null);
          }
        }
      }

      if (Array.isArray(banCase.vrchatAccounts)) {
        for (const vrc of banCase.vrchatAccounts) {
          if (vrc.vrchatUserId && vrc.vrchatUsername) {
            await User.updateMany(
              { vrchatUserId: vrc.vrchatUserId },
              { $set: { vrchatUsername: vrc.vrchatUsername, updatedAt: new Date() } }
            ).catch(() => null);
          }
        }
      }

      await new Log({
        action: 'EDIT_BAN_CASE',
        adminId: req.user?.username || 'Administrator',
        targetId: banCase.caseNumber,
        details: `Edited Ban Case #${banCase.caseNumber} (${banCase.title || 'Untitled'}): ${banCase.reason}`
      }).save().catch(() => null);

      res.json({ success: true, banCase });
    } catch (e: any) {
      console.error('Error editing ban case:', e);
      res.status(500).json({ error: e?.message || 'Failed to update ban case' });
    }
  });

  app.post('/api/admin/ban-cases/:id/add-account', authenticateToken, isAdmin, async (req: any, res) => {
    try {
      const { type, id, username, notes } = req.body;
      if (!type || !id) {
        return res.status(400).json({ error: 'Account type and ID are required' });
      }

      let updatedCase = await addAccountToBanCase(
        req.params.id,
        { type, id, name: username },
        req.user?.username || 'Administrator'
      );

      if (!updatedCase) {
        return res.status(404).json({ error: 'Ban case not found' });
      }

      if (notes && String(notes).trim()) {
        const caseDoc = await BanCase.findById(updatedCase._id);
        if (caseDoc) {
          if (type === 'discord') {
            const target = caseDoc.discordAccounts.find((d: any) => d.discordId === id.trim());
            if (target) (target as any).notes = String(notes).trim();
          } else if (type === 'vrchat') {
            const target = caseDoc.vrchatAccounts.find((v: any) => v.vrchatUserId === id.trim() || v.vrchatUsername === id.trim());
            if (target) (target as any).notes = String(notes).trim();
          }
          await caseDoc.save();
          updatedCase = caseDoc.toObject();
        }
      }

      await new Log({
        action: 'ADD_ACCOUNT_TO_BAN_CASE',
        adminId: req.user.username,
        targetId: updatedCase.caseNumber,
        details: `Added ${type.toUpperCase()} account (${id}) to Ban Case #${updatedCase.caseNumber}`
      }).save();

      res.json({ success: true, banCase: updatedCase });
    } catch (e: any) {
      console.error('Error adding account to ban case:', e);
      res.status(500).json({ error: e?.message || 'Failed to add account to ban case' });
    }
  });

  app.post('/api/admin/ban-cases/:id/remove-account', authenticateToken, isAdmin, async (req: any, res) => {
    try {
      const { type, id } = req.body;
      if (!type || !id) {
        return res.status(400).json({ error: 'Account type and ID are required' });
      }

      const updatedCase = await removeAccountFromBanCase(
        req.params.id,
        id,
        type,
        req.user?.username || 'Administrator'
      );

      if (!updatedCase) {
        return res.status(404).json({ error: 'Ban case not found' });
      }

      await new Log({
        action: 'REMOVE_ACCOUNT_FROM_BAN_CASE',
        adminId: req.user.username,
        targetId: updatedCase.caseNumber,
        details: `Removed and unbanned ${type.toUpperCase()} account (${id}) from Ban Case #${updatedCase.caseNumber}`
      }).save();

      res.json({ success: true, banCase: updatedCase });
    } catch (e: any) {
      console.error('Error removing account from ban case:', e);
      res.status(500).json({ error: e?.message || 'Failed to remove account from ban case' });
    }
  });

  app.delete('/api/admin/ban-cases/:id', authenticateToken, isAdmin, async (req: any, res) => {
    try {
      const banCase = await BanCase.findById(req.params.id);
      if (!banCase) {
        return res.status(404).json({ error: 'Ban case not found' });
      }

      // If active, lift the bans first to keep database clean
      if (banCase.status === 'active') {
        await liftBanCase(
          req.params.id,
          req.user?.username || 'Administrator',
          'Ban case deleted by administrator'
        );
      }

      await BanCase.findByIdAndDelete(req.params.id);

      await new Log({
        action: 'DELETE_BAN_CASE',
        adminId: req.user.username,
        targetId: banCase.caseNumber,
        details: `Permanently deleted Ban Case #${banCase.caseNumber}`
      }).save();

      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: 'Failed to delete ban case' });
    }
  });

  app.post('/api/admin/ban-cases/migrate-legacy', authenticateToken, isAdmin, async (req: any, res) => {
    try {
      const result = await migrateLegacyBansToBanCases(req.user?.username || 'Admin');
      await new Log({
        action: 'MIGRATE_LEGACY_BANS',
        adminId: req.user.username,
        targetId: 'ALL_LEGACY_BANS',
        details: `Migrated ${result.migratedCount} legacy bans out of ${result.totalBanned} into unified Ban Cases and cleared legacy ban list (${result.clearedCount} records cleared).`
      }).save();

      res.json({
        success: true,
        migratedCount: result.migratedCount,
        totalBanned: result.totalBanned,
        clearedCount: result.clearedCount,
        message: `Successfully migrated ${result.migratedCount} legacy bans into unified Ban Cases and cleared the old ban list.`
      });
    } catch (e: any) {
      console.error('Error during legacy ban migration:', e);
      res.status(500).json({ error: e?.message || 'Failed to migrate legacy bans' });
    }
  });

  app.post('/api/admin/bans/clear-legacy', authenticateToken, isAdmin, async (req: any, res) => {
    try {
      const clearedCount = await cleanupUserDatabaseForTrustedOnly();

      await new Log({
        action: 'CLEAR_LEGACY_BAN_LIST',
        adminId: req.user.username,
        targetId: 'LEGACY_BANS',
        details: `Manually cleared old legacy ban list and purged User database for trusted members only (${clearedCount} non-trusted records removed).`
      }).save();

      res.json({
        success: true,
        clearedCount,
        message: `Old ban list cleared. User database purged and strictly reserved for trusted members.`
      });
    } catch (e: any) {
      console.error('Error clearing legacy bans:', e);
      res.status(500).json({ error: 'Failed to clear legacy ban list' });
    }
  });

  app.post('/api/admin/bans/sync-all', authenticateToken, isAdmin, async (req: any, res) => {
    try {
      const syncResult = await syncAllBansAcrossPlatforms();
      const skippedCount = syncResult.skippedCount || 0;
      const skippedSuffix = skippedCount > 0 ? ` (${skippedCount} invalid or unreachable entries skipped)` : '';
      await new Log({
        action: 'CROSS_PLATFORM_BAN_SYNC',
        adminId: req.user.username,
        targetId: 'ALL_BAN_CASES',
        details: `Synchronized ${syncResult.activeCasesCount} active Ban Cases across Discord (${syncResult.discordBansCount} accounts) and VRChat (${syncResult.vrchatBansCount} accounts)${skippedSuffix}.`
      }).save();

      res.json({
        success: true,
        activeCasesCount: syncResult.activeCasesCount,
        discordBansCount: syncResult.discordBansCount,
        vrchatBansCount: syncResult.vrchatBansCount,
        skippedCount,
        discordSkippedCount: syncResult.discordSkippedCount || 0,
        vrchatSkippedCount: syncResult.vrchatSkippedCount || 0,
        message: `Cross-platform synchronization complete: ${syncResult.activeCasesCount} active cases synced (${syncResult.discordBansCount} Discord bans, ${syncResult.vrchatBansCount} VRChat bans)${skippedSuffix}.`
      });
    } catch (e: any) {
      console.error('Error syncing bans across platforms:', e);
      res.status(500).json({ error: e?.message || 'Failed to sync bans across platforms' });
    }
  });

  app.post('/api/admin/ban-cases/:id/toggle-watchlist', authenticateToken, isModOrAdmin, async (req: any, res) => {
    try {
      const idOrNumber = req.params.id;
      let banCase = null;
      if (mongoose.Types.ObjectId.isValid(idOrNumber)) {
        banCase = await BanCase.findById(idOrNumber);
      }
      if (!banCase) {
        banCase = await BanCase.findOne({ caseNumber: idOrNumber.toUpperCase() });
      }

      if (!banCase) {
        return res.status(404).json({ error: 'Ban case not found' });
      }

      banCase.isDangerous = !banCase.isDangerous;
      banCase.trustIndex = calculateDynamicTrustIndex({
        isDangerous: banCase.isDangerous,
        isBanned: banCase.status === 'active',
        severity: banCase.severity
      });
      banCase.updatedAt = new Date();
      await banCase.save();

      // Sync dangerous state to all linked User records
      if (Array.isArray(banCase.discordAccounts)) {
        for (const disc of banCase.discordAccounts) {
          if (disc.discordId) {
            await User.findOneAndUpdate(
              { id: disc.discordId },
              { $set: { isDangerous: banCase.isDangerous, trustIndex: banCase.trustIndex, updatedAt: new Date() } }
            );
          }
        }
      }

      await new Log({
        action: 'TOGGLE_BAN_CASE_WATCHLIST',
        adminId: req.user.username,
        targetId: banCase.caseNumber,
        details: `${banCase.isDangerous ? 'Enrolled' : 'Removed'} Ban Case #${banCase.caseNumber} ${banCase.isDangerous ? 'into' : 'from'} High-Risk Watchlist`
      }).save();

      res.json({
        success: true,
        isDangerous: banCase.isDangerous,
        trustIndex: banCase.trustIndex,
        banCase
      });
    } catch (e: any) {
      console.error('Error toggling ban case watchlist:', e);
      res.status(500).json({ error: 'Failed to toggle watchlist status' });
    }
  });

  app.post('/api/admin/ban-cases/:id/update-dangerous-notes', authenticateToken, isModOrAdmin, async (req: any, res) => {
    try {
      const { notes } = req.body;
      const idOrNumber = req.params.id;
      let banCase = null;
      if (mongoose.Types.ObjectId.isValid(idOrNumber)) {
        banCase = await BanCase.findById(idOrNumber);
      }
      if (!banCase) {
        banCase = await BanCase.findOne({ caseNumber: idOrNumber.toUpperCase() });
      }

      if (!banCase) return res.status(404).json({ error: 'Ban case not found' });

      banCase.dangerousNotes = notes;
      banCase.updatedAt = new Date();
      await banCase.save();

      res.json({ success: true, banCase });
    } catch (e: any) {
      res.status(500).json({ error: 'Failed to update notes' });
    }
  });

  
}
