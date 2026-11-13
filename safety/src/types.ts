export interface UserProfile {
  _id: string;
  id?: string;
  username: string;
  email: string;
  role: 'admin' | 'moderator' | 'user';
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  discordId?: string | null;
  vrchatUserId?: string;
  vrchatUsername?: string;
  dawnchatId?: string;
  dawnchatUsername?: string;
  dawnchatSettings?: {
    safetyBridgeEnabled: boolean;
    filterSensitivity: 'relaxed' | 'balanced' | 'strict';
    autoKickBlacklisted: boolean;
    webhookUrl?: string;
    communityId?: string;
  };
  isEmailVerified: boolean;
  passwordSet?: boolean;
  isAgeVerified: boolean;
  dob?: string | null;
  ageVerifiedAt?: string | null;
  verificationStatus: 'none' | 'pending' | 'approved' | 'rejected';
  banCaseId?: string;
  reputation?: {
    score: number;
    isTrusted: boolean;
    isBanned: boolean;
    banReason?: string;
    warningsCount: number;
  };
  createdAt?: string;
}

export interface BanCaseAccountDiscord {
  discordId: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  notes?: string;
  linkedAt?: string;
}

export interface BanCaseAccountVRChat {
  vrchatUserId: string;
  vrchatUsername?: string;
  isPrimary?: boolean;
  notes?: string;
  linkedAt?: string;
}

export interface BanCase {
  _id: string;
  caseNumber: string;
  title?: string;
  reason: string;
  severity: 'permanent' | 'temporary' | 'critical' | 'warning';
  status: 'active' | 'lifted';
  isDangerous?: boolean;
  dangerousNotes?: string;
  trustIndex?: string;
  discordAccounts: BanCaseAccountDiscord[];
  vrchatAccounts: BanCaseAccountVRChat[];
  evidenceLinks?: string[];
  notes?: string;
  bannedBy: string;
  bannedAt: string;
  unbannedBy?: string;
  unbannedAt?: string;
  unbanReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserVRChatGroupItem {
  _id: string;
  userId: string;
  groupId: string;
  groupName: string;
  shortCode?: string;
  description?: string;
  iconUrl?: string;
  bannerUrl?: string;
  memberCount?: number;
  autoBanEnabled: boolean;
  autoUnbanEnabled: boolean;
  blacklistThreshold: number;
  customBanlistId?: string;
  status: 'active' | 'paused' | 'error';
  statusMessage?: string;
  publicListing?: {
    isListed: boolean;
    description?: string;
    joinUrl?: string;
    category?: string;
  };
  lastSyncedAt?: string;
  createdAt?: string;
}

export interface AgeVerificationSubmission {
  userId?: string;
  username?: string;
  dob: string;
  idPhoto: string;
  facePhoto: string;
  source?: 'web' | 'discord';
}
