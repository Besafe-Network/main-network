import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Bot, 
  Users, 
  ExternalLink, 
  CheckCircle2, 
  Sparkles, 
  Globe, 
  ArrowRight, 
  Filter, 
  Lock, 
  Zap, 
  Layers, 
  Cpu, 
  SlidersHorizontal,
  Server,
  Radio,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';

interface ProtectedDiscordServer {
  id: string;
  name: string;
  iconUrl?: string;
  category: string;
  description: string;
  inviteUrl?: string;
  memberCount: number;
  features: string[];
  isProtected: boolean;
  updatedAt?: string;
  linkedVRChatGroup?: {
    groupId: string;
    groupName: string;
    shortCode?: string;
    iconUrl?: string;
    joinUrl?: string;
    memberCount?: number;
  };
}

interface ProtectedVRChatGroup {
  groupId: string;
  groupName: string;
  shortCode?: string;
  iconUrl?: string;
  bannerUrl?: string;
  category: string;
  description: string;
  joinUrl?: string;
  memberCount: number;
  features: string[];
  isProtected: boolean;
  linkedDiscordServer?: {
    id: string;
    name: string;
    iconUrl?: string;
    inviteUrl?: string;
    memberCount?: number;
  };
}

interface ApiPartnerBot {
  _id: string;
  name: string;
  platform: 'discord' | 'vrchat' | 'multi';
  description: string;
  avatarUrl?: string;
  inviteUrl?: string;
  websiteUrl?: string;
  authorName: string;
  apiScopes: string[];
  apiUsageDetails: string;
  serversCount: number;
  usersProtected: number;
  isVerified: boolean;
  isListed: boolean;
}

