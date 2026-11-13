import React, { useState, useEffect } from 'react';
import { compressImageFile } from '../utils/imageCompressor';
import { extractVRChatUserId } from '../utils/vrchatUtils';
import { 
  Shield, 
  LogOut, 
  AlertCircle, 
  Lock, 
  User, 
  Server, 
  Link as LinkIcon, 
  Settings, 
  CheckCircle, 
  XCircle, 
  BarChart3, 
  Activity, 
  History, 
  ShieldAlert, 
  AlertTriangle, 
  Search, 
  UserCheck, 
  Edit2, 
  Check, 
  Code2, 
  Eye, 
  EyeOff,
  Bot, 
  MessageSquare, 
  FileText, 
  Trash2, 
  Plus, 
  PlusCircle,
  UserX, 
  RefreshCw, 
  Fingerprint,
  Info,
  ExternalLink,
  FolderCheck,
  BookmarkCheck,
  Upload,
  Save,
  RotateCcw,
  Download,
  Database,
  Image as ImageIcon,
  Megaphone,
  Radio,
  X,
  Hash,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Sliders,
  Sparkles,
  Menu,
  UserCircle,
  Gamepad2,
  Share2,
  Globe,
  Building2,
  Mail,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { UserProfileCard } from '../components/dashboard/UserProfileCard';
import { PlatformSettings } from '../components/dashboard/PlatformSettings';
import { WebAgeVerification } from '../components/dashboard/WebAgeVerification';
import { VRChatGroupManager } from '../components/dashboard/VRChatGroupManager';
import BanCasesManager from '../components/dashboard/BanCasesManager';
import GeoRulesManager from '../components/dashboard/GeoRulesManager';
import ApiBotsManager from '../components/dashboard/ApiBotsManager';
import TrustedCompaniesManager from '../components/dashboard/TrustedCompaniesManager';
import { UserProfile } from '../types';

export const extractVRChatGroupId = (input: string): string => {
  if (!input) return '';
  const trimmed = input.trim();
  const grpMatch = trimmed.match(/grp_[a-zA-Z0-9\-_]+/);
  if (grpMatch) {
    return grpMatch[0];
  }
  return trimmed;
};

interface SearchableDiscordSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ id: string; name: string; subtext?: string; color?: string }>;
  type: 'channel' | 'role';
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  placeholder?: string;
}

