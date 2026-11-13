import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  ExternalLink, 
  Globe, 
  Search, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles,
  Award,
  Layers,
  Code2
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface TrustedCompany {
  _id: string;
  name: string;
  websiteUrl: string;
  logoUrl?: string;
  industry: string;
  description: string;
  servicesUsed: string[];
  isFeatured: boolean;
  order: number;
}

export default function TrustedBy() {
  const [companies, setCompanies] = useState<TrustedCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');

  useEffect(() => {
    document.title = "Trusted By Industry Partners | BeSafe Network";
    fetchTrustedCompanies();
  }, []);

  const fetchTrustedCompanies = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/public/trusted-companies');
      if (res.ok) {
        const data = await res.json();
        setCompanies(data.companies || []);
      } else {
        setError('Failed to load trusted companies directory.');
      }
    } catch (err: any) {
      console.error(err);
      setError('Connection failure while loading partners.');
    } finally {
      setLoading(false);
    }
  };

  const industries = Array.from(new Set(companies.map(c => c.industry).filter(Boolean)));

  const filteredCompanies = companies.filter(company => {
    const matchesIndustry = selectedIndustry === 'all' || company.industry === selectedIndustry;
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          company.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          company.websiteUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          company.servicesUsed.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesIndustry && matchesSearch;
  });

  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-24">
      {/* Hero Header */}
      <section className="relative overflow-hidden bg-[#141414] text-white p-8 sm:p-14 border-4 border-[#141414] shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-amber-400 text-black px-3 py-1 font-mono text-[10px] uppercase font-black tracking-wider flex items-center gap-1.5">
              <Award className="w-3 h-3 text-black" />
              Verified Industry Partners
            </span>
            <span className="bg-white/10 text-white/90 border border-white/20 px-3 py-1 font-mono text-[10px] uppercase font-bold tracking-wider">
              Global Platform Adoption
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tighter italic">
              Trusted By <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-300 to-yellow-400">
                Industry Leaders & Studios
              </span>
            </h1>
            <p className="max-w-3xl font-mono text-xs sm:text-sm text-zinc-300 uppercase tracking-wider leading-relaxed">
              Leading metaverse events, gaming studios, cybersecurity organizations, and massive community networks depend on BeSafe Network services for cross-platform ban synchronization, reputation querying, and user safety assurance.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/10">
            <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
              <span className="block font-mono text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Partner Companies</span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-amber-400">{companies.length}</span>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
              <span className="block font-mono text-[9px] uppercase tracking-widest text-zinc-400 font-bold">SLA Uptime</span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">99.98%</span>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
              <span className="block font-mono text-[9px] uppercase tracking-widest text-zinc-400 font-bold">API Telemetry Sync</span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-blue-400">Real-Time</span>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
              <span className="block font-mono text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Audited Safety SOP</span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-purple-400">ISO/SOC2</span>
            </div>
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-zinc-900 border-2 border-[#141414] dark:border-zinc-700 p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] dark:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search companies by name, website, service, or industry..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-mono text-xs focus:outline-none focus:border-amber-600 text-[#141414] dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
          />
        </div>

        {industries.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
            <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500">Industry:</span>
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded font-mono text-xs uppercase font-bold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Industries ({companies.length})</option>
              {industries.map(ind => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="py-24 text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#141414] dark:border-zinc-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-mono text-xs uppercase tracking-widest font-bold">Retrieving Verified Company Partners...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 dark:bg-red-950/60 border-l-4 border-red-600 p-6 text-red-900 dark:text-red-200 font-mono text-sm uppercase font-bold">
          {error}
        </div>
      )}

      {/* Grid of Trusted Companies */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map((company) => (
            <div
              key={company._id}
              className="bg-white dark:bg-zinc-900 border-2 border-[#141414] dark:border-zinc-700 p-6 flex flex-col justify-between shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] dark:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.5)] hover:translate-x-1 hover:-translate-y-1 transition-all"
            >
              <div className="space-y-5">
                {/* Header */}
                <div className="flex items-start gap-4">
                  <img
                    src={company.logoUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80'}
                    alt={company.name}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80'; }}
                    className="w-14 h-14 rounded-xl border-2 border-[#141414] dark:border-zinc-700 object-cover shrink-0 bg-zinc-100 dark:bg-zinc-800"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-[8px] font-mono font-black px-1.5 py-0.5 rounded uppercase flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5 text-amber-700 dark:text-amber-400" />
                        Verified Partner
                      </span>
                    </div>
                    <h3 className="font-black text-xl uppercase tracking-tight truncate text-[#141414] dark:text-white">
                      {company.name}
                    </h3>
                    <p className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400 font-bold truncate">
                      {company.industry}
                    </p>
                  </div>
                </div>

                {/* Description / Case Summary */}
                <p className="font-sans text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {company.description}
                </p>

                {/* Services Used Box */}
                <div className="space-y-1.5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <span className="text-[9px] font-mono uppercase text-zinc-400 dark:text-zinc-500 font-bold block">BeSafe Services Utilized</span>
                  <div className="flex flex-wrap gap-1.5">
                    {company.servicesUsed.map((svc, idx) => (
                      <span
                        key={idx}
                        className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-[9px] font-mono font-bold px-2 py-0.5 rounded flex items-center gap-1"
                      >
                        <ShieldCheck className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" />
                        {svc}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer with External Link */}
              <div className="pt-6 mt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500 truncate max-w-[160px]">
                  {company.websiteUrl.replace(/^https?:\/\//, '')}
                </span>

                <a
                  href={company.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#141414] dark:bg-zinc-100 hover:bg-amber-500 dark:hover:bg-amber-400 hover:text-black dark:hover:text-black text-white dark:text-zinc-950 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider rounded flex items-center gap-1.5 transition-colors shadow"
                >
                  <span>Visit Website</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredCompanies.length === 0 && (
        <div className="py-20 text-center border-2 border-dashed border-[#141414]/30 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/60 p-8 space-y-3">
          <Building2 className="w-12 h-12 mx-auto text-zinc-400 dark:text-zinc-500" />
          <h4 className="font-mono text-sm uppercase tracking-wider font-black text-zinc-800 dark:text-zinc-200">
            {searchTerm || selectedIndustry !== 'all'
              ? 'No partner organizations match your search filters.'
              : 'No partner organizations listed in the directory yet.'}
          </h4>
          <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400 uppercase max-w-md mx-auto">
            {searchTerm || selectedIndustry !== 'all'
              ? 'Try clearing your search query or industry filter.'
              : 'Certified platforms and enterprise partners leveraging BeSafe services will be displayed here once verified.'}
          </p>
        </div>
      )}

      {/* Partner Callout CTA Section */}
      <section className="bg-[#E4E3E0] dark:bg-zinc-900 border-4 border-[#141414] dark:border-zinc-700 p-8 sm:p-12 space-y-6 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] dark:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 bg-[#141414] dark:bg-zinc-800 text-white px-3 py-1 font-mono text-[10px] uppercase font-bold border border-transparent dark:border-zinc-700">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Enterprise Integration
            </div>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#141414] dark:text-white">
              Protect Your Company or Gaming Platform with BeSafe
            </h2>
            <p className="font-mono text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 max-w-2xl leading-relaxed uppercase tracking-wider">
              Are you building a game studio, VR platform, social community, or moderation tool? Apply for a BeSafe Developer API key or contact our security team for custom integration solutions.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link
              to="/developers"
              className="px-6 py-3.5 bg-[#141414] dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-blue-600 dark:hover:bg-blue-500 dark:hover:text-white font-mono text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
            >
              <Code2 className="w-4 h-4" />
              <span>Apply for API Access</span>
            </Link>
            <Link
              to="/communities"
              className="px-6 py-3.5 border-2 border-[#141414] dark:border-zinc-700 hover:bg-white dark:hover:bg-zinc-800 text-[#141414] dark:text-white font-mono text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
            >
              <span>Explore Protected Communities</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