export default function ProtectedNetwork() {
  const [activeTab, setActiveTab] = useState<'communities' | 'bots'>('communities');
  const [communityPlatformFilter, setCommunityPlatformFilter] = useState<'all' | 'discord' | 'vrchat'>('all');
  const [botPlatformFilter, setBotPlatformFilter] = useState<'all' | 'discord' | 'vrchat' | 'multi'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const [discordServers, setDiscordServers] = useState<ProtectedDiscordServer[]>([]);
  const [vrchatGroups, setVrchatGroups] = useState<ProtectedVRChatGroup[]>([]);
  const [bots, setBots] = useState<ApiPartnerBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = "Protected Network & API Bots | BeSafe Network";
    fetchDirectoryData();
  }, []);

  const fetchDirectoryData = async () => {
    setLoading(true);
    setError('');
    try {
      const [commRes, botRes] = await Promise.all([
        fetch('/api/public/protected-communities'),
        fetch('/api/public/bots')
      ]);

      if (commRes.ok) {
        const commData = await commRes.json();
        setDiscordServers(commData.discordServers || []);
        setVrchatGroups(commData.vrchatGroups || []);
      }

      if (botRes.ok) {
        const botData = await botRes.json();
        setBots(botData.bots || []);
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to load community and bot directory.');
    } finally {
      setLoading(false);
    }
  };

  // Categories extracted from communities
  const allCategories = Array.from(new Set([
    ...discordServers.map(s => s.category).filter(Boolean),
    ...vrchatGroups.map(g => g.category).filter(Boolean)
  ]));

  // Filtering communities
  const filteredDiscord = discordServers.filter(s => {
    if (communityPlatformFilter === 'vrchat') return false;
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (s.linkedVRChatGroup && (
                            s.linkedVRChatGroup.groupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (s.linkedVRChatGroup.shortCode && s.linkedVRChatGroup.shortCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            s.linkedVRChatGroup.groupId.toLowerCase().includes(searchTerm.toLowerCase())
                          ));
    const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredVRChat = vrchatGroups.filter(g => {
    if (communityPlatformFilter === 'discord') return false;
    const matchesSearch = g.groupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          g.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          g.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (g.shortCode && g.shortCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          g.groupId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (g.linkedDiscordServer && (
                            g.linkedDiscordServer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            g.linkedDiscordServer.id.includes(searchTerm)
                          ));
    const matchesCategory = selectedCategory === 'all' || g.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Filtering bots
  const filteredBots = bots.filter(b => {
    const matchesPlatform = botPlatformFilter === 'all' || b.platform === botPlatformFilter;
    const matchesSearch = b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          b.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          b.authorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          b.apiUsageDetails.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          b.apiScopes.some(scope => scope.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesPlatform && matchesSearch;
  });

  const totalMembersProtected = discordServers.reduce((sum, s) => sum + (s.memberCount || 0), 0) +
                                 vrchatGroups.reduce((sum, g) => sum + (g.memberCount || 0), 0);

  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-24">
      {/* Hero Header */}
      <section className="relative overflow-hidden bg-[#141414] text-white p-8 sm:p-14 border-4 border-[#141414] shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-emerald-500 text-black px-3 py-1 font-mono text-[10px] uppercase font-black tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
              Live Safety Network
            </span>
            <span className="bg-white/10 text-white/90 border border-white/20 px-3 py-1 font-mono text-[10px] uppercase font-bold tracking-wider">
              Verified Communities & API Bots
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tighter italic">
              Protected Communities <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
                & API Partner Bots
              </span>
            </h1>
            <p className="max-w-3xl font-mono text-xs sm:text-sm text-zinc-300 uppercase tracking-wider leading-relaxed">
              Explore the growing network of Discord servers, VRChat groups, and certified API partner bots actively guarded by the BeSafe Network. Server and group owners can toggle their listing anytime from the Dashboard.
            </p>
          </div>

          {/* Quick Stats Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-4 border-t border-white/10">
            <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
              <span className="block font-mono text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Discord Servers</span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-blue-400">{discordServers.length}</span>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
              <span className="block font-mono text-[9px] uppercase tracking-widest text-zinc-400 font-bold">VRChat Groups</span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">{vrchatGroups.length}</span>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
              <span className="block font-mono text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Certified API Bots</span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-purple-400">{bots.length}</span>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
              <span className="block font-mono text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Users In Network</span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
                {totalMembersProtected > 0 ? (totalMembersProtected / 1000).toFixed(1) + 'k+' : '50k+'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Tabs Navigation */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b-4 border-[#141414] dark:border-zinc-700 pb-4">
        <div className="flex gap-2">
          <button
            onClick={() => { setActiveTab('communities'); setSearchTerm(''); }}
            className={`px-6 py-3 font-mono text-xs sm:text-sm font-bold uppercase tracking-wider transition-all border-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'communities'
                ? 'bg-[#141414] dark:bg-zinc-100 text-white dark:text-[#141414] border-[#141414] dark:border-zinc-100 shadow-[-4px_4px_0px_0px_rgba(20,20,20,1)] dark:shadow-[-4px_4px_0px_0px_rgba(255,255,255,0.2)]'
                : 'bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[#141414] dark:text-zinc-200 border-[#141414] dark:border-zinc-700'
            }`}
          >
            <Server className="w-4 h-4 text-blue-500" />
            <span>Protected Communities ({discordServers.length + vrchatGroups.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('bots'); setSearchTerm(''); }}
            className={`px-6 py-3 font-mono text-xs sm:text-sm font-bold uppercase tracking-wider transition-all border-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'bots'
                ? 'bg-[#141414] dark:bg-zinc-100 text-white dark:text-[#141414] border-[#141414] dark:border-zinc-100 shadow-[-4px_4px_0px_0px_rgba(20,20,20,1)] dark:shadow-[-4px_4px_0px_0px_rgba(255,255,255,0.2)]'
                : 'bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[#141414] dark:text-zinc-200 border-[#141414] dark:border-zinc-700'
            }`}
          >
            <Bot className="w-4 h-4 text-purple-500" />
            <span>API Partner Bots ({bots.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/dashboard"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors rounded shadow"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Toggle Community Listing (Owner)</span>
          </Link>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white dark:bg-zinc-900 border-2 border-[#141414] dark:border-zinc-700 p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] dark:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder={activeTab === 'communities' ? "Search communities by name, category, or description..." : "Search API bots by name, scope, author, or integration..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-mono text-xs focus:outline-none focus:border-indigo-600 text-[#141414] dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
          />
        </div>

        {/* Platform Sub-Filters */}
        {activeTab === 'communities' ? (
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 mr-1">Platform:</span>
            <button
              onClick={() => setCommunityPlatformFilter('all')}
              className={`px-3 py-1.5 uppercase font-bold border transition-colors ${
                communityPlatformFilter === 'all'
                  ? 'bg-[#141414] dark:bg-zinc-200 text-white dark:text-zinc-950 border-[#141414] dark:border-zinc-200'
                  : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              All ({discordServers.length + vrchatGroups.length})
            </button>
            <button
              onClick={() => setCommunityPlatformFilter('discord')}
              className={`px-3 py-1.5 uppercase font-bold border flex items-center gap-1.5 transition-colors ${
                communityPlatformFilter === 'discord'
                  ? 'bg-[#5865F2] text-white border-[#5865F2]'
                  : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              <span>Discord</span> ({discordServers.length})
            </button>
            <button
              onClick={() => setCommunityPlatformFilter('vrchat')}
              className={`px-3 py-1.5 uppercase font-bold border flex items-center gap-1.5 transition-colors ${
                communityPlatformFilter === 'vrchat'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              <span>VRChat</span> ({vrchatGroups.length})
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 mr-1">Platform:</span>
            <button
              onClick={() => setBotPlatformFilter('all')}
              className={`px-3 py-1.5 uppercase font-bold border transition-colors ${
                botPlatformFilter === 'all'
                  ? 'bg-[#141414] dark:bg-zinc-200 text-white dark:text-zinc-950 border-[#141414] dark:border-zinc-200'
                  : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              All ({bots.length})
            </button>
            <button
              onClick={() => setBotPlatformFilter('discord')}
              className={`px-3 py-1.5 uppercase font-bold border transition-colors ${
                botPlatformFilter === 'discord'
                  ? 'bg-[#5865F2] text-white border-[#5865F2]'
                  : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              Discord
            </button>
            <button
              onClick={() => setBotPlatformFilter('vrchat')}
              className={`px-3 py-1.5 uppercase font-bold border transition-colors ${
                botPlatformFilter === 'vrchat'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              VRChat
            </button>
            <button
              onClick={() => setBotPlatformFilter('multi')}
              className={`px-3 py-1.5 uppercase font-bold border transition-colors ${
                botPlatformFilter === 'multi'
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              Multi-Platform
            </button>
          </div>
        )}
      </div>

      {/* Category Pills (Communities Tab) */}
      {activeTab === 'communities' && allCategories.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-mono uppercase font-bold text-zinc-400 dark:text-zinc-500">Categories:</span>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 text-[10px] font-mono uppercase font-bold rounded-full transition-colors cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700'
            }`}
          >
            All Categories
          </button>
          {allCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 text-[10px] font-mono uppercase font-bold rounded-full transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Loading & Error States */}
      {loading && (
        <div className="py-24 text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#141414] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-mono text-xs uppercase tracking-widest font-bold">Querying Protected Network Directory...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border-l-4 border-red-600 p-6 text-red-900 font-mono text-sm uppercase font-bold">
          {error}
        </div>
      )}

      {/* TAB 1: PROTECTED COMMUNITIES */}
      {!loading && activeTab === 'communities' && (
        <div className="space-y-12">
          {/* Discord Servers Section */}
          {(communityPlatformFilter === 'all' || communityPlatformFilter === 'discord') && filteredDiscord.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b-2 border-[#141414] dark:border-zinc-700 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-[#5865F2] rounded-full inline-block" />
                  <h2 className="font-mono text-lg font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100">
                    Protected Discord Servers ({filteredDiscord.length})
                  </h2>
                </div>
                <span className="font-mono text-[10px] uppercase text-zinc-400 dark:text-zinc-500 font-bold">Synchronized Ban Enforcement</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDiscord.map((server) => (
                  <div
                    key={server.id}
                    className="bg-white dark:bg-zinc-900 border-2 border-[#141414] dark:border-zinc-700 p-6 flex flex-col justify-between shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] dark:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.5)] hover:translate-x-1 hover:-translate-y-1 transition-all"
                  >
                    <div className="space-y-4">
                      {/* Server Card Header */}
                      <div className="flex items-start gap-4">
                        <img
                          src={server.iconUrl || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                          alt={server.name}
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://cdn.discordapp.com/embed/avatars/0.png'; }}
                          className="w-14 h-14 rounded-xl border-2 border-[#141414] dark:border-zinc-700 object-cover shrink-0 bg-zinc-100 dark:bg-zinc-800"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <span className="bg-[#5865F2] text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase">
                              Discord
                            </span>
                            {server.linkedVRChatGroup && (
                              <span className="bg-emerald-600 text-white text-[8px] font-mono font-black px-1.5 py-0.5 rounded uppercase flex items-center gap-1 shadow-sm">
                                <span>🎮 VRChat Linked</span>
                                {server.linkedVRChatGroup.shortCode && <span className="opacity-90">({server.linkedVRChatGroup.shortCode})</span>}
                              </span>
                            )}
                            <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 text-[8px] font-mono font-black px-1.5 py-0.5 rounded uppercase flex items-center gap-1">
                              <ShieldCheck className="w-2.5 h-2.5" />
                              Protected
                            </span>
                          </div>
                          <h3 className="font-black text-lg uppercase tracking-tight truncate text-[#141414] dark:text-white">
                            {server.name}
                          </h3>
                          <span className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400 font-bold">
                            {server.category}
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="font-sans text-xs text-zinc-600 dark:text-zinc-400 line-clamp-3 leading-relaxed">
                        {server.description || 'Community defended by the BeSafe Network.'}
                      </p>

                      {/* Linked VRChat Group Callout */}
                      {server.linkedVRChatGroup && (
                        <div className="bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500/40 dark:border-emerald-700/60 p-3 rounded-xl flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {server.linkedVRChatGroup.iconUrl ? (
                              <img
                                src={server.linkedVRChatGroup.iconUrl}
                                alt=""
                                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                className="w-8 h-8 rounded-lg object-cover border border-emerald-600/40 shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold font-mono text-xs shrink-0 shadow">VR</div>
                            )}
                            <div className="min-w-0">
                              <span className="text-[9px] font-mono uppercase font-black text-emerald-800 dark:text-emerald-300 block tracking-wider leading-none">
                                Linked VRChat Group
                              </span>
                              <p className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate mt-0.5">
                                {server.linkedVRChatGroup.groupName}
                              </p>
                            </div>
                          </div>
                          {server.linkedVRChatGroup.joinUrl && (
                            <a
                              href={server.linkedVRChatGroup.joinUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] font-mono font-black uppercase px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shrink-0 flex items-center gap-1 shadow transition-all hover:scale-105"
                            >
                              <span>Open</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      )}

                      {/* Feature Pills */}
                      {server.features && server.features.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                          {server.features.map((feat, idx) => (
                            <span
                              key={idx}
                              className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-[9px] font-mono font-bold px-2 py-0.5 rounded flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                              {feat}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Footer / Join CTA */}
                    <div className="pt-6 mt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 font-mono text-[11px] font-bold">
                        <Users className="w-3.5 h-3.5" />
                        <span>{server.memberCount ? `${server.memberCount.toLocaleString()} Members` : 'Active'}</span>
                      </div>

                      {server.inviteUrl ? (
                        <a
                          href={server.inviteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-[#5865F2] hover:bg-[#4752c4] text-white px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider rounded flex items-center gap-1.5 transition-colors shadow"
                        >
                          <span>Join Server</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-bold">Private / Protected</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VRChat Groups Section */}
          {(communityPlatformFilter === 'all' || communityPlatformFilter === 'vrchat') && filteredVRChat.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b-2 border-[#141414] dark:border-zinc-700 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-emerald-600 rounded-full inline-block" />
                  <h2 className="font-mono text-lg font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100">
                    Protected VRChat Groups ({filteredVRChat.length})
                  </h2>
                </div>
                <span className="font-mono text-[10px] uppercase text-zinc-400 dark:text-zinc-500 font-bold">Automated 2FA Blacklist Eviction</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVRChat.map((group) => (
                  <div
                    key={group.groupId}
                    className="bg-white dark:bg-zinc-900 border-2 border-[#141414] dark:border-zinc-700 p-6 flex flex-col justify-between shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] dark:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.5)] hover:translate-x-1 hover:-translate-y-1 transition-all"
                  >
                    <div className="space-y-4">
                      {/* VRC Card Header */}
                      <div className="flex items-start gap-4">
                        <img
                          src={group.iconUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80'}
                          alt={group.groupName}
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80'; }}
                          className="w-14 h-14 rounded-xl border-2 border-[#141414] dark:border-zinc-700 object-cover shrink-0 bg-zinc-100 dark:bg-zinc-800"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <span className="bg-emerald-600 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase">
                              VRChat Group
                            </span>
                            {group.shortCode && (
                              <span className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-[8px] font-mono font-black px-1.5 py-0.5 rounded uppercase">
                                {group.shortCode}
                              </span>
                            )}
                            {group.linkedDiscordServer && (
                              <span className="bg-[#5865F2] text-white text-[8px] font-mono font-black px-1.5 py-0.5 rounded uppercase flex items-center gap-1 shadow-sm">
                                <span>💬 Discord Linked</span>
                              </span>
                            )}
                          </div>
                          <h3 className="font-black text-lg uppercase tracking-tight truncate text-[#141414] dark:text-white">
                            {group.groupName}
                          </h3>
                          <span className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400 font-bold">
                            {group.category}
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="font-sans text-xs text-zinc-600 dark:text-zinc-400 line-clamp-3 leading-relaxed">
                        {group.description || 'Verified VRChat group actively protected against known exploiters.'}
                      </p>

                      {/* Linked Discord Server Callout */}
                      {group.linkedDiscordServer && (
                        <div className="bg-indigo-50 dark:bg-indigo-950/40 border-2 border-indigo-500/40 dark:border-indigo-700/60 p-3 rounded-xl flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {group.linkedDiscordServer.iconUrl ? (
                              <img
                                src={group.linkedDiscordServer.iconUrl}
                                alt=""
                                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                className="w-8 h-8 rounded-lg object-cover border border-indigo-600/40 shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-[#5865F2] text-white flex items-center justify-center font-bold font-mono text-xs shrink-0 shadow">DC</div>
                            )}
                            <div className="min-w-0">
                              <span className="text-[9px] font-mono uppercase font-black text-indigo-800 dark:text-indigo-300 block tracking-wider leading-none">
                                Linked Discord Community
                              </span>
                              <p className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate mt-0.5">
                                {group.linkedDiscordServer.name}
                              </p>
                            </div>
                          </div>
                          {group.linkedDiscordServer.inviteUrl && (
                            <a
                              href={group.linkedDiscordServer.inviteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] font-mono font-black uppercase px-2.5 py-1 bg-[#5865F2] hover:bg-[#4752c4] text-white rounded-lg shrink-0 flex items-center gap-1 shadow transition-all hover:scale-105"
                            >
                              <span>Join</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      )}

                      {/* Feature Pills */}
                      <div className="flex flex-wrap gap-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                        {group.features.map((feat, idx) => (
                          <span
                            key={idx}
                            className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[9px] font-mono font-bold px-2 py-0.5 rounded flex items-center gap-1"
                          >
                            <ShieldCheck className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                            {feat}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Footer / Join CTA */}
                    <div className="pt-6 mt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 font-mono text-[11px] font-bold">
                        <Users className="w-3.5 h-3.5" />
                        <span>{group.memberCount ? `${group.memberCount.toLocaleString()} Members` : 'Protected'}</span>
                      </div>

                      {group.joinUrl ? (
                        <a
                          href={group.joinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider rounded flex items-center gap-1.5 transition-colors shadow"
                        >
                          <span>Open Group</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-bold">ID: {group.groupId}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredDiscord.length === 0 && filteredVRChat.length === 0 && (
            <div className="py-20 text-center border-2 border-dashed border-[#141414]/30 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/60 p-8 space-y-3">
              <Server className="w-12 h-12 mx-auto text-zinc-400 dark:text-zinc-500" />
              <h4 className="font-mono text-sm uppercase tracking-wider font-black text-zinc-800 dark:text-zinc-200">
                {searchTerm || selectedCategory !== 'all' || communityPlatformFilter !== 'all'
                  ? 'No protected communities match your search filters.'
                  : 'No communities currently listed in the public directory.'}
              </h4>
              <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400 uppercase max-w-md mx-auto">
                {searchTerm || selectedCategory !== 'all' || communityPlatformFilter !== 'all'
                  ? 'Try adjusting your search criteria or resetting filters.'
                  : 'Community managers can toggle their public directory listing anytime from the BeSafe dashboard.'}
              </p>
            </div>
          )}

          {/* Server / Group Owner Callout Box */}
          <div className="bg-[#E4E3E0] dark:bg-zinc-900 border-4 border-[#141414] dark:border-zinc-700 p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] dark:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)]">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 bg-[#141414] dark:bg-zinc-800 text-white px-3 py-1 font-mono text-[10px] uppercase font-bold border border-transparent dark:border-zinc-700">
                <SlidersHorizontal className="w-3 h-3 text-indigo-400" />
                Community Owners
              </div>
              <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#141414] dark:text-white">
                Want your Discord Server or VRChat Group listed here?
              </h3>
              <p className="font-mono text-xs text-zinc-700 dark:text-zinc-300 max-w-2xl uppercase tracking-wider leading-relaxed">
                Server and Group owners have full autonomous control. Navigate to the BeSafe Dashboard, connect your Discord server or VRChat group, and toggle the "Public Protected Communities Listing" switch on or off at any time.
              </p>
            </div>
            <Link
              to="/dashboard"
              className="px-8 py-4 bg-[#141414] dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-blue-600 dark:hover:bg-blue-500 dark:hover:text-white font-mono text-xs font-black uppercase tracking-widest transition-colors shrink-0 flex items-center gap-2"
            >
              <span>Manage My Community</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* TAB 2: CERTIFIED API PARTNER BOTS */}
      {!loading && activeTab === 'bots' && (
        <div className="space-y-8">
          <div className="bg-purple-50 dark:bg-purple-950/40 border-2 border-purple-400 dark:border-purple-600 p-6 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-purple-900 dark:text-purple-200 font-bold uppercase font-mono text-xs">
                <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Certified Bots using the BeSafe Safety API
              </div>
              <p className="font-mono text-xs text-purple-800 dark:text-purple-300 leading-relaxed">
                The bots listed below are official or verified partner bots that query BeSafe API endpoints (ban synchronization, reputation lookups, age gating, threat reporting). 
                <span className="font-bold underline ml-1">Bots can only be added and certified by BeSafe Administrators.</span>
              </p>
            </div>
            <Link
              to="/developers"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-mono text-xs font-bold uppercase tracking-wider rounded transition-colors shrink-0"
            >
              Developer API Docs
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBots.map((bot) => (
              <div
                key={bot._id}
                className="bg-white dark:bg-zinc-900 border-2 border-[#141414] dark:border-zinc-700 p-6 flex flex-col justify-between shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] dark:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.5)] hover:translate-x-1 hover:-translate-y-1 transition-all"
              >
                <div className="space-y-5">
                  {/* Bot Header */}
                  <div className="flex items-start gap-4">
                    <img
                      src={bot.avatarUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80'}
                      alt={bot.name}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80'; }}
                      className="w-16 h-16 rounded-2xl border-2 border-[#141414] dark:border-zinc-700 object-cover shrink-0 bg-zinc-100 dark:bg-zinc-800"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase text-white ${
                          bot.platform === 'discord' ? 'bg-[#5865F2]' : bot.platform === 'vrchat' ? 'bg-emerald-600' : 'bg-purple-600'
                        }`}>
                          {bot.platform.toUpperCase()} BOT
                        </span>
                        {bot.isVerified && (
                          <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-[8px] font-mono font-black px-1.5 py-0.5 rounded uppercase flex items-center gap-1">
                            <Check className="w-2.5 h-2.5 text-amber-700 dark:text-amber-400" />
                            API Certified
                          </span>
                        )}
                      </div>
                      <h3 className="font-black text-xl uppercase tracking-tight truncate text-[#141414] dark:text-white">
                        {bot.name}
                      </h3>
                      <p className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                        By {bot.authorName}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="font-sans text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {bot.description}
                  </p>

                  {/* API Telemetry & Scopes Box */}
                  <div className="bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 p-3 rounded-lg space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 dark:text-zinc-500 font-bold uppercase">
                      <span>API Scopes Used</span>
                      <span className="text-indigo-600 dark:text-indigo-400">REST API v1</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {bot.apiScopes.map((scope, idx) => (
                        <span
                          key={idx}
                          className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded"
                        >
                          {scope}
                        </span>
                      ))}
                    </div>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono italic pt-1 border-t border-zinc-200/60 dark:border-zinc-700/60 line-clamp-2">
                      "{bot.apiUsageDetails}"
                    </p>
                  </div>
                </div>

                {/* Footer / Bot Actions */}
                <div className="pt-6 mt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between font-mono text-[10px] text-zinc-500 dark:text-zinc-400">
                    <span>Active Servers: <strong className="text-zinc-800 dark:text-zinc-200">{bot.serversCount}</strong></span>
                    <span>Protected: <strong className="text-zinc-800 dark:text-zinc-200">{bot.usersProtected ? `${(bot.usersProtected / 1000).toFixed(1)}k` : 'Active'}</strong></span>
                  </div>

                  <div className="flex gap-2">
                    {bot.inviteUrl && (
                      <a
                        href={bot.inviteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-[#141414] dark:bg-zinc-100 hover:bg-blue-600 dark:hover:bg-blue-500 text-white dark:text-zinc-950 dark:hover:text-white py-2 font-mono text-xs font-bold uppercase tracking-wider text-center rounded transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span>Invite Bot</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {bot.websiteUrl && (
                      <a
                        href={bot.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-mono text-xs font-bold uppercase rounded transition-colors flex items-center justify-center"
                        title="Visit Bot Website"
                      >
                        <Globe className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredBots.length === 0 && (
            <div className="py-20 text-center border-2 border-dashed border-[#141414]/30 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/60 p-8 space-y-3">
              <Bot className="w-12 h-12 mx-auto text-zinc-400 dark:text-zinc-500" />
              <h4 className="font-mono text-sm uppercase tracking-wider font-black text-zinc-800 dark:text-zinc-200">
                {searchTerm || botPlatformFilter !== 'all'
                  ? 'No API partner bots match your search filters.'
                  : 'No partner bots registered in the certified directory yet.'}
              </h4>
              <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400 uppercase max-w-md mx-auto">
                {searchTerm || botPlatformFilter !== 'all'
                  ? 'Try adjusting your search criteria.'
                  : 'Certified partner bots utilizing the BeSafe Security API will be listed here once certified by administrators.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