const SearchableDiscordSelect: React.FC<SearchableDiscordSelectProps> = ({
  label,
  value,
  onChange,
  options,
  type,
  isLoading,
  error,
  onRefresh,
  placeholder = 'Select an option...'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isManualInput, setIsManualInput] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.id === value);

  const filteredOptions = options.filter((opt) => {
    const query = search.toLowerCase();
    return (
      opt.name.toLowerCase().includes(query) ||
      (opt.subtext && opt.subtext.toLowerCase().includes(query)) ||
      opt.id.includes(query)
    );
  });

  if (isManualInput) {
    return (
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <label className="block font-mono text-[10px] uppercase font-bold text-zinc-500">{label}</label>
          <button
            type="button"
            onClick={() => setIsManualInput(false)}
            className="font-mono text-[10px] text-indigo-600 hover:text-indigo-800 font-bold uppercase underline"
          >
            ← Select from Server
          </button>
        </div>
        <div className="relative">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter raw ${type} ID...`}
            className="w-full bg-zinc-50 border-2 border-zinc-200 rounded-xl p-3 font-mono text-xs focus:outline-none focus:border-indigo-500 focus:bg-white transition-all pr-8"
          />
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 relative" ref={containerRef}>
      <div className="flex justify-between items-center">
        <label className="block font-mono text-[10px] uppercase font-bold text-zinc-500">{label}</label>
        <button
          type="button"
          onClick={() => setIsManualInput(true)}
          className="font-mono text-[10px] text-zinc-400 hover:text-indigo-600 font-medium uppercase"
        >
          Raw ID Mode
        </button>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full text-left bg-zinc-50 border-2 rounded-xl p-3 font-mono text-xs focus:outline-none transition-all flex items-center justify-between gap-2 ${
            isOpen ? 'border-indigo-500 bg-white shadow-sm' : 'border-zinc-200 hover:border-zinc-300'
          }`}
        >
          <div className="flex items-center gap-2 truncate flex-1 min-w-0">
            {isLoading ? (
              <span className="flex items-center gap-2 text-zinc-400 italic">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600 shrink-0" />
                Fetching Discord {type}s...
              </span>
            ) : selectedOption ? (
              <div className="flex items-center gap-2 truncate">
                {type === 'channel' ? (
                  <Hash className="w-4 h-4 text-indigo-500 shrink-0" />
                ) : (
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/10"
                    style={{ backgroundColor: selectedOption.color || '#6B7280' }}
                  />
                )}
                <span className="font-bold text-zinc-900 truncate">{selectedOption.name}</span>
                {selectedOption.subtext && (
                  <span className="text-[10px] text-zinc-400 font-normal truncate">({selectedOption.subtext})</span>
                )}
              </div>
            ) : value ? (
              <div className="flex items-center gap-2 truncate">
                <span className="text-zinc-800 font-bold truncate">{value}</span>
                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[9px] rounded font-bold uppercase shrink-0">
                  Custom ID
                </span>
              </div>
            ) : (
              <span className="text-zinc-400 font-normal">{placeholder}</span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {value && (
              <div
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange('');
                }}
                className="p-1 hover:bg-zinc-200 rounded text-zinc-400 hover:text-zinc-700 transition-colors"
                title="Clear selection"
              >
                <X className="w-3.5 h-3.5" />
              </div>
            )}
            {isOpen ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
          </div>
        </button>

        {isOpen && (
          <div className="absolute z-50 left-0 right-0 mt-1 bg-white border-2 border-[#141414] rounded-xl shadow-xl overflow-hidden flex flex-col max-h-72">
            <div className="p-2 border-b border-zinc-100 bg-zinc-50 flex items-center gap-2">
              <Search className="w-4 h-4 text-zinc-400 shrink-0 ml-1" />
              <input
                type="text"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${type}s...`}
                className="w-full bg-transparent font-mono text-xs focus:outline-none p-1 text-zinc-800"
              />
              {onRefresh && (
                <button
                  type="button"
                  onClick={onRefresh}
                  title="Refresh from Discord"
                  className="p-1 text-zinc-400 hover:text-indigo-600 rounded transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>

            {error && (
              <div className="p-2.5 bg-rose-50 text-rose-800 font-mono text-[10px] border-b border-rose-100 flex justify-between items-center">
                <span>{error}</span>
                {onRefresh && (
                  <button type="button" onClick={onRefresh} className="underline font-bold text-rose-900 ml-2">
                    Retry
                  </button>
                )}
              </div>
            )}

            <div className="overflow-y-auto flex-1 p-1 space-y-0.5 max-h-52 font-mono text-xs">
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                  !value ? 'bg-zinc-100 text-zinc-900 font-bold' : 'text-zinc-500 hover:bg-zinc-50'
                }`}
              >
                <span className="italic text-zinc-400">None / Unset</span>
                {!value && <Check className="w-3.5 h-3.5 text-indigo-600" />}
              </button>

              {filteredOptions.length === 0 ? (
                <div className="p-4 text-center font-mono text-xs text-zinc-400 italic">
                  {isLoading ? 'Loading server data...' : `No ${type}s found matching "${search}"`}
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = opt.id === value;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        onChange(opt.id);
                        setIsOpen(false);
                        setSearch('');
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-indigo-50 text-indigo-900 font-bold border border-indigo-200'
                          : 'hover:bg-zinc-100 text-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate min-w-0">
                        {type === 'channel' ? (
                          <Hash className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        ) : (
                          <span
                            className="w-3 h-3 rounded-full shrink-0 border border-black/10"
                            style={{ backgroundColor: opt.color || '#6B7280' }}
                          />
                        )}
                        <span className="truncate">{opt.name}</span>
                        {opt.subtext && (
                          <span className="text-[10px] text-zinc-400 font-normal shrink-0">
                            {opt.subtext}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[9px] text-zinc-400 font-mono">{opt.id}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="p-2 border-t border-zinc-100 bg-zinc-50 flex justify-between items-center text-[10px] font-mono text-zinc-400">
              <span>
                {options.length} {type}s available
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsManualInput(true);
                  setIsOpen(false);
                }}
                className="text-indigo-600 hover:text-indigo-800 font-bold uppercase underline"
              >
                Raw ID Entry
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [adminName, setAdminName] = useState('');
  const [role, setRole] = useState('');
  const [discordId, setDiscordId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reports, setReports] = useState<any[]>([]);
  const [appeals, setAppeals] = useState<any[]>([]);
  const [guilds, setGuilds] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [apiKeyRequests, setApiKeyRequests] = useState<any[]>([]);
  const [activeApiKeys, setActiveApiKeys] = useState<any[]>([]);
  const [revokingKey, setRevokingKey] = useState<{ id: string; botName: string; botId: string; key: string } | null>(null);
  const [revocationReasonInput, setRevocationReasonInput] = useState('');
  const [isRevokingKey, setIsRevokingKey] = useState(false);
  const [systemConfig, setSystemConfig] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [linkCode, setLinkCode] = useState('');
  const [inputLinkCode, setInputLinkCode] = useState('');
  const [generatedWebCode, setGeneratedWebCode] = useState('');
  const [isSubmittingLink, setIsSubmittingLink] = useState(false);
  const [selectedGuild, setSelectedGuild] = useState<any>(null);
  const [editingGuildSettings, setEditingGuildSettings] = useState<any>(null);
  const [isSavingGuildSettings, setIsSavingGuildSettings] = useState(false);
  const [isDeletingGuild, setIsDeletingGuild] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCustomBotToken, setShowCustomBotToken] = useState(false);
  const [view, setView] = useState<'profile' | 'platforms' | 'verify' | 'guilds' | 'admin' | 'bans' | 'lookup' | 'verifications' | 'developers' | 'apikeys' | 'settings' | 'banlists' | 'cases' | 'link' | 'georules' | 'apibots' | 'trustedcompanies'>('profile');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [dashboardPassword, setDashboardPassword] = useState('');
  const [dashboardPasswordConfirm, setDashboardPasswordConfirm] = useState('');
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [passwordSetupError, setPasswordSetupError] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [email, setEmail] = useState('');
  const [forgotPassword, setForgotPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [staffList, setStaffList] = useState<any[]>([]);

  // Cases management state
  const [cases, setCases] = useState<any[]>([]);
  const [showAllCases, setShowAllCases] = useState(false);
  const showAllCasesRef = React.useRef(false);
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [caseMessage, setCaseMessage] = useState('');
  const [caseAttachments, setCaseAttachments] = useState<string[]>([]);
  const [caseUrlInput, setCaseUrlInput] = useState('');
  const [appealAttachments, setAppealAttachments] = useState<string[]>([]);
  const [appealUrlInput, setAppealUrlInput] = useState('');
  const [selectedImageModal, setSelectedImageModal] = useState<string | null>(null);

  // Custom Banlist states
  const [customBanlists, setCustomBanlists] = useState<any[]>([]);
  const [newBanlistName, setNewBanlistName] = useState('');
  const [isCreatingBanlist, setIsCreatingBanlist] = useState(false);
  const [newEntryType, setNewEntryType] = useState<'discord' | 'vrchat'>('discord');
  const [newEntryTargetId, setNewEntryTargetId] = useState('');
  const [newEntryReason, setNewEntryReason] = useState('');
  const [selectedBanlistForAdding, setSelectedBanlistForAdding] = useState<string | null>(null);
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [banlistErrorMessage, setBanlistErrorMessage] = useState('');
  
  // Selection / Detail Modals
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [selectedAppeal, setSelectedAppeal] = useState<any>(null);
  const [selectedVerification, setSelectedVerification] = useState<any>(null);
  const [linkingVRChatUser, setLinkingVRChatUser] = useState<any>(null);

  // VRChat linking inputs
  const [linkVRChatUserId, setLinkVRChatUserId] = useState('');
  const [linkVRChatUsername, setLinkVRChatUsername] = useState('');
  const [isLinkingVRChat, setIsLinkingVRChat] = useState(false);

  // System Config Form Fields
  const configLoadedRef = React.useRef(false);
  const [notificationEmail, setNotificationEmail] = useState('');
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState<number | string>(587);
  const [smtpSecure, setSmtpSecure] = useState(false);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpFrom, setSmtpFrom] = useState('');
  const [smtpRejectUnauthorized, setSmtpRejectUnauthorized] = useState(false);
  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [testEmailRecipient, setTestEmailRecipient] = useState('');
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [smtpTestFeedback, setSmtpTestFeedback] = useState<{
    success: boolean;
    message: string;
    elapsedMs?: number;
    logs?: string[];
  } | null>(null);
  const [copiedSmtpLogs, setCopiedSmtpLogs] = useState(false);
  const [vrchatUsername, setVrchatUsername] = useState('');
  const [vrchatPassword, setVrchatPassword] = useState('');
  const [vrchatCookie, setVrchatCookie] = useState('');
  const [vrchatGroupId, setVrchatGroupId] = useState('');
  const [vrchatBotEnabled, setVrchatBotEnabled] = useState(false);
  const [twoFactorAuthApiUrl, setTwoFactorAuthApiUrl] = useState('');
  const [twoFactorAuthApiToken, setTwoFactorAuthApiToken] = useState('');
  const [twoFactorAuthAccountId, setTwoFactorAuthAccountId] = useState('');
  const [vrchatBots, setVrchatBots] = useState<any[]>([]);
  const [newBotEmail, setNewBotEmail] = useState('');
  const [newBotPassword, setNewBotPassword] = useState('');
  const [newBotCookie, setNewBotCookie] = useState('');
  const [newBotTwoFactorLabel, setNewBotTwoFactorLabel] = useState('');
  const [disableAgeVerifyCommand, setDisableAgeVerifyCommand] = useState(false);
  const [isSyncingDiscordCommands, setIsSyncingDiscordCommands] = useState(false);
  const [discordSyncFeedback, setDiscordSyncFeedback] = useState<{ message: string; success: boolean; count?: number } | null>(null);
  const [isPruningServers, setIsPruningServers] = useState(false);

  // Subject management state
  const [bannedUsers, setBannedUsers] = useState<any[]>([]);
  const [watchlistUsers, setWatchlistUsers] = useState<any[]>([]);
  const [trustedUsers, setTrustedUsers] = useState<any[]>([]);
  const [banSubTab, setBanSubTab] = useState<'cases' | 'trusted' | 'watchlist'>('cases');
  const [manualBanId, setManualBanId] = useState('');
  const [manualBanReason, setManualBanReason] = useState('');
  const [manualBanError, setManualBanError] = useState('');
  const [manualTrustId, setManualTrustId] = useState('');
  const [manualTrustReason, setManualTrustReason] = useState('');
  const [banSearch, setBanSearch] = useState('');

  // Editing state variables
  const [editingBanReason, setEditingBanReason] = useState<{ id: string, reason: string } | null>(null);
  const [editingTrustIndex, setEditingTrustIndex] = useState<{ id: string, index: string } | null>(null);
  const [editingDangerousNotes, setEditingDangerousNotes] = useState<{ id: string, notes: string } | null>(null);
  const [editingReputation, setEditingReputation] = useState<{ id: string, score: string } | null>(null);
  const [editingReportReason, setEditingReportReason] = useState<{ id: string, reason: string } | null>(null);
  const [editingVRChat, setEditingVRChat] = useState<{ id: string; vrchatUserId: string; vrchatUsername: string; vrchatAlts: { vrchatUserId: string; vrchatUsername: string }[] } | null>(null);
  
  const [appealMessage, setAppealMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isActioningReport, setIsActioningReport] = useState(false);
  const [isActioningAppeal, setIsActioningAppeal] = useState(false);
  const [isActioningVerification, setIsActioningVerification] = useState(false);
  const [userEvidenceLinks, setUserEvidenceLinks] = useState<string[]>([]);
  const [isUpdatingEvidence, setIsUpdatingEvidence] = useState(false);
  const [expandedBan, setExpandedBan] = useState<string | null>(null);

  const [lookupId, setLookupId] = useState('');
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [showAddWarningModal, setShowAddWarningModal] = useState(false);
  const [warningReasonInput, setWarningReasonInput] = useState('');
  const [isIssuingWarning, setIsIssuingWarning] = useState(false);

  const [invitingBot, setInvitingBot] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const [showSetup, setShowSetup] = useState(false);

  // Server Backup & Restore State
  const [guildBackups, setGuildBackups] = useState<any[]>([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState<boolean>(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState<boolean>(false);
  const [isUploadingBackup, setIsUploadingBackup] = useState<boolean>(false);
  const [backupNameInput, setBackupNameInput] = useState<string>('');
  const [restoringBackupId, setRestoringBackupId] = useState<string | null>(null);
  const [backupStatusMsg, setBackupStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchGuildBackups = async (guildId: string) => {
    setIsLoadingBackups(true);
    const token = localStorage.getItem('gg_token');
    try {
      const res = await fetch(`/api/user/guilds/${guildId}/backups`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setGuildBackups(data);
      }
    } catch (e) {
      console.error('Failed to fetch guild backups', e);
    } finally {
      setIsLoadingBackups(false);
    }
  };

  // Discord Channels & Roles for Guild Config
  const [guildChannels, setGuildChannels] = useState<Array<{ id: string; name: string; type: number; parentName?: string }>>([]);
  const [guildRoles, setGuildRoles] = useState<Array<{ id: string; name: string; color: string; position: number }>>([]);
  const [isLoadingDiscordData, setIsLoadingDiscordData] = useState<boolean>(false);
  const [discordDataError, setDiscordDataError] = useState<string | null>(null);

  const fetchDiscordDataForGuild = async (guildId: string) => {
    setIsLoadingDiscordData(true);
    setDiscordDataError(null);
    try {
      const token = localStorage.getItem('gg_token');
      const res = await fetch(`/api/user/guilds/${guildId}/discord-data`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setGuildChannels(data.channels || []);
        setGuildRoles(data.roles || []);
        if (data.guildName || typeof data.shardId === 'number') {
          setSelectedGuild((prev: any) =>
            prev
              ? {
                  ...prev,
                  ...(data.guildName ? { name: data.guildName } : {}),
                  ...(typeof data.shardId === 'number' ? { shardId: data.shardId, botStatus: data.botStatus } : {}),
                }
              : prev
          );
          setGuilds((prevGuilds: any[]) =>
            prevGuilds.map((g: any) =>
              g.id === guildId
                ? {
                    ...g,
                    ...(data.guildName ? { name: data.guildName } : {}),
                    ...(typeof data.shardId === 'number' ? { shardId: data.shardId, botStatus: data.botStatus } : {}),
                  }
                : g
            )
          );
        }
      } else {
        const err = await res.json().catch(() => ({}));
        setDiscordDataError(err.error || 'Failed to fetch Discord server channels & roles');
        setGuildChannels([]);
        setGuildRoles([]);
      }
    } catch (e: any) {
      setDiscordDataError('Network error loading Discord data');
      setGuildChannels([]);
      setGuildRoles([]);
    } finally {
      setIsLoadingDiscordData(false);
    }
  };

  const handleCreateGuildBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGuild) return;
    setIsCreatingBackup(true);
    setBackupStatusMsg(null);
    const token = localStorage.getItem('gg_token');
    try {
      const res = await fetch(`/api/user/guilds/${selectedGuild.id}/backups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: backupNameInput })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create backup');
      setBackupNameInput('');
      setBackupStatusMsg({ type: 'success', text: `Backup snapshot "${data.name}" created successfully!` });
      await fetchGuildBackups(selectedGuild.id);
    } catch (e: any) {
      setBackupStatusMsg({ type: 'error', text: e.message || 'Failed to create backup' });
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleDownloadGuildBackup = async (backupId: string, backupName: string) => {
    if (!selectedGuild) return;
    const token = localStorage.getItem('gg_token');
    setBackupStatusMsg(null);
    try {
      const res = await fetch(`/api/user/guilds/${selectedGuild.id}/backups/${backupId}/download`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to download backup JSON');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${selectedGuild.id}-${backupName.replace(/[^a-z0-9]/gi, '_')}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setBackupStatusMsg({ type: 'success', text: `Downloaded backup snapshot "${backupName}" as JSON.` });
    } catch (e: any) {
      setBackupStatusMsg({ type: 'error', text: e.message || 'Failed to download backup JSON' });
    }
  };

  const handleRestoreGuildBackup = async (backupId: string, backupName: string) => {
    if (!selectedGuild) return;
    if (!confirm(`⚠️ ARE YOU SURE YOU WANT TO ROLL BACK SERVER "${selectedGuild.name}"?\n\nThis will restore all roles, channels, categories, permissions, and server settings to match backup snapshot "${backupName}". Existing channels and roles created after the backup will be re-created or cleaned up.`)) {
      return;
    }

    setRestoringBackupId(backupId);
    setBackupStatusMsg(null);
    const token = localStorage.getItem('gg_token');
    try {
      const res = await fetch(`/api/user/guilds/${selectedGuild.id}/backups/${backupId}/restore`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to restore backup');
      setBackupStatusMsg({ type: 'success', text: data.message || 'Server backup successfully restored!' });
    } catch (e: any) {
      setBackupStatusMsg({ type: 'error', text: e.message || 'Failed to restore server backup' });
    } finally {
      setRestoringBackupId(null);
    }
  };

  const handleDeleteGuildBackup = async (backupId: string) => {
    if (!selectedGuild) return;
    if (!confirm('Are you sure you want to delete this backup snapshot?')) return;
    const token = localStorage.getItem('gg_token');
    setBackupStatusMsg(null);
    try {
      const res = await fetch(`/api/user/guilds/${selectedGuild.id}/backups/${backupId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setGuildBackups(prev => prev.filter(b => b._id !== backupId && b.id !== backupId));
        setBackupStatusMsg({ type: 'success', text: 'Backup snapshot deleted successfully.' });
      } else {
        setBackupStatusMsg({ type: 'error', text: data.error || 'Failed to delete backup snapshot' });
      }
    } catch (e: any) {
      console.error('Failed to delete backup', e);
      setBackupStatusMsg({ type: 'error', text: e?.message || 'Failed to delete backup snapshot' });
    }
  };

  const handleUploadGuildBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedGuild) return;

    setIsUploadingBackup(true);
    setBackupStatusMsg(null);
    const token = localStorage.getItem('gg_token');

    try {
      const text = await file.text();
      let backupJson: any;
      try {
        backupJson = JSON.parse(text);
      } catch (err) {
        throw new Error('Selected file is not valid JSON format.');
      }

      const res = await fetch(`/api/user/guilds/${selectedGuild.id}/backups/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(backupJson)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload backup JSON');

      setBackupStatusMsg({ type: 'success', text: `Backup snapshot "${data.name}" uploaded successfully!` });
      await fetchGuildBackups(selectedGuild.id);
    } catch (err: any) {
      setBackupStatusMsg({ type: 'error', text: err.message || 'Failed to upload backup file' });
    } finally {
      setIsUploadingBackup(false);
      e.target.value = '';
    }
  };

  useEffect(() => {
    checkSetup();
    const token = localStorage.getItem('gg_token') || localStorage.getItem('adminToken');
    if (token) {
      localStorage.setItem('gg_token', token);
      localStorage.setItem('adminToken', token);
      fetchUserInfo(token);
    } else {
      setLoading(false);
    }
  }, []);

  const checkSetup = async () => {
    try {
      const res = await fetch('/api/auth/setup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      if (res.status === 403) {
        setShowSetup(false);
      } else {
        setShowSetup(true);
      }
    } catch (e) {}
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        setShowSetup(false);
        setError('Admin setup successful! Please login.');
      } else {
        const data = await res.json();
        setError(data.error || 'Setup failed');
      }
    } catch (err) {
      setError('Connection error');
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      const token = localStorage.getItem('gg_token');
      if (!token) return;

      const fetchData = (isPoll = false) => fetchDashboardData(token, role, isPoll);
      
      fetchData(false);
      const interval = setInterval(() => fetchData(true), 10000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, role]);

  const fetchUserInfo = async (token: string) => {
    try {
      const res = await fetch('/api/user/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setIsLoggedIn(true);
        setUserProfile(data);
        setAdminName(data.displayName || data.username);
        setRole(data.role);
        setDiscordId(data.discordId || '');
        fetchDashboardData(token, data.role);
      } else {
        handleLogout();
      }
    } catch (err) {
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const handleLinkDiscordWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputLinkCode.trim()) return;
    setError('');
    setSuccessMessage('');
    setIsSubmittingLink(true);
    try {
      const token = localStorage.getItem('gg_token');
      const res = await fetch('/api/user/link-discord', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code: inputLinkCode.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDiscordId(data.discordId);
        setSuccessMessage('Discord account linked successfully!');
        setInputLinkCode('');
      } else {
        setError(data.error || 'Failed to link Discord account');
      }
    } catch (err) {
      setError('Connection error while linking Discord account');
    } finally {
      setIsSubmittingLink(false);
    }
  };

  const handleGenerateWebCode = async () => {
    setError('');
    setSuccessMessage('');
    setIsSubmittingLink(true);
    try {
      const token = localStorage.getItem('gg_token');
      const res = await fetch('/api/user/generate-link-code', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGeneratedWebCode(data.code);
        setSuccessMessage(`Link code generated: ${data.code}. Run /link code: ${data.code} in Discord!`);
      } else {
        setError(data.error || 'Failed to generate link code');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setIsSubmittingLink(false);
    }
  };

  const handleUnlinkDiscord = async () => {
    if (!confirm('Are you sure you want to unlink your Discord account?')) return;
    setError('');
    setSuccessMessage('');
    try {
      const token = localStorage.getItem('gg_token');
      const res = await fetch('/api/user/unlink-discord', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDiscordId('');
        setGeneratedWebCode('');
        setSuccessMessage('Discord account unlinked successfully.');
      } else {
        setError(data.error || 'Failed to unlink account');
      }
    } catch (err) {
      setError('Connection error');
    }
  };

  const fetchDashboardData = async (token: string, userRole: string, isBackgroundPoll = false) => {
    try {
      const isStaff = userRole === 'admin' || userRole === 'moderator';

      const requests: Promise<any>[] = [
        fetch('/api/user/guilds', { headers: { 'Authorization': `Bearer ${token}` } })
      ];

      if (isStaff) {
        requests.push(fetch('/api/admin/reports', { headers: { 'Authorization': `Bearer ${token}` } }));
        requests.push(fetch('/api/admin/appeals', { headers: { 'Authorization': `Bearer ${token}` } }));
        requests.push(fetch('/api/admin/stats', { headers: { 'Authorization': `Bearer ${token}` } }));
        requests.push(fetch('/api/admin/logs', { headers: { 'Authorization': `Bearer ${token}` } }));
        requests.push(fetch('/api/admin/bans', { headers: { 'Authorization': `Bearer ${token}` } }));
        requests.push(fetch('/api/admin/verifications', { headers: { 'Authorization': `Bearer ${token}` } }));
        requests.push(fetch('/api/admin/trusted', { headers: { 'Authorization': `Bearer ${token}` } }));
        requests.push(fetch('/api/public/dangerous'));
        requests.push(fetch(`/api/admin/cases${showAllCasesRef.current ? '?all=true' : ''}`, { headers: { 'Authorization': `Bearer ${token}` } }));
      }

      if (userRole === 'admin') {
        requests.push(fetch('/api/admin/api-key-requests', { headers: { 'Authorization': `Bearer ${token}` } }));
        requests.push(fetch('/api/admin/api-keys', { headers: { 'Authorization': `Bearer ${token}` } }));
        requests.push(fetch('/api/admin/config', { headers: { 'Authorization': `Bearer ${token}` } }));
        requests.push(fetch('/api/admin/staff', { headers: { 'Authorization': `Bearer ${token}` } }));
      }

      const results = await Promise.all(requests);
      
      if (results[0].ok) {
        const fetchedGuilds = await results[0].json();
        setGuilds(fetchedGuilds);
        setSelectedGuild((prev: any) => {
          if (!prev) return null;
          const match = fetchedGuilds.find((g: any) => g.id === prev.id);
          return match ? { ...prev, name: match.name || prev.name } : prev;
        });
      }
      
      if (isStaff) {
        if (results[1]?.ok) setReports(await results[1].json());
        if (results[2]?.ok) setAppeals(await results[2].json());
        if (results[3]?.ok) setStats(await results[3].json());
        if (results[4]?.ok) setLogs(await results[4].json());
        if (results[5]?.ok) setBannedUsers(await results[5].json());
        if (results[6]?.ok) setVerifications(await results[6].json());
        if (results[7]?.ok) setTrustedUsers(await results[7].json());
        if (results[8]?.ok) setWatchlistUsers(await results[8].json());
        if (results[9]?.ok) setCases(await results[9].json());
      }

      if (userRole === 'admin') {
        const offset = 10;
        if (results[offset]?.ok) setApiKeyRequests(await results[offset].json());
        if (results[offset + 1]?.ok) setActiveApiKeys(await results[offset + 1].json());
        
        if (results[offset + 2]?.ok) {
          const config = await results[offset + 2].json();
          setSystemConfig(config);
          
          if (!isBackgroundPoll || !configLoadedRef.current) {
            const loadedNotifEmail = config.notificationEmail || '';
            setNotificationEmail(loadedNotifEmail);
            setSmtpHost(config.smtpHost || '');
            setSmtpPort(config.smtpPort ?? 587);
            setSmtpSecure(Boolean(config.smtpSecure));
            setSmtpUser(config.smtpUser || '');
            setSmtpPass(config.smtpPass || '');
            setSmtpFrom(config.smtpFrom || '');
            setSmtpRejectUnauthorized(Boolean(config.smtpRejectUnauthorized));
            setTestEmailRecipient((prev) => prev || loadedNotifEmail);
            setVrchatUsername(config.vrchatUsername || '');
            setVrchatPassword(config.vrchatPassword || '');
            setVrchatCookie(config.vrchatCookie || '');
            setVrchatGroupId(config.vrchatGroupId || '');
            setVrchatBotEnabled(config.vrchatBotEnabled || false);
            setTwoFactorAuthApiUrl(config.twoFactorAuthApiUrl || '');
            setTwoFactorAuthApiToken(config.twoFactorAuthApiToken || '');
            setTwoFactorAuthAccountId(config.twoFactorAuthAccountId || '');
            setVrchatBots(config.vrchatBots || []);
            setDisableAgeVerifyCommand(Boolean(config.disableAgeVerifyCommand));
            configLoadedRef.current = true;
          }
        }

        if (results[offset + 3]?.ok) {
          setStaffList(await results[offset + 3].json());
        }
      }

      // Fetch custom banlists for any logged-in user
      try {
        const banlistRes = await fetch('/api/custom-banlists', { 
          headers: { 'Authorization': `Bearer ${token}` } 
        });
        if (banlistRes.ok) {
          setCustomBanlists(await banlistRes.json());
        }
      } catch (err) {
        console.error('Failed to fetch custom banlists', err);
      }
    } catch (error) {
      console.error('Failed to fetch data', error);
    }
  };

  const handleUpdateSystemConfig = async () => {
    const token = localStorage.getItem('gg_token');
    try {
      const parsedPort = Number.parseInt(String(smtpPort), 10);
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          notificationEmail,
          smtpHost,
          smtpPort: Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 587,
          smtpSecure,
          smtpUser,
          smtpPass,
          smtpFrom,
          smtpRejectUnauthorized,
          vrchatUsername,
          vrchatPassword,
          vrchatCookie,
          vrchatGroupId: extractVRChatGroupId(vrchatGroupId),
          vrchatBotEnabled,
          twoFactorAuthApiUrl,
          twoFactorAuthApiToken,
          twoFactorAuthAccountId,
          vrchatBots,
          disableAgeVerifyCommand
        })
      });
      if (res.ok) {
        setSuccessMessage('System configuration saved successfully!');
        configLoadedRef.current = false;
        fetchDashboardData(token!, role, false);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update system settings');
      }
    } catch (err) {
      setError('Connection error saving configuration');
    }
  };

  const handleSendTestEmail = async () => {
    const recipient = (testEmailRecipient || notificationEmail).trim();
    if (!recipient) {
      setSmtpTestFeedback({
        success: false,
        message: 'Enter a test recipient email address (or Notification Email) first.',
      });
      return;
    }

    const token = localStorage.getItem('gg_token');
    setIsTestingSmtp(true);
    setSmtpTestFeedback(null);
    try {
      const parsedPort = Number.parseInt(String(smtpPort), 10);
      const payload = {
        action: 'test-email',
        testEmail: true,
        recipientEmail: recipient,
        notificationEmail,
        smtpHost,
        smtpPort: Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 587,
        smtpSecure,
        smtpUser,
        smtpPass,
        smtpFrom,
        smtpRejectUnauthorized,
      };

      let res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 404) {
        res = await fetch('/api/admin/config/test-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setSmtpTestFeedback({
          success: true,
          message: data.message || `Test email sent to ${recipient}.`,
          elapsedMs: data.elapsedMs,
          logs: Array.isArray(data.logs) ? data.logs : [],
        });
      } else {
        setSmtpTestFeedback({
          success: false,
          message: data.error || 'Failed to send test email.',
          elapsedMs: data.elapsedMs,
          logs: Array.isArray(data.logs) ? data.logs : [],
        });
      }
    } catch (err: any) {
      setSmtpTestFeedback({
        success: false,
        message: err?.message || 'Network error while testing SMTP connection.',
        logs: [`[CLIENT-ERROR] ${err?.message || 'Network request failed'}`],
      });
    } finally {
      setIsTestingSmtp(false);
    }
  };

  const handlePruneStaleServers = async () => {
    if (!confirm('Prune Discord server records that have been absent from every connected shard for at least 24 hours?')) return;
    const token = localStorage.getItem('gg_token');
    if (!token) return;

    setIsPruningServers(true);
    setError('');
    setSuccessMessage('');
    try {
      const res = await fetch('/api/admin/discord/prune-stale-servers', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to prune stale Discord servers.');

      const prunedIds = new Set((data.prunedGuilds || []).map((guild: { id: string }) => guild.id));
      setGuilds((currentGuilds) => currentGuilds.filter((guild) => !prunedIds.has(guild.id)));
      setSuccessMessage(data.prunedCount
        ? `Pruned ${data.prunedCount} stale Discord server record(s).`
        : 'No stale Discord server records older than 24 hours were found.');
      fetchDashboardData(token, role, true);
      setTimeout(() => setSuccessMessage(''), 6000);
    } catch (error: any) {
      setError(error?.message || 'Failed to prune stale Discord servers.');
    } finally {
      setIsPruningServers(false);
    }
  };

  const handleSyncDiscordCommands = async (overrideDisable?: boolean) => {
    const token = localStorage.getItem('gg_token');
    if (!token) return;
    setIsSyncingDiscordCommands(true);
    setDiscordSyncFeedback(null);
    const targetDisabled = typeof overrideDisable === 'boolean' ? overrideDisable : disableAgeVerifyCommand;
    try {
      const res = await fetch('/api/admin/discord/sync-commands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ disableAgeVerifyCommand: targetDisabled })
      });
      const data = await res.json();
      if (res.ok) {
        setDisableAgeVerifyCommand(Boolean(data.ageVerifyDisabled));
        setDiscordSyncFeedback({
          message: data.message || (data.ageVerifyDisabled ? '/age-verify slash command is now disabled and unsynced from Discord.' : '/age-verify slash command is now enabled and synced with Discord.'),
          success: true,
          count: data.count
        });
        fetchDashboardData(token, role, true);
        setTimeout(() => setDiscordSyncFeedback(null), 8000);
      } else {
        setDiscordSyncFeedback({
          message: data.error || 'Failed to sync slash commands with Discord.',
          success: false
        });
      }
    } catch (err) {
      setDiscordSyncFeedback({
        message: 'Network error connecting to Discord synchronization API.',
        success: false
      });
    } finally {
      setIsSyncingDiscordCommands(false);
    }
  };

  const fetchStaffList = async () => {
    const token = localStorage.getItem('gg_token');
    if (!token) return;
    try {
      const res = await fetch('/api/admin/staff', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setStaffList(await res.json());
      }
    } catch (e) {
      console.error('Failed to fetch staff list', e);
    }
  };

  const [banAccountTarget, setBanAccountTarget] = useState<any | null>(null);
  const [banAccountReason, setBanAccountReason] = useState('');
  const [accountActionLoadingId, setAccountActionLoadingId] = useState<string | null>(null);

  const handleUpdateStaffRole = async (staffId: string, newRole: string) => {
    const token = localStorage.getItem('gg_token');
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/staff/${staffId}/role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        setSuccessMessage('Staff role updated successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchStaffList();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update staff role');
      }
    } catch (e) {
      setError('Error updating staff role');
    }
  };

  const handleToggleAccountVerification = async (
    staffId: string,
    payload: { isAgeVerified?: boolean }
  ) => {
    const token = localStorage.getItem('gg_token');
    if (!token) return;
    setAccountActionLoadingId(staffId);
    try {
      const res = await fetch(`/api/admin/staff/${staffId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(data.message || 'Verification status updated');
        setTimeout(() => setSuccessMessage(''), 4000);
        fetchStaffList();
      } else {
        setError(data.error || 'Failed to update verification status');
      }
    } catch (e) {
      setError('Error updating verification status');
    } finally {
      setAccountActionLoadingId(null);
    }
  };


  const handleAccountBanSubmit = async (staffId: string, isBanned: boolean, reason?: string) => {
    const token = localStorage.getItem('gg_token');
    if (!token) return;
    setAccountActionLoadingId(staffId);
    try {
      const res = await fetch(`/api/admin/staff/${staffId}/ban`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isBanned, reason: reason?.trim() || undefined })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(data.message || (isBanned ? 'Account blocked and ban email sent' : 'Account unblocked'));
        setTimeout(() => setSuccessMessage(''), 5000);
        setBanAccountTarget(null);
        setBanAccountReason('');
        fetchStaffList();
      } else {
        setError(data.error || 'Failed to update account block status');
      }
    } catch (e) {
      setError('Error updating account block status');
    } finally {
      setAccountActionLoadingId(null);
    }
  };

  const handleAddVRChatBot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBotEmail.trim()) {
      setError('Bot username/email is required');
      return;
    }

    const newBot = {
      id: 'bot_' + Math.random().toString(36).substring(2, 11),
      vrchatUsername: newBotEmail.trim(),
      vrchatPassword: newBotPassword.trim(),
      vrchatCookie: newBotCookie.trim(),
      twoFactorAuthAccountId: newBotTwoFactorLabel.trim(),
      groupCount: 0,
      groups: [],
      status: 'Disconnected',
      lastActive: new Date()
    };

    setVrchatBots([...vrchatBots, newBot]);
    setNewBotEmail('');
    setNewBotPassword('');
    setNewBotCookie('');
    setNewBotTwoFactorLabel('');
    setSuccessMessage('VRChat bot added locally. Click "Commit VRChat Configuration" below to apply.');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleRemoveVRChatBot = (id: string) => {
    setVrchatBots(vrchatBots.filter(bot => bot.id !== id));
    setSuccessMessage('VRChat bot removed locally. Click "Commit VRChat Configuration" below to apply.');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleSaveGuildSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGuild || !editingGuildSettings) return;
    setIsSavingGuildSettings(true);
    setError('');
    setSuccessMessage('');
    const token = localStorage.getItem('gg_token');
    try {
      const settingsToSave = {
        ...editingGuildSettings,
        vrchatGroupId: extractVRChatGroupId(editingGuildSettings.vrchatGroupId)
      };
      const res = await fetch(`/api/user/guilds/${selectedGuild.id}/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ settings: settingsToSave })
      });
      if (res.ok) {
        const updatedGuild = await res.json();
        setSuccessMessage(`Configuration for ${selectedGuild.name || 'group'} successfully saved.`);
        setGuilds(prev => prev.map(g => g.id === selectedGuild.id ? updatedGuild : g));
        setSelectedGuild(null);
        setEditingGuildSettings(null);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update guild settings.');
      }
    } catch (err) {
      setError('Connection failure updating settings.');
    } finally {
      setIsSavingGuildSettings(false);
    }
  };

  const handleDeleteGuild = async () => {
    if (!selectedGuild) return;
    setIsDeletingGuild(true);
    setError('');
    setSuccessMessage('');
    const token = localStorage.getItem('gg_token');
    try {
      const res = await fetch(`/api/user/guilds/${selectedGuild.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setSuccessMessage(`Guild ${selectedGuild.name || 'node'} deleted successfully.`);
        setGuilds(prev => prev.filter(g => g.id !== selectedGuild.id));
        setSelectedGuild(null);
        setEditingGuildSettings(null);
        setShowDeleteConfirm(false);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete guild.');
      }
    } catch (err) {
      setError('Connection failure deleting guild.');
    } finally {
      setIsDeletingGuild(false);
    }
  };

  const handleConnectVRChatToUser = async () => {
    if (!linkingVRChatUser) return;
    setIsLinkingVRChat(true);
    setError('');
    try {
      const token = localStorage.getItem('gg_token');
      const res = await fetch(`/api/admin/user/${linkingVRChatUser.id}/connect-vrchat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          vrchatUserId: linkVRChatUserId,
          vrchatUsername: linkVRChatUsername
        })
      });
      if (res.ok) {
        setSuccessMessage(`Successfully linked to VRChat user ${linkVRChatUsername}`);
        setLinkingVRChatUser(null);
        setLinkVRChatUserId('');
        setLinkVRChatUsername('');
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchDashboardData(token!, role);
        if (lookupResult && lookupResult.id === linkingVRChatUser.id) {
          setLookupResult({
            ...lookupResult,
            vrchatUserId: linkVRChatUserId,
            vrchatUsername: linkVRChatUsername
          });
        }
      } else {
        const data = await res.json();
        setError(data.error || 'VRChat linking transaction failed.');
      }
    } catch (err) {
      setError('Network communication failed during VRChat link.');
    } finally {
      setIsLinkingVRChat(false);
    }
  };

  const handleDisconnectVRChat = async (userId: string, vrchatUserId: string) => {
    // We avoid window.confirm as it represents an iFrame alert restriction, instead we just do the disconnect or double check
    setError('');
    try {
      const token = localStorage.getItem('gg_token');
      const res = await fetch(`/api/admin/user/${userId}/disconnect-vrchat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ vrchatUserId })
      });
      if (res.ok) {
        setSuccessMessage('Successfully disconnected VRChat account');
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchDashboardData(token!, role);
        if (lookupResult && lookupResult.id === userId) {
          if (lookupResult.vrchatUserId === vrchatUserId) {
            setLookupResult({
              ...lookupResult,
              vrchatUserId: lookupResult.vrchatAlts?.[0]?.vrchatUserId || '',
              vrchatUsername: lookupResult.vrchatAlts?.[0]?.vrchatUsername || '',
              vrchatAlts: lookupResult.vrchatAlts?.slice(1) || []
            });
          } else {
            setLookupResult({
              ...lookupResult,
              vrchatAlts: lookupResult.vrchatAlts?.filter((alt: any) => alt.vrchatUserId !== vrchatUserId) || []
            });
          }
        }
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to disconnect VRChat account');
      }
    } catch (err) {
      setError('Network communication failed during VRChat disconnect.');
    }
  };

  const handleSendAppealMessage = async (appealId: string) => {
    if (!appealMessage.trim() && appealAttachments.length === 0) return;
    setIsSendingMessage(true);
    try {
      const token = localStorage.getItem('gg_token');
      const res = await fetch(`/api/admin/appeals/${appealId}/message`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: appealMessage,
          attachments: appealAttachments
        })
      });
      if (res.ok) {
        setAppealMessage('');
        setAppealAttachments([]);
        setSelectedAppeal(null);
        fetchDashboardData(token!, role);
        setSuccessMessage('Message and attachments transmitted to applicant.');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (e) {
      setError('Failed to send message.');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleClaimAppeal = async (appealId: string) => {
    try {
      const token = localStorage.getItem('gg_token');
      const res = await fetch(`/api/admin/appeals/${appealId}/claim`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setAppeals(prev => prev.filter(a => a._id !== appealId));
        setSelectedAppeal(null);
        setSuccessMessage('Appeal claimed! It has been organized into your Cases.');
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchCases();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to claim appeal.');
      }
    } catch (e) {
      setError('Failed to claim appeal.');
    }
  };

  const handleClaimReport = async (reportId: string) => {
    try {
      const token = localStorage.getItem('gg_token');
      const res = await fetch(`/api/admin/reports/${reportId}/claim`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setReports(prev => prev.filter(r => r._id !== reportId));
        setSelectedReport(null);
        setSuccessMessage('Report claimed! It has been opened as an active Case Ticket.');
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchCases();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to claim report.');
      }
    } catch (e) {
      setError('Failed to claim report.');
    }
  };

  const handleUnclaimCase = async (caseObj: any) => {
    try {
      const token = localStorage.getItem('gg_token');
      const endpoint = caseObj.caseType === 'report'
        ? `/api/admin/reports/${caseObj._id}/unclaim`
        : `/api/admin/appeals/${caseObj._id}/unclaim`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSelectedCase(null);
        setSuccessMessage('Case unclaimed and returned to the main queue.');
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchCases();
        if (token) fetchDashboardData(token, role);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to unclaim case.');
      }
    } catch (e) {
      setError('Failed to unclaim case.');
    }
  };

  const fetchCases = async (overrideShowAll?: boolean) => {
    try {
      const token = localStorage.getItem('gg_token');
      if (!token) return;
      const isAll = overrideShowAll !== undefined ? overrideShowAll : showAllCasesRef.current;
      showAllCasesRef.current = isAll;
      setShowAllCases(isAll);
      const res = await fetch(`/api/admin/cases${isAll ? '?all=true' : ''}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setCases(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendCaseMessage = async (caseObj: any) => {
    if (!caseMessage.trim() && caseAttachments.length === 0) return;
    setIsSendingMessage(true);
    try {
      const token = localStorage.getItem('gg_token');
      const endpoint = caseObj.caseType === 'report'
        ? `/api/admin/reports/${caseObj._id}/message`
        : `/api/admin/appeals/${caseObj._id}/message`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: caseMessage,
          attachments: caseAttachments
        })
      });
      if (res.ok) {
        setCaseMessage('');
        setCaseAttachments([]);
        setSelectedCase(null);
        setSuccessMessage('Message and evidence transmitted to recipient.');
        setTimeout(() => setSuccessMessage(''), 3000);
        const freshRes = await fetch(`/api/admin/cases${showAllCases ? '?all=true' : ''}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (freshRes.ok) {
          const freshCases = await freshRes.json();
          setCases(freshCases);
        }
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to transmit message');
      }
    } catch (e) {
      setError('Failed to transmit message.');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleUpdateUserEvidence = async (userId: string) => {
    setIsUpdatingEvidence(true);
    try {
      const token = localStorage.getItem('gg_token');
      const res = await fetch(`/api/admin/users/${userId}/evidence`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ links: userEvidenceLinks })
      });
      if (res.ok) {
        setSuccessMessage('Evidence links updated.');
        setTimeout(() => setSuccessMessage(''), 3000);
        if (lookupResult?.id === userId) {
          setLookupResult({ ...lookupResult, evidenceLinks: userEvidenceLinks });
        }
        setBannedUsers(prev => prev.map(u => u.id === userId ? { ...u, evidenceLinks: userEvidenceLinks } : u));
        setWatchlistUsers(prev => prev.map(u => u.id === userId ? { ...u, evidenceLinks: userEvidenceLinks } : u));
      }
    } catch (e) {
      setError('Failed to update evidence.');
    } finally {
      setIsUpdatingEvidence(false);
    }
  };

  const handleToggleDangerous = async (userId: string) => {
    try {
      const token = localStorage.getItem('gg_token');
      const res = await fetch(`/api/admin/users/${userId}/toggle-dangerous`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBannedUsers(prev => prev.map(u => u.id === userId ? { ...u, isDangerous: data.isDangerous, ...(data.trustIndex ? { trustIndex: data.trustIndex } : {}) } : u));
        setWatchlistUsers(prev => prev.map(u => u.id === userId ? { ...u, isDangerous: data.isDangerous, ...(data.trustIndex ? { trustIndex: data.trustIndex } : {}) } : u));
        
        // Also if we toggle it, and they aren't in watchlistUsers but were marked dangerous, we can refresh the list or just add them.
        // Or if unmarked as dangerous, maybe they disappear from list.
        // It's simplest to refetch other background data or just fetch /api/public/dangerous again!
        const fetchWRes = await fetch('/api/public/dangerous');
        if (fetchWRes.ok) {
          setWatchlistUsers(await fetchWRes.json());
        }

        setSuccessMessage(`Subject status updated.`);
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateDangerousNotes = async () => {
    if (!editingDangerousNotes) return;
    try {
      const token = localStorage.getItem('gg_token');
      const res = await fetch(`/api/admin/users/${editingDangerousNotes.id}/update-dangerous-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ notes: editingDangerousNotes.notes })
      });
      if (res.ok) {
        setBannedUsers(prev => prev.map(u => u.id === editingDangerousNotes.id ? { ...u, dangerousNotes: editingDangerousNotes.notes } : u));
        setWatchlistUsers(prev => prev.map(u => u.id === editingDangerousNotes.id ? { ...u, dangerousNotes: editingDangerousNotes.notes } : u));
        setEditingDangerousNotes(null);
        setSuccessMessage('Notes updated.');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateTrustIndex = async () => {
    if (!editingTrustIndex) return;
    try {
      const token = localStorage.getItem('gg_token');
      const res = await fetch(`/api/admin/users/${editingTrustIndex.id}/update-trust-index`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ trustIndex: editingTrustIndex.index })
      });
      if (res.ok) {
        setBannedUsers(prev => prev.map(u => u.id === editingTrustIndex.id ? { ...u, trustIndex: editingTrustIndex.index } : u));
        setWatchlistUsers(prev => prev.map(u => u.id === editingTrustIndex.id ? { ...u, trustIndex: editingTrustIndex.index } : u));
        setEditingTrustIndex(null);
        setSuccessMessage('Trust index updated.');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateReputation = async () => {
    if (!editingReputation) return;
    try {
      const token = localStorage.getItem('gg_token');
      const res = await fetch(`/api/admin/users/${editingReputation.id}/reputation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ score: editingReputation.score })
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setBannedUsers(prev => prev.map(u => u.id === editingReputation.id ? { ...u, reputation: parseInt(editingReputation.score), ...(data.trustIndex ? { trustIndex: data.trustIndex } : {}) } : u));
        setWatchlistUsers(prev => prev.map(u => u.id === editingReputation.id ? { ...u, reputation: parseInt(editingReputation.score), ...(data.trustIndex ? { trustIndex: data.trustIndex } : {}) } : u));
        setEditingReputation(null);
        setSuccessMessage('Reputation and Trust Index synchronized.');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateBanReason = async () => {
    if (!editingBanReason) return;
    try {
      const token = localStorage.getItem('gg_token');
      const res = await fetch(`/api/admin/users/${editingBanReason.id}/update-ban-reason`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ reason: editingBanReason.reason })
      });
      if (res.ok) {
        setBannedUsers(prev => prev.map(u => u.id === editingBanReason.id ? { ...u, banReason: editingBanReason.reason } : u));
        setWatchlistUsers(prev => prev.map(u => u.id === editingBanReason.id ? { ...u, banReason: editingBanReason.reason } : u));
        setEditingBanReason(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateVRChatAccounts = async () => {
    if (!editingVRChat) return;
    try {
      const token = localStorage.getItem('gg_token');
      const res = await fetch(`/api/admin/users/${editingVRChat.id}/update-vrchat-accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          vrchatUserId: editingVRChat.vrchatUserId,
          vrchatUsername: editingVRChat.vrchatUsername,
          vrchatAlts: editingVRChat.vrchatAlts
        })
      });
      if (res.ok) {
        setSuccessMessage('VRChat accounts synchronized successfully.');
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchDashboardData(token!, role);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update VRChat accounts.');
      }
    } catch (e) {
      console.error(e);
      setError('Connection failure updating VRChat accounts.');
    }
  };

  const handleInviteBot = async (rawGroupId: string) => {
    const groupId = extractVRChatGroupId(rawGroupId);
    if (!groupId || !groupId.startsWith('grp_')) {
      setInviteStatus({ type: 'error', message: 'VRChat Group ID must start with grp_' });
      return;
    }
    setInvitingBot(true);
    setInviteStatus(null);
    try {
      const token = localStorage.getItem('gg_token');
      const res = await fetch('/api/vrchat/invite-bot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ groupId })
      });
      const data = await res.json();
      if (res.ok) {
        setInviteStatus({ 
          type: 'success', 
          message: 'VRChat Bot has requested to join your room group! Please verify and accept inside your VRChat dashboard.' 
        });
      } else {
        setInviteStatus({ 
          type: 'error', 
          message: data.error || 'Failed to trigger join request. Check credentials.' 
        });
      }
    } catch (err: any) {
      setInviteStatus({ type: 'error', message: err.message || 'Connection failure.' });
    } finally {
      setInvitingBot(false);
    }
  };

  const handleUpdateReportReason = async () => {
    if (!editingReportReason) return;
    try {
      const token = localStorage.getItem('gg_token');
      const res = await fetch(`/api/admin/reports/${editingReportReason.id}/update-reason`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ reason: editingReportReason.reason })
      });
      if (res.ok) {
        setReports(reports.map(r => r._id === editingReportReason.id ? { ...r, reason: editingReportReason.reason } : r));
        setEditingReportReason(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // CUSTOM BANLIST HANDLERS
  const handleCreateBanlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBanlistName.trim()) return;
    setIsCreatingBanlist(true);
    setBanlistErrorMessage('');
    const token = localStorage.getItem('gg_token');
    try {
      const res = await fetch('/api/custom-banlists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newBanlistName.trim() })
      });
      if (res.ok) {
        setNewBanlistName('');
        // Refresh
        const freshRes = await fetch('/api/custom-banlists', { headers: { 'Authorization': `Bearer ${token}` } });
        if (freshRes.ok) setCustomBanlists(await freshRes.json());
        setSuccessMessage('Custom banlist created successfully.');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const data = await res.json();
        setBanlistErrorMessage(data.error || 'Failed to create banlist.');
      }
    } catch (err) {
      setBanlistErrorMessage('Connection error creating banlist.');
    } finally {
      setIsCreatingBanlist(false);
    }
  };

  const handleDeleteBanlist = async (id: string) => {
    if (!confirm('Are you sure you want to delete this custom banlist? This action cannot be undone.')) return;
    const token = localStorage.getItem('gg_token');
    try {
      const res = await fetch(`/api/custom-banlists/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const freshRes = await fetch('/api/custom-banlists', { headers: { 'Authorization': `Bearer ${token}` } });
        if (freshRes.ok) setCustomBanlists(await freshRes.json());
        setSuccessMessage('Banlist deleted successfully.');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete banlist.');
      }
    } catch (err) {
      alert('Connection error deleting banlist.');
    }
  };

  const handleAddBanlistEntry = async (e: React.FormEvent, banlistId: string) => {
    e.preventDefault();
    if (!newEntryTargetId.trim()) return;

    const targetId = newEntryTargetId.trim();

    // Check if target user is marked as trusted in local state to prevent blacklisting
    const isTrustedLocally = trustedUsers.some(u => 
      u.id === targetId || 
      u.vrchatUserId === targetId || 
      u.vrchatAlts?.some((alt: any) => alt.vrchatUserId === targetId)
    );
    if (isTrustedLocally) {
      setBanlistErrorMessage('Security Rule Violation: Trusted users cannot be blacklisted!');
      return;
    }

    setIsAddingEntry(true);
    setBanlistErrorMessage('');
    const token = localStorage.getItem('gg_token');
    try {
      const res = await fetch(`/api/custom-banlists/${banlistId}/entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: newEntryType,
          targetId: targetId,
          reason: newEntryReason.trim() || 'No reason provided'
        })
      });
      if (res.ok) {
        setNewEntryTargetId('');
        setNewEntryReason('');
        setSelectedBanlistForAdding(null);
        // Refresh
        const freshRes = await fetch('/api/custom-banlists', { headers: { 'Authorization': `Bearer ${token}` } });
        if (freshRes.ok) setCustomBanlists(await freshRes.json());
        setSuccessMessage('Entry added successfully.');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const data = await res.json();
        setBanlistErrorMessage(data.error || 'Failed to add entry.');
      }
    } catch (err) {
      setBanlistErrorMessage('Connection error adding entry.');
    } finally {
      setIsAddingEntry(false);
    }
  };

  const handleDeleteBanlistEntry = async (banlistId: string, entryId: string) => {
    const token = localStorage.getItem('gg_token');
    try {
      const res = await fetch(`/api/custom-banlists/${banlistId}/entries/${entryId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        // Refresh
        const freshRes = await fetch('/api/custom-banlists', { headers: { 'Authorization': `Bearer ${token}` } });
        if (freshRes.ok) setCustomBanlists(await freshRes.json());
        setSuccessMessage('Entry removed successfully.');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to remove entry.');
      }
    } catch (err) {
      alert('Connection error removing entry.');
    }
  };

  const handleRevokeApiKey = async (id: string, reason?: string) => {
    const token = localStorage.getItem('gg_token');
    setIsRevokingKey(true);
    try {
      const res = await fetch(`/api/admin/api-keys/${id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: reason || 'Manually revoked by administrator' })
      });
      if (res.ok) {
        setSuccessMessage('API key revoked successfully.');
        setRevokingKey(null);
        fetchDashboardData(token!, role);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to revoke API key.');
      }
    } catch (err) {
      setError('Connection error while revoking API key.');
    } finally {
      setIsRevokingKey(false);
    }
  };

  const handleActionApiKeyRequest = async (id: string, status: 'approved' | 'rejected') => {
    const token = localStorage.getItem('gg_token');
    try {
      const res = await fetch(`/api/admin/api-key-requests/${id}/action`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchDashboardData(token!, role);
      }
    } catch (err) {}
  };

  const handleManualBan = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualBanError('');
    const token = localStorage.getItem('gg_token');
    try {
      const res = await fetch('/api/admin/bans/manual', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId: manualBanId, reason: manualBanReason })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setManualBanId('');
        setManualBanReason('');
        fetchDashboardData(token!, role);
        setSuccessMessage('Global automated ban successfully committed.');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setManualBanError(data.error || 'Ban enforcement failed. Check that Discord workers are online and Sync Global Bans is enabled for target servers.');
      }
    } catch {
      setManualBanError('Could not reach the dashboard to enforce this ban.');
    }
  };

  const handleManualTrust = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const token = localStorage.getItem('gg_token');
    try {
      const res = await fetch('/api/admin/users/trusted/add', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId: manualTrustId, reason: manualTrustReason })
      });
      if (res.ok) {
        setManualTrustId('');
        setManualTrustReason('');
        fetchDashboardData(token!, role);
        setSuccessMessage('Granted trusted rank and whitelisted user.');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to grant trusted status.');
      }
    } catch {
      setError('Could not reach the dashboard to grant trusted status.');
    }
  };

  const handleManualUnban = async (userId: string) => {
    setError('');
    const token = localStorage.getItem('gg_token');
    try {
      const res = await fetch('/api/admin/bans/remove', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        fetchDashboardData(token!, role);
        setSuccessMessage('Global ban successfully lifted.');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to unban user.');
      }
    } catch {
      setError('Could not reach the dashboard to unban this user.');
    }
  };

  const handleAdminLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupId) return;
    setLookupLoading(true);
    setError('');
    setLookupResult(null);
    const token = localStorage.getItem('gg_token');
    try {
      const res = await fetch(`/api/admin/user/${lookupId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setLookupResult(await res.json());
      } else {
        const data = await res.json();
        setError(data.error || 'User not found in global database.');
      }
    } catch (err) {
      setError('Lookup request failed.');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleIssueWarning = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupResult?.id || !warningReasonInput.trim()) return;
    setIsIssuingWarning(true);
    setError('');
    const token = localStorage.getItem('gg_token');
    try {
      const res = await fetch(`/api/admin/users/${lookupResult.id}/warn`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ reason: warningReasonInput.trim(), guildId: 'Global Dashboard' })
      });
      if (res.ok) {
        const data = await res.json();
        setLookupResult({ ...lookupResult, warnings: data.warnings });
        setWarningReasonInput('');
        setShowAddWarningModal(false);
        setSuccessMessage('Warning issued successfully and recorded permanently.');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const err = await res.json();
        setError(err.error || 'Failed to issue warning.');
      }
    } catch (e) {
      setError('Failed to issue warning.');
    } finally {
      setIsIssuingWarning(false);
    }
  };

  const handleResetReputation = async (userId: string) => {
    const token = localStorage.getItem('gg_token');
    try {
      const res = await fetch(`/api/admin/users/${userId}/reset-reputation`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchDashboardData(token!, role);
        if (lookupResult?.id === userId) {
          setLookupResult({ ...lookupResult, reputation: 0 });
        }
      }
    } catch (err) {}
  };

  const handleToggleTrusted = async (userId: string) => {
    const token = localStorage.getItem('gg_token');
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle-trusted`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchDashboardData(token!, role);
    } catch (err) {}
  };

  const handleToggleExpandBan = (u: any) => {
    if (expandedBan === u.id) {
      setExpandedBan(null);
    } else {
      setExpandedBan(u.id);
      setEditingBanReason({ id: u.id, reason: u.banReason || '' });
      setEditingReputation({ id: u.id, score: String(u.reputation ?? 0) });
      setEditingDangerousNotes({ id: u.id, notes: u.dangerousNotes || '' });
      setEditingTrustIndex({ id: u.id, index: u.trustIndex || 'RED_CLASS_D' });
      setUserEvidenceLinks(Array.isArray(u.evidenceLinks) ? u.evidenceLinks : []);
      setEditingVRChat({
        id: u.id,
        vrchatUserId: u.vrchatUserId || '',
        vrchatUsername: u.vrchatUsername || '',
        vrchatAlts: Array.isArray(u.vrchatAlts) ? u.vrchatAlts.map((alt: any) => ({ vrchatUserId: alt.vrchatUserId || '', vrchatUsername: alt.vrchatUsername || '' })) : []
      });
    }
  };

  const handleActionVerification = async (requestId: string, status: 'approved' | 'rejected') => {
    if (isActioningVerification) return;
    setIsActioningVerification(true);
    setSelectedVerification(null);
    try {
      const token = localStorage.getItem('gg_token');
      await fetch(`/api/admin/verifications/${requestId}/action`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      setVerifications(prev => prev.filter(v => v._id !== requestId));
      fetchDashboardData(token!, role);
    } catch (error) {
      console.error('Action failed', error);
    } finally {
      setIsActioningVerification(false);
    }
  };

  const handleActionReport = async (reportId: string, status: 'reviewed' | 'dismissed') => {
    if (isActioningReport) return;
    setIsActioningReport(true);
    setSelectedReport(null);
    try {
      const token = localStorage.getItem('gg_token');
      const res = await fetch(`/api/admin/reports/${reportId}/action`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setReports(prev => prev.filter(r => r._id !== reportId));
        setSuccessMessage(`Report was successfully ${status}.`);
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchDashboardData(token!, role);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsActioningReport(false);
    }
  };

  const handleActionAppeal = async (appealId: string, status: 'approved' | 'denied') => {
    if (isActioningAppeal) return;
    setIsActioningAppeal(true);
    setSelectedAppeal(null);
    try {
      const token = localStorage.getItem('gg_token');
      const res = await fetch(`/api/admin/appeals/${appealId}/action`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setAppeals(prev => prev.filter(a => a._id !== appealId));
        setSuccessMessage(`Appeal was successfully ${status}.`);
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchDashboardData(token!, role);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsActioningAppeal(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('gg_token', data.token);
        localStorage.setItem('adminToken', data.token);
        fetchUserInfo(data.token);
      } else {
        setError(data.error || 'Login credentials incorrect.');
      }
    } catch (err) {
      setError('Connection refused.');
    }
  };

  const handleSetDashboardPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSetupError('');
    if (dashboardPassword.length < 8) {
      setPasswordSetupError('Password must be at least 8 characters long.');
      return;
    }
    if (dashboardPassword !== dashboardPasswordConfirm) {
      setPasswordSetupError('Passwords do not match.');
      return;
    }

    setIsSettingPassword(true);
    try {
      const token = localStorage.getItem('gg_token') || localStorage.getItem('adminToken');
      const res = await fetch('/api/auth/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password: dashboardPassword })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to set password');

      setDashboardPassword('');
      setDashboardPasswordConfirm('');
      setUserProfile((prev) => prev ? { ...prev, passwordSet: true } : prev);
    } catch (err: any) {
      setPasswordSetupError(err.message || 'Failed to set password.');
    } finally {
      setIsSettingPassword(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        setSuccessMessage('Password reset link sent! Check your inbox.');
        setForgotPassword(false);
      } else {
        const data = await res.json();
        setError(data.error || 'Reset failed');
      }
    } catch (err) {
      setError('Connection failed.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('gg_token');
    localStorage.removeItem('adminToken');
    setIsLoggedIn(false);
    setUserProfile(null);
    setAdminName('');
    setRole('');
    setDashboardPassword('');
    setDashboardPasswordConfirm('');
    setPasswordSetupError('');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-zinc-950 text-zinc-100">
        <div className="text-center space-y-4">
          <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin mx-auto" />
          <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  // LOGIN SCREEN (DARK MODE)
  if (!isLoggedIn) {
    if (forgotPassword) {
      return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 sm:p-6 text-zinc-100">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="max-w-md w-full bg-zinc-900 border border-zinc-800 p-8 rounded-2xl space-y-6 shadow-2xl"
          >
            <div className="text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-950/60 border border-indigo-800/60 flex items-center justify-center text-indigo-400">
                <Lock className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-black uppercase tracking-tight text-white">Reset Password</h1>
              <p className="font-mono text-xs text-zinc-400">Enter your email address to receive password reset instructions.</p>
            </div>
            
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] uppercase font-bold text-zinc-400">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-3.5 font-mono text-xs focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>
              
              {error && <div className="p-3 bg-red-950/60 border border-red-800/60 text-red-300 font-mono text-xs rounded-xl">{error}</div>}
              {successMessage && <div className="p-3 bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 font-mono text-xs rounded-xl">{successMessage}</div>}
              
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3.5 font-mono font-bold uppercase text-xs transition-colors shadow-lg shadow-indigo-600/20">
                Send Reset Link
              </button>
              
              <button type="button" onClick={() => setForgotPassword(false)} className="w-full text-xs font-mono uppercase tracking-wider text-center text-zinc-400 hover:text-white transition-colors">
                Back to Sign In
              </button>
            </form>
          </motion.div>
        </div>
      );
    }


    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 sm:p-6 text-zinc-100">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full bg-zinc-900 border border-zinc-800 p-8 rounded-2xl space-y-6 shadow-2xl"
        >
          <div className="text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-xl shadow-indigo-600/25">
              <Shield className="w-7 h-7" />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-white">
              {showSetup ? 'Admin Setup' : 'Sign In'}
            </h1>
            <p className="font-mono text-xs text-zinc-400">
              {showSetup
                ? 'Set up the initial administrator account for your network'
                : 'Sign in with Discord or use your existing username/email and password'}
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-red-950/60 border border-red-800/60 font-mono text-xs text-red-300 rounded-xl">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="p-3.5 bg-emerald-950/60 border border-emerald-800/60 font-mono text-xs text-emerald-300 rounded-xl">
              {successMessage}
            </div>
          )}

          {!showSetup && (
            <>
              <a
                href="/api/auth/discord"
                className="w-full flex items-center justify-center gap-3 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-xl py-3.5 font-mono font-bold uppercase text-xs transition-colors shadow-lg shadow-indigo-950/40"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.058a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                Continue with Discord
              </a>
              <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                <span className="h-px flex-1 bg-zinc-800" />
                <span>or continue with email</span>
                <span className="h-px flex-1 bg-zinc-800" />
              </div>
            </>
          )}

          <form onSubmit={showSetup ? handleSetup : handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase font-bold text-zinc-400">
                {showSetup ? 'Username' : 'Username or Email'}
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={showSetup ? 'Enter your username' : 'Username or email'}
                className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-3.5 font-mono text-xs focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase font-bold text-zinc-400">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-3.5 font-mono text-xs focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3.5 font-mono font-bold uppercase text-xs transition-colors shadow-lg shadow-indigo-600/20"
            >
              {showSetup ? 'Complete Admin Setup' : 'Sign In'}
            </button>
          </form>

          <div className="pt-4 border-t border-zinc-800 flex flex-col gap-2">
            {!showSetup && (
              <>
                <p className="text-center text-[11px] font-mono text-zinc-500">
                  New accounts must be created with Discord, then secure them with a dashboard password.
                </p>
                <button
                  type="button"
                  onClick={() => setForgotPassword(true)}
                  className="text-[11px] font-mono uppercase font-bold text-zinc-400 hover:text-red-400 text-center"
                >
                  Forgot your password?
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  if (userProfile && userProfile.passwordSet === false) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 sm:p-6 text-zinc-100">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full bg-zinc-900 border border-zinc-800 p-8 rounded-2xl space-y-6 shadow-2xl"
        >
          <div className="text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-950/60 border border-indigo-800/60 flex items-center justify-center text-indigo-400">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-white">Secure Your Account</h1>
            <p className="font-mono text-xs text-zinc-400 leading-relaxed">
              Your Discord account is connected. Add a dashboard password so you can also sign in with your email.
            </p>
          </div>

          <form onSubmit={handleSetDashboardPassword} className="space-y-4">
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase font-bold text-zinc-400">New Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={dashboardPassword}
                onChange={(e) => setDashboardPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-3.5 font-mono text-xs focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase font-bold text-zinc-400">Confirm Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={dashboardPasswordConfirm}
                onChange={(e) => setDashboardPasswordConfirm(e.target.value)}
                placeholder="Repeat your password"
                className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-3.5 font-mono text-xs focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>

            {passwordSetupError && (
              <div className="p-3 bg-red-950/60 border border-red-800/60 text-red-300 font-mono text-xs rounded-xl">
                {passwordSetupError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSettingPassword}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl py-3.5 font-mono font-bold uppercase text-xs transition-colors shadow-lg shadow-indigo-600/20"
            >
              {isSettingPassword ? 'Saving Password...' : 'Set Dashboard Password'}
            </button>
          </form>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full text-[11px] font-mono uppercase font-bold text-zinc-400 hover:text-red-400 text-center"
          >
            Sign out and use Discord again
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-indigo-600 selection:text-white pb-20">
      {/* STICKY TOP APP BAR (MOBILE FRIENDLY + DARKMODE) */}
      <header className="sticky top-0 z-40 bg-zinc-900/95 border-b border-zinc-800/80 backdrop-blur-md">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          {/* BRAND */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 flex-shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm tracking-tight text-white uppercase">BeSafe Network</span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 uppercase">
                  {role || 'User'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 truncate max-w-[180px] sm:max-w-xs">
                {view === 'profile' ? 'Profile & Reputation'
                  : view === 'platforms' || view === 'link' ? 'Platform Integrations'
                  : view === 'verify' ? 'Age Verification'
                  : view === 'guilds' ? 'Connected Discord Servers'
                  : view === 'banlists' ? 'Custom Banlists'
                  : view === 'admin' ? 'Overview & Analytics'
                  : view === 'cases' ? 'Staff Moderation Cases'
                  : view === 'bans' ? 'Bans & Restrictions'
                  : view === 'lookup' ? 'Search User & Records'
                  : view === 'verifications' ? 'Verification Queue'
                  : view === 'developers' ? 'Developer API'
                  : view === 'georules' ? 'Geo Compliance & Age Rules'
                  : view === 'apibots' ? 'Certified API Partner Bots'
                  : view === 'trustedcompanies' ? 'Trusted Partner Companies'
                  : 'System Settings'}
              </p>
            </div>
          </div>

          {/* RIGHT CONTROLS */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Profile Capsule (Desktop & Mobile) */}
            <button
              onClick={() => { setView('profile'); setSelectedGuild(null); }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
                view === 'profile'
                  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                  : 'bg-zinc-800/60 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-white uppercase overflow-hidden">
                {userProfile?.avatarUrl ? (
                  <img src={userProfile.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  (adminName || 'U')[0].toUpperCase()
                )}
              </div>
              <span className="text-xs font-semibold max-w-[90px] sm:max-w-[120px] truncate hidden xs:inline">
                {userProfile?.displayName || adminName || 'User'}
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/60">
                {userProfile?.reputationScore ?? 100}
              </span>
            </button>

            {/* Staff pending badges */}
            {(role === 'admin' || role === 'moderator') && (
              <div className="hidden md:flex items-center gap-2">
                {reports.length > 0 && (
                  <button
                    onClick={() => { setView('admin'); setSelectedGuild(null); }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-[11px] font-mono font-bold"
                  >
                    <span>Reports</span>
                    <span className="px-1.5 py-0.2 bg-red-800 text-white rounded-full text-[10px]">{reports.length}</span>
                  </button>
                )}
                {appeals.length > 0 && (
                  <button
                    onClick={() => { setView('admin'); setSelectedGuild(null); }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-800 text-amber-300 text-[11px] font-mono font-bold"
                  >
                    <span>Appeals</span>
                    <span className="px-1.5 py-0.2 bg-amber-800 text-black font-black rounded-full text-[10px]">{appeals.length}</span>
                  </button>
                )}
              </div>
            )}

            {/* Logout button (Desktop) */}
            <button
              onClick={handleLogout}
              className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-400 hover:text-red-400 px-3 py-1.5 rounded-xl border border-zinc-800 hover:border-red-900/60 transition-colors font-mono uppercase"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>

            {/* Mobile Hamburger toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-200 hover:bg-zinc-700 transition-colors"
              aria-label="Toggle Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MOBILE SLIDE-DOWN DRAWER */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-zinc-800 bg-zinc-900/95 px-4 py-4 space-y-4 overflow-hidden"
            >
              <div className="space-y-2">
                <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold px-1">
                  User Tools
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs font-medium">
                  <button
                    onClick={() => { setView('profile'); setSelectedGuild(null); setMobileMenuOpen(false); }}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left ${view === 'profile' ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-zinc-800/40 border-zinc-800 text-zinc-300'}`}
                  >
                    <User className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="truncate">Profile</span>
                  </button>
                  <button
                    onClick={() => { setView('platforms'); setSelectedGuild(null); setMobileMenuOpen(false); }}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left ${view === 'platforms' || view === 'link' ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-zinc-800/40 border-zinc-800 text-zinc-300'}`}
                  >
                    <Gamepad2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="truncate">Platform Settings</span>
                  </button>
                  <button
                    onClick={() => { setView('verify'); setSelectedGuild(null); setMobileMenuOpen(false); }}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left ${view === 'verify' ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-zinc-800/40 border-zinc-800 text-zinc-300'}`}
                  >
                    <ShieldAlert className="w-4 h-4 text-sky-400 shrink-0" />
                    <span className="truncate">Age Verification</span>
                  </button>
                  <button
                    onClick={() => { setView('guilds'); setSelectedGuild(null); setMobileMenuOpen(false); }}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left ${view === 'guilds' ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-zinc-800/40 border-zinc-800 text-zinc-300'}`}
                  >
                    <Server className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="truncate">Servers ({guilds.length})</span>
                  </button>
                  <button
                    onClick={() => { setView('banlists'); setSelectedGuild(null); setMobileMenuOpen(false); }}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left ${view === 'banlists' ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-zinc-800/40 border-zinc-800 text-zinc-300'}`}
                  >
                    <BookmarkCheck className="w-4 h-4 text-purple-400 shrink-0" />
                    <span className="truncate">Banlists ({customBanlists.length})</span>
                  </button>
                </div>
              </div>

              {(role === 'admin' || role === 'moderator') && (
                <div className="space-y-2 pt-2 border-t border-zinc-800">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold px-1">
                    Staff & Admin Tools
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs font-medium">
                    <button
                      onClick={() => { setView('admin'); setSelectedGuild(null); setMobileMenuOpen(false); }}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-left ${view === 'admin' ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-zinc-800/40 border-zinc-800 text-zinc-300'}`}
                    >
                      <BarChart3 className="w-4 h-4 text-rose-400 shrink-0" />
                      <span className="truncate">Overview</span>
                    </button>
                    <button
                      onClick={() => { setView('cases'); setSelectedGuild(null); fetchCases(); setMobileMenuOpen(false); }}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-left ${view === 'cases' ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-zinc-800/40 border-zinc-800 text-zinc-300'}`}
                    >
                      <FileText className="w-4 h-4 text-teal-400 shrink-0" />
                      <span className="truncate">Cases ({cases.length})</span>
                    </button>
                    <button
                      onClick={() => { setView('bans'); setSelectedGuild(null); setMobileMenuOpen(false); }}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-left ${view === 'bans' ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-zinc-800/40 border-zinc-800 text-zinc-300'}`}
                    >
                      <UserX className="w-4 h-4 text-red-400 shrink-0" />
                      <span className="truncate">Bans & Restrictions</span>
                    </button>
                    <button
                      onClick={() => { setView('lookup'); setSelectedGuild(null); setMobileMenuOpen(false); }}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-left ${view === 'lookup' ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-zinc-800/40 border-zinc-800 text-zinc-300'}`}
                    >
                      <Search className="w-4 h-4 text-violet-400 shrink-0" />
                      <span className="truncate">Search Records</span>
                    </button>
                    <button
                      onClick={() => { setView('verifications'); setSelectedGuild(null); setMobileMenuOpen(false); }}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-left ${view === 'verifications' ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-zinc-800/40 border-zinc-800 text-zinc-300'}`}
                    >
                      <Fingerprint className="w-4 h-4 text-green-400 shrink-0" />
                      <span className="truncate">Verify Queue ({verifications.length})</span>
                    </button>
                    {role === 'admin' && (
                      <>
                        <button
                          onClick={() => { setView('developers'); setSelectedGuild(null); setMobileMenuOpen(false); }}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border text-left ${view === 'developers' ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-zinc-800/40 border-zinc-800 text-zinc-300'}`}
                        >
                          <Code2 className="w-4 h-4 text-blue-400 shrink-0" />
                          <span className="truncate">API ({apiKeyRequests.length})</span>
                        </button>
                        <button
                          onClick={() => { setView('georules'); setSelectedGuild(null); setMobileMenuOpen(false); }}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border text-left ${view === 'georules' ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-zinc-800/40 border-zinc-800 text-zinc-300'}`}
                        >
                          <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="truncate">Geo & Age Rules</span>
                        </button>
                        <button
                          onClick={() => { setView('apibots'); setSelectedGuild(null); setMobileMenuOpen(false); }}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border text-left ${view === 'apibots' ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-zinc-800/40 border-zinc-800 text-zinc-300'}`}
                        >
                          <Bot className="w-4 h-4 text-cyan-400 shrink-0" />
                          <span className="truncate">API Bots</span>
                        </button>
                        <button
                          onClick={() => { setView('trustedcompanies'); setSelectedGuild(null); setMobileMenuOpen(false); }}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border text-left ${view === 'trustedcompanies' ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-zinc-800/40 border-zinc-800 text-zinc-300'}`}
                        >
                          <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
                          <span className="truncate">Trusted Partners</span>
                        </button>
                        <button
                          onClick={() => { setView('settings'); setSelectedGuild(null); setMobileMenuOpen(false); }}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border text-left ${view === 'settings' ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-zinc-800/40 border-zinc-800 text-zinc-300'}`}
                        >
                          <Settings className="w-4 h-4 text-zinc-400 shrink-0" />
                          <span className="truncate">Settings</span>
                        </button>
                        <Link
                          to="/admin/vrchat-broadcast"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2 p-2.5 rounded-xl border text-left bg-purple-950/40 border-purple-800/60 text-purple-300"
                        >
                          <Megaphone className="w-4 h-4 text-purple-400 shrink-0" />
                          <span className="truncate">Broadcast</span>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-950/40 border border-red-900/60 text-red-400 text-xs font-mono uppercase"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* DESKTOP SIDEBAR + MAIN WORKSTAGE */}
      <div className="max-w-[1600px] mx-auto flex min-h-[calc(100vh-65px)]">
        {/* COLLAPSIBLE LEFT SIDEBAR (DESKTOP) */}
        <aside
          className={`hidden md:flex flex-col flex-shrink-0 border-r border-zinc-800/80 bg-zinc-900/50 transition-all duration-200 ${
            sidebarCollapsed ? 'w-20' : 'w-64'
          }`}
        >
          <div className="sticky top-[65px] flex flex-col max-h-[calc(100vh-65px)]">
            {/* Sidebar Header & Collapse Toggle */}
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} px-4 py-3 border-b border-zinc-800/60`}>
              {!sidebarCollapsed && (
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold">
                  Navigation Menu
                </span>
              )}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                className="p-1.5 rounded-lg bg-zinc-800/70 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700/60 transition-colors cursor-pointer"
              >
                {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            </div>

            {/* Scrollable Menu Groups */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
              {/* GROUP 1: USER TOOLS */}
              <div className="space-y-1.5">
                {!sidebarCollapsed ? (
                  <p className="px-2.5 pb-1 text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold">
                    User Tools
                  </p>
                ) : (
                  <div className="text-center pb-1">
                    <span className="text-[9px] font-mono uppercase text-zinc-600 font-bold">User</span>
                  </div>
                )}

                <button
                  onClick={() => { setView('profile'); setSelectedGuild(null); }}
                  title="Profile"
                  className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-3'} py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    view === 'profile'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                      : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <User className="w-4 h-4 shrink-0" />
                    {!sidebarCollapsed && <span className="truncate">Profile</span>}
                  </div>
                </button>

                <button
                  onClick={() => { setView('platforms'); setSelectedGuild(null); }}
                  title="Platform Settings (Discord & VRChat)"
                  className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-3'} py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    view === 'platforms' || view === 'link'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                      : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Gamepad2 className="w-4 h-4 shrink-0" />
                    {!sidebarCollapsed && <span className="truncate">Platform Settings</span>}
                  </div>
                  {!sidebarCollapsed && (
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                      view === 'platforms' || view === 'link'
                        ? 'bg-indigo-700/80 text-indigo-100'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      VRC & Discord
                    </span>
                  )}
                </button>

                <button
                  onClick={() => { setView('verify'); setSelectedGuild(null); }}
                  title="Age Verification"
                  className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-3'} py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    view === 'verify'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                      : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ShieldAlert className={`w-4 h-4 shrink-0 ${view === 'verify' ? 'text-white' : 'text-emerald-400'}`} />
                    {!sidebarCollapsed && <span className="truncate">Age Verification</span>}
                  </div>
                  {!sidebarCollapsed && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/90 text-emerald-400 border border-emerald-800/60 shrink-0">
                      Online
                    </span>
                  )}
                </button>

                <button
                  onClick={() => { setView('guilds'); setSelectedGuild(null); }}
                  title={`Connected Servers (${guilds.length})`}
                  className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-3'} py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    view === 'guilds' && !selectedGuild
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                      : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Server className="w-4 h-4 shrink-0" />
                    {!sidebarCollapsed && <span className="truncate">Connected Servers</span>}
                  </div>
                  {!sidebarCollapsed && (
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                      view === 'guilds' && !selectedGuild ? 'bg-indigo-700 text-white' : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {guilds.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => { setView('banlists'); setSelectedGuild(null); }}
                  title={`Custom Banlists (${customBanlists.length})`}
                  className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-3'} py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    view === 'banlists' && !selectedGuild
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                      : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <BookmarkCheck className="w-4 h-4 shrink-0" />
                    {!sidebarCollapsed && <span className="truncate">Custom Banlists</span>}
                  </div>
                  {!sidebarCollapsed && (
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                      view === 'banlists' && !selectedGuild ? 'bg-indigo-700 text-white' : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {customBanlists.length}
                    </span>
                  )}
                </button>
              </div>

              {/* GROUP 2: STAFF & ADMIN TOOLS */}
              {(role === 'admin' || role === 'moderator') && (
                <div className="space-y-1.5 pt-4 border-t border-zinc-800/80">
                  {!sidebarCollapsed ? (
                    <p className="px-2.5 pb-1 text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold">
                      Staff & Admin Tools
                    </p>
                  ) : (
                    <div className="text-center pb-1">
                      <span className="text-[9px] font-mono uppercase text-zinc-600 font-bold">Staff</span>
                    </div>
                  )}

                  <button
                    onClick={() => { setView('admin'); setSelectedGuild(null); }}
                    title="Overview"
                    className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-3'} py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      view === 'admin' && !selectedGuild
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                        : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <BarChart3 className="w-4 h-4 shrink-0" />
                      {!sidebarCollapsed && <span className="truncate">Overview</span>}
                    </div>
                  </button>

                  <button
                    onClick={() => { setView('cases'); setSelectedGuild(null); fetchCases(); }}
                    title={`Cases (${cases.length})`}
                    className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-3'} py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      view === 'cases' && !selectedGuild
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                        : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-4 h-4 shrink-0" />
                      {!sidebarCollapsed && <span className="truncate">Cases</span>}
                    </div>
                    {!sidebarCollapsed && (
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                        view === 'cases' && !selectedGuild ? 'bg-indigo-700 text-white' : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        {cases.length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => { setView('bans'); setSelectedGuild(null); }}
                    title="Bans & Restrictions"
                    className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-3'} py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      view === 'bans' && !selectedGuild
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                        : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <UserX className="w-4 h-4 shrink-0" />
                      {!sidebarCollapsed && <span className="truncate">Bans & Restrictions</span>}
                    </div>
                  </button>

                  <button
                    onClick={() => { setView('lookup'); setSelectedGuild(null); }}
                    title="Search Records"
                    className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-3'} py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      view === 'lookup' && !selectedGuild
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                        : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Search className="w-4 h-4 shrink-0" />
                      {!sidebarCollapsed && <span className="truncate">Search Records</span>}
                    </div>
                  </button>

                  <button
                    onClick={() => { setView('verifications'); setSelectedGuild(null); }}
                    title={`Verification Queue (${verifications.length})`}
                    className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-3'} py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      view === 'verifications' && !selectedGuild
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                        : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Fingerprint className="w-4 h-4 shrink-0" />
                      {!sidebarCollapsed && <span className="truncate">Verification Queue</span>}
                    </div>
                    {!sidebarCollapsed && (
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                        view === 'verifications' && !selectedGuild ? 'bg-indigo-700 text-white' : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        {verifications.length}
                      </span>
                    )}
                  </button>

                  {role === 'admin' && (
                    <>
                      <button
                        onClick={() => { setView('developers'); setSelectedGuild(null); }}
                        title={`Developer API (${apiKeyRequests.length})`}
                        className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-3'} py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          view === 'developers' && !selectedGuild
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                            : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Code2 className="w-4 h-4 shrink-0" />
                          {!sidebarCollapsed && <span className="truncate">Developer API</span>}
                        </div>
                        {!sidebarCollapsed && (
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                            view === 'developers' && !selectedGuild ? 'bg-indigo-700 text-white' : 'bg-zinc-800 text-zinc-400'
                          }`}>
                            {apiKeyRequests.length}
                          </span>
                        )}
                      </button>

                      <button
                        onClick={() => { setView('georules'); setSelectedGuild(null); }}
                        title="Geo & Age Rules"
                        className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-3'} py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          view === 'georules' && !selectedGuild
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                            : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Globe className={`w-4 h-4 shrink-0 ${view === 'georules' && !selectedGuild ? 'text-white' : 'text-emerald-400'}`} />
                          {!sidebarCollapsed && <span className="truncate">Geo & Age Rules</span>}
                        </div>
                      </button>

                      <button
                        onClick={() => { setView('apibots'); setSelectedGuild(null); }}
                        title="API Bots"
                        className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-3'} py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          view === 'apibots' && !selectedGuild
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                            : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Bot className={`w-4 h-4 shrink-0 ${view === 'apibots' && !selectedGuild ? 'text-white' : 'text-cyan-400'}`} />
                          {!sidebarCollapsed && <span className="truncate">API Bots</span>}
                        </div>
                      </button>

                      <button
                        onClick={() => { setView('trustedcompanies'); setSelectedGuild(null); }}
                        title="Trusted Partners"
                        className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-3'} py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          view === 'trustedcompanies' && !selectedGuild
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                            : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Building2 className={`w-4 h-4 shrink-0 ${view === 'trustedcompanies' && !selectedGuild ? 'text-white' : 'text-amber-400'}`} />
                          {!sidebarCollapsed && <span className="truncate">Trusted Partners</span>}
                        </div>
                      </button>

                      <button
                        onClick={() => { setView('settings'); setSelectedGuild(null); }}
                        title="Settings"
                        className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-3'} py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          view === 'settings' && !selectedGuild
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                            : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Settings className="w-4 h-4 shrink-0" />
                          {!sidebarCollapsed && <span className="truncate">Settings</span>}
                        </div>
                      </button>

                      <Link
                        to="/admin/vrchat-broadcast"
                        title="VRChat Broadcast"
                        className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-3'} py-2.5 rounded-xl text-xs font-semibold bg-purple-950/50 hover:bg-purple-900/60 text-purple-300 border border-purple-800/60 transition-colors`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Megaphone className="w-4 h-4 shrink-0" />
                          {!sidebarCollapsed && <span className="truncate">Broadcast</span>}
                        </div>
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* WORKSTAGE VIEW */}
        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {successMessage && (
          <div className="bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 p-4 font-mono text-xs font-bold rounded-2xl flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage('')} className="text-emerald-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {error && (
          <div className="bg-rose-950/60 border border-rose-800/80 text-rose-300 p-4 font-mono text-xs font-bold rounded-2xl flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError('')} className="text-rose-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Discord reminder - subtle, friendly */}
        {!discordId && view !== 'platforms' && view !== 'link' && (
          <div className="bg-zinc-900/80 border border-indigo-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-950/80 border border-indigo-800/60 flex items-center justify-center text-indigo-400 flex-shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Discord Account Not Yet Linked</p>
                <p className="text-[11px] text-zinc-400">
                  Connect your Discord account in Platform Settings to manage Discord server protection. VRChat Groups and Age Verification work independently!
                </p>
              </div>
            </div>
            <button 
              onClick={() => { setView('platforms'); setSelectedGuild(null); }}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-[11px] font-bold uppercase transition-colors whitespace-nowrap self-stretch sm:self-auto text-center"
            >
              Configure Platforms →
            </button>
          </div>
        )}

        {/* VIEW: USER PROFILE */}
        {view === 'profile' && (
          <UserProfileCard
            profile={userProfile}
            onProfileUpdated={(updated) => {
              setUserProfile(updated);
              setAdminName(updated.displayName || updated.username);
            }}
            onNavigateTab={(tab) => setView(tab as any)}
          />
        )}

        {/* VIEW: PLATFORM SETTINGS (DISCORD, VRCHAT, DAWNCHAT) */}
        {(view === 'platforms' || view === 'link') && (
          <PlatformSettings
            profile={userProfile}
            onProfileUpdated={(updated) => setUserProfile(updated)}
            guilds={guilds}
            customBanlists={customBanlists}
            onSelectGuild={(g) => {
              setSelectedGuild(g);
              setView('guilds');
            }}
          />
        )}

        {/* VIEW: DIRECT WEB AGE VERIFICATION */}
        {view === 'verify' && (
          <WebAgeVerification
            profile={userProfile}
            onVerificationSubmitted={() => {
              const token = localStorage.getItem('gg_token') || localStorage.getItem('adminToken');
              if (token) fetchUserInfo(token);
            }}
          />
        )}

          {/* VIEW: OVERVIEW */}
          {(role === 'admin' || role === 'moderator') && view === 'admin' && (
            <div className="space-y-8">
              {/* STATUS METRICS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-200/80 flex items-center justify-between hover:shadow-md transition-shadow">
                  <div className="space-y-1">
                    <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">Total Enforcements</p>
                    <h3 className="text-3xl font-black text-zinc-900 font-mono">{stats?.banCount || '0'}</h3>
                  </div>
                  <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500">
                    <UserX className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-200/80 flex items-center justify-between hover:shadow-md transition-shadow">
                  <div className="space-y-1">
                    <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">Pending Intelligence</p>
                    <h3 className="text-3xl font-black text-zinc-900 font-mono">{reports.length}</h3>
                  </div>
                  <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500">
                    <FileText className="w-6 h-6 animate-pulse" />
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-200/80 flex items-center justify-between hover:shadow-md transition-shadow">
                  <div className="space-y-1">
                    <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">Appeals Queue</p>
                    <h3 className="text-3xl font-black text-zinc-900 font-mono">{appeals.length}</h3>
                  </div>
                  <div className="w-12 h-12 bg-sky-50 rounded-xl flex items-center justify-center text-sky-500">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-200/80 flex items-center justify-between hover:shadow-md transition-shadow">
                  <div className="space-y-1">
                    <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">Network Reach (Nodes)</p>
                    <h3 className="text-3xl font-black text-zinc-900 font-mono">{stats?.guildCount || '0'}</h3>
                  </div>
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500">
                    <Server className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* DUAL WORKQUEUE: REPORTS & INTELLIGENCE */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* LIST: REPORTS */}
                <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm p-6 space-y-6">
                  <div className="flex justify-between items-center border-b border-zinc-100 pb-4">
                    <h3 className="text-sm font-black uppercase tracking-wider text-zinc-800 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-rose-500" /> Pending Intelligence Reports
                    </h3>
                    <span className="text-xs font-mono bg-rose-50 text-rose-700 px-2.5 py-0.5 rounded-full font-bold">{reports.length}</span>
                  </div>

                  <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                    {reports.length === 0 ? (
                      <div className="text-center py-12 opacity-40 italic text-xs">No pending subject intelligence reports.</div>
                    ) : (
                      reports.map(r => (
                        <div 
                          key={r._id} 
                          onClick={() => setSelectedReport(r)}
                          className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 hover:border-indigo-400 hover:bg-indigo-50/20 cursor-pointer transition-all flex justify-between items-center"
                        >
                          <div className="space-y-1">
                            <p className="font-bold text-sm text-zinc-800">{r.targetDisplayName}</p>
                            <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                              <span>Snowflake: {r.targetUserId}</span>
                              {r.vrchatAccount && (
                                <span className="bg-indigo-500/10 text-indigo-700 px-1.5 py-0.5 rounded font-mono font-bold">VRChat Submitted</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleClaimReport(r._id);
                              }}
                              className="text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 font-mono border border-amber-300"
                            >
                              Claim Case
                            </button>
                            <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                              Review <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* LIST: APPEALS */}
                <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm p-6 space-y-6">
                  <div className="flex justify-between items-center border-b border-zinc-100 pb-4">
                    <h3 className="text-sm font-black uppercase tracking-wider text-zinc-800 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-sky-500" /> Pending Ban Appeals
                    </h3>
                    <span className="text-xs font-mono bg-sky-50 text-sky-700 px-2.5 py-0.5 rounded-full font-bold">{appeals.length}</span>
                  </div>

                  <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                    {appeals.length === 0 ? (
                      <div className="text-center py-12 opacity-40 italic text-xs">No pending global ban appeals.</div>
                    ) : (
                      appeals.map(a => (
                        <div 
                          key={a._id} 
                          onClick={() => setSelectedAppeal(a)}
                          className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 hover:border-indigo-400 hover:bg-indigo-50/20 cursor-pointer transition-all flex justify-between items-center"
                        >
                          <div className="space-y-1">
                            <p className="font-bold text-sm text-zinc-800">{a.userDisplayName}</p>
                            <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                              <span>Snowflake: {a.userId}</span>
                              {a.vrchatAccount && (
                                <span className="bg-indigo-500/10 text-indigo-700 px-1.5 py-0.5 rounded font-mono font-bold">VRChat Profile Attached</span>
                              )}
                            </div>
                          </div>
                          <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                            Evaluate <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* TIMELINE: RECENT LOGS */}
              <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 space-y-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-zinc-800 flex items-center gap-2">
                  <History className="w-4 h-4 text-zinc-600" /> Global Audit Logs
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-zinc-100 font-mono uppercase tracking-wider text-[10px] text-zinc-500">
                        <th className="py-3 px-4">Action</th>
                        <th className="py-3 px-4">Officer ID</th>
                        <th className="py-3 px-4">Target Snowflake</th>
                        <th className="py-3 px-4">Enforcement Details</th>
                        <th className="py-3 px-4">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                      {logs.slice(0, 15).map(lg => (
                        <tr key={lg._id} className="hover:bg-zinc-50/50">
                          <td className="py-3 px-4 font-bold font-mono">
                            <span className={`px-2 py-0.5 rounded text-[10px] border font-mono ${
                              lg.action === 'GLOBAL_BAN' 
                                ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800' 
                                : lg.action === 'CONNECT_VRCHAT' 
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800' 
                                : 'bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700'
                            }`}>
                              {lg.action}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-zinc-600 font-mono">{lg.adminId}</td>
                          <td className="py-3 px-4 text-zinc-600 font-mono">{lg.targetId}</td>
                          <td className="py-3 px-4 text-zinc-500 font-mono max-w-sm truncate">{lg.details}</td>
                          <td className="py-3 px-4 text-zinc-400 font-mono">{new Date(lg.timestamp).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: BANS & MANAGEMENT */}
          {(role === 'admin' || role === 'moderator') && view === 'bans' && (
            <div className="space-y-8">
              {/* SUB-TAB NAVIGATOR */}
              <div className="flex flex-wrap items-center gap-2 bg-zinc-900/40 p-1.5 rounded-2xl border border-zinc-800/80">
                <button
                  onClick={() => setBanSubTab('cases')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                    banSubTab === 'cases'
                      ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Ban Cases (Linked Accounts)</span>
                </button>
                <button
                  onClick={() => setBanSubTab('watchlist')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                    banSubTab === 'watchlist'
                      ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>High Risk Watchlist ({watchlistUsers.length})</span>
                </button>
                <button
                  onClick={() => setBanSubTab('trusted')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                    banSubTab === 'trusted'
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Trusted Whitelist ({trustedUsers.length})</span>
                </button>
              </div>

              {/* RENDER BAN CASES TAB */}
              {banSubTab === 'cases' && (
                <BanCasesManager
                  isAdmin={role === 'admin'}
                  onDataChanged={() => {
                    const token = localStorage.getItem('gg_token');
                    if (token) fetchDashboardData(token, role, true);
                  }}
                />
              )}

              {/* RENDER OTHER SUBTABS */}
              {banSubTab !== 'cases' && (
                <>
                  {/* MANUAL ACTION PANELS & MANUAL ENROLLMENT */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* MANUAL GLOBAL BAN */}
                    <form onSubmit={handleManualBan} className="bg-white rounded-2xl border border-zinc-200/80 p-6 space-y-4">
                      <h3 className="text-sm font-black uppercase tracking-wider text-red-600 flex items-center gap-2">
                        <UserX className="w-4 h-4 text-red-500" /> Quick Manual Global Ban
                      </h3>
                      <p className="text-xs text-zinc-500">
                        Add any Discord Snowflake OR VRChat User ID (e.g. <code>usr_...</code>) directly to the ban system.
                      </p>
                      {manualBanError && <p role="alert" className="text-xs text-red-700 bg-red-50 border border-red-200 rounded p-3">{manualBanError}</p>}
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-mono uppercase tracking-widest font-black opacity-50">User Snowflake / VRChat ID</label>
                          <input 
                            required
                            type="text"
                            value={manualBanId}
                            onChange={(e) => setManualBanId(e.target.value)}
                            placeholder="e.g. 19283726152 or usr_..."
                            className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-3 text-xs font-mono focus:outline-none focus:border-red-500 focus:bg-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-mono uppercase tracking-widest font-black opacity-50">Ban Violation Reason</label>
                          <input 
                            required
                            type="text"
                            value={manualBanReason}
                            onChange={(e) => setManualBanReason(e.target.value)}
                            placeholder="Violations committed..."
                            className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-3 text-xs focus:outline-none focus:border-red-500 focus:bg-white"
                          />
                        </div>
                      </div>
                      <button type="submit" className="w-full py-3 px-4 bg-red-600 text-white font-semibold text-xs uppercase tracking-widest rounded-xl hover:bg-red-700 transition-all shadow-md cursor-pointer">
                        Execute Exclusion Protocol
                      </button>
                    </form>

                    {/* TRUSTED REGISTER */}
                    <form onSubmit={handleManualTrust} className="bg-white rounded-2xl border border-zinc-200/80 p-6 space-y-4">
                      <h3 className="text-sm font-black uppercase tracking-wider text-emerald-600 flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-emerald-500" /> Manual Trusted Enrollment
                      </h3>
                      <p className="text-xs text-zinc-500">Exempt highly authenticated subjects from automated ban detection modules.</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-mono uppercase tracking-widest font-black opacity-50">User Snowflake / VRChat ID</label>
                          <input 
                            required
                            type="text"
                            value={manualTrustId}
                            onChange={(e) => setManualTrustId(e.target.value)}
                            placeholder="e.g. 19283726152 or usr_..."
                            className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-3 text-xs font-mono focus:outline-none focus:border-emerald-500 focus:bg-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-mono uppercase tracking-widest font-black opacity-50">Associated Reason</label>
                          <input 
                            required
                            type="text"
                            value={manualTrustReason}
                            onChange={(e) => setManualTrustReason(e.target.value)}
                            placeholder="Verification justification..."
                            className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-3 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white"
                          />
                        </div>
                      </div>
                      <button type="submit" className="w-full py-3 px-4 bg-emerald-600 text-white font-semibold text-xs uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-all shadow-md cursor-pointer">
                        Grant Trusted Status
                      </button>
                    </form>
                  </div>

                  {/* REGISTER SELECTION TAB */}
                  <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-100 pb-4 gap-4">
                      <div className="flex items-center gap-1 bg-zinc-100 rounded-lg p-1">
                        <button 
                          onClick={() => setBanSubTab('watchlist')}
                          className={`px-4 py-2 font-semibold text-xs uppercase tracking-wide rounded-md transition-all ${banSubTab === 'watchlist' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'}`}
                        >
                          High Risk Watchlist ({watchlistUsers.length})
                        </button>
                        <button 
                          onClick={() => setBanSubTab('trusted')}
                          className={`px-4 py-2 font-semibold text-xs uppercase tracking-wide rounded-md transition-all ${banSubTab === 'trusted' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'}`}
                        >
                          Trusted Whitelist ({trustedUsers.length})
                        </button>
                      </div>

                      <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input 
                          type="text" 
                          value={banSearch}
                          onChange={(e) => setBanSearch(e.target.value)}
                          placeholder="Search Snowflakes / tags..."
                          className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                        />
                      </div>
                    </div>

                {/* DB REGISTER */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-100 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                        <th className="py-3 px-4">Subject identity</th>
                        <th className="py-3 px-4">Unique ID</th>
                        <th className="py-3 px-4">Actions</th>
                        {banSubTab === 'watchlist' ? (
                          <>
                            <th className="py-3 px-4">Ban violation Reason</th>
                            <th className="py-3 px-4">Trust Category</th>
                            <th className="py-3 px-4">Connected VRChat</th>
                          </>
                        ) : (
                          <>
                            <th className="py-3 px-4">Whitelist reason</th>
                            <th className="py-3 px-4">Connected VRChat</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-mono">
                      {banSubTab === 'watchlist' ? (
                        watchlistUsers.filter(u => u.id.includes(banSearch) || (u.banReason || '').toLowerCase().includes(banSearch.toLowerCase()) || (u.displayName || u.id || '').toLowerCase().includes(banSearch.toLowerCase())).map(u => (
                          <React.Fragment key={u.id}>
                            <tr className={`hover:bg-zinc-50/50 ${expandedBan === u.id ? 'bg-zinc-50' : ''}`}>
                              <td className="py-3 px-4 font-semibold text-zinc-800 text-sm whitespace-nowrap">
                                <div className="space-y-1">
                                  <div className="font-semibold text-zinc-800 text-sm">{u.displayName || u.id}</div>
                                  {u.discordAccounts && u.discordAccounts.length > 0 && (
                                    <div className="flex flex-wrap gap-1 items-center max-w-xs">
                                      <span className="text-[9px] font-mono font-bold text-[#5865F2] bg-[#5865F2]/10 border border-[#5865F2]/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                                        <span>💬</span> {u.discordAccounts.length} Discord {u.discordAccounts.length === 1 ? 'Acct' : 'Accts'}
                                      </span>
                                      {u.discordAccounts.map((da: any, dIdx: number) => (
                                        <span key={dIdx} className="text-[9px] font-mono text-zinc-600 bg-zinc-100 px-1 py-0.5 rounded border border-zinc-200" title={`Discord ID: ${da.discordId}`}>
                                          @{da.username || da.displayName || da.discordId}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-zinc-500 font-mono">{u.id}</td>
                              <td className="py-3 px-4">
                                <div className="flex flex-wrap gap-1.5 justify-start">
                                  <button 
                                    onClick={() => handleToggleExpandBan(u)}
                                    className={`p-1 px-2.5 rounded font-mono text-[10px] font-bold uppercase tracking-wide transition-all ${expandedBan === u.id ? 'bg-indigo-600 text-white' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'}`}
                                  >
                                    {expandedBan === u.id ? 'Close' : 'Edit'}
                                  </button>
                                  <button 
                                    onClick={() => setLinkingVRChatUser(u)}
                                    title={u.vrchatUserId ? "Connect VRChat Alt Account" : "Connect VRChat user"}
                                    className="p-1 px-2.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded flex items-center gap-1 font-bold font-mono text-[10px] cursor-pointer"
                                  >
                                    {u.vrchatUserId ? '+ Alt' : '+ VR'}
                                  </button>
                                  <button 
                                    onClick={() => handleManualUnban(u.id)}
                                    className="p-1 px-2.5 bg-red-50 text-red-600 hover:bg-rose-100 rounded text-[10px] font-bold"
                                  >
                                    Pardon
                                  </button>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-zinc-600 font-mono max-w-[150px] lg:max-w-[220px] truncate" title={u.banReason || 'No reason documented.'}>{u.banReason || 'No reason documented.'}</td>
                              <td className="py-3 px-4 text-xs font-mono">
                                <div className="space-y-1.5 w-fit">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleDangerous(u.id);
                                    }}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1.5 transition-all text-left border ${
                                      u.isDangerous 
                                        ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100' 
                                        : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-zinc-100'
                                    }`}
                                    title="Click to toggle Public Watchlist"
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full ${u.isDangerous ? 'bg-rose-500 animate-pulse' : 'bg-zinc-400'}`} />
                                    <span>{u.isDangerous ? 'WATCHLIST: ON' : 'WATCHLIST: OFF'}</span>
                                  </button>
                                  <span className="text-[9px] text-zinc-400 block uppercase pl-1">
                                    Idx: {u.trustIndex || 'RED_CLASS_D'}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="space-y-1.5 max-w-[220px]">
                                  {u.vrchatUserId ? (
                                    <div className="bg-white border border-zinc-200/60 p-2 rounded-xl space-y-1 relative shadow-sm">
                                      <div className="flex justify-between items-center">
                                        <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-[8px] font-mono leading-none font-bold uppercase tracking-wider">Primary</span>
                                        <button 
                                          onClick={() => handleDisconnectVRChat(u.id, u.vrchatUserId)} 
                                          title="Disconnect Primary" 
                                          className="text-zinc-400 hover:text-rose-600 transition-colors p-0.5 cursor-pointer"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                      <div className="space-y-0.5">
                                        <p className="font-bold text-indigo-900 text-[10px] truncate">{u.vrchatUsername}</p>
                                        <p className="text-[8px] text-zinc-400 font-mono truncate">{u.vrchatUserId}</p>
                                      </div>
                                    </div>
                                  ) : null}

                                  {u.vrchatAlts && u.vrchatAlts.length > 0 && (
                                    <div className="space-y-1 pt-1.5 border-t border-dashed border-zinc-200">
                                      {u.vrchatAlts.map((alt: any) => (
                                        <div key={alt.vrchatUserId} className="bg-zinc-50 border border-zinc-200 p-2 rounded-xl space-y-1 relative shadow-sm">
                                          <div className="flex justify-between items-center">
                                            <span className="bg-zinc-200 text-zinc-700 px-1.5 py-0.5 rounded text-[8px] font-mono leading-none font-bold uppercase tracking-wider">Alt Account</span>
                                            <button 
                                              onClick={() => handleDisconnectVRChat(u.id, alt.vrchatUserId)} 
                                              title="Disconnect Alt" 
                                              className="text-zinc-400 hover:text-rose-600 transition-colors p-0.5 cursor-pointer"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                          <div className="space-y-0.5">
                                            <p className="font-bold text-zinc-800 text-[10px] truncate">{alt.vrchatUsername}</p>
                                            <p className="text-[8px] text-zinc-400 font-mono truncate">{alt.vrchatUserId}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {!u.vrchatUserId && (!u.vrchatAlts || u.vrchatAlts.length === 0) && (
                                    <button 
                                      onClick={() => setLinkingVRChatUser(u)}
                                      className="text-[10px] text-zinc-500 hover:text-indigo-600 hover:underline font-semibold cursor-pointer"
                                    >
                                      Link VRChat Account
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                            {expandedBan === u.id && (
                              <tr className="bg-zinc-50">
                                <td colSpan={6} className="p-4">
                                  <div className="bg-white rounded-xl border border-zinc-200/80 p-5 space-y-4 shadow-sm text-left font-sans">
                                    <div className="flex justify-between items-center border-b border-zinc-100 pb-2">
                                      <h4 className="font-bold text-xs text-zinc-800 uppercase tracking-tight">
                                        Ban Record Authority Console
                                      </h4>
                                      <span className="font-mono text-[9px] text-zinc-400">Target Snowflake: {u.id}</span>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
                                      {/* COLUMN 1: BAN REASON */}
                                      <div className="space-y-2">
                                        <label className="block text-[9px] font-mono uppercase text-zinc-400 font-bold">Ban violation Reason</label>
                                        <textarea
                                          value={editingBanReason?.id === u.id ? editingBanReason.reason : u.banReason || ''}
                                          onChange={(e) => setEditingBanReason({ id: u.id, reason: e.target.value })}
                                          placeholder="Enter violation reason..."
                                          className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 font-sans text-xs focus:outline-none focus:border-indigo-500 focus:bg-white h-24 resize-none"
                                        />
                                        <button
                                          onClick={handleUpdateBanReason}
                                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-mono font-bold uppercase text-[9px] tracking-wider transition-all h-8"
                                        >
                                          Save Reason
                                        </button>
                                      </div>

                                      {/* COLUMN 2: REPUTATION & TRUST INDEX */}
                                      <div className="space-y-4">
                                        <div className="space-y-2">
                                          <div className="flex justify-between items-center">
                                            <label className="text-[9px] font-mono uppercase text-zinc-400 font-bold">Sovereign Reputation</label>
                                            <span className="text-[10px] font-mono font-bold text-zinc-950">{u.reputation ?? 0} SEC</span>
                                          </div>
                                          <div className="flex gap-2">
                                            <input
                                              type="number"
                                              value={editingReputation?.id === u.id ? editingReputation.score : String(u.reputation ?? 0)}
                                              onChange={(e) => setEditingReputation({ id: u.id, score: e.target.value })}
                                              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 text-xs font-mono h-8 focus:outline-none focus:border-indigo-500 focus:bg-white"
                                            />
                                            <button
                                              onClick={handleUpdateReputation}
                                              className="px-3 bg-zinc-800 hover:bg-zinc-900 text-white rounded font-mono font-bold uppercase text-[9px] tracking-wider transition-all whitespace-nowrap h-8"
                                            >
                                              Sync Rep
                                            </button>
                                          </div>
                                        </div>

                                        <div className="space-y-2">
                                          <label className="block text-[9px] font-mono uppercase text-zinc-400 font-bold" htmlFor={`trust-index-${u.id}`}>Sovereign Trust Index</label>
                                          <div className="flex gap-2">
                                            <select
                                              id={`trust-index-${u.id}`}
                                              value={['ALL CLEAR', 'KNOWN', 'TRUSTED', 'SUSPICIOUS', 'POTENTIALLY DANGEROUS', 'BLACKLISTED', 'GREEN_SECURE', 'YELLOW_WARN', 'ORANGE_HIGH_RISK', 'RED_CLASS_D', 'BLACK_TERMINAL', 'CRIMINAL'].includes(editingTrustIndex?.id === u.id ? editingTrustIndex.index : u.trustIndex || 'BLACKLISTED') ? (editingTrustIndex?.id === u.id ? editingTrustIndex.index : u.trustIndex || 'BLACKLISTED') : 'CUSTOM_INPUT'}
                                              onChange={(e) => {
                                                if (e.target.value === 'CUSTOM_INPUT') {
                                                  setEditingTrustIndex({ id: u.id, index: '' });
                                                } else {
                                                  setEditingTrustIndex({ id: u.id, index: e.target.value });
                                                }
                                              }}
                                              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 text-xs font-mono h-8 focus:outline-none focus:border-indigo-500 focus:bg-white cursor-pointer"
                                            >
                                              <option value="ALL CLEAR">ALL CLEAR (0 Rep)</option>
                                              <option value="KNOWN">KNOWN (+10 Rep)</option>
                                              <option value="TRUSTED">TRUSTED (+20 Rep)</option>
                                              <option value="SUSPICIOUS">SUSPICIOUS (-5 Rep)</option>
                                              <option value="POTENTIALLY DANGEROUS">POTENTIALLY DANGEROUS (-10 Rep)</option>
                                              <option value="BLACKLISTED">BLACKLISTED</option>
                                              <option value="CUSTOM_INPUT">-- Custom / Other --</option>
                                            </select>
                                            <button
                                              onClick={handleUpdateTrustIndex}
                                              className="px-3 bg-zinc-800 hover:bg-zinc-900 text-white rounded font-mono font-bold uppercase text-[9px] tracking-wider transition-all whitespace-nowrap h-8"
                                            >
                                              Save Idx
                                            </button>
                                          </div>
                                          {(!['ALL CLEAR', 'KNOWN', 'TRUSTED', 'SUSPICIOUS', 'POTENTIALLY DANGEROUS', 'BLACKLISTED', 'GREEN_SECURE', 'YELLOW_WARN', 'ORANGE_HIGH_RISK', 'RED_CLASS_D', 'BLACK_TERMINAL', 'CRIMINAL'].includes(editingTrustIndex?.id === u.id ? editingTrustIndex.index : u.trustIndex || 'BLACKLISTED')) && (
                                            <input
                                              type="text"
                                              value={editingTrustIndex?.id === u.id ? editingTrustIndex.index : u.trustIndex || ''}
                                              onChange={(e) => setEditingTrustIndex({ id: u.id, index: e.target.value })}
                                              placeholder="Type custom trust index..."
                                              className="w-full mt-1.5 bg-white border border-indigo-300 rounded-lg px-2.5 text-xs font-mono h-8 focus:outline-none focus:border-indigo-500"
                                            />
                                          )}
                                        </div>
                                      </div>

                                      {/* COLUMN 3: CLINICAL WATCHLIST TOGGLE & NOTES */}
                                      <div className="space-y-3">
                                        <div className="p-3 bg-zinc-50 border border-zinc-200/60 rounded-xl space-y-2">
                                          <div className="flex justify-between items-center">
                                            <label className="text-[9px] font-mono uppercase text-zinc-400 font-bold">Watchlist Status</label>
                                            <button
                                              onClick={() => handleToggleDangerous(u.id)}
                                              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${u.isDangerous ? 'bg-rose-600' : 'bg-zinc-200'}`}
                                              style={{ WebkitTapHighlightColor: 'transparent' }}
                                            >
                                              <span
                                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${u.isDangerous ? 'translate-x-4' : 'translate-x-0'}`}
                                              />
                                            </button>
                                          </div>
                                          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-serif leading-none">
                                            <span className={`w-1.5 h-1.5 rounded-full ${u.isDangerous ? 'bg-rose-500 animate-pulse' : 'bg-zinc-300'}`} />
                                            <span>{u.isDangerous ? 'Listed on Public Risk Watchlist' : 'Excluded from Watchlist'}</span>
                                          </div>
                                        </div>

                                        <div className="space-y-1.5">
                                          <label className="block text-[9px] font-mono uppercase text-zinc-400 font-bold">Criminal Notes</label>
                                          <textarea
                                            value={editingDangerousNotes?.id === u.id ? editingDangerousNotes.notes : u.dangerousNotes || ''}
                                            onChange={(e) => setEditingDangerousNotes({ id: u.id, notes: e.target.value })}
                                            placeholder="Enter internal details..."
                                            className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2 font-sans text-xs focus:outline-none focus:border-indigo-500 focus:bg-white h-14 resize-none"
                                          />
                                          <button
                                            onClick={handleUpdateDangerousNotes}
                                            className="w-full py-2 bg-zinc-800 hover:bg-zinc-900 text-white rounded font-mono font-bold uppercase text-[9px] tracking-wider transition-all h-8"
                                          >
                                            Sync Notes
                                          </button>
                                        </div>
                                      </div>

                                      {/* COLUMN 4: CONNECTED VRCHAT MANAGEMENT */}
                                      <div className="space-y-3 bg-zinc-50/50 border border-zinc-200/80 p-3 rounded-xl">
                                        <label className="block text-[9px] font-mono uppercase text-zinc-500 font-bold">🎮 Connected VRChat Accounts</label>
                                        
                                        {/* Primary Account Input Row */}
                                        <div className="space-y-1.5 border-b border-zinc-200/80 pb-2">
                                          <div className="flex justify-between items-center">
                                            <span className="text-[8px] font-mono font-black uppercase text-indigo-700 bg-indigo-50 border-2 border-indigo-200 px-1 py-0.5 rounded">Primary Account</span>
                                            {editingVRChat?.id === u.id && editingVRChat.vrchatUserId && (
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  if (editingVRChat) {
                                                    setEditingVRChat({
                                                      ...editingVRChat,
                                                      vrchatUserId: '',
                                                      vrchatUsername: ''
                                                    });
                                                  }
                                                }}
                                                className="text-[8px] font-bold text-rose-600 hover:underline"
                                              >
                                                Unlink Primary
                                              </button>
                                            )}
                                          </div>
                                          <input
                                            type="text"
                                            placeholder="Primary VR Username"
                                            value={editingVRChat?.id === u.id ? editingVRChat.vrchatUsername : u.vrchatUsername || ''}
                                            onChange={(e) => {
                                              if (editingVRChat && editingVRChat.id === u.id) {
                                                setEditingVRChat({ ...editingVRChat, vrchatUsername: e.target.value });
                                              }
                                            }}
                                            className="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-xs font-sans placeholder-zinc-300"
                                          />
                                          <input
                                            type="text"
                                            placeholder="VRChat ID usr_..."
                                            value={editingVRChat?.id === u.id ? editingVRChat.vrchatUserId : u.vrchatUserId || ''}
                                            onChange={(e) => {
                                              if (editingVRChat && editingVRChat.id === u.id) {
                                                setEditingVRChat({ ...editingVRChat, vrchatUserId: e.target.value });
                                              }
                                            }}
                                            className="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-xs font-mono placeholder-zinc-300"
                                          />
                                        </div>

                                        {/* Alts list */}
                                        <div className="space-y-1.5">
                                          <div className="flex justify-between items-center text-[8px] font-mono font-bold uppercase text-zinc-500">
                                            <span>Alt Accounts ({editingVRChat?.id === u.id ? editingVRChat.vrchatAlts?.length : u.vrchatAlts?.length || 0})</span>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                if (editingVRChat && editingVRChat.id === u.id) {
                                                  setEditingVRChat({
                                                    ...editingVRChat,
                                                    vrchatAlts: [...(editingVRChat.vrchatAlts || []), { vrchatUserId: '', vrchatUsername: '' }]
                                                  });
                                                }
                                              }}
                                              className="text-[8px] font-bold text-indigo-600 hover:underline"
                                            >
                                              + Add Alt
                                            </button>
                                          </div>
                                          
                                          <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                                            {editingVRChat?.id === u.id && editingVRChat.vrchatAlts?.map((alt, index) => (
                                              <div key={index} className="space-y-1 bg-white border border-zinc-200 rounded p-1.5 relative">
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    if (editingVRChat) {
                                                      const updated = [...editingVRChat.vrchatAlts];
                                                      updated.splice(index, 1);
                                                      setEditingVRChat({ ...editingVRChat, vrchatAlts: updated });
                                                    }
                                                  }}
                                                  className="absolute top-1 right-1 text-zinc-400 hover:text-red-500"
                                                  title="Unlink Alt"
                                                >
                                                  <Trash2 className="w-3 h-3" />
                                                </button>
                                                <input
                                                  type="text"
                                                  placeholder="Alt VR Username"
                                                  value={alt.vrchatUsername || ''}
                                                  onChange={(e) => {
                                                    if (editingVRChat) {
                                                      const updated = [...editingVRChat.vrchatAlts];
                                                      updated[index] = { ...updated[index], vrchatUsername: e.target.value };
                                                      setEditingVRChat({ ...editingVRChat, vrchatAlts: updated });
                                                    }
                                                  }}
                                                  className="w-[85%] bg-zinc-50 border border-zinc-200 rounded px-1.5 py-0.5 text-[10px] font-sans"
                                                />
                                                <input
                                                  type="text"
                                                  placeholder="Alt VR User ID"
                                                  value={alt.vrchatUserId || ''}
                                                  onChange={(e) => {
                                                    if (editingVRChat) {
                                                      const updated = [...editingVRChat.vrchatAlts];
                                                      updated[index] = { ...updated[index], vrchatUserId: e.target.value };
                                                      setEditingVRChat({ ...editingVRChat, vrchatAlts: updated });
                                                    }
                                                  }}
                                                  className="w-full bg-zinc-50 border border-zinc-200 rounded px-1.5 py-0.5 text-[10px] font-mono"
                                                />
                                              </div>
                                            ))}
                                          </div>
                                        </div>

                                        <button
                                          onClick={handleUpdateVRChatAccounts}
                                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-mono font-bold uppercase text-[9px] tracking-wider transition-all h-8 mt-1"
                                        >
                                          Sync VRChat Accounts
                                        </button>
                                      </div>
                                    </div>

                                    {/* ROW: CONNECTED DISCORD ACCOUNTS */}
                                    <div className="pt-3 border-t border-zinc-100 space-y-2">
                                      <div className="flex justify-between items-center">
                                        <label className="block text-[10px] font-mono uppercase text-[#5865F2] font-bold flex items-center gap-1.5">
                                          <span>💬</span> Connected Discord Profiles & Accounts
                                        </label>
                                        <span className="text-[9px] font-mono text-zinc-400">
                                          {(u.discordAccounts?.length || 1)} Linked Account{(u.discordAccounts?.length || 1) === 1 ? '' : 's'}
                                        </span>
                                      </div>
                                      <div className="flex flex-wrap gap-2">
                                        {((u.discordAccounts && u.discordAccounts.length > 0)
                                          ? u.discordAccounts
                                          : [{ discordId: u.id, username: u.username || u.displayName || u.id, displayName: u.displayName }]
                                        ).map((acct: any, acctIdx: number) => (
                                          <div key={acctIdx} className="bg-[#5865F2]/10 border border-[#5865F2]/30 px-3 py-1.5 rounded-xl flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-[#5865F2]" />
                                            <div>
                                              <span className="text-xs font-bold text-[#5865F2] font-mono">
                                                @{acct.username || acct.displayName || acct.discordId}
                                              </span>
                                              <span className="text-[9px] text-zinc-400 font-mono ml-2 select-all">
                                                ID: {acct.discordId}
                                              </span>
                                            </div>
                                            {acctIdx === 0 && (
                                              <span className="text-[8px] font-mono uppercase bg-[#5865F2] text-white px-1 py-0.5 rounded ml-1 font-bold">
                                                Primary
                                              </span>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    {/* ROW 4: EVIDENCE LINKS */}
                                    <div className="pt-3 border-t border-zinc-100 space-y-3">
                                      <div className="flex justify-between items-center">
                                        <div className="space-y-0.5">
                                          <label className="block text-[10px] font-mono uppercase text-zinc-500 font-bold">📂 Evidence Files / Intelligence Links</label>
                                          <p className="text-[9px] text-zinc-400 font-sans">Provide web links, screenshot proof, or dossier records for this restriction case.</p>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => setUserEvidenceLinks([...userEvidenceLinks, ''])}
                                          className="px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-wide border-2 border-[#141414] bg-white text-[#141414] hover:bg-zinc-50 shadow-[-2px_2px_0px_0px_rgba(20,20,20,1)] active:translate-y-[1px] active:shadow-none transition-all flex items-center gap-1.5"
                                        >
                                          <Plus className="w-3 h-3" /> Add Evidence Link
                                        </button>
                                      </div>

                                      {userEvidenceLinks.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
                                          {userEvidenceLinks.map((link, idx) => (
                                            <div key={idx} className="flex gap-2 items-center bg-white border border-zinc-200/80 rounded-lg p-2 hover:border-zinc-300 transition-all shadow-sm">
                                              <span className="text-[9px] font-mono text-zinc-400 font-bold select-none w-5">#{idx + 1}</span>
                                              <input
                                                type="text"
                                                placeholder="https://example.com/evidence-or-image"
                                                value={link}
                                                onChange={(e) => {
                                                  const updated = [...userEvidenceLinks];
                                                  updated[idx] = e.target.value;
                                                  setUserEvidenceLinks(updated);
                                                }}
                                                className="flex-1 bg-transparent border-none text-xs font-mono focus:outline-none placeholder-zinc-300 min-w-0"
                                              />
                                              <div className="flex gap-1 items-center shrink-0 border-l border-zinc-100 pl-1.5">
                                                {link && (
                                                  <a
                                                    href={link.startsWith('http') ? link : `https://${link}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-zinc-400 hover:text-indigo-600 p-1 rounded transition-colors"
                                                    title="Open link in new tab"
                                                  >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                  </a>
                                                )}
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    const updated = [...userEvidenceLinks];
                                                    updated.splice(idx, 1);
                                                    setUserEvidenceLinks(updated);
                                                  }}
                                                  className="text-zinc-400 hover:text-rose-600 p-1 rounded transition-colors"
                                                  title="Remove link"
                                                >
                                                  <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <div className="text-center py-6 bg-zinc-50 border border-dashed border-zinc-200 rounded-xl text-zinc-400 text-xs italic">
                                          No evidence files linked to this record yet. Click "+ Add Evidence Link" to link case intelligence files.
                                        </div>
                                      )}

                                      <div className="flex justify-end pt-1">
                                        <button
                                          onClick={() => handleUpdateUserEvidence(u.id)}
                                          disabled={isUpdatingEvidence}
                                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-mono font-bold uppercase text-[9px] tracking-wider transition-all disabled:opacity-50 h-8 flex items-center justify-center gap-1.5"
                                        >
                                          {isUpdatingEvidence ? (
                                            <>
                                              <RefreshCw className="w-3 h-3 animate-spin" /> Syncing Evidence...
                                            </>
                                          ) : (
                                            'Sync Case Evidence'
                                          )}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))
                      ) : (
                        trustedUsers.filter(u => u.id.includes(banSearch) || (u.reason || '').toLowerCase().includes(banSearch.toLowerCase()) || (u.displayName || u.id || '').toLowerCase().includes(banSearch.toLowerCase())).map(u => (
                          <React.Fragment key={u.id}>
                            <tr className={`hover:bg-zinc-50/50 ${expandedBan === u.id ? 'bg-zinc-50' : ''}`}>
                              <td className="py-3 px-4 font-semibold text-zinc-800 text-sm whitespace-nowrap">{u.displayName || u.id}</td>
                              <td className="py-3 px-4 text-zinc-500 font-mono">{u.id}</td>
                              <td className="py-3 px-4">
                                <div className="flex flex-wrap gap-1.5 justify-start">
                                  <button 
                                    onClick={() => handleToggleExpandBan(u)}
                                    className={`p-1 px-2.5 rounded font-mono text-[10px] font-bold uppercase tracking-wide transition-all ${expandedBan === u.id ? 'bg-indigo-600 text-white' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'}`}
                                  >
                                    {expandedBan === u.id ? 'Close' : 'Edit'}
                                  </button>
                                  <button 
                                    onClick={() => setLinkingVRChatUser(u)}
                                    title={u.vrchatUserId ? "Connect VRChat Alt Account" : "Connect VRChat user"}
                                    className="p-1 px-2.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded flex items-center gap-1 font-bold font-mono text-[10px] cursor-pointer"
                                  >
                                    {u.vrchatUserId ? '+ Alt' : '+ VR'}
                                  </button>
                                  <button 
                                    onClick={() => handleToggleTrusted(u.id)}
                                    className="p-1 px-2.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded text-[10px] font-bold"
                                  >
                                    Revoke
                                  </button>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-zinc-600 max-w-sm truncate font-sans" title={u.dangerousNotes || u.banReason || 'Whitelisted.'}>{u.dangerousNotes || u.banReason || 'Whitelisted.'}</td>
                              <td className="py-3 px-4">
                                <div className="space-y-1.5 max-w-[220px]">
                                  {u.vrchatUserId ? (
                                    <div className="bg-white border border-zinc-200/60 p-2 rounded-xl space-y-1 relative shadow-sm">
                                      <div className="flex justify-between items-center">
                                        <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-[8px] font-mono leading-none font-bold uppercase tracking-wider">Primary</span>
                                        <button 
                                          onClick={() => handleDisconnectVRChat(u.id, u.vrchatUserId)} 
                                          title="Disconnect Primary" 
                                          className="text-zinc-400 hover:text-rose-600 transition-colors p-0.5 cursor-pointer"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                      <div className="space-y-0.5 font-sans">
                                        <p className="font-bold text-indigo-900 text-[10px] truncate">{u.vrchatUsername}</p>
                                        <p className="text-[8px] text-zinc-400 font-mono truncate">{u.vrchatUserId}</p>
                                      </div>
                                    </div>
                                  ) : null}

                                  {u.vrchatAlts && u.vrchatAlts.length > 0 && (
                                    <div className="space-y-1 pt-1.5 border-t border-dashed border-zinc-200">
                                      {u.vrchatAlts.map((alt: any) => (
                                        <div key={alt.vrchatUserId} className="bg-zinc-50 border border-zinc-200 p-2 rounded-xl space-y-1 relative shadow-sm">
                                          <div className="flex justify-between items-center">
                                            <span className="bg-zinc-200 text-zinc-700 px-1.5 py-0.5 rounded text-[8px] font-mono leading-none font-bold uppercase tracking-wider">Alt Account</span>
                                            <button 
                                              onClick={() => handleDisconnectVRChat(u.id, alt.vrchatUserId)} 
                                              title="Disconnect Alt" 
                                              className="text-zinc-400 hover:text-rose-600 transition-colors p-0.5 cursor-pointer"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                          <div className="space-y-0.5 font-sans">
                                            <p className="font-bold text-zinc-800 text-[10px] truncate">{alt.vrchatUsername}</p>
                                            <p className="text-[8px] text-zinc-400 font-mono truncate">{alt.vrchatUserId}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {!u.vrchatUserId && (!u.vrchatAlts || u.vrchatAlts.length === 0) && (
                                    <button 
                                      onClick={() => setLinkingVRChatUser(u)}
                                      className="text-[10px] text-zinc-500 hover:text-indigo-600 hover:underline font-semibold cursor-pointer font-sans"
                                    >
                                      Link VRChat Account
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                            {expandedBan === u.id && (
                              <tr className="bg-zinc-50">
                                <td colSpan={5} className="p-4">
                                  <div className="bg-white rounded-xl border border-zinc-200/80 p-5 space-y-4 shadow-sm text-left font-sans">
                                    <div className="flex justify-between items-center border-b border-zinc-100 pb-2">
                                      <h4 className="font-bold text-xs text-zinc-800 uppercase tracking-tight">
                                        Trusted User Console
                                      </h4>
                                      <span className="font-mono text-[9px] text-zinc-400">Target Snowflake: {u.id}</span>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                      {/* Whitelist Reason / Notes */}
                                      <div className="space-y-2">
                                        <label className="block text-[9px] font-mono uppercase text-zinc-400 font-bold">Whitelist Reason / Notes</label>
                                        <textarea
                                          value={editingDangerousNotes?.id === u.id ? editingDangerousNotes.notes : u.dangerousNotes || u.banReason || ''}
                                          onChange={(e) => setEditingDangerousNotes({ id: u.id, notes: e.target.value })}
                                          placeholder="Enter whitelist reasons or admin notes..."
                                          className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 font-sans text-xs focus:outline-none focus:border-indigo-500 focus:bg-white h-24 resize-none"
                                        />
                                        <button
                                          onClick={handleUpdateDangerousNotes}
                                          className="w-full py-2 bg-zinc-800 hover:bg-zinc-900 text-white rounded font-mono font-bold uppercase text-[9px] tracking-wider transition-all h-8"
                                        >
                                          Save Whitelist Notes
                                        </button>
                                      </div>

                                      {/* Connected VRChat Accounts */}
                                      <div className="space-y-3 bg-zinc-50/50 border border-zinc-200/80 p-3 rounded-xl">
                                        <label className="block text-[9px] font-mono uppercase text-zinc-500 font-bold">🎮 Connected VRChat Accounts</label>
                                        
                                        {/* Primary Account Input Row */}
                                        <div className="space-y-1.5 border-b border-zinc-200/80 pb-2">
                                          <div className="flex justify-between items-center">
                                            <span className="text-[8px] font-mono font-black uppercase text-indigo-700 bg-indigo-50 border-2 border-indigo-200 px-1 py-0.5 rounded">Primary Account</span>
                                            {editingVRChat?.id === u.id && editingVRChat.vrchatUserId && (
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  if (editingVRChat) {
                                                    setEditingVRChat({
                                                      ...editingVRChat,
                                                      vrchatUserId: '',
                                                      vrchatUsername: ''
                                                    });
                                                  }
                                                }}
                                                className="text-[8px] font-bold text-rose-600 hover:underline"
                                              >
                                                Unlink Primary
                                              </button>
                                            )}
                                          </div>
                                          <input
                                            type="text"
                                            placeholder="Primary VR Username"
                                            value={editingVRChat?.id === u.id ? editingVRChat.vrchatUsername : u.vrchatUsername || ''}
                                            onChange={(e) => {
                                              if (editingVRChat && editingVRChat.id === u.id) {
                                                setEditingVRChat({ ...editingVRChat, vrchatUsername: e.target.value });
                                              }
                                            }}
                                            className="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-xs font-sans placeholder-zinc-300"
                                          />
                                          <input
                                            type="text"
                                            placeholder="VRChat ID usr_..."
                                            value={editingVRChat?.id === u.id ? editingVRChat.vrchatUserId : u.vrchatUserId || ''}
                                            onChange={(e) => {
                                              if (editingVRChat && editingVRChat.id === u.id) {
                                                setEditingVRChat({ ...editingVRChat, vrchatUserId: e.target.value });
                                              }
                                            }}
                                            className="w-full bg-white border border-zinc-200 rounded px-2 py-1 text-xs font-mono placeholder-zinc-300"
                                          />
                                        </div>

                                        {/* Alts list */}
                                        <div className="space-y-1.5">
                                          <div className="flex justify-between items-center text-[8px] font-mono font-bold uppercase text-zinc-500">
                                            <span>Alt Accounts ({editingVRChat?.id === u.id ? editingVRChat.vrchatAlts?.length : u.vrchatAlts?.length || 0})</span>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                if (editingVRChat && editingVRChat.id === u.id) {
                                                  setEditingVRChat({
                                                    ...editingVRChat,
                                                    vrchatAlts: [...(editingVRChat.vrchatAlts || []), { vrchatUserId: '', vrchatUsername: '' }]
                                                  });
                                                }
                                              }}
                                              className="text-[8px] font-bold text-indigo-600 hover:underline"
                                            >
                                              + Add Alt
                                            </button>
                                          </div>
                                          
                                          <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                                            {editingVRChat?.id === u.id && editingVRChat.vrchatAlts?.map((alt: any, index: number) => (
                                              <div key={index} className="space-y-1 bg-white border border-zinc-200 rounded p-1.5 relative">
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    if (editingVRChat) {
                                                      const updated = [...editingVRChat.vrchatAlts];
                                                      updated.splice(index, 1);
                                                      setEditingVRChat({ ...editingVRChat, vrchatAlts: updated });
                                                    }
                                                  }}
                                                  className="absolute top-1 right-1 text-zinc-400 hover:text-red-500"
                                                  title="Unlink Alt"
                                                >
                                                  <Trash2 className="w-3 h-3" />
                                                </button>
                                                <input
                                                  type="text"
                                                  placeholder="Alt VR Username"
                                                  value={alt.vrchatUsername || ''}
                                                  onChange={(e) => {
                                                    if (editingVRChat) {
                                                      const updated = [...editingVRChat.vrchatAlts];
                                                      updated[index] = { ...updated[index], vrchatUsername: e.target.value };
                                                      setEditingVRChat({ ...editingVRChat, vrchatAlts: updated });
                                                    }
                                                  }}
                                                  className="w-full bg-white border border-zinc-200 rounded px-1.5 py-0.5 text-[10px] font-sans placeholder-zinc-300"
                                                />
                                                <input
                                                  type="text"
                                                  placeholder="Alt VR User ID"
                                                  value={alt.vrchatUserId || ''}
                                                  onChange={(e) => {
                                                    if (editingVRChat) {
                                                      const updated = [...editingVRChat.vrchatAlts];
                                                      updated[index] = { ...updated[index], vrchatUserId: e.target.value };
                                                      setEditingVRChat({ ...editingVRChat, vrchatAlts: updated });
                                                    }
                                                  }}
                                                  className="w-full bg-zinc-50 border border-zinc-200 rounded px-1.5 py-0.5 text-[10px] font-mono"
                                                />
                                              </div>
                                            ))}
                                          </div>
                                        </div>

                                        <button
                                          onClick={handleUpdateVRChatAccounts}
                                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-mono font-bold uppercase text-[9px] tracking-wider transition-all h-8 mt-1"
                                        >
                                          Sync VRChat Accounts
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))
                      )}
                    </tbody>
                  </table>
                  {(banSubTab === 'banned' ? bannedUsers : banSubTab === 'watchlist' ? watchlistUsers : trustedUsers).length === 0 && (
                    <div className="text-center py-12 opacity-40 italic text-xs">No records exist in the active category.</div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

          {/* VIEW: SUBJECT QUERY */}
          {(role === 'admin' || role === 'moderator') && view === 'lookup' && (
            <div className="space-y-8 max-w-4xl">
              <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 space-y-6">
                <h3 className="text-sm font-black uppercase tracking-wider text-neutral-800 flex items-center gap-2">
                  <Search className="w-4 h-4 text-zinc-700" /> Direct Snowflake Lookup
                </h3>
                <form onSubmit={handleAdminLookup} className="flex gap-4">
                  <input 
                    type="text" 
                    value={lookupId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setLookupId(val.includes('vrchat.com') || val.includes('usr_') ? extractVRChatUserId(val) : val);
                    }}
                    placeholder="Enter Snowflake ID or VRChat ID / link..."
                    className="flex-1 bg-zinc-50 border border-zinc-300 rounded-xl p-4 font-mono text-sm focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                  <button 
                    type="submit" 
                    disabled={lookupLoading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-widest px-8 rounded-xl disabled:opacity-50 transition-all flex items-center gap-2"
                  >
                    {lookupLoading ? 'Evaluating...' : 'Query Profile'}
                  </button>
                </form>
              </div>

              {/* LOOKUP PROFILE RESULT */}
              {lookupResult && (
                <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm overflow-hidden divide-y divide-zinc-100">
                  <div className="p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div className="flex items-center gap-4">
                      <img 
                        src={lookupResult.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png'} 
                        alt="avatar" 
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = 'https://cdn.discordapp.com/embed/avatars/0.png';
                        }}
                        className="w-16 h-16 rounded-full border-2 border-indigo-200 object-cover" 
                      />
                      <div>
                        <h2 className="text-2xl font-black text-[#141414] tracking-tight">{lookupResult.displayName || lookupResult.username || 'Unverified'}</h2>
                        <span className="font-mono text-xs opacity-50 block mt-0.5">Snowflake ID: {lookupResult.id}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {lookupResult.isBanned ? (
                        <span className="bg-red-50 text-red-700 border-2 border-red-500 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider">Globally Restricted (Banned)</span>
                      ) : (
                        <span className="bg-emerald-50 text-emerald-700 border-2 border-emerald-500 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider">Global status: Active (OK)</span>
                      )}
                    </div>
                  </div>

                  <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 bg-zinc-50/50">
                    <div className="space-y-4">
                      <h3 className="text-xs uppercase font-mono tracking-widest text-zinc-500 font-bold">Historical data</h3>
                      
                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono uppercase opacity-50">Trust indexing</label>
                        <p className="font-bold font-mono text-sm uppercase text-amber-700">{lookupResult.trustIndex || 'CRIMINAL'}</p>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono uppercase opacity-50">Global Reputation Index</label>
                        <div className="flex items-center gap-2">
                          <p className={`text-lg font-black font-mono ${lookupResult.reputation < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {lookupResult.reputation || 0}
                          </p>
                          <button 
                            onClick={() => handleResetReputation(lookupResult.id)}
                            className="text-[10px] text-zinc-400 hover:text-zinc-600 font-mono uppercase flex items-center gap-1"
                          >
                            <RefreshCw className="w-3 h-3" /> Reset
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono uppercase opacity-50">Age Verification Flag</label>
                        <p className="font-bold text-xs">{lookupResult.isAgeVerified ? '✅ VERIFIED 18+' : '❌ UNVERIFIED'}</p>
                      </div>
                    </div>

                    {/* VRCHAT PROFILE CARD */}
                    <div className="space-y-4 font-sans">
                      <h3 className="text-xs uppercase font-mono tracking-widest text-[#141414] font-bold">VRChat Integration Status</h3>
                      {lookupResult.vrchatUserId || (lookupResult.vrchatAlts && lookupResult.vrchatAlts.length > 0) ? (
                        <div className="space-y-3">
                          {lookupResult.vrchatUserId && (
                            <div className="bg-indigo-50/50 border border-indigo-200/60 p-4 rounded-xl flex justify-between items-center shadow-sm">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-600 text-white flex items-center justify-center font-bold font-mono rounded-lg">VR</div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="bg-indigo-100/80 text-indigo-700 px-1.5 py-0.5 rounded text-[8px] font-mono leading-none font-bold uppercase tracking-wider">Primary</span>
                                    <p className="font-bold text-indigo-900 tracking-tight">{lookupResult.vrchatUsername}</p>
                                  </div>
                                  <span className="font-mono text-[9px] text-indigo-505 block mt-0.5">{lookupResult.vrchatUserId}</span>
                                </div>
                              </div>
                              <button 
                                onClick={() => handleDisconnectVRChat(lookupResult.id, lookupResult.vrchatUserId)}
                                className="p-1.5 hover:bg-rose-50 text-zinc-400 hover:text-red-600 rounded-lg transition-colors border border-transparent hover:border-rose-100 cursor-pointer"
                                title="Disconnect primary VRChat account"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}

                          {lookupResult.vrchatAlts && lookupResult.vrchatAlts.map((alt: any) => (
                            <div key={alt.vrchatUserId} className="bg-zinc-50 border border-zinc-200 p-4 rounded-xl flex justify-between items-center shadow-sm">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-zinc-700 text-white flex items-center justify-center font-bold font-mono rounded-lg">ALT</div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="bg-zinc-200 text-zinc-700 px-1.5 py-0.5 rounded text-[8px] font-mono leading-none font-bold uppercase tracking-wider">Alt Account</span>
                                    <p className="font-bold text-zinc-950 tracking-tight">{alt.vrchatUsername}</p>
                                  </div>
                                  <span className="font-mono text-[9px] text-zinc-500 block mt-0.5">{alt.vrchatUserId}</span>
                                </div>
                              </div>
                              <button 
                                onClick={() => handleDisconnectVRChat(lookupResult.id, alt.vrchatUserId)}
                                className="p-1.5 hover:bg-rose-50 text-zinc-400 hover:text-red-100/80 rounded-lg transition-colors border border-transparent hover:border-rose-100 cursor-pointer"
                                title="Disconnect alt VRChat account"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}

                          <button 
                            onClick={() => setLinkingVRChatUser(lookupResult)}
                            type="button"
                            className="w-full bg-white border border-zinc-300 hover:bg-neutral-50 px-3 py-2.5 text-xs rounded-xl font-bold font-mono uppercase tracking-wide text-zinc-750 hover:text-zinc-950 transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Plus className="w-4 h-4" /> Connect VRChat Alt Account
                          </button>
                        </div>
                      ) : (
                        <div className="bg-zinc-100 p-6 rounded-xl text-center space-y-4">
                          <p className="text-xs text-zinc-500 font-mono">No VRChat accounts linked to this subject record.</p>
                          <button 
                            onClick={() => setLinkingVRChatUser(lookupResult)}
                            type="button"
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-mono py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                          >
                            Associate VRChat Account
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {lookupResult.isBanned && (
                    <div className="p-8 space-y-3 bg-red-50/40 border-t border-red-100">
                      <div className="flex items-center justify-between">
                        <label className="block text-[10px] font-mono uppercase opacity-70 text-red-700 font-black">Documented Ban Reason & Intelligence</label>
                        <span className="bg-red-100 text-red-800 text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase">Active Global Restriction</span>
                      </div>
                      <blockquote className="border-l-4 border-red-500 pl-4 italic text-sm text-red-950 font-medium bg-white/60 p-3 rounded-r-lg shadow-sm">
                        "{lookupResult.banReason || 'No details specified.'}"
                      </blockquote>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 font-mono text-xs">
                        <div className="bg-white/80 p-2.5 rounded-lg border border-red-100">
                          <span className="block text-[9px] uppercase opacity-50 text-red-800 font-bold">Ban Issued By (Moderator)</span>
                          <span className="font-bold text-red-950">{lookupResult.bannedBy || 'System / Moderator'}</span>
                        </div>
                        <div className="bg-white/80 p-2.5 rounded-lg border border-red-100">
                          <span className="block text-[9px] uppercase opacity-50 text-red-800 font-bold">Ban Timestamp</span>
                          <span className="font-bold text-zinc-800">{lookupResult.bannedAt ? new Date(lookupResult.bannedAt).toLocaleString() : (lookupResult.updatedAt ? new Date(lookupResult.updatedAt).toLocaleString() : 'N/A')}</span>
                        </div>
                        <div className="bg-white/80 p-2.5 rounded-lg border border-red-100">
                          <span className="block text-[9px] uppercase opacity-50 text-red-800 font-bold">Restriction Type</span>
                          <span className="font-bold text-zinc-800 uppercase">{lookupResult.banType || 'Permanent'}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PERMANENT UNBAN HISTORY SECTION */}
                  <div className="p-8 space-y-4 bg-zinc-50/30 border-t border-zinc-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 flex items-center gap-2">
                          <History className="w-4 h-4 text-emerald-600" /> Permanent Unban History
                        </h3>
                        <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                          Immutable audit log of all historical unbans issued to this subject. Permanent & non-deletable.
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 text-zinc-700 text-[10px] font-mono font-bold rounded-lg border border-zinc-200 w-fit">
                        <Lock className="w-3 h-3 text-zinc-500" /> Non-Deletable
                      </span>
                    </div>

                    {lookupResult.unbanHistory && lookupResult.unbanHistory.length > 0 ? (
                      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
                        <table className="w-full text-left font-mono text-xs">
                          <thead>
                            <tr className="bg-zinc-100/70 border-b border-zinc-200 text-[10px] uppercase text-zinc-500 font-bold">
                              <th className="py-2.5 px-4">Ban Date</th>
                              <th className="py-2.5 px-4">Unban Date</th>
                              <th className="py-2.5 px-4">Original Ban Reason</th>
                              <th className="py-2.5 px-4">Username At Unban</th>
                              <th className="py-2.5 px-4">Banned By</th>
                              <th className="py-2.5 px-4">Unbanned By</th>
                              <th className="py-2.5 px-4">Unban Context</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100">
                            {lookupResult.unbanHistory.map((item: any, idx: number) => (
                              <tr key={idx} className="hover:bg-emerald-50/30 transition-colors">
                                <td className="py-3 px-4 text-zinc-600 whitespace-nowrap">
                                  {item.bandate ? new Date(item.bandate).toLocaleString() : 'N/A'}
                                </td>
                                <td className="py-3 px-4 text-emerald-700 font-bold whitespace-nowrap">
                                  {item.unbandate ? new Date(item.unbandate).toLocaleString() : 'N/A'}
                                </td>
                                <td className="py-3 px-4 text-zinc-900 font-sans max-w-xs truncate" title={item.banreason}>
                                  {item.banreason || 'No reason recorded'}
                                </td>
                                <td className="py-3 px-4 text-indigo-600 font-bold">
                                  {item.username || 'Unknown'}
                                </td>
                                <td className="py-3 px-4 text-red-700 font-bold">
                                  {item.bannedBy || 'System / Moderator'}
                                </td>
                                <td className="py-3 px-4 text-emerald-800 font-bold">
                                  {item.unbannedBy || 'System'}
                                </td>
                                <td className="py-3 px-4 text-zinc-500 text-[11px]">
                                  {item.unbanReason || 'Global Unban'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="bg-white border border-zinc-200 rounded-xl p-5 text-center text-xs font-mono text-zinc-400 italic">
                        No prior unban history recorded for this subject.
                      </div>
                    )}
                  </div>

                  {/* PERMANENT WARNING LOGS SECTION */}
                  <div className="p-8 space-y-4 bg-zinc-50/50 border-t border-zinc-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600" /> Permanent Warning Logs ({lookupResult.warnings?.length || 0})
                        </h3>
                        <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                          Complete history of all warnings ever issued to this subject across connected servers. Permanent & non-deletable.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 text-zinc-700 text-[10px] font-mono font-bold rounded-lg border border-zinc-200">
                          <Lock className="w-3 h-3 text-zinc-500" /> Non-Deletable
                        </span>
                        <button
                          onClick={() => setShowAddWarningModal(true)}
                          type="button"
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-mono text-xs font-bold uppercase rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> Issue Warning
                        </button>
                      </div>
                    </div>

                    {lookupResult.warnings && lookupResult.warnings.length > 0 ? (
                      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
                        <table className="w-full text-left font-mono text-xs">
                          <thead>
                            <tr className="bg-amber-50/50 border-b border-zinc-200 text-[10px] uppercase text-zinc-500 font-bold">
                              <th className="py-2.5 px-4">Date & Time</th>
                              <th className="py-2.5 px-4">Warning Reason</th>
                              <th className="py-2.5 px-4">Issued By</th>
                              <th className="py-2.5 px-4">Server / Node ID</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100">
                            {lookupResult.warnings.map((w: any, idx: number) => (
                              <tr key={idx} className="hover:bg-amber-50/30 transition-colors">
                                <td className="py-3 px-4 text-zinc-600 whitespace-nowrap">
                                  {w.timestamp ? new Date(w.timestamp).toLocaleString() : 'N/A'}
                                </td>
                                <td className="py-3 px-4 text-amber-900 font-medium font-sans max-w-md truncate" title={w.reason}>
                                  {w.reason || 'No reason specified'}
                                </td>
                                <td className="py-3 px-4 text-zinc-800 font-bold">
                                  {w.adminId || 'Moderator'}
                                </td>
                                <td className="py-3 px-4 text-zinc-500 text-[11px]">
                                  {w.guildId || 'Global Dashboard'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="bg-white border border-zinc-200 rounded-xl p-5 text-center text-xs font-mono text-zinc-400 italic">
                        0 warnings recorded for this subject.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ISSUE WARNING MODAL */}
              {showAddWarningModal && lookupResult && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-2xl border border-zinc-200 max-w-md w-full p-6 space-y-6 shadow-2xl">
                    <div className="flex justify-between items-center border-b border-zinc-100 pb-4">
                      <div>
                        <h3 className="font-black text-sm uppercase tracking-wider text-zinc-900 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600" /> Issue Warning To Subject
                        </h3>
                        <p className="text-xs text-zinc-500 font-mono mt-0.5">Subject: {lookupResult.displayName || lookupResult.username || lookupResult.id}</p>
                      </div>
                      <button
                        onClick={() => setShowAddWarningModal(false)}
                        className="text-zinc-400 hover:text-zinc-600 p-1 cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <form onSubmit={handleIssueWarning} className="space-y-4">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-mono uppercase font-bold text-zinc-500">Warning Reason</label>
                        <textarea
                          rows={3}
                          value={warningReasonInput}
                          onChange={(e) => setWarningReasonInput(e.target.value)}
                          placeholder="Specify exact warning reason / offense details..."
                          required
                          className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-3 text-xs font-mono focus:outline-none focus:border-amber-500 focus:bg-white"
                        />
                      </div>

                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 font-mono leading-tight flex items-start gap-2">
                        <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                        <div>
                          <strong>Permanent Logging Notice:</strong> This warning will be appended permanently to the subject's record and cannot be deleted or wiped.
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowAddWarningModal(false)}
                          className="px-4 py-2 border border-zinc-300 hover:bg-zinc-50 text-zinc-700 font-mono text-xs font-bold uppercase rounded-xl cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isIssuingWarning || !warningReasonInput.trim()}
                          className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-mono text-xs font-bold uppercase rounded-xl disabled:opacity-50 transition-all cursor-pointer"
                        >
                          {isIssuingWarning ? 'Recording...' : 'Issue Warning'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW: GUILDS / NODES */}
          {view === 'guilds' && (
            <div className="space-y-6">
              {editingGuildSettings && selectedGuild ? (
                <div className="bg-white rounded-2xl border border-zinc-200/80 p-8 shadow-sm space-y-6">
                  <div className="flex justify-between items-center border-b border-zinc-100 pb-4 flex-wrap gap-3">
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="font-black text-lg text-zinc-900 uppercase">
                          Configure {selectedGuild.name || 'Group'} Node Settings
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono text-[10px] font-bold uppercase flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Shard #{selectedGuild.shardId ?? 0}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap mt-1">
                        <p className="text-xs text-zinc-500 font-mono">Node ID: {selectedGuild.id}</p>
                        <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                          Status: {selectedGuild.settings?.customBotEnabled && selectedGuild.settings?.customBotToken
                            ? (selectedGuild.settings?.customBotActivityText || 'Keeping you safe with love ❤️')
                            : 'Keeping you safe with love ❤️'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedGuild(null);
                        setEditingGuildSettings(null);
                        setShowDeleteConfirm(false);
                      }}
                      className="text-[#141414] hover:text-indigo-600 font-mono text-xs uppercase font-bold"
                    >
                      ← Back to Nodes
                    </button>
                  </div>

                  <form onSubmit={handleSaveGuildSettings} className="space-y-8">
                    {/* SECTION 1: VRCHAT GROUP bot INTEGRATION */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 border-b border-zinc-100 pb-2">
                        <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full"></span>
                        <h4 className="text-xs font-black uppercase text-zinc-800 tracking-wider">VRChat Group Integration</h4>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="block font-mono text-[10px] uppercase font-bold text-zinc-500">Enable Group Bot</label>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={editingGuildSettings.vrchatBotEnabled}
                                onChange={(e) => setEditingGuildSettings({ ...editingGuildSettings, vrchatBotEnabled: e.target.checked })}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                              <span className="ml-3 font-mono text-xs text-zinc-600 uppercase font-semibold">
                                {editingGuildSettings.vrchatBotEnabled ? 'Enabled' : 'Disabled'}
                              </span>
                            </label>
                            <p className="text-[10px] text-zinc-400 font-serif leading-tight">When enabled, the central bot will ban/unban subjects from this specific VRChat group.</p>
                          </div>

                          <div className="space-y-2">
                            <label className="block font-mono text-[10px] uppercase font-bold text-zinc-500">VRChat Auto-Banning</label>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={editingGuildSettings.vrchatAutoBanEnabled !== false}
                                onChange={(e) => setEditingGuildSettings({ ...editingGuildSettings, vrchatAutoBanEnabled: e.target.checked })}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                              <span className="ml-3 font-mono text-xs text-zinc-600 uppercase font-semibold">
                                {editingGuildSettings.vrchatAutoBanEnabled !== false ? 'Enabled' : 'Disabled'}
                              </span>
                            </label>
                            <p className="text-[10px] text-zinc-400 font-serif leading-tight">If disabled, instead of banning blacklisted users, the bot warns group staff and pings their Discord role.</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="block font-mono text-[10px] uppercase font-bold text-zinc-500">VRChat Group ID</label>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              placeholder="grp_... or full group URL" 
                              value={editingGuildSettings.vrchatGroupId}
                              onChange={(e) => setEditingGuildSettings({ ...editingGuildSettings, vrchatGroupId: extractVRChatGroupId(e.target.value) })}
                              className="flex-1 bg-zinc-50 border-2 border-zinc-200 rounded-xl p-3 font-mono text-xs focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => handleInviteBot(editingGuildSettings.vrchatGroupId)}
                              disabled={invitingBot || !editingGuildSettings.vrchatGroupId}
                              className="px-4 bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-45 rounded-xl font-mono text-[10px] uppercase font-bold tracking-wider transition-all h-12"
                            >
                              {invitingBot ? 'Inviting...' : 'Invite central bot'}
                            </button>
                          </div>
                          
                          {inviteStatus && (
                            <div className={`p-3 rounded-lg text-xs font-serif ${inviteStatus.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-rose-50 text-rose-800 border border-rose-100'}`}>
                              {inviteStatus.message}
                            </div>
                          )}

                          <p className="text-[10px] text-zinc-400 font-serif leading-tight">Verify that the central VRChat bot has been added to this group with necessary banning permissions.</p>

                          {/* SETUP INSTRUCTIONS GUIDE */}
                          <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2 text-left text-[11px] font-sans text-zinc-600 mt-2">
                            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wide text-zinc-700 font-mono text-[9px] text-indigo-600">
                              <Info className="w-3.5 h-3.5" />
                              <span>VRChat Integration & Setup Guide</span>
                            </div>
                            <ol className="list-decimal list-inside space-y-1 text-zinc-500">
                              <li>Specify the target VRChat Group ID (starts with <code className="bg-white px-1 py-0.2 rounded font-mono text-[10px] border border-zinc-200">grp_...</code>) in the field above.</li>
                              <li>Turn on <span className="font-semibold">Enable Group Bot</span> checkbox on the left.</li>
                              <li>Click <span className="font-semibold text-zinc-800">Invite central bot</span> to send an automated Join Request.</li>
                              <li>On the VRChat target group dashboard page, approve the bot's pending Join Request.</li>
                              <li>Finally, promote the bot to a role with <span className="font-semibold text-red-600">moderate/ban capabilities</span> so it can actively safeguard your nodes.</li>
                            </ol>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 2: AUTOMATED BAN SETTINGS */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 border-b border-zinc-100 pb-2">
                        <span className="w-2.5 h-2.5 bg-rose-500 rounded-full"></span>
                        <h4 className="text-xs font-black uppercase text-zinc-800 tracking-wider">Automated Ban ledger Engine</h4>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <label className="block font-mono text-[10px] uppercase font-bold text-zinc-500">Sync Global Bans</label>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={editingGuildSettings.autoBanEnabled}
                              onChange={(e) => setEditingGuildSettings({ ...editingGuildSettings, autoBanEnabled: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                            <span className="ml-3 font-mono text-xs text-zinc-600 uppercase font-semibold">
                              {editingGuildSettings.autoBanEnabled ? 'ACTIVE Sync' : 'INACTIVE'}
                            </span>
                          </label>
                          <p className="text-[10px] text-zinc-400 font-serif leading-tight">When active, any global ban trigger will immediately replicate to this node.</p>
                        </div>

                        <div className="space-y-2">
                          <label className="block font-mono text-[10px] uppercase font-bold text-zinc-500">Auto-Unban in Discord</label>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={editingGuildSettings.autoUnbanDiscordEnabled !== false}
                              onChange={(e) => setEditingGuildSettings({ ...editingGuildSettings, autoUnbanDiscordEnabled: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                            <span className="ml-3 font-mono text-xs text-zinc-600 uppercase font-semibold">
                              {editingGuildSettings.autoUnbanDiscordEnabled !== false ? 'ENABLED (DISCORD)' : 'DISABLED'}
                            </span>
                          </label>
                          <p className="text-[10px] text-zinc-400 font-serif leading-tight">Automatically unbans users in this Discord server when they are unbanned globally or appealed.</p>
                        </div>

                        <div className="space-y-2">
                          <label className="block font-mono text-[10px] uppercase font-bold text-zinc-500">Auto-Unban in VRChat</label>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={editingGuildSettings.autoUnbanVRChatEnabled !== false}
                              onChange={(e) => setEditingGuildSettings({ ...editingGuildSettings, autoUnbanVRChatEnabled: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                            <span className="ml-3 font-mono text-xs text-zinc-600 uppercase font-semibold">
                              {editingGuildSettings.autoUnbanVRChatEnabled !== false ? 'ENABLED (VRCHAT)' : 'DISABLED'}
                            </span>
                          </label>
                          <p className="text-[10px] text-zinc-400 font-serif leading-tight">Automatically unbans users in this server's connected VRChat Group when unbanned globally or appealed.</p>
                        </div>

                        <div className="space-y-2">
                          <label className="block font-mono text-[10px] uppercase font-bold text-zinc-500">Auto-Ban Reputation Threshold</label>
                          <input 
                            type="number" 
                            value={editingGuildSettings.autoBanThreshold}
                            onChange={(e) => setEditingGuildSettings({ ...editingGuildSettings, autoBanThreshold: parseInt(e.target.value) || -10 })}
                            className="w-full bg-zinc-50 border-2 border-zinc-200 rounded-xl p-3 font-mono text-xs focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                          />
                          <p className="text-[10px] text-zinc-400 font-serif leading-tight">Bans users if their sovereign reputation score falls below this number.</p>
                        </div>

                        <div className="space-y-2">
                          <label className="block font-mono text-[10px] uppercase font-bold text-zinc-500">Warning Threshold</label>
                          <input 
                            type="number" 
                            value={editingGuildSettings.warningThreshold}
                            onChange={(e) => setEditingGuildSettings({ ...editingGuildSettings, warningThreshold: parseInt(e.target.value) || 3 })}
                            className="w-full bg-zinc-50 border-2 border-zinc-200 rounded-xl p-3 font-mono text-xs focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                          />
                          <p className="text-[10px] text-zinc-400 font-serif leading-tight">Maximum allowed warnings before a local restriction is assessed.</p>
                        </div>

                        <div className="space-y-2">
                          <label className="block font-mono text-[10px] uppercase font-bold text-zinc-500">Linked Custom Banlist ID</label>
                          <input 
                            type="text" 
                            placeholder="Paste Custom Banlist ID here"
                            value={editingGuildSettings.customBanlistId || ''}
                            onChange={(e) => setEditingGuildSettings({ ...editingGuildSettings, customBanlistId: e.target.value })}
                            className="w-full bg-zinc-50 border-2 border-zinc-200 rounded-xl p-3 font-mono text-xs focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                          />
                          <p className="text-[10px] text-zinc-400 font-serif leading-tight">Paste a custom banlist ID here to sync its entries to this node.</p>
                        </div>

                        <div className="space-y-2">
                          <label className="block font-mono text-[10px] uppercase font-bold text-zinc-500">Banlist Selection Mode</label>
                          <select 
                            value={editingGuildSettings.banlistSelectionMode || 'global'}
                            onChange={(e) => setEditingGuildSettings({ ...editingGuildSettings, banlistSelectionMode: e.target.value })}
                            className="w-full bg-zinc-50 border-2 border-zinc-200 rounded-xl p-3 font-mono text-xs focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                          >
                            <option value="both">Use Both (Global & Custom)</option>
                            <option value="global">Use Built-in Global Banlist Only</option>
                            <option value="custom">Use Custom Banlist Only</option>
                          </select>
                          <p className="text-[10px] text-zinc-400 font-serif leading-tight">Choose which database(s) this node should actively check against for bans.</p>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 3: SYSTEM ROLES & INTERFACES */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-zinc-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span>
                          <h4 className="text-xs font-black uppercase text-zinc-800 tracking-wider">Discord Channels & Roles</h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => selectedGuild && fetchDiscordDataForGuild(selectedGuild.id)}
                          disabled={isLoadingDiscordData}
                          className="flex items-center gap-1.5 font-mono text-[10px] text-indigo-600 hover:text-indigo-800 font-bold uppercase transition-all"
                        >
                          <RefreshCw className={`w-3 h-3 ${isLoadingDiscordData ? 'animate-spin' : ''}`} />
                          Sync Server Data
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <SearchableDiscordSelect
                          label="Audit Log Channel"
                          value={editingGuildSettings.logChannelId}
                          onChange={(val) => setEditingGuildSettings({ ...editingGuildSettings, logChannelId: val })}
                          options={guildChannels.map(c => ({ id: c.id, name: c.name, subtext: c.parentName ? `Category: ${c.parentName}` : undefined }))}
                          type="channel"
                          isLoading={isLoadingDiscordData}
                          error={discordDataError}
                          onRefresh={() => selectedGuild && fetchDiscordDataForGuild(selectedGuild.id)}
                          placeholder="Select audit log channel..."
                        />

                        <SearchableDiscordSelect
                          label="Staff Channel"
                          value={editingGuildSettings.staffChannelId}
                          onChange={(val) => setEditingGuildSettings({ ...editingGuildSettings, staffChannelId: val })}
                          options={guildChannels.map(c => ({ id: c.id, name: c.name, subtext: c.parentName ? `Category: ${c.parentName}` : undefined }))}
                          type="channel"
                          isLoading={isLoadingDiscordData}
                          error={discordDataError}
                          onRefresh={() => selectedGuild && fetchDiscordDataForGuild(selectedGuild.id)}
                          placeholder="Select staff channel..."
                        />

                        <SearchableDiscordSelect
                          label="Staff Role"
                          value={editingGuildSettings.staffRoleId}
                          onChange={(val) => setEditingGuildSettings({ ...editingGuildSettings, staffRoleId: val })}
                          options={guildRoles.map(r => ({ id: r.id, name: r.name, color: r.color }))}
                          type="role"
                          isLoading={isLoadingDiscordData}
                          error={discordDataError}
                          onRefresh={() => selectedGuild && fetchDiscordDataForGuild(selectedGuild.id)}
                          placeholder="Select staff role..."
                        />
                      </div>
                    </div>

                    {/* SECTION 4: AGED VERIFICATION SYSTEM */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 border-b border-zinc-100 pb-2">
                        <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
                        <h4 className="text-xs font-black uppercase text-zinc-800 tracking-wider">Server Verification & Age Role</h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-2">
                          <label className="block font-mono text-[10px] uppercase font-bold text-zinc-500">Enable Verification</label>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={editingGuildSettings.verificationEnabled}
                              onChange={(e) => setEditingGuildSettings({ ...editingGuildSettings, verificationEnabled: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                            <span className="ml-3 font-mono text-xs text-zinc-600 uppercase font-semibold">
                              {editingGuildSettings.verificationEnabled ? 'ENABLED' : 'DISABLED'}
                            </span>
                          </label>
                        </div>

                        <SearchableDiscordSelect
                          label="Verified Role"
                          value={editingGuildSettings.verificationRoleId}
                          onChange={(val) => setEditingGuildSettings({ ...editingGuildSettings, verificationRoleId: val })}
                          options={guildRoles.map(r => ({ id: r.id, name: r.name, color: r.color }))}
                          type="role"
                          isLoading={isLoadingDiscordData}
                          error={discordDataError}
                          onRefresh={() => selectedGuild && fetchDiscordDataForGuild(selectedGuild.id)}
                          placeholder="Select verified role..."
                        />

                        <div className="space-y-2">
                          <label className="block font-mono text-[10px] uppercase font-bold text-zinc-500">Enable Specific Age Role</label>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={editingGuildSettings.ageRoleEnabled}
                              onChange={(e) => setEditingGuildSettings({ ...editingGuildSettings, ageRoleEnabled: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                            <span className="ml-3 font-mono text-xs text-zinc-600 uppercase font-semibold">
                              {editingGuildSettings.ageRoleEnabled ? 'ENABLED' : 'DISABLED'}
                            </span>
                          </label>
                        </div>

                        <SearchableDiscordSelect
                          label="Age Role (18+)"
                          value={editingGuildSettings.ageRoleId}
                          onChange={(val) => setEditingGuildSettings({ ...editingGuildSettings, ageRoleId: val })}
                          options={guildRoles.map(r => ({ id: r.id, name: r.name, color: r.color }))}
                          type="role"
                          isLoading={isLoadingDiscordData}
                          error={discordDataError}
                          onRefresh={() => selectedGuild && fetchDiscordDataForGuild(selectedGuild.id)}
                          placeholder="Select 18+ age role..."
                        />

                        <div className="space-y-2">
                          <label className="block font-mono text-[10px] uppercase font-bold text-zinc-500">Disable /age-verify in this Server</label>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={editingGuildSettings.disableAgeVerifyCommand || false}
                              onChange={(e) => setEditingGuildSettings({ ...editingGuildSettings, disableAgeVerifyCommand: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                            <span className="ml-3 font-mono text-xs text-zinc-600 uppercase font-semibold">
                              {editingGuildSettings.disableAgeVerifyCommand ? 'DISABLED & UNSYNCED' : 'ACTIVE / ALLOWED'}
                            </span>
                          </label>
                          <p className="text-[10px] text-zinc-400 font-serif leading-tight">Blocks members in this server from using /age-verify and unsyncs command from server-specific bots.</p>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 5: CUSTOM DISCORD BOT SETTINGS */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 border-b border-zinc-100 pb-2">
                        <Bot className="w-4 h-4 text-indigo-600" />
                        <h4 className="text-xs font-black uppercase text-zinc-800 tracking-wider">Custom Discord Bot Token & Status (Optional)</h4>
                      </div>
                      
                      <p className="text-xs text-zinc-500 font-sans leading-relaxed">
                        Configure a personalized Discord Bot for this server. When enabled with a valid Bot Token, your server will run its own dedicated bot instance with custom presence & status, while keeping all features of the central bot.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <label className="block font-mono text-[10px] uppercase font-bold text-zinc-500">Enable Custom Bot</label>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={editingGuildSettings.customBotEnabled}
                              onChange={(e) => setEditingGuildSettings({ ...editingGuildSettings, customBotEnabled: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            <span className="ml-3 font-mono text-xs text-zinc-600 uppercase font-semibold">
                              {editingGuildSettings.customBotEnabled ? 'CUSTOM BOT ACTIVE' : 'DISABLED (MAIN BOT)'}
                            </span>
                          </label>
                          <p className="text-[10px] text-zinc-400 font-serif leading-tight">Toggle between your custom personalized bot and the system main bot.</p>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <label className="block font-mono text-[10px] uppercase font-bold text-zinc-500">Custom Bot Token</label>
                          <div className="relative">
                            <input 
                              type={showCustomBotToken ? "text" : "password"}
                              placeholder="Paste your custom Discord Bot Token here..." 
                              value={editingGuildSettings.customBotToken || ''}
                              onChange={(e) => setEditingGuildSettings({ ...editingGuildSettings, customBotToken: e.target.value })}
                              className="w-full bg-zinc-50 border-2 border-zinc-200 rounded-xl p-3 pr-10 font-mono text-xs focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => setShowCustomBotToken(!showCustomBotToken)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1"
                            >
                              {showCustomBotToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          <p className="text-[10px] text-zinc-400 font-serif leading-tight">
                            Obtain your token from the <a href="https://discord.com/developers/applications" target="_blank" rel="noreferrer" className="text-indigo-600 font-bold underline">Discord Developer Portal</a>. Ensure Privileged Gateway Intents (Server Members & Message Content) are enabled!
                          </p>
                        </div>

                        <div className="space-y-2">
                          <label className="block font-mono text-[10px] uppercase font-bold text-zinc-500">Bot Online Status</label>
                          <select 
                            value={editingGuildSettings.customBotStatus || 'online'}
                            onChange={(e) => setEditingGuildSettings({ ...editingGuildSettings, customBotStatus: e.target.value })}
                            className="w-full bg-zinc-50 border-2 border-zinc-200 rounded-xl p-3 font-mono text-xs focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                          >
                            <option value="online">🟢 Online</option>
                            <option value="idle">🌙 Idle / Away</option>
                            <option value="dnd">⛔ Do Not Disturb</option>
                            <option value="invisible">⚪ Invisible / Offline</option>
                          </select>
                          <p className="text-[10px] text-zinc-400 font-serif leading-tight">Presence status indicator shown on your bot profile.</p>
                        </div>

                        <div className="space-y-2">
                          <label className="block font-mono text-[10px] uppercase font-bold text-zinc-500">Activity Type</label>
                          <select 
                            value={editingGuildSettings.customBotActivityType || 'PLAYING'}
                            onChange={(e) => setEditingGuildSettings({ ...editingGuildSettings, customBotActivityType: e.target.value })}
                            className="w-full bg-zinc-50 border-2 border-zinc-200 rounded-xl p-3 font-mono text-xs focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                          >
                            <option value="PLAYING">Playing</option>
                            <option value="STREAMING">Streaming</option>
                            <option value="LISTENING">Listening to</option>
                            <option value="WATCHING">Watching</option>
                            <option value="COMPETING">Competing in</option>
                            <option value="CUSTOM">Custom Status</option>
                          </select>
                          <p className="text-[10px] text-zinc-400 font-serif leading-tight">Activity label shown under the bot's username.</p>
                        </div>

                        <div className="space-y-2">
                          <label className="block font-mono text-[10px] uppercase font-bold text-zinc-500">Custom Activity Message</label>
                          <input 
                            type="text"
                            placeholder="e.g. Protecting MyServer Node" 
                            value={editingGuildSettings.customBotActivityText || ''}
                            onChange={(e) => setEditingGuildSettings({ ...editingGuildSettings, customBotActivityText: e.target.value })}
                            className="w-full bg-zinc-50 border-2 border-zinc-200 rounded-xl p-3 font-mono text-xs focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                          />
                          <p className="text-[10px] text-zinc-400 font-serif leading-tight">Text message displayed for the custom status activity.</p>
                        </div>
                      </div>
                    </div>

                    {/* SECTION: BESAFE PROTECTED NETWORK PUBLIC DIRECTORY LISTING */}
                    <div className="pt-6 border-t border-zinc-200 space-y-5">
                      <div className="flex items-center justify-between border-b border-zinc-100 pb-3 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <Globe className="w-5 h-5 text-blue-600" />
                          <h4 className="text-sm font-black uppercase text-zinc-900 tracking-wider font-mono">
                            Public Protected Communities Directory Listing
                          </h4>
                        </div>
                        <span className={`px-2.5 py-1 font-mono text-[10px] font-bold rounded-lg uppercase border ${
                          editingGuildSettings.publicListing?.isListed
                            ? 'bg-blue-50 border-blue-200 text-blue-700'
                            : 'bg-zinc-100 border-zinc-200 text-zinc-500'
                        }`}>
                          {editingGuildSettings.publicListing?.isListed ? '🌐 Listed on Public Network' : '🔒 Unlisted (Private)'}
                        </span>
                      </div>

                      <p className="text-xs text-zinc-500 font-sans leading-relaxed">
                        Feature this Discord server in the public <strong className="text-zinc-800 dark:text-zinc-200">BeSafe Protected Communities Directory</strong>. 
                        Server owners can toggle this listing on or off at any time. Show the world that your community is protected by real-time automated safety and global ban synchronization.
                      </p>

                      {editingGuildSettings.vrchatGroupId && (
                        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 p-3.5 rounded-xl flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow">VR</div>
                          <div className="text-xs space-y-0.5">
                            <p className="font-bold text-emerald-900 dark:text-emerald-200">
                              Linked VRChat Group: <span className="font-mono bg-white dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-700">{editingGuildSettings.vrchatGroupId}</span>
                            </p>
                            <p className="text-emerald-700 dark:text-emerald-400 text-[11px]">
                              When public listing is enabled, your community will automatically appear in <strong>both Discord and VRChat Communities</strong> directories with bi-directional links.
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <label className="block font-mono text-xs uppercase font-bold text-zinc-800">
                              Public Directory Listing Toggle
                            </label>
                            <p className="text-[11px] text-zinc-500 font-sans">
                              When enabled, your server name, invite link, and defense badges appear at <code className="bg-white px-1 py-0.5 rounded border border-zinc-200 font-mono text-[10px]">/communities</code>.
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean(editingGuildSettings.publicListing?.isListed)}
                              onChange={(e) => {
                                const currentListing = editingGuildSettings.publicListing || {};
                                setEditingGuildSettings({
                                  ...editingGuildSettings,
                                  publicListing: {
                                    ...currentListing,
                                    isListed: e.target.checked,
                                    category: currentListing.category || 'Gaming & Cyber Defense',
                                    inviteUrl: currentListing.inviteUrl || '',
                                    description: currentListing.description || ''
                                  }
                                });
                              }}
                              className="sr-only peer"
                            />
                            <div className="w-14 h-7 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[4px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                            <span className="ml-3 font-mono text-xs font-black uppercase text-zinc-900 w-24">
                              {editingGuildSettings.publicListing?.isListed ? (
                                <span className="text-blue-600">PUBLIC</span>
                              ) : (
                                <span className="text-zinc-500">PRIVATE</span>
                              )}
                            </span>
                          </label>
                        </div>

                        {editingGuildSettings.publicListing?.isListed && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-zinc-200">
                            <div className="space-y-1.5">
                              <label className="block font-mono text-[10px] uppercase font-bold text-zinc-500">
                                Community Category
                              </label>
                              <select
                                value={editingGuildSettings.publicListing?.category || 'Gaming & Cyber Defense'}
                                onChange={(e) => {
                                  const currentListing = editingGuildSettings.publicListing || {};
                                  setEditingGuildSettings({
                                    ...editingGuildSettings,
                                    publicListing: {
                                      ...currentListing,
                                      category: e.target.value
                                    }
                                  });
                                }}
                                className="w-full bg-white border border-zinc-300 rounded-xl p-2.5 font-mono text-xs focus:outline-none focus:border-blue-500"
                              >
                                <option value="Gaming & Cyber Defense">Gaming & Cyber Defense</option>
                                <option value="VR & 3D Design">VR & 3D Design</option>
                                <option value="Metaverse & Social">Metaverse & Social</option>
                                <option value="Tech & Developer Community">Tech & Developer Community</option>
                                <option value="Anime, Art & Creative">Anime, Art & Creative</option>
                                <option value="Esports & Competition">Esports & Competition</option>
                                <option value="General Community">General Community</option>
                              </select>
                            </div>

                            <div className="space-y-1.5">
                              <label className="block font-mono text-[10px] uppercase font-bold text-zinc-500">
                                Public Invite URL (Discord)
                              </label>
                              <input
                                type="text"
                                placeholder="https://discord.gg/your-invite"
                                value={editingGuildSettings.publicListing?.inviteUrl || ''}
                                onChange={(e) => {
                                  const currentListing = editingGuildSettings.publicListing || {};
                                  setEditingGuildSettings({
                                    ...editingGuildSettings,
                                    publicListing: {
                                      ...currentListing,
                                      inviteUrl: e.target.value
                                    }
                                  });
                                }}
                                className="w-full bg-white border border-zinc-300 rounded-xl p-2.5 font-mono text-xs focus:outline-none focus:border-blue-500"
                              />
                            </div>

                            <div className="space-y-1.5 md:col-span-2">
                              <label className="block font-mono text-[10px] uppercase font-bold text-zinc-500">
                                Public Community Description
                              </label>
                              <textarea
                                rows={2}
                                placeholder="Brief description of your community, rules, and focus..."
                                value={editingGuildSettings.publicListing?.description || ''}
                                onChange={(e) => {
                                  const currentListing = editingGuildSettings.publicListing || {};
                                  setEditingGuildSettings({
                                    ...editingGuildSettings,
                                    publicListing: {
                                      ...currentListing,
                                      description: e.target.value
                                    }
                                  });
                                }}
                                className="w-full bg-white border border-zinc-300 rounded-xl p-2.5 font-sans text-xs focus:outline-none focus:border-blue-500 resize-none"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* SECTION 6: DISCORD SERVER BACKUP & ANTI-RAID ROLLBACK */}
                    <div className="pt-6 border-t border-zinc-200 space-y-6">
                      <div className="flex items-center justify-between border-b border-zinc-100 pb-3 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <Shield className="w-5 h-5 text-indigo-600" />
                          <h4 className="text-sm font-black uppercase text-zinc-900 tracking-wider font-mono">
                            Anti-Raid Server Backup & Snapshot Restore
                          </h4>
                        </div>
                        <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono text-[10px] font-bold rounded-lg uppercase">
                          {guildBackups.length} Saved Snapshot{guildBackups.length === 1 ? '' : 's'}
                        </span>
                      </div>

                      <p className="text-xs text-zinc-500 font-sans leading-relaxed">
                        Continuously back up your Discord server structure (Roles, Categories, Channels, Permission Overwrites, Server Settings, and Ban Lists). If your server is raided, compromised, or accidentally modified, perform a 1-click rollback to restore everything to its exact snapshot state.
                      </p>

                      {/* Status alert message */}
                      {backupStatusMsg && (
                        <div className={`p-4 rounded-xl text-xs font-mono border ${
                          backupStatusMsg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
                        }`}>
                          {backupStatusMsg.text}
                        </div>
                      )}

                      {/* Create Snapshot Form & Upload */}
                      <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 space-y-4">
                        <h5 className="text-xs font-bold font-mono text-zinc-800 uppercase tracking-wider flex items-center gap-2">
                          <Database className="w-4 h-4 text-indigo-600" /> Take Instant Server Snapshot or Restore from Backup File
                        </h5>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <input
                            type="text"
                            placeholder="Snapshot label/description (e.g., Pre-Event Full Backup)"
                            value={backupNameInput}
                            onChange={(e) => setBackupNameInput(e.target.value)}
                            className="flex-1 bg-white border border-zinc-300 rounded-xl p-3 text-xs font-mono focus:outline-none focus:border-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={handleCreateGuildBackup}
                            disabled={isCreatingBackup || isUploadingBackup}
                            className="px-5 py-3 bg-[#141414] hover:bg-zinc-800 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {isCreatingBackup ? (
                              <>
                                <span className="animate-spin text-sm">🌀</span> Backing up...
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4" /> Save Server Backup
                              </>
                            )}
                          </button>
                          <label className={`cursor-pointer px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 ${isUploadingBackup || isCreatingBackup ? 'opacity-50 pointer-events-none' : ''}`}>
                            <Upload className="w-4 h-4" />
                            {isUploadingBackup ? 'Uploading...' : 'Upload Backup JSON'}
                            <input
                              type="file"
                              accept=".json,application/json"
                              disabled={isUploadingBackup || isCreatingBackup}
                              onChange={handleUploadGuildBackup}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>

                      {/* Existing Backups List */}
                      <div className="space-y-3">
                        <h5 className="text-xs font-bold font-mono text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                          Saved Snapshot Archives
                        </h5>

                        {isLoadingBackups ? (
                          <div className="p-8 border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 text-center font-mono text-xs text-zinc-500 dark:text-zinc-400">
                            Loading saved server backups...
                          </div>
                        ) : guildBackups.length === 0 ? (
                          <div className="p-8 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl bg-zinc-100/80 dark:bg-zinc-900/80 text-center space-y-2 font-mono shadow-inner">
                            <FolderCheck className="w-8 h-8 text-zinc-400 dark:text-zinc-500 mx-auto" />
                            <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wide">No Backups Saved Yet</p>
                            <p className="text-[11px] text-zinc-600 dark:text-zinc-400">Click "Save Server Backup" above, upload a downloaded backup JSON, or run <code className="bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-1.5 py-0.5 rounded border border-zinc-300 dark:border-zinc-700 font-bold">/backup create</code> in Discord.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {guildBackups.map((backup: any) => (
                              <div
                                key={backup._id}
                                className="p-5 bg-white dark:bg-zinc-900 border-2 border-[#141414] dark:border-zinc-700 rounded-2xl shadow-[-4px_4px_0px_0px_rgba(20,20,20,1)] dark:shadow-[-4px_4px_0px_0px_rgba(255,255,255,0.05)] space-y-3"
                              >
                                <div className="flex justify-between items-start flex-wrap gap-2">
                                  <div>
                                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 rounded uppercase">
                                      ID: {backup._id}
                                    </span>
                                    <h6 className="font-bold font-mono text-sm text-zinc-900 dark:text-white mt-1">{backup.name}</h6>
                                    <p className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
                                      Created by <span className="text-zinc-700 dark:text-zinc-200 font-bold">{backup.creatorTag || backup.creatorId}</span> on {new Date(backup.createdAt).toLocaleString()}
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-2 flex-wrap">
                                    <button
                                      type="button"
                                      onClick={() => handleDownloadGuildBackup(backup._id || backup.id, backup.name)}
                                      className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-mono text-[10px] font-bold uppercase rounded-xl border border-zinc-300 dark:border-zinc-600 transition-all flex items-center gap-1.5 cursor-pointer"
                                    >
                                      <Download className="w-3.5 h-3.5" /> Download JSON
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteGuildBackup(backup._id || backup.id)}
                                      className="px-3 py-2 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-mono text-[10px] font-bold uppercase rounded-xl border border-rose-200 dark:border-rose-800 transition-all flex items-center gap-1.5 cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" /> Delete
                                    </button>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 font-mono text-[11px]">
                                  <div className="bg-zinc-50 dark:bg-zinc-800/60 p-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-700">
                                    <span className="text-[9px] uppercase font-bold text-zinc-500 dark:text-zinc-400 block">Roles</span>
                                    <span className="font-bold text-zinc-800 dark:text-zinc-100">{backup.roles?.length || 0}</span>
                                  </div>
                                  <div className="bg-zinc-50 dark:bg-zinc-800/60 p-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-700">
                                    <span className="text-[9px] uppercase font-bold text-zinc-500 dark:text-zinc-400 block">Categories</span>
                                    <span className="font-bold text-zinc-800 dark:text-zinc-100">{backup.categories?.length || 0}</span>
                                  </div>
                                  <div className="bg-zinc-50 dark:bg-zinc-800/60 p-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-700">
                                    <span className="text-[9px] uppercase font-bold text-zinc-500 dark:text-zinc-400 block">Channels</span>
                                    <span className="font-bold text-zinc-800 dark:text-zinc-100">{backup.channels?.length || 0}</span>
                                  </div>
                                  <div className="bg-zinc-50 dark:bg-zinc-800/60 p-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-700">
                                    <span className="text-[9px] uppercase font-bold text-zinc-500 dark:text-zinc-400 block">Saved Bans</span>
                                    <span className="font-bold text-zinc-800 dark:text-zinc-100">{backup.bans?.length || 0}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {showDeleteConfirm ? (
                      <div className="pt-6 border-t-2 border-rose-500 bg-rose-50/50 p-6 rounded-2xl space-y-4 font-sans">
                        <div className="flex items-center gap-2 text-rose-800">
                          <Trash2 className="w-5 h-5 text-rose-600 animate-pulse" />
                          <h4 className="font-mono text-xs uppercase font-bold tracking-wider">⚠️ Irreversible Deletion Action</h4>
                        </div>
                        <p className="text-xs text-rose-700 leading-relaxed">
                          Are you absolutely sure you want to delete <strong className="font-bold">{selectedGuild?.name || 'this server'}</strong>?
                          This will permanently delete this node registration, configuration settings, and all VRChat/Discord webhook integration logs from the centralized ledger.
                        </p>
                        <div className="flex gap-4">
                          <button
                            type="button"
                            onClick={handleDeleteGuild}
                            disabled={isDeletingGuild}
                            className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                          >
                            {isDeletingGuild ? 'Deleting Node records...' : 'Yes, Delete Permanently'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(false)}
                            className="bg-zinc-200 hover:bg-zinc-300 text-zinc-800 px-5 py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-6 border-t border-zinc-100 flex flex-wrap gap-4">
                        <button 
                          type="submit" 
                          disabled={isSavingGuildSettings}
                          className="flex-1 min-w-[200px] bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-xl font-mono font-bold uppercase text-xs tracking-wider transition-all disabled:opacity-50"
                        >
                          {isSavingGuildSettings ? 'Committing payload...' : 'Commit Node Settings'}
                        </button>
                        <button 
                          type="button" 
                          onClick={() => {
                            setSelectedGuild(null);
                            setEditingGuildSettings(null);
                            setShowDeleteConfirm(false);
                          }}
                          className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 p-4 rounded-xl font-mono font-bold uppercase text-xs tracking-wider transition-all"
                        >
                          Discard
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setShowDeleteConfirm(true)}
                          className="border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 p-4 rounded-xl font-mono font-bold uppercase text-xs tracking-wider transition-all flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" /> Delete Node
                        </button>
                      </div>
                    )}
                  </form>
                </div>
              ) : (
                <>
                  <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-sm">
                    <p className="text-xs text-zinc-500 font-mono leading-relaxed max-w-2xl">
                      The BeSafe Network operates as a decentralized ledger of global restrictions. 
                      Below are the servers active as reporting nodes. Whenever a global ban is triggered, 
                      all nodes update their automated ban entries simultaneously.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {guilds.map((g: any) => (
                      <div key={g.id} className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-lg uppercase shrink-0">
                              {g.name ? g.name[0] : 'S'}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-black text-[#141414] text-sm truncate tracking-tight">{g.name || 'Private Server Node'}</h4>
                              <span className="font-mono text-[10px] text-zinc-400 block mt-0.5 truncate">ID: {g.id}</span>
                            </div>
                          </div>
                          <span className="px-2 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono text-[10px] font-bold uppercase shrink-0 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Shard #{g.shardId ?? 0}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-zinc-50 space-y-2 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-tight">Sync Auto-Ban</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${g.settings?.autoBanEnabled ? 'bg-green-100 text-green-800' : 'bg-zinc-100 text-zinc-800'}`}>
                              {g.settings?.autoBanEnabled ? 'ACTIVE (BAN SYNC)' : 'INACTIVE'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-tight">Auto-Unban Toggles</span>
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded text-[10px] font-bold font-mono">
                              Discord: {g.settings?.autoUnbanDiscordEnabled !== false ? 'ON' : 'OFF'} | VRC: {g.settings?.autoUnbanVRChatEnabled !== false ? 'ON' : 'OFF'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-tight">Bot Engine</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${g.settings?.customBotEnabled && g.settings?.customBotToken ? 'bg-indigo-100 text-indigo-800' : 'bg-zinc-100 text-zinc-800'}`}>
                              {g.settings?.customBotEnabled && g.settings?.customBotToken ? 'CUSTOM BOT' : `MAIN BOT (SHARD #${g.shardId ?? 0})`}
                            </span>
                          </div>
                          <div className="flex justify-between items-center gap-2">
                            <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-tight shrink-0">Live Status</span>
                            <span className="px-2 py-0.5 bg-zinc-100 text-zinc-700 rounded text-[10px] font-mono truncate max-w-[210px]" title={g.settings?.customBotEnabled && g.settings?.customBotToken ? (g.settings?.customBotActivityText || 'Keeping you safe with love ❤️') : 'Keeping you safe with love ❤️'}>
                              {g.settings?.customBotEnabled && g.settings?.customBotToken
                                ? (g.settings?.customBotActivityText || 'Keeping you safe with love ❤️')
                                : 'Keeping you safe with love ❤️'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-tight">VRChat Integration</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${g.settings?.vrchatBotEnabled ? 'bg-indigo-100 text-indigo-800 font-bold' : 'bg-zinc-100 text-zinc-850'}`}>
                              {g.settings?.vrchatBotEnabled ? `ACTIVE (${g.settings.vrchatGroupId || 'No ID'})` : 'INACTIVE'}
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-zinc-50">
                          <button
                            onClick={() => {
                              setSelectedGuild(g);
                              fetchGuildBackups(g.id);
                              fetchDiscordDataForGuild(g.id);
                              setEditingGuildSettings({
                                autoBanThreshold: g.settings?.autoBanThreshold ?? -10,
                                warningThreshold: g.settings?.warningThreshold ?? 3,
                                tempBanDuration: g.settings?.tempBanDuration ?? 7,
                                logChannelId: g.settings?.logChannelId ?? '',
                                autoBanEnabled: g.settings?.autoBanEnabled ?? false,
                                autoUnbanDiscordEnabled: g.settings?.autoUnbanDiscordEnabled ?? true,
                                autoUnbanVRChatEnabled: g.settings?.autoUnbanVRChatEnabled ?? true,
                                staffRoleId: g.settings?.staffRoleId ?? '',
                                staffChannelId: g.settings?.staffChannelId ?? '',
                                verificationEnabled: g.settings?.verificationEnabled ?? false,
                                verificationRoleId: g.settings?.verificationRoleId ?? '',
                                ageRoleEnabled: g.settings?.ageRoleEnabled ?? false,
                                ageRoleId: g.settings?.ageRoleId ?? '',
                                autoAssignAgeRole: g.settings?.autoAssignAgeRole ?? false,
                                disableAgeVerifyCommand: g.settings?.disableAgeVerifyCommand ?? false,
                                vrchatBotEnabled: g.settings?.vrchatBotEnabled ?? false,
                                vrchatGroupId: g.settings?.vrchatGroupId ?? '',
                                vrchatAutoBanEnabled: g.settings?.vrchatAutoBanEnabled ?? true,
                                customBanlistId: g.settings?.customBanlistId ?? '',
                                banlistSelectionMode: g.settings?.banlistSelectionMode ?? 'global',
                                customBotEnabled: g.settings?.customBotEnabled ?? false,
                                customBotToken: g.settings?.customBotToken ?? '',
                                customBotStatus: g.settings?.customBotStatus ?? 'online',
                                customBotActivityType: g.settings?.customBotActivityType ?? 'PLAYING',
                                customBotActivityText: g.settings?.customBotActivityText ?? '',
                                publicListing: g.publicListing || { isListed: false, category: 'Gaming & Cyber Defense', inviteUrl: '', description: '' },
                              });
                            }}
                            className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold font-mono text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                          >
                            <Settings className="w-3.5 h-3.5" /> Configure Group Settings
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {guilds.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-2xl border border-zinc-200/80 opacity-50 italic text-xs">No active global nodes connected.</div>
                  )}
                </>
              )}
            </div>
          )}

          {/* VIEW: VERIFICATIONS */}
          {(role === 'admin' || role === 'moderator') && view === 'verifications' && (
            <div className="space-y-6">
              {/* STATUS BANNER FOR /age-verify COMMAND */}
              <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${disableAgeVerifyCommand ? 'bg-amber-50/80 border-amber-200 text-amber-900' : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${disableAgeVerifyCommand ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                  <div>
                    <span className="font-mono text-xs font-black uppercase tracking-wider block">
                      Discord `/age-verify` Slash Command: {disableAgeVerifyCommand ? 'DISABLED & UNSYNCED' : 'ACTIVE & SYNCED'}
                    </span>
                    <p className="text-[11px] opacity-80 mt-0.5">
                      {disableAgeVerifyCommand 
                        ? 'The `/age-verify` command is unregistered from Discord. New submissions via Discord slash command are paused.'
                        : 'The `/age-verify` command is registered and actively taking photo ID submissions from Discord members.'}
                    </p>
                  </div>
                </div>
                {role === 'admin' && (
                  <button
                    onClick={() => handleSyncDiscordCommands(!disableAgeVerifyCommand)}
                    disabled={isSyncingDiscordCommands}
                    className={`px-4 py-2 rounded-xl font-mono text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap shadow-sm ${
                      disableAgeVerifyCommand
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-rose-600 hover:bg-rose-700 text-white'
                    }`}
                  >
                    {isSyncingDiscordCommands ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                    {disableAgeVerifyCommand ? 'Enable & Sync Command' : 'Disable & Unsync Command'}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {verifications.map((v: any) => (
                  <div key={v._id} className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-[#141414] text-sm">Snowflake: {v.userId}</h4>
                        <span className="font-mono text-[9px] text-zinc-400 block mt-0.5">Submitted: {new Date(v.createdAt).toLocaleDateString()}</span>
                      </div>
                      <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 font-mono text-[9px] rounded-full uppercase tracking-wider font-bold">Aged Verification</span>
                    </div>

                    <button 
                      onClick={() => setSelectedVerification(v)}
                      className="w-full py-2 bg-zinc-50 hover:bg-zinc-100 hover:text-zinc-900 border border-zinc-200 text-zinc-600 rounded-xl font-bold font-mono text-[10px] uppercase tracking-wider transition-all"
                    >
                      Audit Documents & Verify
                    </button>
                  </div>
                ))}
              </div>
              {verifications.length === 0 && (
                <div className="text-center py-20 bg-white rounded-2xl border border-zinc-200/80 opacity-50 italic text-xs animate-none">No aged verification requests currently in ledger.</div>
              )}
            </div>
          )}

          {/* VIEW: DEVELOPER API */}
          {role === 'admin' && view === 'developers' && (
            <div className="space-y-8">
              {/* KEY REQUESTS */}
              <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 space-y-4 shadow-sm">
                <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
                  <h3 className="font-black text-sm uppercase tracking-wider text-zinc-800 flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-emerald-500" /> Pending API Token Requests
                  </h3>
                  <span className="bg-amber-100 text-amber-800 font-mono text-[10px] px-2 py-0.5 rounded-full font-bold">{apiKeyRequests.length}</span>
                </div>

                <div className="divide-y divide-zinc-50">
                  {apiKeyRequests.map((req: any) => (
                    <div key={req._id} className="py-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-sm tracking-tight">{req.botName || req.applicationName || 'Unknown Platform'}</p>
                          <span className="font-mono text-[9px] text-zinc-400 block mt-0.5">Applicant: {req.botId || req.discordId} | Email: {req.developerEmail || req.contactEmail}</span>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleActionApiKeyRequest(req._id, 'approved')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-md"
                          >
                            Approve Key
                          </button>
                          <button 
                            onClick={() => handleActionApiKeyRequest(req._id, 'rejected')}
                            className="bg-rose-50 text-rose-600 hover:bg-rose-100 font-mono text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-md"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-600 bg-zinc-50 p-3 rounded-lg border border-zinc-100 font-serif italic">"{req.purpose || req.reason || 'No description provided.'}"</p>
                    </div>
                  ))}
                  {apiKeyRequests.length === 0 && (
                    <div className="text-center py-8 opacity-40 italic text-xs font-mono">No requests under consideration.</div>
                  )}
                </div>
              </div>

              {/* ACTIVE TOKENS */}
              <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-sm space-y-4">
                <h3 className="font-black text-sm uppercase tracking-wider text-neutral-800 flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-indigo-500" /> Active API Keys
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse font-mono">
                    <thead>
                      <tr className="border-b border-zinc-100 text-[10px] text-zinc-400 uppercase tracking-wider">
                        <th className="py-3 px-4">Application</th>
                        <th className="py-3 px-4">Key Token</th>
                        <th className="py-3 px-4">Owner Snowflake</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50 font-mono">
                      {activeApiKeys.map((k: any) => (
                        <tr key={k._id} className="hover:bg-zinc-50/50">
                          <td className="py-3 px-4 font-bold text-zinc-800">{k.botName || k.applicationName || 'Unknown Platform'}</td>
                          <td className="py-3 px-4 text-zinc-400 select-all font-mono">{(k.key || '').slice(0, 16)}••••••••</td>
                          <td className="py-3 px-4 text-zinc-500 font-mono">{k.botId || k.discordId}</td>
                          <td className="py-3 px-4">
                            <span className="bg-emerald-50 text-emerald-700 text-[9px] px-2 py-0.5 rounded font-bold uppercase">Provisioned</span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button 
                              type="button"
                              onClick={() => {
                                setRevokingKey({
                                  id: k._id,
                                  botName: k.botName || k.applicationName || 'Registered Bot',
                                  botId: k.botId || k.discordId || 'N/A',
                                  key: k.key || ''
                                });
                                setRevocationReasonInput('Violation of platform API terms / Key decommissioned');
                              }}
                              className="px-3 py-1 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 hover:border-red-600 rounded text-[10px] font-mono font-bold uppercase transition-all shadow-xs cursor-pointer"
                            >
                              Revoke Key
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {activeApiKeys.length === 0 && (
                    <div className="text-center py-10 opacity-40 italic text-xs font-mono">No active API keys found.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* VIEW: CUSTOM BANLISTS */}
          {view === 'banlists' && (
            <div className="space-y-8">
              {/* HEADER / EXPLANATION */}
              <div className="bg-white border-2 border-[#141414] p-6 shadow-[-4px_4px_0px_0px_rgba(20,20,20,1)] space-y-2">
                <h2 className="text-lg font-black uppercase text-zinc-900 font-mono tracking-wider">Custom Banlist Ledger Management</h2>
                <p className="text-xs text-zinc-600 leading-relaxed font-mono">
                  Create and manage private list definitions for your Discord and VRChat guilds. You can copy a list's <span className="font-bold text-indigo-600">ID</span> and paste it in your Node settings to link and actively moderate them. Trusted users cannot be blacklisted.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* CREATE NEW BANLIST FORM */}
                <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 space-y-4 shadow-sm h-fit">
                  <div className="border-b border-zinc-100 pb-3 flex items-center gap-2">
                    <PlusCircle className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-black text-sm uppercase tracking-wider text-zinc-800">Create Banlist</h3>
                  </div>
                  <form onSubmit={handleCreateBanlist} className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-mono font-black uppercase opacity-65">Banlist Name</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Server A Blacklist"
                        value={newBanlistName}
                        onChange={(e) => setNewBanlistName(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-3.5 text-xs font-mono focus:outline-none focus:border-indigo-500 focus:bg-white"
                      />
                    </div>
                    {banlistErrorMessage && (
                      <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs font-mono">
                        {banlistErrorMessage}
                      </div>
                    )}
                    <button 
                      type="submit" 
                      disabled={isCreatingBanlist}
                      className="w-full py-3 bg-[#141414] text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-zinc-800 shadow-sm disabled:opacity-50"
                    >
                      {isCreatingBanlist ? 'Creating...' : 'Create list'}
                    </button>
                  </form>
                </div>

                {/* LIST OF BANLISTS */}
                <div className="lg:col-span-2 space-y-6">
                  {customBanlists.map((list) => (
                    <div key={list._id} className="bg-white rounded-2xl border-2 border-[#141414] p-6 shadow-[-4px_4px_0px_0px_rgba(20,20,20,1)] space-y-4">
                      <div className="flex justify-between items-start border-b border-zinc-100 pb-3 flex-wrap gap-2">
                        <div>
                          <h4 className="font-black text-base text-zinc-900 uppercase font-mono tracking-wider">{list.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-mono text-zinc-400">ID: {list._id}</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(list._id);
                                alert('Copied ID to clipboard!');
                              }}
                              className="text-[10px] text-indigo-600 hover:underline font-mono font-bold"
                            >
                              [Copy ID]
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteBanlist(list._id)}
                          className="px-3 py-1 text-[10px] font-mono uppercase bg-red-50 text-red-600 hover:bg-red-100 rounded font-bold"
                        >
                          Delete List
                        </button>
                      </div>

                      {/* ADD ENTRY FORM FOR THIS BANLIST */}
                      {selectedBanlistForAdding === list._id ? (
                        <form onSubmit={(e) => handleAddBanlistEntry(e, list._id)} className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-3 font-mono">
                          <div className="flex justify-between items-center border-b border-zinc-200 pb-2">
                            <span className="text-[10px] font-black uppercase text-zinc-700">Add Entry to {list.name}</span>
                            <button
                              type="button"
                              onClick={() => setSelectedBanlistForAdding(null)}
                              className="text-[10px] text-zinc-400 hover:text-zinc-600 uppercase font-bold"
                            >
                              Cancel
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="block text-[9px] uppercase font-bold text-zinc-500">Platform Type</label>
                              <select
                                value={newEntryType}
                                onChange={(e) => setNewEntryType(e.target.value as 'discord' | 'vrchat')}
                                className="w-full bg-white border border-zinc-300 rounded-lg p-2 text-xs"
                              >
                                <option value="discord">Discord User ID</option>
                                <option value="vrchat">VRChat User ID (usr_...)</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="block text-[9px] uppercase font-bold text-zinc-500">Target ID</label>
                              <input
                                type="text"
                                required
                                placeholder={newEntryType === 'discord' ? 'e.g. 1234567890' : 'e.g. usr_1234... or paste link'}
                                value={newEntryTargetId}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setNewEntryTargetId(newEntryType === 'vrchat' || val.includes('vrchat.com') || val.includes('usr_') ? extractVRChatUserId(val) : val);
                                }}
                                className="w-full bg-white border border-zinc-300 rounded-lg p-2 text-xs font-mono"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[9px] uppercase font-bold text-zinc-500">Reason</label>
                            <input
                              type="text"
                              placeholder="e.g. Malicious behavior / Harassment"
                              value={newEntryReason}
                              onChange={(e) => setNewEntryReason(e.target.value)}
                              className="w-full bg-white border border-zinc-300 rounded-lg p-2 text-xs"
                            />
                          </div>
                          {banlistErrorMessage && (
                            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs font-mono">
                              {banlistErrorMessage}
                            </div>
                          )}
                          <button
                            type="submit"
                            disabled={isAddingEntry}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg disabled:opacity-50"
                          >
                            {isAddingEntry ? 'Adding entry...' : 'Confirm and Add'}
                          </button>
                        </form>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedBanlistForAdding(list._id);
                            setNewEntryTargetId('');
                            setNewEntryReason('');
                            setBanlistErrorMessage('');
                          }}
                          className="w-full py-2 border-2 border-dashed border-zinc-300 hover:border-zinc-500 text-zinc-500 hover:text-zinc-700 rounded-xl font-mono text-[11px] uppercase font-bold tracking-wider transition-all"
                        >
                          + Add New Entry Target to List
                        </button>
                      )}

                      {/* LIST ENTRIES */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse font-mono">
                          <thead>
                            <tr className="border-b border-zinc-100 text-[9px] text-zinc-400 uppercase tracking-wider">
                              <th className="py-2 px-3">Type</th>
                              <th className="py-2 px-3">Target ID</th>
                              <th className="py-2 px-3">Reason</th>
                              <th className="py-2 px-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-50 font-mono">
                            {list.entries?.map((entry: any) => (
                              <tr key={entry._id} className="hover:bg-zinc-50/50">
                                <td className="py-2.5 px-3">
                                  <span className={`text-[8px] px-2 py-0.5 rounded font-bold uppercase ${entry.type === 'discord' ? 'bg-indigo-50 text-indigo-700' : 'bg-purple-50 text-purple-700'}`}>
                                    {entry.type}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 select-all truncate max-w-[150px]">{entry.targetId}</td>
                                <td className="py-2.5 px-3 text-zinc-500">{entry.reason || 'No reason'}</td>
                                <td className="py-2.5 px-3 text-right">
                                  <button
                                    onClick={() => handleDeleteBanlistEntry(list._id, entry._id)}
                                    className="text-red-500 hover:text-red-700 font-bold"
                                  >
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {(!list.entries || list.entries.length === 0) && (
                          <div className="text-center py-6 text-zinc-400 text-xs font-mono">No entries blacklisted on this list.</div>
                        )}
                      </div>
                    </div>
                  ))}

                  {customBanlists.length === 0 && (
                    <div className="text-center py-12 bg-white border border-dashed border-zinc-200 rounded-2xl opacity-55 text-xs font-mono">
                      No custom banlists have been created yet. Create one on the left panel!
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* VIEW: SYSTEM SETTINGS */}
          {role === 'admin' && view === 'settings' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* SMTP MAIL SERVER & NOTIFICATION CONFIG */}
              <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 space-y-5 shadow-sm lg:col-span-1 h-fit">
                <div className="border-b border-zinc-100 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-indigo-500" />
                    <h3 className="font-black text-sm uppercase tracking-wider text-zinc-800">Mail & Notification Settings</h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded font-mono text-[9px] uppercase font-bold ${
                    smtpHost.trim() ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {smtpHost.trim() ? 'Configured' : 'Unconfigured'}
                  </span>
                </div>

                <p className="text-xs text-zinc-500 leading-relaxed font-mono">
                  Configure your outgoing SMTP mail server and global notification recipient directly in the database. All account verification, ban notices, appeals, and alert emails use these settings.
                </p>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] font-mono font-black uppercase opacity-65 mb-1">SMTP Host</label>
                    <input 
                      type="text" 
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      placeholder="mail.creatorplaza.nl"
                      className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-3 text-xs font-mono focus:outline-none focus:border-indigo-500 focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono font-black uppercase opacity-65 mb-1">SMTP Port</label>
                      <input 
                        type="number" 
                        value={smtpPort}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSmtpPort(val);
                          if (Number(val) === 465) setSmtpSecure(true);
                          if (Number(val) === 587) setSmtpSecure(false);
                        }}
                        placeholder="587"
                        className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-3 text-xs font-mono focus:outline-none focus:border-indigo-500 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-black uppercase opacity-65 mb-1">Encryption Mode</label>
                      <select
                        value={smtpSecure ? 'ssl' : 'starttls'}
                        onChange={(e) => {
                          const isSsl = e.target.value === 'ssl';
                          setSmtpSecure(isSsl);
                          if (isSsl && Number(smtpPort) === 587) setSmtpPort(465);
                          if (!isSsl && Number(smtpPort) === 465) setSmtpPort(587);
                        }}
                        className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-3 text-xs font-mono focus:outline-none focus:border-indigo-500 focus:bg-white"
                      >
                        <option value="starttls">STARTTLS (Port 587)</option>
                        <option value="ssl">SSL/TLS (Port 465)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-black uppercase opacity-65 mb-1">SMTP Username</label>
                    <input 
                      type="text" 
                      value={smtpUser}
                      onChange={(e) => setSmtpUser(e.target.value)}
                      placeholder="noreply@creatorplaza.nl"
                      className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-3 text-xs font-mono focus:outline-none focus:border-indigo-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-black uppercase opacity-65 mb-1">SMTP Password</label>
                    <div className="relative">
                      <input 
                        type={showSmtpPass ? 'text' : 'password'}
                        value={smtpPass}
                        onChange={(e) => setSmtpPass(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-3 pr-10 text-xs font-mono focus:outline-none focus:border-indigo-500 focus:bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSmtpPass((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
                        title={showSmtpPass ? 'Hide password' : 'Show password'}
                      >
                        {showSmtpPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-black uppercase opacity-65 mb-1">From Address / Sender</label>
                    <input 
                      type="text" 
                      value={smtpFrom}
                      onChange={(e) => setSmtpFrom(e.target.value)}
                      placeholder='"BeSafe Network" <noreply@creatorplaza.nl>'
                      className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-3 text-xs font-mono focus:outline-none focus:border-indigo-500 focus:bg-white"
                    />
                  </div>

                  <div className="flex items-center justify-between bg-zinc-50 border border-zinc-200 rounded-xl p-3">
                    <div>
                      <span className="block text-[10px] font-mono font-black uppercase text-zinc-800">Strict SSL Certificate Check</span>
                      <span className="block text-[10px] font-mono text-zinc-500">Leave off if mail server uses self-signed TLS certs</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={smtpRejectUnauthorized}
                      onChange={(e) => setSmtpRejectUnauthorized(e.target.checked)}
                      className="w-4 h-4 cursor-pointer text-indigo-600 rounded focus:ring-indigo-500"
                    />
                  </div>

                  <div className="pt-2 border-t border-zinc-100">
                    <label className="block text-[10px] font-mono font-black uppercase opacity-65 mb-1">Admin Notification Email</label>
                    <input 
                      type="email" 
                      value={notificationEmail}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNotificationEmail((prev) => {
                          if (!testEmailRecipient || testEmailRecipient === prev) {
                            setTestEmailRecipient(val);
                          }
                          return val;
                        });
                      }}
                      placeholder="alerts@creatorplaza.nl"
                      className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-3 text-xs font-mono focus:outline-none focus:border-indigo-500 focus:bg-white"
                    />
                  </div>
                </div>

                <button 
                  onClick={handleUpdateSystemConfig}
                  className="w-full py-3 bg-[#141414] text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-zinc-800 shadow-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Mail Configuration
                </button>

                {/* TEST EMAIL SECTION */}
                <div className="pt-4 border-t border-zinc-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-black uppercase tracking-wider text-zinc-700">
                      Test SMTP Connection
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">
                      Tests current form values
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={testEmailRecipient}
                      onChange={(e) => setTestEmailRecipient(e.target.value)}
                      placeholder={notificationEmail || 'recipient@domain.com'}
                      className="flex-1 bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-xs font-mono focus:outline-none focus:border-indigo-500 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleSendTestEmail}
                      disabled={isTestingSmtp}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-mono text-[10px] uppercase font-black rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap shadow-xs"
                    >
                      {isTestingSmtp ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      {isTestingSmtp ? 'Testing...' : 'Test Email'}
                    </button>
                  </div>

                  {smtpTestFeedback && (
                    <div className="space-y-2.5">
                      <div className={`p-3 rounded-xl border text-xs font-mono flex items-start gap-2.5 ${
                        smtpTestFeedback.success
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : 'bg-rose-50 border-rose-200 text-rose-900'
                      }`}>
                        {smtpTestFeedback.success ? (
                          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="space-y-0.5 break-all">
                          <p className="font-bold">{smtpTestFeedback.message}</p>
                          {typeof smtpTestFeedback.elapsedMs === 'number' && smtpTestFeedback.elapsedMs > 0 && (
                            <p className="text-[10px] opacity-75">Round-trip time: {smtpTestFeedback.elapsedMs}ms</p>
                          )}
                        </div>
                      </div>

                      {smtpTestFeedback.logs && smtpTestFeedback.logs.length > 0 && (
                        <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-inner">
                          <div className="px-3 py-2 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
                            <span className="font-mono text-[10px] uppercase font-black tracking-wider text-zinc-300">
                              Full SMTP Session Log ({smtpTestFeedback.logs.length} entries)
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard?.writeText(smtpTestFeedback.logs?.join('\n') || '');
                                setCopiedSmtpLogs(true);
                                setTimeout(() => setCopiedSmtpLogs(false), 2000);
                              }}
                              className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono text-[9px] uppercase font-bold transition-colors"
                            >
                              {copiedSmtpLogs ? 'Copied!' : 'Copy Log'}
                            </button>
                          </div>
                          <pre className="p-3 max-h-72 overflow-y-auto font-mono text-[10px] leading-relaxed text-zinc-200 whitespace-pre-wrap break-all">
                            {smtpTestFeedback.logs.map((line, idx) => {
                              const isErr = line.includes('[ERROR]') || line.includes('[DNS-ERROR]') || line.includes('[SMTP-ERROR]') || line.includes('[SMTP-FATAL]');
                              const isWarn = line.includes('[WARN]') || line.includes('[SMTP-WARN]');
                              const isSuccess = line.includes('[SUCCESS]') || line.includes('succeeded') || line.includes('accepted by server');
                              return (
                                <div
                                  key={idx}
                                  className={
                                    isErr
                                      ? 'text-rose-400 font-bold'
                                      : isWarn
                                        ? 'text-amber-300'
                                        : isSuccess
                                          ? 'text-emerald-400 font-bold'
                                          : 'text-zinc-300'
                                  }
                                >
                                  {line}
                                </div>
                              );
                            })}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* VRCHAT BOT CONFIGURATION */}
              <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 space-y-6 shadow-sm lg:col-span-2">
                <div className="border-b border-zinc-100 pb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2 font-black text-sm uppercase tracking-wider text-zinc-800">
                    <Fingerprint className="w-5 h-5 text-purple-600" /> VRChat Group Ban Bot Setup
                  </span>
                  <div className="flex items-center gap-2 bg-stone-50 border border-stone-200/60 rounded-xl p-1.5 px-3">
                    <span className="font-mono text-[9px] uppercase tracking-wider font-bold text-zinc-500">Enable Bot</span>
                    <input 
                      type="checkbox"
                      checked={vrchatBotEnabled}
                      onChange={(e) => setVrchatBotEnabled(e.target.checked)}
                      className="w-4 h-4 cursor-pointer text-indigo-600 rounded focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <p className="text-xs text-zinc-500 leading-relaxed font-mono">
                  Synchronize globally banned members directly to your VRChat Groups as banned users. 
                  Provide a VRChat bot account (emails & pass) or an active pre-acquired session cookie directly.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-2">
                    <label className="block text-[9px] font-mono font-black uppercase opacity-65">VRChat Login Email / Username</label>
                    <input 
                      type="text" 
                      value={vrchatUsername}
                      onChange={(e) => setVrchatUsername(e.target.value)}
                      placeholder="bot-account@vrchat.com"
                      className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-3.5 text-xs font-mono focus:outline-none focus:border-indigo-500 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[9px] font-mono font-black uppercase opacity-65">VRChat Account Password (Optional)</label>
                    <input 
                      type="password" 
                      value={vrchatPassword}
                      onChange={(e) => setVrchatPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-3.5 text-xs font-mono focus:outline-none focus:border-indigo-500 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[9px] font-mono font-black uppercase opacity-65">VRChat Target Group ID</label>
                    <input 
                      type="text" 
                      value={vrchatGroupId}
                      onChange={(e) => setVrchatGroupId(extractVRChatGroupId(e.target.value))}
                      placeholder="grp_420ab99f-e8b8-4c8d-8fe9-73f1ff499637 or full group URL"
                      className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-3.5 text-xs font-mono focus:outline-none focus:border-indigo-500 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[9px] font-mono font-black uppercase opacity-65 flex items-center justify-between">
                      <span>Bypass 2FA Session Cookie</span>
                      <span className="text-[8px] font-normal text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded uppercase">Bypass 2fa email</span>
                    </label>
                    <input 
                      type="text" 
                      value={vrchatCookie}
                      onChange={(e) => setVrchatCookie(e.target.value)}
                      placeholder="authcookie_7e127bb5-f126-444c-bc19-58bcdded711a"
                      className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-3.5 text-xs font-mono focus:outline-none focus:border-indigo-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-200 mt-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-600 block"></span>
                    <h4 className="text-[10px] uppercase font-mono tracking-wider text-zinc-800 font-extrabold">2FAuth API Integration (Automatic Login / 2FA)</h4>
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-normal font-sans">
                    Optionally connect to your self-hosted 2FAuth API instance. When the bot attempts to log in and VRChat requests a 2FA TOTP code, the system will automatically query your 2FAuth service to retrieve the active TOTP token and complete authentication seamlessly.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="block text-[9px] font-mono font-black uppercase opacity-65">2FAuth API Instance URL</label>
                      <input 
                        type="url" 
                        value={twoFactorAuthApiUrl}
                        onChange={(e) => setTwoFactorAuthApiUrl(e.target.value)}
                        placeholder="https://2fauth.your-domain.com"
                        className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-3.5 text-xs font-mono focus:outline-none focus:border-indigo-500 focus:bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[9px] font-mono font-black uppercase opacity-65">2FAuth API Token (Bearer)</label>
                      <input 
                        type="password" 
                        value={twoFactorAuthApiToken}
                        onChange={(e) => setTwoFactorAuthApiToken(e.target.value)}
                        placeholder="••••••••••••••••"
                        className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-3.5 text-xs font-mono focus:outline-none focus:border-indigo-500 focus:bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[9px] font-mono font-black uppercase opacity-65 flex items-center justify-between">
                        <span>2FAuth Account Label / ID</span>
                        <span className="text-[8px] font-normal text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase">VRChat fallback</span>
                      </label>
                      <input 
                        type="text" 
                        value={twoFactorAuthAccountId}
                        onChange={(e) => setTwoFactorAuthAccountId(e.target.value)}
                        placeholder="e.g. VRChat, 16"
                        className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-3.5 text-xs font-mono focus:outline-none focus:border-indigo-500 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-100 p-4 rounded-xl border border-zinc-200/65 font-mono text-[10px] space-y-1">
                  <p className="font-bold uppercase text-zinc-700">💡 2FA Bypass Protocol Instructions:</p>
                  <p className="text-zinc-500">
                    VRChat requires email 2FA on login. To bypass this, log in on a browser, 
                    inspect cookies, copy the value of the <span className="font-bold underline text-indigo-600">auth</span> cookie, and 
                    paste it in the box above. The bot will refresh its session automatically!
                  </p>
                </div>

                {/* VRCHAT MULTI-ACCOUNT BOT ARRAY */}
                <div className="pt-6 border-t border-zinc-200 mt-6 space-y-6">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-600 block"></span>
                    <h4 className="text-[10px] uppercase font-mono tracking-wider text-zinc-800 font-extrabold flex items-center gap-1.5">
                      🛡️ VRChat Multi-Account Bot Array ({(vrchatUsername || vrchatCookie ? 1 : 0) + vrchatBots.length} accounts configured)
                    </h4>
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-normal font-sans">
                    Enable high-capacity scaling by linking multiple VRChat bot accounts. The system will automatically track how many groups each account is in. When an account reaches the limit of <strong>95 groups</strong>, new servers will automatically route to the next available bot account. This allows you to manage hundreds of groups concurrently.
                  </p>

                  {/* Configured Bots List */}
                  <div className="space-y-3">
                    {vrchatBots.length === 0 && !vrchatUsername && !vrchatCookie ? (
                      <div className="p-4 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 text-center">
                        <p className="text-[11px] font-mono text-zinc-500">No bot accounts configured.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Primary Bot Account (Managed Above) */}
                        {(vrchatUsername || vrchatCookie) && (
                          <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/25 shadow-sm flex flex-col justify-between space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="space-y-0.5 max-w-[80%]">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="text-xs font-bold font-mono text-indigo-950 truncate" title={vrchatUsername}>
                                    {vrchatUsername || 'Unnamed Main Bot'}
                                  </p>
                                  <span className="px-1 py-0.5 rounded text-[7px] font-mono font-extrabold bg-indigo-600 text-white tracking-widest uppercase">
                                    PRIMARY
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono tracking-wider uppercase ${
                                    (systemConfig?.vrchatBotStatus || 'idle').toLowerCase() === 'active' || (systemConfig?.vrchatBotStatus || 'idle').toLowerCase() === 'authenticated'
                                      ? 'bg-emerald-100 text-emerald-800 font-bold'
                                      : (systemConfig?.vrchatBotStatus || 'idle').toLowerCase() === 'error'
                                      ? 'bg-rose-100 text-rose-800 font-bold'
                                      : 'bg-zinc-100 text-zinc-850'
                                  }`}>
                                    {systemConfig?.vrchatBotStatus || 'idle'}
                                  </span>
                                  {twoFactorAuthAccountId && (
                                    <span className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-indigo-50 text-indigo-700">
                                      2FA: {twoFactorAuthAccountId}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-white text-zinc-500 border border-zinc-200 select-none">
                                Configured Above
                              </span>
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between text-[9px] font-mono text-zinc-500">
                                <span>Group Utilization</span>
                                <span className="font-bold text-zinc-700">
                                  {systemConfig?.vrchatBotGroupCount || (vrchatGroupId ? 1 : 0)} / 95 Groups
                                </span>
                              </div>
                              <div className="w-full bg-zinc-200 rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    (systemConfig?.vrchatBotGroupCount || (vrchatGroupId ? 1 : 0)) > 90 ? 'bg-rose-500' : (systemConfig?.vrchatBotGroupCount || (vrchatGroupId ? 1 : 0)) > 70 ? 'bg-amber-500' : 'bg-indigo-600'
                                  }`}
                                  style={{ width: `${Math.min(100, (((systemConfig?.vrchatBotGroupCount || (vrchatGroupId ? 1 : 0)) / 95) * 100))}%` }}
                                ></div>
                              </div>
                            </div>

                            {(systemConfig?.vrchatBotGroups && systemConfig.vrchatBotGroups.length > 0 ? systemConfig.vrchatBotGroups : (vrchatGroupId ? [vrchatGroupId] : [])).length > 0 && (
                              <div className="space-y-1 pt-1 border-t border-zinc-100">
                                <span className="text-[8px] font-mono font-bold text-zinc-400 block uppercase">Assigned Groups:</span>
                                <div className="flex flex-wrap gap-1 max-h-12 overflow-y-auto">
                                  {(systemConfig?.vrchatBotGroups && systemConfig.vrchatBotGroups.length > 0 ? systemConfig.vrchatBotGroups : (vrchatGroupId ? [vrchatGroupId] : [])).map((grp: string) => (
                                    <span key={grp} className="px-1.5 py-0.5 rounded bg-zinc-50 border border-zinc-200 text-[8px] font-mono text-zinc-600">
                                      {grp}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Additional Configured Bots */}
                        {vrchatBots.map((bot) => {
                          const gCount = bot.groupCount || 0;
                          const utilPercent = Math.min(100, (gCount / 95) * 100);
                          let statusColor = 'bg-zinc-100 text-zinc-850';
                          if (bot.status?.toLowerCase() === 'authenticated' || bot.status?.toLowerCase() === 'active') {
                            statusColor = 'bg-emerald-100 text-emerald-800 font-bold';
                          } else if (bot.status?.toLowerCase() === 'authenticating' || bot.status?.toLowerCase() === '2fa') {
                            statusColor = 'bg-amber-100 text-amber-800 font-bold';
                          } else if (bot.status?.toLowerCase() === 'error' || bot.status?.toLowerCase() === 'expired') {
                            statusColor = 'bg-rose-100 text-rose-800 font-bold';
                          }

                          return (
                            <div key={bot.id} className="p-4 rounded-xl border border-zinc-200 bg-white shadow-sm flex flex-col justify-between space-y-3">
                              <div className="flex items-start justify-between">
                                <div className="space-y-0.5 max-w-[80%]">
                                  <p className="text-xs font-bold font-mono text-zinc-800 truncate" title={bot.vrchatUsername}>
                                    {bot.vrchatUsername}
                                  </p>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono tracking-wider uppercase ${statusColor}`}>
                                      {bot.status || 'Disconnected'}
                                    </span>
                                    {bot.twoFactorAuthAccountId && (
                                      <span className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-indigo-50 text-indigo-700">
                                        2FA: {bot.twoFactorAuthAccountId}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <button 
                                  onClick={() => handleRemoveVRChatBot(bot.id)}
                                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                                  title="Remove Bot"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              <div className="space-y-1">
                                <div className="flex justify-between text-[9px] font-mono text-zinc-500">
                                  <span>Group Utilization</span>
                                  <span className="font-bold text-zinc-700">{gCount} / 95 Groups</span>
                                </div>
                                <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-300 ${utilPercent > 90 ? 'bg-rose-500' : utilPercent > 70 ? 'bg-amber-500' : 'bg-indigo-600'}`}
                                    style={{ width: `${utilPercent}%` }}
                                  ></div>
                                </div>
                              </div>

                              {bot.groups && bot.groups.length > 0 && (
                                <div className="space-y-1 pt-1 border-t border-zinc-100">
                                  <span className="text-[8px] font-mono font-bold text-zinc-400 block uppercase">Assigned Groups:</span>
                                  <div className="flex flex-wrap gap-1 max-h-12 overflow-y-auto">
                                    {bot.groups.map((grp: string) => (
                                      <span key={grp} className="px-1.5 py-0.5 rounded bg-zinc-50 border border-zinc-200 text-[8px] font-mono text-zinc-600">
                                        {grp}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Add New Bot Form */}
                  <form onSubmit={handleAddVRChatBot} className="p-5 rounded-2xl border border-zinc-200/80 bg-zinc-50/50 space-y-4">
                    <span className="text-[10px] font-mono font-black uppercase text-zinc-700 block">Add Bot Account to Array</span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-[8px] font-mono font-black uppercase opacity-65">Email / Username</label>
                        <input 
                          type="text" 
                          value={newBotEmail}
                          onChange={(e) => setNewBotEmail(e.target.value)}
                          placeholder="bot-account-2@vrchat.com"
                          className="w-full bg-white border border-zinc-300 rounded-lg p-2.5 text-xs font-mono focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[8px] font-mono font-black uppercase opacity-65">Password (Optional)</label>
                        <input 
                          type="password" 
                          value={newBotPassword}
                          onChange={(e) => setNewBotPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-white border border-zinc-300 rounded-lg p-2.5 text-xs font-mono focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[8px] font-mono font-black uppercase opacity-65 flex items-center justify-between">
                          <span>Bypass Session Cookie (Optional)</span>
                          <span className="text-[7px] text-rose-600 font-bold bg-rose-50 px-1 rounded uppercase">Bypass 2FA</span>
                        </label>
                        <input 
                          type="text" 
                          value={newBotCookie}
                          onChange={(e) => setNewBotCookie(e.target.value)}
                          placeholder="authcookie_..."
                          className="w-full bg-white border border-zinc-300 rounded-lg p-2.5 text-xs font-mono focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[8px] font-mono font-black uppercase opacity-65 flex items-center justify-between">
                          <span>2FAuth Account Label/ID (Optional)</span>
                          <span className="text-[7px] text-indigo-600 font-bold bg-indigo-50 px-1 rounded uppercase">Custom Token</span>
                        </label>
                        <input 
                          type="text" 
                          value={newBotTwoFactorLabel}
                          onChange={(e) => setNewBotTwoFactorLabel(e.target.value)}
                          placeholder="e.g. VRChat_Bot_2, 17"
                          className="w-full bg-white border border-zinc-300 rounded-lg p-2.5 text-xs font-mono focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button 
                        type="submit"
                        className="py-2.5 px-5 bg-zinc-800 hover:bg-zinc-900 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Bot to Array
                      </button>
                    </div>
                  </form>
                </div>

                <div className="pt-4 border-t border-zinc-100 flex justify-end gap-3">
                  <button 
                    onClick={handleUpdateSystemConfig}
                    className="py-3.5 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-colors shadow-md"
                  >
                    Commit VRChat Configuration
                  </button>
                </div>
              </div>

              {/* DISCORD SLASH COMMANDS & /age-verify MANAGEMENT */}
              <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 space-y-6 shadow-sm lg:col-span-3">
                <div className="border-b border-zinc-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${disableAgeVerifyCommand ? 'bg-amber-100 text-amber-700' : 'bg-indigo-50 text-indigo-600'}`}>
                      <Bot className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-sm uppercase tracking-wider text-zinc-800">
                          Discord Slash Command Management & Unsync Controls
                        </h3>
                        <span className={`px-2.5 py-0.5 rounded-full font-mono text-[9px] font-black uppercase tracking-wider ${
                          disableAgeVerifyCommand 
                            ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {disableAgeVerifyCommand ? 'AGE-VERIFY UNSYNCED / DISABLED' : 'ALL COMMANDS ACTIVE & SYNCED'}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 font-mono mt-0.5">
                        Manage global Discord Application Commands and control whether the <code className="text-indigo-600 font-bold">/age-verify</code> command is registered or unsynced.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSyncDiscordCommands()}
                      disabled={isSyncingDiscordCommands}
                      className="py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-mono text-[10px] uppercase font-black rounded-xl transition-all flex items-center gap-1.5 border border-zinc-300 disabled:opacity-50"
                    >
                      {isSyncingDiscordCommands ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                      )}
                      Sync Commands Now
                    </button>
                  </div>
                </div>

                {discordSyncFeedback && (
                  <div className={`p-4 rounded-xl border flex items-start gap-3 text-xs font-mono ${
                    discordSyncFeedback.success 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}>
                    {discordSyncFeedback.success ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <p className="font-bold">{discordSyncFeedback.message}</p>
                      {discordSyncFeedback.count !== undefined && (
                        <p className="text-[11px] opacity-80">
                          {discordSyncFeedback.count} commands currently registered in Discord Application Gateway.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-zinc-50/70 p-5 rounded-2xl border border-zinc-200/70">
                  {/* TOGGLE 1: DISABLE /age-verify */}
                  <div className="space-y-3 bg-white p-5 rounded-xl border border-zinc-200/80 shadow-xs">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="font-mono text-xs font-black uppercase tracking-wider text-zinc-900 block">
                          Disable `/age-verify` Slash Command
                        </span>
                        <p className="text-xs text-zinc-500 font-sans mt-1 leading-relaxed">
                          When this option is enabled, the <code className="bg-zinc-100 px-1 py-0.5 rounded text-zinc-800 font-mono text-[11px]">/age-verify</code> slash command will be <strong>filtered out and unsynced</strong> from Discord's application command gateway. Discord users will no longer see it in their command list.
                        </p>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-1">
                        <input 
                          type="checkbox" 
                          checked={disableAgeVerifyCommand}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setDisableAgeVerifyCommand(val);
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-12 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                      </label>
                    </div>

                    <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-zinc-100">
                      <span className={`px-2 py-0.5 rounded font-mono text-[9px] uppercase font-bold ${
                        disableAgeVerifyCommand ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        Setting: {disableAgeVerifyCommand ? 'DISABLED (HIDDEN)' : 'ENABLED (VISIBLE)'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSyncDiscordCommands(!disableAgeVerifyCommand)}
                        disabled={isSyncingDiscordCommands}
                        className={`text-[10px] font-mono uppercase font-bold underline ml-auto transition-colors ${
                          disableAgeVerifyCommand ? 'text-emerald-700 hover:text-emerald-800' : 'text-rose-700 hover:text-rose-800'
                        }`}
                      >
                        {disableAgeVerifyCommand ? '→ Re-enable & Un-hide on Discord' : '→ Unsync from Discord Right Now'}
                      </button>
                    </div>
                  </div>

                  {/* COMMAND PREVIEW & EXPLANATION */}
                  <div className="space-y-3 bg-white p-5 rounded-xl border border-zinc-200/80 shadow-xs flex flex-col justify-between">
                    <div>
                      <span className="font-mono text-xs font-black uppercase tracking-wider text-zinc-900 block">
                        Discord Command Synchronization Status
                      </span>
                      <p className="text-xs text-zinc-500 font-sans mt-1 leading-relaxed">
                        Saving your configuration commits the setting to the database. Clicking <strong>Commit & Re-sync with Discord</strong> pushes the updated command list directly to Discord's REST API endpoint for both the primary bot and custom server bots.
                      </p>
                    </div>

                    <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-3">
                      <div className="text-[10px] font-mono text-zinc-400">
                        Target endpoint: <span className="text-zinc-600">Routes.applicationCommands()</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          handleUpdateSystemConfig();
                          handleSyncDiscordCommands();
                        }}
                        disabled={isSyncingDiscordCommands}
                        className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-[10px] uppercase font-black rounded-xl transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {isSyncingDiscordCommands ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        Commit & Re-sync with Discord
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* STAFF & MODERATOR ROLE MANAGEMENT */}
              <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 space-y-6 shadow-sm lg:col-span-3">
                <div className="border-b border-zinc-100 pb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2 font-black text-sm uppercase tracking-wider text-zinc-800">
                    <UserCheck className="w-5 h-5 text-indigo-600" /> Registered Accounts, Verification & Access Control
                  </span>
                  <button
                    type="button"
                    onClick={fetchStaffList}
                    className="text-[10px] font-mono uppercase font-bold text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Refresh Account Registry
                  </button>
                </div>

                <p className="text-xs text-zinc-500 font-mono leading-relaxed">
                  View and manage all registered dashboard accounts, inspect account verification statuses, assign <span className="font-bold text-amber-600">Moderator / Admin</span> roles, or block accounts and automatically dispatch a ban notification email.
                </p>


                {banAccountTarget && (
                  <div className="p-4 rounded-xl border-2 border-rose-500 bg-rose-50/90 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-black uppercase text-rose-800">
                        Block Account & Send Ban Email: {banAccountTarget.username} ({banAccountTarget.email})
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setBanAccountTarget(null);
                          setBanAccountReason('');
                        }}
                        className="text-xs font-mono font-bold text-rose-700 hover:underline"
                      >
                        Cancel
                      </button>
                    </div>
                    <p className="text-[11px] font-mono text-rose-700">
                      Blocking this account immediately revokes dashboard login access and sends an official ban notification email with your reason to <span className="font-bold">{banAccountTarget.email}</span>.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={banAccountReason}
                        onChange={(e) => setBanAccountReason(e.target.value)}
                        placeholder="Enter reason for blocking this account (included in ban email)..."
                        className="flex-1 px-3 py-2 text-xs font-mono bg-white border border-rose-300 rounded-lg focus:outline-none focus:border-rose-600"
                      />
                      <button
                        type="button"
                        disabled={accountActionLoadingId === banAccountTarget._id}
                        onClick={() =>
                          handleAccountBanSubmit(
                            banAccountTarget._id,
                            true,
                            banAccountReason || 'Violation of BeSafe Network Terms of Service or Security Policy.'
                          )
                        }
                        className="px-4 py-2 bg-rose-600 text-white font-mono text-xs font-black uppercase rounded-lg hover:bg-rose-700 disabled:opacity-50 whitespace-nowrap"
                      >
                        {accountActionLoadingId === banAccountTarget._id ? 'Blocking...' : 'Confirm Block & Send Email'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto border border-zinc-200 rounded-xl">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="bg-zinc-50 border-b border-zinc-200 text-[10px] uppercase font-black text-zinc-500">
                      <tr>
                        <th className="p-3">Account</th>
                        <th className="p-3">Age Verification</th>
                        <th className="p-3">Role</th>
                        <th className="p-3 text-right">Role & Access Controls</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {staffList.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-zinc-400">
                            No registered accounts found.
                          </td>
                        </tr>
                      ) : (
                        staffList.map((member) => {
                          const isBusy = accountActionLoadingId === member._id;
                          return (
                            <tr key={member._id} className={`hover:bg-zinc-50/50 ${member.isBanned ? 'bg-rose-50/40' : ''}`}>
                              <td className="p-3">
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-zinc-800">{member.username}</span>
                                    {member.isBanned && (
                                      <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded bg-rose-600 text-white">
                                        BLOCKED
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] text-zinc-500">{member.email}</span>
                                  {member.discordId && (
                                    <span className="text-[10px] text-indigo-600">Discord ID: {member.discordId}</span>
                                  )}
                                  {member.isBanned && member.banReason && (
                                    <span className="text-[10px] text-rose-700 font-semibold">
                                      Ban Reason: {member.banReason}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="flex flex-col items-start gap-1.5">
                                  <span
                                    className={`px-2 py-0.5 text-[9px] font-black uppercase rounded ${
                                      member.isAgeVerified
                                        ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                        : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                                    }`}
                                  >
                                    {member.isAgeVerified ? '18+ VERIFIED' : 'NOT VERIFIED'}
                                  </span>
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() =>
                                      handleToggleAccountVerification(member._id, {
                                        isAgeVerified: !member.isAgeVerified
                                      })
                                    }
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all ${
                                      member.isAgeVerified
                                        ? 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'
                                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                    }`}
                                  >
                                    {member.isAgeVerified ? 'Revoke 18+' : 'Verify 18+'}
                                  </button>
                                </div>
                              </td>
                              <td className="p-3">
                                <span
                                  className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-full ${
                                    member.role === 'admin'
                                      ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                      : member.role === 'moderator'
                                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                      : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                                  }`}
                                >
                                  {member.role || 'user'}
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex flex-col items-end gap-2">
                                  <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateStaffRole(member._id, 'admin')}
                                      disabled={member.role === 'admin' || isBusy}
                                      className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                                        member.role === 'admin'
                                          ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                                          : 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm'
                                      }`}
                                    >
                                      Admin
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateStaffRole(member._id, 'moderator')}
                                      disabled={member.role === 'moderator' || isBusy}
                                      className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                                        member.role === 'moderator'
                                          ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                                          : 'bg-amber-500 text-[#141414] hover:bg-amber-600 shadow-sm'
                                      }`}
                                    >
                                      Moderator
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateStaffRole(member._id, 'user')}
                                      disabled={member.role === 'user' || !member.role || isBusy}
                                      className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                                        member.role === 'user' || !member.role
                                          ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                                          : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300 shadow-sm'
                                      }`}
                                    >
                                      User
                                    </button>
                                  </div>
                                  <div>
                                    {member.isBanned ? (
                                      <button
                                        type="button"
                                        disabled={isBusy}
                                        onClick={() => handleAccountBanSubmit(member._id, false)}
                                        className="px-2.5 py-1 rounded text-[10px] font-black uppercase bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-all"
                                      >
                                        Unblock Account
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        disabled={isBusy}
                                        onClick={() => {
                                          setBanAccountTarget(member);
                                          setBanAccountReason('');
                                        }}
                                        className="px-2.5 py-1 rounded text-[10px] font-black uppercase bg-zinc-900 text-white hover:bg-rose-700 shadow-sm transition-all"
                                      >
                                        Block Account & Email
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 space-y-4 shadow-sm lg:col-span-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="font-black text-sm uppercase tracking-wider text-zinc-800">Discord Server Registry</h3>
                    <p className="text-xs text-zinc-500 font-mono max-w-3xl">
                      Remove server records absent from every ready Discord shard for at least 24 hours. All configured shards must be connected; linked custom bots and VRChat groups are cleaned up before deletion.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handlePruneStaleServers}
                    disabled={isPruningServers}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-rose-700 disabled:opacity-50 disabled:cursor-wait whitespace-nowrap"
                  >
                    {isPruningServers ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    {isPruningServers ? 'Checking servers...' : 'Prune stale servers'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: DISCORD LINK */}
          {view === 'link' && !selectedGuild && (
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="bg-white border-2 border-[#141414] rounded-2xl p-8 shadow-[-6px_6px_0px_0px_rgba(20,20,20,1)] space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-200 pb-4 gap-4">
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900 flex items-center gap-3">
                      <Shield className="w-6 h-6 text-indigo-600" />
                      Discord Account Integration
                    </h2>
                    <p className="text-xs font-mono text-zinc-500 mt-1">
                      Linking your Discord account connects your web dashboard profile to Discord slash commands like <code className="bg-zinc-100 px-1 py-0.5 rounded font-bold text-indigo-600">/setup</code> and <code className="bg-zinc-100 px-1 py-0.5 rounded font-bold text-indigo-600">/link</code>.
                    </p>
                  </div>
                  <div>
                    {discordId ? (
                      <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono text-xs px-3 py-1.5 rounded-full font-bold uppercase flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-emerald-600" /> Linked
                      </span>
                    ) : (
                      <span className="bg-amber-100 text-amber-800 border border-amber-300 font-mono text-xs px-3 py-1.5 rounded-full font-bold uppercase flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-amber-600" /> Unlinked
                      </span>
                    )}
                  </div>
                </div>

                {discordId ? (
                  <div className="bg-zinc-50 border-2 border-zinc-200 rounded-xl p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-mono text-zinc-500 uppercase font-black">Connected Discord Snowflake ID</p>
                        <p className="text-lg font-mono font-bold text-zinc-900 select-all tracking-wide mt-1">{discordId}</p>
                      </div>
                      <button
                        onClick={handleUnlinkDiscord}
                        className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
                      >
                        Unlink Discord Account
                      </button>
                    </div>
                    <p className="text-xs font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 p-3 rounded-lg">
                      ✅ Account fully connected. You can now run <code className="font-bold">/setup</code> in any Discord server where you are an Administrator to link your server to this dashboard.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                    {/* OPTION A: ENTER CODE FROM DISCORD */}
                    <div className="bg-zinc-50 border-2 border-[#141414] rounded-xl p-6 space-y-4 flex flex-col justify-between shadow-[-4px_4px_0px_0px_rgba(20,20,20,1)]">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-indigo-600 font-black font-mono text-xs uppercase tracking-wider">
                          <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">1</span>
                          Option A: Code from Discord /link
                        </div>
                        <p className="text-xs text-zinc-600 font-mono leading-relaxed">
                          Run <code className="bg-zinc-200 px-1.5 py-0.5 rounded font-bold text-zinc-800">/link</code> in Discord. The bot will give you a 6-character code. Paste it below to link your account:
                        </p>
                        <form onSubmit={handleLinkDiscordWithCode} className="space-y-3 pt-2">
                          <div>
                            <label className="block text-[10px] font-mono uppercase font-black text-zinc-500 mb-1">Enter 6-Character Link Code</label>
                            <input
                              type="text"
                              value={inputLinkCode}
                              onChange={(e) => setInputLinkCode(e.target.value.toUpperCase())}
                              placeholder="e.g. X7K2P9"
                              maxLength={12}
                              className="w-full bg-white border-2 border-[#141414] rounded-xl p-3 text-sm font-mono tracking-widest font-bold uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={isSubmittingLink || !inputLinkCode.trim()}
                            className="w-full bg-[#141414] text-white font-mono text-xs font-bold uppercase tracking-widest py-3 rounded-xl hover:bg-zinc-800 disabled:opacity-50 transition-colors shadow-[-2px_2px_0px_0px_rgba(20,20,20,1)]"
                          >
                            {isSubmittingLink ? 'Linking Account...' : 'Connect Account'}
                          </button>
                        </form>
                      </div>
                    </div>

                    {/* OPTION B: GENERATE WEB CODE FOR DISCORD */}
                    <div className="bg-zinc-50 border-2 border-[#141414] rounded-xl p-6 space-y-4 flex flex-col justify-between shadow-[-4px_4px_0px_0px_rgba(20,20,20,1)]">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-indigo-600 font-black font-mono text-xs uppercase tracking-wider">
                          <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">2</span>
                          Option B: Generate Web Code
                        </div>
                        <p className="text-xs text-zinc-600 font-mono leading-relaxed">
                          Click below to generate a web link code. Then go to Discord and run <code className="bg-zinc-200 px-1.5 py-0.5 rounded font-bold text-zinc-800">/link code: [YOUR_CODE]</code>.
                        </p>
                        
                        {generatedWebCode ? (
                          <div className="bg-white border-2 border-indigo-500 rounded-xl p-4 space-y-2 text-center">
                            <p className="text-[10px] font-mono text-indigo-600 font-black uppercase">Your Web Link Code</p>
                            <p className="text-xl font-mono font-black tracking-widest text-zinc-900 select-all">{generatedWebCode}</p>
                            <p className="text-[10px] font-mono text-zinc-500">Run this command in Discord:</p>
                            <div className="bg-zinc-100 p-2.5 rounded text-[11px] font-mono text-zinc-800 select-all font-bold">
                              /link code: {generatedWebCode}
                            </div>
                            <p className="text-[9px] font-mono text-amber-600">Expires in 10 minutes</p>
                          </div>
                        ) : (
                          <div className="pt-4">
                            <button
                              onClick={handleGenerateWebCode}
                              disabled={isSubmittingLink}
                              className="w-full bg-indigo-600 text-white font-mono text-xs font-bold uppercase tracking-widest py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-[-2px_2px_0px_0px_rgba(20,20,20,1)]"
                            >
                              {isSubmittingLink ? 'Generating...' : 'Generate Web Link Code'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW: GEO COMPLIANCE & AGE RULES */}
          {(role === 'admin' || role === 'moderator') && view === 'georules' && !selectedGuild && (
            <GeoRulesManager token={localStorage.getItem('gg_token') || localStorage.getItem('adminToken') || undefined} />
          )}

          {/* VIEW: CERTIFIED API PARTNER BOTS (ADMIN) */}
          {(role === 'admin' || role === 'moderator') && view === 'apibots' && !selectedGuild && (
            <ApiBotsManager />
          )}

          {/* VIEW: TRUSTED COMPANIES DIRECTORY (ADMIN) */}
          {(role === 'admin' || role === 'moderator') && view === 'trustedcompanies' && !selectedGuild && (
            <TrustedCompaniesManager />
          )}

          {/* VIEW: CLAIMED CASES */}
          {view === 'cases' && !selectedGuild && (
            <div className="space-y-6">
              <div className="bg-white border-4 border-[#141414] p-6 shadow-[-8px_8px_0px_0px_rgba(20,20,20,1)] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                    <FolderCheck className="w-6 h-6 text-indigo-600" />
                    Claimed Staff Cases ({cases.length})
                  </h2>
                  <p className="font-mono text-xs opacity-60 uppercase">
                    Organized cases claimed by administrative staff for investigation & response.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const nextVal = !showAllCases;
                      setShowAllCases(nextVal);
                      fetchCases(nextVal);
                    }}
                    className={`px-4 py-2 font-mono text-xs font-black uppercase border-2 border-[#141414] transition-all ${
                      showAllCases 
                        ? 'bg-[#141414] text-white shadow-none' 
                        : 'bg-white text-[#141414] hover:bg-zinc-100 shadow-[-3px_3px_0px_0px_rgba(20,20,20,1)]'
                    }`}
                  >
                    {showAllCases ? 'Showing: All Admin Cases' : 'Showing: My Cases Only'}
                  </button>
                  <button
                    onClick={() => fetchCases()}
                    className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 border-2 border-[#141414] font-mono text-xs font-black uppercase transition-all shadow-[-2px_2px_0px_0px_rgba(20,20,20,1)] flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh
                  </button>
                </div>
              </div>

              {cases.length === 0 ? (
                <div className="bg-white border-4 border-[#141414] p-12 text-center shadow-[-8px_8px_0px_0px_rgba(20,20,20,1)] space-y-3">
                  <FolderCheck className="w-12 h-12 mx-auto text-zinc-300" />
                  <p className="font-mono font-bold text-sm uppercase text-zinc-700">No Claimed Cases Found</p>
                  <p className="font-mono text-xs text-zinc-500 max-w-md mx-auto">
                    {showAllCases 
                      ? 'No claimed cases exist across the administrative staff.' 
                      : 'You have not claimed any pending appeals yet. Browse the main Overview tab to claim appeals.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {cases.map((c) => (
                    <motion.div
                      key={c._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white border-4 border-[#141414] p-5 shadow-[-6px_6px_0px_0px_rgba(20,20,20,1)] flex flex-col justify-between gap-4 hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-mono text-[9px] font-black uppercase px-2 py-0.5 border border-[#141414] bg-indigo-50 text-indigo-900 rounded">
                              CASE ID: {c._id.slice(-6)}
                            </span>
                            <h3 className="font-bold font-mono text-sm text-[#141414] mt-1 truncate">
                              {c.userDisplayName || 'Unknown User'}
                            </h3>
                            <p className="font-mono text-[10px] text-zinc-500">ID: {c.userId}</p>
                          </div>
                          <span className={`px-2 py-0.5 border border-[#141414] font-mono text-[9px] font-bold uppercase tracking-wider ${
                            c.status === 'claimed' ? 'bg-amber-100 text-amber-900' :
                            c.status === 'approved' ? 'bg-emerald-100 text-emerald-900' :
                            'bg-rose-100 text-rose-900'
                          }`}>
                            {c.status}
                          </span>
                        </div>

                        <div className="text-[11px] font-mono bg-zinc-50 p-2.5 border border-zinc-200 rounded space-y-1">
                          <p className="text-zinc-500 text-[10px]">Claimed By: <span className="font-bold text-zinc-800">{c.claimedBy || 'Admin'}</span></p>
                          <p className="text-zinc-500 text-[10px]">Date: <span className="text-zinc-700">{new Date(c.claimedAt || c.createdAt).toLocaleDateString()}</span></p>
                          {c.vrchatAccount && (
                            <p className="text-indigo-700 text-[10px]">VRChat: <span className="font-bold">{c.vrchatAccount}</span></p>
                          )}
                        </div>

                        <div className="space-y-1">
                          <label className="block font-mono text-[9px] uppercase font-black text-zinc-400">Statement Preview</label>
                          <p className="font-serif italic text-xs text-zinc-700 line-clamp-2 bg-zinc-50/50 p-2 rounded border border-zinc-100">
                            "{c.reason}"
                          </p>
                        </div>

                        {c.attachments && c.attachments.length > 0 && (
                          <div className="flex items-center gap-1 text-[10px] font-mono text-indigo-600">
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>{c.attachments.length} Attached Evidence Image{c.attachments.length > 1 ? 's' : ''}</span>
                          </div>
                        )}

                        {c.messages && c.messages.length > 0 && (
                          <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-500">
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>{c.messages.length} Message Log Entry{c.messages.length > 1 ? 's' : ''}</span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => setSelectedCase(c)}
                        className="w-full bg-[#141414] hover:bg-zinc-800 text-white p-2.5 font-mono font-bold text-xs uppercase tracking-wider shadow-[-3px_3px_0px_0px_rgba(20,20,20,1)] active:shadow-none transition-all flex items-center justify-center gap-1.5"
                      >
                        <FolderCheck className="w-4 h-4" /> Open Case Workspace
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* DETAIL MODALS MODAL LAYER */}
      <AnimatePresence>
        {/* MODAL: REPORT REVIEW */}
        {selectedReport && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-zinc-200/90 flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-5 border-b border-zinc-100 flex justify-between items-center bg-[#F9FAFB]">
                <div>
                  <span className="text-[10px] font-mono bg-rose-50 text-rose-700 pr-2 pl-2.5 py-0.5 rounded-md font-bold uppercase flex items-center gap-1.5 h-fit w-fit mb-1">
                    <ShieldAlert className="w-3 h-3" /> Pending evaluation
                  </span>
                  <h3 className="text-lg font-black tracking-tight text-neutral-900">Safety Intelligence Review</h3>
                </div>
                <button onClick={() => setSelectedReport(null)} className="text-zinc-400 hover:text-zinc-600 font-mono text-xs uppercase font-bold">dismiss Close</button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm leading-relaxed">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono uppercase opacity-50 tracking-wide font-black">Accused target user</label>
                    <p className="font-bold font-mono text-sm">{selectedReport.targetDisplayName}</p>
                    <p className="text-[10px] font-mono text-zinc-500">ID: {selectedReport.targetUserId}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono uppercase opacity-50 tracking-wide font-black">Intel intelligence source</label>
                    <p className="font-bold font-mono text-sm">{selectedReport.reporterUserId}</p>
                    <p className="text-[10px] font-mono text-indigo-600">{selectedReport.reporterEmail}</p>
                  </div>
                </div>

                {/* VRCHAT ACCOUNT SUBMISSION DETECTED */}
                {selectedReport.vrchatAccount && (
                  <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <label className="block text-[9px] font-mono uppercase tracking-wide font-black text-indigo-700">Detected VRChat Account field</label>
                        <p className="font-mono text-sm font-bold text-indigo-900">{selectedReport.vrchatAccount}</p>
                      </div>
                      <button 
                        onClick={() => {
                          setLinkingVRChatUser({ id: selectedReport.targetUserId, displayName: selectedReport.targetDisplayName });
                          setLinkVRChatUsername(selectedReport.vrchatAccount);
                          setLinkVRChatUserId(selectedReport.vrchatAccount.includes('usr_') ? selectedReport.vrchatAccount : '');
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-[9px] font-bold uppercase tracking-wide px-3 py-1.5 rounded"
                      >
                        Link VR Account now
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-[10px] font-mono uppercase opacity-50 tracking-wide font-black">reported violations reason</label>
                  <div className="p-4 bg-zinc-50 border border-zinc-200/60 rounded-xl max-h-[140px] overflow-y-auto font-serif italic text-zinc-800">
                    "{selectedReport.reason}"
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-mono uppercase opacity-50 tracking-wide font-black">evidence files dossier</label>
                  <div className="p-4 bg-zinc-50 border border-zinc-200/60 rounded-xl font-mono text-xs break-all text-zinc-600 max-h-[100px] overflow-y-auto">
                    {Array.isArray(selectedReport.evidenceLinks) 
                      ? selectedReport.evidenceLinks.filter(Boolean).join('\n') 
                      : (selectedReport.evidenceLinks || 'No files/links provided.')}
                  </div>
                </div>

                {Array.isArray(selectedReport.attachments) && selectedReport.attachments.length > 0 && (
                  <div className="space-y-2">
                    <label className="block text-[10px] font-mono uppercase font-black text-zinc-500 flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                      Uploaded Screenshot Evidence ({selectedReport.attachments.length})
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {selectedReport.attachments.map((img: string, idx: number) => (
                        <div 
                          key={idx} 
                          onClick={() => setSelectedImageModal(img)}
                          className="relative aspect-video bg-zinc-100 rounded-lg overflow-hidden border-2 border-[#141414] cursor-pointer group hover:opacity-80 transition-all shadow-[-2px_2px_0px_0px_rgba(20,20,20,1)]"
                        >
                          <img src={img} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-mono text-[10px] uppercase font-bold">
                            Zoom
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 py-5 bg-[#F9FAFB] border-t border-zinc-100 flex flex-wrap gap-3">
                <button 
                  onClick={() => handleClaimReport(selectedReport._id)}
                  className="py-3 px-4 bg-amber-500 hover:bg-amber-600 text-black font-mono font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 border-2 border-[#141414]"
                >
                  <BookmarkCheck className="w-4 h-4" /> Claim & Create Ticket
                </button>
                <button 
                  onClick={() => handleActionReport(selectedReport._id, 'reviewed')}
                  disabled={isActioningReport}
                  className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-mono font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow-md text-center disabled:opacity-50"
                >
                  {isActioningReport ? 'Processing...' : 'Approve Exclusion (Global Ban)'}
                </button>
                <button 
                  onClick={() => handleActionReport(selectedReport._id, 'dismissed')}
                  disabled={isActioningReport}
                  className="py-3 px-6 bg-white hover:bg-zinc-50 border border-zinc-300 text-zinc-700 font-mono font-black uppercase text-xs tracking-wider rounded-xl transition-all disabled:opacity-50"
                >
                  Dismiss Report
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* MODAL: APPEAL REVIEW */}
        {selectedAppeal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-zinc-200/90 flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-5 border-b border-zinc-100 flex justify-between items-center bg-[#F9FAFB]">
                <div>
                  <span className="text-[10px] font-mono bg-sky-50 text-indigo-700 pr-2 pl-2.5 py-0.5 rounded-md font-bold uppercase flex items-center gap-1.5 h-fit w-fit mb-1">
                    <MessageSquare className="w-3 h-3" /> Appeal evaluation
                  </span>
                  <h3 className="text-lg font-black tracking-tight text-neutral-900">Ban Appeal Evaluation</h3>
                </div>
                <button onClick={() => setSelectedAppeal(null)} className="text-zinc-400 hover:text-zinc-600 font-mono text-xs uppercase font-bold">dismiss Close</button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm leading-relaxed">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono uppercase opacity-50 tracking-wide font-black">Appelant identity</label>
                    <p className="font-bold font-mono text-sm">{selectedAppeal.userDisplayName}</p>
                    <p className="text-[10px] font-mono text-zinc-500">ID: {selectedAppeal.userId}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono uppercase opacity-50 tracking-wide font-black">Contact email address</label>
                    <p className="font-bold font-mono text-blue-600 text-sm">{selectedAppeal.email}</p>
                  </div>
                </div>

                {/* VRCHAT ACCOUNT SUBMISSION DETECTED */}
                {selectedAppeal.vrchatAccount && (
                  <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <label className="block text-[9px] font-mono uppercase tracking-wide font-black text-indigo-700">Attached VRChat Account</label>
                        <p className="font-mono text-sm font-bold text-indigo-900">{selectedAppeal.vrchatAccount}</p>
                      </div>
                      <button 
                        onClick={() => {
                          setLinkingVRChatUser({ id: selectedAppeal.userId, displayName: selectedAppeal.userDisplayName });
                          setLinkVRChatUsername(selectedAppeal.vrchatAccount);
                          setLinkVRChatUserId(selectedAppeal.vrchatAccount.includes('usr_') ? selectedAppeal.vrchatAccount : '');
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-[9px] font-bold uppercase tracking-wide px-3 py-1.5 rounded"
                      >
                        Link VR Account now
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono uppercase opacity-50 tracking-wide font-black">Original restriction reason</label>
                    <p className="text-xs italic text-red-600">"{selectedAppeal.originalBanReason || 'No record.'}"</p>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono uppercase opacity-50 tracking-wide font-black">Original offense evidence</label>
                    <p className="text-[10px] font-mono opacity-60 break-all">{selectedAppeal.evidence || 'None attached.'}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-mono uppercase opacity-50 tracking-wide font-black">Appelant's statement</label>
                  <div className="p-4 bg-zinc-50 border border-zinc-200/60 rounded-xl font-serif italic text-zinc-800">
                    "{selectedAppeal.reason}"
                  </div>
                </div>

                {/* ATTACHED EVIDENCE IMAGES */}
                {selectedAppeal.attachments && selectedAppeal.attachments.length > 0 && (
                  <div className="space-y-2">
                    <label className="block text-[10px] font-mono uppercase opacity-50 tracking-wide font-black">Submitted Evidence Images ({selectedAppeal.attachments.length})</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {selectedAppeal.attachments.map((imgUrl: string, idx: number) => (
                        <div 
                          key={idx}
                          onClick={() => setSelectedImageModal(imgUrl)}
                          className="relative aspect-video bg-zinc-100 rounded-lg overflow-hidden border border-zinc-200 cursor-pointer group hover:border-indigo-500 transition-all"
                        >
                          <img src={imgUrl} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-mono text-[10px] uppercase font-bold transition-opacity">
                            Zoom
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SEND MESSAGE INLINE WITH ATTACHMENTS */}
                <div className="pt-4 border-t border-zinc-100 space-y-3">
                  <label className="block text-[10px] font-mono uppercase opacity-50 tracking-wide font-black">Transmit secure response to appellant</label>
                  
                  {appealAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {appealAttachments.map((img, idx) => (
                        <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-zinc-300 group">
                          <img src={img} alt="Attachment" className="w-full h-full object-cover" />
                          <button 
                            type="button"
                            onClick={() => setAppealAttachments(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute top-0.5 right-0.5 bg-red-600 text-white p-0.5 rounded-full opacity-80 hover:opacity-100"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={appealMessage}
                        onChange={(e) => setAppealMessage(e.target.value)}
                        placeholder="Compose secure alert dispatch..."
                        className="flex-1 bg-zinc-50 border border-zinc-300 rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-500 focus:bg-white"
                      />
                      <button 
                        onClick={() => handleSendAppealMessage(selectedAppeal._id)}
                        disabled={isSendingMessage}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-xs font-bold uppercase tracking-wider px-5 rounded-xl disabled:opacity-50 transition-all flex items-center gap-1"
                      >
                        {isSendingMessage ? 'Sending...' : 'Send Message'}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-zinc-700 font-mono text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg flex items-center gap-1">
                        <Upload className="w-3 h-3" /> Upload Images
                        <input 
                          type="file" 
                          accept="image/*" 
                          multiple 
                          className="hidden" 
                          onChange={async (e) => {
                            const files = Array.from(e.target.files || []) as File[];
                            for (const file of files) {
                              const compressed = await compressImageFile(file);
                              if (compressed) {
                                setAppealAttachments(prev => [...prev, compressed]);
                              }
                            }
                          }}
                        />
                      </label>
                      <input 
                        type="url"
                        placeholder="Or paste image URL..."
                        value={appealUrlInput}
                        onChange={(e) => setAppealUrlInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && appealUrlInput.trim()) {
                            e.preventDefault();
                            setAppealAttachments(prev => [...prev, appealUrlInput.trim()]);
                            setAppealUrlInput('');
                          }
                        }}
                        className="flex-1 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1 text-[11px] font-mono focus:outline-none focus:border-indigo-500"
                      />
                      {appealUrlInput.trim() && (
                        <button 
                          type="button"
                          onClick={() => {
                            setAppealAttachments(prev => [...prev, appealUrlInput.trim()]);
                            setAppealUrlInput('');
                          }}
                          className="bg-zinc-800 text-white font-mono text-[10px] font-bold px-2.5 py-1.5 rounded-lg"
                        >
                          Add URL
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-5 bg-[#F9FAFB] border-t border-zinc-100 flex flex-wrap gap-3">
                <button 
                  onClick={() => handleClaimAppeal(selectedAppeal._id)}
                  className="py-3 px-4 bg-amber-500 hover:bg-amber-600 text-black font-mono font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 border-2 border-[#141414]"
                >
                  <BookmarkCheck className="w-4 h-4" /> Claim & Create Case
                </button>
                <button 
                  onClick={() => handleActionAppeal(selectedAppeal._id, 'approved')}
                  disabled={isActioningAppeal}
                  className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow-md text-center disabled:opacity-50"
                >
                  {isActioningAppeal ? 'Processing...' : 'Approve Appeal'}
                </button>
                <button 
                  onClick={() => handleActionAppeal(selectedAppeal._id, 'denied')}
                  disabled={isActioningAppeal}
                  className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-mono font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow-md text-center disabled:opacity-50"
                >
                  {isActioningAppeal ? 'Processing...' : 'Deny Appeal'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* MODAL: VERIFICATION AUDIT */}
        {selectedVerification && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl border border-zinc-200/90 flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-[#F9FAFB]">
                <div>
                  <h3 className="text-base font-black tracking-tight text-neutral-900">Verification Document Review</h3>
                  <p className="font-mono text-[9px] text-zinc-400">ID: {selectedVerification._id} | Snowflake: {selectedVerification.userId}</p>
                </div>
                <button onClick={() => setSelectedVerification(null)} className="text-zinc-400 hover:text-zinc-600 font-mono text-xs uppercase font-bold">dismiss Close</button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm bg-neutral-900 text-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block font-mono text-[9px] uppercase tracking-wider opacity-60">Submitted ID Document</label>
                    <div className="border border-white/10 rounded-xl overflow-hidden bg-black flex items-center justify-center min-h-[300px]">
                      <img src={selectedVerification.idPhoto} alt="ID" className="max-w-full max-h-[400px] object-contain" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block font-mono text-[9px] uppercase tracking-wider opacity-60">Submitted Face Photo</label>
                    <div className="border border-white/10 rounded-xl overflow-hidden bg-black flex items-center justify-center min-h-[300px]">
                      <img src={selectedVerification.facePhoto} alt="Face" className="max-w-full max-h-[400px] object-contain" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/5 font-mono">
                  <div className="space-y-1">
                    <label className="block text-[9px] uppercase opacity-50">Document Date of Birth</label>
                    <p className="text-xl font-bold tracking-tight text-indigo-400">{new Date(selectedVerification.dob).toLocaleDateString()}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <label className="block text-[9px] uppercase opacity-50">Transmitted</label>
                    <p className="text-xs text-stone-400">{new Date(selectedVerification.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-5 bg-[#F9FAFB] border-t border-zinc-100 flex gap-4">
                <button 
                  onClick={() => handleActionVerification(selectedVerification._id, 'approved')}
                  disabled={isActioningVerification}
                  className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-black uppercase text-xs tracking-wider rounded-xl shadow-md text-center disabled:opacity-50"
                >
                  {isActioningVerification ? 'Processing...' : 'Approve aged verification (Pass)'}
                </button>
                <button 
                  onClick={() => handleActionVerification(selectedVerification._id, 'rejected')}
                  disabled={isActioningVerification}
                  className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-mono font-black uppercase text-xs tracking-wider rounded-xl shadow-md text-center disabled:opacity-50"
                >
                  {isActioningVerification ? 'Processing...' : 'Reject & Delete request'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* MODAL: LINK VRCHAT ACCOUNT DIALOG */}
        {linkingVRChatUser && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-zinc-200/90 flex flex-col"
            >
              <div className="px-6 py-5 border-b border-zinc-100 flex justify-between items-center bg-[#F9FAFB]">
                <div>
                  <h3 className="text-base font-black tracking-tight text-neutral-900">Link VRChat Account Registry</h3>
                  <p className="font-mono text-[9px] text-zinc-400">Assoc User: {linkingVRChatUser.displayName || linkingVRChatUser.id}</p>
                </div>
                <button onClick={() => setLinkingVRChatUser(null)} className="text-zinc-400 hover:text-zinc-600 font-mono text-xs uppercase font-bold">Close</button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-xs text-zinc-500 leading-relaxed font-mono">
                  Input the precise VRChat User ID and Username. 
                  These will bind directly to their Discord Snowflake card.
                </p>

                <div className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-mono font-black uppercase opacity-65">VRChat User ID</label>
                    <input 
                      type="text" 
                      value={linkVRChatUserId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setLinkVRChatUserId(extractVRChatUserId(val));
                      }}
                      placeholder="usr_e6b219ed-2db0-4eaf-bc29-47ed2201b1cb or paste link"
                      className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-3.5 text-xs font-mono focus:outline-none focus:border-indigo-500 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-mono font-black uppercase opacity-65">VRChat Display/Profile Name</label>
                    <input 
                      type="text" 
                      value={linkVRChatUsername}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.includes('vrchat.com') || val.includes('usr_')) {
                          const extracted = extractVRChatUserId(val);
                          setLinkVRChatUsername(extracted);
                          if (!linkVRChatUserId) setLinkVRChatUserId(extracted);
                        } else {
                          setLinkVRChatUsername(val);
                        }
                      }}
                      placeholder="VRChat Username"
                      className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-3.5 text-xs font-mono focus:outline-none focus:border-indigo-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="px-6 py-5 bg-[#F9FAFB] border-t border-zinc-100 flex justify-end gap-3">
                <button 
                  onClick={() => setLinkingVRChatUser(null)}
                  className="py-2.5 px-4 bg-white border border-zinc-300 rounded-xl text-zinc-700 hover:bg-neutral-50 font-mono text-xs font-bold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConnectVRChatToUser}
                  disabled={isLinkingVRChat}
                  className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-mono text-xs font-bold uppercase tracking-wider disabled:opacity-50 shadow-md"
                >
                  {isLinkingVRChat ? 'Associating...' : 'Establish Connection'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* MODAL: CASE WORKSPACE */}
        {selectedCase && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl border-4 border-[#141414] flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b-2 border-[#141414] flex justify-between items-center bg-amber-50">
                <div className="flex items-center gap-3">
                  <FolderCheck className="w-6 h-6 text-indigo-700" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black tracking-tight text-[#141414] uppercase">
                        {selectedCase.caseType === 'report' ? 'Report Case' : 'Appeal Case'} #{selectedCase._id.slice(-6)} Workspace
                      </h3>
                      <span className={`px-2 py-0.5 font-mono text-[9px] font-bold uppercase rounded border border-[#141414] ${
                        selectedCase.status === 'claimed' ? 'bg-amber-200 text-amber-900' :
                        selectedCase.status === 'approved' || selectedCase.status === 'reviewed' ? 'bg-emerald-200 text-emerald-900' :
                        'bg-rose-200 text-rose-900'
                      }`}>
                        {selectedCase.status}
                      </span>
                    </div>
                    <p className="font-mono text-[10px] text-zinc-600">
                      Claimed by <span className="font-bold text-indigo-900">{selectedCase.claimedBy || 'Admin'}</span> on {new Date(selectedCase.claimedAt || selectedCase.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleUnclaimCase(selectedCase)}
                    className="px-2.5 py-1 bg-white hover:bg-zinc-100 border border-zinc-400 font-mono text-[10px] font-bold text-zinc-700 uppercase rounded transition-colors"
                    title="Relinquish case back to unassigned queue"
                  >
                    Unclaim Case
                  </button>
                  <button 
                    onClick={() => setSelectedCase(null)} 
                    className="p-1 text-zinc-500 hover:text-black font-mono text-xs uppercase font-bold"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm leading-relaxed">
                {/* Subject / Appellant Summary Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-zinc-50 border-2 border-[#141414] rounded-xl font-mono text-xs">
                  <div>
                    <label className="text-[9px] font-black uppercase text-zinc-400">
                      {selectedCase.caseType === 'report' ? 'Target Subject & Reporter' : 'Appellant'}
                    </label>
                    <p className="font-bold text-sm text-[#141414]">
                      {selectedCase.caseType === 'report' ? `Target Subject: ${selectedCase.userDisplayName || selectedCase.targetUserId}` : selectedCase.userDisplayName}
                    </p>
                    <p className="text-[10px] text-zinc-500">ID: {selectedCase.userId || selectedCase.targetUserId}</p>
                    <p className="text-[10px] text-indigo-600 mt-1">Contact Email: {selectedCase.email || selectedCase.reporterEmail}</p>
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-zinc-400">
                      {selectedCase.caseType === 'report' ? 'Reported Violation Info' : 'Ban & VRChat Info'}
                    </label>
                    <p className="text-[11px] text-red-600 italic">
                      {selectedCase.caseType === 'report' ? 'Violation Reason: ' : 'Ban Reason: '}
                      "{selectedCase.reason || selectedCase.originalBanReason || 'Unspecified'}"
                    </p>
                    {selectedCase.vrchatAccount && (
                      <p className="text-[11px] text-indigo-800 font-bold mt-1">VRChat: {selectedCase.vrchatAccount}</p>
                    )}
                  </div>
                </div>

                {/* Statement / Reason */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono uppercase font-black text-zinc-500">
                    {selectedCase.caseType === 'report' ? 'Submitted Report Statement' : 'Original Appeal Statement'}
                  </label>
                  <div className="p-4 bg-white border-2 border-zinc-300 rounded-xl font-serif italic text-zinc-800 leading-relaxed shadow-inner">
                    "{selectedCase.reason}"
                  </div>
                </div>

                {/* Submitted Evidence Attachments */}
                {selectedCase.attachments && selectedCase.attachments.length > 0 && (
                  <div className="space-y-2">
                    <label className="block text-[10px] font-mono uppercase font-black text-zinc-500 flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                      Applicant's Evidence Images ({selectedCase.attachments.length})
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {selectedCase.attachments.map((img: string, idx: number) => (
                        <div 
                          key={idx} 
                          onClick={() => setSelectedImageModal(img)}
                          className="relative aspect-video bg-zinc-100 rounded-lg overflow-hidden border-2 border-[#141414] cursor-pointer group hover:opacity-80 transition-all shadow-[-2px_2px_0px_0px_rgba(20,20,20,1)]"
                        >
                          <img src={img} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-mono text-[10px] uppercase font-bold">
                            Zoom
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Message Log */}
                <div className="space-y-3 pt-4 border-t-2 border-zinc-200">
                  <label className="block text-[10px] font-mono uppercase font-black text-zinc-500 flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                    Case Dispatch History ({selectedCase.messages ? selectedCase.messages.length : 0})
                  </label>

                  {(!selectedCase.messages || selectedCase.messages.length === 0) ? (
                    <div className="p-4 bg-zinc-50 border border-dashed border-zinc-300 rounded-xl text-center font-mono text-xs text-zinc-400">
                      No message exchanges recorded yet for this case.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[250px] overflow-y-auto p-1">
                      {selectedCase.messages.map((msg: any, idx: number) => {
                        const isAdmin = msg.senderRole === 'admin';
                        return (
                          <div key={idx} className={`p-3.5 rounded-xl border font-mono text-xs space-y-1.5 ${
                            isAdmin 
                              ? 'bg-indigo-50/70 border-indigo-200 ml-6' 
                              : 'bg-white border-zinc-200 mr-6 shadow-sm'
                          }`}>
                            <div className="flex justify-between items-center text-[10px] opacity-70">
                              <span className="font-bold uppercase text-zinc-800">{msg.senderName || (isAdmin ? 'Admin' : 'Appellant')}</span>
                              <span>{new Date(msg.createdAt).toLocaleString()}</span>
                            </div>
                            <p className="text-zinc-800 whitespace-pre-wrap">{msg.content}</p>

                            {/* Message Image Attachments */}
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="flex flex-wrap gap-2 pt-1">
                                {msg.attachments.map((attUrl: string, aIdx: number) => (
                                  <div 
                                    key={aIdx}
                                    onClick={() => setSelectedImageModal(attUrl)}
                                    className="w-16 h-16 rounded-lg overflow-hidden border border-zinc-300 cursor-pointer hover:opacity-80 transition-opacity"
                                  >
                                    <img src={attUrl} alt="Attachment" className="w-full h-full object-cover" />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Transmit Message and Multi-Image Attachments Box */}
                <div className="p-4 bg-zinc-50 border-2 border-[#141414] rounded-xl space-y-3">
                  <label className="block text-[10px] font-mono uppercase font-black text-zinc-700">
                    Send Case Response & Additional Evidence
                  </label>

                  {/* Attachment Previews */}
                  {caseAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-2 bg-white rounded-lg border border-zinc-200">
                      {caseAttachments.map((img, idx) => (
                        <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-zinc-300 group">
                          <img src={img} alt="Attachment" className="w-full h-full object-cover" />
                          <button 
                            type="button"
                            onClick={() => setCaseAttachments(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute top-0.5 right-0.5 bg-red-600 text-white p-0.5 rounded-full opacity-80 hover:opacity-100"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <textarea 
                    value={caseMessage}
                    onChange={(e) => setCaseMessage(e.target.value)}
                    placeholder="Compose message or update for appellant..."
                    className="w-full bg-white border-2 border-[#141414] rounded-lg p-3 text-xs font-mono focus:outline-none focus:shadow-[-2px_2px_0px_0px_rgba(20,20,20,1)] transition-all min-h-[70px]"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer bg-white hover:bg-zinc-100 border-2 border-[#141414] text-zinc-800 font-mono text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-[-2px_2px_0px_0px_rgba(20,20,20,1)] active:shadow-none transition-all">
                        <Upload className="w-3.5 h-3.5" /> Upload Images
                        <input 
                          type="file" 
                          accept="image/*" 
                          multiple 
                          className="hidden" 
                          onChange={async (e) => {
                            const files = Array.from(e.target.files || []) as File[];
                            for (const file of files) {
                              const compressed = await compressImageFile(file);
                              if (compressed) {
                                setCaseAttachments(prev => [...prev, compressed]);
                              }
                            }
                          }}
                        />
                      </label>

                      <input 
                        type="url"
                        placeholder="Or paste image URL..."
                        value={caseUrlInput}
                        onChange={(e) => setCaseUrlInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && caseUrlInput.trim()) {
                            e.preventDefault();
                            setCaseAttachments(prev => [...prev, caseUrlInput.trim()]);
                            setCaseUrlInput('');
                          }
                        }}
                        className="bg-white border-2 border-[#141414] rounded-lg px-3 py-1.5 text-[11px] font-mono focus:outline-none"
                      />
                      {caseUrlInput.trim() && (
                        <button 
                          type="button"
                          onClick={() => {
                            setCaseAttachments(prev => [...prev, caseUrlInput.trim()]);
                            setCaseUrlInput('');
                          }}
                          className="bg-[#141414] text-white font-mono text-[10px] font-bold px-3 py-1.5 rounded-lg"
                        >
                          Add URL
                        </button>
                      )}
                    </div>

                    <button 
                      onClick={() => handleSendCaseMessage(selectedCase)}
                      disabled={isSendingMessage || (!caseMessage.trim() && caseAttachments.length === 0)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-xs font-black uppercase tracking-wider px-5 py-2 rounded-lg border-2 border-[#141414] disabled:opacity-50 transition-all shadow-[-2px_2px_0px_0px_rgba(20,20,20,1)] active:shadow-none"
                    >
                      {isSendingMessage ? 'Transmitting...' : 'Transmit Message'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Case Final Decision Footer */}
              <div className="px-6 py-4 bg-[#F9FAFB] border-t-2 border-[#141414] flex flex-wrap gap-4">
                {selectedCase.caseType === 'report' ? (
                  <>
                    <button 
                      onClick={async () => {
                        await handleActionReport(selectedCase._id, 'reviewed');
                        setSelectedCase(null);
                        fetchCases();
                      }}
                      disabled={isActioningReport}
                      className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-mono font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow-md text-center disabled:opacity-50 border-2 border-[#141414]"
                    >
                      Approve Exclusion (Global Ban)
                    </button>
                    <button 
                      onClick={async () => {
                        await handleActionReport(selectedCase._id, 'dismissed');
                        setSelectedCase(null);
                        fetchCases();
                      }}
                      disabled={isActioningReport}
                      className="flex-1 py-3 px-4 bg-white hover:bg-zinc-100 border-2 border-[#141414] text-zinc-800 font-mono font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow-md text-center disabled:opacity-50"
                    >
                      Dismiss Report Case
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={async () => {
                        await handleActionAppeal(selectedCase._id, 'approved');
                        setSelectedCase(null);
                        fetchCases();
                      }}
                      disabled={isActioningAppeal}
                      className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow-md text-center disabled:opacity-50 border-2 border-[#141414]"
                    >
                      Approve Appeal (Pardon Restriction)
                    </button>
                    <button 
                      onClick={async () => {
                        await handleActionAppeal(selectedCase._id, 'denied');
                        setSelectedCase(null);
                        fetchCases();
                      }}
                      disabled={isActioningAppeal}
                      className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-mono font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow-md text-center disabled:opacity-50 border-2 border-[#141414]"
                    >
                      Deny Appeal (Confirm Restriction)
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* MODAL: IMAGE PREVIEW ZOOM OVERLAY */}
        {selectedImageModal && (
          <div 
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 cursor-zoom-out"
            onClick={() => setSelectedImageModal(null)}
          >
            <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-xl">
              <img src={selectedImageModal} alt="Zoomed view" className="max-w-full max-h-[85vh] object-contain" />
              <button 
                onClick={() => setSelectedImageModal(null)}
                className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white p-2 rounded-full border border-white/30"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* MODAL: REVOKE API KEY CONFIRMATION */}
        {revokingKey && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#1A1A1A] border-4 border-[#141414] dark:border-[#3F3F46] max-w-lg w-full p-6 space-y-5 shadow-[-8px_8px_0px_0px_rgba(20,20,20,1)] dark:shadow-[-8px_8px_0px_0px_rgba(255,255,255,0.1)] text-[#141414] dark:text-[#E4E3E0]"
            >
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <ShieldAlert className="w-5 h-5" />
                  <h3 className="font-mono text-base font-bold uppercase tracking-tight">Revoke Developer API Key</h3>
                </div>
                <button 
                  onClick={() => setRevokingKey(null)}
                  disabled={isRevokingKey}
                  className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-500 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-900/50 rounded-lg space-y-1">
                  <p className="font-bold text-red-900 dark:text-red-300 uppercase">Target Application:</p>
                  <p className="text-zinc-800 dark:text-zinc-200 font-bold text-sm">{revokingKey.botName}</p>
                  <p className="text-zinc-500 text-[11px]">Owner Snowflake: {revokingKey.botId}</p>
                  <p className="text-zinc-400 text-[10px] break-all">Key Token: {revokingKey.key.slice(0, 16)}••••••••</p>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] uppercase font-bold text-zinc-500">Revocation Reason:</label>
                  <textarea 
                    value={revocationReasonInput}
                    onChange={(e) => setRevocationReasonInput(e.target.value)}
                    rows={3}
                    placeholder="Enter reason for revocation (e.g. Terms violation, compromised token, decommissioned bot)..."
                    className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-900 border-2 border-[#141414] dark:border-[#3F3F46] text-xs font-mono focus:outline-none focus:ring-2 focus:ring-red-500 text-[#141414] dark:text-[#E4E3E0]"
                  />
                  <p className="text-[10px] text-zinc-400">This reason is permanently recorded in the audit log and returned if this key is used.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setRevokingKey(null)}
                  disabled={isRevokingKey}
                  className="flex-1 py-2.5 border-2 border-[#141414] dark:border-[#3F3F46] font-mono text-xs uppercase font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={() => handleRevokeApiKey(revokingKey.id, revocationReasonInput)}
                  disabled={isRevokingKey}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-mono text-xs uppercase font-black transition-colors flex items-center justify-center gap-2 shadow-[-3px_3px_0px_0px_rgba(20,20,20,1)] disabled:opacity-50 cursor-pointer"
                >
                  {isRevokingKey ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Revoking Key...
                    </>
                  ) : (
                    'Confirm Revocation'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
