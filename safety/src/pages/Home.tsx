import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  AlertCircle, 
  UserX, 
  BarChart3, 
  Globe, 
  Code2, 
  Key, 
  ArrowRight,
  Bot,
  ListFilter,
  RefreshCw,
  Eye,
  ShieldCheck,
  Cpu,
  Layers,
  FileCheck,
  CheckCircle2,
  Sparkles,
  Zap,
  Lock,
  UserCheck,
  Building2,
  Server,
  Award
} from 'lucide-react';
import ApiKeyApplication from '../components/ApiKeyApplication';
import { Link } from 'react-router-dom';

export default function Home() {
  const [stats, setStats] = useState({ userCount: 0, banCount: 0, guildCount: 0 });
  const [devTab, setDevTab] = useState<'info' | 'apply'>('info');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/public/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (e) {}
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const formatCount = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return num.toString();
  };

  return (
    <div className="space-y-24">
      {/* Hero */}
      <section className="text-center space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block border border-[#141414] dark:border-zinc-700 px-4 py-1 font-mono text-[10px] uppercase tracking-[0.3em] text-[#141414] dark:text-zinc-300 bg-white/40 dark:bg-zinc-900/40"
        >
          Protocol: Global Safety Network
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tighter uppercase leading-tight text-[#141414] dark:text-white"
        >
          Protecting <br /> The Online <br /> <span className="text-blue-600 dark:text-blue-400">Community</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-2xl mx-auto text-base sm:text-lg opacity-70 px-4 text-zinc-700 dark:text-zinc-300"
        >
          A unified moderation and safety platform designed to protect Discord servers 
          and VRChat groups from bad actors, exploiters, and harassment.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap justify-center gap-4 pt-4 px-4"
        >
          <a 
            href="https://discord.com/oauth2/authorize?client_id=1480627580636893356"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#141414] dark:bg-zinc-100 text-[#E4E3E0] dark:text-zinc-950 px-8 py-4 font-mono text-sm uppercase tracking-widest hover:opacity-90 transition-opacity flex items-center justify-center font-bold"
          >
            Add to Discord
          </a>
          <div className="flex flex-col gap-2">
            <a 
              href="https://pay.sumup.com/b2c/Q2MI9HNJ" 
              target="_blank" 
              rel="noopener noreferrer"
              className="border-2 border-[#141414] dark:border-zinc-700 px-8 py-4 font-mono text-sm uppercase tracking-widest hover:bg-[#141414] hover:text-[#E4E3E0] dark:hover:bg-zinc-800 dark:hover:text-white transition-all flex items-center gap-2 text-[#141414] dark:text-zinc-200 font-bold"
            >
              Support Our Work
            </a>
            <span className="text-[10px] font-mono opacity-50 uppercase tracking-widest text-zinc-500 dark:text-zinc-400">PayPal: ossscott40@gmail.com</span>
          </div>
          <Link 
            to="/report" 
            className="bg-red-600 text-white px-8 py-4 font-mono text-sm uppercase tracking-widest hover:bg-black dark:hover:bg-red-700 transition-colors flex items-center gap-2 shadow-[-4px_4px_0px_0px_rgba(20,20,20,1)] dark:shadow-[-4px_4px_0px_0px_rgba(0,0,0,0.5)] hover:shadow-none font-bold"
          >
            <AlertCircle className="w-5 h-5" />
            Report a User
          </Link>
          <Link 
            to="/communities" 
            className="bg-white dark:bg-zinc-900 text-[#141414] dark:text-zinc-100 border-2 border-[#141414] dark:border-zinc-700 px-6 py-4 font-mono text-sm uppercase tracking-widest hover:bg-[#141414] hover:text-white dark:hover:bg-zinc-800 transition-all flex items-center gap-2 shadow-[-4px_4px_0px_0px_rgba(20,20,20,1)] dark:shadow-[-4px_4px_0px_0px_rgba(0,0,0,0.5)] hover:shadow-none font-bold"
          >
            <Server className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Protected Communities & Bots
          </Link>
          <Link 
            to="/trusted" 
            className="bg-amber-100 dark:bg-amber-950/60 text-amber-950 dark:text-amber-200 border-2 border-amber-500 dark:border-amber-700 px-6 py-4 font-mono text-sm uppercase tracking-widest hover:bg-amber-500 hover:text-black dark:hover:bg-amber-700 dark:hover:text-white transition-all flex items-center gap-2 shadow-[-4px_4px_0px_0px_rgba(20,20,20,1)] dark:shadow-[-4px_4px_0px_0px_rgba(0,0,0,0.5)] hover:shadow-none font-bold"
          >
            <Building2 className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            Trusted By Partners
          </Link>
        </motion.div>
      </section>
 
      {/* Stats / Info */}
      <section className="border border-[#141414] dark:border-zinc-700 p-6 sm:p-12 grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 text-center bg-white dark:bg-zinc-900 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] dark:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)] text-[#141414] dark:text-zinc-100">
        <div className="space-y-2">
          <span className="font-mono text-4xl sm:text-5xl font-bold">{formatCount(stats.userCount)}</span>
          <p className="font-mono text-xs uppercase tracking-widest opacity-50">Users Protected</p>
        </div>
        <div className="space-y-2">
          <span className="font-mono text-4xl sm:text-5xl font-bold">{formatCount(stats.banCount)}</span>
          <p className="font-mono text-xs uppercase tracking-widest opacity-50">Global Bans</p>
        </div>
        <div className="space-y-2">
          <span className="font-mono text-4xl sm:text-5xl font-bold">{formatCount(stats.guildCount)}</span>
          <p className="font-mono text-xs uppercase tracking-widest opacity-50">Servers Protected</p>
        </div>
      </section>

      {/* Primary Features Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-[#141414] dark:bg-zinc-700 border border-[#141414] dark:border-zinc-700">
        <FeatureCard 
          icon={<Globe className="w-6 h-6" />}
          title="Global Banlist"
          description="Instant protection everywhere. Real-time synchronization across all participating Discord servers and VRChat Groups."
        />
        <FeatureCard 
          icon={<BarChart3 className="w-6 h-6" />}
          title="Reputation System"
          description="Clear trust and reputation scoring based on community history, verified reports, and moderation actions."
        />
        <FeatureCard 
          icon={<AlertCircle className="w-6 h-6" />}
          title="Auto-Moderation"
          description="Automatic ban enforcement and moderator alerts configured to your community safety requirements."
        />
        <FeatureCard 
          icon={<UserX className="w-6 h-6" />}
          title="Age Verification"
          description="Secure ID and live selfie verification portal with full privacy to ensure verified adult-only access."
        />
      </section>

      {/* New Platform Capabilities Showcase */}
      <section className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b-4 border-[#141414] dark:border-zinc-700 pb-4 gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-3 py-1 font-mono text-[10px] uppercase tracking-widest font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              Platform Features
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold uppercase tracking-tighter text-[#141414] dark:text-white">Community Safety Tools</h2>
          </div>
          <p className="font-mono text-xs opacity-60 text-zinc-600 dark:text-zinc-400 max-w-md">
            Modern community defense tools: custom bot client isolation, multi-platform banlist linking, and automated unban synchronization.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Custom Discord Bot Client */}
          <div className="border-2 border-[#141414] dark:border-zinc-700 p-8 space-y-4 bg-white dark:bg-zinc-900 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] dark:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.5)] hover:translate-x-1 hover:-translate-y-1 transition-all">
            <div className="w-12 h-12 bg-blue-600 text-white flex items-center justify-center font-bold">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold uppercase tracking-tight text-[#141414] dark:text-white">Custom Discord Bot Client</h3>
            <p className="font-mono text-xs opacity-70 text-zinc-700 dark:text-zinc-300 leading-relaxed">
              Connect your server with your own custom Discord bot token. Manage status (Online, Idle, DND, Invisible), activity types (Playing, Streaming, Listening, Watching), and custom status text with zero server setup required.
            </p>
            <div className="pt-2 border-t border-gray-100 dark:border-zinc-800 font-mono text-[10px] text-blue-600 dark:text-blue-400 uppercase font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Custom Branding & Slash Commands
            </div>
          </div>

          {/* Custom Banlists & ID Linking */}
          <div className="border-2 border-[#141414] dark:border-zinc-700 p-8 space-y-4 bg-white dark:bg-zinc-900 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] dark:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.5)] hover:translate-x-1 hover:-translate-y-1 transition-all">
            <div className="w-12 h-12 bg-purple-600 text-white flex items-center justify-center font-bold">
              <ListFilter className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold uppercase tracking-tight text-[#141414] dark:text-white">Custom Banlists & ID Linking</h3>
            <p className="font-mono text-xs opacity-70 text-zinc-700 dark:text-zinc-300 leading-relaxed">
              Create independent or shared custom banlists for Discord users and VRChat accounts. Link your Custom Banlist to your server and choose your enforcement mode: Global Only, Custom Only, or Both.
            </p>
            <div className="pt-2 border-t border-gray-100 dark:border-zinc-800 font-mono text-[10px] text-purple-600 dark:text-purple-400 uppercase font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Flexible Mode Selection
            </div>
          </div>

          {/* Bi-Directional Auto-Unban Sync */}
          <div className="border-2 border-[#141414] dark:border-zinc-700 p-8 space-y-4 bg-white dark:bg-zinc-900 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] dark:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.5)] hover:translate-x-1 hover:-translate-y-1 transition-all">
            <div className="w-12 h-12 bg-green-600 text-white flex items-center justify-center font-bold">
              <RefreshCw className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold uppercase tracking-tight text-[#141414] dark:text-white">Automated Unban Pipeline</h3>
            <p className="font-mono text-xs opacity-70 text-zinc-700 dark:text-zinc-300 leading-relaxed">
              Keep bans in sync. When a global ban is lifted or a user appeal is approved by moderators, the system automatically unbans the user across all configured Discord servers and connected VRChat groups.
            </p>
            <div className="pt-2 border-t border-gray-100 dark:border-zinc-800 font-mono text-[10px] text-green-600 dark:text-green-400 uppercase font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Discord & VRChat Dual Unban
            </div>
          </div>

          {/* VRChat Multi-Bot & 2FA Automation */}
          <div className="border-2 border-[#141414] dark:border-zinc-700 p-8 space-y-4 bg-white dark:bg-zinc-900 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] dark:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.5)] hover:translate-x-1 hover:-translate-y-1 transition-all">
            <div className="w-12 h-12 bg-orange-600 text-white flex items-center justify-center font-bold">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold uppercase tracking-tight text-[#141414] dark:text-white">VRChat 2FA Bot Integration</h3>
            <p className="font-mono text-xs opacity-70 text-zinc-700 dark:text-zinc-300 leading-relaxed">
              Automated VRChat group member verification and group ban enforcement. Supports two-factor authentication (TOTP), moderator alerts, and rate-limited API protection.
            </p>
            <div className="pt-2 border-t border-gray-100 dark:border-zinc-800 font-mono text-[10px] text-orange-600 dark:text-orange-400 uppercase font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 2FA TOTP Auto-Auth
            </div>
          </div>

          {/* Clinical Watchlist & Evidence Lockers */}
          <div className="border-2 border-[#141414] dark:border-zinc-700 p-8 space-y-4 bg-white dark:bg-zinc-900 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] dark:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.5)] hover:translate-x-1 hover:-translate-y-1 transition-all">
            <div className="w-12 h-12 bg-red-600 text-white flex items-center justify-center font-bold">
              <FileCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold uppercase tracking-tight text-[#141414] dark:text-white">Community Watchlist & Evidence</h3>
            <p className="font-mono text-xs opacity-70 text-zinc-700 dark:text-zinc-300 leading-relaxed">
              Keep records of suspicious accounts before issues escalate. Attach multiple evidence files, screenshots, and internal moderator notes with clear status ratings.
            </p>
            <div className="pt-2 border-t border-gray-100 dark:border-zinc-800 font-mono text-[10px] text-red-600 dark:text-red-400 uppercase font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Trust Index Classification
            </div>
          </div>

          {/* Age Verification & Role Distribution */}
          <div className="border-2 border-[#141414] dark:border-zinc-700 p-8 space-y-4 bg-white dark:bg-zinc-900 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] dark:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.5)] hover:translate-x-1 hover:-translate-y-1 transition-all">
            <div className="w-12 h-12 bg-[#141414] dark:bg-zinc-800 text-white flex items-center justify-center font-bold">
              <UserCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold uppercase tracking-tight text-[#141414] dark:text-white">Manual Age Verification</h3>
            <p className="font-mono text-xs opacity-70 text-zinc-700 dark:text-zinc-300 leading-relaxed">
              Give 18+ roles safely with encrypted photo ID and live selfie verification. Reviews are handled manually by administrators, ensuring privacy and preventing leaks.
            </p>
            <div className="pt-2 border-t border-gray-100 dark:border-zinc-800 font-mono text-[10px] text-zinc-800 dark:text-zinc-300 uppercase font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Instant Privacy-Preserving Deletion
            </div>
          </div>
        </div>
      </section>

      {/* Protected Communities, Bots & Trusted Partners Showcase */}
      <section className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b-4 border-[#141414] dark:border-zinc-700 pb-4 gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-amber-500 text-black px-3 py-1 font-mono text-[10px] uppercase tracking-widest font-black">
              <Award className="w-3.5 h-3.5" />
              Ecosystem & Partners
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold uppercase tracking-tighter text-[#141414] dark:text-white">
              Protected Communities & Trusted Companies
            </h2>
          </div>
          <p className="font-mono text-xs opacity-60 text-zinc-600 dark:text-zinc-400 max-w-md">
            Explore verified Discord servers, VRChat groups, certified API partner bots, and industry organizations defended by BeSafe.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1: Protected Communities & API Bots */}
          <div className="border-4 border-[#141414] dark:border-zinc-700 p-8 sm:p-10 space-y-6 bg-white dark:bg-zinc-900 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] dark:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)] hover:translate-x-1 hover:-translate-y-1 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-blue-600 text-white flex items-center justify-center font-bold shadow">
                  <Server className="w-6 h-6" />
                </div>
                <span className="bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-200 border border-blue-300 dark:border-blue-800 px-2.5 py-1 font-mono text-[10px] uppercase font-bold rounded">
                  Live Directory
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#141414] dark:text-white">
                Protected Communities & API Partner Bots
              </h3>

              <p className="font-mono text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                Over 150+ Discord servers and VRChat groups synchronize ban enforcement through BeSafe. Discover certified bots using the BeSafe API. Server and group owners can toggle their community listing directly in the Dashboard.
              </p>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-2.5 rounded font-mono text-[10px]">
                  <span className="block text-zinc-400 dark:text-zinc-500 uppercase">Communities</span>
                  <strong className="text-zinc-800 dark:text-zinc-100 text-sm">Discord & VRChat</strong>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-2.5 rounded font-mono text-[10px]">
                  <span className="block text-zinc-400 dark:text-zinc-500 uppercase">API Bots</span>
                  <strong className="text-purple-700 dark:text-purple-400 text-sm">Admin Certified</strong>
                </div>
              </div>
            </div>

            <Link
              to="/communities"
              className="w-full bg-[#141414] dark:bg-zinc-800 hover:bg-blue-600 dark:hover:bg-blue-600 text-white py-3.5 px-6 font-mono text-xs font-bold uppercase tracking-widest text-center transition-colors flex items-center justify-center gap-2 shadow"
            >
              <span>Explore Protected Communities & Bots</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Card 2: Trusted By Industry Partners */}
          <div className="border-4 border-[#141414] dark:border-zinc-700 p-8 sm:p-10 space-y-6 bg-white dark:bg-zinc-900 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] dark:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)] hover:translate-x-1 hover:-translate-y-1 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-amber-500 text-black flex items-center justify-center font-bold shadow">
                  <Building2 className="w-6 h-6" />
                </div>
                <span className="bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 px-2.5 py-1 font-mono text-[10px] uppercase font-bold rounded">
                  Enterprise Partners
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#141414] dark:text-white">
                Trusted By Companies & Gaming Platforms
              </h3>

              <p className="font-mono text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                From virtual reality event organizers like VRChat Event Hub to cybersecurity firms like Aegis Cyber Defense, premier studios and companies trust BeSafe services for synchronized user safety, age verification, and threat telemetry.
              </p>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-2.5 rounded font-mono text-[10px]">
                  <span className="block text-zinc-400 dark:text-zinc-500 uppercase">Partner Studios</span>
                  <strong className="text-zinc-800 dark:text-zinc-100 text-sm">Gaming & VR</strong>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-2.5 rounded font-mono text-[10px]">
                  <span className="block text-zinc-400 dark:text-zinc-500 uppercase">Website Links</span>
                  <strong className="text-amber-700 dark:text-amber-400 text-sm">Verified Directory</strong>
                </div>
              </div>
            </div>

            <Link
              to="/trusted"
              className="w-full bg-[#141414] dark:bg-zinc-800 hover:bg-amber-500 hover:text-black dark:hover:bg-amber-600 dark:hover:text-black text-white py-3.5 px-6 font-mono text-xs font-bold uppercase tracking-widest text-center transition-colors flex items-center justify-center gap-2 shadow"
            >
              <span>View Trusted Companies Directory</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Developer Portal Section */}
      <section className="space-y-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-4 border-[#141414] dark:border-zinc-700 pb-4 gap-4">
          <div className="flex items-center gap-4 text-[#141414] dark:text-white">
            <Code2 className="w-8 sm:w-10 h-8 sm:h-10" />
            <h2 className="text-3xl sm:text-5xl font-bold uppercase tracking-tighter">Developer Portal</h2>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setDevTab('info')}
              className={`px-6 py-2 font-mono text-xs uppercase tracking-widest border-2 border-[#141414] dark:border-zinc-700 transition-all font-bold ${devTab === 'info' ? 'bg-[#141414] dark:bg-zinc-100 text-[#E4E3E0] dark:text-zinc-950' : 'bg-white dark:bg-zinc-900 text-[#141414] dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
            >
              Info
            </button>
            <button 
              onClick={() => setDevTab('apply')}
              className={`px-6 py-2 font-mono text-xs uppercase tracking-widest border-2 border-[#141414] dark:border-zinc-700 transition-all font-bold ${devTab === 'apply' ? 'bg-[#141414] dark:bg-zinc-100 text-[#E4E3E0] dark:text-zinc-950' : 'bg-white dark:bg-zinc-900 text-[#141414] dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
            >
              Apply
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {devTab === 'info' ? (
            <motion.div 
              key="info"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-12"
            >
              <div className="space-y-6">
                <h3 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-[#141414] dark:text-white">Protect your community with shared safety data.</h3>
                <p className="font-mono text-sm opacity-70 text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  Our Developer API allows you to integrate BeSafe directly into your Discord bot or web application. With an API key, you can query reputation data, report malicious accounts, and verify users programmatically.
                </p>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-mono text-[10px] uppercase font-bold">
                    <div className="w-2 h-2 bg-blue-600 rounded-full" />
                    Read-Only (Public)
                  </div>
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-mono text-[10px] uppercase font-bold">
                    <div className="w-2 h-2 bg-red-600 rounded-full" />
                    Full Access (Private)
                  </div>
                </div>
              </div>
              <div className="border-4 border-[#141414] dark:border-zinc-700 p-8 space-y-6 bg-white dark:bg-zinc-900 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] dark:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.5)]">
                <Key className="w-8 h-8 opacity-20 text-indigo-600 dark:text-indigo-400" />
                <h4 className="text-xl font-bold uppercase tracking-tight text-[#141414] dark:text-white">API Key Requirements</h4>
                <ul className="font-mono text-xs space-y-3 opacity-70 text-zinc-700 dark:text-zinc-300 list-disc pl-4">
                  <li>Verified Bot Identity</li>
                  <li>Clear Integration Purpose</li>
                  <li>Adherence to Privacy Guidelines</li>
                  <li>Manual Staff Review</li>
                </ul>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="apply"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <ApiKeyApplication />
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-[#E4E3E0] dark:bg-zinc-900 p-8 space-y-4 hover:bg-[#141414] dark:hover:bg-zinc-800 text-[#141414] dark:text-zinc-100 hover:text-[#E4E3E0] dark:hover:text-white transition-colors group cursor-default">
      <div className="opacity-50 group-hover:opacity-100 transition-opacity">{icon}</div>
      <h3 className="font-mono font-bold uppercase tracking-tight text-xl">{title}</h3>
      <p className="text-sm opacity-70 group-hover:opacity-90 leading-relaxed">{description}</p>
    </div>
  );
}
