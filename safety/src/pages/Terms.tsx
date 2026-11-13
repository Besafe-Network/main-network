import React from 'react';
import { motion } from 'motion/react';
import { Shield, FileText } from 'lucide-react';

export default function Terms() {
  return (
    <div className="max-w-4xl mx-auto space-y-12 py-12">
      <div className="space-y-4 text-center">
        <div className="inline-block border border-[#141414] px-4 py-1 font-mono text-[10px] uppercase tracking-[0.3em] mb-4">
          Legal Document: 001
        </div>
        <h1 className="text-6xl font-bold uppercase tracking-tighter">Terms of Service</h1>
        <p className="opacity-70 font-mono text-xs uppercase tracking-widest">Last Updated: August 11, 2026</p>
      </div>

      <div className="border-2 border-[#141414] p-8 md:p-12 space-y-12 bg-white/50">
        <section className="space-y-4">
          <h2 className="text-2xl font-bold uppercase tracking-tight flex items-center gap-3">
            <span className="bg-[#141414] text-[#E4E3E0] px-2 py-0.5 text-sm font-mono">01</span>
            Acceptance of Terms
          </h2>
          <p className="opacity-80 leading-relaxed">
            By accessing or using the BeSafe Network platform, including our website, core Discord bot, custom Discord bot client hosting, VRChat multi-bot scanner, Custom Banlist manager, manual Age Verification terminal, and Developer API, you agree to be bound by these Terms of Service. If you do not agree to these terms, you must immediately cease all use of our services, revoke any associated API keys or custom bot tokens, and unlink your third-party integrations.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold uppercase tracking-tight flex items-center gap-3">
            <span className="bg-[#141414] text-[#E4E3E0] px-2 py-0.5 text-sm font-mono">02</span>
            Custom Discord Bot Tokens & Client Isolation
          </h2>
          <p className="opacity-80 leading-relaxed">
            Guild operators may configure a custom Discord Bot Token to run custom-branded moderation instances:
          </p>
          <ul className="list-disc pl-6 space-y-2 opacity-80 text-sm">
            <li><strong>Credential Responsibility:</strong> Guild administrators warrant that provided custom bot tokens are owned or authorized by their server team. Tokens are AES-256 encrypted at rest and used solely to execute Discord gateway slash commands and moderation tasks.</li>
            <li><strong>Intents & Permissions:</strong> Guilds are responsible for enabling required Privileged Gateway Intents (Server Members Intent, Message Content Intent) in the Discord Developer Portal.</li>
            <li><strong>Custom Presence:</strong> Status messages and activities (Playing, Streaming, Listening, Watching) configured on custom bot clients must comply with Discord Terms of Service and must not contain vulgar, offensive, or misleading content.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold uppercase tracking-tight flex items-center gap-3">
            <span className="bg-[#141414] text-[#E4E3E0] px-2 py-0.5 text-sm font-mono">03</span>
            Custom Banlists & Banlist ID Linking
          </h2>
          <p className="opacity-80 leading-relaxed">
            Server administrators can create and manage isolated or shared Custom Banlists containing Discord IDs and VRChat User IDs (<code className="bg-gray-100 px-1 py-0.5">usr_...</code>):
          </p>
          <ul className="list-disc pl-6 space-y-2 opacity-80 text-sm">
            <li><strong>Fair List Management:</strong> Custom banlists must be maintained in good faith. Creating target lists for personal harassment, competitive exclusion, or targeted brigading is strictly forbidden and grounds for immediate account termination.</li>
            <li><strong>Enforcement Modes:</strong> Servers linking a Custom Banlist ID may set their enforcement mode to "Global Only", "Custom Only", or "Both". Guild administrators assume full responsibility for ban actions taken under custom list rules.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold uppercase tracking-tight flex items-center gap-3">
            <span className="bg-[#141414] text-[#E4E3E0] px-2 py-0.5 text-sm font-mono">04</span>
            Automated Unban Pipelines & Appeals
          </h2>
          <p className="opacity-80 leading-relaxed">
            To safeguard due process, the system includes bi-directional auto-unban automation for Discord servers (<code className="bg-gray-100 px-1 py-0.5">autoUnbanDiscordEnabled</code>) and VRChat Groups (<code className="bg-gray-100 px-1 py-0.5">autoUnbanVRChatEnabled</code>):
          </p>
          <ul className="list-disc pl-6 space-y-2 opacity-80 text-sm">
            <li>When a global ban record is revoked, purged, or successfully appealed, automated API triggers remove the ban across participating nodes where auto-unban is enabled.</li>
            <li>Guild operators retain the right to re-ban users locally under local server rules if local policy differs from network-wide safety directives.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold uppercase tracking-tight flex items-center gap-3">
            <span className="bg-[#141414] text-[#E4E3E0] px-2 py-0.5 text-sm font-mono">05</span>
            VRChat Multi-Bot Integration & 2FA Automation
          </h2>
          <p className="opacity-80 leading-relaxed">
            Guild operators linking VRChat Groups acknowledge the following operational rules:
          </p>
          <ul className="list-disc pl-6 space-y-2 opacity-80 text-sm">
            <li><strong>Automated Banning vs. Staff Warnings:</strong> If auto-banning is disabled, the system dispatches staff warning pings to configured Discord log channels rather than calling group ban APIs.</li>
            <li><strong>2FA Authentication:</strong> Bot credentials or TOTP 2FA keys provided to maintain continuous group scanning are securely handled and rate-limited to comply with VRChat upstream capacity constraints.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold uppercase tracking-tight flex items-center gap-3">
            <span className="bg-[#141414] text-[#E4E3E0] px-2 py-0.5 text-sm font-mono">06</span>
            Clinical Watchlist & Evidence Dossiers
          </h2>
          <p className="opacity-80 leading-relaxed">
            Subjects monitored on the Clinical Watchlist are evaluated using standardized Trust Index metrics (GREEN_SECURE to BLACK_TERMINAL). Evidence files, screenshot dossiers, and investigator notes are maintained for threat detection and audit verification.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold uppercase tracking-tight flex items-center gap-3">
            <span className="bg-[#141414] text-[#E4E3E0] px-2 py-0.5 text-sm font-mono">07</span>
            Developer API & Scoped Integration
          </h2>
          <p className="opacity-80 leading-relaxed">
            Developers utilizing our API must adhere to strictly defined usage policies:
          </p>
          <ul className="list-disc pl-6 space-y-2 opacity-80 text-sm">
            <li>API keys are sensitive credentials and must be stored securely server-side.</li>
            <li>You may not use API data to create "competitive" databases or mirror our systems without explicit written consent.</li>
            <li>Automated data scraping or excessive requests designed to stress the network will result in immediate API key revocation.</li>
            <li>Contribution of false data through the private API will lead to a permanent ban of the associated developer account and all linked Discord bots.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold uppercase tracking-tight flex items-center gap-3">
            <span className="bg-[#141414] text-[#E4E3E0] px-2 py-0.5 text-sm font-mono">08</span>
            Manual Age Verification, Anti-Leak & Anti-Fraud Governance
          </h2>
          <p className="opacity-80 leading-relaxed">
            The BeSafe Network Age Verification terminal is a manual, high-security review system designed to safeguard age-restricted Discord channels while protecting user privacy against data leaks:
          </p>
          <ul className="list-disc pl-6 space-y-2 opacity-80 text-sm">
            <li><strong>Manual Human Review:</strong> Verification requests are reviewed manually by authorized platform administrators. No third-party AI image scanners or biometric face matching models process user photos.</li>
            <li><strong>Instant Image Purge:</strong> Upon completing the manual review decision (approval or rejection), the database handler strictly and automatically purges all raw photo payloads (<code className="bg-gray-100 px-1 py-0.5">$unset: &#123; idPhoto: 1, facePhoto: 1 &#125;</code>) from database storage to guarantee zero data leak risk.</li>
            <li><strong>Truthfulness & Zero Tolerance:</strong> Users agree to provide truthful, unaltered documents. Any attempt to submit fraudulent identification, deepfake imagery, stolen documents, or underage records will trigger an immediate permanent Global Ban without appeal eligibility.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold uppercase tracking-tight flex items-center gap-3">
            <span className="bg-[#141414] text-[#E4E3E0] px-2 py-0.5 text-sm font-mono">09</span>
            Limitation of Liability
          </h2>
          <p className="opacity-80 leading-relaxed italic">
            BeSafe Network is provided "as is" without any warranties. We are not responsible for any damages, loss of prestige, or server disruptions resulting from moderation actions taken based on our data. Server administrators retain full autonomy over their local moderation decisions and are solely responsible for how they utilize our safety signals and configure local automatic ban parameters.
          </p>
        </section>
      </div>

      <div className="text-center">
        <p className="font-mono text-[10px] opacity-30 uppercase tracking-[0.2em]">
          End of Terms of Service
        </p>
      </div>
    </div>
  );
}
