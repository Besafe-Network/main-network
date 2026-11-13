import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, CheckCircle2, AlertCircle, Upload, X, Image as ImageIcon, Link as LinkIcon, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { compressImageFile } from '../utils/imageCompressor';
import { extractVRChatUserId } from '../utils/vrchatUtils';

export default function Appeal() {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({ userId: '', email: '', reason: '', vrchatAccount: '' });
  const [attachments, setAttachments] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [appealId, setAppealId] = useState('');

  useEffect(() => {
    const paramUserId = searchParams.get('userId') || searchParams.get('discordId') || searchParams.get('caseNumber');
    if (paramUserId) {
      setFormData(prev => ({ ...prev, userId: prev.userId || paramUserId.trim() }));
    }
  }, [searchParams]);

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

  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setAttachments(prev => [...prev, urlInput.trim()]);
    setUrlInput('');
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    
    try {
      const res = await fetch('/api/appeal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          attachments
        })
      });
      
      const data = await res.json();
      if (data.success) {
        setAppealId(data.appealId);
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-8 py-24">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-green-600 rounded-full flex items-center justify-center mx-auto"
        >
          <CheckCircle2 className="w-12 h-12 text-white" />
        </motion.div>
        <div className="space-y-4">
          <h1 className="text-5xl font-bold uppercase tracking-tighter">Appeal Submitted</h1>
          <p className="opacity-70">Your appeal has been received and will be reviewed by our global administration team.</p>
        </div>
        <div className="border-2 border-[#141414] p-6 inline-block">
          <span className="font-mono text-xs uppercase tracking-widest opacity-50 block mb-2">Reference ID</span>
          <span className="font-mono text-xl font-bold uppercase select-all">{appealId}</span>
        </div>
        <div className="pt-2">
          <a
            href={`/appeal-reply?id=${appealId}`}
            className="inline-block bg-[#141414] text-white px-6 py-3 font-mono text-xs font-bold uppercase tracking-widest hover:opacity-80 transition-opacity"
          >
            Track & Reply To Appeal
          </a>
        </div>
        <div>
          <button 
            onClick={() => { setStatus('idle'); setFormData({ userId: '', email: '', reason: '', vrchatAccount: '' }); setAttachments([]); }}
            className="font-mono text-xs uppercase tracking-widest underline hover:opacity-50"
          >
            Submit another appeal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-10 px-2 sm:px-0">
      <div className="space-y-4 text-center px-4">
        <h1 className="text-3xl sm:text-5xl font-bold uppercase tracking-tighter">Ban Appeal</h1>
        <p className="opacity-70 text-sm sm:text-base">If you believe you were banned by mistake, please provide your User ID, detailed explanation, and any supporting evidence.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          <div className="space-y-2">
            <label className="font-mono text-xs uppercase tracking-widest opacity-60">User ID / VRChat ID / Case #</label>
            <input 
              type="text" 
              required
              value={formData.userId}
              onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
              placeholder="e.g. 192766256179 or usr_... or CASE-1234"
              className="w-full bg-transparent border-2 border-[#141414] p-3.5 sm:p-4 font-mono text-sm sm:text-base focus:outline-none focus:bg-[#141414] focus:text-[#E4E3E0] transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="font-mono text-xs uppercase tracking-widest opacity-60">Contact Email</label>
            <input 
              type="email" 
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="your@email.com"
              className="w-full bg-transparent border-2 border-[#141414] p-3.5 sm:p-4 font-mono text-sm sm:text-base focus:outline-none focus:bg-[#141414] focus:text-[#E4E3E0] transition-all"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="font-mono text-xs uppercase tracking-widest opacity-60">Additional VRChat Account / ID (Optional)</label>
            <input 
              type="text" 
              value={formData.vrchatAccount}
              onChange={(e) => setFormData({ ...formData, vrchatAccount: extractVRChatUserId(e.target.value) })}
              placeholder="e.g. usr_1847e76d-88f5... or VRChat profile link"
              className="w-full bg-transparent border-2 border-[#141414] p-3.5 sm:p-4 font-mono text-sm sm:text-base focus:outline-none focus:bg-[#141414] focus:text-[#E4E3E0] transition-all"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="font-mono text-xs uppercase tracking-widest opacity-60">Reason for Appeal</label>
          <textarea 
            required
            rows={6}
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            placeholder="Explain the circumstances and why your ban should be lifted..."
            className="w-full bg-transparent border-2 border-[#141414] p-3.5 sm:p-4 font-mono text-sm sm:text-base focus:outline-none focus:bg-[#141414] focus:text-[#E4E3E0] transition-all resize-none"
          />
        </div>

        {/* Evidence Image Attachments */}
        <div className="space-y-4 border-2 border-[#141414] p-4 sm:p-6 bg-zinc-50/50">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <label className="font-mono text-xs uppercase font-bold tracking-widest flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-600" /> Evidence Images (Optional)
              </label>
              <p className="text-[11px] font-mono opacity-60">Upload screenshots or paste image URLs for administrators to review.</p>
            </div>
            {attachments.length > 0 && (
              <span className="font-mono text-xs font-bold bg-[#141414] text-white px-2.5 py-1">
                {attachments.length} attached
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* File Upload Box */}
            <label className="border-2 border-dashed border-[#141414] p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-zinc-100 transition-all">
              <Upload className="w-6 h-6 mb-2 text-zinc-700" />
              <span className="font-mono text-xs uppercase font-bold">Choose Image Files</span>
              <span className="font-mono text-[10px] opacity-60 mt-0.5">PNG, JPG, WEBP</span>
              <input 
                type="file" 
                accept="image/*" 
                multiple 
                onChange={handleFileUpload} 
                className="hidden" 
              />
            </label>

            {/* URL Input Box */}
            <div className="border-2 border-[#141414] p-4 flex flex-col justify-between space-y-2 bg-white">
              <span className="font-mono text-xs uppercase font-bold flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5" /> Attach Image URL
              </span>
              <div className="flex gap-2">
                <input 
                  type="url" 
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 border border-zinc-300 p-2 font-mono text-xs focus:outline-none focus:border-[#141414]"
                />
                <button
                  type="button"
                  onClick={handleAddUrl}
                  disabled={!urlInput.trim()}
                  className="bg-[#141414] text-white px-3 font-mono text-xs font-bold uppercase hover:opacity-80 disabled:opacity-40"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Attachment Previews */}
          {attachments.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {attachments.map((img, idx) => (
                <div key={idx} className="relative group border-2 border-[#141414] bg-white overflow-hidden aspect-video flex items-center justify-center">
                  <img src={img} alt={`Attachment ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeAttachment(idx)}
                    className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full shadow hover:bg-red-700 transition-colors"
                    title="Remove attachment"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {status === 'error' && (
          <div className="bg-red-100 border-l-4 border-red-600 p-4 flex items-center gap-3 text-red-900">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-medium">An error occurred. Please try again later.</p>
          </div>
        )}

        <button 
          type="submit"
          disabled={status === 'loading'}
          className="w-full bg-[#141414] text-[#E4E3E0] p-6 font-mono text-xl uppercase tracking-widest hover:opacity-90 transition-opacity flex items-center justify-center gap-4 disabled:opacity-50"
        >
          {status === 'loading' ? (
            <div className="w-6 h-6 border-2 border-[#E4E3E0] border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Send className="w-6 h-6" />
              Submit Appeal
            </>
          )}
        </button>
      </form>

      <div className="bg-[#141414]/5 p-8 border border-[#141414]/10 space-y-4">
        <h3 className="font-mono font-bold uppercase tracking-tight">Important Notice</h3>
        <ul className="text-sm space-y-2 opacity-70 list-disc pl-4">
          <li>Appeals are reviewed manually by administrators. This process can take 24-72 hours.</li>
          <li>Submitting multiple appeals for the same ban will result in a permanent blacklist.</li>
          <li>Be honest and provide as much evidence context as possible.</li>
        </ul>
      </div>
    </div>
  );
}
