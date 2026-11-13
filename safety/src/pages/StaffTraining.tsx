import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  ListFilter, 
  ChevronRight, 
  Lock, 
  Scale, 
  CheckSquare, 
  CheckCircle2, 
  AlertOctagon, 
  AlertTriangle, 
  Cpu, 
  Bot, 
  Key, 
  Server, 
  Award,
  ShieldAlert,
  Eye,
  FileText,
  BookOpen
} from 'lucide-react';

export default function StaffTraining() {
  return (
    <div className="max-w-5xl mx-auto space-y-12 mb-24">
      {/* Header */}
      <header className="space-y-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 border border-amber-400 text-amber-900 font-mono text-xs uppercase tracking-widest font-bold">
          <Eye className="w-3.5 h-3.5 text-amber-700" />
          Public Transparency Directive
        </div>
        <h1 className="text-5xl md:text-7xl font-bold uppercase tracking-tighter leading-none mb-4">
          Staff Training & SOP
        </h1>
        <p className="font-mono text-xs uppercase tracking-[0.3em] opacity-60 max-w-2xl mx-auto">
          Official Operational Standards & Moderator Guidelines • Published Publicly for Network Transparency
        </p>

        {/* Quick link banner */}
        <div className="pt-4 flex justify-center">
          <Link
            to="/instructions"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-[#141414] font-mono text-xs uppercase font-bold hover:bg-gray-100 shadow-[3px_3px_0px_0px_rgba(20,20,20,1)] active:shadow-none transition-all"
          >
            <BookOpen className="w-4 h-4 text-blue-600" />
            Switch to Server Owner & User Guide →
          </Link>
        </div>
      </header>

      {/* STAFF TRAINING & INSTRUCTION CONTENT */}
      <div className="space-y-16">
        {/* Banner */}
        <div className="bg-[#141414] text-[#E4E3E0] p-8 md:p-12 border-2 border-[#141414] relative overflow-hidden shadow-[8px_8px_0px_0px_rgba(180,83,9,1)]">
          <ShieldAlert className="absolute -bottom-10 -right-10 w-64 h-64 text-amber-500/10 rotate-12" />
          <div className="relative z-10 space-y-4 max-w-3xl">
            <div className="flex items-center gap-3">
              <span className="bg-amber-500 text-[#141414] font-mono text-[10px] uppercase font-bold px-2 py-0.5 tracking-widest">
                OFFICIAL INTERNAL DIRECTIVE
              </span>
              <span className="font-mono text-xs text-amber-400/80">PUBLIC STAFF MANUAL</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold uppercase tracking-tight text-white">
              Safety Moderator & Administrator SOP
            </h2>
            <p className="font-mono text-xs opacity-80 leading-relaxed">
              This document defines mandatory operating protocols, evidence standards, case management workflows, and ethical requirements for all Be Safe Network moderators and system administrators.
            </p>
          </div>
        </div>

        {/* Table of Contents */}
        <div className="border-2 border-[#141414] dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 md:p-8 space-y-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.05)]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#141414] dark:border-zinc-700 pb-3">
            <h3 className="text-lg font-bold uppercase tracking-tight flex items-center gap-2 text-zinc-900 dark:text-white">
              <ListFilter className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              Staff Manual Table of Contents
            </h3>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  document.getElementById(e.target.value)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              defaultValue=""
              className="bg-zinc-50 dark:bg-zinc-800 border-2 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white rounded px-3 py-1.5 font-mono text-xs font-bold uppercase cursor-pointer focus:outline-none focus:border-[#141414]"
            >
              <option value="" disabled>-- Jump to Section --</option>
              <option value="sop-ethics">01. Ethics & Code of Conduct</option>
              <option value="sop-roles">02. Hierarchy & Permissions</option>
              <option value="sop-reports">03. Incident Report Review SOP</option>
              <option value="sop-appeals">04. Appeals & Dispute Resolution</option>
              <option value="sop-age">05. Age Verification & Data Privacy</option>
              <option value="sop-watchlist">06. Watchlist & Trust Index SOP</option>
              <option value="sop-vrchat">07. VRChat & Custom Bot Operations</option>
              <option value="sop-api">08. API Key & Server Governance</option>
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
            <button 
              type="button" 
              onClick={() => document.getElementById('sop-ethics')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="p-2 border border-gray-200 dark:border-zinc-700 hover:border-[#141414] dark:hover:border-zinc-500 hover:bg-amber-50 dark:hover:bg-zinc-800 flex items-center justify-between group text-left w-full cursor-pointer transition-colors text-zinc-800 dark:text-zinc-200"
            >
              <span>01. Ethics & Code of Conduct</span>
              <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100" />
            </button>
            <button 
              type="button" 
              onClick={() => document.getElementById('sop-roles')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="p-2 border border-gray-200 dark:border-zinc-700 hover:border-[#141414] dark:hover:border-zinc-500 hover:bg-amber-50 dark:hover:bg-zinc-800 flex items-center justify-between group text-left w-full cursor-pointer transition-colors text-zinc-800 dark:text-zinc-200"
            >
              <span>02. Hierarchy & Permissions</span>
              <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100" />
            </button>
            <button 
              type="button" 
              onClick={() => document.getElementById('sop-reports')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="p-2 border border-gray-200 dark:border-zinc-700 hover:border-[#141414] dark:hover:border-zinc-500 hover:bg-amber-50 dark:hover:bg-zinc-800 flex items-center justify-between group text-left w-full cursor-pointer transition-colors text-zinc-800 dark:text-zinc-200"
            >
              <span>03. Incident Report Review SOP</span>
              <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100" />
            </button>
            <button 
              type="button" 
              onClick={() => document.getElementById('sop-appeals')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="p-2 border border-gray-200 dark:border-zinc-700 hover:border-[#141414] dark:hover:border-zinc-500 hover:bg-amber-50 dark:hover:bg-zinc-800 flex items-center justify-between group text-left w-full cursor-pointer transition-colors text-zinc-800 dark:text-zinc-200"
            >
              <span>04. Appeals & Dispute Resolution</span>
              <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100" />
            </button>
            <button 
              type="button" 
              onClick={() => document.getElementById('sop-age')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="p-2 border border-gray-200 dark:border-zinc-700 hover:border-[#141414] dark:hover:border-zinc-500 hover:bg-amber-50 dark:hover:bg-zinc-800 flex items-center justify-between group text-left w-full cursor-pointer transition-colors text-zinc-800 dark:text-zinc-200"
            >
              <span>05. Age Verification & Data Privacy</span>
              <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100" />
            </button>
            <button 
              type="button" 
              onClick={() => document.getElementById('sop-watchlist')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="p-2 border border-gray-200 dark:border-zinc-700 hover:border-[#141414] dark:hover:border-zinc-500 hover:bg-amber-50 dark:hover:bg-zinc-800 flex items-center justify-between group text-left w-full cursor-pointer transition-colors text-zinc-800 dark:text-zinc-200"
            >
              <span>06. Watchlist & Trust Index SOP</span>
              <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100" />
            </button>
            <button 
              type="button" 
              onClick={() => document.getElementById('sop-vrchat')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="p-2 border border-gray-200 dark:border-zinc-700 hover:border-[#141414] dark:hover:border-zinc-500 hover:bg-amber-50 dark:hover:bg-zinc-800 flex items-center justify-between group text-left w-full cursor-pointer transition-colors text-zinc-800 dark:text-zinc-200"
            >
              <span>07. VRChat & Custom Bot Operations</span>
              <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100" />
            </button>
            <button 
              type="button" 
              onClick={() => document.getElementById('sop-api')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="p-2 border border-gray-200 dark:border-zinc-700 hover:border-[#141414] dark:hover:border-zinc-500 hover:bg-amber-50 dark:hover:bg-zinc-800 flex items-center justify-between group text-left w-full cursor-pointer transition-colors text-zinc-800 dark:text-zinc-200"
            >
              <span>08. API Key & Server Governance</span>
              <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100" />
            </button>
          </div>
        </div>

        {/* Section 01: Ethics */}
        <section id="sop-ethics" className="space-y-6 scroll-mt-24">
          <div className="flex items-center gap-4 border-b-2 border-[#141414] dark:border-zinc-700 pb-4">
            <div className="w-10 h-10 bg-[#141414] dark:bg-zinc-800 text-white flex items-center justify-center font-mono font-bold text-lg">
              01
            </div>
            <div>
              <h2 className="text-2xl font-bold uppercase tracking-tight text-zinc-900 dark:text-white">Code of Conduct & Ethical Imperatives</h2>
              <p className="font-mono text-xs text-zinc-600 dark:text-zinc-400">Core tenets governing staff behavior and decision integrity</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border-2 border-[#141414] dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 space-y-3 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.05)]">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold uppercase text-sm">
                <Lock className="w-4 h-4" />
                Absolute Confidentiality
              </div>
              <p className="font-mono text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                Staff must never leak reporter personal information, unredacted ID document details, internal case communications, or draft evidence logs to external parties.
              </p>
            </div>

            <div className="border-2 border-[#141414] dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 space-y-3 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.05)]">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold uppercase text-sm">
                <Scale className="w-4 h-4" />
                Conflict Recusal
              </div>
              <p className="font-mono text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                If a report or appeal involves yourself, a close associate, or an affiliated Discord guild, you MUST unclaim the ticket and defer to a neutral moderator.
              </p>
            </div>

            <div className="border-2 border-[#141414] dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 space-y-3 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.05)]">
              <div className="flex items-center gap-2 text-green-600 dark:text-emerald-400 font-bold uppercase text-sm">
                <ShieldCheck className="w-4 h-4" />
                Trusted Whitelist Rules
              </div>
              <p className="font-mono text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                Users holding <span className="font-bold text-zinc-900 dark:text-white">Trusted Whitelist</span> status are immune to automated threshold bans and custom banlists. Only System Administrators can modify trusted status.
              </p>
            </div>
          </div>
        </section>

        {/* Section 02: Hierarchy */}
        <section id="sop-roles" className="space-y-6 scroll-mt-24">
          <div className="flex items-center gap-4 border-b-2 border-[#141414] dark:border-zinc-700 pb-4">
            <div className="w-10 h-10 bg-[#141414] dark:bg-zinc-800 text-white flex items-center justify-center font-mono font-bold text-lg">
              02
            </div>
            <div>
              <h2 className="text-2xl font-bold uppercase tracking-tight text-zinc-900 dark:text-white">Administrative Hierarchy & Scope</h2>
              <p className="font-mono text-xs text-zinc-600 dark:text-zinc-400">Role matrix and operational authority boundaries</p>
            </div>
          </div>

          <div className="border-2 border-[#141414] dark:border-zinc-700 bg-white dark:bg-zinc-900 p-8 space-y-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.05)]">
            <div className="space-y-4">
              <div className="border-l-4 border-red-600 pl-4 py-2 space-y-1">
                <span className="bg-red-600 text-white px-2 py-0.5 font-mono text-[10px] uppercase font-bold">Tier 3</span>
                <h4 className="font-bold uppercase text-base text-zinc-900 dark:text-white">System Administrator (<code className="text-xs bg-gray-100 dark:bg-zinc-800 px-1">role: 'admin'</code>)</h4>
                <p className="font-mono text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  Full system access. Authorizes API keys, manages staff permissions, configures system-wide VRChat 2FA bot tokens, manages custom banlist overrides, and reviews high-priority watchlist additions.
                </p>
              </div>

              <div className="border-l-4 border-blue-600 pl-4 py-2 space-y-1">
                <span className="bg-blue-600 text-white px-2 py-0.5 font-mono text-[10px] uppercase font-bold">Tier 2</span>
                <h4 className="font-bold uppercase text-base text-zinc-900 dark:text-white">Safety Moderator (<code className="text-xs bg-gray-100 dark:bg-zinc-800 px-1">role: 'moderator'</code>)</h4>
                <p className="font-mono text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  Processes incoming user reports, claims case tickets, evaluates ban appeals, reviews age verification photo requests, and dispatches communication messages to users and reporters.
                </p>
              </div>

              <div className="border-l-4 border-gray-600 pl-4 py-2 space-y-1">
                <span className="bg-gray-600 text-white px-2 py-0.5 font-mono text-[10px] uppercase font-bold">Tier 1</span>
                <h4 className="font-bold uppercase text-base text-zinc-900 dark:text-white">Guild Operator / Server Owner</h4>
                <p className="font-mono text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  External administrators managing individual Discord server nodes. Configures local warning thresholds, sets auto-ban sensitivities, links custom banlists, and sets up custom server bots.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 03: Incident Report Review SOP */}
        <section id="sop-reports" className="space-y-6 scroll-mt-24">
          <div className="flex items-center gap-4 border-b-2 border-[#141414] dark:border-zinc-700 pb-4">
            <div className="w-10 h-10 bg-[#141414] dark:bg-zinc-800 text-white flex items-center justify-center font-mono font-bold text-lg">
              03
            </div>
            <div>
              <h2 className="text-2xl font-bold uppercase tracking-tight text-zinc-900 dark:text-white">Incident Report Processing SOP</h2>
              <p className="font-mono text-xs text-zinc-600 dark:text-zinc-400">Standard Operating Procedure for reviewing user reports</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="border-2 border-[#141414] dark:border-zinc-700 bg-white dark:bg-zinc-900 p-8 space-y-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.05)]">
              <h3 className="text-lg font-bold uppercase tracking-tight flex items-center gap-2 border-b border-gray-200 dark:border-zinc-700 pb-3 text-zinc-900 dark:text-white">
                <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Step-by-Step Report Handling Workflow
              </h3>

              <ol className="space-y-6 font-mono text-xs list-decimal pl-5">
                <li className="space-y-2">
                  <span className="font-bold text-sm uppercase text-zinc-900 dark:text-white">1. Ticket Claiming</span>
                  <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    In the Admin Dashboard under <span className="font-bold">Pending Reports</span>, click <span className="bg-[#141414] dark:bg-zinc-800 text-white px-2 py-0.5 text-[10px] uppercase font-bold">Claim Ticket</span>. This transforms the report into an active case ticket assigned to your username, preventing duplicate moderator actions.
                  </p>
                </li>

                <li className="space-y-2">
                  <span className="font-bold text-sm uppercase text-zinc-900 dark:text-white">2. Evidence Validation Criteria</span>
                  <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    Evaluate submitted evidence links and attachment images against our verification threshold:
                  </p>
                  <div className="bg-gray-50 dark:bg-zinc-800/90 border border-gray-300 dark:border-zinc-700 p-4 space-y-2 text-[11px] rounded">
                    <div className="flex items-center gap-2 text-green-700 dark:text-emerald-400 font-bold">
                      <CheckCircle2 className="w-4 h-4" /> Valid Evidence:
                    </div>
                    <ul className="list-disc pl-5 space-y-1 text-zinc-700 dark:text-zinc-300">
                      <li>Direct Discord message links (<code className="bg-gray-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 px-1">discord.com/channels/...</code>) verifying severe misconduct</li>
                      <li>Unedited full-screen desktop/mobile screenshots displaying Discord User ID snowflakes</li>
                      <li>Video recordings showing active scam, phishing, or grooming attempts</li>
                      <li>VRChat profile links (<code className="bg-gray-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 px-1">usr_...</code>) or avatar/world exploit logs</li>
                    </ul>
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold pt-2">
                      <AlertOctagon className="w-4 h-4" /> Invalid Evidence (Reject/Dismiss):
                    </div>
                    <ul className="list-disc pl-5 space-y-1 text-zinc-700 dark:text-zinc-300">
                      <li>Cropped or blurry screenshots lacking user identity context</li>
                      <li>Edited images showing signs of inspect-element tampering or Photoshop alterations</li>
                      <li>Personal arguments or non-violating game disputes</li>
                    </ul>
                  </div>
                </li>

                <li className="space-y-2">
                  <span className="font-bold text-sm uppercase text-zinc-900 dark:text-white">3. Communicating with Reporter</span>
                  <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    If additional context is needed, use the <span className="font-bold">Send Message</span> utility within the case ticket. This dispatches an automated notification email or Discord DM to the reporter with a secure reply terminal link.
                  </p>
                </li>

                <li className="space-y-2">
                  <span className="font-bold text-sm uppercase text-zinc-900 dark:text-white">4. Action Execution</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="border border-red-600 bg-red-50 dark:bg-red-950/80 p-4 space-y-2 rounded">
                      <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 uppercase">Option A: Global Ban</span>
                      <p className="text-[11px] leading-relaxed text-red-950 dark:text-red-200">
                        Click <span className="font-bold text-red-700 dark:text-red-300">Approve & Issue Global Ban</span>. This automatically bans the target across all connected Discord servers, syncs with VRChat groups, adds the evidence links to the public subject dossier, and permanently purges the report ticket.
                      </p>
                    </div>

                    <div className="border border-gray-400 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 p-4 space-y-2 rounded">
                      <span className="bg-gray-700 dark:bg-zinc-700 text-white text-[10px] font-bold px-2 py-0.5 uppercase">Option B: Dismiss</span>
                      <p className="text-[11px] leading-relaxed text-zinc-800 dark:text-zinc-200">
                        Click <span className="font-bold text-gray-700 dark:text-zinc-300">Dismiss Report</span>. Provide a mandatory reason (e.g., "Insufficient evidence"). The reporter is notified, no ban is issued, and the ticket record is safely purged.
                      </p>
                    </div>
                  </div>
                </li>
              </ol>
            </div>
          </div>
        </section>

        {/* Section 04: Appeals & Dispute SOP */}
        <section id="sop-appeals" className="space-y-6 scroll-mt-24">
          <div className="flex items-center gap-4 border-b-2 border-[#141414] dark:border-zinc-700 pb-4">
            <div className="w-10 h-10 bg-[#141414] dark:bg-zinc-800 text-white flex items-center justify-center font-mono font-bold text-lg">
              04
            </div>
            <div>
              <h2 className="text-2xl font-bold uppercase tracking-tight text-zinc-900 dark:text-white">Appeals & Dispute Resolution SOP</h2>
              <p className="font-mono text-xs text-zinc-600 dark:text-zinc-400">Protocols for evaluating global ban appeal submissions</p>
            </div>
          </div>

          <div className="border-2 border-[#141414] dark:border-zinc-700 bg-white dark:bg-zinc-900 p-8 space-y-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.05)]">
            <div className="space-y-4 font-mono text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
              <p>
                Every globally banned user has the right to file a dispute via the <Link to="/appeal" className="underline font-bold text-blue-600 dark:text-blue-400">Ban Appeal Terminal</Link>. Safety Moderators must process appeals with strict impartiality:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="border border-green-600 bg-green-50 dark:bg-emerald-950/80 p-5 space-y-3 rounded">
                  <div className="font-bold uppercase text-green-900 dark:text-emerald-300 text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-emerald-400" />
                    Criteria for Approving Appeal (Unban)
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-[11px] text-green-950 dark:text-emerald-200">
                    <li>Definitive proof of identity theft or impersonation at the time of infraction</li>
                    <li>Incontrovertible counter-evidence invalidating original report screenshots</li>
                    <li>Lapse of mandatory temp-ban duration with verified rehabilitation</li>
                    <li>First-time minor infraction with formal acknowledgment and restitution</li>
                  </ul>
                  <p className="text-[10px] font-bold text-green-900 dark:text-emerald-300 pt-2 border-t border-green-200 dark:border-emerald-800">
                    Outcome: Approving executes <code className="bg-green-100 dark:bg-emerald-900 text-green-950 dark:text-emerald-100 px-1">enforceGlobalUnban()</code> across all Discord guilds & VRChat group clusters automatically.
                  </p>
                </div>

                <div className="border border-red-600 bg-red-50 dark:bg-red-950/80 p-5 space-y-3 rounded">
                  <div className="font-bold uppercase text-red-900 dark:text-red-300 text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    Criteria for Denying Appeal
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-[11px] text-red-950 dark:text-red-200">
                    <li>Severe violations involving malicious exploits, doxxing, or child exploitation</li>
                    <li>Lack of accountability, hostile language in appeal ticket, or repeat offenses</li>
                    <li>Fabricated counter-evidence or falsified user details</li>
                  </ul>
                  <p className="text-[10px] font-bold text-red-900 dark:text-red-300 pt-2 border-t border-red-200 dark:border-red-800">
                    Outcome: Denying retains the global ban, logs administrator rationale, and dispatches notification email to applicant.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 05: Age Verification SOP */}
        <section id="sop-age" className="space-y-6 scroll-mt-24">
          <div className="flex items-center gap-4 border-b-2 border-[#141414] dark:border-zinc-700 pb-4">
            <div className="w-10 h-10 bg-[#141414] dark:bg-zinc-800 text-white flex items-center justify-center font-mono font-bold text-lg">
              05
            </div>
            <div>
              <h2 className="text-2xl font-bold uppercase tracking-tight text-zinc-900 dark:text-white">Age Verification & Data Privacy SOP</h2>
              <p className="font-mono text-xs text-zinc-600 dark:text-zinc-400">Mandatory protocol for reviewing identity documents and GDPR/COPPA auto-purging</p>
            </div>
          </div>

          <div className="border-2 border-[#141414] dark:border-zinc-700 bg-white dark:bg-zinc-900 p-8 space-y-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.05)]">
            <div className="bg-amber-50 dark:bg-amber-950/80 border-l-4 border-amber-600 dark:border-amber-500 p-4 space-y-2">
              <div className="flex items-center gap-2 font-bold uppercase text-xs text-amber-900 dark:text-amber-300">
                <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                CRITICAL DATA PROTECTION & PRIVACY REQUIREMENT
              </div>
              <p className="font-mono text-xs text-amber-950 dark:text-amber-200 leading-relaxed">
                Upon reviewing an Age Verification submission, the database handler <span className="font-bold underline">AUTOMATICALLY PURGES</span> both <code className="bg-amber-100 dark:bg-amber-900/90 text-amber-950 dark:text-amber-100 border border-amber-300 dark:border-amber-700 px-1.5 py-0.5 rounded font-bold">idPhoto</code> and <code className="bg-amber-100 dark:bg-amber-900/90 text-amber-950 dark:text-amber-100 border border-amber-300 dark:border-amber-700 px-1.5 py-0.5 rounded font-bold">facePhoto</code> base64 payloads from MongoDB storage (<code className="bg-amber-100 dark:bg-amber-900/90 text-amber-950 dark:text-amber-100 border border-amber-300 dark:border-amber-700 px-1.5 py-0.5 rounded font-bold">$unset: &#123; idPhoto: 1, facePhoto: 1 &#125;</code>). Only the DOB year/status and admin audit logs remain.
              </p>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <h4 className="font-bold uppercase text-sm border-b border-gray-200 dark:border-zinc-700 pb-2 text-zinc-900 dark:text-white">Verification Checklist for Staff:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border border-gray-300 dark:border-zinc-700 p-4 space-y-2 bg-gray-50 dark:bg-zinc-800/80">
                  <span className="font-bold text-[#141414] dark:text-amber-400 uppercase text-xs">Check 1: Face Match</span>
                  <p className="text-zinc-600 dark:text-zinc-300 text-[11px] leading-relaxed">
                    Manually compare facial features between the government-issued photo ID and the live selfie submission to confirm they are the same person.
                  </p>
                </div>

                <div className="border border-gray-300 dark:border-zinc-700 p-4 space-y-2 bg-gray-50 dark:bg-zinc-800/80">
                  <span className="font-bold text-[#141414] dark:text-amber-400 uppercase text-xs">Check 2: DOB & ID Match</span>
                  <p className="text-zinc-600 dark:text-zinc-300 text-[11px] leading-relaxed">
                    Confirm the Date of Birth entered in the submission matches the DOB printed on the ID document. Moderators do not need to check if the user is 18+ — simply verify the DOB matches the ID.
                  </p>
                </div>

                <div className="border border-gray-300 dark:border-zinc-700 p-4 space-y-2 bg-gray-50 dark:bg-zinc-800/80">
                  <span className="font-bold text-[#141414] dark:text-amber-400 uppercase text-xs">Check 3: Authenticity</span>
                  <p className="text-zinc-600 dark:text-zinc-300 text-[11px] leading-relaxed">
                    Inspect document edges for digital edit artifacts, screen-replay moiré patterns, or stock sample images. Reject suspect uploads.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 06: Watchlist & Trust Index */}
        <section id="sop-watchlist" className="space-y-6 scroll-mt-24">
          <div className="flex items-center gap-4 border-b-2 border-[#141414] dark:border-zinc-700 pb-4">
            <div className="w-10 h-10 bg-[#141414] dark:bg-zinc-800 text-white flex items-center justify-center font-mono font-bold text-lg">
              06
            </div>
            <div>
              <h2 className="text-2xl font-bold uppercase tracking-tight text-zinc-900 dark:text-white">Watchlist & Trust Index Classification</h2>
              <p className="font-mono text-xs text-zinc-600 dark:text-zinc-400">Categorization framework for high-priority subjects and public intelligence dossiers</p>
            </div>
          </div>

          <div className="border-2 border-[#141414] dark:border-zinc-700 bg-white dark:bg-zinc-900 p-8 space-y-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.05)]">
            <p className="font-mono text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
              When a user demonstrates severe threat potential, staff may toggle <span className="font-bold bg-red-600 text-white px-2 py-0.5 text-[10px] uppercase">HIGH RISK SUBJECT</span> on their profile. This publishes their dossier on the public <Link to="/watchlist" className="underline font-bold text-red-600 dark:text-red-400">Watchlist Directory</Link>.
            </p>

            <div className="space-y-3 font-mono text-xs">
              <h4 className="font-bold uppercase text-sm border-b border-gray-200 dark:border-zinc-700 pb-2 text-zinc-900 dark:text-white">The 5 Trust Index Tiers:</h4>
              <div className="space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-l-4 border-emerald-600 bg-emerald-100 dark:bg-emerald-200 border border-emerald-300 p-3.5 rounded-r-lg">
                  <span className="font-bold force-text-white text-xs">GREEN SECURE</span>
                  <span className="force-text-white text-[11px] font-semibold">Verified identity, trusted whitelist status, 0 infractions</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-l-4 border-amber-500 bg-amber-100 dark:bg-amber-200 border border-amber-300 p-3.5 rounded-r-lg">
                  <span className="font-bold force-text-white text-xs">YELLOW WARN</span>
                  <span className="force-text-white text-[11px] font-semibold">Minor warning history, slight negative reputation (-1 to -9)</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-l-4 border-orange-500 bg-orange-100 dark:bg-orange-200 border border-orange-300 p-3.5 rounded-r-lg">
                  <span className="font-bold force-text-white text-xs">ORANGE RISK</span>
                  <span className="force-text-white text-[11px] font-semibold">Severe reputation drop (&lt;= -10), active watchlist investigation</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-l-4 border-red-600 bg-red-100 dark:bg-red-200 border border-red-300 p-3.5 rounded-r-lg">
                  <span className="font-bold force-text-white text-xs">RED CLASS D</span>
                  <span className="force-text-white text-[11px] font-semibold">Active global ban for scamming, raids, or toxic behavior</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-l-4 border-zinc-900 dark:border-zinc-400 bg-zinc-900 dark:bg-black border border-zinc-800 p-3.5 rounded-r-lg">
                  <span className="font-bold force-text-white text-xs">BLACK TERMINAL</span>
                  <span className="force-text-white text-[11px] font-medium">Irrevocable threat level: predators, doxxers, major exploiters</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 07: VRChat & Custom Bot Operations */}
        <section id="sop-vrchat" className="space-y-6 scroll-mt-24">
          <div className="flex items-center gap-4 border-b-2 border-[#141414] dark:border-zinc-700 pb-4">
            <div className="w-10 h-10 bg-[#141414] dark:bg-zinc-800 text-white flex items-center justify-center font-mono font-bold text-lg">
              07
            </div>
            <div>
              <h2 className="text-2xl font-bold uppercase tracking-tight text-zinc-900 dark:text-white">VRChat 2FA & Custom Bot Operations</h2>
              <p className="font-mono text-xs text-zinc-600 dark:text-zinc-400">Managing automated cluster bots and custom server integrations</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border-2 border-[#141414] dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 space-y-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.05)]">
              <h3 className="text-base font-bold uppercase tracking-tight flex items-center gap-2 text-zinc-900 dark:text-white">
                <Cpu className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                VRChat Multi-Bot Cluster Configuration
              </h3>
              <ul className="font-mono text-xs space-y-2 text-zinc-600 dark:text-zinc-300 list-disc pl-4">
                <li>System Admins manage bot worker nodes in <span className="font-bold text-zinc-800 dark:text-zinc-200">System Config</span>.</li>
                <li>Bots use 2FA TOTP authentication via automated 2FAuth API integrations (<code className="bg-gray-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-1 border border-gray-300 dark:border-zinc-700">/api/v1/twofaccounts</code>).</li>
                <li>When a user connects VRChat account (<code className="bg-gray-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-1 border border-gray-300 dark:border-zinc-700">usr_...</code>), global bans automatically issue VRChat group bans.</li>
              </ul>
            </div>

            <div className="border-2 border-[#141414] dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 space-y-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.05)]">
              <h3 className="text-base font-bold uppercase tracking-tight flex items-center gap-2 text-zinc-900 dark:text-white">
                <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Custom Discord Bot Assistance
              </h3>
              <ul className="font-mono text-xs space-y-2 text-zinc-600 dark:text-zinc-300 list-disc pl-4">
                <li>Assist server owners in configuring custom bot tokens under Server Node Settings.</li>
                <li>Ensure server owners enable <span className="font-bold text-zinc-800 dark:text-zinc-200">Server Members Intent</span> and <span className="font-bold text-zinc-800 dark:text-zinc-200">Message Content Intent</span> in Discord Portal.</li>
                <li>Verify custom bot presence status (Online/Idle/DND) and custom activity text.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 08: API Key & Server Governance */}
        <section id="sop-api" className="space-y-6 scroll-mt-24">
          <div className="flex items-center gap-4 border-b-2 border-[#141414] dark:border-zinc-700 pb-4">
            <div className="w-10 h-10 bg-[#141414] dark:bg-zinc-800 text-white flex items-center justify-center font-mono font-bold text-lg">
              08
            </div>
            <div>
              <h2 className="text-2xl font-bold uppercase tracking-tight text-zinc-900 dark:text-white">API Key Approvals & Server Node Deletion</h2>
              <p className="font-mono text-xs text-zinc-600 dark:text-zinc-400">Developer key provisioning and server node offboarding standards</p>
            </div>
          </div>

          <div className="border-2 border-[#141414] dark:border-zinc-700 bg-white dark:bg-zinc-900 p-8 space-y-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.05)]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
              <div className="space-y-2">
                <h4 className="font-bold uppercase text-sm flex items-center gap-2 text-zinc-900 dark:text-white">
                  <Key className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  Developer API Key Review
                </h4>
                <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  Developers submit applications for Private API keys (<code className="bg-gray-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-1 border border-gray-300 dark:border-zinc-700">bs_...</code>). System Admins evaluate server count, developer email validity, and intended application purpose before approving. Revocations require logging explicit reasons.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold uppercase text-sm flex items-center gap-2 text-zinc-900 dark:text-white">
                  <Server className="w-4 h-4 text-red-600 dark:text-red-400" />
                  Server Node Purging
                </h4>
                <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  When a server owner deletes their server node, the database automatically cleans up associated custom bot client instances, purges VRChat alert trackers, and unlinks custom banlist associations.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom Callout */}
        <section className="bg-amber-50 dark:bg-amber-950/80 border-2 border-[#141414] dark:border-amber-700 p-8 text-center space-y-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.05)]">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#141414] dark:bg-amber-500 text-amber-400 dark:text-zinc-950 rounded-full mb-2">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-bold uppercase tracking-tight text-amber-950 dark:text-amber-100">Questions or Escalate Incident?</h3>
          <p className="font-mono text-xs text-amber-900 dark:text-amber-200 max-w-xl mx-auto">
            If you encounter complex edge cases or suspect coordinated voting rings/malicious abuse, escalate the ticket directly to a System Administrator in the internal staff console.
          </p>
        </section>
      </div>
    </div>
  );
}
