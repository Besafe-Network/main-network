import React, { useEffect, useState } from 'react';
import { useSearchParams, useParams, Link } from 'react-router-dom';
import { MessageSquare, Send, ShieldCheck, ShieldX, Clock, ArrowLeft, AlertCircle, CheckCircle, RefreshCw, Shield, Upload, X, Image as ImageIcon, Link as LinkIcon, Plus, UserCheck, Eye } from 'lucide-react';
import { compressImageFile } from '../utils/imageCompressor';

interface AppealMessage {
  sender: 'admin' | 'user';
  content: string;
  attachments?: string[];
  timestamp: string;
}

interface AppealData {
  _id: string;
  userId: string;
  reason?: string;
  vrchatAccount?: string;
  attachments?: string[];
  status: 'pending' | 'claimed' | 'approved' | 'denied';
  claimedBy?: string;
  messages: AppealMessage[];
  createdAt: string;
}

export default function AppealReply() {
  const [searchParams] = useSearchParams();
  const routeParams = useParams();
  
  // Support both /appeal-reply?id=XXX and /appeal-reply/:id
  const [ticketId, setTicketId] = useState<string>(
    searchParams.get('id') || routeParams.id || ''
  );
  const [inputId, setInputId] = useState<string>('');
  
  const [appeal, setAppeal] = useState<AppealData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [replyContent, setReplyContent] = useState<string>('');
  const [replyAttachments, setReplyAttachments] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [selectedImageModal, setSelectedImageModal] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files) as File[]) {
      if (!file.type.startsWith('image/')) continue;
      const compressed = await compressImageFile(file);
      if (compressed) {
        setReplyAttachments(prev => [...prev, compressed]);
      }
    }
  };

  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setReplyAttachments(prev => [...prev, urlInput.trim()]);
    setUrlInput('');
  };

  const removeReplyAttachment = (index: number) => {
    setReplyAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const fetchAppeal = async (idToFetch: string) => {
    if (!idToFetch.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/appeal/${idToFetch.trim()}/public`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Appeal record not found. Please verify your Appeal Ticket ID.');
        }
        throw new Error('Failed to retrieve appeal data.');
      }
      const data = await res.json();
      setAppeal({
        _id: idToFetch.trim(),
        ...data
      });
    } catch (err: any) {
      setError(err.message || 'Error fetching appeal ticket');
      setAppeal(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const id = searchParams.get('id') || routeParams.id;
    if (id) {
      setTicketId(id);
      fetchAppeal(id);
    }
  }, [searchParams, routeParams]);

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputId.trim()) return;
    setTicketId(inputId.trim());
    fetchAppeal(inputId.trim());
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!replyContent.trim() && replyAttachments.length === 0) || !ticketId) return;

    setSending(true);
    setError('');
    setSuccessMessage('');

    try {
      const res = await fetch(`/api/appeal/${ticketId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent.trim(),
          attachments: replyAttachments
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send reply');
      }

      setSuccessMessage('Reply & attachments sent successfully to administrators!');
      setReplyContent('');
      setReplyAttachments([]);
      // Refresh messages
      await fetchAppeal(ticketId);
    } catch (err: any) {
      setError(err.message || 'Failed to submit message reply.');
    } finally {
      setSending(false);
    }
  };

  const isClosed = appeal?.status === 'approved' || appeal?.status === 'denied';

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Top Banner Header */}
      <div className="bg-white border-4 border-[#141414] p-8 shadow-[-6px_6px_0px_0px_rgba(20,20,20,1)] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-[#141414]" />
            <h1 className="text-3xl font-black uppercase tracking-tight">Appeal Correspondence</h1>
          </div>
          <p className="font-mono text-xs opacity-70 uppercase tracking-wide">
            Public Communication Portal for Ban Appeal Tickets
          </p>
        </div>

        <Link
          to="/appeal"
          className="bg-white border-2 border-[#141414] px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider hover:bg-zinc-100 shadow-[-3px_3px_0px_0px_rgba(20,20,20,1)] active:shadow-none transition-all flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> New Appeal
        </Link>
      </div>

      {/* Ticket Query if no ID provided or searching */}
      {(!ticketId || error) && (
        <div className="bg-white border-4 border-[#141414] p-8 shadow-[-6px_6px_0px_0px_rgba(20,20,20,1)] space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-black uppercase font-mono">Lookup Appeal Ticket</h2>
            <p className="text-xs font-mono opacity-70">
              Enter your unique Appeal Ticket ID to inspect message history and send replies to administrators.
            </p>
          </div>

          <form onSubmit={handleManualSearch} className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              required
              placeholder="Enter Appeal Ticket ID (e.g. 64b8a1c...)"
              value={inputId}
              onChange={(e) => setInputId(e.target.value)}
              className="flex-1 bg-zinc-50 border-4 border-[#141414] p-4 font-mono text-xs focus:outline-none focus:shadow-[-4px_4px_0px_0px_rgba(20,20,20,1)] focus:bg-white transition-all"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-[#141414] text-white px-8 py-4 font-mono font-black uppercase text-xs hover:bg-neutral-800 shadow-[-4px_4px_0px_0px_rgba(20,20,20,1)] active:shadow-none disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Load Ticket'}
            </button>
          </form>

          {error && (
            <div className="p-4 bg-red-100 border-4 border-red-600 font-mono text-xs text-red-900 uppercase font-bold flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="bg-white border-4 border-[#141414] p-12 text-center shadow-[-6px_6px_0px_0px_rgba(20,20,20,1)] space-y-4">
          <RefreshCw className="w-10 h-10 animate-spin mx-auto text-[#141414]" />
          <p className="font-mono text-xs font-bold uppercase tracking-widest">Loading Ticket Telemetry...</p>
        </div>
      )}

      {appeal && !loading && (
        <div className="space-y-8">
          {/* Status Header Box */}
          <div className="bg-white border-4 border-[#141414] p-6 shadow-[-6px_6px_0px_0px_rgba(20,20,20,1)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#141414] pb-4">
              <div className="space-y-1">
                <span className="font-mono text-[10px] uppercase font-bold text-zinc-500">Appeal Ticket ID</span>
                <p className="font-mono text-sm font-bold select-all">{appeal._id}</p>
              </div>

              <div className="space-y-1">
                <span className="font-mono text-[10px] uppercase font-bold text-zinc-500 block">Status</span>
                {appeal.status === 'pending' && (
                  <span className="inline-flex items-center gap-1.5 bg-amber-100 border-2 border-amber-600 text-amber-900 px-3 py-1 font-mono text-xs font-black uppercase">
                    <Clock className="w-4 h-4 text-amber-600" /> Pending Review
                  </span>
                )}
                {appeal.status === 'claimed' && (
                  <span className="inline-flex items-center gap-1.5 bg-indigo-100 border-2 border-indigo-600 text-indigo-900 px-3 py-1 font-mono text-xs font-black uppercase">
                    <UserCheck className="w-4 h-4 text-indigo-600" /> Assigned To Staff Case
                  </span>
                )}
                {appeal.status === 'approved' && (
                  <span className="inline-flex items-center gap-1.5 bg-emerald-100 border-2 border-emerald-600 text-emerald-900 px-3 py-1 font-mono text-xs font-black uppercase">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Appeal Approved
                  </span>
                )}
                {appeal.status === 'denied' && (
                  <span className="inline-flex items-center gap-1.5 bg-rose-100 border-2 border-rose-600 text-rose-900 px-3 py-1 font-mono text-xs font-black uppercase">
                    <ShieldX className="w-4 h-4 text-rose-600" /> Appeal Denied
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-zinc-600">
              <div>
                <span className="font-bold uppercase">Target Subject ID:</span> {appeal.userId}
              </div>
              {appeal.vrchatAccount && (
                <div>
                  <span className="font-bold uppercase">VRChat:</span> {appeal.vrchatAccount}
                </div>
              )}
              <div>
                <span className="font-bold uppercase">Submitted:</span> {new Date(appeal.createdAt).toLocaleString()}
              </div>
            </div>

            {/* Appeal Initial Reason & Attachments */}
            {appeal.reason && (
              <div className="border-t-2 border-[#141414] pt-4 space-y-3 bg-zinc-50 p-4">
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-700 block">
                  Original Appeal Description
                </span>
                <p className="font-sans text-xs leading-relaxed text-zinc-800 whitespace-pre-wrap">
                  {appeal.reason}
                </p>

                {appeal.attachments && appeal.attachments.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-zinc-200">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5" /> Attached Evidence ({appeal.attachments.length} Images)
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {appeal.attachments.map((imgUrl, i) => (
                        <div 
                          key={i} 
                          onClick={() => setSelectedImageModal(imgUrl)}
                          className="relative border-2 border-[#141414] aspect-video bg-white overflow-hidden cursor-pointer group hover:opacity-90"
                        >
                          <img src={imgUrl} alt={`Evidence ${i+1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white font-mono text-[10px] uppercase font-bold gap-1">
                            <Eye className="w-3.5 h-3.5" /> Zoom
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Messages Conversation History */}
          <div className="bg-white border-4 border-[#141414] p-8 shadow-[-6px_6px_0px_0px_rgba(20,20,20,1)] space-y-6">
            <div className="border-b-2 border-[#141414] pb-4 flex items-center justify-between">
              <h2 className="text-lg font-black uppercase font-mono flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-600" /> Conversation Log
              </h2>
              <button
                onClick={() => fetchAppeal(appeal._id)}
                className="font-mono text-xs text-indigo-600 hover:underline uppercase font-bold flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>

            {appeal.messages && appeal.messages.length > 0 ? (
              <div className="space-y-6">
                {appeal.messages.map((msg, index) => {
                  const isAdmin = msg.sender === 'admin';
                  return (
                    <div
                      key={index}
                      className={`p-6 border-4 border-[#141414] shadow-[-4px_4px_0px_0px_rgba(20,20,20,1)] space-y-3 ${
                        isAdmin ? 'bg-indigo-50/80 border-indigo-950' : 'bg-zinc-50'
                      }`}
                    >
                      <div className="flex justify-between items-center border-b border-zinc-200 pb-2">
                        <div className="flex items-center gap-2">
                          {isAdmin ? (
                            <span className="bg-[#141414] text-white px-2.5 py-0.5 text-[10px] font-mono font-black uppercase tracking-wider">
                              Network Administrator
                            </span>
                          ) : (
                            <span className="bg-zinc-200 text-zinc-800 px-2.5 py-0.5 text-[10px] font-mono font-black uppercase tracking-wider">
                              Applicant (You)
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-[10px] text-zinc-500">
                          {new Date(msg.timestamp).toLocaleString()}
                        </span>
                      </div>

                      {msg.content && (
                        <p className="font-sans text-sm text-zinc-900 whitespace-pre-wrap leading-relaxed">
                          {msg.content}
                        </p>
                      )}

                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="pt-2 border-t border-zinc-200 space-y-2">
                          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-600 flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" /> Attachments ({msg.attachments.length})
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {msg.attachments.map((img, idx) => (
                              <div
                                key={idx}
                                onClick={() => setSelectedImageModal(img)}
                                className="border-2 border-[#141414] aspect-video bg-white overflow-hidden cursor-pointer group relative"
                              >
                                <img src={img} alt={`Msg Attachment ${idx+1}`} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white font-mono text-[10px] uppercase font-bold gap-1">
                                  <Eye className="w-3 h-3" /> Zoom
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 bg-zinc-50 border-2 border-dashed border-zinc-300 text-center font-mono text-xs text-zinc-500 uppercase">
                No direct messages recorded in this correspondence yet.
              </div>
            )}
          </div>

          {/* Reply Form / Status Alert */}
          {!isClosed ? (
            <div className="bg-white border-4 border-[#141414] p-8 shadow-[-6px_6px_0px_0px_rgba(20,20,20,1)] space-y-6">
              <h3 className="text-base font-black uppercase font-mono flex items-center gap-2">
                <Send className="w-4 h-4 text-indigo-600" /> Send Message Reply
              </h3>

              {successMessage && (
                <div className="p-4 bg-emerald-100 border-4 border-emerald-600 font-mono text-xs text-emerald-900 uppercase font-bold flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-600" />
                  <span>{successMessage}</span>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-100 border-4 border-red-600 font-mono text-xs text-red-900 uppercase font-bold flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSendReply} className="space-y-6">
                <div className="space-y-2">
                  <label className="font-mono text-xs uppercase font-bold text-zinc-700">Message Body</label>
                  <textarea
                    rows={4}
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Type your reply or additional details for administrators here..."
                    className="w-full bg-zinc-50 border-4 border-[#141414] p-4 font-sans text-sm focus:outline-none focus:shadow-[-4px_4px_0px_0px_rgba(20,20,20,1)] focus:bg-white transition-all resize-y"
                  />
                </div>

                {/* Reply Attachments Section */}
                <div className="space-y-3 border-2 border-[#141414] p-4 bg-zinc-50">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-800 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-indigo-600" /> Attach Images To Reply (Optional)
                    </span>
                    {replyAttachments.length > 0 && (
                      <span className="font-mono text-xs font-bold bg-[#141414] text-white px-2 py-0.5">
                        {replyAttachments.length} attached
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="border-2 border-dashed border-[#141414] p-3 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-zinc-100 transition-all">
                      <Upload className="w-5 h-5 mb-1 text-zinc-700" />
                      <span className="font-mono text-xs font-bold uppercase">Upload Image Files</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        multiple 
                        onChange={handleFileUpload} 
                        className="hidden" 
                      />
                    </label>

                    <div className="border-2 border-[#141414] p-3 flex flex-col justify-between space-y-1 bg-white">
                      <span className="font-mono text-[11px] font-bold uppercase flex items-center gap-1">
                        <LinkIcon className="w-3 h-3" /> Paste Image URL
                      </span>
                      <div className="flex gap-2">
                        <input 
                          type="url" 
                          value={urlInput}
                          onChange={(e) => setUrlInput(e.target.value)}
                          placeholder="https://..."
                          className="flex-1 border border-zinc-300 p-1.5 font-mono text-xs focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleAddUrl}
                          disabled={!urlInput.trim()}
                          className="bg-[#141414] text-white px-2.5 font-mono text-xs font-bold uppercase hover:opacity-80 disabled:opacity-40"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {replyAttachments.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                      {replyAttachments.map((img, idx) => (
                        <div key={idx} className="relative border-2 border-[#141414] bg-white overflow-hidden aspect-video flex items-center justify-center">
                          <img src={img} alt={`Reply attachment ${idx+1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeReplyAttachment(idx)}
                            className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full shadow hover:bg-red-700"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={sending || (!replyContent.trim() && replyAttachments.length === 0)}
                  className="w-full bg-[#141414] text-white py-4 font-mono font-black uppercase text-xs hover:bg-neutral-800 shadow-[-4px_4px_0px_0px_rgba(20,20,20,1)] active:shadow-none disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Transmitting Reply...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Submit Reply To Admin
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-white border-4 border-[#141414] p-6 shadow-[-6px_6px_0px_0px_rgba(20,20,20,1)] text-center font-mono text-xs uppercase font-bold text-zinc-600 space-y-2">
              <Shield className="w-8 h-8 mx-auto text-zinc-400" />
              <p>This appeal session is currently closed ({appeal.status.toUpperCase()}).</p>
              <p className="text-[10px] font-normal text-zinc-500">
                If you need further assistance, please contact administrators via the official support channels.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Image Preview Modal */}
      {selectedImageModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedImageModal(null)}
        >
          <div 
            className="relative bg-white border-4 border-[#141414] max-w-4xl max-h-[90vh] overflow-hidden p-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedImageModal(null)}
              className="absolute top-4 right-4 bg-[#141414] text-white p-2 rounded-full hover:bg-red-600 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={selectedImageModal} 
              alt="Enlarged evidence view" 
              className="max-w-full max-h-[80vh] object-contain mx-auto"
            />
            <div className="p-2 text-center font-mono text-xs uppercase font-bold text-zinc-700">
              Evidence Viewer
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
