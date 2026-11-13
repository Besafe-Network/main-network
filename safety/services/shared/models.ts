import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { ChannelType } from 'discord.js';

// --- User Schema ---
export const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  email: { type: String, index: true },
  username: String,
  reputation: { type: Number, default: 0 },
  isTrusted: { type: Boolean, default: false, index: true },
  isBanned: { type: Boolean, default: false },
  banReason: String,
  bannedAt: Date,
  bannedBy: String,
  banType: String,
  banExpiresAt: Date,
  banCaseId: String,
  evidenceLinks: [String],
  isDangerous: { type: Boolean, default: false },
  dangerousNotes: String,
  trustIndex: { type: String, default: "ALL CLEAR" },
  isAgeVerified: { type: Boolean, default: false },
  dob: Date,
  ageVerifiedAt: Date,
  avatarUrl: String,
  savedAvatarUrl: String,
  vrchatUserId: { type: String, default: "" },
  vrchatUsername: { type: String, default: "" },
  vrchatAlts: [{
    vrchatUserId: { type: String, required: true },
    vrchatUsername: String,
    linkedAt: { type: Date, default: Date.now }
  }],
  warnings: [{
    reason: String,
    adminId: String,
    guildId: String,
    timestamp: { type: Date, default: Date.now }
  }],
  unbanHistory: [{
    bandate: { type: Date, default: Date.now },
    unbandate: { type: Date, default: Date.now },
    banreason: String,
    username: String,
    bannedBy: String,
    unbannedBy: String,
    unbanReason: String
  }],
  vrchatLastCheckedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// --- Ban Case Schema ---
export const banCaseSchema = new mongoose.Schema({
  caseNumber: { type: String, required: true, unique: true, index: true },
  title: { type: String, default: "" },
  reason: { type: String, required: true },
  severity: { type: String, enum: ['permanent', 'temporary', 'critical', 'warning'], default: 'permanent' },
  status: { type: String, enum: ['active', 'lifted'], default: 'active', index: true },
  discordAccounts: [{
    discordId: { type: String, required: true },
    username: { type: String, default: "" },
    displayName: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },
    notes: { type: String, default: "" },
    linkedAt: { type: Date, default: Date.now }
  }],
  vrchatAccounts: [{
    vrchatUserId: { type: String, required: true },
    vrchatUsername: { type: String, default: "" },
    isPrimary: { type: Boolean, default: false },
    notes: { type: String, default: "" },
    linkedAt: { type: Date, default: Date.now }
  }],
  evidenceLinks: [{ type: String }],
  notes: { type: String, default: "" },
  isDangerous: { type: Boolean, default: false, index: true },
  dangerousNotes: { type: String, default: "" },
  trustIndex: { type: String, default: "BLACKLISTED" },
  bannedBy: { type: String, default: "Admin" },
  bannedAt: { type: Date, default: Date.now },
  unbannedBy: { type: String, default: "" },
  unbannedAt: { type: Date },
  unbanReason: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// --- Report Schema ---
export const reportSchema = new mongoose.Schema({
  targetUserId: { type: String, required: true },
  targetDisplayName: { type: String, default: "" },
  reporterUserId: { type: String, required: true },
  reporterEmail: { type: String, required: true },
  reason: { type: String, required: true },
  evidenceLinks: [String],
  attachments: [String],
  status: { type: String, enum: ['pending', 'claimed', 'reviewed', 'dismissed'], default: 'pending' },
  claimedBy: { type: String, default: null },
  claimedAt: { type: Date },
  messages: [{
    sender: { type: String, enum: ['admin', 'user'] },
    content: String,
    attachments: [String],
    timestamp: { type: Date, default: Date.now }
  }],
  vrchatAccount: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});

// --- Appeal Schema ---
export const appealSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  email: { type: String, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'claimed', 'approved', 'denied'], default: 'pending' },
  adminNotes: String,
  vrchatAccount: { type: String, default: "" },
  attachments: [{ type: String }],
  claimedBy: { type: String, default: null },
  claimedAt: { type: Date },
  messages: [{
    sender: { type: String, enum: ['admin', 'user'] },
    content: String,
    attachments: [{ type: String }],
    timestamp: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

// --- Audit Log Schema ---
export const logSchema = new mongoose.Schema({
  action: { type: String, required: true },
  adminId: String,
  targetId: String,
  details: String,
  timestamp: { type: Date, default: Date.now }
});

// --- Admin Schema ---
export const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, default: '', index: true },
  password: { type: String, required: true },
  passwordSet: { type: Boolean, default: true },
  role: { type: String, enum: ['admin', 'moderator', 'user'], default: 'user' },
  displayName: { type: String, default: "" },
  avatarUrl: { type: String, default: "" },
  bio: { type: String, default: "" },
  discordId: String,
  vrchatUserId: { type: String, default: "" },
  vrchatUsername: { type: String, default: "" },
  dawnchatId: { type: String, default: "" },
  dawnchatUsername: { type: String, default: "" },
  isAgeVerified: { type: Boolean, default: false },
  dob: Date,
  ageVerifiedAt: Date,
  dawnchatSettings: {
    safetyBridgeEnabled: { type: Boolean, default: true },
    filterSensitivity: { type: String, default: "balanced" },
    autoKickBlacklisted: { type: Boolean, default: true },
    webhookUrl: { type: String, default: "" },
    communityId: { type: String, default: "" }
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: String,
  isBanned: { type: Boolean, default: false, index: true },
  banReason: { type: String, default: "" },
  bannedAt: Date,
  bannedBy: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});

