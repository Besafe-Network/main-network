import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  ExternalLink, 
  RefreshCw, 
  AlertCircle, 
  ShieldCheck, 
  Globe, 
  Code2,
  Users,
  Server
} from 'lucide-react';

interface ApiBotItem {
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
  createdAt?: string;
}

const AVAILABLE_SCOPES = [
  { id: 'read:reputation', label: 'read:reputation (Check user trust & scores)' },
  { id: 'enforce:bans', label: 'enforce:bans (Synchronize global banlists)' },
  { id: 'verify:age', label: 'verify:age (Verify age & query geo rules)' },
  { id: 'ingest:reports', label: 'ingest:reports (Submit threat telemetry)' },
  { id: 'audit:telemetry', label: 'audit:telemetry (Read audit and server logs)' }
];

export default function ApiBotsManager() {
  const [bots, setBots] = useState<ApiBotItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal / Form State
  const [showModal, setShowModal] = useState(false);
  const [editingBot, setEditingBot] = useState<ApiBotItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formPlatform, setFormPlatform] = useState<'discord' | 'vrchat' | 'multi'>('discord');
  const [formDescription, setFormDescription] = useState('');
  const [formAvatarUrl, setFormAvatarUrl] = useState('');
  const [formInviteUrl, setFormInviteUrl] = useState('');
  const [formWebsiteUrl, setFormWebsiteUrl] = useState('');
  const [formAuthorName, setFormAuthorName] = useState('');
  const [formScopes, setFormScopes] = useState<string[]>(['read:reputation', 'enforce:bans']);
  const [formUsageDetails, setFormUsageDetails] = useState('');
  const [formServersCount, setFormServersCount] = useState(0);
  const [formUsersProtected, setFormUsersProtected] = useState(0);
  const [formIsVerified, setFormIsVerified] = useState(true);
  const [formIsListed, setFormIsListed] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const getAuthToken = () => localStorage.getItem('gg_token') || localStorage.getItem('adminToken') || '';

  const fetchBots = async () => {
    setLoading(true);
    setError('');
    try {
      const token = getAuthToken();
      const res = await fetch('/api/admin/bots', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch API partner bots');
      const data = await res.json();
      setBots(data.bots || []);
    } catch (err: any) {
      setError(err.message || 'Error loading bots');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBots();
  }, []);

  const openCreateModal = () => {
    setEditingBot(null);
    setFormName('');
    setFormPlatform('discord');
    setFormDescription('');
    setFormAvatarUrl('');
    setFormInviteUrl('');
    setFormWebsiteUrl('');
    setFormAuthorName('BeSafe Partner Developer');
    setFormScopes(['read:reputation', 'enforce:bans']);
    setFormUsageDetails('Queries BeSafe REST API v1 for synchronized threat checks and ban enforcement.');
    setFormServersCount(10);
    setFormUsersProtected(5000);
    setFormIsVerified(true);
    setFormIsListed(true);
    setShowModal(true);
  };

  const openEditModal = (bot: ApiBotItem) => {
    setEditingBot(bot);
    setFormName(bot.name);
    setFormPlatform(bot.platform);
    setFormDescription(bot.description);
    setFormAvatarUrl(bot.avatarUrl || '');
    setFormInviteUrl(bot.inviteUrl || '');
    setFormWebsiteUrl(bot.websiteUrl || '');
    setFormAuthorName(bot.authorName);
    setFormScopes(bot.apiScopes || ['read:reputation']);
    setFormUsageDetails(bot.apiUsageDetails || '');
    setFormServersCount(bot.serversCount || 0);
    setFormUsersProtected(bot.usersProtected || 0);
    setFormIsVerified(bot.isVerified);
    setFormIsListed(bot.isListed);
    setShowModal(true);
  };

  const handleToggleScope = (scopeId: string) => {
    if (formScopes.includes(scopeId)) {
      setFormScopes(formScopes.filter(s => s !== scopeId));
    } else {
      setFormScopes([...formScopes, scopeId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formDescription.trim()) {
      setError('Bot name and description are required.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccessMsg('');
    try {
      const token = getAuthToken();
      const endpoint = editingBot ? `/api/admin/bots/${editingBot._id}` : '/api/admin/bots';
      const method = editingBot ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formName.trim(),
          platform: formPlatform,
          description: formDescription.trim(),
          avatarUrl: formAvatarUrl.trim(),
          inviteUrl: formInviteUrl.trim(),
          websiteUrl: formWebsiteUrl.trim(),
          authorName: formAuthorName.trim(),
          apiScopes: formScopes,
          apiUsageDetails: formUsageDetails.trim(),
          serversCount: Number(formServersCount),
          usersProtected: Number(formUsersProtected),
          isVerified: Boolean(formIsVerified),
          isListed: Boolean(formIsListed)
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save bot');

      setSuccessMsg(editingBot ? `Bot "${formName}" updated!` : `Bot "${formName}" registered successfully!`);
      setShowModal(false);
      fetchBots();
    } catch (err: any) {
      setError(err.message || 'Error saving bot');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (botId: string, botName: string) => {
    if (!confirm(`Are you sure you want to delete bot "${botName}"?`)) return;

    try {
      const token = getAuthToken();
      const res = await fetch(`/api/admin/bots/${botId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete bot');
      setSuccessMsg(`Bot "${botName}" removed.`);
      fetchBots();
    } catch (err: any) {
      setError(err.message || 'Error deleting bot');
    }
  };

  const handleToggleListingDirect = async (bot: ApiBotItem) => {
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/admin/bots/${bot._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isListed: !bot.isListed })
      });
      if (res.ok) {
        setSuccessMsg(`Toggled visibility for ${bot.name}.`);
        fetchBots();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Bot className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
                API Partner Bots Management
              </h2>
            </div>
            <p className="font-mono text-xs text-zinc-400 max-w-2xl">
              Bots listed here are certified client bots actively integrating with the BeSafe REST API v1. 
              <span className="text-purple-400 font-bold ml-1">Per policy, bots can only be registered and certified by Administrators.</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchBots}
              disabled={loading}
              className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
              title="Refresh Bots"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={openCreateModal}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Register API Bot</span>
            </button>
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 font-mono text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-xl text-emerald-300 font-mono text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg('')} className="text-zinc-400 hover:text-white">✕</button>
          </div>
        )}
      </div>

      {/* Bots Grid */}
      {loading ? (
        <div className="py-16 text-center text-zinc-500 font-mono text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
          Loading certified API bots...
        </div>
      ) : bots.length === 0 ? (
        <div className="p-12 text-center bg-zinc-900/40 rounded-2xl border border-dashed border-zinc-800 space-y-3">
          <Bot className="w-12 h-12 text-zinc-600 mx-auto" />
          <h4 className="text-base font-bold text-zinc-300">No Certified API Bots Registered</h4>
          <p className="font-mono text-xs text-zinc-500 max-w-md mx-auto">
            Click "Register API Bot" to add partner bots that query the BeSafe Safety API.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bots.map((bot) => (
            <div
              key={bot._id}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-zinc-700 transition-colors"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start gap-3">
                  <img
                    src={bot.avatarUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80'}
                    alt={bot.name}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80'; }}
                    className="w-12 h-12 rounded-xl object-cover border border-zinc-700 bg-zinc-800 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase text-white ${
                        bot.platform === 'discord' ? 'bg-[#5865F2]' : bot.platform === 'vrchat' ? 'bg-emerald-600' : 'bg-purple-600'
                      }`}>
                        {bot.platform}
                      </span>
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                        bot.isListed ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        {bot.isListed ? 'Listed Publicly' : 'Hidden'}
                      </span>
                    </div>
                    <h3 className="font-bold text-white text-base truncate">{bot.name}</h3>
                    <p className="font-mono text-[10px] text-zinc-400 truncate">By {bot.authorName}</p>
                  </div>
                </div>

                <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                  {bot.description}
                </p>

                {/* API Scope Badges */}
                <div className="space-y-1">
                  <span className="text-[9px] font-mono uppercase text-zinc-500 font-bold block">API Scopes</span>
                  <div className="flex flex-wrap gap-1">
                    {bot.apiScopes.map((scope, idx) => (
                      <span key={idx} className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-[9px] font-mono px-1.5 py-0.5 rounded">
                        {scope}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Telemetry numbers */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800 font-mono text-[10px]">
                  <div>
                    <span className="text-zinc-500 block">Servers:</span>
                    <strong className="text-white">{bot.serversCount}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Users Guarded:</span>
                    <strong className="text-white">{bot.usersProtected ? `${(bot.usersProtected / 1000).toFixed(1)}k` : '0'}</strong>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
                <button
                  onClick={() => handleToggleListingDirect(bot)}
                  className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    bot.isListed ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                  }`}
                >
                  {bot.isListed ? 'Hide Listing' : 'Make Public'}
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(bot)}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
                    title="Edit bot details"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(bot._id, bot.name)}
                    className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900 text-rose-400 border border-rose-800/60 transition-colors cursor-pointer"
                    title="Delete bot"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-purple-400" />
                <h3 className="font-mono text-base font-bold uppercase text-white">
                  {editingBot ? `Edit Bot: ${editingBot.name}` : 'Register Certified API Bot'}
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Bot Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sentinel Bot"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Platform *</label>
                  <select
                    value={formPlatform}
                    onChange={(e) => setFormPlatform(e.target.value as any)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-purple-500 uppercase font-bold"
                  >
                    <option value="discord">Discord</option>
                    <option value="vrchat">VRChat</option>
                    <option value="multi">Multi-Platform</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Description *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Summary of moderation and safety functions..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Avatar / Icon URL</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={formAvatarUrl}
                    onChange={(e) => setFormAvatarUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Developer / Organization</label>
                  <input
                    type="text"
                    placeholder="e.g. Security Lab"
                    value={formAuthorName}
                    onChange={(e) => setFormAuthorName(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Bot Invite Link</label>
                  <input
                    type="url"
                    placeholder="https://discord.com/oauth2/..."
                    value={formInviteUrl}
                    onChange={(e) => setFormInviteUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Website URL</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={formWebsiteUrl}
                    onChange={(e) => setFormWebsiteUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Scopes Select */}
              <div className="space-y-2">
                <label className="block text-[10px] uppercase font-bold text-zinc-400">API Scopes Granted / Used</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-zinc-800/60 p-3 rounded-xl border border-zinc-700">
                  {AVAILABLE_SCOPES.map(sc => (
                    <label key={sc.id} className="flex items-center gap-2 cursor-pointer text-[10px]">
                      <input
                        type="checkbox"
                        checked={formScopes.includes(sc.id)}
                        onChange={() => handleToggleScope(sc.id)}
                        className="rounded bg-zinc-800 border-zinc-700 text-purple-600 w-3.5 h-3.5"
                      />
                      <span className="text-zinc-300 font-mono">{sc.id}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">How This Bot Uses BeSafe API</label>
                <input
                  type="text"
                  placeholder="e.g. Queries GET /api/v1/public/check on guild member join..."
                  value={formUsageDetails}
                  onChange={(e) => setFormUsageDetails(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Servers Served</label>
                  <input
                    type="number"
                    min={0}
                    value={formServersCount}
                    onChange={(e) => setFormServersCount(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Users Protected</label>
                  <input
                    type="number"
                    min={0}
                    value={formUsersProtected}
                    onChange={(e) => setFormUsersProtected(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsListed}
                    onChange={(e) => setFormIsListed(e.target.checked)}
                    className="rounded bg-zinc-800 border-zinc-700 text-purple-600 w-4 h-4"
                  />
                  <span className="text-zinc-300 font-bold uppercase text-[10px]">Show in Public Directory (/communities)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsVerified}
                    onChange={(e) => setFormIsVerified(e.target.checked)}
                    className="rounded bg-zinc-800 border-zinc-700 text-purple-600 w-4 h-4"
                  />
                  <span className="text-zinc-300 font-bold uppercase text-[10px]">API Certified Badge</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold uppercase transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingBot ? 'Save Changes' : 'Register Bot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
