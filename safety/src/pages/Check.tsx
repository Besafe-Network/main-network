import React, { useState, useEffect } from 'react';
import { Search, ShieldCheck, ShieldAlert, Clock, AlertTriangle, Eye, Skull, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { extractVRChatUserId } from '../utils/vrchatUtils';

interface UserData {
  found: boolean;
  id?: string | null;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  reputation?: number;
  isBanned?: boolean;
  isSuspicious?: boolean;
  isDangerous?: boolean;
  trustIndex?: string;
  watchlistUrl?: string | null;
  banReason?: string;
  banType?: string;
  banExpiresAt?: string;
  warningsCount?: number;
  banCase?: {
    caseNumber: string;
    title?: string;
    reason: string;
    severity: string;
    status: string;
    discordAccounts?: Array<{ discordId: string; username?: string; displayName?: string; avatarUrl?: string }>;
    vrchatAccounts?: Array<{ vrchatUserId: string; vrchatUsername?: string }>;
  } | null;
  vrchatAccounts?: { vrchatUserId: string; vrchatUsername: string; isPrimary: boolean }[];
}

export default function Check() {
  const { id: paramId } = useParams();
  const [searchParams] = useSearchParams();
  const queryFromUrl = paramId || searchParams.get('id') || searchParams.get('user') || searchParams.get('query') || '';

  const [userId, setUserId] = useState(queryFromUrl);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UserData | null>(null);

  const executeLookup = async (lookupTarget: string) => {
    if (!lookupTarget.trim()) return;
    setLoading(true);
    const cleanedQuery = extractVRChatUserId(lookupTarget);
    try {
      const res = await fetch(`/api/check/${encodeURIComponent(cleanedQuery)}`);
      const data = await res.json();
      setResult(data);
    } catch (error) {
      console.error('Search failed', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (queryFromUrl) {
      setUserId(queryFromUrl);
      executeLookup(queryFromUrl);
    }
  }, [queryFromUrl]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    executeLookup(userId);
  };

  const getComputedTrustIndex = () => {
    if (result?.isDangerous || result?.isBanned) return 'BLACKLISTED';
    if (result?.trustIndex && ['ALL CLEAR', 'KNOWN', 'TRUSTED', 'SUSPICIOUS', 'POTENTIALLY DANGEROUS', 'BLACKLISTED'].includes(result.trustIndex)) {
      return result.trustIndex;
    }
    const rep = Number(result?.reputation ?? 0);
    if (rep >= 20) return 'TRUSTED';
    if (rep >= 10) return 'KNOWN';
    if (rep <= -10) return 'POTENTIALLY DANGEROUS';
    if (rep <= -5) return 'SUSPICIOUS';
    return 'ALL CLEAR';
  };

  const computedTrustIndex = getComputedTrustIndex();

  const getStatusColor = () => {
    if (result?.isDangerous) return 'bg-black text-white';
    if (result?.isBanned || computedTrustIndex === 'BLACKLISTED' || computedTrustIndex === 'POTENTIALLY DANGEROUS') return 'bg-red-600 text-white';
    if (result?.isSuspicious || computedTrustIndex === 'SUSPICIOUS') return 'bg-amber-600 text-white';
    if (computedTrustIndex === 'TRUSTED') return 'bg-indigo-600 text-white';
    if (computedTrustIndex === 'KNOWN') return 'bg-teal-600 text-white';
    return 'bg-emerald-600 text-white';
  };

  const userDisplayName = result?.banCase?.title || result?.displayName || result?.username || 'Unknown User';
  const userAvatar = result?.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png';

  return (
    <div className="max-w-3xl mx-auto space-y-12">
      <div className="space-y-4 text-center px-4">
        <h1 className="text-3xl sm:text-5xl font-bold uppercase tracking-tighter text-[#141414] dark:text-zinc-100">
          User & VRChat Lookup
        </h1>
        <p className="text-sm sm:text-base opacity-70 text-zinc-600 dark:text-zinc-400">
          Enter a Discord User ID or VRChat User ID / Profile URL to check global standing, reputation, and identity records.
        </p>
      </div>

      <form onSubmit={handleSearch} className="relative">
        <input 
          type="text" 
          value={userId}
          onChange={(e) => {
            const val = e.target.value;
            setUserId(val.includes('vrchat.com') || val.includes('usr_') ? extractVRChatUserId(val) : val);
          }}
          placeholder="Enter Discord User ID or VRChat ID (e.g. 192766256179 or usr_...)"
          className="w-full bg-white dark:bg-zinc-900 border-2 border-[#141414] dark:border-zinc-700 p-4 sm:p-6 pr-14 font-mono text-sm sm:text-xl text-[#141414] dark:text-zinc-100 focus:outline-none focus:bg-[#141414] focus:text-[#E4E3E0] dark:focus:bg-zinc-800 dark:focus:text-white transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] dark:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]"
        />
        <button 
          type="submit"
          disabled={loading}
          className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 p-2 hover:opacity-50 transition-opacity disabled:opacity-20 text-[#141414] dark:text-zinc-200"
          aria-label="Search"
        >
          <Search className="w-6 h-6 sm:w-8 sm:h-8" />
        </button>
      </form>

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-12 space-y-4"
          >
            <div className="w-10 h-10 border-4 border-[#141414] dark:border-zinc-400 border-t-transparent rounded-full animate-spin" />
            <p className="font-mono text-xs uppercase tracking-widest font-bold text-zinc-600 dark:text-zinc-400">
              Querying Network Records...
            </p>
          </motion.div>
        )}

        {result && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-2 border-[#141414] dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] dark:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.5)]"
          >
            {!result.found ? (
              <div className="p-8 sm:p-12 text-center space-y-4 bg-white dark:bg-zinc-900">
                <ShieldCheck className="w-16 h-16 mx-auto opacity-20 text-emerald-600 dark:text-emerald-400" />
                <p className="font-mono text-lg sm:text-xl uppercase tracking-widest text-[#141414] dark:text-zinc-100 font-bold">
                  No Record Found
                </p>
                <p className="opacity-50 text-sm font-mono text-zinc-600 dark:text-zinc-400">
                  This user or VRChat account has no infraction history in our global database.
                </p>
              </div>
            ) : (
              <div className="divide-y-2 divide-[#141414] dark:divide-zinc-700">
                {/* Result Header Banner with Watchlist Avatar and User Name */}
                <div className={`p-5 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 ${getStatusColor()} relative overflow-hidden`}>
                  {result.isDangerous && (
                    <div className="absolute inset-x-0 top-0 h-1.5 bg-red-600 animate-pulse" />
                  )}
                  <div className="flex items-center gap-5 relative z-10 min-w-0">
                    <div className="relative shrink-0">
                      <img 
                        src={userAvatar} 
                        alt={userDisplayName}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = 'https://cdn.discordapp.com/embed/avatars/0.png';
                        }}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-white/40 object-cover shadow-lg bg-black/40"
                      />
                      <div className="absolute -bottom-1 -right-1 bg-black/90 rounded-full p-1 border border-white/20">
                        {result.isDangerous ? (
                          <Skull className="w-4 h-4 text-red-500" />
                        ) : result.isBanned ? (
                          <ShieldAlert className="w-4 h-4 text-red-500" />
                        ) : result.isSuspicious ? (
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                        ) : (
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        )}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight truncate text-white">
                        {userDisplayName}
                      </h2>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 font-mono text-xs uppercase tracking-wider text-white/80">
                        {result.banCase?.title ? (
                          <span className="font-bold text-amber-300">Case: {result.banCase.title}</span>
                        ) : result.username && result.username !== userDisplayName && (
                          <span className="font-bold">@{result.username}</span>
                        )}
                        {result.id && <span>Discord ID: {result.id}</span>}
                        {result.vrchatAccounts && result.vrchatAccounts.length > 0 && (
                          <span>VRChat: {result.vrchatAccounts[0].vrchatUsername || result.vrchatAccounts[0].vrchatUserId}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="sm:text-right relative z-10 shrink-0">
                    <span className="font-mono text-xs uppercase tracking-widest block text-white/70">
                      Trust Index
                    </span>
                    <span className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white">
                      {computedTrustIndex}
                    </span>
                  </div>
                </div>

                {/* High Risk Watchlist Link Banner */}
                {result.isDangerous && result.watchlistUrl && (
                  <div className="bg-red-600 text-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                      <span className="font-mono text-xs uppercase font-bold tracking-wider">
                        High-Risk Record Enrolled on Global Threat Watchlist
                      </span>
                    </div>
                    <Link 
                      to={result.watchlistUrl}
                      className="bg-white text-[#141414] px-4 py-2 font-mono text-xs uppercase font-bold hover:bg-[#141414] hover:text-white dark:hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 self-start sm:self-auto shadow"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Dossier & Evidence
                    </Link>
                  </div>
                )}

                {/* Reputation, Trust Index & Warning Counts */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-[#141414] dark:bg-zinc-700">
                  <StatBox label="Reputation" value={result.reputation?.toString() || '0'} />
                  <StatBox label="Trust Index" value={computedTrustIndex} />
                  <StatBox label="Warnings" value={result.warningsCount?.toString() || '0'} />
                </div>

                {/* Ban Offense Details */}
                {result.isBanned && (
                  <div className="p-6 sm:p-8 space-y-6 bg-white dark:bg-zinc-900 text-[#141414] dark:text-zinc-100">
                    {result.banCase && (
                      <div className="bg-red-50 dark:bg-red-950/40 border-2 border-red-200 dark:border-red-900 p-5 rounded-xl space-y-2">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="font-mono text-xs font-black px-2.5 py-0.5 bg-red-600 text-white rounded">
                            CASE #{result.banCase.caseNumber}
                          </span>
                          <span className="font-mono text-[10px] font-bold uppercase text-red-700 dark:text-red-300">
                            {result.banCase.status === 'active' ? 'ACTIVE BAN CASE' : 'LIFTED CASE'}
                          </span>
                        </div>
                        {result.banCase.title && (
                          <p className="font-bold text-sm text-red-950 dark:text-red-200">{result.banCase.title}</p>
                        )}
                        <p className="text-xs text-red-800 dark:text-red-300 italic">"{result.banCase.reason}"</p>
                      </div>
                    )}

                    <div className="space-y-1">
                      <span className="font-mono text-xs uppercase tracking-widest opacity-60 text-zinc-500 dark:text-zinc-400 block mb-1">
                        Violation Reason
                      </span>
                      <p className="text-lg font-medium italic text-zinc-800 dark:text-zinc-200">
                        "{result.banReason || 'Security Policy Violation'}"
                      </p>
                    </div>

                    <div className="flex gap-12 font-mono text-xs">
                      <div>
                        <span className="uppercase tracking-widest opacity-60 text-zinc-500 dark:text-zinc-400 block mb-1">
                          Ban Type
                        </span>
                        <p className="uppercase font-bold text-zinc-800 dark:text-zinc-200">{result.banType || 'Permanent'}</p>
                      </div>
                      {result.banExpiresAt && (
                        <div>
                          <span className="uppercase tracking-widest opacity-60 text-zinc-500 dark:text-zinc-400 block mb-1">
                            Expires
                          </span>
                          <p className="uppercase font-bold text-zinc-800 dark:text-zinc-200">{new Date(result.banExpiresAt).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Linked Accounts */}
                {result.vrchatAccounts && result.vrchatAccounts.length > 0 && (
                  <div className="p-6 sm:p-8 border-t-2 border-[#141414] dark:border-zinc-700 bg-[#F7F6F5]/80 dark:bg-zinc-950/60 space-y-4">
                    <div>
                      <span className="font-mono text-xs uppercase tracking-widest opacity-60 text-zinc-600 dark:text-zinc-400 font-bold block mb-1">
                        🌐 Connected VRChat Accounts
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {result.vrchatAccounts.map((acct, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-white dark:bg-zinc-800 border-2 border-[#141414] dark:border-zinc-700 p-4 shadow-[-2px_2px_0px_0px_rgba(20,20,20,1)] dark:shadow-[-2px_2px_0px_0px_rgba(0,0,0,0.5)]">
                          <div>
                            <p className="font-sans font-bold text-sm text-[#141414] dark:text-zinc-100">{acct.vrchatUsername}</p>
                            <p className="font-mono text-[10px] opacity-60 dark:opacity-75 text-zinc-600 dark:text-zinc-400 select-all">{acct.vrchatUserId}</p>
                          </div>
                          <div>
                            <span className={`font-mono text-[8px] uppercase font-black px-2.5 py-1 border-2 border-[#141414] dark:border-zinc-600 ${acct.isPrimary ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-200 border-indigo-950 dark:border-indigo-700' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border-zinc-400'}`}>
                              {acct.isPrimary ? 'Primary Account' : 'Alt Account'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatBox({ label, value }: { label: string, value: string }) {
  return (
    <div className="bg-[#E4E3E0] dark:bg-zinc-800 p-6 text-[#141414] dark:text-zinc-100">
      <span className="font-mono text-xs uppercase tracking-widest opacity-50 block mb-2 text-zinc-600 dark:text-zinc-400 font-bold">{label}</span>
      <span className="text-4xl font-bold tracking-tighter text-[#141414] dark:text-white">{value}</span>
    </div>
  );
}