// --- User VRChat Group Schema ---
export const userVRChatGroupSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  groupId: { type: String, required: true },
  groupName: { type: String, default: "" },
  shortCode: { type: String, default: "" },
  description: { type: String, default: "" },
  iconUrl: { type: String, default: "" },
  bannerUrl: { type: String, default: "" },
  memberCount: { type: Number, default: 0 },
  autoBanEnabled: { type: Boolean, default: true },
  autoUnbanEnabled: { type: Boolean, default: true },
  blacklistThreshold: { type: Number, default: -10 },
  customBanlistId: { type: String, default: "" },
  status: { type: String, enum: ['active', 'paused', 'error'], default: 'active' },
  statusMessage: { type: String, default: "" },
  publicListing: {
    isListed: { type: Boolean, default: false },
    description: { type: String, default: "" },
    joinUrl: { type: String, default: "" },
    category: { type: String, default: "VRChat Community" }
  },
  lastSyncedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

// --- System Config Schema ---
export const systemConfigSchema = new mongoose.Schema({
  id: { type: String, default: 'main' },
  notificationEmail: { type: String, default: "" },
  smtpHost: { type: String, default: "" },
  smtpPort: { type: Number, default: 587 },
  smtpSecure: { type: Boolean, default: false },
  smtpUser: { type: String, default: "" },
  smtpPass: { type: String, default: "" },
  smtpFrom: { type: String, default: "" },
  smtpRejectUnauthorized: { type: Boolean, default: false },
  vrchatUsername: { type: String, default: "" },
  vrchatPassword: { type: String, default: "" },
  vrchatCookie: { type: String, default: "" },
  vrchatGroupId: { type: String, default: "" },
  vrchatBotEnabled: { type: Boolean, default: false },
  twoFactorAuthApiUrl: { type: String, default: "" },
  twoFactorAuthApiToken: { type: String, default: "" },
  twoFactorAuthAccountId: { type: String, default: "" },
  vrchatBotStatus: { type: String, default: "idle" },
  vrchatBotError: { type: String, default: "" },
  vrchatBotLastCheckedAt: { type: Date, default: Date.now },
  vrchatBotGroupCount: { type: Number, default: 0 },
  vrchatBotGroups: [String],
  vrchatBots: [{
    id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    vrchatUsername: { type: String, default: "" },
    vrchatPassword: { type: String, default: "" },
    vrchatCookie: { type: String, default: "" },
    twoFactorAuthApiUrl: { type: String, default: "" },
    twoFactorAuthApiToken: { type: String, default: "" },
    twoFactorAuthAccountId: { type: String, default: "" },
    groupCount: { type: Number, default: 0 },
    groups: [String],
    status: { type: String, default: "idle" },
    error: { type: String, default: "" },
    lastCheckedAt: { type: Date, default: Date.now }
  }],
  disableAgeVerifyCommand: { type: Boolean, default: false },
  updatedAt: { type: Date, default: Date.now }
});

