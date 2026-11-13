import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  ExternalLink, 
  RefreshCw, 
  AlertCircle, 
  ShieldCheck, 
  Globe, 
  Layers,
  ArrowUpDown
} from 'lucide-react';

interface TrustedCompanyItem {
  _id: string;
  name: string;
  websiteUrl: string;
  logoUrl?: string;
  industry: string;
  description: string;
  servicesUsed: string[];
  isFeatured: boolean;
  order: number;
  createdAt?: string;
}

const COMMON_SERVICES = [
  'Global Ban Synchronization',
  'VRChat 2FA Defense',
  'Threat Intelligence API',
  'Age Assurance & ID Verification',
  'Clinical Threat Watchlist',
  'Incident Reporting Pipeline',
  'Custom Banlist Sync',
  'Staff Training & SOP'
];

export default function TrustedCompaniesManager() {
  const [companies, setCompanies] = useState<TrustedCompanyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal / Form State
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<TrustedCompanyItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formWebsiteUrl, setFormWebsiteUrl] = useState('');
  const [formLogoUrl, setFormLogoUrl] = useState('');
  const [formIndustry, setFormIndustry] = useState('Gaming & Metaverse');
  const [formDescription, setFormDescription] = useState('');
  const [formServices, setFormServices] = useState<string[]>(['Global Ban Synchronization', 'Threat Intelligence API']);
  const [formIsFeatured, setFormIsFeatured] = useState(true);
  const [formOrder, setFormOrder] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const getAuthToken = () => localStorage.getItem('gg_token') || localStorage.getItem('adminToken') || '';

  const fetchCompanies = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/public/trusted-companies');
      if (!res.ok) throw new Error('Failed to fetch trusted companies');
      const data = await res.json();
      setCompanies(data.companies || []);
    } catch (err: any) {
      setError(err.message || 'Error loading companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const openCreateModal = () => {
    setEditingCompany(null);
    setFormName('');
    setFormWebsiteUrl('');
    setFormLogoUrl('');
    setFormIndustry('Gaming & Metaverse');
    setFormDescription('');
    setFormServices(['Global Ban Synchronization', 'Threat Intelligence API']);
    setFormIsFeatured(true);
    setFormOrder(companies.length + 1);
    setShowModal(true);
  };

  const openEditModal = (comp: TrustedCompanyItem) => {
    setEditingCompany(comp);
    setFormName(comp.name);
    setFormWebsiteUrl(comp.websiteUrl);
    setFormLogoUrl(comp.logoUrl || '');
    setFormIndustry(comp.industry);
    setFormDescription(comp.description);
    setFormServices(comp.servicesUsed || ['Global Ban Synchronization']);
    setFormIsFeatured(comp.isFeatured);
    setFormOrder(comp.order || 0);
    setShowModal(true);
  };

  const handleToggleService = (svc: string) => {
    if (formServices.includes(svc)) {
      setFormServices(formServices.filter(s => s !== svc));
    } else {
      setFormServices([...formServices, svc]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formWebsiteUrl.trim()) {
      setError('Company Name and Website URL are required.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccessMsg('');
    try {
      const token = getAuthToken();
      const endpoint = editingCompany ? `/api/admin/trusted-companies/${editingCompany._id}` : '/api/admin/trusted-companies';
      const method = editingCompany ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formName.trim(),
          websiteUrl: formWebsiteUrl.trim(),
          logoUrl: formLogoUrl.trim(),
          industry: formIndustry.trim(),
          description: formDescription.trim(),
          servicesUsed: formServices,
          isFeatured: Boolean(formIsFeatured),
          order: Number(formOrder)
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save company');

      setSuccessMsg(editingCompany ? `Company "${formName}" updated!` : `Company "${formName}" added!`);
      setShowModal(false);
      fetchCompanies();
    } catch (err: any) {
      setError(err.message || 'Error saving company');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}" from the trusted companies directory?`)) return;

    try {
      const token = getAuthToken();
      const res = await fetch(`/api/admin/trusted-companies/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete company');
      setSuccessMsg(`Company "${name}" removed.`);
      fetchCompanies();
    } catch (err: any) {
      setError(err.message || 'Error deleting company');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Building2 className="w-6 h-6 text-amber-400" />
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
                Trusted Companies Directory Management
              </h2>
            </div>
            <p className="font-mono text-xs text-zinc-400 max-w-2xl">
              Manage companies and their official websites that utilize BeSafe services. These companies are showcased on the public <strong className="text-amber-400">/trusted</strong> page and linked directly on the homepage.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchCompanies}
              disabled={loading}
              className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
              title="Refresh Companies"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={openCreateModal}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-mono text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Partner Company</span>
            </button>
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 font-mono text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-xl text-emerald-300 font-mono text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg('')} className="text-zinc-400 hover:text-white">✕</button>
          </div>
        )}
      </div>

      {/* Companies Grid */}
      {loading ? (
        <div className="py-16 text-center text-zinc-500 font-mono text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
          Loading trusted companies...
        </div>
      ) : companies.length === 0 ? (
        <div className="p-12 text-center bg-zinc-900/40 rounded-2xl border border-dashed border-zinc-800 space-y-3">
          <Building2 className="w-12 h-12 text-zinc-600 mx-auto" />
          <h4 className="text-base font-bold text-zinc-300">No Trusted Companies Listed Yet</h4>
          <p className="font-mono text-xs text-zinc-500 max-w-md mx-auto">
            Click "Add Partner Company" to showcase organizations and studios using BeSafe services.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((comp) => (
            <div
              key={comp._id}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-zinc-700 transition-colors"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start gap-3">
                  <img
                    src={comp.logoUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80'}
                    alt={comp.name}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80'; }}
                    className="w-12 h-12 rounded-xl object-cover border border-zinc-700 bg-zinc-800 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span className="bg-amber-950 text-amber-300 border border-amber-800 text-[8px] font-mono font-black px-1.5 py-0.5 rounded uppercase">
                        Order #{comp.order}
                      </span>
                      {comp.isFeatured && (
                        <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded uppercase">
                          Featured
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-white text-base truncate">{comp.name}</h3>
                    <p className="font-mono text-[10px] text-zinc-400 truncate">{comp.industry}</p>
                  </div>
                </div>

                <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                  {comp.description}
                </p>

                {/* Services Used Badges */}
                <div className="space-y-1">
                  <span className="text-[9px] font-mono uppercase text-zinc-500 font-bold block">Services Used</span>
                  <div className="flex flex-wrap gap-1">
                    {comp.servicesUsed.map((svc, idx) => (
                      <span key={idx} className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-[9px] font-mono px-1.5 py-0.5 rounded">
                        {svc}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
                <a
                  href={comp.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-400 hover:text-amber-400 font-mono text-[10px] flex items-center gap-1 transition-colors truncate max-w-[150px]"
                >
                  <Globe className="w-3 h-3 shrink-0" />
                  <span className="truncate">{comp.websiteUrl.replace(/^https?:\/\//, '')}</span>
                </a>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(comp)}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
                    title="Edit company"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(comp._id, comp.name)}
                    className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900 text-rose-400 border border-rose-800/60 transition-colors cursor-pointer"
                    title="Delete company"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                <h3 className="font-mono text-base font-bold uppercase text-white">
                  {editingCompany ? `Edit Company: ${editingCompany.name}` : 'Add Trusted Partner Company'}
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Company / Studio Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. VRChat Event Hub"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Website URL *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://example.com"
                    value={formWebsiteUrl}
                    onChange={(e) => setFormWebsiteUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Logo URL</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={formLogoUrl}
                    onChange={(e) => setFormLogoUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Industry</label>
                  <input
                    type="text"
                    placeholder="e.g. Virtual Reality & Metaverse"
                    value={formIndustry}
                    onChange={(e) => setFormIndustry(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Partnership & Usage Description</label>
                <textarea
                  rows={2}
                  placeholder="How this company utilizes BeSafe services to protect its community..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Services Used Checkboxes */}
              <div className="space-y-2">
                <label className="block text-[10px] uppercase font-bold text-zinc-400">Services Used</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-zinc-800/60 p-3 rounded-xl border border-zinc-700">
                  {COMMON_SERVICES.map(svc => (
                    <label key={svc} className="flex items-center gap-2 cursor-pointer text-[10px]">
                      <input
                        type="checkbox"
                        checked={formServices.includes(svc)}
                        onChange={() => handleToggleService(svc)}
                        className="rounded bg-zinc-800 border-zinc-700 text-amber-500 w-3.5 h-3.5"
                      />
                      <span className="text-zinc-300 font-mono">{svc}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 items-center pt-2">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={formOrder}
                    onChange={(e) => setFormOrder(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="pt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsFeatured}
                      onChange={(e) => setFormIsFeatured(e.target.checked)}
                      className="rounded bg-zinc-800 border-zinc-700 text-amber-500 w-4 h-4"
                    />
                    <span className="text-zinc-300 font-bold uppercase text-[10px]">Mark as Featured Partner</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black uppercase transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingCompany ? 'Save Changes' : 'Add Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
