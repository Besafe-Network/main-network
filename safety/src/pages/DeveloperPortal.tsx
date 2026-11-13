import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  Globe, 
  Code2, 
  ShieldCheck, 
  Copy, 
  Check, 
  Play, 
  Key, 
  Send, 
  RefreshCw, 
  Sparkles, 
  AlertCircle, 
  Lock, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Trash2, 
  Edit3, 
  History, 
  ArrowRight,
  Eye,
  EyeOff,
  Server,
  Zap,
  Activity,
  Layers
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface EnterpriseEndpointItem {
  _id: string;
  name: string;
  apiKey: string;
  webhookUrl: string;
  developerEmail: string;
  description?: string;
  secretKey?: string;
  isActive: boolean;
  deliveriesCount: number;
  lastDeliveryStatus: string;
  lastDeliveryAt?: string;
  lastPayloadSent?: any;
  lastResponseCode?: number;
  lastErrorMessage?: string;
  createdAt: string;
}

interface DeliveryLogItem {
  _id: string;
  email: string;
  userId?: string;
  status: 'approved' | 'denied';
  dob?: string;
  callbackUrl: string;
  payloadSent: any;
  deliverySuccess: boolean;
  httpStatus?: number;
  errorMessage?: string;
  timestamp: string;
}

export default function DeveloperPortal() {
  const [endpoints, setEndpoints] = useState<EnterpriseEndpointItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterEmail, setFilterEmail] = useState('');
  const [revealedKeys, setRevealedKeys] = useState<{ [id: string]: boolean }>({});
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // New endpoint modal / form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    webhookUrl: '',
    developerEmail: '',
    description: '',
    secretKey: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [newlyCreatedEndpoint, setNewlyCreatedEndpoint] = useState<EnterpriseEndpointItem | null>(null);

  // Live Tester State
  const [testToken, setTestToken] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [testUserId, setTestUserId] = useState('');
  const [testCustomWebhook, setTestCustomWebhook] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Webhook Ping Test State
  const [testingPingId, setTestingPingId] = useState<string | null>(null);
  const [pingResult, setPingResult] = useState<{ [id: string]: any }>({});

  // Delivery Logs Modal State
  const [activeLogsEndpoint, setActiveLogsEndpoint] = useState<EnterpriseEndpointItem | null>(null);
  const [logsList, setLogsList] = useState<DeliveryLogItem[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Code example active tab
  const [codeTab, setCodeTab] = useState<'curl' | 'js' | 'python' | 'php' | 'go'>('curl');

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://api.besafenetwork.org';

  // Load endpoints
  const loadEndpoints = async (emailQuery?: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('gg_token') || localStorage.getItem('adminToken');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let url = '/api/v1/enterprise/endpoints';
      const q = emailQuery !== undefined ? emailQuery : filterEmail;
      if (q.trim()) {
        url += `?email=${encodeURIComponent(q.trim())}`;
      }

      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        setEndpoints(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length > 0 && !testToken) {
          setTestToken(data[0].apiKey);
        }
      }
    } catch (e) {
      console.error('Failed to load endpoints:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if user has an email stored
    const savedEmail = localStorage.getItem('dev_portal_email') || '';
    if (savedEmail) {
      setFilterEmail(savedEmail);
      setCreateForm(prev => ({ ...prev, developerEmail: savedEmail }));
      loadEndpoints(savedEmail);
    } else {
      loadEndpoints('');
    }
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const toggleKeyVisibility = (id: string) => {
    setRevealedKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Create new endpoint
  const handleCreateEndpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!createForm.name.trim() || !createForm.webhookUrl.trim() || !createForm.developerEmail.trim()) {
      setFormError('Platform name, Webhook POST URL, and Developer email are required.');
      return;
    }

    if (!createForm.webhookUrl.startsWith('http://') && !createForm.webhookUrl.startsWith('https://')) {
      setFormError('Webhook URL must begin with https:// or http://');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/enterprise/endpoints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create endpoint');
      }

      localStorage.setItem('dev_portal_email', createForm.developerEmail.trim());
      setFilterEmail(createForm.developerEmail.trim());
      setNewlyCreatedEndpoint(data.endpoint);
      setTestToken(data.endpoint.apiKey);
      loadEndpoints(createForm.developerEmail.trim());
    } catch (err: any) {
      setFormError(err.message || 'An error occurred while creating endpoint.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete endpoint
  const handleDeleteEndpoint = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete and revoke the endpoint for "${name}"? External requests using its API token will fail.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/v1/enterprise/endpoints/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setEndpoints(prev => prev.filter(e => e._id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Test Webhook Ping
  const handleTestPing = async (id: string) => {
    setTestingPingId(id);
    setPingResult(prev => ({ ...prev, [id]: null }));
    try {
      const res = await fetch(`/api/v1/enterprise/endpoints/${id}/test`, {
        method: 'POST'
      });
      const data = await res.json();
      setPingResult(prev => ({ ...prev, [id]: data }));
      // Refresh list to update stats
      loadEndpoints();
    } catch (err: any) {
      setPingResult(prev => ({
        ...prev,
        [id]: { success: false, error: err.message || 'Network request failed' }
      }));
    } finally {
      setTestingPingId(null);
    }
  };

  // View logs
  const handleViewLogs = async (endpoint: EnterpriseEndpointItem) => {
    setActiveLogsEndpoint(endpoint);
    setLoadingLogs(true);
    try {
      const res = await fetch(`/api/v1/enterprise/endpoints/${endpoint._id}/logs`);
      if (res.ok) {
        const data = await res.json();
        setLogsList(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Failed to load logs', e);
    } finally {
      setLoadingLogs(false);
    }
  };

  // Run Live Age Check
  const handleRunAgeCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail.trim()) {
      alert('Please enter an email address to check.');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const token = testToken.trim() || (endpoints[0]?.apiKey || '');
      const bodyPayload: any = {
        mail: testEmail.trim(),
        userid: testUserId.trim() || undefined
      };
      if (testCustomWebhook.trim()) {
        bodyPayload.callbackUrl = testCustomWebhook.trim();
      }

      const startTime = Date.now();
      const res = await fetch('/api/v1/enterprise/age-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-api-key': token
        },
        body: JSON.stringify(bodyPayload)
      });
      const latency = Date.now() - startTime;
      const data = await res.json();

      setTestResult({
        httpStatus: res.status,
        latency,
        data,
        dispatchedPayload: data.status === 'approved' ? {
          mail: data.mail,
          userid: data.userid,
          dob: data.dob,
          status: 'approved'
        } : {
          mail: data.mail,
          userid: data.userid,
          status: 'denied'
        }
      });
    } catch (err: any) {
      setTestResult({
        httpStatus: 0,
        latency: 0,
        data: { error: err.message || 'Network connection failed' },
        dispatchedPayload: null
      });
    } finally {
      setIsTesting(false);
    }
  };

  const sampleApiKey = endpoints[0]?.apiKey || 'ent_live_9a7b8c2d1e0f3456';
  const sampleWebhook = endpoints[0]?.webhookUrl || 'https://yourwebsite.com/api/age-verify-callback';

  const codeSnippets = {
    curl: `curl -X POST "${originUrl}/api/v1/enterprise/age-verify" \\
  -H "Authorization: Bearer ${sampleApiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "mail": "user@example.com",
    "userid": "usr_94821",
    "callbackUrl": "${sampleWebhook}"
  }'`,
    js: `// Node.js / JavaScript (Fetch or Axios)
const response = await fetch("${originUrl}/api/v1/enterprise/age-verify", {
  method: "POST",
  headers: {
    "Authorization": "Bearer ${sampleApiKey}",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    mail: "user@example.com",
    userid: "usr_94821" // Your platform's user ID
  })
});

const result = await response.json();
console.log("Age check status:", result.status); // "approved" or "denied"
// Your webhook endpoint will also receive the POST callback!`,
    python: `# Python (requests)
import requests

url = "${originUrl}/api/v1/enterprise/age-verify"
headers = {
    "Authorization": "Bearer ${sampleApiKey}",
    "Content-Type": "application/json"
}
payload = {
    "mail": "user@example.com",
    "userid": "usr_94821"
}

response = requests.post(url, json=payload, headers=headers)
data = response.json()
print("Verification Status:", data.get("status"))`,
    php: `<?php
// PHP cURL Example
$ch = curl_init("${originUrl}/api/v1/enterprise/age-verify");
$payload = json_encode([
    "mail" => "user@example.com",
    "userid" => "usr_94821"
]);

curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer ${sampleApiKey}",
    "Content-Type: application/json"
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$result = curl_exec($ch);
curl_close($ch);
$data = json_decode($result, true);
?>`,
    go: `// Go HTTP Request
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
)

func main() {
    payload, _ := json.Marshal(map[string]string{
        "mail":   "user@example.com",
        "userid": "usr_94821",
    })

    req, _ := http.NewRequest("POST", "${originUrl}/api/v1/enterprise/age-verify", bytes.NewBuffer(payload))
    req.Header.Set("Authorization", "Bearer ${sampleApiKey}")
    req.Header.Set("Content-Type", "application/json")

    client := &http.Client{}
    resp, err := client.Do(req)
    if err == nil {
        fmt.Println("Response Status:", resp.Status)
    }
}`
  };

  return (
    <div className="space-y-12 max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="border-4 border-[#141414] dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 sm:p-10 shadow-[-6px_6px_0px_0px_rgba(20,20,20,1)] dark:shadow-[-6px_6px_0px_0px_rgba(255,255,255,0.15)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-600/30 text-indigo-700 dark:text-indigo-300 font-mono text-[11px] font-bold uppercase tracking-widest mb-4">
              <Zap className="w-3.5 h-3.5" />
              Enterprise Integration Engine
            </div>
            <h1 className="font-mono text-2xl sm:text-4xl font-extrabold uppercase tracking-tight text-[#141414] dark:text-white">
              Age Verification API for Platforms
            </h1>
            <p className="mt-3 text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
              Verify if users on your external websites, games, or social platforms are 18+ using their email address. When verified, our engine automatically fires a signed JSON POST request to your webhook endpoint with <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">mail</span>, <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">userid</span>, <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">dob</span>, and <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">status</span>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            <Link
              to="/request-api-key"
              className="flex items-center justify-center gap-2 px-5 py-3.5 bg-amber-500 text-[#141414] font-mono text-xs font-black uppercase tracking-wider border-2 border-[#141414] dark:border-zinc-500 shadow-[-3px_3px_0px_0px_rgba(20,20,20,1)] hover:bg-amber-400 transition-all cursor-pointer"
            >
              <Key className="w-4 h-4" />
              <span>Request Developer API Key</span>
            </Link>
            <button
              onClick={() => {
                setNewlyCreatedEndpoint(null);
                setShowCreateModal(true);
              }}
              className="flex items-center justify-center gap-2 px-5 py-3.5 bg-indigo-600 text-white font-mono text-xs font-bold uppercase tracking-wider border-2 border-[#141414] dark:border-zinc-500 shadow-[-3px_3px_0px_0px_rgba(20,20,20,1)] hover:bg-indigo-700 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Webhook & Token</span>
            </button>
            <a
              href="#interactive-tester"
              className="flex items-center justify-center gap-2 px-5 py-3.5 bg-white dark:bg-zinc-800 text-[#141414] dark:text-white font-mono text-xs font-bold uppercase tracking-wider border-2 border-[#141414] dark:border-zinc-600 shadow-[-3px_3px_0px_0px_rgba(20,20,20,1)] hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all"
            >
              <Play className="w-4 h-4 text-emerald-600" />
              <span>Live Tester</span>
            </a>
          </div>
        </div>

        {/* 4-Step Architecture Workflow */}
        <div className="mt-8 pt-8 border-t-2 border-[#141414]/10 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-mono text-xs font-bold">
              <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 flex items-center justify-center text-[10px]">1</span>
              <span>Register Webhook</span>
            </div>
            <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
              Provide your platform's receiving URL (e.g. <code className="text-[10px] bg-zinc-200 dark:bg-zinc-700 px-1 py-0.5">https://site.com/verify-hook</code>).
            </p>
          </div>

          <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-mono text-xs font-bold">
              <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 flex items-center justify-center text-[10px]">2</span>
              <span>Acquire API Token</span>
            </div>
            <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
              Generate a unique API Bearer token (<code className="text-[10px] bg-zinc-200 dark:bg-zinc-700 px-1 py-0.5">ent_live_...</code>) for server calls.
            </p>
          </div>

          <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-mono text-xs font-bold">
              <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 flex items-center justify-center text-[10px]">3</span>
              <span>Send Email & UserID</span>
            </div>
            <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
              Call <code className="text-[10px] bg-zinc-200 dark:bg-zinc-700 px-1 py-0.5">/api/v1/enterprise/age-verify</code> with the target email.
            </p>
          </div>

          <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold">
              <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-[10px]">4</span>
              <span>POST Callback Fired</span>
            </div>
            <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
              If approved: returns DOB & approved. If denied: dispatches denied payload.
            </p>
          </div>
        </div>
      </div>

      {/* Endpoints & Tokens Management */}
      <div className="border-4 border-[#141414] dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 sm:p-8 shadow-[-4px_4px_0px_0px_rgba(20,20,20,1)] dark:shadow-[-4px_4px_0px_0px_rgba(255,255,255,0.1)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Server className="w-6 h-6 text-indigo-600" />
            <div>
              <h2 className="font-mono text-lg sm:text-xl font-bold uppercase tracking-tight">Configured POST Endpoints & Tokens</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Manage your external platform webhook receivers and authorization credentials</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="email"
                placeholder="Filter by developer email..."
                value={filterEmail}
                onChange={(e) => setFilterEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    localStorage.setItem('dev_portal_email', filterEmail);
                    loadEndpoints(filterEmail);
                  }
                }}
                className="px-3 py-1.5 text-xs font-mono bg-zinc-50 dark:bg-zinc-800 border-2 border-[#141414] dark:border-zinc-600 rounded-none w-56 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={() => {
                localStorage.setItem('dev_portal_email', filterEmail);
                loadEndpoints(filterEmail);
              }}
              className="p-2 border-2 border-[#141414] dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 transition-colors"
              title="Search by email"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {endpoints.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/30">
            <Key className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
            <h3 className="font-mono text-sm font-bold uppercase text-zinc-700 dark:text-zinc-300">No Enterprise Endpoints Configured</h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1 mb-4">
              Register your external platform or game to obtain your dedicated API token and configure where verification POST payloads will be delivered.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-mono text-xs font-bold uppercase border-2 border-[#141414] shadow-[-2px_2px_0px_0px_rgba(20,20,20,1)] hover:bg-indigo-700"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Endpoint</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {endpoints.map((ep) => {
              const isRevealed = revealedKeys[ep._id];
              const isPinging = testingPingId === ep._id;
              const pingStatus = pingResult[ep._id];

              return (
                <div 
                  key={ep._id} 
                  className="border-2 border-[#141414] dark:border-zinc-700 p-4 sm:p-6 bg-zinc-50/70 dark:bg-zinc-800/40 relative"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Platform Info */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-base text-[#141414] dark:text-white">
                          {ep.name}
                        </span>
                        <span className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider border ${
                          ep.isActive 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-500/40' 
                            : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300 border-zinc-400'
                        }`}>
                          {ep.isActive ? 'Active' : 'Paused'}
                        </span>
                        <span className="text-zinc-500 dark:text-zinc-400 text-xs font-mono">
                          ({ep.developerEmail})
                        </span>
                      </div>

                      {ep.description && (
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 italic">
                          {ep.description}
                        </p>
                      )}

                      {/* Webhook URL bar */}
                      <div className="flex items-center gap-2 pt-1">
                        <span className="font-mono text-[11px] font-bold text-indigo-700 dark:text-indigo-400 uppercase">
                          POST Endpoint:
                        </span>
                        <code className="px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-800 dark:text-zinc-200 truncate max-w-md">
                          {ep.webhookUrl}
                        </code>
                        <button
                          onClick={() => handleCopy(ep.webhookUrl, `wh_${ep._id}`)}
                          className="p-1 hover:text-indigo-600 transition-colors"
                          title="Copy Webhook URL"
                        >
                          {copiedText === `wh_${ep._id}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {/* API Token display */}
                      <div className="flex items-center gap-2 pt-1">
                        <span className="font-mono text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase flex items-center gap-1">
                          <Key className="w-3 h-3" />
                          API Token:
                        </span>
                        <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-2 py-0.5">
                          <code className="text-xs font-mono text-zinc-800 dark:text-zinc-200">
                            {isRevealed ? ep.apiKey : `${ep.apiKey.substring(0, 10)}••••••••••••••••`}
                          </code>
                          <button
                            onClick={() => toggleKeyVisibility(ep._id)}
                            className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                            title={isRevealed ? 'Hide Token' : 'Reveal Token'}
                          >
                            {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleCopy(ep.apiKey, `key_${ep._id}`)}
                            className="p-1 text-zinc-500 hover:text-indigo-600"
                            title="Copy API Token"
                          >
                            {copiedText === `key_${ep._id}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Stats & Actions */}
                    <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 shrink-0">
                      <div className="flex items-center gap-3 text-xs font-mono">
                        <div className="text-right">
                          <span className="text-zinc-400 block text-[10px] uppercase">Deliveries</span>
                          <span className="font-bold text-zinc-900 dark:text-white">{ep.deliveriesCount || 0}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-zinc-400 block text-[10px] uppercase">Last Status</span>
                          <span className={`font-bold uppercase ${
                            ep.lastDeliveryStatus === 'success' 
                              ? 'text-emerald-600 dark:text-emerald-400' 
                              : ep.lastDeliveryStatus === 'failed' 
                                ? 'text-rose-600 dark:text-rose-400' 
                                : 'text-zinc-500'
                          }`}>
                            {ep.lastDeliveryStatus || 'None'}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => handleTestPing(ep._id)}
                          disabled={isPinging}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-zinc-800 border-2 border-[#141414] dark:border-zinc-600 text-xs font-mono font-bold hover:bg-zinc-100 transition-colors cursor-pointer"
                          title="Send a sample POST test payload to this webhook"
                        >
                          <Send className={`w-3.5 h-3.5 text-blue-600 ${isPinging ? 'animate-bounce' : ''}`} />
                          <span>{isPinging ? 'Pinging...' : 'Test Webhook'}</span>
                        </button>

                        <button
                          onClick={() => handleViewLogs(ep)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-zinc-800 border-2 border-[#141414] dark:border-zinc-600 text-xs font-mono font-bold hover:bg-zinc-100 transition-colors"
                        >
                          <History className="w-3.5 h-3.5 text-amber-600" />
                          <span>Logs</span>
                        </button>

                        <button
                          onClick={() => {
                            setTestToken(ep.apiKey);
                            const el = document.getElementById('interactive-tester');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 border-2 border-indigo-600 text-indigo-700 dark:text-indigo-300 text-xs font-mono font-bold hover:bg-indigo-100 transition-colors"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Test in Sandbox</span>
                        </button>

                        <button
                          onClick={() => handleDeleteEndpoint(ep._id, ep.name)}
                          className="p-1.5 text-zinc-400 hover:text-red-600 transition-colors"
                          title="Revoke / Delete Endpoint"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Ping Test Inline Notification */}
                  {pingStatus && (
                    <div className={`mt-3 p-3 border font-mono text-xs ${
                      pingStatus.success 
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/50 text-emerald-800 dark:text-emerald-300' 
                        : 'bg-rose-50 dark:bg-rose-950/40 border-rose-500/50 text-rose-800 dark:text-rose-300'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="font-bold flex items-center gap-2">
                          {pingStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-rose-600" />}
                          {pingStatus.message}
                        </span>
                        <span>HTTP {pingStatus.statusCode || 0} ({pingStatus.latencyMs}ms)</span>
                      </div>
                      {pingStatus.error && (
                        <p className="mt-1 text-[11px] opacity-80">Reason: {pingStatus.error}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Interactive Live Sandbox Tester */}
      <div 
        id="interactive-tester"
        className="border-4 border-[#141414] dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 sm:p-8 shadow-[-4px_4px_0px_0px_rgba(20,20,20,1)] dark:shadow-[-4px_4px_0px_0px_rgba(255,255,255,0.1)]"
      >
        <div className="flex items-center gap-3 mb-6">
          <Terminal className="w-6 h-6 text-emerald-600" />
          <div>
            <h2 className="font-mono text-lg sm:text-xl font-bold uppercase tracking-tight">Interactive Age Verification Sandbox</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Test live verification of an email address and observe both the API output and outgoing POST callback payload
            </p>
          </div>
        </div>

        <div className="p-3 mb-5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs font-mono text-indigo-900 dark:text-indigo-200 flex items-center gap-2.5">
          <Zap className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span>
            <strong>Discord Auto-Verification Sync:</strong> If the user's email belongs to an already verified Discord member, the API automatically verifies them, includes their Date of Birth (DOB), and dispatches status <code>approved</code>!
          </span>
        </div>

        <form onSubmit={handleRunAgeCheck} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-mono text-xs font-bold uppercase tracking-wider mb-1.5">
                Target User Email *
              </label>
              <input
                type="email"
                required
                placeholder="e.g. user@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono bg-zinc-50 dark:bg-zinc-800 border-2 border-[#141414] dark:border-zinc-600 rounded-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <span className="text-[10px] text-zinc-500">Checked against verified 18+ records</span>
            </div>

            <div>
              <label className="block font-mono text-xs font-bold uppercase tracking-wider mb-1.5">
                Platform User ID (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. ext_player_9824"
                value={testUserId}
                onChange={(e) => setTestUserId(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono bg-zinc-50 dark:bg-zinc-800 border-2 border-[#141414] dark:border-zinc-600 rounded-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <span className="text-[10px] text-zinc-500">Echoed in the webhook callback JSON</span>
            </div>

            <div>
              <label className="block font-mono text-xs font-bold uppercase tracking-wider mb-1.5">
                API Token *
              </label>
              <input
                type="text"
                required
                placeholder="ent_live_..."
                value={testToken}
                onChange={(e) => setTestToken(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono bg-zinc-50 dark:bg-zinc-800 border-2 border-[#141414] dark:border-zinc-600 rounded-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <span className="text-[10px] text-zinc-500">Your registered Enterprise Token</span>
            </div>
          </div>

          <div>
            <label className="block font-mono text-xs font-bold uppercase tracking-wider mb-1.5">
              Custom Callback POST URL Override (Optional)
            </label>
            <input
              type="url"
              placeholder="Leave empty to use your endpoint's configured URL or enter a custom webhook (e.g. https://webhook.site/...)"
              value={testCustomWebhook}
              onChange={(e) => setTestCustomWebhook(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono bg-zinc-50 dark:bg-zinc-800 border-2 border-[#141414] dark:border-zinc-600 rounded-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isTesting}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-mono text-xs font-bold uppercase tracking-wider border-2 border-[#141414] shadow-[-3px_3px_0px_0px_rgba(20,20,20,1)] hover:bg-emerald-700 transition-all cursor-pointer disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              <span>{isTesting ? 'Verifying & Dispatched Callback...' : 'Run Age Check & Dispatch Webhook'}</span>
            </button>
          </div>
        </form>

        {/* Live Test Results View */}
        {testResult && (
          <div className="mt-8 pt-6 border-t-2 border-[#141414] dark:border-zinc-700">
            <h3 className="font-mono text-sm font-bold uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>Verification Result</span>
              <span className="text-xs text-zinc-500 font-normal">Response Time: {testResult.latency}ms</span>
            </h3>

            {/* Status Summary Banner */}
            <div className={`p-4 border-2 border-[#141414] dark:border-zinc-700 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              testResult.data.status === 'approved' 
                ? 'bg-emerald-50 dark:bg-emerald-950/40' 
                : 'bg-rose-50 dark:bg-rose-950/40'
            }`}>
              <div className="flex items-center gap-3">
                {testResult.data.status === 'approved' ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="w-8 h-8 text-rose-600 shrink-0" />
                )}
                <div>
                  <div className="font-mono text-lg font-black uppercase tracking-tight">
                    Status: {testResult.data.status?.toUpperCase() || 'ERROR'}
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    {testResult.data.message || (testResult.data.status === 'approved' ? 'User is verified 18+' : 'User not verified or denied')}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:items-end text-xs font-mono">
                {testResult.data.dob && (
                  <div>
                    <span className="text-zinc-500">DOB: </span>
                    <span className="font-bold">{testResult.data.dob}</span>
                  </div>
                )}
                <div>
                  <span className="text-zinc-500">Webhook Delivered: </span>
                  <span className={`font-bold uppercase ${testResult.data.callbackDelivered ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {testResult.data.callbackDelivered ? 'YES (HTTP 200)' : 'NO / PENDING'}
                  </span>
                </div>
              </div>
            </div>

            {/* Side-by-side JSON inspections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Outgoing Webhook Payload (Dispatched to external platform) */}
              <div className="border border-zinc-300 dark:border-zinc-700 bg-zinc-900 text-zinc-100 p-4 font-mono text-xs">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800">
                  <span className="text-indigo-400 font-bold uppercase text-[11px] flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5" />
                    POST Callback Sent to External Platform
                  </span>
                  <button
                    onClick={() => handleCopy(JSON.stringify(testResult.dispatchedPayload, null, 2), 'payload_copy')}
                    className="text-zinc-400 hover:text-white"
                    title="Copy payload"
                  >
                    {copiedText === 'payload_copy' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <pre className="overflow-x-auto text-[11px] text-emerald-300 leading-relaxed">
                  {JSON.stringify(testResult.dispatchedPayload, null, 2)}
                </pre>
              </div>

              {/* Direct API Response */}
              <div className="border border-zinc-300 dark:border-zinc-700 bg-zinc-900 text-zinc-100 p-4 font-mono text-xs">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800">
                  <span className="text-amber-400 font-bold uppercase text-[11px] flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    Immediate API Response Body
                  </span>
                  <button
                    onClick={() => handleCopy(JSON.stringify(testResult.data, null, 2), 'res_copy')}
                    className="text-zinc-400 hover:text-white"
                    title="Copy response"
                  >
                    {copiedText === 'res_copy' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <pre className="overflow-x-auto text-[11px] text-zinc-300 leading-relaxed">
                  {JSON.stringify(testResult.data, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Integration Docs & Code Examples */}
      <div className="border-4 border-[#141414] dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 sm:p-8 shadow-[-4px_4px_0px_0px_rgba(20,20,20,1)] dark:shadow-[-4px_4px_0px_0px_rgba(255,255,255,0.1)]">
        <div className="flex items-center gap-3 mb-6">
          <Code2 className="w-6 h-6 text-indigo-600" />
          <div>
            <h2 className="font-mono text-lg sm:text-xl font-bold uppercase tracking-tight">Integration Documentation & Code Snippets</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Implement in minutes with standard HTTP libraries across any programming language</p>
          </div>
        </div>

        {/* Code Tabs */}
        <div className="flex items-center gap-2 border-b-2 border-[#141414] dark:border-zinc-700 mb-4 overflow-x-auto">
          {(['curl', 'js', 'python', 'php', 'go'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setCodeTab(tab)}
              className={`px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider border-t-2 border-x-2 -mb-[2px] transition-all cursor-pointer ${
                codeTab === tab
                  ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-800 dark:border-zinc-600'
                  : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-transparent hover:bg-zinc-200'
              }`}
            >
              {tab === 'js' ? 'Node.js / JS' : tab.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="relative bg-zinc-950 p-4 text-zinc-100 font-mono text-xs overflow-x-auto border border-zinc-800">
          <button
            onClick={() => handleCopy(codeSnippets[codeTab], 'code_copy')}
            className="absolute top-3 right-3 p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono flex items-center gap-1 border border-zinc-700"
          >
            {copiedText === 'code_copy' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy</span>
          </button>
          <pre className="text-emerald-400 leading-relaxed pt-2">
            {codeSnippets[codeTab]}
          </pre>
        </div>

        {/* Payload Specifications */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 border-2 border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20">
            <h4 className="font-mono text-xs font-bold uppercase text-emerald-700 dark:text-emerald-300 flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Webhook Payload: Approved Verification
            </h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3">
              When age check is verified (18+ confirmed), this exact JSON payload is sent via POST to your webhook:
            </p>
            <pre className="p-3 bg-zinc-900 text-emerald-300 font-mono text-[11px] overflow-x-auto">
{`{
  "mail": "player@gaming.com",
  "userid": "usr_94821",
  "dob": "1999-07-24",
  "status": "approved"
}`}
            </pre>
          </div>

          <div className="p-4 border-2 border-rose-500/40 bg-rose-50/50 dark:bg-rose-950/20">
            <h4 className="font-mono text-xs font-bold uppercase text-rose-700 dark:text-rose-300 flex items-center gap-2 mb-2">
              <XCircle className="w-4 h-4 text-rose-600" />
              Webhook Payload: Denied / Unverified
            </h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3">
              If the user has not verified their age, is under 18, or verification was rejected:
            </p>
            <pre className="p-3 bg-zinc-900 text-rose-300 font-mono text-[11px] overflow-x-auto">
{`{
  "mail": "player@gaming.com",
  "userid": "usr_94821",
  "status": "denied"
}`}
            </pre>
          </div>
        </div>
      </div>

      {/* Create Endpoint Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 border-4 border-[#141414] dark:border-zinc-600 p-6 sm:p-8 max-w-lg w-full shadow-[-8px_8px_0px_0px_rgba(20,20,20,1)] dark:shadow-[-8px_8px_0px_0px_rgba(255,255,255,0.15)] max-h-[90vh] overflow-y-auto">
            {newlyCreatedEndpoint ? (
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-800 font-mono text-xs font-bold uppercase">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Endpoint Successfully Created!
                </div>
                <h3 className="font-mono text-xl font-bold uppercase text-[#141414] dark:text-white">
                  Your API Token is Ready
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Save this API token securely. You will pass it in the <code className="bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5">Authorization: Bearer</code> or <code className="bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5">x-api-key</code> header.
                </p>

                <div className="p-3 bg-zinc-100 dark:bg-zinc-800 border-2 border-[#141414] dark:border-zinc-600 flex items-center justify-between gap-2">
                  <code className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 truncate">
                    {newlyCreatedEndpoint.apiKey}
                  </code>
                  <button
                    onClick={() => handleCopy(newlyCreatedEndpoint.apiKey, 'modal_key')}
                    className="px-2 py-1 bg-indigo-600 text-white font-mono text-[10px] font-bold uppercase shrink-0"
                  >
                    {copiedText === 'modal_key' ? 'Copied!' : 'Copy Token'}
                  </button>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewlyCreatedEndpoint(null);
                    }}
                    className="px-5 py-2.5 bg-[#141414] dark:bg-white text-white dark:text-[#141414] font-mono text-xs font-bold uppercase"
                  >
                    Done & Return to Portal
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateEndpoint} className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b-2 border-[#141414] dark:border-zinc-700">
                  <h3 className="font-mono text-lg font-bold uppercase">Configure Webhook & API Token</h3>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="font-mono text-sm text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                {formError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-500 text-rose-700 dark:text-rose-300 font-mono text-xs">
                    {formError}
                  </div>
                )}

                <div>
                  <label className="block font-mono text-xs font-bold uppercase mb-1">
                    Platform / Website Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Metaverse Gaming Hub"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono bg-zinc-50 dark:bg-zinc-800 border-2 border-[#141414] dark:border-zinc-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono text-xs font-bold uppercase mb-1">
                    Webhook URL (POST Destination) *
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://yourwebsite.com/api/age-verify-callback"
                    value={createForm.webhookUrl}
                    onChange={(e) => setCreateForm({ ...createForm, webhookUrl: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono bg-zinc-50 dark:bg-zinc-800 border-2 border-[#141414] dark:border-zinc-600 focus:outline-none"
                  />
                  <span className="text-[10px] text-zinc-500">The HTTP POST endpoint on your server that will receive approved/denied JSON payloads.</span>
                </div>

                <div>
                  <label className="block font-mono text-xs font-bold uppercase mb-1">
                    Developer Contact Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="developer@yourwebsite.com"
                    value={createForm.developerEmail}
                    onChange={(e) => setCreateForm({ ...createForm, developerEmail: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono bg-zinc-50 dark:bg-zinc-800 border-2 border-[#141414] dark:border-zinc-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono text-xs font-bold uppercase mb-1">
                    Optional HMAC Secret Key
                  </label>
                  <input
                    type="text"
                    placeholder="Optional secret for X-Signature-SHA256 verification"
                    value={createForm.secretKey}
                    onChange={(e) => setCreateForm({ ...createForm, secretKey: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono bg-zinc-50 dark:bg-zinc-800 border-2 border-[#141414] dark:border-zinc-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono text-xs font-bold uppercase mb-1">
                    Description / Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Production verification callback for main login system"
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono bg-zinc-50 dark:bg-zinc-800 border-2 border-[#141414] dark:border-zinc-600 focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-zinc-400 font-mono text-xs uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-indigo-600 text-white font-mono text-xs font-bold uppercase hover:bg-indigo-700"
                  >
                    {isSubmitting ? 'Generating...' : 'Create & Issue Token'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Delivery Logs Modal */}
      {activeLogsEndpoint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 border-4 border-[#141414] dark:border-zinc-600 p-6 sm:p-8 max-w-3xl w-full shadow-[-8px_8px_0px_0px_rgba(20,20,20,1)] dark:shadow-[-8px_8px_0px_0px_rgba(255,255,255,0.15)] max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#141414] dark:border-zinc-700">
              <div>
                <h3 className="font-mono text-lg font-bold uppercase">
                  Delivery Logs: {activeLogsEndpoint.name}
                </h3>
                <p className="text-xs text-zinc-500">
                  Target Webhook: {activeLogsEndpoint.webhookUrl}
                </p>
              </div>
              <button
                onClick={() => setActiveLogsEndpoint(null)}
                className="font-mono text-sm text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto mt-4 space-y-3">
              {loadingLogs ? (
                <div className="py-12 text-center font-mono text-xs text-zinc-500">
                  Loading delivery attempts...
                </div>
              ) : logsList.length === 0 ? (
                <div className="py-12 text-center font-mono text-xs text-zinc-500 border border-dashed border-zinc-300 dark:border-zinc-700">
                  No webhook delivery attempts recorded yet for this endpoint.
                </div>
              ) : (
                logsList.map((log) => (
                  <div 
                    key={log._id}
                    className="p-3 border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 font-mono text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase ${
                          log.status === 'approved' 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}>
                          {log.status}
                        </span>
                        <span className="font-bold">{log.email}</span>
                        {log.userId && <span className="text-zinc-500">({log.userId})</span>}
                      </div>

                      <div className="flex items-center gap-2 text-[11px]">
                        <span className={`font-bold ${log.deliverySuccess ? 'text-emerald-600' : 'text-rose-600'}`}>
                          HTTP {log.httpStatus || 0}
                        </span>
                        <span className="text-zinc-400">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <pre className="p-2 bg-zinc-900 text-emerald-300 text-[10px] overflow-x-auto">
                      {JSON.stringify(log.payloadSent, null, 2)}
                    </pre>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-700 flex justify-end">
              <button
                onClick={() => setActiveLogsEndpoint(null)}
                className="px-4 py-2 bg-zinc-800 text-white font-mono text-xs uppercase"
              >
                Close Logs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