// --- Guild Schema ---
export const guildSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  ownerId: String,
  settings: {
    autoBanThreshold: { type: Number, default: -10 },
    warningThreshold: { type: Number, default: 3 },
    tempBanDuration: { type: Number, default: 7 },
    logChannelId: String,
    autoBanEnabled: { type: Boolean, default: false },
    staffRoleId: String,
    staffChannelId: String,
    verificationEnabled: { type: Boolean, default: false },
    verificationRoleId: String,
    ageRoleEnabled: { type: Boolean, default: false },
    ageRoleId: String,
    autoAssignAgeRole: { type: Boolean, default: false },
    disableAgeVerifyCommand: { type: Boolean, default: false },
    vrchatBotEnabled: { type: Boolean, default: false },
    vrchatGroupId: { type: String, default: "" },
    vrchatAutoBanEnabled: { type: Boolean, default: true },
    autoUnbanDiscordEnabled: { type: Boolean, default: true },
    autoUnbanVRChatEnabled: { type: Boolean, default: true },
    customBanlistId: { type: String, default: "" },
    banlistSelectionMode: { type: String, enum: ['both', 'global', 'custom'], default: 'global' },
    customBotToken: { type: String, default: "" },
    customBotEnabled: { type: Boolean, default: false },
    customBotStatus: { type: String, enum: ['online', 'idle', 'dnd', 'invisible'], default: "online" },
    customBotActivityType: { type: String, default: "PLAYING" },
    customBotActivityText: { type: String, default: "" }
  },
  publicListing: {
    isListed: { type: Boolean, default: false },
    description: { type: String, default: "" },
    inviteUrl: { type: String, default: "" },
    category: { type: String, default: "Gaming & Community" },
    iconUrl: { type: String, default: "" },
    memberCount: { type: Number, default: 0 }
  },
  updatedAt: { type: Date, default: Date.now }
});

