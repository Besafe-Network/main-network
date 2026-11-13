import React, { useState, useEffect } from 'react';
import { ShieldAlert, Info, ExternalLink, X, Search, AlertTriangle, Eye, ArrowLeft, MessageSquare, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useParams, useNavigate } from 'react-router-dom';

interface DangerousUser {
  id: string;
  _id?: string;
  caseNumber?: string;
  isBanCase?: boolean;
  caseTitle?: string;
  title?: string;
  displayName: string;
  username: string;
  avatarUrl: string;
  banReason: string;
  dangerousNotes: string;
  evidence: string[];
  updatedAt: string;
  createdAt: string;
  reputation: number;
  isAgeVerified: boolean;
  warningsCount: number;
  trustIndex?: string;
  discordAccounts?: Array<{ discordId: string; username?: string; displayName?: string; avatarUrl?: string }>;
  vrchatAccounts?: { vrchatUserId: string; vrchatUsername: string; isPrimary: boolean }[];
}

export default function DangerousPeople() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [users, setUsers] = useState<DangerousUser[]>([]);
  const [singleUser, setSingleUser] = useState<DangerousUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('gg_token');
    setIsAdminLoggedIn(!!token);

    if (id) {
      fetchSingleUser(id);
    } else {
      document.title = "Watchlist | BeSafe Network";
      fetchDangerousPeople();
    }
  }, [id]);

  const handleToggleWatchlistDirect = async (e: React.MouseEvent, user: DangerousUser) => {
    e.stopPropagation();
    const token = localStorage.getItem('gg_token');
    if (!token) return;

    try {
      const endpoint = user.caseNumber
        ? `/api/admin/ban-cases/${user.caseNumber}/toggle-watchlist`
        : `/api/admin/users/${user.id}/toggle-dangerous`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setActionMessage(`Watchlist status toggled for ${user.displayName}.`);
        fetchDangerousPeople(false);
        if (id) fetchSingleUser(id);
        setTimeout(() => setActionMessage(null), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSingleUser = async (userId: string) => {
    setLoading(true);
    setError('');
    setSingleUser(null);
    try {
      const res = await fetch(`/api/public/dangerous/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setSingleUser(data);
        document.title = `${data.caseTitle || data.title || data.displayName} | Threat Intelligence`;
        // Also fetch the full list in background for context if they go back
        fetchDangerousPeople(false);
      } else {
        const data = await res.json();
        setError(data.error || 'Subject could not be located in high-priority database.');
      }
    } catch (err) {
      setError('Connection failure during intelligence retrieval.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDangerousPeople = async (setLoadState = true) => {
    if (setLoadState) setLoading(true);
    try {
      const res = await fetch('/api/public/dangerous');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else if (setLoadState) {
        setError('Failed to load watchlist. Please try again later.');
      }
    } catch (err) {
      if (setLoadState) setError('Connection error. Server may be offline.');
    } finally {
      if (setLoadState) setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    (user.caseTitle && user.caseTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.title && user.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
    user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id.includes(searchTerm) ||
    (user.caseNumber && user.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Profile View
  if (id) {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <div className="w-12 h-12 border-4 border-[#141414] border-t-transparent rounded-full animate-spin" />
          <p className="font-mono text-xs uppercase tracking-widest animate-pulse font-bold">Retrieving Dossier...</p>
        </div>
      );
    }

    if (!singleUser) {
      return (
        <div className="max-w-6xl mx-auto space-y-8 pb-24">
          <button 
            onClick={() => navigate('/watchlist')}
            className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest hover:opacity-50 transition-opacity"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Watchlist
          </button>
          <div className="bg-red-50 border-4 border-red-600 p-12 text-center space-y-4">
            <AlertTriangle className="w-16 h-16 mx-auto text-red-600" />
            <h2 className="text-4xl font-black uppercase">Subject Not Found</h2>
            <p className="font-mono text-sm opacity-60 uppercase">{error || "This ID does not match any subject in our high-priority watchlist."}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
        <button 
          onClick={() => navigate('/watchlist')}
          className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest hover:opacity-50 transition-opacity"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Watchlist
        </button>

        <div className="bg-[#E4E3E0] dark:bg-zinc-900 border-4 border-red-600 shadow-2xl relative overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Visuals */}
            <div className="bg-[#141414] p-8 space-y-6">
              <div className="aspect-square border-4 border-red-600 overflow-hidden relative group">
                <img 
                  src={singleUser.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png'} 
                  alt={singleUser.displayName}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = 'https://cdn.discordapp.com/embed/avatars/0.png';
                  }}
                  className="w-full h-full object-cover grayscale brightness-50"
                />
                <div className="absolute inset-x-0 bottom-0 py-4 bg-red-600/90 text-white text-center font-mono text-xs uppercase font-black">
                  IDENTIFIED ACTOR
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 border border-white/10 space-y-1">
                  <span className="block font-mono text-[8px] uppercase opacity-30 text-white">Trust Index</span>
                  <span className="text-xl font-bold text-red-500 uppercase">{singleUser.trustIndex || 'BLACKLISTED'}</span>
                </div>
                <div className="bg-white/5 p-4 border border-white/10 space-y-1">
                  <span className="block font-mono text-[8px] uppercase opacity-30 text-white">Last Intelligence Update</span>
                  <span className="text-xs font-bold text-white uppercase">{new Date(singleUser.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white/5 p-3 border border-white/10 text-center">
                  <span className="block font-mono text-[7px] uppercase opacity-30 text-white">Reputation</span>
                  <span className="text-sm font-bold text-orange-500">{singleUser.reputation}</span>
                </div>
                <div className="bg-white/5 p-3 border border-white/10 text-center">
                  <span className="block font-mono text-[7px] uppercase opacity-30 text-white">Warnings</span>
                  <span className="text-sm font-bold text-red-600">{singleUser.warningsCount}</span>
                </div>
                <div className="bg-white/5 p-3 border border-white/10 text-center">
                  <span className="block font-mono text-[7px] uppercase opacity-30 text-white">Age Verified</span>
                  <span className={`text-sm font-bold ${singleUser.isAgeVerified ? 'text-green-500' : 'text-gray-500'}`}>
                    {singleUser.isAgeVerified ? 'YES' : 'NO'}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-mono text-[10px] uppercase opacity-40 text-white font-bold">Threat Dossier</h4>
                <div className="text-sm text-white/80 leading-relaxed font-sans bg-white/5 p-4 border-l-4 border-red-600">
                  {singleUser.dangerousNotes || "No detailed dossier has been compiled for this subject yet. Moderation is advised."}
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                <div className="flex justify-between font-mono text-[8px] uppercase opacity-30 text-white">
                  <span>Network ID: {singleUser.id}</span>
                  <span>Known Since: {new Date(singleUser.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Intel */}
            <div className="p-10 space-y-8 text-[#141414] dark:text-zinc-100">
              <div className="space-y-1">
                <h2 className="text-5xl font-black uppercase tracking-tighter text-[#141414] dark:text-white">
                  {singleUser.caseTitle || singleUser.title || singleUser.displayName}
                </h2>
                <div className="flex items-center gap-2 font-mono text-sm uppercase opacity-50 font-bold">
                  <span>{singleUser.caseTitle || singleUser.title ? (singleUser.caseTitle || singleUser.title) : `@${singleUser.username}`}</span>
                  <span>•</span>
                  <span>{singleUser.caseNumber ? `#${singleUser.caseNumber}` : singleUser.id}</span>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="flex items-center gap-2 font-black uppercase tracking-tight text-red-600">
                    <AlertTriangle className="w-5 h-5" />
                    Ban Offenses
                  </h3>
                  <div className="bg-[#141414] dark:bg-zinc-950 text-white p-6 italic text-sm leading-relaxed border-l-4 border-red-600">
                    "{singleUser.banReason}"
                  </div>
                </div>

                {/* Connected Discord Accounts */}
                {(() => {
                  const discordList = (singleUser.discordAccounts && singleUser.discordAccounts.length > 0)
                    ? singleUser.discordAccounts
                    : (singleUser.id ? [{ discordId: singleUser.id, username: singleUser.username, displayName: singleUser.displayName, avatarUrl: singleUser.avatarUrl }] : []);
                  
                  if (discordList.length === 0) return null;

                  return (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="flex items-center gap-2 font-black uppercase tracking-tight text-[#5865F2]">
                          <MessageSquare className="w-5 h-5 text-[#5865F2]" />
                          Connected Discord Accounts ({discordList.length})
                        </h3>
                        <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 uppercase font-bold">
                          BeSafe Identity Sync
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        {discordList.map((acct, idx) => (
                          <div key={idx} className="bg-white dark:bg-zinc-800 border-2 border-[#141414] dark:border-zinc-700 p-4 flex items-center justify-between shadow-[-2px_2px_0px_0px_rgba(20,20,20,1)] dark:shadow-[-2px_2px_0px_0px_rgba(0,0,0,0.5)] hover:bg-[#F7F6F5]/50 dark:hover:bg-zinc-700/50 transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                              <img 
                                src={acct.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png'} 
                                alt={acct.username || acct.discordId}
                                onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://cdn.discordapp.com/embed/avatars/0.png'; }}
                                className="w-10 h-10 rounded-full border border-black/20 shrink-0 object-cover"
                              />
                              <div className="min-w-0">
                                <p className="font-sans font-bold text-sm text-[#141414] dark:text-zinc-100 truncate">
                                  {acct.displayName || acct.username || acct.discordId}
                                </p>
                                <div className="flex items-center gap-2 font-mono text-[10px] opacity-75">
                                  <span className="font-bold text-[#5865F2]">@{acct.username || acct.discordId}</span>
                                  <span>•</span>
                                  <span className="select-all font-mono opacity-80">{acct.discordId}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`font-mono text-[8px] uppercase font-black px-2 py-0.5 border-2 border-[#141414] dark:border-zinc-600 shadow-[-1px_1px_0px_0px_rgba(20,20,20,1)] ${idx === 0 ? 'bg-[#5865F2]/10 text-[#5865F2] border-[#5865F2]' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border-zinc-400'}`}>
                                {idx === 0 ? 'Primary' : 'Alt'}
                              </span>
                              <a 
                                href={`https://discord.com/users/${acct.discordId}`} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="p-1 hover:text-[#5865F2] text-zinc-400 transition-colors"
                                title="Open Discord Profile Link"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {singleUser.vrchatAccounts && singleUser.vrchatAccounts.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="flex items-center gap-2 font-black uppercase tracking-tight text-indigo-600 dark:text-indigo-400">
                      <span className="text-xl">🎮</span>
                      Connected VRChat Accounts
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {singleUser.vrchatAccounts.map((acct, idx) => (
                        <div key={idx} className="bg-white dark:bg-zinc-800 border-2 border-[#141414] dark:border-zinc-700 p-4 flex items-center justify-between shadow-[-2px_2px_0px_0px_rgba(20,20,20,1)] dark:shadow-[-2px_2px_0px_0px_rgba(0,0,0,0.5)] hover:bg-[#F7F6F5]/50 dark:hover:bg-zinc-700/50 transition-colors">
                          <div>
                            <p className="font-sans font-bold text-sm text-[#141414] dark:text-zinc-100">{acct.vrchatUsername}</p>
                            <p className="font-mono text-[10px] opacity-75 select-all">{acct.vrchatUserId}</p>
                          </div>
                          <div>
                            <span className={`font-mono text-[8px] uppercase font-black px-2 py-0.5 border-2 border-[#141414] dark:border-zinc-600 shadow-[-1px_1px_0px_0px_rgba(20,20,20,1)] ${acct.isPrimary ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-200 border-indigo-950' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border-zinc-400'}`}>
                              {acct.isPrimary ? 'Primary' : 'Alt'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <h3 className="flex items-center gap-2 font-black uppercase tracking-tight">
                    <Info className="w-5 h-5" />
                    Intelligence & Evidence
                  </h3>
                  <div className="space-y-3">
                    {singleUser.evidence && singleUser.evidence.length > 0 ? (
                      singleUser.evidence.map((item, i) => (
                        <div key={i} className="bg-white dark:bg-zinc-800 border-2 border-[#141414] dark:border-zinc-700 p-4 font-mono text-[10px] break-all flex items-start gap-3 group text-zinc-900 dark:text-zinc-100">
                          <span className="bg-[#141414] dark:bg-zinc-900 text-white px-1.5 py-0.5 rounded-sm">EYE-{i+1}</span>
                          <span className="opacity-70 flex-1">{item}</span>
                          <a href={item} target="_blank" rel="noopener noreferrer" className="opacity-0 group-hover:opacity-100"><ExternalLink className="w-3 h-3 hover:text-red-600 transition-colors" /></a>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 border-2 border-dashed border-[#141414] dark:border-zinc-700 text-center opacity-30 italic text-xs uppercase font-bold">
                        Restricted: Evidence links are only visible to authorized developers.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t-2 border-[#141414] dark:border-zinc-700">
                <p className="text-[10px] text-center opacity-30 uppercase font-mono tracking-widest italic">
                  Public safety record provided by BeSafe Network Database v1.0.4
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-12 h-12 border-4 border-[#141414] border-t-transparent rounded-full animate-spin" />
        <p className="font-mono text-xs uppercase tracking-widest animate-pulse font-bold">Scanning Global Databases...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 max-w-6xl mx-auto">
      {/* Header section */}
      <section className="text-center space-y-6 bg-red-600 text-white p-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none select-none overflow-hidden text-black">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="whitespace-nowrap font-mono text-4xl rotate-12 mb-4 font-bold uppercase">
              DANGER ZONE • DO NOT INTERACT • FRAUD DETECTED • MALICIOUS ACTOR • DANGER ZONE
            </div>
          ))}
        </div>
        
        <div className="relative z-10 space-y-4">
          <div className="flex justify-center flex-wrap gap-2">
            <span className="bg-white text-red-600 px-3 py-1 font-mono text-[10px] uppercase font-black tracking-tighter">Level 1 Priority</span>
            <span className="bg-white text-red-600 px-3 py-1 font-mono text-[10px] uppercase font-black tracking-tighter">Immediate Threat</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter italic">High Risk Watchlist</h1>
          <p className="max-w-2xl mx-auto font-mono text-xs uppercase tracking-widest leading-relaxed font-bold">
            The following individuals have been identified as highly dangerous to the Discord ecosystem. 
            Do not engage. Do not share server invites. Report any sightings to the moderation team.
          </p>
        </div>
      </section>

      {/* Search and Filters */}
      <div className="flex justify-between items-center bg-white dark:bg-zinc-900 border-2 border-[#141414] dark:border-zinc-700 p-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] dark:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]">
        <div className="flex-1 relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50 text-zinc-600 dark:text-zinc-400" />
          <input 
            type="text" 
            placeholder="Search watchlist by ID or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent p-3 pl-12 font-mono text-xs focus:outline-none text-[#141414] dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
          />
        </div>
        <div className="font-mono text-[10px] uppercase opacity-60 px-4 border-l border-[#141414] dark:border-zinc-700 text-[#141414] dark:text-zinc-300">
          {filteredUsers.length} Entries Identified
        </div>
      </div>

      {actionMessage && (
        <div className="bg-emerald-600 text-white p-4 font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)}>✕</button>
        </div>
      )}

      {error && (
        <div className="bg-red-100 dark:bg-red-950/60 border-l-4 border-red-600 p-8 text-red-900 dark:text-red-200 animate-in shake duration-500">
          <p className="font-mono text-sm uppercase font-bold">{error}</p>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-24">
        {filteredUsers.map((user) => (
          <motion.div 
            key={user.caseNumber || user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            className="group relative bg-white dark:bg-zinc-900 border-2 border-[#141414] dark:border-zinc-700 overflow-hidden cursor-pointer flex flex-col justify-between shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] dark:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.5)]"
            onClick={() => navigate(`/watchlist/${user.caseNumber || user.id}`)}
          >
            <div>
              <div className="aspect-[4/3] relative bg-[#141414] overflow-hidden">
                  <img 
                    src={user.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png'} 
                    alt={user.displayName}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = 'https://cdn.discordapp.com/embed/avatars/0.png';
                    }}
                    className="w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 transition-all duration-500 hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#141414] to-transparent opacity-60" />
                  
                  <div className="absolute top-3 left-3 flex flex-col gap-1">
                    <div className="bg-red-600 text-white px-2 py-1 font-mono text-[8px] uppercase font-bold animate-pulse">
                      Threat: {user.severity || 'Extreme'}
                    </div>
                    {user.caseNumber && (
                      <div className="bg-zinc-900 text-white border border-white/20 px-2 py-0.5 font-mono text-[8px] uppercase font-black">
                        #{user.caseNumber}
                      </div>
                    )}
                  </div>

                  <div className="absolute top-3 right-3">
                    <span className="bg-white dark:bg-zinc-800 text-zinc-950 dark:text-zinc-100 font-mono text-[8px] uppercase font-bold px-2 py-0.5 rounded shadow">
                      {user.trustIndex || 'BLACKLISTED'}
                    </span>
                  </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-2xl font-black uppercase tracking-tighter truncate text-[#141414] dark:text-white">
                      {user.caseTitle || user.title || user.displayName}
                    </h3>
                    <p className="font-mono text-[10px] opacity-60 truncate text-zinc-600 dark:text-zinc-400">
                      {user.caseTitle || user.title ? (user.caseTitle || user.title) : `@${user.username}`} • {user.caseNumber ? `#${user.caseNumber}` : user.id}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 border-l-2 border-red-600 pl-4">
                  <p className="text-[10px] font-mono uppercase opacity-50 font-bold text-zinc-500 dark:text-zinc-400">Primary Violation</p>
                  <p className="text-xs italic leading-relaxed line-clamp-2 text-zinc-700 dark:text-zinc-300">
                    "{user.banReason || user.reason || 'Flagged security threat'}"
                  </p>
                </div>

                {user.vrchatAccounts && user.vrchatAccounts.length > 0 && (
                  <div className="space-y-1.5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                    <p className="text-[9px] font-mono uppercase opacity-60 font-bold text-zinc-500 dark:text-zinc-400">🎮 Linked VRChat Accounts ({user.vrchatAccounts.length})</p>
                    <div className="flex flex-wrap gap-1.5 max-h-[84px] overflow-y-auto pr-1">
                      {user.vrchatAccounts.map((acct, idx) => (
                        <div 
                          key={idx} 
                          className="bg-zinc-100/60 dark:bg-zinc-800/60 border border-zinc-300 dark:border-zinc-700 px-2 py-0.5 text-[9px] font-mono rounded flex items-center gap-1 max-w-full"
                          title={`${acct.vrchatUsername} (${acct.vrchatUserId})`}
                          onClick={(e) => { e.stopPropagation(); }}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${acct.isPrimary ? 'bg-indigo-500' : 'bg-zinc-400'}`}></span>
                          <span className="truncate max-w-[140px] font-bold text-zinc-800 dark:text-zinc-200">{acct.vrchatUsername || acct.vrchatUserId}</span>
                          <span className="text-[7px] text-zinc-400 font-normal">({acct.isPrimary ? 'Primary' : 'Alt'})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Connected Discord Accounts */}
                {(() => {
                  const accounts = (user.discordAccounts && user.discordAccounts.length > 0)
                    ? user.discordAccounts
                    : (user.id ? [{ discordId: user.id, username: user.username, displayName: user.displayName, avatarUrl: user.avatarUrl }] : []);
                  
                  if (accounts.length === 0) return null;

                  return (
                    <div className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center justify-between">
                        <p className="text-[9px] font-mono uppercase font-bold text-[#5865F2] flex items-center gap-1">
                          <span>💬</span> Connected Discord Accounts ({accounts.length})
                        </p>
                        <span className="text-[8px] font-mono text-zinc-400 dark:text-zinc-500 uppercase">
                          {accounts.length > 1 ? `${accounts.length} Linked Profiles` : 'Primary'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-h-[96px] overflow-y-auto pr-1">
                        {accounts.map((acct, idx) => (
                          <div 
                            key={idx} 
                            className="bg-[#5865F2]/10 dark:bg-[#5865F2]/20 border border-[#5865F2]/30 dark:border-[#5865F2]/40 px-2 py-1 text-[9px] font-mono rounded-md flex items-center gap-1.5 max-w-full hover:bg-[#5865F2]/20 dark:hover:bg-[#5865F2]/30 transition-colors shadow-xs"
                            title={`Discord ID: ${acct.discordId} | User: @${acct.username || acct.displayName}`}
                            onClick={(e) => { e.stopPropagation(); }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-[#5865F2]"></span>
                            <span className="truncate max-w-[130px] font-bold text-[#5865F2] dark:text-indigo-400">
                              {acct.displayName || acct.username || acct.discordId}
                            </span>
                            <span className="text-[8px] text-zinc-500 dark:text-zinc-400 font-mono select-all shrink-0">
                              ({acct.discordId.length > 8 ? `${acct.discordId.slice(0, 4)}...${acct.discordId.slice(-3)}` : acct.discordId})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="p-6 pt-0 space-y-2">
              {isAdminLoggedIn && (
                <button
                  type="button"
                  onClick={(e) => handleToggleWatchlistDirect(e, user)}
                  className="w-full py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-rose-100 dark:hover:bg-rose-950 text-rose-800 dark:text-rose-300 text-[10px] font-mono font-bold uppercase tracking-wider rounded border border-rose-200 dark:border-rose-900 transition-colors"
                >
                  ⚡ Toggle Watchlist (Admin)
                </button>
              )}

              <div className="w-full bg-[#141414] dark:bg-zinc-800 text-white py-3 font-mono text-xs uppercase tracking-widest flex items-center justify-center gap-2 group-hover:bg-red-600 dark:group-hover:bg-red-600 transition-colors">
                <Eye className="w-4 h-4" />
                View Full Intelligence
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {!loading && filteredUsers.length === 0 && (
        <div className="py-24 text-center border-2 border-dashed border-[#141414]/30 dark:border-zinc-700 bg-white/50 dark:bg-zinc-900/40 p-8 space-y-3">
          <ShieldAlert className="w-12 h-12 mx-auto text-zinc-400 dark:text-zinc-500" />
          <p className="font-mono uppercase tracking-widest font-bold text-zinc-700 dark:text-zinc-300">No High-Priority Threats Found Matching Search</p>
        </div>
      )}
    </div>
  );
}
