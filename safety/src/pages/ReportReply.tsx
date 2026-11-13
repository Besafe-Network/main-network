import React, { useEffect, useState } from 'react';
import { useSearchParams, useParams, Link } from 'react-router-dom';
import { MessageSquare, Send, ShieldAlert, ShieldCheck, Clock, ArrowLeft, AlertCircle, CheckCircle, RefreshCw, Upload, X, Image as ImageIcon, Link as LinkIcon, Plus, UserCheck, Eye } from 'lucide-react';
import { compressImageFile } from '../utils/imageCompressor';

interface ReportMessage {
  sender: 'admin' | 'user';
  content: string;
  attachments?: string[];
  timestamp: string;
}

interface ReportData {
  _id: string;
  targetUserId: string;
  targetDisplayName?: string;
  reporterUserId: string;
  reason?: string;
  vrchatAccount?: string;
  attachments?: string[];
  evidenceLinks?: string[];
  status: 'pending' | 'claimed' | 'reviewed' | 'dismissed';
  claimedBy?: string;
  messages: ReportMessage[];
  createdAt: string;
}

export default function ReportReply() {
  const [searchParams] = useSearchParams();
  const routeParams = useParams();
  
  // Support both /report-reply?id=XXX and /report-reply/:id
  const [ticketId, setTicketId] = useState<string>(
    searchParams.get('id') || routeParams.id || ''
  );
  const [inputId, setInputId] = useState<string>('');
  
  const [report, setReport] = useState<ReportData | null>(null);
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

  const fetchReport = async (idToFetch: string) => {
    if (!idToFetch.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/report/${idToFetch.trim()}/public`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Report case record not found. Please verify your Case Ticket ID.');
        }
        throw new Error('Failed to retrieve report case data.');
      }
      const data = await res.json();
      setReport({
        _id: idToFetch.trim(),
        ...data
      });
    } catch (err: any) {
      setError(err.message || 'Error fetching report case ticket');
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const id = searchParams.get('id') || routeParams.id;
    if (id) {
      setTicketId(id);
      fetchReport(id);
    }
  }, [searchParams, routeParams]);

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputId.trim()) return;
    setTicketId(inputId.trim());
    fetchReport(inputId.trim());
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!replyContent.trim() && replyAttachments.length === 0) || !ticketId) return;

    setSending(true);
    setError('');
    setSuccessMessage('');

    try {
      const res = await fetch(`/api/report/${ticketId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent.trim(),
          attachments: replyAttachments
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send message reply');
      }

      setSuccessMessage('Reply & evidence attachments sent successfully to investigation staff!');
      setReplyContent('');
      setReplyAttachments([]);
      // Refresh messages
      await fetchReport(ticketId);
    } catch (err: any) {
      setError(err.message || 'Failed to submit message reply.');
    } finally {
      setSending(false);
    }
  };

  const isClosed = report?.status === 'reviewed' || report?.status === 'dismissed';

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Top Banner Header */}
      <div className="bg-white border-4 border-[#141414] p-8 shadow-[-6px_6px_0px_0px_rgba(20,20,20,1)] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-rose-600" />
            <h1 className="text-3xl font-black uppercase tracking-tight">Report Investigation Case</h1>
          </div>
          <p className="font-mono text-xs opacity-70 uppercase tracking-wide">
            Public Communication Portal for Safety Report Case Tickets
          </p>
        </div>

        <Link
          to="/report"
          className="bg-white border-2 border-[#141414] px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider hover:bg-zinc-100 shadow-[-3px_3px_0px_0px_rgba(20,20,20,1)] active:shadow-none transition-all flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Submit Report
        </Link>
      </div>

      {/* Ticket Query if no ID provided or searching */}
      {(!ticketId || error) && (
        <div className="bg-white border-4 border-[#141414] p-8 shadow-[-6px_6px_0px_0px_rgba(20,20,20,1)] space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-black uppercase font-mono">Lookup Report Ticket</h2>
            <p className="text-xs font-mono opacity-70">
              Enter your unique Report Case Ticket ID to inspect investigation history and communicate with safety staff.
            </p>
          </div>

          <form onSubmit={handleManualSearch} className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              required
              placeholder="Enter Report Ticket ID (e.g. 64b8a1c...)"
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
          <p className="font-mono text-xs font-bold uppercase tracking-widest">Loading Report Case Telemetry...</p>
        </div>
      )}

      {report && !loading && (
        <div className="space-y-8">
          {/* Status Header Box */}
          <div className="bg-white border-4 border-[#141414] p-6 shadow-[-6px_6px_0px_0px_rgba(20,20,20,1)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#141414] pb-4">
              <div className="space-y-1">
                <span className="font-mono text-[10px] uppercase font-bold text-zinc-500">Report Case ID</span>
                <p className="font-mono text-sm font-bold select-all">{report._id}</p>
              </div>

              <div className="space-y-1">
                <span className="font-mono text-[10px] uppercase font-bold text-zinc-500 block">Status</span>
                {report.status === 'pending' && (
                  <span className="inline-flex items-center gap-1.5 bg-amber-100 border-2 border-amber-600 text-amber-900 px-3 py-1 font-mono text-xs font-black uppercase">
                    <Clock className="w-4 h-4 text-amber-600" /> Pending Review
                  </span>
                )}
                {report.status === 'claimed' && (
                  <span className="inline-flex items-center gap-1.5 bg-indigo-100 border-2 border-indigo-600 text-indigo-900 px-3 py-1 font-mono text-xs font-black uppercase">
                    <UserCheck className="w-4 h-4 text-indigo-600" /> Assigned To Investigation Staff
                  </span>
                )}
                {report.status === 'reviewed' && (
                  <span className="inline-flex items-center gap-1.5 bg-emerald-100 border-2 border-emerald-600 text-emerald-900 px-3 py-1 font-mono text-xs font-black uppercase">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Action Taken (Global Ban Issued)
                  </span>
                )}
                {report.status === 'dismissed' && (
                  <span className="inline-flex items-center gap-1.5 bg-zinc-100 border-2 border-zinc-500 text-zinc-800 px-3 py-1 font-mono text-xs font-black uppercase">
                    Dismissed / Closed
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-zinc-600">
              <div>
                <span className="font-bold uppercase text-zinc-900">Target Subject ID:</span> {report.targetUserId}
              </div>
              <div>
                <span className="font-bold uppercase text-zinc-900">Created:</span> {new Date(report.createdAt).toLocaleString()}
              </div>
            </div>

            {report.reason && (
              <div className="bg-zinc-50 border-2 border-[#141414] p-4 text-xs font-mono space-y-1">
                <span className="font-black uppercase text-[10px] text-zinc-500 block">Original Report Reason</span>
                <p className="text-zinc-800 leading-relaxed font-serif italic font-normal text-sm">"{report.reason}"</p>
              </div>
            )}

            {Array.isArray(report.attachments) && report.attachments.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="font-black font-mono text-[10px] uppercase text-zinc-500 flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5 text-rose-600" />
                  Initial Evidence Uploads ({report.attachments.length})
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {report.attachments.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedImageModal(img)}
                      className="relative aspect-video bg-zinc-100 rounded border-2 border-[#141414] cursor-pointer group hover:opacity-80 transition-all overflow-hidden shadow-[-2px_2px_0px_0px_rgba(20,20,20,1)]"
                    >
                      <img src={img} alt={`Initial evidence ${idx + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-mono text-[10px] font-bold uppercase">
                        View
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Conversation History */}
          <div className="bg-white border-4 border-[#141414] p-6 shadow-[-6px_6px_0px_0px_rgba(20,20,20,1)] space-y-6">
            <div className="flex justify-between items-center border-b-2 border-[#141414] pb-4">
              <h2 className="text-lg font-black uppercase font-mono flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-rose-600" /> Investigation Log & Correspondence
              </h2>
              <button
                onClick={() => fetchReport(ticketId)}
                className="font-mono text-xs text-rose-600 hover:text-rose-800 font-bold uppercase flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {!report.messages || report.messages.length === 0 ? (
                <div className="p-8 text-center bg-zinc-50 border-2 border-dashed border-zinc-300 font-mono text-xs text-zinc-500 italic">
                  No correspondence messages recorded yet. Our safety staff will contact you if additional information is required.
                </div>
              ) : (
                report.messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-4 border-2 border-[#141414] rounded-lg shadow-[-3px_3px_0px_0px_rgba(20,20,20,1)] space-y-2 ${
                      msg.sender === 'admin'
                        ? 'bg-rose-50/60 border-rose-900 ml-4 sm:ml-8'
                        : 'bg-zinc-50 mr-4 sm:mr-8'
                    }`}
                  >
                    <div className="flex justify-between items-center font-mono text-[10px] text-zinc-500 border-b border-zinc-200 pb-2">
                      <span className="font-bold uppercase tracking-wider flex items-center gap-1.5">
                        {msg.sender === 'admin' ? (
                          <span className="bg-rose-600 text-white px-2 py-0.5 rounded font-black">
                            Safety Investigation Staff
                          </span>
                        ) : (
                          <span className="bg-zinc-800 text-white px-2 py-0.5 rounded font-black">
                            Reporter (You)
                          </span>
                        )}
                      </span>
                      <span>{new Date(msg.timestamp).toLocaleString()}</span>
                    </div>

                    {msg.content && (
                      <p className="text-sm font-mono text-zinc-800 whitespace-pre-wrap leading-relaxed">
                        {msg.content}
                      </p>
                    )}

                    {Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-zinc-200">
                        <span className="font-mono text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1">
                          <ImageIcon className="w-3 h-3 text-rose-600" /> Attachments ({msg.attachments.length})
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {msg.attachments.map((att, aIdx) => (
                            <div
                              key={aIdx}
                              onClick={() => setSelectedImageModal(att)}
                              className="relative aspect-video bg-zinc-100 rounded border border-[#141414] cursor-pointer group hover:opacity-80 transition-all overflow-hidden"
                            >
                              <img src={att} alt={`Attachment ${aIdx + 1}`} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-mono text-[9px] font-bold uppercase">
                                View
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Reply Form */}
          {!isClosed ? (
            <form onSubmit={handleSendReply} className="bg-white border-4 border-[#141414] p-6 shadow-[-6px_6px_0px_0px_rgba(20,20,20,1)] space-y-6">
              <div className="space-y-1">
                <h3 className="text-lg font-black uppercase font-mono flex items-center gap-2">
                  <Send className="w-5 h-5 text-[#141414]" /> Send Reply To Staff
                </h3>
                <p className="text-xs font-mono opacity-70">
                  Provide additional details, screenshots, or evidence links to assist our safety team.
                </p>
              </div>

              <textarea
                rows={4}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Type your message reply to investigation staff..."
                className="w-full bg-zinc-50 border-4 border-[#141414] p-4 font-mono text-xs focus:outline-none focus:shadow-[-4px_4px_0px_0px_rgba(20,20,20,1)] focus:bg-white transition-all"
              />

              {/* Attachments Section */}
              <div className="space-y-3 bg-zinc-50 border-2 border-[#141414] p-4">
                <label className="block text-[10px] font-mono uppercase font-black tracking-widest text-zinc-700">
                  Attach Supplemental Screenshots / Evidence
                </label>

                <div className="flex flex-wrap items-center gap-3">
                  <label className="cursor-pointer bg-white border-2 border-[#141414] px-4 py-2 font-mono text-xs font-bold uppercase hover:bg-zinc-100 shadow-[-2px_2px_0px_0px_rgba(20,20,20,1)] active:shadow-none transition-all flex items-center gap-2">
                    <Upload className="w-4 h-4 text-rose-600" /> Upload Image
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="Paste Image/Evidence URL..."
                      className="flex-1 bg-white border-2 border-[#141414] px-3 py-2 font-mono text-xs focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddUrl}
                      className="bg-zinc-800 text-white border-2 border-[#141414] px-3 py-2 font-mono text-xs font-bold uppercase hover:bg-black transition-all flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>
                </div>

                {replyAttachments.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-zinc-200">
                    {replyAttachments.map((att, idx) => (
                      <div key={idx} className="relative group bg-white border-2 border-[#141414] p-1 rounded aspect-video flex items-center justify-center overflow-hidden">
                        {att.startsWith('data:image/') || att.match(/\.(jpg|jpeg|png|gif|webp)($|\?)/i) ? (
                          <img src={att} alt={`Attachment ${idx + 1}`} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-[9px] font-mono truncate p-1 text-zinc-600">{att}</div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeReplyAttachment(idx)}
                          className="absolute top-1 right-1 bg-rose-600 text-white p-1 rounded-full opacity-90 hover:opacity-100 transition-all"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {successMessage && (
                <div className="p-4 bg-emerald-100 border-4 border-emerald-600 font-mono text-xs text-emerald-900 uppercase font-bold flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-100 border-4 border-red-600 font-mono text-xs text-red-900 uppercase font-bold flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={sending || (!replyContent.trim() && replyAttachments.length === 0)}
                className="w-full bg-rose-600 text-white border-4 border-[#141414] p-4 font-mono font-black uppercase text-xs hover:bg-rose-700 shadow-[-4px_4px_0px_0px_rgba(20,20,20,1)] active:shadow-none disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sending ? 'Transmitting Reply...' : 'Send Message To Investigation Staff'}
              </button>
            </form>
          ) : (
            <div className="bg-zinc-100 border-4 border-zinc-400 p-8 text-center font-mono space-y-2">
              <ShieldCheck className="w-8 h-8 mx-auto text-zinc-500" />
              <h3 className="font-bold text-sm uppercase text-zinc-800">Case Ticket Resolved</h3>
              <p className="text-xs text-zinc-600">This report investigation session is closed. No further replies can be submitted.</p>
            </div>
          )}
        </div>
      )}

      {/* Image Modal Preview */}
      {selectedImageModal && (
        <div
          onClick={() => setSelectedImageModal(null)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-white border-4 border-[#141414] p-2 shadow-2xl overflow-hidden">
            <button
              onClick={() => setSelectedImageModal(null)}
              className="absolute top-4 right-4 bg-rose-600 text-white p-2 border-2 border-[#141414] font-bold z-10 hover:bg-rose-700"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={selectedImageModal} alt="Zoomed evidence" className="max-w-full max-h-[85vh] object-contain mx-auto" />
          </div>
        </div>
      )}
    </div>
  );
}
