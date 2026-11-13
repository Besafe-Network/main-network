import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setStatus('submitting');
    try {
      await axios.post('/api/auth/reset-password', { token, password });
      setStatus('success');
      setTimeout(() => navigate('/dashboard'), 3000);
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.response?.data?.error || 'Failed to reset password.');
    }
  };

  if (!token) {
    return (
      <div className="max-w-md mx-auto border-2 border-[#141414] p-12 text-center bg-white mt-24">
        <AlertCircle className="w-12 h-12 mx-auto mb-6 text-red-600" />
        <h1 className="text-3xl font-bold uppercase tracking-tighter mb-4">Invalid Token</h1>
        <p className="font-mono text-sm opacity-70">This link is invalid or has expired.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-24">
      {status === 'success' ? (
        <div className="border-4 border-green-600 p-12 text-center bg-green-50 space-y-6">
          <CheckCircle className="w-16 h-16 mx-auto text-green-600" />
          <h2 className="text-3xl font-bold uppercase tracking-tighter">Password Reset</h2>
          <p className="font-mono text-sm">Your password has been updated successfully. Redirecting to login...</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <Lock className="w-16 h-16 mx-auto opacity-20" />
            <h1 className="text-4xl font-bold uppercase tracking-tighter">New Password</h1>
            <p className="opacity-70">Enter your new administrator password.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="font-mono text-xs uppercase tracking-widest opacity-50">New Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border-2 border-[#141414] p-4 font-mono focus:outline-none focus:bg-[#141414] focus:text-[#E4E3E0] transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="font-mono text-xs uppercase tracking-widest opacity-50">Confirm Password</label>
              <input 
                type="password" 
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-transparent border-2 border-[#141414] p-4 font-mono focus:outline-none focus:bg-[#141414] focus:text-[#E4E3E0] transition-all"
              />
            </div>

            {errorMessage && <div className="p-4 text-xs bg-red-100 border-l-4 border-red-600 text-red-900 font-mono uppercase">{errorMessage}</div>}

            <button 
              type="submit"
              disabled={status === 'submitting'}
              className="w-full bg-[#141414] text-[#E4E3E0] p-4 font-mono uppercase tracking-widest hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {status === 'submitting' && <Loader2 className="w-4 h-4 animate-spin" />}
              Set New Password
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
