import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  UserCheck, 
  MessageSquare, 
  Zap, 
  LayoutDashboard, 
  Settings,
  Bot,
  ListFilter,
  Cpu,
  ShieldCheck,
  Key,
  Sparkles,
  BookOpen,
  Award,
  Terminal,
  Eye,
  Radio,
  Volume2
} from 'lucide-react';

export default function Instructions() {
  return (
    <div className="max-w-5xl mx-auto space-y-12 mb-24">
      {/* Header */}
      <header className="space-y-4 text-center px-4">
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold uppercase tracking-tighter leading-tight mb-4">
          Server Owner & User Guide
        </h1>
        <p className="font-mono text-xs uppercase tracking-[0.2em] sm:tracking-[0.4em] opacity-60">
          How It Works • BeSafe Network Setup & Command Reference
        </p>

        {/* Staff Training Link Banner */}
        <div className="pt-4 flex justify-center">
          <div className="bg-amber-50 border-2 border-[#141414] p-4 text-left max-w-2xl w-full flex flex-col md:flex-row items-center justify-between gap-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8 text-amber-600 flex-shrink-0" />
              <div>
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[#141414]">Looking for Moderator & Staff SOPs?</h3>
                <p className="font-mono text-[11px] opacity-70">Our official Staff Training Manual is published on a separate public page for complete network transparency.</p>
              </div>
            </div>
            <Link
              to="/staff-training"
              className="flex-shrink-0 bg-[#141414] text-white hover:bg-neutral-800 font-mono text-xs font-bold uppercase tracking-wider px-4 py-2 flex items-center gap-2 border border-[#141414] transition-colors"
            >
              <Eye className="w-4 h-4 text-amber-400" />
              View Staff Training →
            </Link>
          </div>
        </div>
      </header>

      {/* USER & SERVER OWNER MANUAL CONTENT */}
      <div className="space-y-16 animate-fadeIn">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section className="border-2 border-[#141414] p-8 space-y-6 bg-white hover:bg-blue-50 transition-colors shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#141414] text-[#E4E3E0] flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold uppercase tracking-tight">Quick Setup</h2>
            </div>
            <ol className="font-mono text-xs space-y-4 list-decimal pl-4 opacity-70">
              <li>Invite the bot to your Discord server using the official link.</li>
              <li>Run <code className="bg-gray-100 px-1 py-0.5">/setup</code> in a staff-only channel.</li>
              <li>Run <code className="bg-gray-100 px-1 py-0.5">/link</code> to get your dashboard connection code.</li>
              <li>Connect your account on the <Link to="/dashboard" className="underline font-bold">Admin Dashboard</Link>.</li>
            </ol>
          </section>

          <section className="border-2 border-[#141414] p-8 space-y-6 bg-white hover:bg-green-50 transition-colors shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#141414] text-[#E4E3E0] flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold uppercase tracking-tight">Core Commands</h2>
            </div>
            <ul className="font-mono text-xs space-y-3 opacity-70">
              <li><span className="font-bold">/check @user</span> - View a user's global standing.</li>
              <li><span className="font-bold">/report @user</span> - Report a malicious user with evidence.</li>
              <li><span className="font-bold">/reputation @user</span> - Give +/- reputation based on interaction.</li>
              <li><span className="font-bold">/info</span> - Generic help and system information.</li>
            </ul>
          </section>
        </div>

        <div className="space-y-12">
          <div className="flex items-center gap-4 border-b border-[#141414] pb-4">
            <MessageSquare className="w-6 h-6" />
            <h2 className="text-3xl font-bold uppercase tracking-tighter">Command Reference</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-xl font-bold uppercase tracking-tight flex items-center gap-2">
                  <span className="bg-blue-600 text-white px-2 py-0.5 text-sm">/check</span>
                  Global Status
                </h3>
                <p className="font-mono text-xs opacity-60 leading-relaxed">
                  Use this to see if a user is currently globally banned, suspicious due to low reputation, or a trusted network member.
                </p>
              </div>

              {/* Discord Mockup Suspicious */}
              <div className="bg-[#313338] p-4 rounded-md border border-[#1e1f22]">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#5865F2] flex items-center justify-center flex-shrink-0">
                    <Shield className="text-white w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">Be Safe</span>
                      <span className="bg-[#5865F2] text-[10px] px-1 text-white rounded-sm font-bold">APP</span>
                      <span className="text-xs text-[#949BA4]">Today at 11:39 PM</span>
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 bg-orange-500 rounded-full" />
                        <span className="font-bold text-white">User Check: troll1234</span>
                      </div>
                      <p className="text-[#DBDEE1] text-sm font-sans">Reputation: -10</p>
                      <p className="text-[#DBDEE1] text-sm font-sans">Status: SUSPICIOUS (Low Reputation)</p>
                      <p className="text-[#DBDEE1] text-sm font-sans">Warnings: 0</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Discord Mockup Banned */}
              <div className="bg-[#313338] p-4 rounded-md border border-[#1e1f22]">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#5865F2] flex items-center justify-center flex-shrink-0">
                    <Shield className="text-white w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">Be Safe</span>
                      <span className="bg-[#5865F2] text-[10px] px-1 text-white rounded-sm font-bold">APP</span>
                      <span className="text-xs text-[#949BA4]">Today at 11:35 PM</span>
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 bg-red-500 rounded-full" />
                        <span className="font-bold text-white">User Check: ilovescamming</span>
                      </div>
                      <p className="text-[#DBDEE1] text-sm font-sans">Reputation: 0</p>
                      <p className="text-[#DBDEE1] text-sm font-sans">Status: BANNED (Global Ban: Vrchat scammer)</p>
                      <p className="text-[#DBDEE1] text-sm font-sans">Warnings: 0</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-12">
              <div className="space-y-4">
                <h3 className="text-xl font-bold uppercase tracking-tight flex items-center gap-2">
                  <span className="bg-red-600 text-white px-2 py-0.5 text-sm">/report</span>
                  Incident Logging
                </h3>
                <p className="font-mono text-xs opacity-60 leading-relaxed">
                  Log a malicious user into our system. You MUST provide a clear reason and evidence (usually a message link or screenshot URL). Our admins manually review every report.
                </p>
                <div className="bg-gray-100 p-4 font-mono text-[10px] border-l-4 border-red-600">
                  Usage: /report target:@user reason:Attempted scam evidence:https://imgur.com/xyz
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold uppercase tracking-tight flex items-center gap-2">
                  <span className="bg-orange-600 text-white px-2 py-0.5 text-sm">/reputation</span>
                  Trust Building
                </h3>
                <p className="font-mono text-xs opacity-60 leading-relaxed">
                  Rate your private interactions with users. Positive (+1) for safe trades/talks, Negative (-1) for toxic or shady behavior. Reputation is the core of our predictive safety.
                </p>
                <div className="bg-gray-100 p-4 font-mono text-[10px] border-l-4 border-orange-600">
                  Usage: /reputation target:@user rating:Positive
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold uppercase tracking-tight flex items-center gap-2">
                  <span className="bg-rose-600 text-white px-2 py-0.5 text-sm">/age-delete</span>
                  Purge Age Data
                </h3>
                <p className="font-mono text-xs opacity-60 leading-relaxed">
                  Permanently delete your own age verification records, date of birth data, and verification status. This is strictly a self-service privacy action; server administrators and moderators cannot execute this on behalf of other users.
                </p>
                <div className="bg-gray-100 p-4 font-mono text-[10px] border-l-4 border-rose-600">
                  Usage: /age-delete (executes directly on your own account)
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-12">
          <div className="flex items-center gap-4 border-b border-[#141414] pb-4">
            <UserCheck className="w-6 h-6" />
            <h2 className="text-3xl font-bold uppercase tracking-tighter">Age Verification Flow</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="space-y-4 border-2 border-[#141414] bg-white p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
              <h3 className="text-xl font-bold uppercase tracking-tight">1. Submission</h3>
              <p className="font-mono text-xs opacity-60 leading-relaxed">
                Users run <code className="bg-gray-100 px-1 py-0.5">/age-verify</code> in Discord. They are directed to our internal portal to upload their ID and take a live selfie.
              </p>
            </div>
            <div className="space-y-4 border-2 border-[#141414] bg-white p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
              <h3 className="text-xl font-bold uppercase tracking-tight">2. Manual Review</h3>
              <p className="font-mono text-xs opacity-60 leading-relaxed">
                Our safety administrators review every submission within 24 hours. We compare ID documents against the live photo for authenticity before purging ID photos.
              </p>
            </div>
            <div className="space-y-4 border-2 border-[#141414] bg-white p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
              <h3 className="text-xl font-bold uppercase tracking-tight">3. Global Status</h3>
              <p className="font-mono text-xs opacity-60 leading-relaxed">
                Once verified, the user's status is global. In any server with "Auto-assign" enabled, the 18+ role is granted automatically on join.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-12">
          <div className="flex items-center gap-4 border-b border-[#141414] pb-4">
            <LayoutDashboard className="w-6 h-6" />
            <h2 className="text-3xl font-bold uppercase tracking-tighter">Dashboard Management</h2>
          </div>

          <div className="border-2 border-[#141414] bg-white p-8 md:p-12 relative overflow-hidden shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
            <Settings className="absolute -bottom-10 -right-10 w-48 h-48 opacity-[0.03] rotate-12" />
            <div className="max-w-2xl space-y-8 relative">
              <div className="space-y-2">
                <h4 className="font-bold uppercase tracking-tight">Auto-Ban Threshold</h4>
                <p className="font-mono text-xs opacity-60">Control the "Strictness" of your server. If a user's reputation falls below your set threshold (e.g., -10), they will be automatically banned the moment they join.</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-bold uppercase tracking-tight">Logging & Staff Channels</h4>
                <p className="font-mono text-xs opacity-60">Redirect all safety alerts to specific staff-only channels to ensure your moderation team stays informed without cluttering public channels.</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-bold uppercase tracking-tight">Global Reputation</h4>
                <p className="font-mono text-xs opacity-60">Understand that reputation travels with the user. A user trusted in one community is more likely to be safe in yours.</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-bold uppercase tracking-tight">Server Isolation & Privacy</h4>
                <p className="font-mono text-xs opacity-60">By default, standard users can only view, access, and configure servers they personally own. Global system administrators retain administrative permission to oversee all connected servers across the entire network.</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-bold uppercase tracking-tight">Permanent Node Deletion</h4>
                <p className="font-mono text-xs opacity-60">If you ever need to offboard a server, server owners and system administrators can permanently delete any connected server and its integrated configurations. Doing so securely purges all related VRChat tracker tasks, customized parameters, and linked log entries from the central database.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Custom Discord Bot Setup */}
        <div className="space-y-12">
          <div className="flex items-center gap-4 border-b border-[#141414] pb-4">
            <Bot className="w-6 h-6 text-blue-600" />
            <h2 className="text-3xl font-bold uppercase tracking-tighter">Custom Discord Bot Integration</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="border-2 border-[#141414] bg-white p-8 space-y-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
              <h3 className="text-xl font-bold uppercase tracking-tight flex items-center gap-2">
                <Key className="w-5 h-5 text-blue-600" />
                1. Provisioning & Intents
              </h3>
              <ol className="font-mono text-xs space-y-3 list-decimal pl-4 opacity-70">
                <li>Create a new application in the <a href="https://discord.com/developers/applications" target="_blank" rel="noreferrer" className="underline font-bold text-blue-600">Discord Developer Portal</a>.</li>
                <li>Under the <strong>Bot</strong> tab, reset and copy your Bot Token.</li>
                <li>Enable Privileged Gateway Intents: <strong>Server Members Intent</strong> and <strong>Message Content Intent</strong>.</li>
                <li>Paste your bot token into your Server Node settings on the Admin Dashboard.</li>
              </ol>
            </div>

            <div className="border-2 border-[#141414] bg-white p-8 space-y-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
              <h3 className="text-xl font-bold uppercase tracking-tight flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                2. Presence & Branding
              </h3>
              <ul className="font-mono text-xs space-y-3 opacity-70">
                <li><strong>Status State:</strong> Choose Online, Idle, Do Not Disturb, or Invisible.</li>
                <li><strong>Activity Types:</strong> Set Playing, Streaming, Listening, Watching, or Competing.</li>
                <li><strong>Custom Activity Message:</strong> Enter status text (e.g., "Monitoring Guild Safety").</li>
                <li>Your custom bot will register slash commands (<code className="bg-gray-100 px-1 py-0.5">/check</code>, <code className="bg-gray-100 px-1 py-0.5">/report</code>) and execute bans under its own avatar and name.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Custom Banlists & Enforcement Modes */}
        <div className="space-y-12">
          <div className="flex items-center gap-4 border-b border-[#141414] pb-4">
            <ListFilter className="w-6 h-6 text-purple-600" />
            <h2 className="text-3xl font-bold uppercase tracking-tighter">Custom Banlists & Enforcement Modes</h2>
          </div>

          <div className="border-2 border-[#141414] bg-white p-8 space-y-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
            <p className="font-mono text-xs opacity-70 leading-relaxed">
              In addition to the central Be Safe Global Banlist, server administrators can create, share, and link <strong>Custom Banlists</strong>. Custom banlists store both Discord User IDs and VRChat User IDs (<code className="bg-gray-100 px-1 py-0.5">usr_...</code>).
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <div className="border border-gray-200 p-4 space-y-2 bg-gray-50">
                <span className="bg-[#141414] text-white px-2 py-0.5 text-[10px] font-mono uppercase font-bold">Mode 01</span>
                <h4 className="font-bold text-sm uppercase">Global Only</h4>
                <p className="font-mono text-[10px] opacity-60">Enforces bans originating strictly from the network-wide global database.</p>
              </div>
              <div className="border border-gray-200 p-4 space-y-2 bg-gray-50">
                <span className="bg-purple-600 text-white px-2 py-0.5 text-[10px] font-mono uppercase font-bold">Mode 02</span>
                <h4 className="font-bold text-sm uppercase">Custom Only</h4>
                <p className="font-mono text-[10px] opacity-60">Enforces bans originating strictly from your linked Custom Banlist ID.</p>
              </div>
              <div className="border border-gray-200 p-4 space-y-2 bg-gray-50">
                <span className="bg-blue-600 text-white px-2 py-0.5 text-[10px] font-mono uppercase font-bold">Mode 03</span>
                <h4 className="font-bold text-sm uppercase">Both (Global & Custom)</h4>
                <p className="font-mono text-[10px] opacity-60">Combines global threat intelligence with your private community blacklist for total coverage.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Anti-Raid Backup & Snapshot System */}
        <div className="space-y-12">
          <div className="flex items-center gap-4 border-b border-[#141414] pb-4">
            <ShieldCheck className="w-6 h-6 text-green-600" />
            <h2 className="text-3xl font-bold uppercase tracking-tighter">Anti-Raid Server Backup & Snapshot Restore</h2>
          </div>

          <div className="border-2 border-[#141414] bg-white p-8 space-y-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
            <p className="font-mono text-xs opacity-70 leading-relaxed">
              Protect your server against rogue admin overrides or raid incidents using our snapshot backup engine. Capture roles, channels, category structures, permissions, and ban registries instantly.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
              <div className="border border-gray-200 p-4 space-y-2 bg-gray-50">
                <span className="font-bold text-sm uppercase flex items-center gap-2 text-blue-600">
                  <Terminal className="w-4 h-4" /> Discord Slash Commands
                </span>
                <ul className="space-y-1 text-[11px] opacity-80">
                  <li><code className="bg-gray-200 px-1">/backup create [name]</code> - Capture server state</li>
                  <li><code className="bg-gray-200 px-1">/backup list</code> - View saved snapshots</li>
                  <li><code className="bg-gray-200 px-1">/backup restore id:&lt;ID&gt;</code> - Execute rollback</li>
                </ul>
              </div>

              <div className="border border-gray-200 p-4 space-y-2 bg-gray-50">
                <span className="font-bold text-sm uppercase flex items-center gap-2 text-purple-600">
                  <LayoutDashboard className="w-4 h-4" /> Web Dashboard Controls
                </span>
                <p className="text-[11px] opacity-80 leading-relaxed">
                  View snapshot histories, download complete JSON backup files, or trigger single-click server rollbacks directly from your server card in the Admin Dashboard.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CreatorPlaza Radio Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Radio className="w-6 h-6 text-orange-500" />
            <h2 className="text-3xl font-bold uppercase tracking-tighter">CreatorPlaza Radio</h2>
          </div>

          <div className="border-2 border-[#141414] bg-white p-8 space-y-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200">
              <div>
                <span className="font-bold text-base text-orange-600">24/7 Shoutcast Live Audio Stream</span>
                <p className="font-mono text-xs opacity-70 mt-1">
                  Enjoy high quality music and live radio streaming directly in any server voice channel.
                </p>
              </div>
              <a
                href="https://creatorplaza.nl/radio"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white font-mono text-xs font-bold uppercase tracking-wider hover:bg-orange-600 transition-colors shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]"
              >
                <Radio className="w-4 h-4" /> Open creatorplaza.nl/radio
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
              <div className="border border-gray-200 p-4 space-y-3 bg-gray-50">
                <span className="font-bold text-sm uppercase flex items-center gap-2 text-orange-600">
                  <Terminal className="w-4 h-4" /> Playback & Controls
                </span>
                <ul className="space-y-2 text-[11px] opacity-80">
                  <li><code className="bg-gray-200 px-1 font-bold">/radio play [volume]</code> - Join VC and start streaming CreatorPlaza Radio</li>
                  <li><code className="bg-gray-200 px-1 font-bold">/stop</code> or <code className="bg-gray-200 px-1 font-bold">/radio stop</code> - Stop playback and leave voice channel</li>
                  <li><code className="bg-gray-200 px-1 font-bold">/volume &lt;1-100&gt;</code> - Adjust stream volume in real time</li>
                </ul>
              </div>

              <div className="border border-gray-200 p-4 space-y-3 bg-gray-50">
                <span className="font-bold text-sm uppercase flex items-center gap-2 text-blue-600">
                  <Volume2 className="w-4 h-4" /> Live Track Metadata
                </span>
                <ul className="space-y-2 text-[11px] opacity-80">
                  <li><code className="bg-gray-200 px-1 font-bold">/np</code> or <code className="bg-gray-200 px-1 font-bold">/radio np</code> - Fetch live song title, artist, listener count & cover art</li>
                  <li className="text-[10px] text-gray-500 pt-1">
                    Direct stream: <code className="bg-gray-100 px-1">https://stream.creatorplaza.nl/main</code>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <section className="bg-red-600 text-white p-6 sm:p-12 text-center space-y-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
          <h2 className="text-3xl sm:text-4xl font-bold uppercase tracking-tight">System Notice & Fair Use</h2>
          <p className="font-mono text-xs sm:text-sm max-w-xl mx-auto opacity-95 leading-relaxed">
            Misuse of the report or reputation systems (such as false reports or vote manipulation) will result in a permanent global ban for all involved accounts. Automated checks detect and flag suspicious voting patterns.
          </p>
        </section>
      </div>
    </div>
  );
}
