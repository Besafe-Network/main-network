import React, { useState } from 'react';
import { 
  MessageSquare, 
  Gamepad2, 
  Share2, 
  ExternalLink, 
  Link as LinkIcon, 
  Unlink, 
  Check, 
  AlertCircle, 
  Copy, 
  RefreshCw, 
  Shield, 
  Sliders, 
  SlidersHorizontal,
  Server,
  Users,
  Terminal,
  Bot
} from 'lucide-react';
import { UserProfile } from '../../types';
import { VRChatGroupManager } from './VRChatGroupManager';

interface PlatformSettingsProps {
  profile: UserProfile | null;
  onProfileUpdated: (updated: UserProfile) => void;
  guilds?: any[];
  customBanlists?: any[];
  onSelectGuild?: (guild: any) => void;
}

export const PlatformSettings: React.FC<PlatformSettingsProps> = ({
  profile,
  onProfileUpdated,
  guilds = [],
  customBanlists = [],
  onSelectGuild
}) => {
  const [activeCategory, setActiveCategory] = useState<'discord' | 'vrchat'>('discord');

  // Discord Link state
  const [discordCodeInput, setDiscordCodeInput] = useState('');
  const [generatedWebCode, setGeneratedWebCode] = useState('');
  const [isLinkingDiscord, setIsLinkingDiscord] = useState(false);
  const [discordSuccess, setDiscordSuccess] = useState('');
  const [discordError, setDiscordError] = useState('');
  const [copiedWebCode, setCopiedWebCode] = useState(false);

  // VRChat Link state
  const [vrchatUserIdInput, setVrchatUserIdInput] = useState(profile?.vrchatUserId || '');
  const [vrchatUsernameInput, setVrchatUsernameInput] = useState(profile?.vrchatUsername || '');
  const [isLinkingVRChat, setIsLinkingVRChat] = useState(false);
  const [vrchatSuccess, setVrchatSuccess] = useState('');
  const [vrchatError, setVrchatError] = useState('');

  // --- Discord Handlers ---
  const handleGenerateWebCode = async () => {
    setDiscordError('');
    setDiscordSuccess('');
    try {
      const token = localStorage.getItem('gg_token') || localStorage.getItem('adminToken') || '';
      const res = await fetch('/api/user/generate-link-code', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate link code');
      setGeneratedWebCode(data.code);
    } catch (err: any) {
      setDiscordError(err.message || 'Error generating link code');
    }
  };

  const handleLinkDiscordCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discordCodeInput.trim()) return;
    setIsLinkingDiscord(true);
    setDiscordError('');
    setDiscordSuccess('');
    try {
      const token = localStorage.getItem('gg_token') || localStorage.getItem('adminToken') || '';
      const res = await fetch('/api/user/link-discord', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code: discordCodeInput.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to link Discord account');
      
      setDiscordSuccess('Discord account linked successfully!');
      setDiscordCodeInput('');
      if (profile) {
        onProfileUpdated({ ...profile, discordId: data.discordId });
      }
    } catch (err: any) {
      setDiscordError(err.message || 'Linking failed');
    } finally {
      setIsLinkingDiscord(false);
    }
  };

  const handleUnlinkDiscord = async () => {
    if (!confirm('Are you sure you want to unlink your Discord account?')) return;
    try {
      const token = localStorage.getItem('gg_token') || localStorage.getItem('adminToken') || '';
      const res = await fetch('/api/user/unlink-discord', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to unlink Discord');
      setDiscordSuccess('Discord account unlinked.');
      if (profile) {
        onProfileUpdated({ ...profile, discordId: null });
      }
    } catch (err: any) {
      setDiscordError(err.message || 'Unlink failed');
    }
  };

  // --- VRChat Handlers ---
  const handleLinkVRChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vrchatUserIdInput.trim()) {
      setVrchatError('Please provide your VRChat User ID (starts with usr_)');
      return;
    }
    setIsLinkingVRChat(true);
    setVrchatError('');
    setVrchatSuccess('');
    try {
      const token = localStorage.getItem('gg_token') || localStorage.getItem('adminToken') || '';
      const res = await fetch('/api/user/link-vrchat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          vrchatUserId: vrchatUserIdInput.trim(),
          vrchatUsername: vrchatUsernameInput.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to link VRChat identity');
      setVrchatSuccess('VRChat identity connected successfully!');
      if (profile) {
        onProfileUpdated({
          ...profile,
          vrchatUserId: vrchatUserIdInput.trim(),
          vrchatUsername: vrchatUsernameInput.trim()
        });
      }
    } catch (err: any) {
      setVrchatError(err.message || 'Failed to link VRChat');
    } finally {
      setIsLinkingVRChat(false);
    }
  };

  const handleUnlinkVRChat = async () => {
    if (!confirm('Disconnect your VRChat identity from this profile?')) return;
    try {
      const token = localStorage.getItem('gg_token') || localStorage.getItem('adminToken') || '';
      const res = await fetch('/api/user/unlink-vrchat', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to unlink VRChat');
      setVrchatSuccess('VRChat identity disconnected.');
      setVrchatUserIdInput('');
      setVrchatUsernameInput('');
      if (profile) {
        onProfileUpdated({
          ...profile,
          vrchatUserId: '',
          vrchatUsername: ''
        });
      }
    } catch (err: any) {
      setVrchatError(err.message || 'Failed to unlink');
    }
  };

  return (
    <div className="space-y-6">
      {/* Category Selection Tabs - Mobile Friendly horizontal scroll */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveCategory('discord')}
          type="button"
          className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeCategory === 'discord'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Discord Settings</span>
          {profile?.discordId && (
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          )}
        </button>

        <button
          onClick={() => setActiveCategory('vrchat')}
          type="button"
          className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeCategory === 'vrchat'
              ? 'bg-emerald-600 text-zinc-950 shadow-lg shadow-emerald-950 font-black'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Gamepad2 className="w-4 h-4" />
          <span>VRChat Settings & Groups</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-emerald-300">
            Standalone
          </span>
        </button>
      </div>

      {/* DISCORD CATEGORY */}
      {activeCategory === 'discord' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 rounded-2xl p-5 sm:p-6 border border-zinc-800 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-indigo-400" />
                  Discord Account Connection
                </h3>
                <p className="text-xs text-zinc-400 font-mono">
                  Link your Discord account to sync roles, access protected servers, and receive security alerts.
                </p>
              </div>

              {profile?.discordId ? (
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-indigo-950 border border-indigo-700 text-indigo-300 font-mono text-xs font-bold flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-indigo-400" />
                    ID: {profile.discordId}
                  </span>
                  <button
                    onClick={handleUnlinkDiscord}
                    className="px-3 py-1 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 font-mono text-xs font-bold transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <span className="px-3 py-1 rounded-xl bg-zinc-800 text-zinc-400 font-mono text-xs">
                  Not Connected
                </span>
              )}
            </div>

            {discordError && (
              <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 font-mono text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {discordError}
              </div>
            )}

            {discordSuccess && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-xl text-emerald-300 font-mono text-xs flex items-center gap-2">
                <Check className="w-4 h-4 flex-shrink-0" />
                {discordSuccess}
              </div>
            )}

            {/* Linking Methods */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Method 1: Web Code */}
              <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700/60 space-y-3">
                <h4 className="font-mono text-xs font-bold uppercase text-indigo-300 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4" />
                  Option 1: Generate Link Code
                </h4>
                <p className="text-xs text-zinc-400">
                  Generate a temporary code here, then type <code className="px-1.5 py-0.5 rounded bg-zinc-800 text-white font-mono text-xs">/link code: DASH-...</code> in any Discord server running the BeSafe Network bot.
                </p>

                {generatedWebCode ? (
                  <div className="space-y-2">
                    <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-700 flex items-center justify-between">
                      <span className="font-mono text-sm font-bold text-emerald-400 tracking-wider">
                        {generatedWebCode}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(generatedWebCode);
                          setCopiedWebCode(true);
                          setTimeout(() => setCopiedWebCode(false), 2000);
                        }}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono flex items-center gap-1"
                      >
                        {copiedWebCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedWebCode ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <p className="text-[10px] text-zinc-500 font-mono">
                      Run in Discord: <span className="text-zinc-300">/link code: {generatedWebCode}</span>
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={handleGenerateWebCode}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold transition-colors"
                  >
                    Generate Link Code
                  </button>
                )}
              </div>

              {/* Method 2: Enter Discord Code */}
              <form onSubmit={handleLinkDiscordCode} className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700/60 space-y-3">
                <h4 className="font-mono text-xs font-bold uppercase text-indigo-300 flex items-center gap-1.5">
                  <LinkIcon className="w-4 h-4" />
                  Option 2: Enter Code from Discord
                </h4>
                <p className="text-xs text-zinc-400">
                  Ran <code className="px-1.5 py-0.5 rounded bg-zinc-800 text-white font-mono text-xs">/link</code> in Discord and received a code? Paste it below to connect:
                </p>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={discordCodeInput}
                    onChange={(e) => setDiscordCodeInput(e.target.value)}
                    placeholder="Enter code from Discord (e.g. LINK-XYZ)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={isLinkingDiscord || !discordCodeInput.trim()}
                    className="w-full py-2.5 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white font-mono text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    {isLinkingDiscord ? 'Linking...' : 'Connect Discord Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Linked Servers Node Tree */}
          <div className="bg-zinc-900 rounded-2xl p-5 sm:p-6 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Server className="w-5 h-5 text-indigo-400" />
                  Connected Discord Servers ({guilds.length})
                </h3>
                <p className="text-xs text-zinc-400 font-mono">
                  Servers where BeSafe Network bot is operating and protecting members.
                </p>
              </div>

              <a
                href="https://discord.com/oauth2/authorize?client_id=1480627580636893356"
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>+ Add Bot to Server</span>
              </a>
            </div>

            {guilds.length === 0 ? (
              <div className="p-6 text-center bg-zinc-800/40 rounded-xl border border-dashed border-zinc-800 text-zinc-500 font-mono text-xs">
                No Discord servers currently linked to this dashboard.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {guilds.map((g) => (
                  <div
                    key={g.id}
                    onClick={() => onSelectGuild && onSelectGuild(g)}
                    className="p-4 rounded-xl bg-zinc-800/60 border border-zinc-700 hover:border-indigo-500 cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div className="space-y-1 max-w-[80%]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm text-white truncate group-hover:text-indigo-300 transition-colors">
                          {g.name || `Server ${g.id}`}
                        </h4>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-700/80 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Shard #{g.shardId ?? 0}
                        </span>
                      </div>
                      <p className="font-mono text-[11px] text-zinc-400 truncate">ID: {g.id}</p>
                      <p className="font-mono text-[10px] text-emerald-400/90 truncate">
                        {g.settings?.customBotEnabled && g.settings?.customBotToken
                          ? (g.settings?.customBotActivityText || 'Keeping you safe with love ❤️')
                          : 'Keeping you safe with love ❤️'}
                      </p>
                      {g.settings?.vrchatBotEnabled && (
                        <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                          VRChat Bot Active
                        </span>
                      )}
                    </div>
                    <span className="text-zinc-600 group-hover:text-zinc-300">→</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VRCHAT CATEGORY */}
      {activeCategory === 'vrchat' && (
        <div className="space-y-6">
          {/* Identity Link Card */}
          <div className="bg-zinc-900 rounded-2xl p-5 sm:p-6 border border-zinc-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5 text-emerald-400" />
                  VRChat Account Connection
                </h3>
                <p className="text-xs text-zinc-400 font-mono">
                  Link your personal VRChat User ID to display your verified status and reputation badges.
                </p>
              </div>

              {profile?.vrchatUserId ? (
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-emerald-950 border border-emerald-700 text-emerald-300 font-mono text-xs font-bold flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    {profile.vrchatUsername || profile.vrchatUserId}
                  </span>
                  <button
                    onClick={handleUnlinkVRChat}
                    className="px-3 py-1 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 font-mono text-xs font-bold transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <span className="px-3 py-1 rounded-xl bg-zinc-800 text-zinc-400 font-mono text-xs">
                  Not Connected
                </span>
              )}
            </div>

            {vrchatError && (
              <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 font-mono text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {vrchatError}
              </div>
            )}

            {vrchatSuccess && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-xl text-emerald-300 font-mono text-xs flex items-center gap-2">
                <Check className="w-4 h-4 flex-shrink-0" />
                {vrchatSuccess}
              </div>
            )}

            <form onSubmit={handleLinkVRChat} className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block font-mono text-[11px] text-zinc-400 uppercase font-semibold mb-1">
                  VRChat User ID (usr_...)
                </label>
                <input
                  type="text"
                  value={vrchatUserIdInput}
                  onChange={(e) => setVrchatUserIdInput(e.target.value)}
                  placeholder="usr_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-mono text-[11px] text-zinc-400 uppercase font-semibold mb-1">
                  VRChat Username
                </label>
                <input
                  type="text"
                  value={vrchatUsernameInput}
                  onChange={(e) => setVrchatUsernameInput(e.target.value)}
                  placeholder="Display Name in VRChat"
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isLinkingVRChat}
                  className="w-full py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-mono text-xs font-bold transition-all disabled:opacity-50 shadow-md"
                >
                  {isLinkingVRChat ? 'Saving...' : 'Save VRChat Account'}
                </button>
              </div>
            </form>
          </div>

          {/* Standalone VRChat Group Protection Manager (NO DISCORD REQUIRED) */}
          <VRChatGroupManager customBanlists={customBanlists} />
        </div>
      )}
    </div>
  );
};