// --- Custom Banlist Schema ---
export const customBanlistSchema = new mongoose.Schema({
  name: { type: String, required: true },
  ownerId: { type: String, required: true },
  entries: [{
    type: { type: String, enum: ['discord', 'vrchat'], required: true },
    targetId: { type: String, required: true },
    reason: { type: String, default: 'Custom blacklisted' },
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// --- Server Backup Schema ---
export const serverBackupSchema = new mongoose.Schema({
  guildId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  creatorId: { type: String, required: true },
  creatorTag: String,
  serverDetails: {
    name: String,
    icon: String,
    afkTimeout: Number,
    verificationLevel: Number,
    explicitContentFilter: Number,
    defaultMessageNotifications: Number
  },
  roles: [{
    id: String,
    name: String,
    color: Number,
    hoist: Boolean,
    position: Number,
    permissions: String,
    mentionable: Boolean,
    isManaged: Boolean
  }],
  categories: [{
    id: String,
    name: String,
    position: Number,
    permissionOverwrites: [{
      id: String,
      type: { type: Number },
      roleName: String,
      allow: String,
      deny: String
    }]
  }],
  channels: [{
    id: String,
    name: String,
    type: { type: Number },
    topic: String,
    nsfw: Boolean,
    rateLimitPerUser: Number,
    bitrate: Number,
    userLimit: Number,
    position: Number,
    parentId: String,
    parentName: String,
    permissionOverwrites: [{
      id: String,
      type: { type: Number },
      roleName: String,
      allow: String,
      deny: String
    }]
  }],
  bans: [{
    userId: String,
    userTag: String,
    reason: String
  }],
  members: [{
    userId: String,
    userTag: String,
    roles: [String],
    roleNames: [String]
  }],
  createdAt: { type: Date, default: Date.now }
});

// --- VRChat Alert Tracker Schema ---
export const vrchatAlertTrackerSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  vrchatUserId: { type: String, required: true },
  groupId: { type: String, required: true },
  lastWarnedAt: { type: Date, default: Date.now }
});

// --- Verification Request Schema ---
export const verificationRequestSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  username: { type: String, default: "" },
  email: { type: String, index: true },
  externalUserId: { type: String },
  callbackUrl: { type: String },
  source: { type: String, enum: ['discord', 'web', 'enterprise'], default: 'discord' },
  idPhoto: String,
  facePhoto: String,
  dob: Date,
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  adminNotes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// --- Enterprise Endpoint & Verification Log ---
export const enterpriseEndpointSchema = new mongoose.Schema({
  name: { type: String, required: true },
  apiKey: { type: String, required: true, unique: true, index: true },
  webhookUrl: { type: String, required: true },
  developerEmail: { type: String, required: true, index: true },
  description: { type: String, default: "" },
  secretKey: { type: String, default: "" },
  isActive: { type: Boolean, default: true },
  deliveriesCount: { type: Number, default: 0 },
  lastDeliveryStatus: { type: String, default: "idle" },
  lastDeliveryAt: { type: Date },
  lastPayloadSent: { type: mongoose.Schema.Types.Mixed },
  lastResponseCode: { type: Number },
  lastErrorMessage: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const enterpriseVerificationLogSchema = new mongoose.Schema({
  endpointId: { type: String, index: true },
  apiKey: { type: String, index: true },
  email: { type: String, required: true, index: true },
  userId: { type: String },
  status: { type: String, enum: ['approved', 'denied'], required: true },
  dob: { type: String },
  callbackUrl: { type: String, required: true },
  payloadSent: { type: mongoose.Schema.Types.Mixed },
  deliverySuccess: { type: Boolean, default: false },
  httpStatus: { type: Number },
  errorMessage: { type: String },
  timestamp: { type: Date, default: Date.now }
});

// --- Api Key Request & Key Schema ---
export const apiKeyRequestSchema = new mongoose.Schema({
  botName: { type: String, required: true },
  botId: { type: String, required: true },
  serverCount: { type: Number, required: true },
  developerEmail: { type: String, required: true },
  purpose: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

export const apiKeySchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  botName: { type: String, required: true },
  botId: { type: String, required: true },
  ownerEmail: String,
  isRevoked: { type: Boolean, default: false },
  revocationReason: String,
  revokedAt: Date,
  createdAt: { type: Date, default: Date.now },
  lastUsedAt: Date
});

export const vrchatAnnouncementHistorySchema = new mongoose.Schema({
  title: { type: String, required: true },
  text: { type: String, required: true },
  imageId: String,
  sendNotification: { type: Boolean, default: true },
  visibility: { type: String, default: 'group' },
  sentBy: { type: String, required: true },
  sentAt: { type: Date, default: Date.now },
  totalTargeted: { type: Number, default: 0 },
  successCount: { type: Number, default: 0 },
  failedCount: { type: Number, default: 0 },
  groupResults: [{
    groupId: String,
    groupName: String,
    success: Boolean,
    error: String,
    postId: String
  }]
});

export const geoRuleSchema = new mongoose.Schema({
  countryCode: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
  countryName: { type: String, required: true },
  defaultLocale: { type: String, default: "en" },
  minAgeSocial: { type: Number, required: true, default: 13 },
  idVerificationRequired: { type: Boolean, required: true, default: false },
  regulatoryFramework: { type: String, default: "" },
  notes: { type: String, default: "" },
  isCustom: { type: Boolean, default: false },
  updatedBy: { type: String, default: "system" },
  updatedAt: { type: Date, default: Date.now }
});

export const apiBotSchema = new mongoose.Schema({
  name: { type: String, required: true },
  platform: { type: String, enum: ['discord', 'vrchat', 'multi'], default: 'discord' },
  description: { type: String, required: true },
  avatarUrl: { type: String, default: "" },
  inviteUrl: { type: String, default: "" },
  websiteUrl: { type: String, default: "" },
  authorName: { type: String, default: "BeSafe Verified Developer" },
  authorId: { type: String, default: "" },
  apiScopes: { type: [String], default: ['read:reputation', 'enforce:bans'] },
  apiUsageDetails: { type: String, default: "Queries global banlist and posts threat telemetry via BeSafe REST API v1" },
  serversCount: { type: Number, default: 0 },
  usersProtected: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: true },
  isListed: { type: Boolean, default: true },
  addedBy: { type: String, default: "admin" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const trustedCompanySchema = new mongoose.Schema({
  name: { type: String, required: true },
  websiteUrl: { type: String, required: true },
  logoUrl: { type: String, default: "" },
  industry: { type: String, default: "Gaming & Metaverse" },
  description: { type: String, default: "" },
  servicesUsed: { type: [String], default: ['Global Ban Synchronization', 'Threat Intelligence API'] },
  isFeatured: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

// Indexes
userSchema.index({ isDangerous: 1 });
userSchema.index({ isAgeVerified: 1 });
banCaseSchema.index({ 'discordAccounts.discordId': 1 });
banCaseSchema.index({ 'vrchatAccounts.vrchatUserId': 1 });
reportSchema.index({ targetUserId: 1 });
reportSchema.index({ status: 1 });
appealSchema.index({ userId: 1 });
appealSchema.index({ status: 1 });
logSchema.index({ timestamp: -1 });

// Model Initializations
export const User = mongoose.model('User', userSchema);
export const BanCase = mongoose.model('BanCase', banCaseSchema);
export const Report = mongoose.model('Report', reportSchema);
export const Appeal = mongoose.model('Appeal', appealSchema);
export const Log = mongoose.model('Log', logSchema);
export const Admin = mongoose.model('Admin', adminSchema);
export const UserVRChatGroup = mongoose.model('UserVRChatGroup', userVRChatGroupSchema);
export const SystemConfig = mongoose.model('SystemConfig', systemConfigSchema);
export const Guild = mongoose.model('Guild', guildSchema);
export const CustomBanlist = mongoose.model('CustomBanlist', customBanlistSchema);
export const ServerBackup = mongoose.model('ServerBackup', serverBackupSchema);
export const VRChatAlertTracker = mongoose.model('VRChatAlertTracker', vrchatAlertTrackerSchema);
export const VerificationRequest = mongoose.model('VerificationRequest', verificationRequestSchema);
export const EnterpriseEndpoint = mongoose.model('EnterpriseEndpoint', enterpriseEndpointSchema);
export const EnterpriseVerificationLog = mongoose.model('EnterpriseVerificationLog', enterpriseVerificationLogSchema);
export const ReputationRating = mongoose.model('ReputationRating', new mongoose.Schema({
  userId: { type: String, required: true },
  raterId: { type: String, required: true },
  rating: { type: Number, required: true },
  updatedAt: { type: Date, default: Date.now }
}).index({ userId: 1, raterId: 1 }, { unique: true }));
export const LinkCode = mongoose.model('LinkCode', new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  discordId: { type: String },
  adminId: { type: String },
  createdAt: { type: Date, default: Date.now, expires: 600 }
}));
export const ApiKeyRequest = mongoose.model('ApiKeyRequest', apiKeyRequestSchema);
export const ApiKey = mongoose.model('ApiKey', apiKeySchema);
export const VRChatAnnouncementHistory = mongoose.model('VRChatAnnouncementHistory', vrchatAnnouncementHistorySchema);
export const GeoRule = mongoose.model('GeoRule', geoRuleSchema);
export const ApiBot = mongoose.model('ApiBot', apiBotSchema);
export const TrustedCompany = mongoose.model('TrustedCompany', trustedCompanySchema);

// Safe Save Helpers
export async function safeSaveReport(report: any) {
  if (Array.isArray(report.attachments) && report.attachments.length > 5) {
    report.attachments = report.attachments.slice(-5);
  }
  try {
    await report.save();
  } catch (err: any) {
    if (
      err?.message?.includes('BSONObj size') ||
      err?.message?.includes('16793600') ||
      err?.code === 10334 ||
      err?.name === 'MongoServerError'
    ) {
      if (Array.isArray(report.attachments)) {
        report.attachments = [];
      }
      await report.save();
    } else {
      throw err;
    }
  }
}

export async function safeSaveAppeal(appeal: any) {
  if (Array.isArray(appeal.attachments) && appeal.attachments.length > 5) {
    appeal.attachments = appeal.attachments.slice(-5);
  }
  if (Array.isArray(appeal.messages)) {
    for (const msg of appeal.messages) {
      if (Array.isArray(msg.attachments) && msg.attachments.length > 5) {
        msg.attachments = msg.attachments.slice(-5);
      }
    }
  }

  try {
    await appeal.save();
  } catch (err: any) {
    if (
      err?.message?.includes('BSONObj size') ||
      err?.message?.includes('16793600') ||
      err?.code === 10334 ||
      err?.name === 'MongoServerError'
    ) {
      if (Array.isArray(appeal.messages)) {
        for (let i = 0; i < appeal.messages.length - 1; i++) {
          appeal.messages[i].attachments = [];
        }
      }
      if (Array.isArray(appeal.attachments)) {
        appeal.attachments = [];
      }
      await appeal.save();
    } else {
      throw err;
    }
  }
}

export function extractVRChatGroupId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  const grpMatch = trimmed.match(/grp_[a-zA-Z0-9\-_]+/);
  return grpMatch ? grpMatch[0] : trimmed;
}

export function extractVRChatUserId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  const uuidMatch = trimmed.match(/usr_[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}/);
  if (uuidMatch) return uuidMatch[0];
  const fallbackMatch = trimmed.match(/usr_[a-zA-Z0-9\-_]+/);
  return fallbackMatch ? fallbackMatch[0] : trimmed;
}

export function getAllVRChatAccounts(user: any) {
  const list: Array<{ vrchatUserId: string, vrchatUsername: string }> = [];
  if (user.vrchatUserId) {
    list.push({ vrchatUserId: user.vrchatUserId, vrchatUsername: user.vrchatUsername });
  }
  if (user.vrchatAlts && Array.isArray(user.vrchatAlts)) {
    for (const alt of user.vrchatAlts) {
      if (alt.vrchatUserId && !list.some(x => x.vrchatUserId === alt.vrchatUserId)) {
        list.push({ vrchatUserId: alt.vrchatUserId, vrchatUsername: alt.vrchatUsername });
      }
    }
  }
  return list;
}

export function parseVRChatAccountString(input: string): Array<{ vrchatUserId: string; vrchatUsername: string }> {
  if (!input) return [];
  const list: Array<{ vrchatUserId: string; vrchatUsername: string }> = [];
  const tokens = input.split(/[\n,;]+/).map(t => t.trim()).filter(Boolean);

  for (let token of tokens) {
    if (token.includes('vrchat.com/home/user/')) {
      const parts = token.split('vrchat.com/home/user/');
      if (parts[1]) {
        token = parts[1].split('/')[0].split('?')[0].trim();
      }
    }

    if (token.startsWith('usr_')) {
      list.push({ vrchatUserId: token, vrchatUsername: '' });
    } else if (token) {
      list.push({ vrchatUserId: '', vrchatUsername: token });
    }
  }

  return list;
}

// User & Avatar resolution helpers
export async function resolveDiscordUser(client: any, userId: string, dbUser?: any) {
  if (!client) {
    return {
      displayName: dbUser?.username || userId,
      username: dbUser?.username || 'unknown',
      avatarUrl: dbUser?.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png'
    };
  }

  try {
    const cachedUser = client.users?.cache?.get(userId);
    if (cachedUser) {
      return {
        displayName: cachedUser.displayName || cachedUser.username,
        username: cachedUser.username,
        avatarUrl: cachedUser.avatarURL ? cachedUser.avatarURL({ size: 256 }) : (dbUser?.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png')
      };
    }
  } catch (e) {}

  if (dbUser && dbUser.username) {
    return {
      displayName: dbUser.username,
      username: dbUser.username,
      avatarUrl: dbUser.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png'
    };
  }

  try {
    const discordUser = await client.users.fetch(userId);
    const displayName = discordUser.displayName || discordUser.username;
    const username = discordUser.username;
    let avatarUrl = 'https://cdn.discordapp.com/embed/avatars/0.png';
    if (discordUser.avatar) {
      avatarUrl = `https://cdn.discordapp.com/avatars/${userId}/${discordUser.avatar}.png?size=256`;
    }
    if (dbUser) {
      User.updateOne({ id: userId }, { $set: { username, avatarUrl } }).catch(() => {});
    }
    return { displayName, username, avatarUrl };
  } catch (e) {
    return {
      displayName: dbUser?.username || userId,
      username: dbUser?.username || 'unknown',
      avatarUrl: dbUser?.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png'
    };
  }
}

export async function getWatchlistAvatar(client: any, user: any): Promise<string> {
  const DEFAULT_PLACEHOLDER = 'https://cdn.discordapp.com/embed/avatars/0.png';
  try {
    const resolved = await resolveDiscordUser(client, user.id, user);
    return resolved.avatarUrl || user.avatarUrl || DEFAULT_PLACEHOLDER;
  } catch (e) {
    return user.avatarUrl || DEFAULT_PLACEHOLDER;
  }
}

export async function cleanupSavedWatchlistAvatars() {
  try {
    await User.updateMany(
      { savedAvatarUrl: { $exists: true } },
      { $unset: { savedAvatarUrl: "" } }
    );
    const avatarsDir = path.join(process.cwd(), 'data', 'watchlist-avatars');
    if (fs.existsSync(avatarsDir)) {
      await fs.promises.rm(avatarsDir, { recursive: true, force: true });
    }
  } catch (err: any) {
    console.warn('[Watchlist Avatars] Cleanup notice:', err?.message);
  }
}

// Backup & Restore
export async function createGuildBackup(guild: any, creatorId: string, creatorTag?: string, customName?: string) {
  const fetchedRoles = await guild.roles.fetch();
  const rolesData: any[] = [];
  fetchedRoles.forEach((role: any) => {
    if (role.name !== '@everyone' && role.managed) return;
    rolesData.push({
      id: role.id,
      name: role.name,
      color: role.color,
      hoist: role.hoist,
      position: role.rawPosition !== undefined ? role.rawPosition : role.position,
      permissions: role.permissions.bitfield.toString(),
      mentionable: role.mentionable,
      isManaged: role.managed || false
    });
  });

  const membersData: any[] = [];
  try {
    const fetchedMembers = await guild.members.fetch().catch(() => null);
    if (fetchedMembers) {
      fetchedMembers.forEach((member: any) => {
        if (member.user?.bot) return;
        const userRoles = member.roles.cache
          .filter((r: any) => r.name !== '@everyone' && !r.managed)
          .map((r: any) => ({ id: r.id, name: r.name }));
        if (userRoles.length > 0) {
          membersData.push({
            userId: member.id,
            userTag: member.user?.tag || member.user?.username || member.id,
            roles: userRoles.map((r: any) => r.id),
            roleNames: userRoles.map((r: any) => r.name)
          });
        }
      });
    }
  } catch (e: any) {
    console.error('Error fetching members for backup:', e?.message);
  }

  const fetchedChannels = await guild.channels.fetch();
  const categoriesData: any[] = [];
  const channelsData: any[] = [];

  fetchedChannels.forEach((channel: any) => {
    if (!channel) return;
    const overwrites: any[] = [];
    if (channel.permissionOverwrites && channel.permissionOverwrites.cache) {
      channel.permissionOverwrites.cache.forEach((po: any) => {
        const role = fetchedRoles.get(po.id);
        overwrites.push({
          id: po.id,
          type: po.type,
          roleName: role ? role.name : undefined,
          allow: po.allow.bitfield.toString(),
          deny: po.deny.bitfield.toString()
        });
      });
    }

    if (channel.type === ChannelType.GuildCategory) {
      categoriesData.push({
        id: channel.id,
        name: channel.name,
        position: channel.rawPosition !== undefined ? channel.rawPosition : channel.position,
        permissionOverwrites: overwrites
      });
    } else {
      channelsData.push({
        id: channel.id,
        name: channel.name,
        type: channel.type,
        topic: channel.topic || '',
        nsfw: channel.nsfw || false,
        rateLimitPerUser: channel.rateLimitPerUser || 0,
        bitrate: channel.bitrate || undefined,
        userLimit: channel.userLimit || undefined,
        position: channel.rawPosition !== undefined ? channel.rawPosition : channel.position,
        parentId: channel.parentId || undefined,
        parentName: channel.parent ? channel.parent.name : undefined,
        permissionOverwrites: overwrites
      });
    }
  });

  const serverDetails = {
    name: guild.name,
    icon: typeof guild.iconURL === 'function' ? (guild.iconURL({ size: 256 }) || '') : '',
    afkTimeout: guild.afkTimeout || 300,
    verificationLevel: guild.verificationLevel || 0,
    explicitContentFilter: guild.explicitContentFilter || 0,
    defaultMessageNotifications: guild.defaultMessageNotifications || 0
  };

  const bansData: any[] = [];
  try {
    const fetchedBans = await guild.bans.fetch();
    fetchedBans.forEach((ban: any) => {
      bansData.push({
        userId: ban.user.id,
        userTag: ban.user.tag || ban.user.username,
        reason: ban.reason || ''
      });
    });
  } catch (e) {}

  const backupName = customName && customName.trim()
    ? customName.trim()
    : `Backup - ${new Date().toLocaleString()}`;

  const backup = new ServerBackup({
    guildId: guild.id,
    name: backupName,
    creatorId,
    creatorTag: creatorTag || creatorId,
    serverDetails,
    roles: rolesData,
    members: membersData,
    categories: categoriesData,
    channels: channelsData,
    bans: bansData
  });

  await backup.save();
  return backup;
}

export function isValidDiscordSnowflake(id?: string | null): boolean {
  if (!id || typeof id !== 'string') return false;
  return /^\d{17,20}$/.test(id.trim());
}

export function isValidVRChatUserId(id?: string | null): boolean {
  if (!id || typeof id !== 'string') return false;
  return /^usr_[0-9a-fA-F-]{8,64}$/.test(id.trim());
}

export function calculateDynamicTrustIndex(data: {
  isDangerous?: boolean;
  isBanned?: boolean;
  banType?: string;
  severity?: string;
  reputation?: number;
  warningsCount?: number;
  isTrusted?: boolean;
  isAgeVerified?: boolean;
  trustIndexOverride?: string;
}): string {
  if (data.isBanned || data.isDangerous) {
    return 'BLACKLISTED';
  }
  if (data.isTrusted) {
    return 'TRUSTED';
  }
  const rep = Number(data.reputation ?? 0);
  if (rep >= 20) return 'TRUSTED';
  if (rep >= 10) return 'KNOWN';
  if (rep <= -10) return 'POTENTIALLY DANGEROUS';
  if (rep <= -5) return 'SUSPICIOUS';
  return 'ALL CLEAR';
}

export interface TransparentBanDMOptions {
  userId: string;
  caseNumber?: string;
  reason: string;
  severity?: string;
  evidenceLinks?: string[];
  guildName?: string;
  serverName?: string;
  banlistName?: string;
  baseUrl?: string;
}

export function buildTransparentBanDM(options: TransparentBanDMOptions) {
  const rawBaseUrl = (
    options.baseUrl ||
    process.env.APP_URL ||
    'https://ais-pre-j6wkvakrdeliwy2t74vy2d-412446330421.europe-west2.run.app'
  ).trim().replace(/\/$/, '');

  const checkIdentifier = options.caseNumber || options.userId;
  const checkUrl = `${rawBaseUrl}/check/${encodeURIComponent(checkIdentifier)}`;
  const appealParams = new URLSearchParams();
  appealParams.set('userId', options.caseNumber || options.userId);
  if (options.caseNumber && options.userId && options.userId !== options.caseNumber) {
    appealParams.set('discordId', options.userId);
    appealParams.set('caseNumber', options.caseNumber);
  }
  const appealUrl = `${rawBaseUrl}/appeal?${appealParams.toString()}`;

  const validEvidence = (options.evidenceLinks || [])
    .map((link) => (typeof link === 'string' ? link.trim() : ''))
    .filter(Boolean)
    .map((link) => (link.startsWith('/') ? `${rawBaseUrl}${link}` : link));

  let evidenceFieldText = `🔍 **[View Full Public Case & Evidence Record](${checkUrl})**`;
  if (validEvidence.length > 0) {
    const linkLines = validEvidence
      .slice(0, 5)
      .map((url, idx) => `• **[Evidence Item #${idx + 1}](${url})** (\`${url.length > 55 ? url.slice(0, 52) + '...' : url}\`)`);
    if (validEvidence.length > 5) {
      linkLines.push(`*...and ${validEvidence.length - 5} additional evidence item(s)*`);
    }
    evidenceFieldText = `${linkLines.join('\n')}\n\n🔍 **[View Full Public Case & Evidence Dossier](${checkUrl})**`;
  }

  const effectiveGuildName = options.guildName || options.serverName;
  const scopeDescription = effectiveGuildName
    ? `You have been banned from **${effectiveGuildName}** via the **BeSafe Global Trust & Safety Network**${options.banlistName ? ` (Custom Banlist: **${options.banlistName}**)` : ''}.`
    : `Your account has been placed on the **BeSafe Global Trust & Safety Blacklist**${options.banlistName ? ` (**${options.banlistName}**)` : ''} and restricted from participating protected communities.`;

  const embed = {
    title: '🛡️ BeSafe Network — Official Ban Notification',
    color: 0xdc2626,
    description: `${scopeDescription}\n\nWe believe in transparent moderation. Below are the details of this enforcement action, supporting evidence, and how to submit an appeal if you believe this was a mistake.`,
    fields: [
      {
        name: '📋 Case Reference',
        value: options.caseNumber ? `\`#${options.caseNumber}\`` : (options.banlistName ? `\`Custom Banlist: ${options.banlistName}\`` : '`Server / Network Enforcement`'),
        inline: true,
      },
      {
        name: '⚠️ Severity',
        value: `\`${(options.severity || 'permanent').toUpperCase()}\``,
        inline: true,
      },
      {
        name: '📌 Ban Reason',
        value: options.reason || 'Violation of community safety standards',
        inline: false,
      },
      {
        name: '🔗 Evidence & Public Record',
        value: evidenceFieldText,
        inline: false,
      },
      {
        name: '⚖️ Think This Ban Is Wrong? (Appeal)',
        value: `If you believe this enforcement action was made in error or wish to provide counter-evidence, you can submit a formal appeal for administrative review:\n👉 **[Submit an Official Ban Appeal](${appealUrl})**`,
        inline: false,
      },
    ],
    footer: {
      text: 'BeSafe Network • Transparent Cross-Platform Moderation',
    },
    timestamp: new Date().toISOString(),
  };

  return { embeds: [embed] };
}


