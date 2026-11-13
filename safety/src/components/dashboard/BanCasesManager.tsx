import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldAlert, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Search, 
  ExternalLink, 
  RefreshCw, 
  UserX, 
  AlertTriangle, 
  Copy, 
  Check, 
  Layers, 
  Link as LinkIcon,
  Gamepad2,
  MessageSquare,
  FileText,
  UserCheck,
  Edit3
} from 'lucide-react';
import { BanCase } from '../../types';

interface BanCasesManagerProps {
  onDataChanged?: () => void;
  isAdmin?: boolean;
}

export default function BanCasesManager({ onDataChanged, isAdmin = true }: BanCasesManagerProps) {
  const [cases, setCases] = useState<BanCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'lifted'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [isSyncingBans, setIsSyncingBans] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Case Form State
  const [title, setTitle] = useState('');
  const [reason, setReason] = useState('');
  const [severity, setSeverity] = useState<'permanent' | 'temporary' | 'critical' | 'warning'>('permanent');
  const [notes, setNotes] = useState('');
  const [evidenceInput, setEvidenceInput] = useState('');
  
  // Multiple Discord Accounts for New Case
  const [discordAccounts, setDiscordAccounts] = useState<Array<{ discordId: string; username: string; notes: string }>>([
    { discordId: '', username: '', notes: '' }
  ]);

  // Multiple VRChat Accounts for New Case (can be used independently with 0 Discord accounts!)
  const [vrchatAccounts, setVrchatAccounts] = useState<Array<{ vrchatUserId: string; vrchatUsername: string; notes: string }>>([
    { vrchatUserId: '', vrchatUsername: '', notes: '' }
  ]);

  // Add Account to existing case modal
  const [selectedCaseForAdd, setSelectedCaseForAdd] = useState<BanCase | null>(null);
  const [addAccountType, setAddAccountType] = useState<'discord' | 'vrchat'>('discord');
  const [addAccountId, setAddAccountId] = useState('');
  const [addAccountUsername, setAddAccountUsername] = useState('');
  const [addAccountNotes, setAddAccountNotes] = useState('');

  // Lift Ban Case modal
  const [selectedCaseForLift, setSelectedCaseForLift] = useState<BanCase | null>(null);
  const [liftReason, setLiftReason] = useState('');

  // Edit Ban Case modal
  const [selectedCaseForEdit, setSelectedCaseForEdit] = useState<BanCase | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editReason, setEditReason] = useState('');
  const [editSeverity, setEditSeverity] = useState<'permanent' | 'temporary' | 'critical' | 'warning'>('permanent');
  const [editNotes, setEditNotes] = useState('');
  const [editEvidenceInput, setEditEvidenceInput] = useState('');
  const [editIsDangerous, setEditIsDangerous] = useState(false);
  const [editDangerousNotes, setEditDangerousNotes] = useState('');
  const [editDiscordAccounts, setEditDiscordAccounts] = useState<Array<{ discordId: string; username: string; notes: string }>>([]);
  const [editVrchatAccounts, setEditVrchatAccounts] = useState<Array<{ vrchatUserId: string; vrchatUsername: string; notes: string }>>([]);

  const fetchBanCases = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('gg_token');
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await fetch(`/api/admin/ban-cases?${params.toString()}`, {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error('Failed to load ban cases');
      }

      const data = await res.json();
      setCases(data);
    } catch (err: any) {
      setError(err?.message || 'Error fetching ban cases');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBanCases();
  }, [filterStatus]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddDiscordRow = () => {
    setDiscordAccounts([...discordAccounts, { discordId: '', username: '', notes: '' }]);
  };

  const handleRemoveDiscordRow = (index: number) => {
    setDiscordAccounts(discordAccounts.filter((_, i) => i !== index));
  };

  const handleUpdateDiscordRow = (index: number, field: string, val: string) => {
    const updated = [...discordAccounts];
    updated[index] = { ...updated[index], [field]: val };
    setDiscordAccounts(updated);
  };

  const handleAddVRChatRow = () => {
    setVrchatAccounts([...vrchatAccounts, { vrchatUserId: '', vrchatUsername: '', notes: '' }]);
  };

  const handleRemoveVRChatRow = (index: number) => {
    setVrchatAccounts(vrchatAccounts.filter((_, i) => i !== index));
  };

  const handleUpdateVRChatRow = (index: number, field: string, val: string) => {
    const updated = [...vrchatAccounts];
    updated[index] = { ...updated[index], [field]: val };
    setVrchatAccounts(updated);
  };

  const resetForm = () => {
    setTitle('');
    setReason('');
    setSeverity('permanent');
    setNotes('');
    setEvidenceInput('');
    setDiscordAccounts([{ discordId: '', username: '', notes: '' }]);
    setVrchatAccounts([{ vrchatUserId: '', vrchatUsername: '', notes: '' }]);
  };

  const handleCreateBanCase = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const validDiscord = discordAccounts.filter(d => d.discordId.trim());
    const validVRChat = vrchatAccounts.filter(v => v.vrchatUserId.trim() || v.vrchatUsername.trim());

    if (validDiscord.length === 0 && validVRChat.length === 0) {
      setError('Please provide at least one Discord ID or one VRChat Account (ID/Username). Standalone VRChat bans without Discord are supported.');
      return;
    }

    if (!reason.trim()) {
      setError('Ban violation reason is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('gg_token');
      const evidenceLinks = evidenceInput
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.startsWith('http://') || s.startsWith('https://'));

      const res = await fetch('/api/admin/ban-cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: title.trim(),
          reason: reason.trim(),
          severity,
          notes: notes.trim(),
          evidenceLinks,
          discordAccounts: validDiscord,
          vrchatAccounts: validVRChat
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create ban case');
      }

      setSuccess(`Ban Case #${data.banCase?.caseNumber} successfully established with ${validDiscord.length} Discord and ${validVRChat.length} VRChat accounts linked and banned.`);
      setIsCreateModalOpen(false);
      resetForm();
      fetchBanCases();
      if (onDataChanged) onDataChanged();
      setTimeout(() => setSuccess(null), 6000);
    } catch (err: any) {
      setError(err?.message || 'Failed to create ban case');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLiftBanCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseForLift) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const token = localStorage.getItem('gg_token');
      const res = await fetch(`/api/admin/ban-cases/${selectedCaseForLift._id || selectedCaseForLift.caseNumber}/unban`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ unbanReason: liftReason.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to lift ban case');
      }

      const liftedCase = data.banCase as BanCase;
      setCases((currentCases) => filterStatus === 'active'
        ? currentCases.filter((banCase) => banCase._id !== liftedCase._id && banCase.caseNumber !== liftedCase.caseNumber)
        : currentCases.map((banCase) => banCase._id === liftedCase._id || banCase.caseNumber === liftedCase.caseNumber
          ? liftedCase
          : banCase));
      setSuccess(`Ban Case #${selectedCaseForLift.caseNumber} lifted. All associated Discord & VRChat accounts have been unbanned.`);
      setSelectedCaseForLift(null);
      setLiftReason('');
      await fetchBanCases();
      if (onDataChanged) onDataChanged();
      setTimeout(() => setSuccess(null), 6000);
    } catch (err: any) {
      setError(err?.message || 'Failed to lift ban case');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRebanBanCase = async (c: BanCase) => {
    if (!confirm(`Re-instate Ban Case #${c.caseNumber}?\n\nThis will re-apply global bans to all ${c.discordAccounts?.length || 0} Discord accounts and ${c.vrchatAccounts?.length || 0} VRChat accounts linked to this case.`)) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('gg_token');
      const res = await fetch(`/api/admin/ban-cases/${c._id || c.caseNumber}/reban`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: 'Reinstated by Administrator' })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to re-instate ban case');

      setSuccess(`Ban Case #${c.caseNumber} reinstated across all accounts.`);
      fetchBanCases();
      if (onDataChanged) onDataChanged();
      setTimeout(() => setSuccess(null), 6000);
    } catch (err: any) {
      setError(err?.message || 'Failed to re-instate ban case');
    } finally {
      setIsLoading(false);
    }
  };

  const openEditModal = (c: BanCase) => {
    setSelectedCaseForEdit(c);
    setEditTitle(c.title || '');
    setEditReason(c.reason || '');
    setEditSeverity((c.severity as any) || 'permanent');
    setEditNotes(c.notes || '');
    setEditEvidenceInput((c.evidenceLinks || []).join('\n'));
    setEditIsDangerous(!!c.isDangerous);
    setEditDangerousNotes(c.dangerousNotes || '');
    setEditDiscordAccounts(
      (c.discordAccounts || []).map((d) => ({
        discordId: d.discordId,
        username: d.username || d.displayName || '',
        notes: d.notes || ''
      }))
    );
    setEditVrchatAccounts(
      (c.vrchatAccounts || []).map((v) => ({
        vrchatUserId: v.vrchatUserId || '',
        vrchatUsername: v.vrchatUsername || '',
        notes: v.notes || ''
      }))
    );
  };

  const handleEditBanCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseForEdit) return;
    if (!editReason.trim()) {
      setError('Ban violation reason cannot be empty.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const token = localStorage.getItem('gg_token');
      const evidenceLinks = editEvidenceInput
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch(`/api/admin/ban-cases/${selectedCaseForEdit._id || selectedCaseForEdit.caseNumber}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: editTitle.trim(),
          reason: editReason.trim(),
          severity: editSeverity,
          notes: editNotes.trim(),
          evidenceLinks,
          isDangerous: editIsDangerous,
          dangerousNotes: editDangerousNotes.trim(),
          discordAccounts: editDiscordAccounts,
          vrchatAccounts: editVrchatAccounts
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update ban case');
      }

      const updatedCase = data.banCase as BanCase;
      setCases((prev) =>
        prev.map((item) =>
          item._id === updatedCase._id || item.caseNumber === updatedCase.caseNumber ? updatedCase : item
        )
      );
      setSuccess(`Ban Case #${selectedCaseForEdit.caseNumber} updated and synchronized across linked records.`);
      setSelectedCaseForEdit(null);
      if (onDataChanged) onDataChanged();
      setTimeout(() => setSuccess(null), 6000);
    } catch (err: any) {
      setError(err?.message || 'Failed to update ban case');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddAccountToCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseForAdd || !addAccountId.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const token = localStorage.getItem('gg_token');
      const res = await fetch(`/api/admin/ban-cases/${selectedCaseForAdd._id || selectedCaseForAdd.caseNumber}/add-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          type: addAccountType,
          id: addAccountId.trim(),
          username: addAccountUsername.trim(),
          notes: addAccountNotes.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add account to ban case');

      setSuccess(`Account linked and banned in Case #${selectedCaseForAdd.caseNumber}.`);
      setSelectedCaseForAdd(null);
      setAddAccountId('');
      setAddAccountUsername('');
      setAddAccountNotes('');
      fetchBanCases();
      if (onDataChanged) onDataChanged();
      setTimeout(() => setSuccess(null), 6000);
    } catch (err: any) {
      setError(err?.message || 'Failed to add account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveAccountFromCase = async (c: BanCase, type: 'discord' | 'vrchat', id: string) => {
    if (!confirm(`Unlink and unban ${type.toUpperCase()} account (${id}) from Case #${c.caseNumber}?`)) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('gg_token');
      const res = await fetch(`/api/admin/ban-cases/${c._id || c.caseNumber}/remove-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          type,
          id,
          unbanReason: `Removed from Ban Case #${c.caseNumber} by Administrator`
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove account');

      setSuccess(`Account ${id} removed and unbanned from Case #${c.caseNumber}.`);
      fetchBanCases();
      if (onDataChanged) onDataChanged();
      setTimeout(() => setSuccess(null), 6000);
    } catch (err: any) {
      setError(err?.message || 'Failed to remove account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCase = async (c: BanCase) => {
    if (!confirm(`⚠️ PERMANENTLY DELETE BAN CASE #${c.caseNumber}?\n\nIf this case is active, all associated accounts will be unbanned and this case record removed.`)) {
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('gg_token');
      const res = await fetch(`/api/admin/ban-cases/${c._id || c.caseNumber}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete ban case');
      }

      setSuccess(`Ban Case #${c.caseNumber} deleted.`);
      fetchBanCases();
      if (onDataChanged) onDataChanged();
      setTimeout(() => setSuccess(null), 6000);
    } catch (err: any) {
      setError(err?.message || 'Failed to delete ban case');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMigrateLegacyBans = async () => {
    if (!confirm('Migrate all legacy bans into Ban Cases and clear the old ban list?\n\nThis will scan all old banned user records, convert them into organized Ban Cases linking their Discord & VRChat accounts, and clear the legacy ban list.')) {
      return;
    }

    setIsMigrating(true);
    setError(null);
    setSuccess(null);
    try {
      const token = localStorage.getItem('gg_token');
      const res = await fetch('/api/admin/ban-cases/migrate-legacy', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to migrate legacy bans');

      setSuccess(data.message || `Successfully migrated ${data.migratedCount} legacy bans into Ban Cases and cleared the old ban list!`);
      fetchBanCases();
      if (onDataChanged) onDataChanged();
      setTimeout(() => setSuccess(null), 8000);
    } catch (err: any) {
      setError(err?.message || 'Failed to execute legacy ban migration');
    } finally {
      setIsMigrating(false);
    }
  };

  const handleToggleWatchlist = async (c: BanCase) => {
    setError(null);
    try {
      const token = localStorage.getItem('gg_token');
      const res = await fetch(`/api/admin/ban-cases/${c._id || c.caseNumber}/toggle-watchlist`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to toggle watchlist');

      setSuccess(`Watchlist status updated for Case #${c.caseNumber} (${data.isDangerous ? 'Enrolled in High Risk Watchlist' : 'Removed from Watchlist'}).`);
      setCases(prev => prev.map(item => (item.caseNumber === c.caseNumber || item._id === c._id) ? { ...item, isDangerous: data.isDangerous, trustIndex: data.trustIndex } : item));
      if (onDataChanged) onDataChanged();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err?.message || 'Failed to toggle watchlist');
    }
  };

  const handleSyncAllBans = async () => {
    if (!confirm('Synchronize all active Ban Cases across Discord and VRChat now?\n\nThis will push all banned Discord accounts across connected Discord guilds and ban all linked VRChat accounts in connected VRChat groups.')) {
      return;
    }

    setIsSyncingBans(true);
    setError(null);
    setSuccess(null);
    try {
      const token = localStorage.getItem('gg_token');
      const res = await fetch('/api/admin/bans/sync-all', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to sync bans');

      const skippedNote = data.skippedCount > 0 ? ` (${data.skippedCount} invalid or unreachable entries skipped)` : '';
      setSuccess(data.message || `Synchronized ${data.activeCasesCount} active cases across Discord & VRChat${skippedNote}.`);
      fetchBanCases();
      if (onDataChanged) onDataChanged();
      setTimeout(() => setSuccess(null), 8000);
    } catch (err: any) {
      setError(err?.message || 'Failed to sync bans across platforms');
    } finally {
      setIsSyncingBans(false);
    }
  };

  // Summary statistics
  const stats = useMemo(() => {
    const totalCases = cases.length;
    const activeCases = cases.filter(c => c.status === 'active').length;
    const liftedCases = cases.filter(c => c.status === 'lifted').length;
    const totalDiscordAccounts = cases.reduce((acc, c) => acc + (c.discordAccounts?.length || 0), 0);
    const totalVRChatAccounts = cases.reduce((acc, c) => acc + (c.vrchatAccounts?.length || 0), 0);
    return { totalCases, activeCases, liftedCases, totalDiscordAccounts, totalVRChatAccounts };
  }, [cases]);

  return (
    <div className="space-y-6">
      {/* HEADER BAR */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-zinc-900 tracking-tight">
                Ban Cases & Account Registry
              </h2>
              <p className="text-xs text-zinc-500 font-medium">
                Unified ban cases linking multiple Discord and VRChat accounts. Supports standalone VRChat bans with auto-unban on case lift.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isAdmin && (
            <>
              <button
                onClick={handleSyncAllBans}
                disabled={isSyncingBans}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                title="Synchronize all active Ban Cases across connected Discord servers and VRChat groups"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncingBans ? 'animate-spin' : ''}`} />
                {isSyncingBans ? 'Syncing Bans...' : 'Sync Cross-Platform Bans'}
              </button>

              <button
                onClick={handleMigrateLegacyBans}
                disabled={isMigrating}
                className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                title="Import all old banned records into structured Ban Cases"
              >
                <RefreshCw className={`w-4 h-4 ${isMigrating ? 'animate-spin' : ''}`} />
                {isMigrating ? 'Migrating Bans...' : 'Migrate Legacy Bans'}
              </button>
            </>
          )}

          <button
            onClick={() => {
              resetForm();
              setIsCreateModalOpen(true);
            }}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Ban Case
          </button>
          <button
            onClick={fetchBanCases}
            title="Refresh list"
            className="p-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* FEEDBACK MESSAGES */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700">✕</button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-emerald-500 hover:text-emerald-700">✕</button>
        </div>
      )}

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-xs">
          <span className="text-[10px] font-mono font-bold uppercase text-zinc-400 block mb-1">Active Ban Cases</span>
          <span className="text-2xl font-black text-rose-600">{stats.activeCases}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-xs">
          <span className="text-[10px] font-mono font-bold uppercase text-zinc-400 block mb-1">Lifted / Pardoned Cases</span>
          <span className="text-2xl font-black text-emerald-600">{stats.liftedCases}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-xs">
          <span className="text-[10px] font-mono font-bold uppercase text-zinc-400 block mb-1">Linked Discord Accounts</span>
          <span className="text-2xl font-black text-indigo-600">{stats.totalDiscordAccounts}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-xs">
          <span className="text-[10px] font-mono font-bold uppercase text-zinc-400 block mb-1">Linked VRChat Accounts</span>
          <span className="text-2xl font-black text-amber-600">{stats.totalVRChatAccounts}</span>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROLS */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-zinc-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setFilterStatus('active')}
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              filterStatus === 'active' ? 'bg-white text-rose-700 shadow-xs' : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Active ({stats.activeCases})
          </button>
          <button
            onClick={() => setFilterStatus('lifted')}
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              filterStatus === 'lifted' ? 'bg-white text-emerald-700 shadow-xs' : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Lifted ({stats.liftedCases})
          </button>
          <button
            onClick={() => setFilterStatus('all')}
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              filterStatus === 'all' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            All ({cases.length})
          </button>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchBanCases()}
            placeholder="Search case #, Discord ID, VRChat ID..."
            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-9 pr-4 py-2 text-xs font-mono focus:outline-none focus:border-rose-500 focus:bg-white"
          />
        </div>
      </div>

      {/* CASES CARDS / LIST */}
      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-zinc-200/80">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-zinc-400 mb-2" />
          <p className="text-xs text-zinc-500 font-mono">Loading ban cases...</p>
        </div>
      ) : cases.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-zinc-200/80 space-y-3">
          <ShieldAlert className="w-10 h-10 mx-auto text-zinc-300" />
          <p className="text-sm font-bold text-zinc-700">No ban cases found</p>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            {searchQuery ? `No cases match "${searchQuery}" in ${filterStatus} filter.` : 'Create a new ban case to link multiple Discord and VRChat accounts.'}
          </p>
          <button
            onClick={() => {
              resetForm();
              setIsCreateModalOpen(true);
            }}
            className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl uppercase tracking-wider hover:bg-rose-700 transition-all cursor-pointer"
          >
            + Create First Ban Case
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {cases.map((c) => {
            const isActive = c.status === 'active';
            const discordList = c.discordAccounts || [];
            const vrchatList = c.vrchatAccounts || [];

            return (
              <div
                key={c._id || c.caseNumber}
                className={`bg-white rounded-2xl border transition-all p-5 space-y-4 shadow-sm ${
                  isActive ? 'border-zinc-200/80 hover:border-zinc-300' : 'border-emerald-200/80 bg-emerald-50/10'
                }`}
              >
                {/* CASE TOP HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-3">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className="font-mono text-xs font-black px-2.5 py-1 bg-zinc-900 text-white rounded-lg">
                      #{c.caseNumber}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                        isActive
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {isActive ? 'ACTIVE GLOBAL BAN' : 'BAN LIFTED / PARDONED'}
                    </span>
                    {c.severity && (
                      <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold bg-zinc-100 px-2 py-0.5 rounded">
                        {c.severity}
                      </span>
                    )}
                    <span className="text-[10px] font-mono uppercase text-rose-700 font-bold bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                      Trust Idx: {c.trustIndex || (isActive || c.isDangerous ? 'BLACKLISTED' : 'ALL CLEAR')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                    <span>By: <strong className="text-zinc-700">{c.bannedBy || 'Administrator'}</strong></span>
                    <span>•</span>
                    <span>{new Date(c.createdAt || Date.now()).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* CASE REASON & DETAILS */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  <div className="lg:col-span-8 space-y-2">
                    {c.title && (
                      <h4 className="text-sm font-bold text-zinc-900">{c.title}</h4>
                    )}
                    <div className="bg-zinc-50 border border-zinc-200/60 p-3 rounded-xl">
                      <span className="text-[9px] font-mono uppercase font-bold text-zinc-400 block mb-1">Violation Reason</span>
                      <p className="text-xs text-zinc-800 font-medium whitespace-pre-wrap">{c.reason}</p>
                    </div>

                    {c.notes && (
                      <div className="text-xs text-zinc-500 bg-amber-50/50 border border-amber-200/60 p-2.5 rounded-xl font-mono">
                        <strong className="text-amber-800 block text-[9px] uppercase mb-0.5">Staff Internal Notes:</strong>
                        {c.notes}
                      </div>
                    )}

                    {/* Evidence links */}
                    {c.evidenceLinks && c.evidenceLinks.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono uppercase font-bold text-zinc-400 block">Evidence Artifacts ({c.evidenceLinks.length})</span>
                        <div className="flex flex-wrap gap-1.5">
                          {c.evidenceLinks.map((url, idx) => (
                            <a
                              key={idx}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-indigo-600 hover:text-indigo-800 rounded-lg text-[10px] font-mono flex items-center gap-1 transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Evidence #{idx + 1}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* CASE MANAGEMENT ACTIONS */}
                  <div className="lg:col-span-4 flex flex-col justify-between gap-2.5 bg-zinc-50/70 p-3.5 rounded-xl border border-zinc-200/60">
                    <span className="text-[9px] font-mono uppercase font-bold text-zinc-400">Case Authority</span>

                    <div className="space-y-2">
                      <button
                        onClick={() => openEditModal(c)}
                        className="w-full py-2 px-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit Case Details & Evidence
                      </button>

                      <button
                        onClick={() => {
                          setSelectedCaseForAdd(c);
                          setAddAccountType('discord');
                          setAddAccountId('');
                          setAddAccountUsername('');
                          setAddAccountNotes('');
                        }}
                        className="w-full py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Link Additional Account
                      </button>

                      <button
                        onClick={() => handleToggleWatchlist(c)}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border cursor-pointer ${
                          c.isDangerous
                            ? 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100'
                            : 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200'
                        }`}
                        title="Toggle enrollment on the High Risk Watchlist page"
                      >
                        <AlertTriangle className={`w-3.5 h-3.5 ${c.isDangerous ? 'text-rose-600' : 'text-zinc-400'}`} />
                        <span>Watchlist: {c.isDangerous ? 'ENROLLED (ON)' : 'EXCLUDED (OFF)'}</span>
                      </button>

                      {isActive ? (
                        <button
                          onClick={() => {
                            setSelectedCaseForLift(c);
                            setLiftReason('');
                          }}
                          className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                        >
                          <UserCheck className="w-3.5 h-3.5" /> Lift Ban Case (Unban All)
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRebanBanCase(c)}
                          className="w-full py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                        >
                          <UserX className="w-3.5 h-3.5" /> Re-instate Ban Case (Re-ban All)
                        </button>
                      )}
                    </div>

                    <div className="pt-2 border-t border-zinc-200/60 flex items-center justify-between">
                      <span className="text-[9px] font-mono text-zinc-400">Total Accounts: {discordList.length + vrchatList.length}</span>
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteCase(c)}
                          title="Delete case"
                          className="text-zinc-400 hover:text-rose-600 text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3 h-3" /> Delete Case
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* LINKED ACCOUNTS SECTION */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-zinc-100">
                  {/* DISCORD ACCOUNTS */}
                  <div className="bg-zinc-50 border border-zinc-200/70 p-3.5 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-indigo-700 font-bold text-xs font-mono uppercase">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Discord Accounts ({discordList.length})</span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedCaseForAdd(c);
                          setAddAccountType('discord');
                        }}
                        className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold font-mono cursor-pointer"
                      >
                        + Add Discord
                      </button>
                    </div>

                    {discordList.length === 0 ? (
                      <p className="text-[11px] text-zinc-400 italic">No Discord account linked (VRChat standalone ban case).</p>
                    ) : (
                      <div className="space-y-1.5">
                        {discordList.map((d, i) => (
                          <div
                            key={i}
                            className="bg-white p-2.5 rounded-lg border border-zinc-200/70 flex items-center justify-between gap-2 text-xs shadow-2xs"
                          >
                            <div className="truncate flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-zinc-900 truncate">
                                  {d.username || 'Discord User'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] font-mono text-zinc-500 truncate">{d.discordId}</span>
                                <button
                                  onClick={() => handleCopy(d.discordId)}
                                  className="text-zinc-400 hover:text-zinc-600"
                                  title="Copy Snowflake"
                                >
                                  {copiedId === d.discordId ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                              {d.notes && (
                                <span className="text-[9px] text-zinc-400 italic block">{d.notes}</span>
                              )}
                            </div>

                            {isAdmin && (
                              <button
                                onClick={() => handleRemoveAccountFromCase(c, 'discord', d.discordId)}
                                title="Unlink & unban this Discord account"
                                className="text-zinc-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* VRCHAT ACCOUNTS */}
                  <div className="bg-zinc-50 border border-zinc-200/70 p-3.5 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-amber-700 font-bold text-xs font-mono uppercase">
                        <Gamepad2 className="w-3.5 h-3.5" />
                        <span>VRChat Accounts ({vrchatList.length})</span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedCaseForAdd(c);
                          setAddAccountType('vrchat');
                        }}
                        className="text-[10px] text-amber-600 hover:text-amber-800 font-bold font-mono cursor-pointer"
                      >
                        + Add VRChat
                      </button>
                    </div>

                    {vrchatList.length === 0 ? (
                      <p className="text-[11px] text-zinc-400 italic">No VRChat account linked to this case yet.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {vrchatList.map((v, i) => (
                          <div
                            key={i}
                            className="bg-white p-2.5 rounded-lg border border-zinc-200/70 flex items-center justify-between gap-2 text-xs shadow-2xs"
                          >
                            <div className="truncate flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-zinc-900 truncate">
                                  {v.vrchatUsername || v.vrchatUserId || 'VRChat Account'}
                                </span>
                              </div>
                              {v.vrchatUserId && (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[10px] font-mono text-zinc-500 truncate">{v.vrchatUserId}</span>
                                  <button
                                    onClick={() => handleCopy(v.vrchatUserId)}
                                    className="text-zinc-400 hover:text-zinc-600"
                                    title="Copy VRChat ID"
                                  >
                                    {copiedId === v.vrchatUserId ? (
                                      <Check className="w-3 h-3 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              )}
                              {v.notes && (
                                <span className="text-[9px] text-zinc-400 italic block">{v.notes}</span>
                              )}
                            </div>

                            {isAdmin && (
                              <button
                                onClick={() => handleRemoveAccountFromCase(c, 'vrchat', v.vrchatUserId || v.vrchatUsername)}
                                title="Unlink & unban this VRChat account"
                                className="text-zinc-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: CREATE BAN CASE */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-zinc-200 shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-black text-zinc-900">Create Unified Ban Case</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 text-lg p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBanCase} className="space-y-5">
              {/* PRIMARY DETAILS */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] font-mono font-bold uppercase text-zinc-500">Case Title / Reference (Optional)</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Malicious User Network / Raid"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-rose-500 focus:bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold uppercase text-zinc-500">Severity</label>
                    <select
                      value={severity}
                      onChange={(e: any) => setSeverity(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-xs font-mono focus:outline-none focus:border-rose-500 focus:bg-white"
                    >
                      <option value="permanent">Permanent Ban</option>
                      <option value="critical">Critical Malicious</option>
                      <option value="temporary">Temporary Suspension</option>
                      <option value="warning">Warning Only</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold uppercase text-zinc-500">
                    Violation Reason <strong className="text-rose-600">*</strong>
                  </label>
                  <textarea
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Specify the violation reasons, incident details, and grounds for banning..."
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs focus:outline-none focus:border-rose-500 focus:bg-white h-20 resize-none"
                  />
                </div>
              </div>

              {/* DISCORD ACCOUNTS SECTION */}
              <div className="p-4 bg-indigo-50/40 border border-indigo-100 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-indigo-900 font-bold text-xs uppercase font-mono">
                    <MessageSquare className="w-4 h-4 text-indigo-600" />
                    <span>Discord Accounts ({discordAccounts.filter(d => d.discordId.trim()).length})</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddDiscordRow}
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 font-mono bg-white px-2 py-1 rounded border border-indigo-200 hover:bg-indigo-50 transition-all cursor-pointer"
                  >
                    + Add Another Discord
                  </button>
                </div>
                <p className="text-[10px] text-zinc-500">
                  You can link multiple Discord accounts. Leave empty if banning standalone VRChat accounts only.
                </p>

                <div className="space-y-2">
                  {discordAccounts.map((account, index) => (
                    <div key={index} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-white p-2.5 rounded-lg border border-indigo-100">
                      <div className="flex-1 w-full sm:w-auto">
                        <input
                          type="text"
                          value={account.discordId}
                          onChange={(e) => handleUpdateDiscordRow(index, 'discordId', e.target.value)}
                          placeholder="Discord Snowflake ID (e.g. 192837465912)"
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2 text-xs font-mono focus:outline-none focus:border-indigo-500 focus:bg-white"
                        />
                      </div>
                      <div className="w-full sm:w-40">
                        <input
                          type="text"
                          value={account.username}
                          onChange={(e) => handleUpdateDiscordRow(index, 'username', e.target.value)}
                          placeholder="Username / Tag (opt)"
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-500 focus:bg-white"
                        />
                      </div>
                      {discordAccounts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveDiscordRow(index)}
                          className="p-2 text-zinc-400 hover:text-rose-600 self-end sm:self-center"
                          title="Remove row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* VRCHAT ACCOUNTS SECTION */}
              <div className="p-4 bg-amber-50/40 border border-amber-100 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs uppercase font-mono">
                    <Gamepad2 className="w-4 h-4 text-amber-600" />
                    <span>VRChat Accounts ({vrchatAccounts.filter(v => v.vrchatUserId.trim() || v.vrchatUsername.trim()).length})</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddVRChatRow}
                    className="text-[10px] font-bold text-amber-600 hover:text-amber-800 font-mono bg-white px-2 py-1 rounded border border-amber-200 hover:bg-amber-50 transition-all cursor-pointer"
                  >
                    + Add Another VRChat
                  </button>
                </div>
                <p className="text-[10px] text-zinc-500">
                  Bans will be executed in all VRChat groups. Accepts VRChat User ID (<code>usr_...</code>), Username, or Profile URL.
                </p>

                <div className="space-y-2">
                  {vrchatAccounts.map((account, index) => (
                    <div key={index} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-white p-2.5 rounded-lg border border-amber-100">
                      <div className="flex-1 w-full sm:w-auto">
                        <input
                          type="text"
                          value={account.vrchatUserId}
                          onChange={(e) => handleUpdateVRChatRow(index, 'vrchatUserId', e.target.value)}
                          placeholder="VRChat ID (usr_xxx) or Profile URL"
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2 text-xs font-mono focus:outline-none focus:border-amber-500 focus:bg-white"
                        />
                      </div>
                      <div className="w-full sm:w-40">
                        <input
                          type="text"
                          value={account.vrchatUsername}
                          onChange={(e) => handleUpdateVRChatRow(index, 'vrchatUsername', e.target.value)}
                          placeholder="Display Name (opt)"
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2 text-xs focus:outline-none focus:border-amber-500 focus:bg-white"
                        />
                      </div>
                      {vrchatAccounts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveVRChatRow(index)}
                          className="p-2 text-zinc-400 hover:text-rose-600 self-end sm:self-center"
                          title="Remove row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* EVIDENCE & NOTES */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold uppercase text-zinc-500">Evidence Links (One per line)</label>
                  <textarea
                    value={evidenceInput}
                    onChange={(e) => setEvidenceInput(e.target.value)}
                    placeholder="https://imgur.com/...\nhttps://cdn.discordapp.com/..."
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-xs font-mono focus:outline-none focus:border-rose-500 focus:bg-white h-20 resize-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold uppercase text-zinc-500">Internal Staff Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Internal reference notes, cross-server IDs, or context..."
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-rose-500 focus:bg-white h-20 resize-none"
                  />
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 text-zinc-600 hover:bg-zinc-100 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Establishing Ban Case...
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-4 h-4" />
                      Establish Ban Case
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LINK ACCOUNT TO EXISTING CASE */}
      {selectedCaseForAdd && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-zinc-200 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-zinc-900">Link Account to Case #{selectedCaseForAdd.caseNumber}</h3>
                <p className="text-[11px] text-zinc-500">Account will immediately inherit the ban and be synchronised.</p>
              </div>
              <button
                onClick={() => setSelectedCaseForAdd(null)}
                className="text-zinc-400 hover:text-zinc-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddAccountToCase} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold uppercase text-zinc-500">Account Platform</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAddAccountType('discord')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold font-mono uppercase flex items-center justify-center gap-2 border transition-all ${
                      addAccountType === 'discord'
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-800'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-500'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Discord
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddAccountType('vrchat')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold font-mono uppercase flex items-center justify-center gap-2 border transition-all ${
                      addAccountType === 'vrchat'
                        ? 'bg-amber-50 border-amber-300 text-amber-800'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-500'
                    }`}
                  >
                    <Gamepad2 className="w-3.5 h-3.5" /> VRChat
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold uppercase text-zinc-500">
                  {addAccountType === 'discord' ? 'Discord Snowflake ID *' : 'VRChat User ID (usr_xxx) or Username *'}
                </label>
                <input
                  required
                  type="text"
                  value={addAccountId}
                  onChange={(e) => setAddAccountId(e.target.value)}
                  placeholder={addAccountType === 'discord' ? 'e.g. 192837465912' : 'e.g. usr_c1644b5b-3ca4-45b4-97c6-a2a0de70d070'}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-xs font-mono focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold uppercase text-zinc-500">Display Name (Optional)</label>
                <input
                  type="text"
                  value={addAccountUsername}
                  onChange={(e) => setAddAccountUsername(e.target.value)}
                  placeholder="Username / Tag"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold uppercase text-zinc-500">Account Note (Optional)</label>
                <input
                  type="text"
                  value={addAccountNotes}
                  onChange={(e) => setAddAccountNotes(e.target.value)}
                  placeholder="e.g. Alternate account identified during raid"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setSelectedCaseForAdd(null)}
                  className="px-4 py-2 text-zinc-600 hover:bg-zinc-100 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-xs cursor-pointer"
                >
                  {isSubmitting ? 'Linking...' : 'Link & Ban Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LIFT BAN CASE */}
      {selectedCaseForLift && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-zinc-200 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-zinc-900">Lift Ban Case #{selectedCaseForLift.caseNumber}</h3>
              </div>
              <button
                onClick={() => setSelectedCaseForLift(null)}
                className="text-zinc-400 hover:text-zinc-700"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 space-y-1">
              <p className="font-bold">⚠️ Comprehensive Case Pardon Protocol:</p>
              <p>
                Lifting this ban case will automatically unban all <strong>{selectedCaseForLift.discordAccounts?.length || 0} Discord</strong> and <strong>{selectedCaseForLift.vrchatAccounts?.length || 0} VRChat accounts</strong> linked to this case, including lifting bans from all VRChat groups.
              </p>
            </div>

            <form onSubmit={handleLiftBanCase} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold uppercase text-zinc-500">Unban / Pardon Reason</label>
                <textarea
                  value={liftReason}
                  onChange={(e) => setLiftReason(e.target.value)}
                  placeholder="e.g. Appeal approved, evidence resolved, or pardon granted..."
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white h-20 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setSelectedCaseForLift(null)}
                  className="px-4 py-2 text-zinc-600 hover:bg-zinc-100 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? 'Lifting Bans Everywhere...' : 'Lift Ban Case & Unban All'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT BAN CASE */}
      {selectedCaseForEdit && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-zinc-200 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-zinc-900 text-white rounded-xl">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-zinc-900">
                    Edit Ban Case #{selectedCaseForEdit.caseNumber}
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    Modify case name, reason, severity, evidence links, staff notes, watchlist notes, and linked account names.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCaseForEdit(null)}
                className="text-zinc-400 hover:text-zinc-700 text-lg p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditBanCase} className="space-y-5">
              {/* TITLE & SEVERITY */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[10px] font-mono font-bold uppercase text-zinc-500">
                    Case Title / Primary Subject Name
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="e.g. Primary Subject Alias or Incident Title"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-zinc-900 focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold uppercase text-zinc-500">Severity</label>
                  <select
                    value={editSeverity}
                    onChange={(e: any) => setEditSeverity(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-xs font-mono focus:outline-none focus:border-zinc-900 focus:bg-white"
                  >
                    <option value="permanent">Permanent Ban</option>
                    <option value="critical">Critical Malicious</option>
                    <option value="temporary">Temporary Suspension</option>
                    <option value="warning">Warning Only</option>
                  </select>
                </div>
              </div>

              {/* BAN REASON */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold uppercase text-zinc-500">
                  Violation Reason <strong className="text-rose-600">*</strong>
                </label>
                <textarea
                  required
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="Specify the violation reasons, incident details, and grounds for banning..."
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs focus:outline-none focus:border-zinc-900 focus:bg-white h-24 resize-none"
                />
              </div>

              {/* EVIDENCE & INTERNAL NOTES */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold uppercase text-zinc-500">
                    Evidence Links (One URL per line)
                  </label>
                  <textarea
                    value={editEvidenceInput}
                    onChange={(e) => setEditEvidenceInput(e.target.value)}
                    placeholder="https://imgur.com/...\nhttps://cdn.discordapp.com/..."
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-xs font-mono focus:outline-none focus:border-zinc-900 focus:bg-white h-24 resize-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold uppercase text-zinc-500">
                    Staff Internal Notes
                  </label>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Internal reference notes, cross-server IDs, or investigator context..."
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-zinc-900 focus:bg-white h-24 resize-none"
                  />
                </div>
              </div>

              {/* HIGH-RISK WATCHLIST SETTINGS */}
              <div className="p-3.5 bg-rose-50/50 border border-rose-200/80 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span className="text-xs font-bold text-rose-900">High-Risk Public Watchlist Enrollment</span>
                  </div>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editIsDangerous}
                      onChange={(e) => setEditIsDangerous(e.target.checked)}
                      className="w-4 h-4 accent-rose-600 rounded"
                    />
                    <span className="text-xs font-mono font-bold text-rose-700">
                      {editIsDangerous ? 'ENROLLED' : 'NOT ENROLLED'}
                    </span>
                  </label>
                </div>
                {editIsDangerous && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold uppercase text-rose-700">
                      Public Watchlist Threat Summary (Optional override)
                    </label>
                    <input
                      type="text"
                      value={editDangerousNotes}
                      onChange={(e) => setEditDangerousNotes(e.target.value)}
                      placeholder="Publicly visible summary on the Community Watchlist..."
                      className="w-full bg-white border border-rose-200 rounded-lg p-2 text-xs focus:outline-none focus:border-rose-500"
                    />
                  </div>
                )}
              </div>

              {/* LINKED DISCORD ACCOUNTS NAMES & NOTES */}
              {editDiscordAccounts.length > 0 && (
                <div className="p-3.5 bg-indigo-50/40 border border-indigo-100 rounded-xl space-y-2.5">
                  <div className="flex items-center gap-1.5 text-indigo-900 font-bold text-xs font-mono uppercase">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Linked Discord Account Names & Notes ({editDiscordAccounts.length})</span>
                  </div>
                  <div className="space-y-2">
                    {editDiscordAccounts.map((acc, idx) => (
                      <div key={acc.discordId || idx} className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-white p-2.5 rounded-lg border border-indigo-100">
                        <div>
                          <span className="text-[9px] font-mono uppercase text-zinc-400 block">Discord ID</span>
                          <span className="text-xs font-mono font-bold text-zinc-700">{acc.discordId}</span>
                        </div>
                        <div>
                          <label className="text-[9px] font-mono uppercase text-zinc-400 block">Display Name / Tag</label>
                          <input
                            type="text"
                            value={acc.username}
                            onChange={(e) => {
                              const next = [...editDiscordAccounts];
                              next[idx] = { ...next[idx], username: e.target.value };
                              setEditDiscordAccounts(next);
                            }}
                            placeholder="Username"
                            className="w-full bg-zinc-50 border border-zinc-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-mono uppercase text-zinc-400 block">Account Note</label>
                          <input
                            type="text"
                            value={acc.notes}
                            onChange={(e) => {
                              const next = [...editDiscordAccounts];
                              next[idx] = { ...next[idx], notes: e.target.value };
                              setEditDiscordAccounts(next);
                            }}
                            placeholder="Optional note..."
                            className="w-full bg-zinc-50 border border-zinc-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* LINKED VRCHAT ACCOUNTS NAMES & NOTES */}
              {editVrchatAccounts.length > 0 && (
                <div className="p-3.5 bg-amber-50/40 border border-amber-100 rounded-xl space-y-2.5">
                  <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs font-mono uppercase">
                    <Gamepad2 className="w-3.5 h-3.5 text-amber-600" />
                    <span>Linked VRChat Account Names & Notes ({editVrchatAccounts.length})</span>
                  </div>
                  <div className="space-y-2">
                    {editVrchatAccounts.map((acc, idx) => (
                      <div key={acc.vrchatUserId || idx} className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-white p-2.5 rounded-lg border border-amber-100">
                        <div>
                          <span className="text-[9px] font-mono uppercase text-zinc-400 block">VRChat User ID</span>
                          <span className="text-xs font-mono font-bold text-zinc-700 truncate block">{acc.vrchatUserId || 'N/A'}</span>
                        </div>
                        <div>
                          <label className="text-[9px] font-mono uppercase text-zinc-400 block">Display Name</label>
                          <input
                            type="text"
                            value={acc.vrchatUsername}
                            onChange={(e) => {
                              const next = [...editVrchatAccounts];
                              next[idx] = { ...next[idx], vrchatUsername: e.target.value };
                              setEditVrchatAccounts(next);
                            }}
                            placeholder="VRChat Display Name"
                            className="w-full bg-zinc-50 border border-zinc-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-mono uppercase text-zinc-400 block">Account Note</label>
                          <input
                            type="text"
                            value={acc.notes}
                            onChange={(e) => {
                              const next = [...editVrchatAccounts];
                              next[idx] = { ...next[idx], notes: e.target.value };
                              setEditVrchatAccounts(next);
                            }}
                            placeholder="Optional note..."
                            className="w-full bg-zinc-50 border border-zinc-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setSelectedCaseForEdit(null)}
                  className="px-4 py-2.5 text-zinc-600 hover:bg-zinc-100 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Save Case Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
