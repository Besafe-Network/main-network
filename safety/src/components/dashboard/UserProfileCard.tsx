import React, { useState } from 'react';
import { 
  User, 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  Edit3, 
  Check, 
  X, 
  Sparkles, 
  Calendar, 
  Mail, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ExternalLink,
  MessageSquare,
  Gamepad2,
  Share2
} from 'lucide-react';
import { UserProfile } from '../../types';

interface UserProfileCardProps {
  profile: UserProfile | null;
  onProfileUpdated: (updated: UserProfile) => void;
  onNavigateTab: (tab: string) => void;
}

export const UserProfileCard: React.FC<UserProfileCardProps> = ({
  profile,
  onProfileUpdated,
  onNavigateTab
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  if (!profile) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError('');
    try {
      const token = localStorage.getItem('gg_token') || localStorage.getItem('adminToken');
      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ displayName, avatarUrl, bio })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');
      
      onProfileUpdated({
        ...profile,
        displayName,
        avatarUrl,
        bio
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setIsEditing(false);
      }, 1200);
    } catch (err: any) {
      setSaveError(err.message || 'Error updating profile');
    } finally {
      setIsSaving(false);
    }
  };

  const reputationScore = profile.reputation?.score ?? 100;
  const isTrusted = profile.reputation?.isTrusted;
  const isBanned = profile.reputation?.isBanned;

  return (
    <div className="bg-[#18181B] border-2 border-zinc-800 rounded-2xl overflow-hidden shadow-xl text-zinc-100 transition-all">
      {/* Top Banner Gradient */}
      <div className="h-28 sm:h-36 bg-gradient-to-r from-zinc-900 via-indigo-950 to-zinc-900 relative border-b border-zinc-800 p-4 sm:p-6 flex justify-between items-start">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest bg-zinc-900/80 border border-zinc-700 text-zinc-300 backdrop-blur-sm flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            Active Account
          </span>
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest border backdrop-blur-sm ${
            profile.role === 'admin' 
              ? 'bg-rose-950/70 border-rose-700 text-rose-300'
              : profile.role === 'moderator'
              ? 'bg-amber-950/70 border-amber-700 text-amber-300'
              : 'bg-zinc-800/70 border-zinc-700 text-zinc-300'
          }`}>
            {profile.role}
          </span>
        </div>

        <button
          onClick={() => {
            setIsEditing(!isEditing);
            setDisplayName(profile.displayName || profile.username);
            setAvatarUrl(profile.avatarUrl || '');
            setBio(profile.bio || '');
          }}
          type="button"
          className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 transition-all flex items-center gap-1.5 shadow-sm"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
        </button>
      </div>

      {/* Main Profile Info Section */}
      <div className="px-4 sm:px-6 pb-6 pt-0 relative">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-12 sm:-mt-16 gap-4 mb-4">
          {/* Avatar and Identity */}
          <div className="flex items-end gap-4">
            <div className="relative group">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-zinc-800 border-4 border-[#18181B] overflow-hidden flex items-center justify-center shadow-lg text-zinc-400 font-bold text-2xl font-mono">
                {profile.avatarUrl ? (
                  <img 
                    src={profile.avatarUrl} 
                    alt={profile.displayName || profile.username}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <User className="w-10 h-10 sm:w-12 sm:h-12 text-zinc-500" />
                )}
              </div>
              {profile.isAgeVerified && (
                <div 
                  title="Age Verified Adult (18+)"
                  className="absolute -bottom-1 -right-1 bg-emerald-500 text-zinc-950 p-1 rounded-lg shadow-md border-2 border-[#18181B]"
                >
                  <ShieldCheck className="w-4 h-4" />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-bold font-sans tracking-tight text-white">
                  {profile.displayName || profile.username}
                </h2>
                {isTrusted && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-950 border border-indigo-700 text-indigo-300">
                    TRUSTED
                  </span>
                )}
                {isBanned && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950 border border-rose-700 text-rose-300">
                    BANNED
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-zinc-400">@{profile.username}</p>
            </div>
          </div>

          {/* Age Verification Quick Status */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {profile.isAgeVerified ? (
              <div className="px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 flex items-center gap-2 font-mono text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Verified Adult (18+)</span>
              </div>
            ) : profile.verificationStatus === 'pending' ? (
              <div className="px-3 py-1.5 rounded-xl bg-amber-950/60 border border-amber-700/60 text-amber-300 flex items-center gap-2 font-mono text-xs font-bold">
                <Clock className="w-4 h-4 text-amber-400 animate-spin" />
                <span>Verification Under Review</span>
              </div>
            ) : (
              <button
                onClick={() => onNavigateTab('verify')}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 font-mono text-xs font-bold transition-all shadow-md active:scale-95"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Complete Age Verification</span>
              </button>
            )}
          </div>
        </div>

        {/* Bio */}
        {profile.bio && !isEditing && (
          <p className="text-sm text-zinc-300 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800/80 mb-4 whitespace-pre-wrap">
            {profile.bio}
          </p>
        )}

        {/* Edit Form */}
        {isEditing && (
          <form onSubmit={handleSaveProfile} className="bg-zinc-900 p-4 rounded-xl border border-zinc-700 space-y-4 mb-4">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-400">Edit Public Profile</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-mono text-[11px] text-zinc-400 uppercase font-semibold mb-1">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your Name / Callout"
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-mono text-[11px] text-zinc-400 uppercase font-semibold mb-1">Avatar Image URL</label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.png"
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-mono text-[11px] text-zinc-400 uppercase font-semibold mb-1">Bio / Notes</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
                placeholder="Brief intro, trusted affiliations, or community role..."
                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            {saveError && (
              <p className="font-mono text-xs text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {saveError}
              </p>
            )}

            {saveSuccess && (
              <p className="font-mono text-xs text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Profile updated successfully!
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 rounded-lg border border-zinc-700 text-xs font-mono text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold transition-all disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        )}

        {/* Quick Stats and Platform Connectivity Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {/* Reputation */}
          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
            <span className="block font-mono text-[10px] uppercase text-zinc-500 font-semibold mb-1">Reputation Score</span>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-xl font-mono font-bold ${
                reputationScore >= 90 ? 'text-emerald-400' : reputationScore >= 60 ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {reputationScore}
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">/ 100</span>
            </div>
          </div>

          {/* Discord Status */}
          <div 
            onClick={() => onNavigateTab('platforms')}
            className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 hover:border-zinc-700 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-[10px] uppercase text-zinc-500 font-semibold">Discord</span>
              <ExternalLink className="w-3 h-3 text-zinc-600 group-hover:text-zinc-400" />
            </div>
            <div className="font-mono text-xs font-bold truncate">
              {profile.discordId ? (
                <span className="text-indigo-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  Linked
                </span>
              ) : (
                <span className="text-zinc-500">Not Linked</span>
              )}
            </div>
          </div>

          {/* VRChat Status */}
          <div 
            onClick={() => onNavigateTab('platforms')}
            className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 hover:border-zinc-700 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-[10px] uppercase text-zinc-500 font-semibold">VRChat</span>
              <ExternalLink className="w-3 h-3 text-zinc-600 group-hover:text-zinc-400" />
            </div>
            <div className="font-mono text-xs font-bold truncate">
              {profile.vrchatUserId ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {profile.vrchatUsername || 'Connected'}
                </span>
              ) : (
                <span className="text-zinc-500">Not Linked</span>
              )}
            </div>
          </div>

          {/* Verification Status */}
          <div 
            onClick={() => onNavigateTab('verify')}
            className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 hover:border-zinc-700 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-[10px] uppercase text-zinc-500 font-semibold">18+ Verification</span>
              <ExternalLink className="w-3 h-3 text-zinc-600 group-hover:text-zinc-400" />
            </div>
            <div className="font-mono text-xs font-bold truncate">
              {profile.isAgeVerified ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Verified
                </span>
              ) : profile.verificationStatus === 'pending' ? (
                <span className="text-amber-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Pending
                </span>
              ) : (
                <span className="text-zinc-500">Unverified</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
