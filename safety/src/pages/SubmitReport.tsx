import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Send, Link as LinkIcon, Plus, Trash2, CheckCircle, ShieldAlert, Upload, X, Image as ImageIcon } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { compressImageFile } from '../utils/imageCompressor';
import { extractVRChatUserId } from '../utils/vrchatUtils';

const SubmitReport = () => {
  const [searchParams] = useSearchParams();
  const initialTargetId = searchParams.get('targetId') || searchParams.get('userId') || '';
  const initialTargetName = searchParams.get('targetDisplayName') || searchParams.get('targetName') || searchParams.get('username') || '';
  const initialVrchat = extractVRChatUserId(searchParams.get('vrchatAccount') || '');
  const initialReporterId = searchParams.get('reporterId') || searchParams.get('reporterUserId') || searchParams.get('reporter') || searchParams.get('reporterTag') || searchParams.get('reporterName') || '';
  const initialReporterEmail = searchParams.get('reporterEmail') || searchParams.get('email') || '';

  const [targetUserId, setTargetUserId] = useState(initialTargetId);
  const [targetDisplayName, setTargetDisplayName] = useState(initialTargetName);
  const [vrchatAccount, setVrchatAccount] = useState(initialVrchat);
  const [reporterUserId, setReporterUserId] = useState(initialReporterId);
  const [reporterEmail, setReporterEmail] = useState(initialReporterEmail);
  const [reason, setReason] = useState('');
  const [evidenceLinks, setEvidenceLinks] = useState<string[]>(['']);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    const token = localStorage.getItem('gg_token');
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data && data.user) {
            setReporterUserId(prev => prev || data.user.discordId || data.user.username || '');
            setReporterEmail(prev => prev || data.user.email || '');
          }
        })
        .catch(() => {});
    }
  }, []);

  const addEvidenceLink = () => setEvidenceLinks([...evidenceLinks, '']);
  const removeEvidenceLink = (index: number) => {
    const newLinks = evidenceLinks.filter((_, i) => i !== index);
    setEvidenceLinks(newLinks.length ? newLinks : ['']);
  };
  const updateEvidenceLink = (index: number, value: string) => {
    const newLinks = [...evidenceLinks];
    newLinks[index] = value;
    setEvidenceLinks(newLinks);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files) as File[]) {
      if (!file.type.startsWith('image/')) continue;
      const compressed = await compressImageFile(file);
      if (compressed) {
        setAttachments(prev => [...prev, compressed]);
      }
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/public/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId,
          targetDisplayName,
          reporterUserId,
          reporterEmail,
          reason,
          evidenceLinks: evidenceLinks.filter(l => l.trim() !== ''),
          attachments,
          vrchatAccount
        })
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to submit report');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full bg-white border-4 border-[#141414] p-8 sm:p-12 text-center space-y-6 shadow-[-8px_8px_0px_0px_rgba(20,20,20,1)]"
        >
          <div className="w-20 h-20 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto border-2 border-[#141414]">
            <CheckCircle className="w-10 h-10" />
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-bold uppercase tracking-tight">Report Submitted</h2>
            <p className="font-mono text-xs sm:text-sm leading-relaxed opacity-75">
              Your report has been received by our moderation team. You will receive an email update once a decision is made.
            </p>
          </div>
          <Link to="/" className="inline-block bg-[#141414] text-white px-8 py-3.5 font-mono text-xs uppercase font-bold hover:bg-green-600 transition-colors">
            Return to Home
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 pb-24">
      <div className="max-w-3xl mx-auto space-y-8 sm:space-y-10 pt-4 sm:pt-8">
        <header className="space-y-3 px-2 sm:px-0">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 text-white p-2.5 sm:p-3 border-2 border-[#141414]">
              <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold uppercase tracking-tighter">Submit User Report</h1>
          </div>
          <p className="font-mono text-xs sm:text-sm uppercase tracking-wider opacity-60 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-600" />
            Global Network Moderation Submission
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Target Info */}
          <section className="bg-white border-2 sm:border-4 border-[#141414] p-5 sm:p-8 shadow-[-6px_6px_0px_0px_rgba(20,20,20,1)] space-y-5">
            <h2 className="font-mono text-xs uppercase tracking-widest font-bold border-b-2 border-[#141414] pb-2">User Being Reported</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              <div className="space-y-2">
                <label className="font-mono text-xs uppercase font-semibold opacity-60">Username or Display Name</label>
                <input 
                  required
                  type="text" 
                  value={targetDisplayName}
                  onChange={(e) => setTargetDisplayName(e.target.value)}
                  placeholder="e.g. Username#0001"
                  className="w-full bg-gray-50 border-2 border-[#141414] p-3.5 font-mono text-xs sm:text-sm focus:outline-none focus:bg-white transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="font-mono text-xs uppercase font-semibold opacity-60">Discord User ID</label>
                <input 
                  required
                  type="text" 
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  placeholder="17-19 digit Discord ID number"
                  className="w-full bg-gray-50 border-2 border-[#141414] p-3.5 font-mono text-xs sm:text-sm focus:outline-none focus:bg-white transition-all"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="font-mono text-xs uppercase font-semibold opacity-60">VRChat Account / ID (Optional)</label>
                <input 
                  type="text" 
                  value={vrchatAccount}
                  onChange={(e) => setVrchatAccount(extractVRChatUserId(e.target.value))}
                  placeholder="e.g. usr_1847e76d-88f5... or VRChat profile link"
                  className="w-full bg-gray-50 border-2 border-[#141414] p-3.5 font-mono text-xs sm:text-sm focus:outline-none focus:bg-white transition-all"
                />
              </div>
            </div>
          </section>

          {/* Reporter Info */}
          <section className="bg-white border-2 sm:border-4 border-[#141414] p-5 sm:p-8 shadow-[-6px_6px_0px_0px_rgba(20,20,20,1)] space-y-5">
            <h2 className="font-mono text-xs uppercase tracking-widest font-bold border-b-2 border-[#141414] pb-2">Your Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              <div className="space-y-2">
                <label className="font-mono text-xs uppercase font-semibold opacity-60">Your Username or ID</label>
                <input 
                  required
                  type="text" 
                  value={reporterUserId}
                  onChange={(e) => setReporterUserId(e.target.value)}
                  placeholder="Your Discord ID or Username"
                  className="w-full bg-gray-50 border-2 border-[#141414] p-3.5 font-mono text-xs sm:text-sm focus:outline-none focus:bg-white transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="font-mono text-xs uppercase font-semibold opacity-60">Your Email Address</label>
                <input 
                  required
                  type="email" 
                  value={reporterEmail}
                  onChange={(e) => setReporterEmail(e.target.value)}
                  placeholder="For status updates"
                  className="w-full bg-gray-50 border-2 border-[#141414] p-3.5 font-mono text-xs sm:text-sm focus:outline-none focus:bg-white transition-all"
                />
              </div>
            </div>
          </section>

          {/* Reason */}
          <section className="bg-white border-2 sm:border-4 border-[#141414] p-5 sm:p-8 shadow-[-6px_6px_0px_0px_rgba(20,20,20,1)] space-y-5">
            <h2 className="font-mono text-xs uppercase tracking-widest font-bold border-b-2 border-[#141414] pb-2">Incident Details</h2>
            <div className="space-y-2">
              <label className="font-mono text-xs uppercase font-semibold opacity-60">Detailed Description of Violation</label>
              <textarea 
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                placeholder="Provide a clear, detailed description of what happened..."
                className="w-full bg-gray-50 border-2 border-[#141414] p-3.5 font-mono text-xs sm:text-sm focus:outline-none focus:bg-white transition-all"
              />
            </div>
          </section>

          {/* Evidence */}
          <section className="bg-white border-2 sm:border-4 border-[#141414] p-5 sm:p-8 shadow-[-6px_6px_0px_0px_rgba(20,20,20,1)] space-y-5">
            <div className="flex justify-between items-end border-b-2 border-[#141414] pb-2">
              <h2 className="font-mono text-xs uppercase tracking-widest font-bold">Evidence Links</h2>
              <button 
                type="button" 
                onClick={addEvidenceLink}
                className="flex items-center gap-1.5 font-mono text-xs uppercase font-bold hover:text-blue-600 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Link
              </button>
            </div>
            <div className="space-y-3">
              {evidenceLinks.map((link, index) => (
                <div key={index} className="flex gap-2">
                  <div className="relative flex-1">
                    <input 
                      type="url" 
                      value={link}
                      onChange={(e) => updateEvidenceLink(index, e.target.value)}
                      placeholder="https://imgur.com/... or screenshot link"
                      className="w-full bg-gray-50 border-2 border-[#141414] p-3.5 pl-10 font-mono text-xs sm:text-sm focus:outline-none focus:bg-white transition-all"
                    />
                    <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
                  </div>
                  {evidenceLinks.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removeEvidenceLink(index)}
                      className="bg-red-50 border-2 border-[#141414] px-3.5 hover:bg-red-600 hover:text-white transition-all"
                      aria-label="Remove link"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Evidence Image Files */}
            <div className="pt-4 border-t-2 border-[#141414] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="font-mono text-xs uppercase tracking-wider font-bold flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-indigo-600" /> Upload Screenshots
                </h3>
                <label className="cursor-pointer bg-[#141414] text-white px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider rounded flex items-center justify-center gap-2 hover:bg-indigo-600 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose Images</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    onChange={handleFileUpload} 
                    className="hidden" 
                  />
                </label>
              </div>

              {attachments.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {attachments.map((img, idx) => (
                    <div key={idx} className="relative aspect-video bg-gray-100 border-2 border-[#141414] rounded overflow-hidden group shadow-sm">
                      <img src={img} alt={`Evidence screenshot ${idx + 1}`} className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-90 hover:opacity-100 transition-all shadow"
                        title="Remove image"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="font-mono text-xs opacity-50 mt-3">
              Reports with verifiable screenshots or video links are prioritized for prompt investigation.
            </p>
          </section>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="font-mono text-xs opacity-60 leading-relaxed text-center sm:text-left">
              By submitting this report, you confirm all provided details and evidence are accurate to the best of your knowledge.
            </p>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full sm:w-auto bg-[#141414] text-white px-8 py-4 font-mono font-bold uppercase text-sm sm:text-base hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : (
                <>
                  <Send className="w-5 h-5" /> Submit Report
                </>
              )}
            </button>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                className="bg-red-600 text-white p-6 font-mono text-xs uppercase font-black shadow-[-8px_8px_0px_0px_rgba(20,20,20,1)] border-4 border-[#141414]"
              >
                SYSTEM ERROR: {error}
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>
    </div>
  );
};

export default SubmitReport;
