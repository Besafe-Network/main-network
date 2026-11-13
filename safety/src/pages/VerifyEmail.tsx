import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Shield, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let isMounted = true;
    const verify = async () => {
      if (!token) {
        if (isMounted) {
          setStatus('error');
          setMessage('Missing verification token');
        }
        return;
      }

      try {
        const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (isMounted) {
          if (res.ok && data.success) {
            setStatus('success');
            setMessage(data.message || 'Email verified successfully!');
          } else {
            setStatus('error');
            setMessage(data.error || 'Verification failed');
          }
        }
      } catch (err) {
        if (isMounted) {
          setStatus('error');
          setMessage('Connection error while verifying email');
        }
      }
    };

    verify();

    return () => {
      isMounted = false;
    };
  }, [token]);

  return (
    <div className="max-w-md mx-auto py-24 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-2 border-[#141414] p-12 space-y-8"
      >
        <div className="flex justify-center">
          <Shield className="w-16 h-16" />
        </div>

        {status === 'loading' && (
          <div className="space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto opacity-50" />
            <p className="font-mono text-sm uppercase tracking-widest animate-pulse">Verifying Credentials...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6">
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
            <div className="space-y-2">
              <h2 className="text-2xl font-bold uppercase tracking-tight">Access Granted</h2>
              <p className="font-mono text-xs opacity-70 uppercase tracking-widest">{message}</p>
            </div>
            <Link 
              to="/dashboard" 
              className="block w-full bg-[#141414] text-[#E4E3E0] p-4 font-mono uppercase tracking-widest hover:opacity-90 transition-opacity"
            >
              Back to Login
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6">
            <XCircle className="w-12 h-12 text-red-600 mx-auto" />
            <div className="space-y-2">
              <h2 className="text-2xl font-bold uppercase tracking-tight">Access Denied</h2>
              <p className="font-mono text-xs text-red-600 uppercase tracking-widest">{message}</p>
            </div>
            <Link 
              to="/dashboard" 
              className="block w-full border-2 border-[#141414] p-4 font-mono uppercase tracking-widest hover:bg-gray-100 transition-colors"
            >
              Return Home
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}
