import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  ShieldCheck, 
  ShieldAlert, 
  RefreshCw, 
  Trash2, 
  Settings2, 
  Sliders, 
  Check, 
  X, 
  AlertCircle,
  ExternalLink,
  Info,
  Layers,
  Sparkles
} from 'lucide-react';
import { UserVRChatGroupItem } from '../../types';
import { extractVRChatGroupId } from '../../utils/vrchatUtils';

interface VRChatGroupManagerProps {
  customBanlists?: any[];
}

export const VRChatGroupManager: React.FC<VRChatGroupManagerProps> = ({
  customBanlists = []
}) => {
  const [groups, setGroups] = useState<UserVRChatGroupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Add Group Modal/Form state
  const [isAdding, setIsAdding] = useState(false);
  const [newGroupId, setNewGroupId] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newAutoBan, setNewAutoBan] = useState(true);
  const [newAutoUnban, setNewAutoUnban] = useState(true);
  const [newThreshold, setNewThreshold] = useState(-10);
  const [newCustomBanlistId, setNewCustomBanlistId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Syncing state per group
  const [syncingGroupId, setSyncingGroupId] = useState<string | null>(null);

  // Editing group state
  const [editingGroup, setEditingGroup] = useState<UserVRChatGroupItem | null>(null);

  const getAuthToken = () => localStorage.getItem('gg_token') || localStorage.getItem('adminToken') || '';

  const fetchUserGroups = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const res = await fetch('/api/user/vrchat-groups', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to load your VRChat groups');
      const data = await res.json();
      setGroups(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Error fetching groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserGroups();
  }, []);

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanedId = extractVRChatGroupId(newGroupId);
    if (!cleanedId || !cleanedId.startsWith('grp_')) {
      setError('Please provide a valid VRChat Group ID starting with "grp_".');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = getAuthToken();
      const res = await fetch('/api/user/vrchat-groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          groupId: cleanedId,
          groupName: newGroupName,
          autoBanEnabled: newAutoBan,
          autoUnbanEnabled: newAutoUnban,
          blacklistThreshold: newThreshold,
          customBanlistId: newCustomBanlistId
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add VRChat group');

      setSuccessMsg(`Group ${cleanedId} added and protected successfully!`);
      setNewGroupId('');
      setNewGroupName('');
      setIsAdding(false);
      fetchUserGroups();
    } catch (err: any) {
      setError(err.message || 'Error adding group');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateGroup = async (group: UserVRChatGroupItem) => {
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/user/vrchat-groups/${group.groupId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          autoBanEnabled: group.autoBanEnabled,
          autoUnbanEnabled: group.autoUnbanEnabled,
          blacklistThreshold: group.blacklistThreshold,
          customBanlistId: group.customBanlistId,
          status: group.status
        })
      });
      const d = await res.json();
      if (!res.ok) {
        throw new Error(d.error || 'Failed to update group');
      }

      if (group.publicListing) {
        await fetch(`/api/vrchat/groups/${group.groupId}/public-listing`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(group.publicListing)
        }).catch(() => null);
      }

      setSuccessMsg(`Settings updated for ${group.groupName || group.groupId}`);
      setTimeout(() => setSuccessMsg(''), 3000);
      setEditingGroup(null);
      fetchUserGroups();
    } catch (err: any) {
      setError(err.message || 'Error saving group settings');
    }
  };

  const handleTogglePublicListing = async (group: UserVRChatGroupItem) => {
    try {
      const token = getAuthToken();
      const currentListed = group.publicListing?.isListed || false;
      const res = await fetch(`/api/vrchat/groups/${group.groupId}/public-listing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          isListed: !currentListed,
          description: group.publicListing?.description || group.description || '',
          joinUrl: group.publicListing?.joinUrl || (group.shortCode ? `https://vrc.group/${group.shortCode}` : ''),
          category: group.publicListing?.category || 'VRChat Community'
        })
      });
      if (res.ok) {
        setSuccessMsg(!currentListed 
          ? `Group "${group.groupName || group.groupId}" is now listed in the BeSafe Protected Communities Directory!` 
          : `Group "${group.groupName || group.groupId}" removed from directory.`
        );
        setTimeout(() => setSuccessMsg(''), 4000);
        fetchUserGroups();
      }
    } catch (err: any) {
      setError(err.message || 'Error updating directory listing');
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm(`Are you sure you want to remove VRChat group ${groupId} from your dashboard?`)) return;
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/user/vrchat-groups/${groupId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to delete group');
      setSuccessMsg(`Group removed.`);
      fetchUserGroups();
    } catch (err: any) {
      setError(err.message || 'Error removing group');
    }
  };

  const handleManualSync = async (groupId: string) => {
    try {
      setSyncingGroupId(groupId);
      const token = getAuthToken();
      const res = await fetch(`/api/user/vrchat-groups/${groupId}/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sync failed');
      setSuccessMsg(data.message || 'Synchronized with BeSafe Network blacklist.');
      setTimeout(() => setSuccessMsg(''), 3500);
      fetchUserGroups();
    } catch (err: any) {
      setError(err.message || 'Error triggering sync');
    } finally {
      setSyncingGroupId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Feature Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/90 p-4 sm:p-6 rounded-2xl border border-zinc-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              VRChat Group Protection
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/80 border border-emerald-700/60 text-emerald-300">
              No Discord Required
            </span>
          </div>
          <p className="text-xs text-zinc-400 max-w-xl">
            Register and manage your VRChat groups directly. Even if you do not have a Discord server or account, BeSafe Network’s automated scanner monitors and enforces bans on blacklisted subjects automatically.
          </p>
        </div>

        <button
          onClick={() => { setIsAdding(!isAdding); setError(''); }}
          type="button"
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 active:scale-95"
        >
          {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{isAdding ? 'Cancel' : 'Register VRChat Group'}</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 font-mono text-xs flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </span>
          <button onClick={() => setError('')} className="text-rose-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-xl text-emerald-300 font-mono text-xs flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 flex-shrink-0" />
            {successMsg}
          </span>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Add Group Form */}
      {isAdding && (
        <form onSubmit={handleAddGroup} className="bg-zinc-900 p-5 rounded-2xl border-2 border-emerald-700/60 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Register New VRChat Group
            </h4>
            <span className="text-[11px] font-mono text-zinc-400">Step 1 of 1</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-[11px] uppercase font-bold text-zinc-300 mb-1.5">
                VRChat Group ID <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                required
                value={newGroupId}
                onChange={(e) => setNewGroupId(e.target.value)}
                placeholder="grp_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
              <p className="mt-1 text-[10px] text-zinc-500 font-mono">Found in your group URL: vrchat.com/home/group/grp_...</p>
            </div>

            <div>
              <label className="block font-mono text-[11px] uppercase font-bold text-zinc-300 mb-1.5">
                Group Display Name (Optional)
              </label>
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="e.g. Midnight Club VR"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
              <p className="mt-1 text-[10px] text-zinc-500 font-mono">Auto-retrieved from VRChat if bot is linked</p>
            </div>
          </div>

          {/* Security & Enforcement Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-800">
            <div className="space-y-3">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newAutoBan}
                  onChange={(e) => setNewAutoBan(e.target.checked)}
                  className="rounded bg-zinc-800 border-zinc-700 text-emerald-500 focus:ring-0 w-4 h-4"
                />
                <div>
                  <span className="font-mono text-xs font-bold text-zinc-200 block">Automated Ban Enforcer</span>
                  <span className="text-[10px] text-zinc-400 font-mono">Automatically ban blacklisted subjects when detected</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newAutoUnban}
                  onChange={(e) => setNewAutoUnban(e.target.checked)}
                  className="rounded bg-zinc-800 border-zinc-700 text-emerald-500 focus:ring-0 w-4 h-4"
                />
                <div>
                  <span className="font-mono text-xs font-bold text-zinc-200 block">Automated Unban on Appeal</span>
                  <span className="text-[10px] text-zinc-400 font-mono">Remove group ban if a subject's appeal is approved</span>
                </div>
              </label>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-mono text-[11px] uppercase font-bold text-zinc-300">
                    Reputation Ban Threshold
                  </label>
                  <span className="font-mono text-xs font-bold text-rose-400">{newThreshold}</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="0"
                  step="5"
                  value={newThreshold}
                  onChange={(e) => setNewThreshold(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
                <span className="text-[10px] text-zinc-500 font-mono block">Subjects with reputation at or below this score will be banned.</span>
              </div>

              {customBanlists.length > 0 && (
                <div>
                  <label className="block font-mono text-[11px] uppercase font-bold text-zinc-300 mb-1">
                    Custom Banlist Link (Optional)
                  </label>
                  <select
                    value={newCustomBanlistId}
                    onChange={(e) => setNewCustomBanlistId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">None (Global Network Blacklist Only)</option>
                    {customBanlists.map((b) => (
                      <option key={b.id || b._id} value={b.id || b._id}>
                        {b.name} ({b.entries?.length || 0} entries)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 rounded-xl border border-zinc-700 text-xs font-mono text-zinc-300 hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-mono text-xs font-bold transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Registering...' : 'Save & Protect Group'}
            </button>
          </div>
        </form>
      )}

      {/* Groups List */}
      {loading ? (
        <div className="p-8 text-center bg-zinc-900/50 rounded-2xl border border-zinc-800 font-mono text-xs text-zinc-500 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
          Loading your VRChat groups...
        </div>
      ) : groups.length === 0 ? (
        <div className="p-8 sm:p-12 text-center bg-zinc-900/40 rounded-2xl border border-dashed border-zinc-800 space-y-3">
          <Users className="w-12 h-12 text-zinc-600 mx-auto" />
          <h4 className="text-base font-bold text-zinc-300">No VRChat Groups Registered Yet</h4>
          <p className="text-xs text-zinc-500 max-w-md mx-auto font-mono">
            You don't need a Discord account or Discord bot to safeguard your VRChat groups. Register your group ID above to activate automated ban protection.
          </p>
          <button
            onClick={() => setIsAdding(true)}
            className="mt-2 px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-mono text-xs font-bold transition-all"
          >
            + Register Your First Group
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((grp) => (
            <div 
              key={grp.groupId}
              className="bg-zinc-900/90 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-all p-4 sm:p-5 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-zinc-800 border border-zinc-700 overflow-hidden flex items-center justify-center text-zinc-400 font-bold font-mono flex-shrink-0">
                      {grp.iconUrl ? (
                        <img src={grp.iconUrl} alt={grp.groupName} className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-5 h-5 text-emerald-400" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white flex items-center gap-2">
                        {grp.groupName || grp.groupId}
                        {grp.shortCode && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                            {grp.shortCode}
                          </span>
                        )}
                      </h4>
                      <p className="font-mono text-[11px] text-zinc-400">{grp.groupId}</p>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                    grp.status === 'active' 
                      ? 'bg-emerald-950/80 border border-emerald-700/60 text-emerald-300'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                  }`}>
                    {grp.status}
                  </span>
                </div>

                {/* Badges and Parameters */}
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="p-2 rounded-lg bg-zinc-800/60 border border-zinc-700/60">
                    <span className="text-zinc-500 block text-[9px] uppercase">Auto-Ban</span>
                    <span className={grp.autoBanEnabled ? 'text-emerald-400 font-bold' : 'text-zinc-400'}>
                      {grp.autoBanEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-800/60 border border-zinc-700/60">
                    <span className="text-zinc-500 block text-[9px] uppercase">Ban Threshold</span>
                    <span className="text-rose-400 font-bold">{grp.blacklistThreshold}</span>
                  </div>
                </div>

                {grp.lastSyncedAt && (
                  <p className="text-[10px] font-mono text-zinc-500">
                    Last Synced: {new Date(grp.lastSyncedAt).toLocaleString()}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleManualSync(grp.groupId)}
                    disabled={syncingGroupId === grp.groupId}
                    title="Sync with BeSafe Network blacklists now"
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingGroupId === grp.groupId ? 'animate-spin text-emerald-400' : ''}`} />
                    <span>Sync</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTogglePublicListing(grp)}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                      grp.publicListing?.isListed
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60 hover:bg-emerald-900'
                        : 'bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700'
                    }`}
                    title="Toggle public listing on BeSafe Protected Communities Directory"
                  >
                    {grp.publicListing?.isListed ? '🌐 Listed Publicly' : '🔒 Unlisted'}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingGroup(grp)}
                    className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
                    title="Edit group settings & public listing"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteGroup(grp.groupId)}
                    className="p-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/60 transition-colors cursor-pointer"
                    title="Remove group"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Group Modal */}
      {editingGroup && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h4 className="font-mono text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                Configure {editingGroup.groupName || editingGroup.groupId}
              </h4>
              <button onClick={() => setEditingGroup(null)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingGroup.autoBanEnabled}
                  onChange={(e) => setEditingGroup({ ...editingGroup, autoBanEnabled: e.target.checked })}
                  className="rounded bg-zinc-800 border-zinc-700 text-emerald-500 w-4 h-4"
                />
                <span className="font-mono text-xs text-zinc-200">Auto-Ban Blacklisted Subjects</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingGroup.autoUnbanEnabled}
                  onChange={(e) => setEditingGroup({ ...editingGroup, autoUnbanEnabled: e.target.checked })}
                  className="rounded bg-zinc-800 border-zinc-700 text-emerald-500 w-4 h-4"
                />
                <span className="font-mono text-xs text-zinc-200">Auto-Unban When Appeal is Accepted</span>
              </label>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-mono text-xs text-zinc-300">Ban Threshold</label>
                  <span className="font-mono text-xs font-bold text-rose-400">{editingGroup.blacklistThreshold}</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="0"
                  step="5"
                  value={editingGroup.blacklistThreshold}
                  onChange={(e) => setEditingGroup({ ...editingGroup, blacklistThreshold: Number(e.target.value) })}
                  className="w-full accent-emerald-500"
                />
              </div>

              {customBanlists.length > 0 && (
                <div>
                  <label className="block font-mono text-xs text-zinc-300 mb-1">Linked Custom Banlist</label>
                  <select
                    value={editingGroup.customBanlistId || ''}
                    onChange={(e) => setEditingGroup({ ...editingGroup, customBanlistId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white font-mono text-xs"
                  >
                    <option value="">None (Global Network Only)</option>
                    {customBanlists.map((b) => (
                      <option key={b.id || b._id} value={b.id || b._id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Public Directory Listing Controls */}
              <div className="space-y-3 pt-3 border-t border-zinc-800">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingGroup.publicListing?.isListed || false}
                      onChange={(e) => setEditingGroup({
                        ...editingGroup,
                        publicListing: {
                          ...editingGroup.publicListing,
                          isListed: e.target.checked,
                          category: editingGroup.publicListing?.category || 'Social & Hangout',
                          joinUrl: editingGroup.publicListing?.joinUrl || '',
                          description: editingGroup.publicListing?.description || ''
                        }
                      })}
                      className="rounded bg-zinc-800 border-zinc-700 text-emerald-500 w-4 h-4"
                    />
                    <span className="font-mono text-xs text-white font-bold">List on Public Protected Communities Directory</span>
                  </label>
                  <span className="text-[10px] font-mono text-emerald-400">/communities</span>
                </div>

                {editingGroup.publicListing?.isListed && (
                  <div className="space-y-3 pl-3 border-l-2 border-emerald-500/40">
                    <div>
                      <label className="block font-mono text-[10px] text-zinc-400 uppercase font-semibold mb-1">
                        Community Category
                      </label>
                      <select
                        value={editingGroup.publicListing?.category || 'Social & Hangout'}
                        onChange={(e) => setEditingGroup({
                          ...editingGroup,
                          publicListing: {
                            ...editingGroup.publicListing!,
                            category: e.target.value
                          }
                        })}
                        className="w-full px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white font-mono text-xs"
                      >
                        <option value="Social & Hangout">Social & Hangout</option>
                        <option value="VR & 3D Design">VR & 3D Design</option>
                        <option value="Gaming & Events">Gaming & Events</option>
                        <option value="Nightlife & Music">Nightlife & Music</option>
                        <option value="Security & Moderation">Security & Moderation</option>
                        <option value="Roleplay & Anime">Roleplay & Anime</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-mono text-[10px] text-zinc-400 uppercase font-semibold mb-1">
                        Public Join Link (vrc.group/...)
                      </label>
                      <input
                        type="text"
                        value={editingGroup.publicListing?.joinUrl || ''}
                        onChange={(e) => setEditingGroup({
                          ...editingGroup,
                          publicListing: {
                            ...editingGroup.publicListing!,
                            joinUrl: e.target.value
                          }
                        })}
                        placeholder="https://vrc.group/..."
                        className="w-full px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white font-mono text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-mono text-[10px] text-zinc-400 uppercase font-semibold mb-1">
                        Public Description
                      </label>
                      <textarea
                        rows={2}
                        value={editingGroup.publicListing?.description || ''}
                        onChange={(e) => setEditingGroup({
                          ...editingGroup,
                          publicListing: {
                            ...editingGroup.publicListing!,
                            description: e.target.value
                          }
                        })}
                        placeholder="Short description displayed on /communities..."
                        className="w-full px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white font-mono text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
              <button
                onClick={() => setEditingGroup(null)}
                className="px-4 py-2 rounded-xl border border-zinc-700 text-xs font-mono text-zinc-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateGroup(editingGroup)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-mono text-xs font-bold"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
