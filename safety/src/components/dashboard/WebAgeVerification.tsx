import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Upload, 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Lock, 
  Sparkles,
  Calendar,
  X,
  FileCheck,
  Shield
} from 'lucide-react';
import { compressImageFile } from '../../utils/imageCompressor';
import { UserProfile } from '../../types';

interface WebAgeVerificationProps {
  profile: UserProfile | null;
  onVerificationSubmitted?: () => void;
}

export const WebAgeVerification: React.FC<WebAgeVerificationProps> = ({
  profile,
  onVerificationSubmitted
}) => {
  const [idPhoto, setIdPhoto] = useState<string | null>(null);
  const [facePhoto, setFacePhoto] = useState<string | null>(null);
  const [dob, setDob] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'id' | 'face') => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file);
        if (type === 'id') setIdPhoto(compressed);
        else setFacePhoto(compressed);
      } catch (err) {
        setErrorMessage('Failed to process image. Please try a different photo.');
      }
    }
  };

  const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!idPhoto) {
      setErrorMessage('Please upload a photo of your valid government-issued ID.');
      return;
    }
    if (!facePhoto) {
      setErrorMessage('Please upload a clear selfie photo of your face holding or next to your ID.');
      return;
    }
    if (!dob) {
      setErrorMessage('Please select your Date of Birth.');
      return;
    }

    const calculatedAge = calculateAge(dob);
    if (calculatedAge < 18) {
      setErrorMessage(`Based on the entered date of birth, you are ${calculatedAge} years old. You must be at least 18 years old to verify.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('gg_token') || localStorage.getItem('adminToken') || '';
      const res = await fetch('/api/verify/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: profile?.discordId || profile?._id || '',
          username: profile?.username || '',
          idPhoto,
          facePhoto,
          dob,
          source: 'web'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit verification');

      setStatus('success');
      if (onVerificationSubmitted) {
        onVerificationSubmitted();
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Failed to submit verification request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Case 1: Already verified
  if (profile?.isAgeVerified || profile?.verificationStatus === 'approved') {
    return (
      <div className="bg-zinc-900 border-2 border-emerald-700/60 rounded-2xl p-6 sm:p-8 space-y-6 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-950/80 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-400">
          <ShieldCheck className="w-9 h-9" />
        </div>
        <div className="space-y-2 max-w-md mx-auto">
          <h3 className="text-xl sm:text-2xl font-bold text-white font-sans">
            Age Verification Confirmed
          </h3>
          <p className="text-xs text-zinc-400 font-mono">
            Your account is verified as an adult (18+). You have full access to age-restricted Discord servers, VRChat group instances, and safety badge status across BeSafe Network.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto pt-2 text-left font-mono text-xs">
          <div className="p-3 rounded-xl bg-zinc-800/80 border border-zinc-700/60">
            <span className="text-zinc-500 text-[10px] block uppercase">Network Status</span>
            <span className="text-emerald-400 font-bold">18+ Adult Verified</span>
          </div>
          <div className="p-3 rounded-xl bg-zinc-800/80 border border-zinc-700/60">
            <span className="text-zinc-500 text-[10px] block uppercase">Verification Date</span>
            <span className="text-zinc-200 font-bold">
              {profile.ageVerifiedAt ? new Date(profile.ageVerifiedAt).toLocaleDateString() : 'Active'}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-zinc-800/80 border border-zinc-700/60">
            <span className="text-zinc-500 text-[10px] block uppercase">Data Privacy</span>
            <span className="text-indigo-300 font-bold">Photos Purged</span>
          </div>
        </div>
      </div>
    );
  }

  // Case 2: Pending admin review
  if (profile?.verificationStatus === 'pending' || status === 'success') {
    return (
      <div className="bg-zinc-900 border-2 border-amber-700/60 rounded-2xl p-6 sm:p-8 space-y-6 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-950/80 border-2 border-amber-500 flex items-center justify-center mx-auto text-amber-400">
          <Clock className="w-9 h-9 animate-pulse" />
        </div>
        <div className="space-y-2 max-w-md mx-auto">
          <h3 className="text-xl sm:text-2xl font-bold text-white font-sans">
            Documents Under Review
          </h3>
          <p className="text-xs text-zinc-400 font-mono">
            Your verification request has been received directly through the website. BeSafe Network administrators will securely review your submission shortly.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-zinc-800/60 border border-zinc-700 max-w-md mx-auto text-left font-mono text-xs space-y-2">
          <div className="flex items-center gap-2 text-zinc-300 font-bold">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>Zero-Knowledge Retention Policy</span>
          </div>
          <p className="text-[11px] text-zinc-400">
            Once an administrator reviews your submission, your identification photos are permanently and irreversibly deleted from our databases.
          </p>
        </div>
      </div>
    );
  }

  // Case 3: Direct Website Age Verification Form
  return (
    <div className="space-y-6">
      <div className="bg-zinc-900 rounded-2xl p-5 sm:p-6 border border-zinc-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4 mb-6">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-400" />
              Direct Website Age Verification
            </h3>
            <p className="text-xs text-zinc-400 font-mono">
              Verify your age directly here on the website. No Discord slash command required.
            </p>
          </div>

          <span className="px-3 py-1 rounded-xl bg-indigo-950/80 border border-indigo-700 text-indigo-300 font-mono text-xs font-bold self-start sm:self-auto">
            18+ Age Restricted Gate
          </span>
        </div>

        {errorMessage && (
          <div className="mb-6 p-3.5 bg-rose-950/70 border border-rose-800 rounded-xl text-rose-300 font-mono text-xs flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {errorMessage}
            </span>
            <button onClick={() => setErrorMessage('')} className="text-rose-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* DOB Input */}
          <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700/60 max-w-md">
            <label className="block font-mono text-xs uppercase font-bold text-zinc-300 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              Date of Birth <span className="text-rose-400">*</span>
            </label>
            <input
              type="date"
              required
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
            />
            {dob && (
              <p className="mt-1.5 text-xs font-mono text-zinc-400">
                Calculated Age: <span className="font-bold text-indigo-300">{calculateAge(dob)} years old</span>
              </p>
            )}
          </div>

          {/* Photo Upload Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* ID Document Photo */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="font-mono text-xs uppercase font-bold text-zinc-300 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-indigo-400" />
                  1. Government ID Document <span className="text-rose-400">*</span>
                </label>
                {idPhoto && (
                  <button
                    type="button"
                    onClick={() => setIdPhoto(null)}
                    className="text-[10px] font-mono text-rose-400 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className={`relative border-2 border-dashed rounded-2xl h-56 flex flex-col items-center justify-center p-4 transition-all ${
                idPhoto ? 'border-emerald-500 bg-zinc-800/80' : 'border-zinc-700 hover:border-indigo-500 bg-zinc-800/30'
              }`}>
                {idPhoto ? (
                  <img src={idPhoto} alt="ID Document Preview" className="h-full w-full object-contain rounded-lg" />
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer text-center p-4">
                    <Upload className="w-8 h-8 text-zinc-500 mb-2" />
                    <span className="font-mono text-xs font-bold text-zinc-300">Upload ID Document</span>
                    <span className="text-[10px] text-zinc-500 font-mono mt-1">Driver's License, Passport, or National ID</span>
                    <span className="text-[9px] text-indigo-400 font-mono mt-2 underline">Click or Drag Image Here</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'id')}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Selfie with ID */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="font-mono text-xs uppercase font-bold text-zinc-300 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-indigo-400" />
                  2. Face Selfie with ID <span className="text-rose-400">*</span>
                </label>
                {facePhoto && (
                  <button
                    type="button"
                    onClick={() => setFacePhoto(null)}
                    className="text-[10px] font-mono text-rose-400 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className={`relative border-2 border-dashed rounded-2xl h-56 flex flex-col items-center justify-center p-4 transition-all ${
                facePhoto ? 'border-emerald-500 bg-zinc-800/80' : 'border-zinc-700 hover:border-indigo-500 bg-zinc-800/30'
              }`}>
                {facePhoto ? (
                  <img src={facePhoto} alt="Selfie Preview" className="h-full w-full object-contain rounded-lg" />
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer text-center p-4">
                    <Camera className="w-8 h-8 text-zinc-500 mb-2" />
                    <span className="font-mono text-xs font-bold text-zinc-300">Upload Face Selfie</span>
                    <span className="text-[10px] text-zinc-500 font-mono mt-1">Selfie showing your face holding the ID document</span>
                    <span className="text-[9px] text-indigo-400 font-mono mt-2 underline">Click or Drag Image Here</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'face')}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Privacy & Purging Guarantee Notice */}
          <div className="p-4 rounded-xl bg-zinc-800/40 border border-zinc-700/60 flex items-start gap-3">
            <Lock className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h5 className="font-mono text-xs font-bold text-white uppercase">Automated Document Purging Policy</h5>
              <p className="text-[11px] text-zinc-400 font-mono leading-relaxed">
                Your images are transferred over encrypted TLS and stored with restricted staff review access only. Upon review approval or rejection, both the ID photo and selfie photo are permanently unset and purged from our database storage.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold transition-all disabled:opacity-50 shadow-xl shadow-indigo-950/50 flex items-center gap-2 active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting Documents...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Age Verification Directly</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
