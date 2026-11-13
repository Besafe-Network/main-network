import React from 'react';
import { motion } from 'motion/react';
import { Shield, Lock, Eye } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="max-w-4xl mx-auto space-y-12 py-12">
      <div className="space-y-4 text-center">
        <div className="inline-block border border-[#141414] px-4 py-1 font-mono text-[10px] uppercase tracking-[0.3em] mb-4">
          Legal Document: 002
        </div>
        <h1 className="text-6xl font-bold uppercase tracking-tighter">Privacy Policy</h1>
        <p className="opacity-70 font-mono text-xs uppercase tracking-widest">Last Updated: August 11, 2026</p>
      </div>

      <div className="border-2 border-[#141414] p-8 md:p-12 space-y-12 bg-white/50">
        <section className="space-y-4">
          <h2 className="text-2xl font-bold uppercase tracking-tight flex items-center gap-3">
            <span className="bg-[#141414] text-[#E4E3E0] px-2 py-0.5 text-sm font-mono">01</span>
            Data We Collect
          </h2>
          <p className="opacity-80 leading-relaxed">
            To provide our safety services, we collect and store the following information:
          </p>
          <ul className="list-disc pl-6 space-y-2 opacity-80 text-sm">
            <li>Discord User IDs, Usernames, and Guild (Server) Configuration Settings</li>
            <li>Custom Discord Bot Tokens provided by guild operators (AES-256 encrypted at rest)</li>
            <li>Custom Banlist records, including target Discord User IDs, VRChat User IDs (<code className="bg-gray-100 px-1 py-0.5">usr_...</code>), and custom ban reasons</li>
            <li>VRChat User IDs, Group IDs, and VRChat Bot 2FA TOTP credentials for automated group scanning</li>
            <li>Clinical Watchlist entries, internal investigator notes, and evidence dossiers (screenshot links and proof files)</li>
            <li>Report reasons, evidence attachments, and appeal communications</li>
            <li>Temporary Age verification document submissions (ID photos and live selfies) — *See Section 04 for Instant Purge Protocol*</li>
            <li>Developer API Key applications, developer emails, and API usage audit metrics</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold uppercase tracking-tight flex items-center gap-3">
            <span className="bg-[#141414] text-[#E4E3E0] px-2 py-0.5 text-sm font-mono">02</span>
            How We Use Data
          </h2>
          <p className="opacity-80 leading-relaxed">
            Your data is used exclusively for maintaining Discord and connected guild safety:
          </p>
          <ul className="list-disc pl-6 space-y-2 opacity-80 text-sm">
            <li>Identifying and banning malicious actors across global and custom linked banlists</li>
            <li>Hosting custom Discord bot instances with guild-defined status, activity, and custom slash commands</li>
            <li>Executing bi-directional auto-unbans across Discord servers and VRChat Groups when appeals pass or bans are revoked</li>
            <li>Calculating user reputation scores and Trust Index tier classifications</li>
            <li>Dispatching real-time warning alerts, audit logs, and role pings to configured staff channels</li>
            <li>Manually reviewing age verification requests to grant 18+ protected channel access safely</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold uppercase tracking-tight flex items-center gap-3">
            <span className="bg-[#141414] text-[#E4E3E0] px-2 py-0.5 text-sm font-mono">03</span>
            Data Sharing & Access Controls
          </h2>
          <p className="opacity-80 leading-relaxed">
            We do not sell or monetize your personal data. Public ban status and reputation scores are queryable through lookup tools, bot slash commands, and Developer API endpoints. Custom banlists are restricted to linked server nodes unless made public by the creator. Age verification images are strictly confidential, accessed only by authorized human administrators during live manual evaluation, and are NEVER exposed to third-party APIs, external partners, or server owners.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold uppercase tracking-tight flex items-center gap-3">
            <span className="bg-[#141414] text-[#E4E3E0] px-2 py-0.5 text-sm font-mono">04</span>
            Data Retention & Automatic Photo Purge Protocol
          </h2>
          <p className="opacity-80 leading-relaxed">
            We operate on a strict "minimum necessary" data retention and zero-leak privacy protocol:
          </p>
          <ul className="list-disc pl-6 space-y-2 opacity-80 text-sm">
            <li><strong>Encrypted Integration Credentials:</strong> Custom Discord Bot Tokens, Developer API Secrets, and VRChat 2FA TOTP keys are heavily encrypted in our database using industry-standard AES-256 encryption.</li>
            <li><strong>Automatic Verification Image Purge:</strong> ID photo and selfie base64 payloads are **automatically and permanently purged** (<code className="bg-gray-100 px-1 py-0.5">$unset: &#123; idPhoto: 1, facePhoto: 1 &#125;</code>) from database storage immediately upon an administrator's approval or rejection decision. Only the birth date metadata, verification status, and audit log timestamp remain.</li>
            <li><strong>Ban Records & Evidence:</strong> Global ban records and evidence files are retained indefinitely to prevent re-entry of malicious actors into protected networks.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold uppercase tracking-tight flex items-center gap-3">
            <span className="bg-[#141414] text-[#E4E3E0] px-2 py-0.5 text-sm font-mono">05</span>
            Security & Integration Credentials
          </h2>
          <p className="opacity-80 leading-relaxed">
            We implement industry-standard security measures to protect our database against unauthorized access and data leaks. Sensitive integrations such as central bot cookies or account credentials used to bridge the Discord safety network with third-party platforms are heavily encrypted at rest. Access to sensitive administrative tools is strictly restricted via multi-factor authentication and role-based access controls.
          </p>
        </section>
      </div>

      <div className="text-center">
        <p className="font-mono text-[10px] opacity-30 uppercase tracking-[0.2em]">
          End of Privacy Policy
        </p>
      </div>
    </div>
  );
}
