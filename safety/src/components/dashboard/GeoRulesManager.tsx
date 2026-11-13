import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  ShieldCheck, 
  AlertCircle, 
  Check, 
  Search, 
  RefreshCw, 
  Plus, 
  Edit3, 
  RotateCcw, 
  Terminal, 
  Lock, 
  ExternalLink, 
  Sliders, 
  CheckCircle2, 
  X, 
  Scale, 
  FileText, 
  Sparkles,
  Info
} from 'lucide-react';

interface GeoRuleItem {
  _id?: string;
  countryCode: string;
  countryName: string;
  defaultLocale?: string;
  minAgeSocial: number;
  idVerificationRequired: boolean;
  regulatoryFramework?: string;
  notes?: string;
  isCustom?: boolean;
  updatedBy?: string;
  updatedAt?: string;
}

interface GeoTesterResult {
  locale: string;
  countryCode: string;
  countryName: string;
  minimalAgeRequirement: number;
  minAgeSocial: number;
  idVerificationRequired: boolean;
  isIdVerificationRequired: boolean;
  regulatoryFramework: string;
  notes: string;
  isCustomOverride: boolean;
  clientIp: string;
  detectedFrom: string;
}

// Country code to flag emoji helper
function getCountryFlag(code: string): string {
  if (!code || code === 'GLOBAL') return '🌐';
  const clean = code.trim().toUpperCase();
  if (clean.length !== 2) return '🌐';
  const codePoints = clean
    .split('')
    .map(c => 127397 + c.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export interface GeoRulesManagerProps {
  token?: string;
}

const FALLBACK_DEFAULT_RULES: GeoRuleItem[] = [
  {
    countryCode: 'US',
    countryName: 'United States',
    defaultLocale: 'en-US',
    minAgeSocial: 13,
    idVerificationRequired: false,
    regulatoryFramework: 'COPPA (15 U.S.C. §§ 6501–6506)',
    notes: 'Federal baseline age is 13. State statutes enforce age verification on high-risk platforms.'
  },
  {
    countryCode: 'NL',
    countryName: 'Netherlands',
    defaultLocale: 'nl-NL',
    minAgeSocial: 16,
    idVerificationRequired: false,
    regulatoryFramework: 'Uitvoeringswet Algemene verordening gegevensbescherming (UAVG)',
    notes: 'Article 8 GDPR digital consent threshold set at 16.'
  },
  {
    countryCode: 'DE',
    countryName: 'Germany',
    defaultLocale: 'de-DE',
    minAgeSocial: 16,
    idVerificationRequired: true,
    regulatoryFramework: 'GDPR Art. 8 / JMStV (Jugendmedienschutz-Staatsvertrag)',
    notes: 'Digital age of consent is 16. JMStV Section 4 mandates technical age verification.'
  },
  {
    countryCode: 'FR',
    countryName: 'France',
    defaultLocale: 'fr-FR',
    minAgeSocial: 15,
    idVerificationRequired: true,
    regulatoryFramework: 'Loi n° 2023-566 (Majorité numérique à 15 ans)',
    notes: 'Digital age of majority set at 15. Requires parental consent and age assurance.'
  },
  {
    countryCode: 'GB',
    countryName: 'United Kingdom',
    defaultLocale: 'en-GB',
    minAgeSocial: 13,
    idVerificationRequired: true,
    regulatoryFramework: 'Online Safety Act 2023 (OSA) & Age Appropriate Design Code',
    notes: 'UK Online Safety Act enforces rigorous age verification for commercial platforms.'
  },
  {
    countryCode: 'AU',
    countryName: 'Australia',
    defaultLocale: 'en-AU',
    minAgeSocial: 16,
    idVerificationRequired: true,
    regulatoryFramework: 'Online Safety Amendment (Social Media Minimum Age) Act 2024',
    notes: 'National minimum social media age of 16 enacted December 2024.'
  },
  {
    countryCode: 'CA',
    countryName: 'Canada',
    defaultLocale: 'en-CA',
    minAgeSocial: 13,
    idVerificationRequired: false,
    regulatoryFramework: 'PIPEDA / Bill C-27 (Consumer Privacy Protection Act)',
    notes: 'Federal digital consent age threshold of 13 under PIPEDA.'
  },
  {
    countryCode: 'GLOBAL',
    countryName: 'Global (International Default)',
    defaultLocale: 'en-US',
    minAgeSocial: 13,
    idVerificationRequired: false,
    regulatoryFramework: 'International Standard Digital Age Baseline',
    notes: "Fallback rule applied when the visitor's country cannot be determined."
  }
];

export default function GeoRulesManager({ token: propToken }: GeoRulesManagerProps) {
  const [rules, setRules] = useState<GeoRuleItem[]>(FALLBACK_DEFAULT_RULES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'id-required' | 'id-optional' | 'custom'>('all');

  // Live Tester State
  const [testerResult, setTesterResult] = useState<GeoTesterResult | null>(null);
  const [testerLoading, setTesterLoading] = useState(false);
  const [simulatedCountry, setSimulatedCountry] = useState('');
  const [simulatedLocale, setSimulatedLocale] = useState('');

  // Edit / Create Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<GeoRuleItem | null>(null);
  const [formCountryCode, setFormCountryCode] = useState('');
  const [formCountryName, setFormCountryName] = useState('');
  const [formDefaultLocale, setFormDefaultLocale] = useState('en');
  const [formMinAgeSocial, setFormMinAgeSocial] = useState(13);
  const [formIdRequired, setFormIdRequired] = useState(false);
  const [formFramework, setFormFramework] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Quick inline update state
  const [quickUpdatingCode, setQuickUpdatingCode] = useState<string | null>(null);

  const getAuthToken = (): string => {
    return propToken ||
           localStorage.getItem('gg_token') || 
           localStorage.getItem('adminToken') || 
           localStorage.getItem('token') || 
           '';
  };

  const fetchRules = async () => {
    setLoading(true);
    setError('');
    try {
      const token = getAuthToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/admin/geo-rules', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.rules && data.rules.length > 0) {
          setRules(data.rules);
        } else {
          setRules(FALLBACK_DEFAULT_RULES);
        }
      } else {
        setRules(FALLBACK_DEFAULT_RULES);
      }
    } catch (e: any) {
      setRules(FALLBACK_DEFAULT_RULES);
    } finally {
      setLoading(false);
    }
  };

  const runGeoTester = async (overrideCountry = '', overrideLocale = '') => {
    setTesterLoading(true);
    try {
      let url = '/api/geo';
      const params = new URLSearchParams();
      if (overrideCountry) params.set('country', overrideCountry);
      if (overrideLocale) params.set('locale', overrideLocale);
      const queryStr = params.toString();
      if (queryStr) url += `?${queryStr}`;

      const clientHeaders: Record<string, string> = {};
      if (typeof navigator !== 'undefined' && navigator.language) {
        clientHeaders['x-client-locale'] = navigator.language;
      }

      const res = await fetch(url, { headers: clientHeaders });
      if (res.ok) {
        const data = await res.json();
        setTesterResult(data);
      }
    } catch (e) {
      console.error('Failed to run geo tester:', e);
    } finally {
      setTesterLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
    runGeoTester();
  }, [propToken]);

  const openCreateModal = () => {
    setEditingRule(null);
    setFormCountryCode('');
    setFormCountryName('');
    setFormDefaultLocale('en');
    setFormMinAgeSocial(13);
    setFormIdRequired(false);
    setFormFramework('');
    setFormNotes('');
    setShowModal(true);
  };

  const openEditModal = (rule: GeoRuleItem) => {
    setEditingRule(rule);
    setFormCountryCode(rule.countryCode);
    setFormCountryName(rule.countryName);
    setFormDefaultLocale(rule.defaultLocale || 'en');
    setFormMinAgeSocial(rule.minAgeSocial);
    setFormIdRequired(rule.idVerificationRequired);
    setFormFramework(rule.regulatoryFramework || '');
    setFormNotes(rule.notes || '');
    setShowModal(true);
  };

  const handleCountryCodeChange = (raw: string) => {
    const code = raw.toUpperCase().trim();
    setFormCountryCode(code);
    if ((code.length === 2 || code.length === 3) && !editingRule) {
      try {
        const dn = new Intl.DisplayNames(['en'], { type: 'region' });
        const detectedName = dn.of(code);
        if (detectedName && (!formCountryName || formCountryName === formCountryCode)) {
          setFormCountryName(detectedName);
        }
      } catch {}
      if (!formDefaultLocale || formDefaultLocale === 'en') {
        const base = code.slice(0, 2);
        setFormDefaultLocale(`${base.toLowerCase()}-${base.toUpperCase()}`);
      }
    }
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCountryCode.trim()) return;

    setSaving(true);
    setError('');
    setSuccessMessage('');
    try {
      const token = getAuthToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/admin/geo-rules', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          countryCode: formCountryCode.trim().toUpperCase(),
          countryName: formCountryName.trim(),
          defaultLocale: formDefaultLocale.trim(),
          minAgeSocial: Number(formMinAgeSocial),
          idVerificationRequired: Boolean(formIdRequired),
          regulatoryFramework: formFramework.trim(),
          notes: formNotes.trim()
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessMessage(`Rule for ${data.rule?.countryCode || formCountryCode} saved successfully!`);
        setShowModal(false);
        fetchRules();
        runGeoTester(formCountryCode.trim().toUpperCase());
      } else {
        const text = await res.text();
        let errMsg = 'Failed to save geo rule';
        try {
          const parsed = JSON.parse(text);
          if (parsed.error) errMsg = parsed.error;
        } catch {
          if (text) errMsg = text;
        }
        setError(errMsg);
      }
    } catch (e: any) {
      setError(e?.message || 'Connection error saving geo rule');
    } finally {
      setSaving(false);
    }
  };

  const handleResetSingleRule = async (countryCode: string) => {
    if (!confirm(`Reset ${countryCode} to system factory defaults?`)) return;

    try {
      const token = getAuthToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`/api/admin/geo-rules/${countryCode}`, {
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        setSuccessMessage(`Reset ${countryCode} to system default.`);
        fetchRules();
        if (testerResult?.countryCode === countryCode) {
          runGeoTester(countryCode);
        }
      } else {
        const text = await res.text();
        let errMsg = 'Failed to reset rule';
        try {
          const parsed = JSON.parse(text);
          if (parsed.error) errMsg = parsed.error;
        } catch {
          if (text) errMsg = text;
        }
        setError(errMsg);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to reset rule');
    }
  };

  const handleResetAllRules = async () => {
    if (!confirm('Are you sure you want to reset ALL country age and ID verification rules to factory defaults?')) return;

    try {
      const token = getAuthToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/admin/geo-rules/reset', {
        method: 'POST',
        headers
      });
      if (res.ok) {
        setSuccessMessage('All country geo rules have been reset to factory defaults.');
        fetchRules();
        runGeoTester();
      } else {
        const text = await res.text();
        let errMsg = 'Failed to reset all geo rules';
        try {
          const parsed = JSON.parse(text);
          if (parsed.error) errMsg = parsed.error;
        } catch {
          if (text) errMsg = text;
        }
        setError(errMsg);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to reset all geo rules');
    }
  };

  const handleToggleIdRequired = async (rule: GeoRuleItem) => {
    setQuickUpdatingCode(rule.countryCode);
    try {
      const token = getAuthToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/admin/geo-rules', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          countryCode: rule.countryCode,
          countryName: rule.countryName,
          defaultLocale: rule.defaultLocale,
          minAgeSocial: rule.minAgeSocial,
          idVerificationRequired: !rule.idVerificationRequired,
          regulatoryFramework: rule.regulatoryFramework,
          notes: rule.notes
        })
      });

      if (res.ok) {
        setRules(prev => prev.map(r => r.countryCode === rule.countryCode ? { ...r, idVerificationRequired: !r.idVerificationRequired, isCustom: true } : r));
        if (testerResult?.countryCode === rule.countryCode) {
          runGeoTester(rule.countryCode);
        }
      } else {
        const text = await res.text();
        let errMsg = 'Failed to toggle ID verification';
        try {
          const parsed = JSON.parse(text);
          if (parsed.error) errMsg = parsed.error;
        } catch {
          if (text) errMsg = text;
        }
        setError(errMsg);
      }
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Failed to update rule');
    } finally {
      setQuickUpdatingCode(null);
    }
  };

  const handleUpdateAge = async (rule: GeoRuleItem, newAge: number) => {
    if (newAge < 1 || newAge > 99) return;
    setQuickUpdatingCode(rule.countryCode);
    try {
      const token = getAuthToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/admin/geo-rules', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          countryCode: rule.countryCode,
          countryName: rule.countryName,
          defaultLocale: rule.defaultLocale,
          minAgeSocial: newAge,
          idVerificationRequired: rule.idVerificationRequired,
          regulatoryFramework: rule.regulatoryFramework,
          notes: rule.notes
        })
      });

      if (res.ok) {
        setRules(prev => prev.map(r => r.countryCode === rule.countryCode ? { ...r, minAgeSocial: newAge, isCustom: true } : r));
        if (testerResult?.countryCode === rule.countryCode) {
          runGeoTester(rule.countryCode);
        }
      } else {
        const text = await res.text();
        let errMsg = 'Failed to update minimal age';
        try {
          const parsed = JSON.parse(text);
          if (parsed.error) errMsg = parsed.error;
        } catch {
          if (text) errMsg = text;
        }
        setError(errMsg);
      }
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Failed to update age');
    } finally {
      setQuickUpdatingCode(null);
    }
  };

  const filteredRules = rules.filter(r => {
    const matchesSearch = 
      r.countryCode.toLowerCase().includes(search.toLowerCase()) ||
      r.countryName.toLowerCase().includes(search.toLowerCase()) ||
      (r.regulatoryFramework || '').toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (filterType === 'id-required') return r.idVerificationRequired;
    if (filterType === 'id-optional') return !r.idVerificationRequired;
    if (filterType === 'custom') return r.isCustom;
    return true;
  });

  const idRequiredCount = rules.filter(r => r.idVerificationRequired).length;
  const customCount = rules.filter(r => r.isCustom).length;

  return (
    <div className="space-y-8">
      {/* HEADER SECTION */}
      <div className="bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-600/30 text-indigo-700 dark:text-indigo-300 font-mono text-[11px] font-bold uppercase tracking-wider rounded-lg">
              <Globe className="w-3.5 h-3.5 text-indigo-500" />
              Geo Compliance Engine & Public API
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-zinc-900 dark:text-white font-mono">
              Country Social Age & ID Verification Rules
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 font-mono max-w-2xl leading-relaxed">
              Manages minimal age requirements for social media platforms and whether government ID verification is mandatory per country. Public clients and apps can query <code className="bg-zinc-100 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded font-bold">GET /api/geo</code> to automatically receive visitor locale, required age, and ID verification status.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Country Rule</span>
            </button>
            <button
              onClick={handleResetAllRules}
              className="flex items-center gap-2 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 font-mono text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Defaults</span>
            </button>
          </div>
        </div>

        {/* STATS STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800">
          <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-700/60 font-mono">
            <div className="text-[10px] uppercase font-bold text-zinc-400">Configured Rules</div>
            <div className="text-2xl font-black text-zinc-900 dark:text-white mt-1">{rules.length}</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Global coverage</div>
          </div>

          <div className="p-3.5 bg-amber-500/5 rounded-xl border border-amber-500/20 font-mono">
            <div className="text-[10px] uppercase font-bold text-amber-500">ID Verification Required</div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{idRequiredCount}</div>
            <div className="text-[10px] text-amber-600/70 mt-0.5">Mandatory ID gating</div>
          </div>

          <div className="p-3.5 bg-indigo-500/5 rounded-xl border border-indigo-500/20 font-mono">
            <div className="text-[10px] uppercase font-bold text-indigo-500">Custom Overrides</div>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{customCount}</div>
            <div className="text-[10px] text-indigo-600/70 mt-0.5">Admin customized</div>
          </div>

          <div className="p-3.5 bg-emerald-500/5 rounded-xl border border-emerald-500/20 font-mono">
            <div className="text-[10px] uppercase font-bold text-emerald-500">Live API Endpoint</div>
            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1 truncate">/api/geo</div>
            <div className="text-[10px] text-emerald-600/70 mt-0.5">Auto-locale detection</div>
          </div>
        </div>
      </div>

      {/* LIVE TESTER & ENDPOINT PREVIEW */}
      <div className="bg-zinc-950 text-zinc-100 rounded-2xl p-6 sm:p-8 border-2 border-zinc-800 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <Terminal className="w-6 h-6 text-emerald-400" />
            <div>
              <h3 className="font-mono text-base font-bold uppercase tracking-tight text-white">Live /api/geo Endpoint Simulator</h3>
              <p className="text-xs text-zinc-400 font-mono">Tests current visitor detection or simulates any international country code</p>
            </div>
          </div>
          <button
            onClick={() => runGeoTester(simulatedCountry, simulatedLocale)}
            disabled={testerLoading}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-mono text-xs font-bold uppercase rounded-lg transition-all disabled:opacity-50 cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testerLoading ? 'animate-spin' : ''}`} />
            <span>Test / Refresh</span>
          </button>
        </div>

        {/* SIMULATOR CONTROLS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">Simulate Country Code</label>
            <input
              type="text"
              placeholder="e.g. US, GB, AU, DE, FR, KR"
              value={simulatedCountry}
              onChange={(e) => setSimulatedCountry(e.target.value.toUpperCase())}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-400 uppercase"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">Simulate Visitor Locale</label>
            <input
              type="text"
              placeholder="e.g. en-US, de-DE, ko-KR, fr-FR"
              value={simulatedLocale}
              onChange={(e) => setSimulatedLocale(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-400"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={() => runGeoTester(simulatedCountry, simulatedLocale)}
              className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold uppercase rounded-lg transition-all"
            >
              Simulate Query
            </button>
            {(simulatedCountry || simulatedLocale) && (
              <button
                onClick={() => {
                  setSimulatedCountry('');
                  setSimulatedLocale('');
                  runGeoTester('', '');
                }}
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs rounded-lg"
                title="Reset simulation to real IP"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* LIVE JSON OUTPUT */}
        {testerResult && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
            {/* Summary Badges */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 uppercase text-[10px]">Detected Location</span>
                <span className="text-xl">{getCountryFlag(testerResult.countryCode)}</span>
              </div>
              <div className="text-lg font-bold text-white">
                {testerResult.countryName} ({testerResult.countryCode})
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Visitor Locale:</span>
                  <span className="font-bold text-indigo-400">{testerResult.locale}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Minimal Social Age:</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                    {testerResult.minimalAgeRequirement}+
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">ID Verification:</span>
                  <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                    testerResult.idVerificationRequired 
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {testerResult.idVerificationRequired ? 'MANDATORY' : 'OPTIONAL'}
                  </span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-400">Detection Source:</span>
                  <span className="text-zinc-300">{testerResult.detectedFrom}</span>
                </div>
              </div>
            </div>

            {/* Code Response Block */}
            <div className="lg:col-span-2 bg-black/60 border border-zinc-800 rounded-xl p-4 font-mono text-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-[10px] text-zinc-500 pb-2 border-b border-zinc-800 mb-3">
                <span>GET /api/geo HTTP/1.1</span>
                <span>Response (200 OK)</span>
              </div>
              <pre className="text-emerald-400 overflow-x-auto text-[11px] leading-relaxed">
                {JSON.stringify(testerResult, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* SUCCESS / ERROR ALERTS */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500 rounded-xl text-emerald-900 dark:text-emerald-200 font-mono text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-emerald-700 hover:text-emerald-900 dark:hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500 rounded-xl text-rose-900 dark:text-rose-200 font-mono text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-rose-700 hover:text-rose-900 dark:hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* FILTER & SEARCH STRIP */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by country, code (US, GB), or legislation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 font-mono text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg border whitespace-nowrap transition-all ${
              filterType === 'all' 
                ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900' 
                : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700'
            }`}
          >
            All ({rules.length})
          </button>
          <button
            onClick={() => setFilterType('id-required')}
            className={`px-3 py-1.5 rounded-lg border whitespace-nowrap transition-all ${
              filterType === 'id-required' 
                ? 'bg-amber-600 text-white border-amber-600' 
                : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700'
            }`}
          >
            ID Required ({idRequiredCount})
          </button>
          <button
            onClick={() => setFilterType('id-optional')}
            className={`px-3 py-1.5 rounded-lg border whitespace-nowrap transition-all ${
              filterType === 'id-optional' 
                ? 'bg-emerald-600 text-white border-emerald-600' 
                : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700'
            }`}
          >
            ID Optional ({rules.length - idRequiredCount})
          </button>
          <button
            onClick={() => setFilterType('custom')}
            className={`px-3 py-1.5 rounded-lg border whitespace-nowrap transition-all ${
              filterType === 'custom' 
                ? 'bg-indigo-600 text-white border-indigo-600' 
                : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700'
            }`}
          >
            Custom Overrides ({customCount})
          </button>
        </div>
      </div>

      {/* RULES TABLE */}
      <div className="bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="bg-zinc-100 dark:bg-zinc-800/80 border-b-2 border-zinc-900 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-[10px] uppercase font-bold tracking-wider">
                <th className="py-3 px-4">Country & Code</th>
                <th className="py-3 px-4">Min Age (Social)</th>
                <th className="py-3 px-4">ID Verification</th>
                <th className="py-3 px-4">Regulatory Framework & Law</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredRules.map((rule) => (
                <tr key={rule.countryCode} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  {/* Country Name & Flag */}
                  <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-white whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl leading-none">{getCountryFlag(rule.countryCode)}</span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span>{rule.countryName}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-bold text-zinc-700 dark:text-zinc-300">
                            {rule.countryCode}
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-400 font-normal">
                          Locale: {rule.defaultLocale || 'en'}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Minimal Social Age Requirement */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <select
                        value={rule.minAgeSocial}
                        disabled={quickUpdatingCode === rule.countryCode}
                        onChange={(e) => handleUpdateAge(rule, parseInt(e.target.value, 10))}
                        className={`bg-zinc-100 dark:bg-zinc-800 border rounded-lg px-2.5 py-1 text-xs font-bold font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer ${
                          rule.minAgeSocial >= 16 
                            ? 'text-purple-600 dark:text-purple-400 border-purple-300 dark:border-purple-800' 
                            : 'text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
                        }`}
                      >
                        {[13, 14, 15, 16, 17, 18, 21].map(age => (
                          <option key={age} value={age}>{age}+ Required</option>
                        ))}
                      </select>
                    </div>
                  </td>

                  {/* ID Verification Required Toggle */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleToggleIdRequired(rule)}
                      disabled={quickUpdatingCode === rule.countryCode}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide transition-all border cursor-pointer ${
                        rule.idVerificationRequired
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                      }`}
                      title="Click to toggle ID verification requirement"
                    >
                      {rule.idVerificationRequired ? (
                        <>
                          <Lock className="w-3 h-3 text-amber-500" />
                          <span>ID MANDATORY</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span>OPTIONAL</span>
                        </>
                      )}
                    </button>
                  </td>

                  {/* Framework & Legislation */}
                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="font-semibold text-zinc-800 dark:text-zinc-200 truncate" title={rule.regulatoryFramework}>
                      {rule.regulatoryFramework || 'Standard Baseline'}
                    </div>
                    {rule.notes && (
                      <div className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5" title={rule.notes}>
                        {rule.notes}
                      </div>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {rule.isCustom ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/30">
                        <Sparkles className="w-3 h-3" /> CUSTOM
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                        DEFAULT
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(rule)}
                        className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                        title="Edit rule details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => runGeoTester(rule.countryCode)}
                        className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-emerald-500 rounded-lg transition-colors cursor-pointer"
                        title="Test /api/geo with this country"
                      >
                        <Terminal className="w-3.5 h-3.5" />
                      </button>
                      {rule.isCustom && (
                        <button
                          onClick={() => handleResetSingleRule(rule.countryCode)}
                          className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 rounded-lg transition-colors cursor-pointer"
                          title="Reset back to default"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredRules.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500 dark:text-zinc-400 font-mono">
                    No country rules found matching "{search}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border-4 border-zinc-900 dark:border-zinc-700 rounded-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-600" />
                <h3 className="font-mono text-lg font-bold uppercase tracking-tight text-zinc-900 dark:text-white">
                  {editingRule ? `Edit Rule: ${editingRule.countryCode}` : 'Add Country Geo Rule'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Country Code (ISO 2-Letter) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="e.g. US, NL, DE, JP, or GLOBAL"
                    value={formCountryCode}
                    onChange={(e) => handleCountryCodeChange(e.target.value)}
                    disabled={Boolean(editingRule)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500 uppercase disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Country Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. United States"
                    value={formCountryName}
                    onChange={(e) => setFormCountryName(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Minimal Social Age *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={99}
                    value={formMinAgeSocial}
                    onChange={(e) => setFormMinAgeSocial(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500 font-bold"
                  />
                  <span className="text-[10px] text-zinc-400 mt-0.5 block">Standard: 13, 14, 15, 16, or 18</span>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Default Locale
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. en-US, de-DE"
                    value={formDefaultLocale}
                    onChange={(e) => setFormDefaultLocale(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* ID Verification Checkbox */}
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-zinc-800 dark:text-zinc-200 text-xs uppercase">Government ID Verification Required</div>
                  <div className="text-[10px] text-zinc-500">Require users from this country to upload formal ID or age credentials</div>
                </div>
                <input
                  type="checkbox"
                  checked={formIdRequired}
                  onChange={(e) => setFormIdRequired(e.target.checked)}
                  className="w-5 h-5 text-indigo-600 rounded cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Regulatory Framework & Statute
                </label>
                <input
                  type="text"
                  placeholder="e.g. COPPA, Online Safety Act 2024, GDPR Art. 8"
                  value={formFramework}
                  onChange={(e) => setFormFramework(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Compliance Notes & Details
                </label>
                <textarea
                  rows={3}
                  placeholder="Additional context on age assurance requirements, parental consent stipulations, or penalties..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-zinc-300 dark:border-zinc-700 rounded-xl font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold uppercase tracking-wider transition-colors shadow-md disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Geo Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
