import React, { useState } from 'react';
import { 
  Terminal, 
  Globe, 
  Code2, 
  ShieldCheck, 
  Database, 
  Copy, 
  Check, 
  Search, 
  Play, 
  Bot, 
  FileCheck, 
  Key, 
  Send, 
  RefreshCw, 
  Sparkles, 
  AlertCircle, 
  Lock, 
  ChevronRight, 
  ChevronDown,
  Layers,
  Zap,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ExternalLink,
  Shield,
  BookOpen
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface EndpointParam {
  name: string;
  type: string;
  location: 'path' | 'query' | 'body' | 'header';
  required: boolean;
  description: string;
}

interface EndpointDoc {
  id: string;
  method: 'GET' | 'POST' | 'DELETE' | 'PUT';
  path: string;
  title: string;
  category: 'User Safety' | 'Threat Watchlist' | 'Reports & Appeals' | 'Partner Bot API' | 'Custom Banlists' | 'Guild Node Management';
  requiresAuth?: boolean;
  description: string;
  params: EndpointParam[];
  sampleBody?: any;
  responseSchema: string;
  defaultSamplePath?: string;
}

export default function APIDocs() {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://api.besafenetwork.org';
  const [activeLang, setActiveLang] = useState<'curl' | 'js' | 'python' | 'java' | 'csharp' | 'go'>('curl');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedMethod, setSelectedMethod] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Live Tester Key & Endpoint state
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [testerEndpoint, setTesterEndpoint] = useState<string | null>('get-user-profile');
  const [testerPathInput, setTesterPathInput] = useState<string>('/api/v1/public/user/123456789012345678');
  const [testerBodyInput, setTesterBodyInput] = useState<string>('');
  const [testerResult, setTesterResult] = useState<{ status: number; data: any; time: number } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const languages = [
    { id: 'curl', name: 'cURL' },
    { id: 'js', name: 'JavaScript' },
    { id: 'python', name: 'Python' },
    { id: 'java', name: 'Java' },
    { id: 'csharp', name: 'C#' },
    { id: 'go', name: 'Go / C++' },
  ];

  const categories = [
    'ALL', 
    'User Safety', 
    'Threat Watchlist', 
    'Reports & Appeals', 
    'Partner Bot API', 
    'Custom Banlists', 
    'Guild Node Management'
  ];

  const endpoints: EndpointDoc[] = [
    // 1. User Safety
    {
      id: 'get-user-profile',
      method: 'GET',
      path: '/api/v1/public/user/:userId',
      defaultSamplePath: '/api/v1/public/user/123456789012345678',
      title: 'Detailed User Safety Profile',
      category: 'User Safety',
      requiresAuth: true,
      description: 'Retrieve full safety status for a Discord User ID or VRChat User ID (usr_...), including global ban state, reputation score, age verification badge, and threat indicators.',
      params: [
        { name: 'x-api-key', type: 'string', location: 'header', required: true, description: 'Your issued Developer API Key' },
        { name: 'userId', type: 'string', location: 'path', required: true, description: '18-digit Discord Snowflake ID or VRChat User ID (e.g. usr_1234...)' }
      ],
      responseSchema: `{
  "id": "123456789012345678",
  "username": "example_user",
  "displayName": "Example User",
  "avatarUrl": "https://cdn.discordapp.com/avatars/...",
  "reputation": {
    "score": 15,
    "isTrusted": true,
    "warningsCount": 0
  },
  "ban": {
    "isBanned": false,
    "reason": null,
    "type": null,
    "expiresAt": null
  },
  "verification": {
    "isVerified": true,
    "verifiedAt": "2026-01-15T08:30:00Z"
  },
  "vrchat": {
    "vrchatUserId": "usr_8fa091bb-20e1-4bd2-9b2f-3d1221199a41",
    "vrchatUsername": "ExampleVRC",
    "linkedAlts": []
  }
}`
    },
    {
      id: 'get-quick-check',
      method: 'GET',
      path: '/api/v1/public/check/:userId',
      defaultSamplePath: '/api/v1/public/check/123456789012345678',
      title: 'Rapid Threat & Ban Boolean Check',
      category: 'User Safety',
      requiresAuth: true,
      description: 'Ultra-lightweight endpoint optimized for bot middleware to instantly determine if an incoming user is blacklisted or high-risk.',
      params: [
        { name: 'x-api-key', type: 'string', location: 'header', required: true, description: 'Your issued Developer API Key' },
        { name: 'userId', type: 'string', location: 'path', required: true, description: 'Target Discord Snowflake ID or VRChat User ID' }
      ],
      responseSchema: `{
  "isBanned": false,
  "isThreat": false,
  "reputationScore": 15,
  "isVerified": true,
  "threatLevel": "LOW"
}`
    },
    {
      id: 'get-reputation',
      method: 'GET',
      path: '/api/v1/public/reputation/:userId',
      defaultSamplePath: '/api/v1/public/reputation/123456789012345678',
      title: 'Fast Reputation & Trust Query',
      category: 'User Safety',
      requiresAuth: true,
      description: 'Query positive or negative community standing, vouch count, and automated trustworthiness rating.',
      params: [
        { name: 'x-api-key', type: 'string', location: 'header', required: true, description: 'Your issued Developer API Key' },
        { name: 'userId', type: 'string', location: 'path', required: true, description: 'Target Discord User ID' }
      ],
      responseSchema: `{
  "userId": "123456789012345678",
  "score": 25,
  "tier": "TRUSTED",
  "vouchCount": 8,
  "incidentCount": 0,
  "lastEvaluated": "2026-03-01T12:00:00Z"
}`
    },
    {
      id: 'get-unified-lookup',
      method: 'GET',
      path: '/api/v1/public/lookup/:query',
      defaultSamplePath: '/api/v1/public/lookup/usr_8fa091bb-20e1-4bd2-9b2f-3d1221199a41',
      title: 'Unified Multi-Platform Search',
      category: 'User Safety',
      requiresAuth: true,
      description: 'Search across the entire safety database by Discord ID, username handle, or VRChat User ID / Display Name.',
      params: [
        { name: 'x-api-key', type: 'string', location: 'header', required: true, description: 'Your issued Developer API Key' },
        { name: 'query', type: 'string', location: 'path', required: true, description: 'Snowflake ID, VRC ID (usr_...), or exact handle' }
      ],
      responseSchema: `{
  "results": [
    {
      "platform": "vrchat",
      "vrchatUserId": "usr_8fa091bb-20e1-4bd2-9b2f-3d1221199a41",
      "vrchatUsername": "ExampleVRC",
      "isBanned": false,
      "linkedDiscordId": "123456789012345678"
    }
  ]
}`
    },

    {
      id: 'get-geo-compliance',
      method: 'GET',
      path: '/api/geo',
      defaultSamplePath: '/api/geo',
      title: 'Geo Visitor Locale & Social Age Requirement API',
      category: 'User Safety',
      description: 'Detects the visiting user country and locale, returning the legally mandated minimal age requirement for social media platforms and whether government ID verification is required for that jurisdiction.',
      params: [
        { name: 'country', type: 'string', location: 'query', required: false, description: 'Optional 2-letter ISO country code override (e.g. US, DE, AU, FR, KR, GB)' },
        { name: 'locale', type: 'string', location: 'query', required: false, description: 'Optional locale tag override (e.g. en-US, de-DE, ko-KR)' }
      ],
      responseSchema: `{
  "success": true,
  "locale": "en-US",
  "countryCode": "US",
  "countryName": "United States",
  "minimalAgeRequirement": 13,
  "minAgeSocial": 13,
  "idVerificationRequired": false,
  "isIdVerificationRequired": false,
  "regulatoryFramework": "COPPA (15 U.S.C. §§ 6501–6506)",
  "notes": "Federal COPPA baseline age is 13. State statutes enforce age verification and parental approval on high-risk platforms.",
  "clientIp": "192.0.2.1",
  "detectedFrom": "cf_ipcountry_header"
}`
    },

    // 2. Threat Watchlist
    {
      id: 'get-watchlist',
      method: 'GET',
      path: '/api/v1/public/watchlist',
      defaultSamplePath: '/api/v1/public/watchlist',
      title: 'High-Priority Threat Watchlist',
      category: 'Threat Watchlist',
      requiresAuth: true,
      description: 'Returns the feed of confirmed dangerous individuals, serial raiders, predatory accounts, and active network alerts.',
      params: [
        { name: 'x-api-key', type: 'string', location: 'header', required: true, description: 'Your issued Developer API Key' },
        { name: 'limit', type: 'integer', location: 'query', required: false, description: 'Results limit (default: 50, max: 100)' },
        { name: 'severity', type: 'string', location: 'query', required: false, description: 'Filter by severity (CRITICAL, HIGH, MEDIUM)' }
      ],
      responseSchema: `{
  "count": 42,
  "entries": [
    {
      "id": "100200300400500600",
      "tag": "bad_actor#0000",
      "reason": "Severe Raiding & Harassment Network Coordinator",
      "severity": "CRITICAL",
      "addedAt": "2026-02-10T14:22:00Z",
      "evidenceCount": 4,
      "vrchatAccounts": ["usr_1111-2222-3333"]
    }
  ]
}`
    },
    {
      id: 'get-watchlist-dossier',
      method: 'GET',
      path: '/api/v1/public/watchlist/:userId',
      defaultSamplePath: '/api/v1/public/watchlist/100200300400500600',
      title: 'Individual Threat Dossier & Evidence',
      category: 'Threat Watchlist',
      requiresAuth: true,
      description: 'Retrieve investigative dossier, redacted proof screenshots, linked alternate accounts, and moderation timeline for a specific offender.',
      params: [
        { name: 'x-api-key', type: 'string', location: 'header', required: true, description: 'Your issued Developer API Key' },
        { name: 'userId', type: 'string', location: 'path', required: true, description: 'Target Discord or VRChat User ID' }
      ],
      responseSchema: `{
  "userId": "100200300400500600",
  "alias": "BadActorNet",
  "threatType": "MALICIOUS_RAID_ORGANIZER",
  "status": "GLOBALLY_BANNED",
  "evidence": [
    {
      "type": "SCREENSHOT",
      "url": "https://cdn.besafenetwork.org/evidence/e_9981.jpg",
      "description": "Coordination chat logs"
    }
  ],
  "associatedAlts": ["usr_1111-2222-3333", "200300400500600700"]
}`
    },

    // 3. Reports & Appeals
    {
      id: 'post-submit-report',
      method: 'POST',
      path: '/api/v1/public/report',
      defaultSamplePath: '/api/v1/public/report',
      title: 'Submit Safety Incident Report',
      category: 'Reports & Appeals',
      requiresAuth: true,
      description: 'Submit an incident report against a dangerous Discord user or VRChat user with description, evidence URLs, and optional reporter notification address.',
      params: [
        { name: 'x-api-key', type: 'string', location: 'header', required: true, description: 'Your issued Developer API Key' },
        { name: 'targetUserId', type: 'string', location: 'body', required: true, description: 'Target Discord snowflake ID or VRChat user ID' },
        { name: 'reason', type: 'string', location: 'body', required: true, description: 'Detailed justification of the safety violation' },
        { name: 'evidence', type: 'array', location: 'body', required: false, description: 'Array of valid proof URLs or base64 image data' },
        { name: 'reporterUserId', type: 'string', location: 'body', required: false, description: 'Reporter Discord ID or Email address to receive updates' },
        { name: 'vrchatUsername', type: 'string', location: 'body', required: false, description: 'Associated VRChat display name if applicable' }
      ],
      sampleBody: {
        targetUserId: "987654321098765432",
        reason: "User distributed malicious token grabber links in voice lobbies.",
        evidence: ["https://example.com/screenshot1.png"],
        reporterUserId: "reporter@example.com",
        vrchatUsername: "SuspiciousAvatar"
      },
      responseSchema: `{
  "success": true,
  "reportId": "rep_67bc418a01f92e",
  "message": "Report logged and assigned to staff triage queue."
}`
    },
    {
      id: 'post-submit-appeal',
      method: 'POST',
      path: '/api/v1/public/appeal',
      defaultSamplePath: '/api/v1/public/appeal',
      title: 'Submit Ban Dispute Appeal',
      category: 'Reports & Appeals',
      requiresAuth: true,
      description: 'File an administrative dispute request against a global ban or blacklisting decision.',
      params: [
        { name: 'x-api-key', type: 'string', location: 'header', required: true, description: 'Your issued Developer API Key' },
        { name: 'userId', type: 'string', location: 'body', required: true, description: 'Your Discord Snowflake ID or VRChat User ID' },
        { name: 'email', type: 'string', location: 'body', required: true, description: 'Contact email to receive resolution notification' },
        { name: 'reason', type: 'string', location: 'body', required: true, description: 'Explanation and context defending your appeal' },
        { name: 'evidence', type: 'array', location: 'body', required: false, description: 'Supporting evidence links or images' }
      ],
      sampleBody: {
        userId: "123456789012345678",
        email: "user@example.com",
        reason: "My account was compromised on March 2nd and has since been secured with 2FA.",
        evidence: ["https://example.com/support_ticket.png"]
      },
      responseSchema: `{
  "success": true,
  "appealId": "apl_77af11209cc",
  "status": "PENDING_REVIEW",
  "message": "Appeal successfully submitted. You will receive an email upon review."
}`
    },
    {
      id: 'get-appeal-status',
      method: 'GET',
      path: '/api/v1/public/appeal-status/:userId',
      defaultSamplePath: '/api/v1/public/appeal-status/123456789012345678',
      title: 'Check Appeal Review Status',
      category: 'Reports & Appeals',
      requiresAuth: true,
      description: 'Check the real-time status, investigator notes, or decision for a submitted appeal.',
      params: [
        { name: 'x-api-key', type: 'string', location: 'header', required: true, description: 'Your issued Developer API Key' },
        { name: 'userId', type: 'string', location: 'path', required: true, description: 'Discord User ID associated with appeal' }
      ],
      responseSchema: `{
  "hasActiveAppeal": true,
  "status": "UNDER_INVESTIGATION",
  "submittedAt": "2026-03-02T10:15:00Z",
  "lastStaffNote": "Awaiting security log verification."
}`
    },
    {
      id: 'post-apply-api-key',
      method: 'POST',
      path: '/api/v1/public/apply-key',
      defaultSamplePath: '/api/v1/public/apply-key',
      title: 'Apply for Developer API Key',
      category: 'Reports & Appeals',
      description: 'Request elevated Developer / Partner API credentials for high-throughput automated safety pipelines.',
      params: [
        { name: 'projectName', type: 'string', location: 'body', required: true, description: 'Name of bot or safety integration' },
        { name: 'ownerDiscordId', type: 'string', location: 'body', required: true, description: 'Discord Snowflake ID of the bot author' },
        { name: 'contactEmail', type: 'string', location: 'body', required: true, description: 'Official contact email' },
        { name: 'intendedUse', type: 'string', location: 'body', required: true, description: 'Detailed operational overview' }
      ],
      sampleBody: {
        projectName: "Aegis Guard Bot",
        ownerDiscordId: "123456789012345678",
        contactEmail: "developer@aegisguard.io",
        intendedUse: "Real-time auto-moderation for 200+ partnered community servers."
      },
      responseSchema: `{
  "success": true,
  "requestId": "req_key_991823",
  "message": "Application submitted for administrative review."
}`
    },

    // 4. Partner Bot API (Elevated)
    {
      id: 'post-enterprise-age-verify',
      method: 'POST',
      path: '/api/v1/enterprise/age-verify',
      defaultSamplePath: '/api/v1/enterprise/age-verify',
      title: 'Enterprise Age Verification Check & Webhook',
      category: 'Partner Bot API',
      requiresAuth: true,
      description: 'Check if an external website or platform user is verified 18+ by their email address. If verified, sends a signed POST callback to your registered webhook with mail, userid, dob, and status: approved. If denied/unverified, sends a POST callback with status: denied.',
      params: [
        { name: 'Authorization', type: 'string', location: 'header', required: true, description: 'Bearer <your_enterprise_token> or x-api-key' },
        { name: 'mail', type: 'string', location: 'body', required: true, description: 'User email address to check for verified status' },
        { name: 'userid', type: 'string', location: 'body', required: false, description: 'User ID for that specific external platform' },
        { name: 'callbackUrl', type: 'string', location: 'body', required: false, description: 'Optional override for the destination POST webhook endpoint' }
      ],
      sampleBody: {
        mail: "user@example.com",
        userid: "external_usr_84920",
        callbackUrl: "https://yourwebsite.com/api/age-verify-callback"
      },
      responseSchema: `{
  "success": true,
  "status": "approved",
  "mail": "user@example.com",
  "userid": "external_usr_84920",
  "dob": "1999-06-15",
  "callbackUrl": "https://yourwebsite.com/api/age-verify-callback",
  "callbackDelivered": true,
  "callbackHttpStatus": 200,
  "message": "Age verification verified: user is confirmed 18+"
}`
    },
    {
      id: 'post-private-verify',
      method: 'POST',
      path: '/api/v1/private/verify',
      defaultSamplePath: '/api/v1/private/verify',
      title: 'Programmatic 18+ Verification Request',
      category: 'Partner Bot API',
      requiresAuth: true,
      description: 'Submit a user for manual 18+ age verification review directly from your partner bot or web dashboard.',
      params: [
        { name: 'x-api-key', type: 'string', location: 'header', required: true, description: 'Your issued Developer API Key' },
        { name: 'userId', type: 'string', location: 'body', required: true, description: 'Target Discord User ID to verify' },
        { name: 'idPhoto', type: 'string', location: 'body', required: true, description: 'Base64 encoded string of photo ID' },
        { name: 'facePhoto', type: 'string', location: 'body', required: true, description: 'Base64 encoded string of live selfie' },
        { name: 'dob', type: 'string', location: 'body', required: true, description: 'User birth date (YYYY-MM-DD)' }
      ],
      sampleBody: {
        userId: "123456789012345678",
        idPhoto: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
        facePhoto: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
        dob: "2002-04-12"
      },
      responseSchema: `{
  "success": true,
  "requestId": "vrf_2026_9901",
  "message": "Verification request queued for investigator review."
}`
    },
    {
      id: 'post-private-ban',
      method: 'POST',
      path: '/api/v1/private/ban',
      defaultSamplePath: '/api/v1/private/ban',
      title: 'Remote Partner Bot Global Ban Sync',
      category: 'Partner Bot API',
      requiresAuth: true,
      description: 'Trigger an immediate global threat ban across all connected Discord servers and VRChat groups.',
      params: [
        { name: 'x-api-key', type: 'string', location: 'header', required: true, description: 'Your issued Developer API Key' },
        { name: 'userId', type: 'string', location: 'body', required: true, description: 'Target Discord Snowflake ID or VRChat User ID' },
        { name: 'reason', type: 'string', location: 'body', required: true, description: 'Reason for global ban' },
        { name: 'vrchatUserId', type: 'string', location: 'body', required: false, description: 'Linked VRChat User ID (usr_...)' },
        { name: 'evidence', type: 'array', location: 'body', required: false, description: 'Array of evidence proof URLs' }
      ],
      sampleBody: {
        userId: "888777666555444333",
        reason: "Malicious raiding bot execution",
        vrchatUserId: "usr_a1b2c3d4-e5f6-7890",
        evidence: ["https://cdn.partnerbot.com/logs/raid_12.json"]
      },
      responseSchema: `{
  "success": true,
  "banned": true,
  "userId": "888777666555444333",
  "enforcedDiscordGuilds": 14,
  "enforcedVRChatGroups": 3
}`
    },
    {
      id: 'post-private-unban',
      method: 'POST',
      path: '/api/v1/private/unban',
      defaultSamplePath: '/api/v1/private/unban',
      title: 'Remote Global Unban Request',
      category: 'Partner Bot API',
      requiresAuth: true,
      description: 'Lifts global ban status and initiates automatic unbans across Discord guilds and connected VRChat groups with a 20-second verification sweep.',
      params: [
        { name: 'x-api-key', type: 'string', location: 'header', required: true, description: 'Your issued Developer API Key' },
        { name: 'userId', type: 'string', location: 'body', required: true, description: 'Target Discord User ID to unban' },
        { name: 'reason', type: 'string', location: 'body', required: true, description: 'Administrative unban reason' }
      ],
      sampleBody: {
        userId: "888777666555444333",
        reason: "Dispute resolved by Lead Security Officer"
      },
      responseSchema: `{
  "success": true,
  "unbanned": true,
  "userId": "888777666555444333",
  "message": "Global unban initiated across all Discord guilds and VRChat groups. Follow-up 20s verification scheduled."
}`
    },
    {
      id: 'post-private-rep-adjust',
      method: 'POST',
      path: '/api/v1/private/rep-adjust',
      defaultSamplePath: '/api/v1/private/rep-adjust',
      title: 'Programmatic Reputation Delta Adjustment',
      category: 'Partner Bot API',
      requiresAuth: true,
      description: 'Adjust reputation points up or down based on verified in-game behavior or bot moderation actions.',
      params: [
        { name: 'x-api-key', type: 'string', location: 'header', required: true, description: 'Your issued Developer API Key' },
        { name: 'userId', type: 'string', location: 'body', required: true, description: 'Target Discord User ID' },
        { name: 'delta', type: 'number', location: 'body', required: true, description: 'Score delta (-50 to +50)' },
        { name: 'reason', type: 'string', location: 'body', required: true, description: 'Reason for score modification' }
      ],
      sampleBody: {
        userId: "123456789012345678",
        delta: 5,
        reason: "Completed 30 days of active community helper status"
      },
      responseSchema: `{
  "success": true,
  "userId": "123456789012345678",
  "previousScore": 20,
  "newScore": 25
}`
    },

    // 5. Custom Banlists
    {
      id: 'get-custom-banlist',
      method: 'GET',
      path: '/api/v1/banlists/:listId',
      defaultSamplePath: '/api/v1/banlists/bl_custom_vrchat_raiders',
      title: 'Query Custom Banlist Entries',
      category: 'Custom Banlists',
      requiresAuth: true,
      description: 'Fetch all entries, targets, and metadata from an organization-specific or community custom banlist.',
      params: [
        { name: 'x-api-key', type: 'string', location: 'header', required: true, description: 'Developer API Key' },
        { name: 'listId', type: 'string', location: 'path', required: true, description: 'Unique Banlist ID slug' }
      ],
      responseSchema: `{
  "listId": "bl_custom_vrchat_raiders",
  "name": "VRChat Crash Avatar Distributers",
  "entryCount": 18,
  "entries": [
    {
      "type": "vrchat",
      "targetId": "usr_99182390-11aa-4bb2",
      "reason": "Crashing public event instances",
      "addedAt": "2026-02-18T19:00:00Z"
    }
  ]
}`
    },
    {
      id: 'post-banlist-entry',
      method: 'POST',
      path: '/api/v1/banlists/:listId/entries',
      defaultSamplePath: '/api/v1/banlists/bl_custom_vrchat_raiders/entries',
      title: 'Add Entry to Custom Banlist',
      category: 'Custom Banlists',
      requiresAuth: true,
      description: 'Append a new Discord Snowflake ID or VRChat User ID to your custom blacklist.',
      params: [
        { name: 'x-api-key', type: 'string', location: 'header', required: true, description: 'Developer API Key' },
        { name: 'listId', type: 'string', location: 'path', required: true, description: 'Target Banlist ID' },
        { name: 'type', type: 'string', location: 'body', required: true, description: '"discord" or "vrchat"' },
        { name: 'targetId', type: 'string', location: 'body', required: true, description: 'Discord snowflake or VRC user ID' },
        { name: 'reason', type: 'string', location: 'body', required: true, description: 'Entry violation reason' }
      ],
      sampleBody: {
        type: "vrchat",
        targetId: "usr_abc12345-6789-0000",
        reason: "Attempted crash exploits in club world"
      },
      responseSchema: `{
  "success": true,
  "entryId": "ent_998124",
  "listId": "bl_custom_vrchat_raiders",
  "message": "Target added to custom banlist."
}`
    },
    {
      id: 'delete-banlist-entry',
      method: 'DELETE',
      path: '/api/v1/banlists/:listId/entries/:targetId',
      defaultSamplePath: '/api/v1/banlists/bl_custom_vrchat_raiders/entries/usr_abc12345-6789-0000',
      title: 'Remove Entry from Custom Banlist',
      category: 'Custom Banlists',
      requiresAuth: true,
      description: 'Delete a previously blacklisted entity from the custom banlist.',
      params: [
        { name: 'x-api-key', type: 'string', location: 'header', required: true, description: 'Developer API Key' },
        { name: 'listId', type: 'string', location: 'path', required: true, description: 'Target Banlist ID' },
        { name: 'targetId', type: 'string', location: 'path', required: true, description: 'ID to remove' }
      ],
      responseSchema: `{
  "success": true,
  "deleted": true,
  "targetId": "usr_abc12345-6789-0000"
}`
    },
    {
      id: 'get-banlist-export',
      method: 'GET',
      path: '/api/v1/banlists/:listId/export',
      defaultSamplePath: '/api/v1/banlists/bl_custom_vrchat_raiders/export?format=json',
      title: 'Export Banlist (JSON / CSV)',
      category: 'Custom Banlists',
      requiresAuth: true,
      description: 'Download full banlist in standard JSON or CSV format for direct firewall / server bot ingestion.',
      params: [
        { name: 'x-api-key', type: 'string', location: 'header', required: true, description: 'Developer API Key' },
        { name: 'listId', type: 'string', location: 'path', required: true, description: 'Target Banlist ID' },
        { name: 'format', type: 'string', location: 'query', required: false, description: '"json" or "csv" (default: json)' }
      ],
      responseSchema: `[
  { "type": "discord", "id": "111222333444555666", "reason": "Server nuke attempt" },
  { "type": "vrchat", "id": "usr_77889900-1122", "reason": "Hate speech avatar" }
]`
    },

    // 6. Guild Node Management
    {
      id: 'get-guild-settings',
      method: 'GET',
      path: '/api/v1/guilds/:guildId/settings',
      defaultSamplePath: '/api/v1/guilds/998877665544332211/settings',
      title: 'Retrieve Guild Security Settings',
      category: 'Guild Node Management',
      requiresAuth: true,
      description: 'Fetch security automation rules, channel routing, and VRChat bot binding for a registered Discord server node.',
      params: [
        { name: 'x-api-key', type: 'string', location: 'header', required: true, description: 'Server Admin API Key' },
        { name: 'guildId', type: 'string', location: 'path', required: true, description: '18-digit Discord Guild ID' }
      ],
      responseSchema: `{
  "guildId": "998877665544332211",
  "name": "Aegis Community Hub",
  "settings": {
    "autoBanEnabled": true,
    "autoUnbanDiscordEnabled": true,
    "vrchatBotEnabled": true,
    "vrchatGroupId": "grp_8819230-11bb",
    "vrchatAutoBanEnabled": true,
    "autoUnbanVRChatEnabled": true,
    "staffChannelId": "112233445566778899",
    "logChannelId": "998877665544332211",
    "staffRoleId": "998811223344556677",
    "banlistSelectionMode": "both",
    "customBanlistId": "65e219fb0a91cb",
    "autoBanThreshold": -10,
    "warningThreshold": 3,
    "tempBanDuration": 7,
    "verificationEnabled": true,
    "verificationRoleId": "887766554433221100",
    "ageRoleEnabled": false,
    "ageRoleId": ""
  }
}`
    },
    {
      id: 'put-guild-settings',
      method: 'PUT',
      path: '/api/v1/guilds/:guildId/settings',
      defaultSamplePath: '/api/v1/guilds/998877665544332211/settings',
      title: 'Update Guild Security Config',
      category: 'Guild Node Management',
      requiresAuth: true,
      description: 'Modify automated defense flags, thresholds, or linked VRChat group settings for a Discord guild.',
      params: [
        { name: 'x-api-key', type: 'string', location: 'header', required: true, description: 'Server Admin API Key' },
        { name: 'guildId', type: 'string', location: 'path', required: true, description: '18-digit Discord Guild ID' },
        { name: 'name', type: 'string', location: 'body', required: false, description: 'Friendly server / guild node name' },
        { name: 'autoBanEnabled', type: 'boolean', location: 'body', required: false, description: 'Enable/disable auto-ban on global threat trigger' },
        { name: 'autoUnbanDiscordEnabled', type: 'boolean', location: 'body', required: false, description: 'Enable auto-unban on Discord when bans are lifted globally' },
        { name: 'vrchatBotEnabled', type: 'boolean', location: 'body', required: false, description: 'Enable/disable linked VRChat group bans' },
        { name: 'vrchatGroupId', type: 'string', location: 'body', required: false, description: 'Target VRChat group ID to protect (e.g. grp_8819230-11bb)' },
        { name: 'vrchatAutoBanEnabled', type: 'boolean', location: 'body', required: false, description: 'Automatically execute VRChat group ban on detection' },
        { name: 'autoUnbanVRChatEnabled', type: 'boolean', location: 'body', required: false, description: 'Enable auto-unban on VRChat when global ban is lifted' },
        { name: 'logChannelId', type: 'string', location: 'body', required: false, description: 'Discord Channel ID for real-time audit logging' },
        { name: 'staffChannelId', type: 'string', location: 'body', required: false, description: 'Discord Channel ID for staff moderation alerts' },
        { name: 'staffRoleId', type: 'string', location: 'body', required: false, description: 'Discord Role ID granted staff privileges' },
        { name: 'customBanlistId', type: 'string', location: 'body', required: false, description: 'Subscribed Custom Banlist ID for server-specific rules' },
        { name: 'banlistSelectionMode', type: 'string', location: 'body', required: false, description: 'Enforcement mode: "both", "global", or "custom"' },
        { name: 'autoBanThreshold', type: 'number', location: 'body', required: false, description: 'Reputation score threshold below which auto-ban triggers' },
        { name: 'warningThreshold', type: 'number', location: 'body', required: false, description: 'Incident warning count before automated action' },
        { name: 'tempBanDuration', type: 'number', location: 'body', required: false, description: 'Temporary ban duration in days (default: 7)' },
        { name: 'verificationEnabled', type: 'boolean', location: 'body', required: false, description: 'Enable automated age & identity verification gate' },
        { name: 'verificationRoleId', type: 'string', location: 'body', required: false, description: 'Discord Role ID granted upon successful verification' },
        { name: 'ageRoleEnabled', type: 'boolean', location: 'body', required: false, description: 'Enable 18+ adult age gate role assignment' },
        { name: 'ageRoleId', type: 'string', location: 'body', required: false, description: 'Discord Role ID granted to age-verified 18+ members' }
      ],
      sampleBody: {
        autoBanEnabled: true,
        autoUnbanDiscordEnabled: true,
        vrchatBotEnabled: true,
        vrchatGroupId: "grp_8819230-11bb",
        vrchatAutoBanEnabled: true,
        autoUnbanVRChatEnabled: true,
        logChannelId: "998877665544332211",
        staffChannelId: "112233445566778899",
        staffRoleId: "998811223344556677",
        banlistSelectionMode: "both",
        verificationEnabled: true
      },
      responseSchema: `{
  "success": true,
  "guildId": "998877665544332211",
  "name": "Aegis Community Hub",
  "message": "Guild node configuration updated successfully.",
  "settings": {
    "autoBanEnabled": true,
    "autoUnbanDiscordEnabled": true,
    "vrchatBotEnabled": true,
    "vrchatGroupId": "grp_8819230-11bb",
    "vrchatAutoBanEnabled": true,
    "autoUnbanVRChatEnabled": true,
    "logChannelId": "998877665544332211",
    "staffChannelId": "112233445566778899",
    "staffRoleId": "998811223344556677",
    "banlistSelectionMode": "both",
    "verificationEnabled": true
  }
}`
    },
    {
      id: 'post-guild-sync-bans',
      method: 'POST',
      path: '/api/v1/guilds/:guildId/sync-bans',
      defaultSamplePath: '/api/v1/guilds/998877665544332211/sync-bans',
      title: 'Trigger Instant Cross-Guild Ban Sync',
      category: 'Guild Node Management',
      requiresAuth: true,
      description: 'Forces an immediate audit scan of all current members in the guild against the BeSafe Network global blacklist.',
      params: [
        { name: 'x-api-key', type: 'string', location: 'header', required: true, description: 'Server Admin API Key' },
        { name: 'guildId', type: 'string', location: 'path', required: true, description: 'Discord Guild ID' }
      ],
      responseSchema: `{
  "success": true,
  "guildId": "998877665544332211",
  "scannedMembers": 1420,
  "enforcedBans": 2,
  "syncedAt": "2026-03-02T12:44:10Z"
}`
    }
  ];

  // Filtering
  const filteredEndpoints = endpoints.filter(ep => {
    const matchesCategory = selectedCategory === 'ALL' || ep.category === selectedCategory;
    const matchesMethod = selectedMethod === 'ALL' || ep.method === selectedMethod;
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      ep.title.toLowerCase().includes(query) ||
      ep.path.toLowerCase().includes(query) ||
      ep.description.toLowerCase().includes(query) ||
      ep.category.toLowerCase().includes(query);
    return matchesCategory && matchesMethod && matchesSearch;
  });

  const selectedEndpointObj = endpoints.find(e => e.id === testerEndpoint) || endpoints[0];

  const handleSelectEndpointForTesting = (ep: EndpointDoc) => {
    setTesterEndpoint(ep.id);
    setTesterPathInput(ep.defaultSamplePath || ep.path);
    setTesterBodyInput(ep.sampleBody ? JSON.stringify(ep.sampleBody, null, 2) : '');
    setTesterResult(null);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleRunTester = async () => {
    if (!selectedEndpointObj) return;
    setIsTesting(true);
    setTesterResult(null);
    const startTime = performance.now();

    try {
      const headers: Record<string, string> = {
        'Accept': 'application/json'
      };

      if (selectedEndpointObj.requiresAuth || apiKeyInput.trim()) {
        headers['x-api-key'] = apiKeyInput.trim();
      }

      const options: RequestInit = {
        method: selectedEndpointObj.method,
        headers
      };

      if (selectedEndpointObj.method !== 'GET' && testerBodyInput.trim()) {
        headers['Content-Type'] = 'application/json';
        options.body = testerBodyInput.trim();
      }

      const res = await fetch(testerPathInput.trim(), options);
      const endTime = performance.now();
      const elapsed = Math.round(endTime - startTime);

      let data: any;
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }

      setTesterResult({
        status: res.status,
        data,
        time: elapsed
      });
    } catch (err: any) {
      const endTime = performance.now();
      setTesterResult({
        status: 500,
        data: { error: err.message || 'Network request failed' },
        time: Math.round(endTime - startTime)
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Code generator
  const generateSnippet = (ep: EndpointDoc, lang: string) => {
    const fullUrl = `${baseUrl}${ep.defaultSamplePath || ep.path}`;
    const hasAuth = ep.requiresAuth;

    switch (lang) {
      case 'curl': {
        let snippet = `curl -X ${ep.method} "${fullUrl}"`;
        if (hasAuth) {
          snippet += ` \\\n  -H "x-api-key: YOUR_API_KEY"`;
        }
        if (ep.sampleBody) {
          snippet += ` \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(ep.sampleBody)}'`;
        }
        return snippet;
      }
      case 'js': {
        if (ep.method === 'GET') {
          return `// Node.js 18+ or Modern Browser
const response = await fetch("${fullUrl}", {
  headers: {
    ${hasAuth ? '"x-api-key": "YOUR_API_KEY",' : ''}
    "Accept": "application/json"
  }
});
const data = await response.json();
console.log(data);`;
        }
        return `const response = await fetch("${fullUrl}", {
  method: "${ep.method}",
  headers: {
    "Content-Type": "application/json",
    ${hasAuth ? '"x-api-key": "YOUR_API_KEY",' : ''}
    "Accept": "application/json"
  },
  body: JSON.stringify(${JSON.stringify(ep.sampleBody || {}, null, 2)})
});
const data = await response.json();
console.log(data);`;
      }
      case 'python': {
        let snippet = `import requests\n\nurl = "${fullUrl}"\nheaders = {\n`;
        if (hasAuth) snippet += `    "x-api-key": "YOUR_API_KEY",\n`;
        snippet += `    "Accept": "application/json"\n}\n\n`;
        if (ep.sampleBody) {
          snippet += `payload = ${JSON.stringify(ep.sampleBody, null, 4)}\n\nresponse = requests.${ep.method.toLowerCase()}(url, json=payload, headers=headers)\n`;
        } else {
          snippet += `response = requests.${ep.method.toLowerCase()}(url, headers=headers)\n`;
        }
        snippet += `print(response.status_code)\nprint(response.json())`;
        return snippet;
      }
      case 'java': {
        return `// Java 11+ HttpClient
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class BeSafeClient {
    public static void main(String[] args) throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("${fullUrl}"))
            ${hasAuth ? '.header("x-api-key", "YOUR_API_KEY")' : ''}
            .header("Accept", "application/json")
            ${ep.sampleBody ? `.header("Content-Type", "application/json")
            .method("${ep.method}", HttpRequest.BodyPublishers.ofString("${JSON.stringify(ep.sampleBody).replace(/"/g, '\\"')}"))` : `.${ep.method}()`}
            .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        System.out.println(response.statusCode());
        System.out.println(response.body());
    }
}`;
      }
      case 'csharp': {
        return `// C# .NET 6+ HttpClient
using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

class Program {
    static async Task Main() {
        using var client = new HttpClient();
        ${hasAuth ? 'client.DefaultRequestHeaders.Add("x-api-key", "YOUR_API_KEY");' : ''}
        ${ep.sampleBody ? `var content = new StringContent(
            @"${JSON.stringify(ep.sampleBody, null, 2).replace(/"/g, '""')}",
            Encoding.UTF8,
            "application/json"
        );
        var response = await client.${ep.method === 'POST' ? 'PostAsync' : ep.method === 'PUT' ? 'PutAsync' : 'SendAsync'}("${fullUrl}", content);` : `var response = await client.${ep.method === 'GET' ? 'GetAsync' : ep.method === 'DELETE' ? 'DeleteAsync' : 'SendAsync'}("${fullUrl}");`}
        
        string result = await response.Content.ReadAsStringAsync();
        Console.WriteLine(result);
    }
}`;
      }
      case 'go': {
        return `package main

import (
	"fmt"
	"io"
	"net/http"
	${ep.sampleBody ? '"strings"' : ''}
)

func main() {
	client := &http.Client{}
	${ep.sampleBody ? `req, _ := http.NewRequest("${ep.method}", "${fullUrl}", strings.NewReader(\`${JSON.stringify(ep.sampleBody)}\`))` : `req, _ := http.NewRequest("${ep.method}", "${fullUrl}", nil)`}
	${hasAuth ? `req.Header.Set("x-api-key", "YOUR_API_KEY")` : ''}
	${ep.sampleBody ? `req.Header.Set("Content-Type", "application/json")` : ''}

	res, err := client.Do(req)
	if err != nil {
		panic(err)
	}
	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)
	fmt.Println(string(body))
}`;
      }
      default:
        return '';
    }
  };

  return (
    <div className="space-y-12">
      {/* Header Banner */}
      <div className="bg-[#141414] text-[#E4E3E0] p-8 md:p-12 border-4 border-[#141414] shadow-[-8px_8px_0px_0px_rgba(20,20,20,1)] dark:shadow-[-8px_8px_0px_0px_rgba(255,255,255,0.1)] relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-600 text-white font-mono text-xs font-bold uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5" /> BeSafe Network Developer Platform v1.0
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase font-mono">
            Unified API Documentation
          </h1>
          <p className="font-mono text-sm md:text-base opacity-80 leading-relaxed">
            Integrate real-time cross-platform ban enforcement, threat intelligence feeds, age verifications, and custom banlists into your Discord bots, VRChat instances, and community infrastructure.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              to="/request-api-key"
              className="px-5 py-2.5 bg-amber-500 text-[#141414] font-mono text-xs font-black uppercase hover:bg-amber-400 transition-colors flex items-center gap-2 shadow-[-3px_3px_0px_0px_rgba(255,255,255,0.4)] cursor-pointer"
            >
              <Key className="w-4 h-4" /> Request Developer API Key
            </Link>
            <button 
              type="button"
              onClick={() => scrollToSection('interactive-tester')}
              className="px-5 py-2.5 bg-white text-[#141414] font-mono text-xs font-black uppercase hover:bg-zinc-200 transition-colors flex items-center gap-2 shadow-[-3px_3px_0px_0px_rgba(255,255,255,0.4)] cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" /> Live API Tester
            </button>
            <button 
              type="button"
              onClick={() => scrollToSection('authentication')}
              className="px-5 py-2.5 bg-zinc-800 text-white border border-zinc-700 font-mono text-xs font-bold uppercase hover:bg-zinc-700 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Key className="w-4 h-4" /> Authentication Guide
            </button>
            <Link 
              to="/developers" 
              className="px-5 py-2.5 bg-indigo-600 text-white font-mono text-xs font-bold uppercase hover:bg-indigo-700 transition-colors flex items-center gap-2 cursor-pointer shadow-[-3px_3px_0px_0px_rgba(99,102,241,0.4)]"
            >
              <Code2 className="w-4 h-4" /> Enterprise Webhook Portal
            </Link>
            <Link 
              to="/report" 
              className="px-5 py-2.5 bg-red-700 text-white font-mono text-xs font-bold uppercase hover:bg-red-800 transition-colors flex items-center gap-2 cursor-pointer shadow-[-3px_3px_0px_0px_rgba(185,28,28,0.4)]"
            >
              <ShieldAlert className="w-4 h-4" /> Submit Report
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats / Overview Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#1A1A1A] p-5 border-2 border-[#141414] dark:border-[#3F3F46] shadow-[-4px_4px_0px_0px_rgba(20,20,20,1)]">
          <p className="font-mono text-xs text-zinc-500 uppercase">Total Endpoints</p>
          <p className="text-2xl font-mono font-black">{endpoints.length}</p>
          <p className="font-mono text-[10px] text-zinc-400 mt-1">Key-Protected v1 & Public Geo</p>
        </div>
        <button 
          type="button"
          onClick={() => handleCopy(`${baseUrl}/api/v1`, 'base-url-card')}
          title="Click to copy Base API URL"
          className="text-left w-full bg-white dark:bg-[#1A1A1A] p-5 border-2 border-[#141414] dark:border-[#3F3F46] shadow-[-4px_4px_0px_0px_rgba(20,20,20,1)] hover:border-red-600 dark:hover:border-red-500 hover:shadow-[-6px_6px_0px_0px_rgba(220,38,38,0.8)] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs text-zinc-500 uppercase">Base API URL</p>
            <span className="p-1 rounded bg-zinc-100 dark:bg-zinc-800 group-hover:bg-red-100 dark:group-hover:bg-red-950/60 transition-colors">
              {copiedId === 'base-url-card' ? (
                <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-zinc-500 group-hover:text-red-600 dark:group-hover:text-red-400" />
              )}
            </span>
          </div>
          <p className="font-mono font-bold text-xs truncate mt-1 text-red-600 dark:text-red-400">
            {baseUrl}/api/v1
          </p>
          <p className="font-mono text-[10px] text-zinc-400 mt-1 flex items-center justify-between">
            <span>HTTPS RESTful JSON</span>
            <span className="text-[9px] font-bold uppercase text-zinc-500 group-hover:text-red-600 dark:group-hover:text-red-400">
              {copiedId === 'base-url-card' ? '✓ Copied' : 'Click to copy'}
            </span>
          </p>
        </button>
        <div className="bg-white dark:bg-[#1A1A1A] p-5 border-2 border-[#141414] dark:border-[#3F3F46] shadow-[-4px_4px_0px_0px_rgba(20,20,20,1)]">
          <p className="font-mono text-xs text-zinc-500 uppercase">Platforms Supported</p>
          <p className="text-xl font-mono font-black">Discord + VRChat</p>
          <p className="font-mono text-[10px] text-zinc-400 mt-1">Cross-platform ID resolution</p>
        </div>
        <div className="bg-white dark:bg-[#1A1A1A] p-5 border-2 border-[#141414] dark:border-[#3F3F46] shadow-[-4px_4px_0px_0px_rgba(20,20,20,1)]">
          <p className="font-mono text-xs text-zinc-500 uppercase">Response Formats</p>
          <p className="text-xl font-mono font-black">JSON & CSV</p>
          <p className="font-mono text-[10px] text-zinc-400 mt-1">RFC 8259 Standard</p>
        </div>
      </div>

      {/* Authentication & Rate Limiting Section */}
      <div id="authentication" className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#1A1A1A] p-6 border-2 border-[#141414] dark:border-[#3F3F46] shadow-[-6px_6px_0px_0px_rgba(20,20,20,1)] space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/40 border border-amber-500">
              <Key className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="font-mono font-bold text-base uppercase">Authentication & Headers</h3>
              <p className="font-mono text-xs text-zinc-500">Required on all /api/v1/* endpoints (except Geo)</p>
            </div>
          </div>
          <p className="font-mono text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
            All <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5">/api/v1/*</code> developer endpoints require a valid Developer API key passed via the <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5">x-api-key</code> header. Only the Geo Compliance endpoints (<code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5">/api/geo</code> and <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5">/api/v1/geo</code>) are open without an API key:
          </p>
          <div className="bg-zinc-900 text-zinc-200 p-3 font-mono text-xs rounded border border-zinc-800 flex justify-between items-center">
            <code>x-api-key: your_issued_developer_api_key</code>
            <button 
              onClick={() => handleCopy('x-api-key: your_issued_developer_api_key', 'auth-header')}
              className="p-1 hover:text-white"
            >
              {copiedId === 'auth-header' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="flex items-center justify-between gap-2 pt-1">
            <p className="font-mono text-[11px] text-zinc-500">
              Need a Developer API key? Apply online in under a minute.
            </p>
            <Link
              to="/request-api-key"
              className="px-3 py-1.5 bg-amber-500 text-[#141414] font-mono text-[11px] font-black uppercase hover:bg-amber-400 transition-colors shrink-0"
            >
              Request API Key →
            </Link>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1A1A1A] p-6 border-2 border-[#141414] dark:border-[#3F3F46] shadow-[-6px_6px_0px_0px_rgba(20,20,20,1)] space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 border border-blue-500">
              <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-mono font-bold text-base uppercase">Rate Limits & Reliability</h3>
              <p className="font-mono text-xs text-zinc-500">Distributed Global Edge Protection</p>
            </div>
          </div>
          <div className="space-y-2 font-mono text-xs text-zinc-700 dark:text-zinc-300">
            <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
              <span>Public Unauthenticated Queries:</span>
              <span className="font-bold">60 req / min per IP</span>
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
              <span>Partner Bot API Key:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">UNLIMITED (No Rate Limit)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
              <span>VRChat Group Sync Interval:</span>
              <span className="font-bold text-amber-600">Throttled (1200ms)</span>
            </div>
          </div>
          <p className="font-mono text-[11px] text-zinc-500">
            HTTP 429 Too Many Requests will include a <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5">Retry-After</code> header indicating cooldown duration in seconds.
          </p>
        </div>
      </div>

      {/* Interactive Live API Tester Section */}
      <div id="interactive-tester" className="bg-[#141414] text-[#E4E3E0] p-6 md:p-8 border-4 border-[#141414] shadow-[-8px_8px_0px_0px_rgba(20,20,20,1)] dark:shadow-[-8px_8px_0px_0px_rgba(255,255,255,0.1)] space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 text-green-400 border border-green-500/50">
              <Play className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="font-mono text-xl font-bold uppercase tracking-tight">Interactive Live API Console</h2>
              <p className="font-mono text-xs opacity-70">Execute test requests in real-time against the live BeSafe Network backend.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-zinc-400 uppercase">Active API Key:</span>
            <input 
              type="text" 
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="Active key (x-api-key)"
              className="bg-zinc-900 border border-zinc-700 px-3 py-1 text-xs font-mono text-zinc-100 focus:outline-none focus:border-red-500 w-56"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Request Configurator */}
          <div className="lg:col-span-6 space-y-4">
            <div>
              <label className="block font-mono text-xs uppercase text-zinc-400 mb-1">Target Endpoint</label>
              <select 
                value={selectedEndpointObj.id}
                onChange={(e) => {
                  const ep = endpoints.find(x => x.id === e.target.value);
                  if (ep) handleSelectEndpointForTesting(ep);
                }}
                className="w-full bg-zinc-900 border border-zinc-700 p-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-red-500"
              >
                {endpoints.map(ep => (
                  <option key={ep.id} value={ep.id}>
                    [{ep.method}] {ep.path} — {ep.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-mono text-xs uppercase text-zinc-400 mb-1">Request Path / URL</label>
              <div className="flex">
                <span className={`px-3 py-2 text-xs font-mono font-black text-white flex items-center ${
                  selectedEndpointObj.method === 'GET' ? 'bg-blue-600' :
                  selectedEndpointObj.method === 'POST' ? 'bg-green-600' :
                  selectedEndpointObj.method === 'PUT' ? 'bg-amber-600' : 'bg-red-600'
                }`}>
                  {selectedEndpointObj.method}
                </span>
                <input 
                  type="text" 
                  value={testerPathInput}
                  onChange={(e) => setTesterPathInput(e.target.value)}
                  className="flex-1 bg-zinc-900 border border-zinc-700 px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            {selectedEndpointObj.method !== 'GET' && (
              <div>
                <label className="block font-mono text-xs uppercase text-zinc-400 mb-1">JSON Request Body</label>
                <textarea 
                  value={testerBodyInput}
                  onChange={(e) => setTesterBodyInput(e.target.value)}
                  rows={6}
                  placeholder="{}"
                  className="w-full bg-zinc-900 border border-zinc-700 p-3 font-mono text-xs text-zinc-100 focus:outline-none focus:border-red-500"
                />
              </div>
            )}

            <button 
              onClick={handleRunTester}
              disabled={isTesting}
              className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-mono text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-[-4px_4px_0px_0px_rgba(255,255,255,0.2)]"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Dispatching Request...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Send Request Now
                </>
              )}
            </button>
          </div>

          {/* Response Inspector */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center justify-between">
              <label className="block font-mono text-xs uppercase text-zinc-400">Response Inspector</label>
              {testerResult && (
                <div className="flex items-center gap-3 font-mono text-xs">
                  <span className={`px-2 py-0.5 font-bold ${
                    testerResult.status >= 200 && testerResult.status < 300 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/40' 
                      : 'bg-red-500/20 text-red-400 border border-red-500/40'
                  }`}>
                    HTTP {testerResult.status}
                  </span>
                  <span className="text-zinc-400">{testerResult.time} ms</span>
                </div>
              )}
            </div>

            <div className="bg-zinc-950 border border-zinc-800 p-4 h-[260px] overflow-auto font-mono text-xs text-zinc-300 relative rounded">
              {testerResult ? (
                <pre>{JSON.stringify(testerResult.data, null, 2)}</pre>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-2">
                  <Terminal className="w-8 h-8 opacity-40" />
                  <p>Click "Send Request Now" above to inspect real-time server output.</p>
                </div>
              )}
              {testerResult && (
                <button 
                  onClick={() => handleCopy(JSON.stringify(testerResult.data, null, 2), 'tester-output')}
                  className="absolute top-2 right-2 p-1.5 bg-zinc-800 text-zinc-400 hover:text-white rounded text-[10px] flex items-center gap-1"
                >
                  {copiedId === 'tester-output' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-[#1A1A1A] p-6 border-2 border-[#141414] dark:border-[#3F3F46] shadow-[-6px_6px_0px_0px_rgba(20,20,20,1)] space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-3.5 text-zinc-400" />
            <input 
              type="text"
              placeholder="Search endpoints by path, title, parameter, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-[#141414] dark:border-[#3F3F46] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Method Filter */}
          <div className="flex items-center gap-1 border border-[#141414] dark:border-[#3F3F46] p-1 bg-zinc-50 dark:bg-zinc-900">
            {['ALL', 'GET', 'POST', 'PUT', 'DELETE'].map(m => (
              <button
                key={m}
                onClick={() => setSelectedMethod(m)}
                className={`px-3 py-1 font-mono text-[11px] font-bold uppercase transition-colors ${
                  selectedMethod === m 
                    ? 'bg-[#141414] text-white dark:bg-white dark:text-[#141414]' 
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 font-mono text-xs uppercase font-bold transition-all ${
                selectedCategory === cat 
                  ? 'bg-red-600 text-white shadow-[-2px_2px_0px_0px_rgba(20,20,20,1)]' 
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Language Selector Bar */}
      <div className="flex items-center justify-between bg-zinc-200 dark:bg-zinc-900 px-4 py-2 border-2 border-[#141414] dark:border-[#3F3F46]">
        <span className="font-mono text-xs uppercase font-bold text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
          <Code2 className="w-4 h-4" /> Code Examples Language:
        </span>
        <div className="flex items-center gap-1">
          {languages.map(l => (
            <button
              key={l.id}
              onClick={() => setActiveLang(l.id as any)}
              className={`px-3 py-1 font-mono text-xs font-bold transition-colors ${
                activeLang === l.id 
                  ? 'bg-[#141414] text-white dark:bg-white dark:text-[#141414]' 
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
              }`}
            >
              {l.name}
            </button>
          ))}
        </div>
      </div>

      {/* Endpoints List */}
      <div className="space-y-8">
        {filteredEndpoints.length === 0 ? (
          <div className="bg-white dark:bg-[#1A1A1A] p-12 text-center border-2 border-[#141414] dark:border-[#3F3F46] shadow-[-6px_6px_0px_0px_rgba(20,20,20,1)] space-y-3">
            <AlertCircle className="w-10 h-10 mx-auto text-zinc-400" />
            <p className="font-mono font-bold text-sm uppercase">No Endpoints Match Your Filter</p>
            <p className="font-mono text-xs text-zinc-500">Try adjusting your search keywords or resetting the category filter.</p>
            <button 
              onClick={() => { setSelectedCategory('ALL'); setSelectedMethod('ALL'); setSearchQuery(''); }}
              className="px-4 py-2 bg-[#141414] text-white font-mono text-xs uppercase font-bold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredEndpoints.map(ep => (
            <div 
              key={ep.id}
              id={ep.id}
              className="bg-white dark:bg-[#1A1A1A] border-2 border-[#141414] dark:border-[#3F3F46] shadow-[-8px_8px_0px_0px_rgba(20,20,20,1)] overflow-hidden transition-all"
            >
              {/* Endpoint Header */}
              <div className="p-6 border-b border-[#141414] dark:border-[#3F3F46] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-50 dark:bg-zinc-900/50">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-1 text-xs font-mono font-black text-white ${
                      ep.method === 'GET' ? 'bg-blue-600' :
                      ep.method === 'POST' ? 'bg-green-600' :
                      ep.method === 'PUT' ? 'bg-amber-600' : 'bg-red-600'
                    }`}>
                      {ep.method}
                    </span>
                    <span className="font-mono text-sm font-black text-[#141414] dark:text-[#E4E3E0]">
                      {ep.path}
                    </span>
                    {ep.requiresAuth && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 border border-amber-500 text-amber-800 dark:text-amber-300 font-mono text-[10px] font-bold uppercase">
                        <Lock className="w-3 h-3" /> API Key Required
                      </span>
                    )}
                    <span className="px-2 py-0.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono text-[10px] uppercase">
                      {ep.category}
                    </span>
                  </div>
                  <h3 className="font-mono text-lg font-black text-[#141414] dark:text-[#E4E3E0]">
                    {ep.title}
                  </h3>
                  <p className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
                    {ep.description}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleSelectEndpointForTesting(ep)}
                    className="px-3 py-1.5 bg-white dark:bg-zinc-800 border border-[#141414] dark:border-[#3F3F46] hover:bg-zinc-100 font-mono text-xs font-bold uppercase flex items-center gap-1 shadow-[-2px_2px_0px_0px_rgba(20,20,20,1)]"
                  >
                    <Play className="w-3.5 h-3.5 fill-current text-green-600" /> Test In Console
                  </button>
                  <button 
                    onClick={() => handleCopy(`${baseUrl}${ep.path}`, `path-${ep.id}`)}
                    className="px-3 py-1.5 bg-white dark:bg-zinc-800 border border-[#141414] dark:border-[#3F3F46] hover:bg-zinc-100 font-mono text-xs font-bold uppercase flex items-center gap-1 shadow-[-2px_2px_0px_0px_rgba(20,20,20,1)]"
                  >
                    {copiedId === `path-${ep.id}` ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>URL</span>
                  </button>
                </div>
              </div>

              {/* Endpoint Parameters & Body */}
              <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-6 space-y-4">
                  <h4 className="font-mono text-xs uppercase font-black tracking-wider text-zinc-500">
                    Parameters & Headers ({ep.params.length})
                  </h4>
                  {ep.params.length === 0 ? (
                    <p className="font-mono text-xs text-zinc-400 italic">No parameters required for this endpoint.</p>
                  ) : (
                    <div className="border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
                      <table className="w-full text-left font-mono text-xs">
                        <thead className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
                          <tr>
                            <th className="p-2.5">Field</th>
                            <th className="p-2.5">Location</th>
                            <th className="p-2.5">Type</th>
                            <th className="p-2.5">Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                          {ep.params.map(p => (
                            <tr key={p.name} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40">
                              <td className="p-2.5 font-bold text-zinc-900 dark:text-zinc-100">
                                {p.name}
                                {p.required && <span className="text-red-500 ml-1">*</span>}
                              </td>
                              <td className="p-2.5 text-zinc-500 uppercase text-[10px]">{p.location}</td>
                              <td className="p-2.5 text-zinc-500 font-mono text-[11px]">{p.type}</td>
                              <td className="p-2.5 text-zinc-600 dark:text-zinc-400">{p.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {ep.sampleBody && (
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-mono text-xs uppercase font-black tracking-wider text-zinc-500">
                          Sample Request Body (JSON)
                        </h4>
                        <button 
                          onClick={() => handleCopy(JSON.stringify(ep.sampleBody, null, 2), `body-${ep.id}`)}
                          className="font-mono text-[10px] text-zinc-500 hover:text-black dark:hover:text-white flex items-center gap-1"
                        >
                          {copiedId === `body-${ep.id}` ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                          Copy JSON
                        </button>
                      </div>
                      <pre className="p-3 bg-zinc-900 text-zinc-200 font-mono text-xs rounded border border-zinc-800 overflow-x-auto">
                        {JSON.stringify(ep.sampleBody, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Code Snippet & Response Preview */}
                <div className="lg:col-span-6 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-mono text-xs uppercase font-black tracking-wider text-zinc-500 flex items-center gap-1.5">
                        <Code2 className="w-3.5 h-3.5" /> {languages.find(l => l.id === activeLang)?.name} Snippet
                      </h4>
                      <button 
                        onClick={() => handleCopy(generateSnippet(ep, activeLang), `snip-${ep.id}`)}
                        className="font-mono text-[10px] text-zinc-500 hover:text-black dark:hover:text-white flex items-center gap-1"
                      >
                        {copiedId === `snip-${ep.id}` ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                        Copy Snippet
                      </button>
                    </div>
                    <pre className="p-3.5 bg-zinc-950 text-zinc-200 font-mono text-xs rounded border border-zinc-800 overflow-x-auto max-h-56">
                      <code>{generateSnippet(ep, activeLang)}</code>
                    </pre>
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-mono text-xs uppercase font-black tracking-wider text-zinc-500">
                        200 OK Response Schema
                      </h4>
                      <button 
                        onClick={() => handleCopy(ep.responseSchema, `resp-${ep.id}`)}
                        className="font-mono text-[10px] text-zinc-500 hover:text-black dark:hover:text-white flex items-center gap-1"
                      >
                        {copiedId === `resp-${ep.id}` ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                        Copy Schema
                      </button>
                    </div>
                    <pre className="p-3.5 bg-zinc-900 text-zinc-300 font-mono text-xs rounded border border-zinc-800 overflow-x-auto max-h-56">
                      <code>{ep.responseSchema}</code>
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Error Codes Reference */}
      <div className="bg-white dark:bg-[#1A1A1A] p-6 border-2 border-[#141414] dark:border-[#3F3F46] shadow-[-6px_6px_0px_0px_rgba(20,20,20,1)] space-y-4">
        <h3 className="font-mono font-bold text-base uppercase flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-red-600" /> HTTP Status & Error Code Reference
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <span className="font-black text-green-600">200 OK / 201 Created</span>
            <p className="text-zinc-500 mt-1">Request successfully executed and output payload returned.</p>
          </div>
          <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <span className="font-black text-amber-600">400 Bad Request</span>
            <p className="text-zinc-500 mt-1">Missing required fields or invalid Snowflake / VRChat ID format.</p>
          </div>
          <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <span className="font-black text-red-600">401 Unauthorized</span>
            <p className="text-zinc-500 mt-1">Missing or invalid <code className="text-zinc-700 dark:text-zinc-300">x-api-key</code> header for elevated endpoints.</p>
          </div>
          <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <span className="font-black text-red-600">403 Forbidden</span>
            <p className="text-zinc-500 mt-1">API Key lacks required permission level for target guild or bot operation.</p>
          </div>
          <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <span className="font-black text-purple-600">429 Too Many Requests</span>
            <p className="text-zinc-500 mt-1">Rate limit exceeded. Check the <code className="text-zinc-700 dark:text-zinc-300">Retry-After</code> header.</p>
          </div>
          <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <span className="font-black text-zinc-600 dark:text-zinc-400">500 Server Error</span>
            <p className="text-zinc-500 mt-1">Internal server exception. Incidents are automatically logged to staff dashboard.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
