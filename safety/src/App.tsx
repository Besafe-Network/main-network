/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  Shield, 
  Search, 
  MessageSquare, 
  LayoutDashboard, 
  AlertTriangle, 
  UserCheck, 
  BookOpen, 
  ScrollText, 
  ShieldAlert, 
  Megaphone, 
  Sun, 
  Moon,
  Menu,
  X,
  FileWarning,
  Code2,
  Building2,
  Server,
  Key
} from 'lucide-react';
import Home from './pages/Home';
import Check from './pages/Check';
import Appeal from './pages/Appeal';
import AppealReply from './pages/AppealReply';
import ReportReply from './pages/ReportReply';
import Dashboard from './pages/Dashboard';
import Verification from './pages/Verification';
import APIDocs from './pages/APIDocs';
import DeveloperPortal from './pages/DeveloperPortal';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import Instructions from './pages/Instructions';
import StaffTraining from './pages/StaffTraining';
import DangerousPeople from './pages/DangerousPeople';
import ProtectedNetwork from './pages/ProtectedNetwork';
import TrustedBy from './pages/TrustedBy';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import SubmitReport from './pages/SubmitReport';
import VRChatBroadcast from './pages/VRChatBroadcast';
import ApiKeyApplication from './components/ApiKeyApplication';
import { ThemeProvider, useTheme } from './context/ThemeContext';

function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label="Toggle dark/light theme"
      title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
      className="flex items-center gap-2 px-3 py-1.5 border-2 border-[#141414] dark:border-zinc-500 bg-white dark:bg-zinc-800 text-[#141414] dark:text-[#E4E3E0] font-mono text-[10px] font-bold uppercase tracking-widest shadow-[-2px_2px_0px_0px_rgba(20,20,20,1)] dark:shadow-[-2px_2px_0px_0px_rgba(255,255,255,0.2)] hover:opacity-80 transition-all cursor-pointer"
    >
      {theme === 'dark' ? (
        <>
          <Sun className="w-3.5 h-3.5 text-amber-400" />
          <span>Light Mode</span>
        </>
      ) : (
        <>
          <Moon className="w-3.5 h-3.5 text-indigo-600" />
          <span>Dark Mode</span>
        </>
      )}
    </button>
  );
}

function MainLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-[#E4E3E0] dark:bg-[#121212] text-[#141414] dark:text-[#E4E3E0] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      {/* Navigation */}
      <nav className="border-b border-[#141414] dark:border-[#3F3F46] px-4 sm:px-6 py-3.5 flex items-center justify-between bg-[#E4E3E0] dark:bg-[#121212] sticky top-0 z-50">
        <Link to="/" onClick={closeMenu} className="flex items-center gap-2 group">
          <Shield className="w-6 h-6 group-hover:rotate-12 transition-transform text-indigo-600 dark:text-indigo-400" />
          <span className="font-mono font-bold text-base sm:text-lg tracking-tighter uppercase">BeSafe Network</span>
        </Link>
        
        {/* Desktop Navigation Links */}
        <div className="hidden lg:flex items-center gap-6">
          <Link to="/instructions" className="flex items-center gap-1.5 hover:opacity-70 transition-opacity">
            <ScrollText className="w-4 h-4" />
            <span className="font-mono text-[11px] uppercase tracking-wider">Guide</span>
          </Link>
          <Link to="/developers" className="flex items-center gap-1.5 hover:opacity-70 transition-opacity text-indigo-600 dark:text-indigo-400 font-bold">
            <Code2 className="w-4 h-4" />
            <span className="font-mono text-[11px] uppercase tracking-wider">Dev Portal</span>
          </Link>
          <Link to="/request-api-key" className="flex items-center gap-1.5 hover:opacity-70 transition-opacity text-amber-600 dark:text-amber-400 font-bold">
            <Key className="w-4 h-4" />
            <span className="font-mono text-[11px] uppercase tracking-wider">Request API Key</span>
          </Link>
          <Link to="/docs" className="flex items-center gap-1.5 hover:opacity-70 transition-opacity">
            <BookOpen className="w-4 h-4" />
            <span className="font-mono text-[11px] uppercase tracking-wider">API Docs</span>
          </Link>
          <Link to="/communities" className="flex items-center gap-1.5 hover:opacity-70 transition-opacity">
            <Server className="w-4 h-4 text-blue-500" />
            <span className="font-mono text-[11px] uppercase tracking-wider">Communities</span>
          </Link>
          <Link to="/trusted" className="flex items-center gap-1.5 hover:opacity-70 transition-opacity">
            <Building2 className="w-4 h-4 text-amber-500" />
            <span className="font-mono text-[11px] uppercase tracking-wider">Trusted By</span>
          </Link>
          <Link to="/check" className="flex items-center gap-1.5 hover:opacity-70 transition-opacity">
            <Search className="w-4 h-4" />
            <span className="font-mono text-[11px] uppercase tracking-wider">Check User</span>
          </Link>
          <Link to="/appeal" className="flex items-center gap-1.5 hover:opacity-70 transition-opacity">
            <MessageSquare className="w-4 h-4" />
            <span className="font-mono text-[11px] uppercase tracking-wider">Submit Appeal</span>
          </Link>
          <Link to="/watchlist" className="flex items-center gap-1.5 hover:opacity-70 transition-opacity">
            <ShieldAlert className="w-4 h-4 text-red-600 animate-pulse" />
            <span className="font-mono text-[11px] uppercase tracking-wider text-red-600 font-bold">Watchlist</span>
          </Link>
          <Link to="/report" className="flex items-center gap-1.5 hover:opacity-70 transition-opacity">
            <FileWarning className="w-4 h-4 text-amber-500" />
            <span className="font-mono text-[11px] uppercase tracking-wider text-amber-600 dark:text-amber-400">Report</span>
          </Link>
          <Link to="/dashboard" className="flex items-center gap-1.5 hover:opacity-70 transition-opacity">
            <LayoutDashboard className="w-4 h-4" />
            <span className="font-mono text-[11px] uppercase tracking-wider">Dashboard</span>
          </Link>

          <ThemeToggleButton />
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-3 lg:hidden">
          <ThemeToggleButton />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 border-2 border-[#141414] dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-[#141414] dark:text-white"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b-2 border-[#141414] dark:border-zinc-800 bg-[#E4E3E0] dark:bg-zinc-900 px-4 py-4 space-y-2 sticky top-[57px] z-40 shadow-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Link
              to="/instructions"
              onClick={closeMenu}
              className="flex items-center gap-2 p-3 rounded-lg border border-[#141414]/20 dark:border-zinc-700 bg-white/60 dark:bg-zinc-800/60 font-mono text-xs uppercase tracking-wider"
            >
              <ScrollText className="w-4 h-4 text-blue-500" />
              <span>Guide & Instructions</span>
            </Link>
            <Link
              to="/docs"
              onClick={closeMenu}
              className="flex items-center gap-2 p-3 rounded-lg border border-[#141414]/20 dark:border-zinc-700 bg-white/60 dark:bg-zinc-800/60 font-mono text-xs uppercase tracking-wider"
            >
              <BookOpen className="w-4 h-4 text-emerald-500" />
              <span>API Documentation</span>
            </Link>
            <Link
              to="/developers"
              onClick={closeMenu}
              className="flex items-center gap-2 p-3 rounded-lg border border-indigo-500/30 bg-indigo-500/10 font-mono text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-bold"
            >
              <Code2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Enterprise Dev Portal</span>
            </Link>
            <Link
              to="/request-api-key"
              onClick={closeMenu}
              className="flex items-center gap-2 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 font-mono text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold"
            >
              <Key className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Request Developer API Key</span>
            </Link>
            <Link
              to="/check"
              onClick={closeMenu}
              className="flex items-center gap-2 p-3 rounded-lg border border-[#141414]/20 dark:border-zinc-700 bg-white/60 dark:bg-zinc-800/60 font-mono text-xs uppercase tracking-wider"
            >
              <Search className="w-4 h-4 text-violet-500" />
              <span>Check User Status</span>
            </Link>
            <Link
              to="/appeal"
              onClick={closeMenu}
              className="flex items-center gap-2 p-3 rounded-lg border border-[#141414]/20 dark:border-zinc-700 bg-white/60 dark:bg-zinc-800/60 font-mono text-xs uppercase tracking-wider"
            >
              <MessageSquare className="w-4 h-4 text-amber-500" />
              <span>Submit Ban Appeal</span>
            </Link>
            <Link
              to="/communities"
              onClick={closeMenu}
              className="flex items-center gap-2 p-3 rounded-lg border border-blue-500/30 bg-blue-500/10 font-mono text-xs uppercase tracking-wider text-blue-600 dark:text-blue-400 font-bold"
            >
              <Server className="w-4 h-4 text-blue-500" />
              <span>Protected Communities & Bots</span>
            </Link>
            <Link
              to="/trusted"
              onClick={closeMenu}
              className="flex items-center gap-2 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 font-mono text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold"
            >
              <Building2 className="w-4 h-4 text-amber-500" />
              <span>Trusted By Companies</span>
            </Link>
            <Link
              to="/watchlist"
              onClick={closeMenu}
              className="flex items-center gap-2 p-3 rounded-lg border border-red-500/30 bg-red-500/10 font-mono text-xs uppercase tracking-wider text-red-600 dark:text-red-400 font-bold"
            >
              <ShieldAlert className="w-4 h-4 text-red-600" />
              <span>Community Watchlist</span>
            </Link>
            <Link
              to="/report"
              onClick={closeMenu}
              className="flex items-center gap-2 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 font-mono text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold"
            >
              <FileWarning className="w-4 h-4 text-amber-600" />
              <span>Report a User</span>
            </Link>
            <Link
              to="/dashboard"
              onClick={closeMenu}
              className="flex items-center gap-2 p-3 rounded-lg border border-indigo-500/30 bg-indigo-500/10 font-mono text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-bold col-span-1 sm:col-span-2"
            >
              <LayoutDashboard className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Dashboard</span>
            </Link>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/check" element={<Check />} />
          <Route path="/check/:id" element={<Check />} />
          <Route path="/appeal" element={<Appeal />} />
          <Route path="/appeal-reply" element={<AppealReply />} />
          <Route path="/appeal-reply/:id" element={<AppealReply />} />
          <Route path="/report-reply" element={<ReportReply />} />
          <Route path="/report-reply/:id" element={<ReportReply />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/verify" element={<Verification />} />
          <Route path="/developers" element={<DeveloperPortal />} />
          <Route path="/devs" element={<DeveloperPortal />} />
          <Route path="/enterprise" element={<DeveloperPortal />} />
          <Route path="/request-api-key" element={<ApiKeyApplication />} />
          <Route path="/apply-api-key" element={<ApiKeyApplication />} />
          <Route path="/api-key" element={<ApiKeyApplication />} />
          <Route path="/docs" element={<APIDocs />} />
          <Route path="/docs/private" element={<APIDocs />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/instructions" element={<Instructions />} />
          <Route path="/staff-training" element={<StaffTraining />} />
          <Route path="/watchlist" element={<DangerousPeople />} />
          <Route path="/watchlist/:id" element={<DangerousPeople />} />
          <Route path="/communities" element={<ProtectedNetwork />} />
          <Route path="/protected" element={<ProtectedNetwork />} />
          <Route path="/network" element={<ProtectedNetwork />} />
          <Route path="/trusted" element={<TrustedBy />} />
          <Route path="/trusted-by" element={<TrustedBy />} />
          <Route path="/admin/vrchat-broadcast" element={<VRChatBroadcast />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/report" element={<SubmitReport />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#141414] dark:border-[#27272A] mt-24 px-6 py-12 bg-[#141414] dark:bg-[#0A0A0A] text-[#E4E3E0]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <h3 className="font-mono text-xs uppercase tracking-[0.2em] mb-6 opacity-50">System Status</h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="font-mono text-sm">Global Network Active</span>
            </div>
          </div>
          <div>
            <h3 className="font-mono text-xs uppercase tracking-[0.2em] mb-6 opacity-50">Documentation & Legal</h3>
            <div className="flex flex-col gap-2">
              <Link to="/communities" className="text-sm text-blue-400 font-bold hover:opacity-100 transition-opacity">Protected Communities & Bots</Link>
              <Link to="/trusted" className="text-sm text-amber-400 font-bold hover:opacity-100 transition-opacity">Trusted By Industry Partners</Link>
              <Link to="/instructions" className="text-sm opacity-70 hover:opacity-100 transition-opacity">Server Owner Guide</Link>
              <Link to="/request-api-key" className="text-sm text-amber-400 font-bold hover:opacity-100 transition-opacity">Request Developer API Key</Link>
              <Link to="/developers" className="text-sm text-indigo-400 font-bold hover:opacity-100 transition-opacity">Enterprise Dev Portal (API)</Link>
              <Link to="/staff-training" className="text-sm text-amber-400 font-bold hover:opacity-100 transition-opacity">Staff Training & SOP</Link>
              <Link to="/terms" className="text-sm opacity-70 hover:opacity-100 transition-opacity">Terms of Service</Link>
              <Link to="/privacy" className="text-sm opacity-70 hover:opacity-100 transition-opacity">Privacy Policy</Link>
            </div>
          </div>
          <div>
            <h3 className="font-mono text-xs uppercase tracking-[0.2em] mb-6 opacity-50">Bot Installation</h3>
            <a 
              href="https://discord.com/oauth2/authorize?client_id=1480627580636893356"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-[#E4E3E0] px-4 py-2 font-mono text-xs uppercase tracking-widest hover:bg-[#E4E3E0] hover:text-[#141414] transition-colors inline-block"
            >
              Add to Discord
            </a>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-12 border-t border-[#E4E3E0]/10 flex justify-between items-center">
          <span className="font-mono text-[10px] opacity-30 uppercase tracking-widest">© 2026 BeSafe Network</span>
          <span className="font-mono text-[10px] opacity-30 uppercase tracking-widest">v1.0.4-stable</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <MainLayout />
      </Router>
    </ThemeProvider>
  );
}
