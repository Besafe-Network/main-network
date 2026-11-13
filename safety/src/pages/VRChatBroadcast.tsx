import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  Users, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Radio, 
  Send, 
  Clock, 
  Image as ImageIcon, 
  Bell, 
  Globe, 
  Lock, 
  FileText, 
  Sparkles,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';

interface VRChatGroup {
  groupId: string;
  name: string;
  description?: string;
  iconUrl?: string | null;
  bannerUrl?: string | null;
  memberCount?: number | null;
  shortCode?: string | null;
  status: 'online' | 'warning' | 'error';
  error?: string;
  botAssigned?: string;
  linkedGuilds: Array<{ id: string; name: string }>;
}

interface AnnouncementHistory {
  _id: string;
  title: string;
  text: string;
  imageId?: string;
  sendNotification: boolean;
  visibility: string;
  sentBy: string;
  sentAt: string;
  totalTargeted: number;
  successCount: number;
  failedCount: number;
  groupResults: Array<{
    groupId: string;
    groupName: string;
    success: boolean;
    error?: string;
    postId?: string;
  }>;
}

export default function VRChatBroadcast() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [adminUsername, setAdminUsername] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'composer' | 'history'>('composer');

  // Groups state
  const [groups, setGroups] = useState<VRChatGroup[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [groupSearch, setGroupSearch] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [imageId, setImageId] = useState('');
  const [sendNotification, setSendNotification] = useState(true);
  const [visibility, setVisibility] = useState('group');

  // Dispatch & Confirmation state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // History state
  const [history, setHistory] = useState<AnnouncementHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = async () => {
    const token = localStorage.getItem('gg_token');
    if (!token) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/user/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.role === 'admin') {
          setIsAdmin(true);
          setAdminUsername(data.username);
          fetchGroups(token);
          fetchHistory(token);
        } else {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    } catch (err) {
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async (token?: string) => {
    setLoadingGroups(true);
    const authToken = token || localStorage.getItem('gg_token');
    try {
      const res = await fetch('/api/admin/vrchat-groups', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups || []);
        // Select all group IDs by default
        setSelectedGroupIds((data.groups || []).map((g: VRChatGroup) => g.groupId));
      }
    } catch (err) {
      console.error('Failed to fetch VRChat groups', err);
    } finally {
      setLoadingGroups(false);
    }
  };

  const fetchHistory = async (token?: string) => {
    setLoadingHistory(true);
    const authToken = token || localStorage.getItem('gg_token');
    try {
      const res = await fetch('/api/admin/vrchat-announcements/history', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch history', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const toggleSelectGroup = (groupId: string) => {
    if (selectedGroupIds.includes(groupId)) {
      setSelectedGroupIds(selectedGroupIds.filter(id => id !== groupId));
    } else {
      setSelectedGroupIds([...selectedGroupIds, groupId]);
    }
  };

  const handleSelectAll = () => {
    setSelectedGroupIds(groups.map(g => g.groupId));
  };

  const handleDeselectAll = () => {
    setSelectedGroupIds([]);
  };

  const handleApplyTemplate = (type: 'safety' | 'maintenance' | 'banNotice') => {
    if (type === 'safety') {
      setTitle('⚠️ Security Advisory: Global Moderation Sync');
      setText('Notice to all group members: Our automated security network has synced updated banlist entries to maintain group safety. If you witness suspicious behavior, please notify moderation staff or submit a report at our safety dashboard.');
    } else if (type === 'maintenance') {
      setTitle('⚙️ System Maintenance Notice');
      setText('All group members please note: Scheduled security maintenance will be occurring. Automation services will remain operational with zero downtime expected.');
    } else if (type === 'banNotice') {
      setTitle('🚨 Important Safety Enforcement Notice');
      setText('A malicious account identified on our global blacklist has been restricted across all connected network groups. Thank you for keeping our VRChat community safe.');
    }
  };

  const executeBroadcast = async () => {
    setIsBroadcasting(true);
    setErrorMessage('');
    setBroadcastResult(null);

    const token = localStorage.getItem('gg_token');
    try {
      const res = await fetch('/api/admin/vrchat-announcements/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          text,
          imageId: imageId.trim() || undefined,
          sendNotification,
          visibility,
          targetGroupIds: selectedGroupIds
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setBroadcastResult(data);
        fetchHistory(token || undefined);
      } else {
        setErrorMessage(data.error || 'Failed to dispatch broadcast announcement.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while sending the broadcast.');
    } finally {
      setIsBroadcasting(false);
      setShowConfirmModal(false);
    }
  };

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(groupSearch.toLowerCase()) ||
    g.groupId.toLowerCase().includes(groupSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-10 h-10 border-4 border-[#141414] border-t-transparent rounded-full animate-spin" />
        <span className="font-mono text-xs uppercase tracking-widest opacity-60">Authenticating Admin Credentials...</span>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="max-w-xl mx-auto my-12 border-4 border-[#141414] bg-white p-8 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] space-y-6 text-center">
        <div className="w-16 h-16 bg-red-100 border-2 border-red-950 rounded-full flex items-center justify-center mx-auto text-red-700">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight">Admin Rights Required</h1>
          <p className="font-mono text-xs opacity-70 mt-2">
            The VRChat Multi-Group Announcement Dispatcher is strictly restricted to System Administrators.
          </p>
        </div>
        <div className="pt-4 flex justify-center gap-4">
          <Link 
            to="/dashboard" 
            className="bg-[#141414] text-[#E4E3E0] px-6 py-3 font-mono text-xs uppercase font-bold tracking-widest hover:bg-zinc-800 transition-colors"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Header Banner */}
      <div className="border-4 border-[#141414] bg-[#141414] text-[#E4E3E0] p-8 shadow-[8px_8px_0px_0px_rgba(20,20,20,0.3)] relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
          <Radio className="w-64 h-64" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="bg-red-600 text-white font-mono text-[9px] uppercase font-black px-2.5 py-1 tracking-widest animate-pulse">
                Admin Exclusive Control
              </span>
              <span className="font-mono text-xs text-zinc-400">Authenticated: {adminUsername}</span>
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tight flex items-center gap-3">
              <Megaphone className="w-9 h-9 text-indigo-400" />
              VRChat Group Announcement Dispatch
            </h1>
            <p className="font-sans text-sm text-zinc-300 max-w-2xl">
              Broadcast announcements, safety warnings, and system advisories across all connected VRChat groups simultaneously.
            </p>
          </div>

          <div className="flex flex-wrap md:flex-col gap-2 font-mono text-xs border-t md:border-t-0 md:border-l border-zinc-800 pt-4 md:pt-0 md:pl-6">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>Connected Groups: <strong className="text-white">{groups.length}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-amber-400" />
              <span>Broadcast History: <strong className="text-white">{history.length}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b-2 border-[#141414] gap-2">
        <button
          onClick={() => setActiveTab('composer')}
          className={`flex items-center gap-2 px-6 py-3 font-mono text-xs uppercase tracking-widest font-bold border-2 border-b-0 border-[#141414] dark:border-zinc-600 transition-all ${
            activeTab === 'composer' 
              ? 'bg-[#141414] dark:bg-zinc-800 text-white shadow-[2px_-2px_0px_0px_rgba(20,20,20,1)] dark:shadow-[2px_-2px_0px_0px_rgba(255,255,255,0.1)]' 
              : 'bg-white/60 dark:bg-zinc-900/60 text-[#141414] dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800'
          }`}
        >
          <Send className="w-4 h-4" />
          Broadcast Composer
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-6 py-3 font-mono text-xs uppercase tracking-widest font-bold border-2 border-b-0 border-[#141414] dark:border-zinc-600 transition-all ${
            activeTab === 'history' 
              ? 'bg-[#141414] dark:bg-zinc-800 text-white shadow-[2px_-2px_0px_0px_rgba(20,20,20,1)] dark:shadow-[2px_-2px_0px_0px_rgba(255,255,255,0.1)]' 
              : 'bg-white/60 dark:bg-zinc-900/60 text-[#141414] dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          Broadcast Log History ({history.length})
        </button>
      </div>

      {activeTab === 'composer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Group Selector & Options */}
          <div className="lg:col-span-5 space-y-6">
            {/* Target Group Selector Card */}
            <div className="border-2 border-[#141414] dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.08)] space-y-4">
              <div className="flex items-center justify-between border-b-2 border-[#141414] dark:border-zinc-700 pb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="font-mono text-xs uppercase font-black tracking-wider text-[#141414] dark:text-white">Target VRChat Groups</h3>
                </div>
                <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-950 dark:text-indigo-200 font-mono text-[10px] font-bold px-2 py-0.5 border border-indigo-900 dark:border-indigo-700">
                  {selectedGroupIds.length} / {groups.length} Selected
                </span>
              </div>

              {/* Controls */}
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    value={groupSearch}
                    onChange={(e) => setGroupSearch(e.target.value)}
                    placeholder="Search connected groups..."
                    className="w-full bg-[#F7F6F5] dark:bg-zinc-800 border border-[#141414] dark:border-zinc-700 text-[#141414] dark:text-white pl-9 pr-3 py-2 font-mono text-xs focus:outline-none focus:bg-white dark:focus:bg-zinc-750"
                  />
                  <Search className="w-4 h-4 absolute left-3 top-2.5 opacity-40 text-[#141414] dark:text-white" />
                </div>

                <div className="flex justify-between items-center font-mono text-[10px]">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-indigo-700 dark:text-indigo-400 font-bold hover:underline"
                    >
                      [Select All]
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAll}
                      className="text-zinc-600 dark:text-zinc-400 font-bold hover:underline"
                    >
                      [Deselect All]
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => fetchGroups()}
                    className="flex items-center gap-1 text-zinc-600 dark:text-zinc-300 hover:opacity-100"
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingGroups ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
              </div>

              {/* Group List */}
              <div className="max-h-72 overflow-y-auto divide-y divide-zinc-200 dark:divide-zinc-700 border border-[#141414] dark:border-zinc-700 bg-[#F7F6F5] dark:bg-zinc-950">
                {loadingGroups ? (
                  <div className="p-8 text-center font-mono text-xs text-zinc-500 dark:text-zinc-400">
                    Scanning active groups...
                  </div>
                ) : filteredGroups.length === 0 ? (
                  <div className="p-8 text-center font-mono text-xs text-zinc-500 dark:text-zinc-400">
                    No connected VRChat groups found.
                  </div>
                ) : (
                  filteredGroups.map((g) => {
                    const isSelected = selectedGroupIds.includes(g.groupId);
                    return (
                      <div
                        key={g.groupId}
                        onClick={() => toggleSelectGroup(g.groupId)}
                        className={`p-3 flex items-start gap-3 cursor-pointer transition-colors ${
                          isSelected 
                            ? 'bg-indigo-50 dark:bg-indigo-950/80 border-l-4 border-indigo-600 dark:border-indigo-400' 
                            : 'hover:bg-white dark:hover:bg-zinc-800'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // Handled by parent div
                          className="mt-1 accent-indigo-600 dark:accent-indigo-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-xs truncate text-[#141414] dark:text-white">{g.name}</span>
                            {g.memberCount !== null && (
                              <span className="font-mono text-[9px] bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-1.5 py-0.5 border border-zinc-300 dark:border-zinc-700">
                                {g.memberCount} members
                              </span>
                            )}
                          </div>
                          <p className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400 truncate">{g.groupId}</p>
                          {g.linkedGuilds && g.linkedGuilds.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {g.linkedGuilds.map((guild) => (
                                <span key={guild.id} className="text-[8px] bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 px-1 py-0.5 font-mono text-zinc-700 dark:text-zinc-300">
                                  {guild.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Broadcast Settings & Presets */}
            <div className="border-2 border-[#141414] dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.08)] space-y-4">
              <h3 className="font-mono text-xs uppercase font-black tracking-wider border-b-2 border-[#141414] dark:border-zinc-700 pb-2 flex items-center gap-2 text-[#141414] dark:text-white">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Quick Message Presets
              </h3>
              <div className="grid grid-cols-1 gap-2 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => handleApplyTemplate('safety')}
                  className="text-left p-2.5 border border-[#141414] dark:border-zinc-700 bg-[#F7F6F5] dark:bg-zinc-800 hover:bg-amber-50 dark:hover:bg-amber-950/60 transition-colors"
                >
                  <span className="font-bold text-amber-900 dark:text-amber-300 block">⚠️ Security Advisory</span>
                  <span className="text-[10px] text-zinc-600 dark:text-zinc-400">Global moderation sync notification</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate('maintenance')}
                  className="text-left p-2.5 border border-[#141414] dark:border-zinc-700 bg-[#F7F6F5] dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition-colors"
                >
                  <span className="font-bold text-blue-900 dark:text-blue-300 block">⚙️ System Maintenance</span>
                  <span className="text-[10px] text-zinc-600 dark:text-zinc-400">Scheduled system notice</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate('banNotice')}
                  className="text-left p-2.5 border border-[#141414] dark:border-zinc-700 bg-[#F7F6F5] dark:bg-zinc-800 hover:bg-red-50 dark:hover:bg-red-950/60 transition-colors"
                >
                  <span className="font-bold text-red-900 dark:text-red-300 block">🚨 Safety Enforcement</span>
                  <span className="text-[10px] text-zinc-600 dark:text-zinc-400">Critical malicious account action notice</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Composer Form & Preview */}
          <div className="lg:col-span-7 space-y-6">
            <div className="border-2 border-[#141414] dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.08)] space-y-6">
              <div className="border-b-2 border-[#141414] dark:border-zinc-700 pb-3 flex justify-between items-center">
                <h2 className="font-mono text-sm uppercase font-black tracking-wider flex items-center gap-2 text-[#141414] dark:text-white">
                  <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Compose Announcement
                </h2>
                <span className="font-mono text-[10px] opacity-60 uppercase text-[#141414] dark:text-zinc-400">VRChat Post API Specification</span>
              </div>

              {errorMessage && (
                <div className="bg-red-100 dark:bg-red-950 border-2 border-red-950 dark:border-red-700 p-4 text-red-950 dark:text-red-200 font-mono text-xs flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {broadcastResult && (
                <div className="bg-emerald-50 dark:bg-emerald-950 border-2 border-emerald-950 dark:border-emerald-700 p-4 space-y-2 font-mono text-xs text-emerald-950 dark:text-emerald-200">
                  <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span>Broadcast Successfully Dispatched!</span>
                  </div>
                  <p className="text-[11px]">
                    Dispatched across <strong>{broadcastResult.totalTargeted}</strong> groups ({broadcastResult.successCount} succeeded, {broadcastResult.failedCount} failed).
                  </p>
                </div>
              )}

              <form onSubmit={(e) => { e.preventDefault(); setShowConfirmModal(true); }} className="space-y-5">
                {/* Title Input */}
                <div className="space-y-1.5">
                  <label className="block font-mono text-xs uppercase font-bold text-[#141414] dark:text-white">
                    Announcement Title <span className="text-red-600 dark:text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. ⚠️ Safety Alert: Global Banlist Synchronization"
                    className="w-full border-2 border-[#141414] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#141414] dark:text-white p-3 font-sans text-sm font-semibold focus:outline-none focus:bg-[#F7F6F5] dark:focus:bg-zinc-700"
                  />
                </div>

                {/* Body Textarea */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="block font-mono text-xs uppercase font-bold text-[#141414] dark:text-white">
                      Announcement Content Body <span className="text-red-600 dark:text-red-400">*</span>
                    </label>
                    <span className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400">{text.length} characters</span>
                  </div>
                  <textarea
                    required
                    rows={6}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Write your announcement content message..."
                    className="w-full border-2 border-[#141414] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#141414] dark:text-white p-3 font-sans text-sm focus:outline-none focus:bg-[#F7F6F5] dark:focus:bg-zinc-700"
                  />
                </div>

                {/* Additional Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {/* Push Notification Toggle */}
                  <div className="border border-[#141414] dark:border-zinc-700 p-3 bg-[#F7F6F5] dark:bg-zinc-800/60 space-y-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sendNotification}
                        onChange={(e) => setSendNotification(e.target.checked)}
                        className="accent-indigo-600 dark:accent-indigo-500 w-4 h-4"
                      />
                      <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span className="font-mono text-xs font-bold uppercase text-[#141414] dark:text-white">Send Member Push Notification</span>
                    </label>
                    <p className="font-mono text-[9px] text-zinc-500 dark:text-zinc-400 pl-6">
                      Triggers instant push notification in VRChat to group members.
                    </p>
                  </div>

                  {/* Visibility */}
                  <div className="border border-[#141414] dark:border-zinc-700 p-3 bg-[#F7F6F5] dark:bg-zinc-800/60 space-y-1">
                    <label className="block font-mono text-[10px] font-bold uppercase text-[#141414] dark:text-white">Post Visibility</label>
                    <select
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-800 text-[#141414] dark:text-white border border-[#141414] dark:border-zinc-700 p-1.5 font-mono text-xs"
                    >
                      <option value="group">Group Members Only</option>
                      <option value="public">Public (Visible to All VRChat Users)</option>
                    </select>
                  </div>
                </div>

                {/* Image ID optional */}
                <div className="space-y-1">
                  <label className="block font-mono text-[10px] uppercase font-bold text-zinc-700 dark:text-zinc-300">
                    VRChat Image File ID (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={imageId}
                      onChange={(e) => setImageId(e.target.value)}
                      placeholder="file_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      className="w-full border border-[#141414] dark:border-zinc-700 p-2 pl-8 font-mono text-xs bg-[#F7F6F5] dark:bg-zinc-800 text-[#141414] dark:text-white focus:outline-none"
                    />
                    <ImageIcon className="w-4 h-4 absolute left-2 top-2.5 opacity-40 text-[#141414] dark:text-white" />
                  </div>
                </div>

                {/* In-VR Group Feed Live Preview */}
                <div className="border-2 border-dashed border-[#141414] dark:border-zinc-700 p-4 bg-[#141414] dark:bg-zinc-950 text-white rounded-none space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <span className="font-mono text-[9px] uppercase font-black text-indigo-400 tracking-widest flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5" /> Live In-VR VRChat Group Feed Preview
                    </span>
                    <span className="font-mono text-[9px] bg-zinc-800 text-zinc-400 px-2 py-0.5 uppercase">
                      {visibility === 'group' ? 'Members Only' : 'Public'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-base font-bold text-white tracking-tight">
                      {title || 'Announcement Title Preview'}
                    </h4>
                    <p className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed font-sans">
                      {text || 'Announcement message text will appear here inside VRChat group posts...'}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-zinc-800 flex justify-between items-center text-[9px] font-mono text-zinc-500">
                    <span>Posted by System Admin Bot</span>
                    <span>{new Date().toLocaleTimeString()} • Push Notification: {sendNotification ? 'ENABLED' : 'DISABLED'}</span>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={selectedGroupIds.length === 0 || !title.trim() || !text.trim()}
                  className="w-full bg-indigo-600 text-white border-2 border-[#141414] dark:border-zinc-600 py-4 font-mono text-sm uppercase font-black tracking-widest hover:bg-indigo-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-5 h-5" />
                  Broadcast Announcement ({selectedGroupIds.length} Groups)
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="border-2 border-[#141414] dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.08)] space-y-6">
          <div className="flex items-center justify-between border-b-2 border-[#141414] dark:border-zinc-700 pb-3">
            <h2 className="font-mono text-sm uppercase font-black tracking-wider flex items-center gap-2 text-[#141414] dark:text-white">
              <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Broadcast Audit History Log
            </h2>
            <button
              onClick={() => fetchHistory()}
              className="font-mono text-xs text-indigo-700 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? 'animate-spin' : ''}`} />
              Refresh Logs
            </button>
          </div>

          {loadingHistory ? (
            <div className="p-12 text-center font-mono text-xs text-zinc-500 dark:text-zinc-400">Loading broadcast history...</div>
          ) : history.length === 0 ? (
            <div className="p-12 text-center font-mono text-xs text-zinc-500 dark:text-zinc-400">No announcement broadcast history found.</div>
          ) : (
            <div className="space-y-4 divide-y-2 divide-[#141414] dark:divide-zinc-700">
              {history.map((item) => {
                const isExpanded = expandedHistoryId === item._id;
                return (
                  <div key={item._id} className="pt-4 space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#141414] dark:text-white">{item.title}</span>
                          <span className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-400 dark:border-zinc-600 font-mono text-[9px] px-2 py-0.5 text-zinc-800 dark:text-zinc-200">
                            By {item.sentBy}
                          </span>
                        </div>
                        <p className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400">
                          {new Date(item.sentAt).toLocaleString()} • Targeted {item.totalTargeted} group(s)
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-950 dark:text-emerald-200 font-mono text-[10px] font-bold px-2 py-1 border border-emerald-800 dark:border-emerald-700">
                          {item.successCount} Successful
                        </span>
                        {item.failedCount > 0 && (
                          <span className="bg-red-100 dark:bg-red-950 text-red-950 dark:text-red-200 font-mono text-[10px] font-bold px-2 py-1 border border-red-800 dark:border-red-700">
                            {item.failedCount} Failed
                          </span>
                        )}
                        <button
                          onClick={() => setExpandedHistoryId(isExpanded ? null : item._id)}
                          className="p-1 border border-[#141414] dark:border-zinc-600 bg-[#F7F6F5] dark:bg-zinc-800 text-[#141414] dark:text-white hover:bg-white dark:hover:bg-zinc-700"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <p className="font-sans text-xs bg-[#F7F6F5] dark:bg-zinc-800 p-3 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 line-clamp-2">
                      "{item.text}"
                    </p>

                    {/* Collapsible Delivery Results */}
                    {isExpanded && (
                      <div className="p-4 bg-zinc-900 text-white font-mono text-xs space-y-2 border border-[#141414] dark:border-zinc-700">
                        <span className="text-[10px] text-indigo-400 uppercase font-black block">Per-Group Delivery Report</span>
                        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pt-1">
                          {item.groupResults?.map((res, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-zinc-800 p-2 border border-zinc-700 text-[11px]">
                              <span className="font-bold truncate max-w-xs">{res.groupName} ({res.groupId})</span>
                              {res.success ? (
                                <span className="text-emerald-400 font-bold flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Delivered
                                </span>
                              ) : (
                                <span className="text-red-400 font-bold flex items-center gap-1">
                                  <XCircle className="w-3.5 h-3.5" /> {res.error || 'Failed'}
                                </span>
                              )}
                            </div>
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
      )}

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 border-4 border-[#141414] dark:border-zinc-700 max-w-lg w-full p-6 shadow-[12px_12px_0px_0px_rgba(20,20,20,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.1)] space-y-6"
            >
              <div className="flex items-center gap-3 border-b-2 border-[#141414] dark:border-zinc-700 pb-4">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-950 border border-indigo-950 dark:border-indigo-700 text-indigo-950 dark:text-indigo-200">
                  <Megaphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-lg uppercase tracking-tight text-[#141414] dark:text-white">Confirm Mass VRChat Broadcast</h3>
                  <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400">Review dispatch specifications before executing</p>
                </div>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="bg-[#F7F6F5] dark:bg-zinc-800 p-3 border border-[#141414] dark:border-zinc-700 space-y-1">
                  <span className="text-[10px] uppercase text-zinc-500 dark:text-zinc-400 block font-bold">Announcement Title</span>
                  <p className="font-sans font-bold text-sm text-[#141414] dark:text-white">{title}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#F7F6F5] dark:bg-zinc-800 p-2.5 border border-[#141414] dark:border-zinc-700">
                    <span className="text-[9px] uppercase text-zinc-500 dark:text-zinc-400 block font-bold">Target Groups</span>
                    <span className="font-bold text-indigo-700 dark:text-indigo-400 text-sm">{selectedGroupIds.length} Groups</span>
                  </div>
                  <div className="bg-[#F7F6F5] dark:bg-zinc-800 p-2.5 border border-[#141414] dark:border-zinc-700">
                    <span className="text-[9px] uppercase text-zinc-500 dark:text-zinc-400 block font-bold">Push Notification</span>
                    <span className="font-bold text-amber-700 dark:text-amber-400 text-sm">{sendNotification ? 'Enabled' : 'Disabled'}</span>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 dark:bg-amber-950/80 border-l-4 border-amber-600 text-amber-950 dark:text-amber-200 text-[11px] font-sans">
                  ⚠️ This action will post this announcement card live into <strong>{selectedGroupIds.length} VRChat group feeds</strong> simultaneously under system bot authorization.
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={isBroadcasting}
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 bg-zinc-200 dark:bg-zinc-800 text-[#141414] dark:text-white border-2 border-[#141414] dark:border-zinc-600 py-3 font-mono text-xs uppercase font-bold hover:bg-zinc-300 dark:hover:bg-zinc-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isBroadcasting}
                  onClick={executeBroadcast}
                  className="flex-1 bg-indigo-600 text-white border-2 border-[#141414] dark:border-zinc-600 py-3 font-mono text-xs uppercase font-black hover:bg-indigo-700 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isBroadcasting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Dispatching...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Execute Broadcast
                    </>
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
