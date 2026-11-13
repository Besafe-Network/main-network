import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Camera, CheckCircle, AlertCircle, Loader2, ShieldCheck, Lock, ArrowLeft, Zap, Sparkles, Mail, Check } from 'lucide-react';
import axios from 'axios';
import { compressImageFile } from '../utils/imageCompressor';

export default function Verification() {
  const [searchParams] = useSearchParams();
  const queryUserId = searchParams.get('user_id');
  
  const [userId, setUserId] = useState(queryUserId || '');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [idPhoto, setIdPhoto] = useState<string | null>(null);
  const [facePhoto, setFacePhoto] = useState<string | null>(null);
  const [dob, setDob] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'auto-verified' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [autoVerifyMessage, setAutoVerifyMessage] = useState('');
  const [isCheckingDiscord, setIsCheckingDiscord] = useState(false);
  const [autoCheckNotice, setAutoCheckNotice] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAlreadyVerified, setIsAlreadyVerified] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('gg_token') || localStorage.getItem('adminToken');
    if (token) {
      fetch('/api/user/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setIsLoggedIn(true);
          if (data.email) setEmail(data.email);
          if (data.isAgeVerified) setIsAlreadyVerified(true);
          if (!queryUserId) {
            setUserId(data.discordId || data._id || data.username);
            setUsername(data.displayName || data.username);
          }
        }
      })
      .catch(() => {});
    }
  }, [queryUserId]);

  const handleAutoCheckDiscord = async () => {
    if (!email.trim() && !userId.trim()) {
      setAutoCheckNotice({
        type: 'error',
        text: 'Please enter your email address or Discord ID to check against verified Discord records.'
      });
      return;
    }

    setIsCheckingDiscord(true);
    setAutoCheckNotice(null);
    try {
      const token = localStorage.getItem('gg_token') || localStorage.getItem('adminToken');
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await axios.post('/api/verify/auto-check', {
        email: email.trim(),
        userId: userId.trim()
      }, { headers });

      if (res.data.verified || res.data.autoVerified) {
        setStatus('auto-verified');
        setAutoVerifyMessage(res.data.message || 'Verified! Your email matches an already verified Discord user.');
        setIsAlreadyVerified(true);
      } else {
        setAutoCheckNotice({
          type: 'info',
          text: res.data.message || 'No verified Discord user was found matching that email. Please submit standard verification below.'
        });
      }
    } catch (err: any) {
      setAutoCheckNotice({
        type: 'error',
        text: err.response?.data?.error || 'Could not perform auto-verification check. Please try again or submit your documents.'
      });
    } finally {
      setIsCheckingDiscord(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'id' | 'face') => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file);
        if (type === 'id') setIdPhoto(compressed);
        else setFacePhoto(compressed);
      } catch (err) {
        setErrorMessage('Failed to process image file. Please try another image.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim() || !idPhoto || !facePhoto || !dob) {
      setErrorMessage('Please provide your identifier, Date of Birth, ID document photo, and face selfie.');
      return;
    }

    setStatus('submitting');
    setErrorMessage('');
    try {
      const token = localStorage.getItem('gg_token') || localStorage.getItem('adminToken');
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await axios.post('/api/verify/request', {
        userId: userId.trim(),
        username: username.trim(),
        email: email.trim(),
        idPhoto,
        facePhoto,
        dob,
        source: 'web'
      }, { headers });

      if (res.data.autoVerified) {
        setStatus('auto-verified');
        setAutoVerifyMessage(res.data.message || 'Auto-verified! Your email matches an already verified Discord user.');
        setIsAlreadyVerified(true);
      } else {
        setStatus('success');
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.response?.data?.error || 'Failed to submit verification request. Please try again.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-10 mb-24 px-4 sm:px-0">
      <header className="space-y-3">
        <Link 
          to="/dashboard" 
          className="inline-flex items-center gap-1.5 font-mono text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 uppercase tracking-widest transition-colors mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-4xl sm:text-5xl font-bold uppercase tracking-tighter leading-none text-zinc-900 dark:text-zinc-100">
            Age Verification
          </h1>
          {isAlreadyVerified && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
              <Check className="w-3 h-3" /> 18+ VERIFIED
            </span>
          )}
        </div>
        <p className="font-mono text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-xl">
          Complete direct age verification to join BeSafe Network as a verified adult (18+). If your account email matches an already verified Discord user, verification is instantaneous!
        </p>
      </header>

      {/* Auto-verification Banner if already verified */}
      {isAlreadyVerified && status !== 'auto-verified' && (
        <div className="border border-emerald-500/40 bg-emerald-500/10 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-emerald-500 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-emerald-950 dark:text-emerald-100 text-sm uppercase">You Are Already Age Verified!</h3>
              <p className="font-mono text-xs text-emerald-800 dark:text-emerald-300">
                Your account is confirmed adult (18+). You have full access to age-restricted Discord servers, enterprise APIs, and verified roles.
              </p>
            </div>
          </div>
          <Link
            to="/dashboard"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-mono text-xs font-bold rounded-xl transition-all flex-shrink-0"
          >
            Go to Dashboard
          </Link>
        </div>
      )}

      {/* Instant Discord Auto-Verification Feature Card */}
      {!isAlreadyVerified && status !== 'success' && status !== 'auto-verified' && (
        <section className="bg-gradient-to-br from-indigo-950/20 via-purple-950/20 to-zinc-900 border-2 border-indigo-500/40 rounded-2xl p-6 space-y-4 shadow-lg">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-indigo-400 font-mono font-bold text-xs uppercase tracking-wider">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Instant Discord Auto-Verification</span>
              <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-[10px] text-indigo-300 border border-indigo-500/30">Auto Sync</span>
            </div>
          </div>
          <p className="font-mono text-xs text-zinc-300 leading-relaxed">
            Already verified in our Discord community? If your account email matches an already verified Discord user, you don't need to upload ID documents—verification is instant!
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your account email..."
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-700 text-zinc-100 font-mono text-xs focus:outline-none focus:border-indigo-400 placeholder:text-zinc-500"
              />
            </div>
            <button
              type="button"
              onClick={handleAutoCheckDiscord}
              disabled={isCheckingDiscord}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50 cursor-pointer"
            >
              {isCheckingDiscord ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Checking Discord...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Check & Auto-Verify</span>
                </>
              )}
            </button>
          </div>

          {autoCheckNotice && (
            <div className={`p-3.5 rounded-xl font-mono text-xs flex items-center gap-2.5 ${
              autoCheckNotice.type === 'error'
                ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                : 'bg-zinc-800 border border-zinc-700 text-zinc-300'
            }`}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{autoCheckNotice.text}</span>
            </div>
          )}
        </section>
      )}

      <AnimatePresence mode="wait">
        {status === 'auto-verified' ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 p-8 sm:p-12 text-center rounded-2xl space-y-4 shadow-xl"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-bold uppercase tracking-tight text-emerald-950 dark:text-emerald-100">
              Account Auto-Verified!
            </h2>
            <p className="font-mono text-xs sm:text-sm text-emerald-800 dark:text-emerald-300 max-w-lg mx-auto">
              {autoVerifyMessage || 'Your account was automatically verified because your email matches an already verified Discord user! You now have full 18+ access across the network.'}
            </p>
            <div className="pt-4 flex items-center justify-center gap-4">
              <Link
                to="/dashboard"
                className="inline-block px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-mono text-xs font-bold transition-all shadow-md"
              >
                Go to Dashboard
              </Link>
              <Link
                to="/developers"
                className="inline-block px-6 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono text-xs font-bold transition-all border border-zinc-700"
              >
                Developer API
              </Link>
            </div>
          </motion.div>
        ) : status === 'success' ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="border-2 border-emerald-600 dark:border-emerald-500 p-8 sm:p-12 text-center bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl space-y-4"
          >
            <CheckCircle className="w-16 h-16 mx-auto text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-3xl font-bold uppercase tracking-tight text-emerald-950 dark:text-emerald-100">
              Request Submitted
            </h2>
            <p className="font-mono text-xs sm:text-sm text-emerald-800 dark:text-emerald-300 max-w-lg mx-auto">
              Our staff will review your documents shortly. Once verified, your status will be updated automatically on your account.
            </p>
            <div className="pt-4">
              <Link
                to="/dashboard"
                className="inline-block px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-mono text-xs font-bold transition-all shadow-md"
              >
                Return to Dashboard
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.form 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={handleSubmit} 
            className="space-y-8 bg-white dark:bg-[#18181B] p-6 sm:p-8 rounded-2xl border-2 border-zinc-900 dark:border-zinc-800 shadow-xl"
          >
            {/* User Identification Section */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <label className="block font-mono text-xs uppercase font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  User ID or Discord ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Discord ID, Web User ID, or usr_..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
                <p className="mt-1 text-[10px] text-zinc-500 font-mono">
                  {isLoggedIn ? 'Auto-filled from your logged in account' : 'Enter your Discord User ID or BeSafe Network username'}
                </p>
              </div>

              <div>
                <label className="block font-mono text-xs uppercase font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Account Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
                <p className="mt-1 text-[10px] text-zinc-500 font-mono">
                  Auto-verifies if email matches a verified Discord user
                </p>
              </div>

              <div>
                <label className="block font-mono text-xs uppercase font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Username / Display Handle
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. username#1234 or display name"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Document Uploads */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ID Upload */}
              <div className="space-y-2">
                <label className="block font-mono text-xs uppercase font-bold text-zinc-700 dark:text-zinc-300">
                  1. Valid ID Document <span className="text-rose-500">*</span>
                </label>
                <div className={`relative border-2 border-dashed rounded-2xl h-60 flex flex-col items-center justify-center p-4 transition-all ${
                  idPhoto 
                    ? 'border-emerald-500 bg-emerald-500/5' 
                    : 'border-zinc-300 dark:border-zinc-700 hover:border-indigo-500 bg-zinc-50 dark:bg-zinc-900/50'
                }`}>
                  {idPhoto ? (
                    <img src={idPhoto} alt="ID Preview" className="h-full w-full object-contain rounded-lg" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 mb-2 text-zinc-400" />
                      <span className="font-mono text-xs font-bold text-zinc-700 dark:text-zinc-300">Upload ID Document</span>
                      <span className="font-mono text-[10px] text-zinc-500 mt-1">Driver's License, Passport, or National ID</span>
                    </>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => handleFileChange(e, 'id')} 
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              {/* Face Photo */}
              <div className="space-y-2">
                <label className="block font-mono text-xs uppercase font-bold text-zinc-700 dark:text-zinc-300">
                  2. Face Selfie with ID <span className="text-rose-500">*</span>
                </label>
                <div className={`relative border-2 border-dashed rounded-2xl h-60 flex flex-col items-center justify-center p-4 transition-all ${
                  facePhoto 
                    ? 'border-emerald-500 bg-emerald-500/5' 
                    : 'border-zinc-300 dark:border-zinc-700 hover:border-indigo-500 bg-zinc-50 dark:bg-zinc-900/50'
                }`}>
                  {facePhoto ? (
                    <img src={facePhoto} alt="Face Preview" className="h-full w-full object-contain rounded-lg" />
                  ) : (
                    <>
                      <Camera className="w-8 h-8 mb-2 text-zinc-400" />
                      <span className="font-mono text-xs font-bold text-zinc-700 dark:text-zinc-300">Take or Upload Face Selfie</span>
                      <span className="font-mono text-[10px] text-zinc-500 mt-1">Holding your ID document next to your face</span>
                    </>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => handleFileChange(e, 'face')} 
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Date of Birth */}
            <div className="space-y-2 max-w-sm">
              <label className="block font-mono text-xs uppercase font-bold text-zinc-700 dark:text-zinc-300">
                Date of Birth <span className="text-rose-500">*</span>
              </label>
              <input 
                type="date" 
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            {status === 'error' && (
              <div className="bg-rose-100 dark:bg-rose-950/60 border border-rose-600 dark:border-rose-800 p-4 rounded-xl flex items-center gap-3 text-rose-900 dark:text-rose-300">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="font-mono text-xs">{errorMessage}</p>
              </div>
            )}

            <button 
              type="submit"
              disabled={status === 'submitting'}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white p-4 rounded-xl font-mono text-sm uppercase tracking-widest font-bold disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-950/40 cursor-pointer"
            >
              {status === 'submitting' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Submitting for Review...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  <span>Submit Verification Directly</span>
                </>
              )}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      <section className="bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-3 shadow-sm">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-bold text-sm font-mono uppercase">
          <Lock className="w-4 h-4 text-emerald-500" />
          <span>Privacy & Zero-Knowledge Deletion</span>
        </div>
        <p className="font-mono text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Your documents are reviewed manually by authorized administrators solely to verify your age. If your account email matches an already verified Discord user, verification is automated instantly. In all cases, submitted ID photos and selfies are permanently purged upon verification.
        </p>
      </section>
    </div>
  );
}
