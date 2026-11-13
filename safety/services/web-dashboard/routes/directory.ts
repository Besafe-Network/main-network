import express from 'express';
import { serviceClient } from '../service-client';
import path from 'path';
import fs from 'fs';
import { PassThrough } from 'stream';
import { Client, GatewayIntentBits, Partials, Events, REST, Routes, SlashCommandBuilder, PermissionFlagsBits, ActivityType, ContextMenuCommandBuilder, ApplicationCommandType, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ChannelType, EmbedBuilder } from 'discord.js';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cryptoNode from 'crypto';
import axios from 'axios';
import { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, StreamType, NoSubscriberBehavior, getVoiceConnection, VoiceConnectionStatus, entersState } from '@discordjs/voice';
import * as EmailTemplates from '../../../emailService';
import * as tf from '@tensorflow/tfjs';
import * as nsfwjs from 'nsfwjs';
import geoip from 'geoip-lite';
import { sendEnterpriseAgeVerifyCallback } from '../enterprise-utils';

export function registerDirectoryRoutes(app: express.Express, context: any) {
  const {
  Admin,
  ApiBot,
  ApiKey,
  ApiKeyRequest,
  Appeal,
  BanCase,
  CustomBanlist,
  EnterpriseEndpoint,
  EnterpriseVerificationLog,
  GeoRule,
  Guild,
  LinkCode,
  Log,
  Report,
  ReputationRating,
  ServerBackup,
  SystemConfig,
  TrustedCompany,
  User,
  UserVRChatGroup,
  VerificationRequest,
  VRChatAlertTracker,
  VRChatAnnouncementHistory,
  cleanupSavedWatchlistAvatars,
  createGuildBackup,
  extractVRChatGroupId,
  extractVRChatUserId,
  getAllVRChatAccounts,
  getWatchlistAvatar,
  parseVRChatAccountString,
  resolveDiscordUser,
  safeSaveAppeal,
  safeSaveReport,
  getBaseUrl,
  authenticateToken,
  optionalAuth,
  isAdmin,
  isModOrAdmin,
  checkAndAutoVerifyFromDiscord,
  syncAllVRChatBots,
  syncDiscordCommandsRef,
  getBotForGroup,
  getVRChatAuthHeadersForBot,
  getVRChatAuthHeaders,
  enforceGlobalBan,
  enforceGlobalUnban,
  enforceCustomBanlistEntry,
  unbanCustomBanlistEntry,
  banUserFromVRChatGroup,
  unbanUserFromVRChatGroup,
  getGuildDiscordClient,
  leaveVRChatGroupIfOrphaned,
  syncCustomBotForGuild,
  downloadImageForScan,
  scanImageBufferWithNsfwjs,
  customBotsMap,
  fetchVRChatDisplayName,
  resolveVRChatUserBySearch,
  createOrUpdateBanCase,
  liftBanCase,
  recordUnbanAndUnbanUser,
  rebanBanCase,
  addAccountToBanCase,
  removeAccountFromBanCase,
  migrateLegacyBansToBanCases,
  cleanupUserDatabaseForTrustedOnly,
  syncAllBansAcrossPlatforms,
  calculateDynamicTrustIndex,
  getOrLoadNsfwModel,
  notifyAdmins,
  sendMail,
  serviceName,
  PORT,
  client,
  workerSocketHub,
  __dirname,
  __filename
  } = context;

// --- Global Geo & Country Social Age Compliance API & Admin Rules ---
  const DEFAULT_GEO_RULES = [
    {
      countryCode: 'US',
      countryName: 'United States',
      defaultLocale: 'en-US',
      minAgeSocial: 13,
      idVerificationRequired: false,
      regulatoryFramework: "COPPA (15 U.S.C. §§ 6501–6506)",
      notes: "Federal COPPA baseline age is 13. State statutes (e.g. Texas SCOPE Act, Utah Social Media Regulation) enforce age verification and parental approval on high-risk platforms."
    },
    {
      countryCode: 'GB',
      countryName: 'United Kingdom',
      defaultLocale: 'en-GB',
      minAgeSocial: 13,
      idVerificationRequired: true,
      regulatoryFramework: "Online Safety Act 2023 & Ofcom Age Assurance Codes",
      notes: "Mandatory robust age assurance / ID verification required for commercial platforms with adult or age-restricted content. Digital consent baseline is 13 under DPA 2018."
    },
    {
      countryCode: 'AU',
      countryName: 'Australia',
      defaultLocale: 'en-AU',
      minAgeSocial: 16,
      idVerificationRequired: true,
      regulatoryFramework: "Online Safety Amendment (Social Media Minimum Age) Act 2024",
      notes: "National minimum social media access age set to 16 with mandatory age assurance/ID verification obligations enforced on service providers."
    },
    {
      countryCode: 'DE',
      countryName: 'Germany',
      defaultLocale: 'de-DE',
      minAgeSocial: 16,
      idVerificationRequired: true,
      regulatoryFramework: "GDPR Art. 8 / JMStV (Jugendmedienschutz-Staatsvertrag)",
      notes: "Digital age of consent is 16. JMStV Section 4 mandates government-recognized technical age verification (eID, Ausweis, PostIdent) for adult-rated spaces."
    },
    {
      countryCode: 'FR',
      countryName: 'France',
      defaultLocale: 'fr-FR',
      minAgeSocial: 15,
      idVerificationRequired: true,
      regulatoryFramework: "Loi n° 2023-566 (Majorité numérique et lutte contre la haine en ligne)",
      notes: "Digital majority age set at 15. Social networks must verify age and parental consent via certified third-party tokenized ID systems."
    },
    {
      countryCode: 'IT',
      countryName: 'Italy',
      defaultLocale: 'it-IT',
      minAgeSocial: 14,
      idVerificationRequired: true,
      regulatoryFramework: "Codice Privacy Art. 2-quinquies & Decreto Caivano",
      notes: "Digital consent age is 14. Parental authorization and strict age gating required for minor access to social platforms."
    },
    {
      countryCode: 'ES',
      countryName: 'Spain',
      defaultLocale: 'es-ES',
      minAgeSocial: 14,
      idVerificationRequired: true,
      regulatoryFramework: "LOPDGDD & Digital Wallet Age Verification (Cartera Digital)",
      notes: "Current digital consent age is 14. Government requires digital credential/ID age verification passport for online age assurance."
    },
    {
      countryCode: 'KR',
      countryName: 'South Korea',
      defaultLocale: 'ko-KR',
      minAgeSocial: 14,
      idVerificationRequired: true,
      regulatoryFramework: "Personal Information Protection Act & Telecommunications Business Act",
      notes: "Mandatory real-name authentication (mobile PASS, I-PIN, or credit card ID) required for service sign-ups and age-restricted content."
    },
    {
      countryCode: 'JP',
      countryName: 'Japan',
      defaultLocale: 'ja-JP',
      minAgeSocial: 13,
      idVerificationRequired: false,
      regulatoryFramework: "Act on Development of an Environment for Youth Internet Safety",
      notes: "Standard social platforms baseline is 13. Specified services (dating/social matchmaking) legally mandate government ID submission."
    },
    {
      countryCode: 'CA',
      countryName: 'Canada',
      defaultLocale: 'en-CA',
      minAgeSocial: 13,
      idVerificationRequired: false,
      regulatoryFramework: "PIPEDA & Bill C-63 (Online Harms Act)",
      notes: "Baseline age 13 for standard social networks. Federal legislative initiatives propose ID verification requirements for age-restricted material."
    },
    {
      countryCode: 'IN',
      countryName: 'India',
      defaultLocale: 'en-IN',
      minAgeSocial: 18,
      idVerificationRequired: true,
      regulatoryFramework: "Digital Personal Data Protection Act 2023 (DPDP Act, Sec. 9)",
      notes: "DPDP defines any individual below 18 as a child; platforms processing minor data are legally obligated to obtain verifiable parental consent with identity checks."
    },
    {
      countryCode: 'NL',
      countryName: 'Netherlands',
      defaultLocale: 'nl-NL',
      minAgeSocial: 16,
      idVerificationRequired: false,
      regulatoryFramework: "Uitvoeringswet Algemene verordening gegevensbescherming (UAVG)",
      notes: "Article 8 GDPR digital consent threshold set at 16."
    },
    {
      countryCode: 'IE',
      countryName: 'Ireland',
      defaultLocale: 'en-IE',
      minAgeSocial: 16,
      idVerificationRequired: false,
      regulatoryFramework: "Data Protection Act 2018 (Section 31) & Coimisiún na Meán Online Safety Code",
      notes: "Digital age of consent is 16. Online Safety Code requires age assurance on high-risk video-sharing and social platforms."
    },
    {
      countryCode: 'BR',
      countryName: 'Brazil',
      defaultLocale: 'pt-BR',
      minAgeSocial: 13,
      idVerificationRequired: false,
      regulatoryFramework: "Lei Geral de Proteção de Dados (LGPD) & Marco Civil da Internet",
      notes: "Under 12 classified as children requiring verifiable parental consent; 13+ standard social media participation."
    },
    {
      countryCode: 'CN',
      countryName: 'China',
      defaultLocale: 'zh-CN',
      minAgeSocial: 14,
      idVerificationRequired: true,
      regulatoryFramework: "Regulations on the Protection of Minors in Cyberspace",
      notes: "Mandatory real-name identity verification (National ID / face recognition) for all social and gaming accounts."
    },
    {
      countryCode: 'SG',
      countryName: 'Singapore',
      defaultLocale: 'en-SG',
      minAgeSocial: 13,
      idVerificationRequired: false,
      regulatoryFramework: "Code of Practice for Online Safety (IMDA)",
      notes: "Designated social media services must provide age-appropriate default privacy configurations and tools."
    },
    {
      countryCode: 'NZ',
      countryName: 'New Zealand',
      defaultLocale: 'en-NZ',
      minAgeSocial: 13,
      idVerificationRequired: false,
      regulatoryFramework: "Harmful Digital Communications Act & Privacy Act 2020",
      notes: "Baseline age 13 for standard social networks."
    },
    {
      countryCode: 'SE',
      countryName: 'Sweden',
      defaultLocale: 'sv-SE',
      minAgeSocial: 13,
      idVerificationRequired: false,
      regulatoryFramework: "Dataskyddsförordningen (Swedish GDPR implementation)",
      notes: "Sweden lowered the GDPR digital age of consent to 13."
    },
    {
      countryCode: 'NO',
      countryName: 'Norway',
      defaultLocale: 'no-NO',
      minAgeSocial: 13,
      idVerificationRequired: false,
      regulatoryFramework: "Personopplysningsloven (Personal Data Act)",
      notes: "Consent age set to 13, with proposals under parliamentary review to elevate minimum social age to 15."
    },
    {
      countryCode: 'BE',
      countryName: 'Belgium',
      defaultLocale: 'nl-BE',
      minAgeSocial: 13,
      idVerificationRequired: false,
      regulatoryFramework: "Loi relative à la protection des personnes physiques (GDPR consent at 13)",
      notes: "Digital age of consent is set to 13."
    },
    {
      countryCode: 'AT',
      countryName: 'Austria',
      defaultLocale: 'de-AT',
      minAgeSocial: 14,
      idVerificationRequired: false,
      regulatoryFramework: "Datenschutzgesetz (DSG) § 4",
      notes: "Digital consent age for information society services set at 14."
    },
    {
      countryCode: 'CH',
      countryName: 'Switzerland',
      defaultLocale: 'de-CH',
      minAgeSocial: 13,
      idVerificationRequired: false,
      regulatoryFramework: "Federal Act on the Protection of Minors in the Media (JSMPG / FAPMM)",
      notes: "Baseline digital participation age is 13."
    },
    {
      countryCode: 'DK',
      countryName: 'Denmark',
      defaultLocale: 'da-DK',
      minAgeSocial: 13,
      idVerificationRequired: false,
      regulatoryFramework: "Databeskyttelsesloven (GDPR Art. 8 implementation)",
      notes: "Digital age of consent is set at 13."
    },
    {
      countryCode: 'FI',
      countryName: 'Finland',
      defaultLocale: 'fi-FI',
      minAgeSocial: 13,
      idVerificationRequired: false,
      regulatoryFramework: "Tietosuojalaki (Data Protection Act 1050/2018)",
      notes: "Digital age of consent is set at 13."
    },
    {
      countryCode: 'PL',
      countryName: 'Poland',
      defaultLocale: 'pl-PL',
      minAgeSocial: 16,
      idVerificationRequired: false,
      regulatoryFramework: "Ustawa o ochronie danych osobowych",
      notes: "Default Article 8 GDPR threshold of 16."
    },
    {
      countryCode: 'PT',
      countryName: 'Portugal',
      defaultLocale: 'pt-PT',
      minAgeSocial: 13,
      idVerificationRequired: false,
      regulatoryFramework: "Lei n.º 58/2019",
      notes: "Digital consent age set to 13."
    },
    {
      countryCode: 'GR',
      countryName: 'Greece',
      defaultLocale: 'el-GR',
      minAgeSocial: 15,
      idVerificationRequired: false,
      regulatoryFramework: "Law 4624/2019",
      notes: "Digital consent age set to 15."
    },
    {
      countryCode: 'CZ',
      countryName: 'Czech Republic',
      defaultLocale: 'cs-CZ',
      minAgeSocial: 15,
      idVerificationRequired: false,
      regulatoryFramework: "Zákon o zpracování osobních údajů č. 110/2019 Sb.",
      notes: "Digital consent age set to 15."
    },
    {
      countryCode: 'RO',
      countryName: 'Romania',
      defaultLocale: 'ro-RO',
      minAgeSocial: 16,
      idVerificationRequired: false,
      regulatoryFramework: "Legea nr. 190/2018",
      notes: "Digital age of consent maintained at 16."
    },
    {
      countryCode: 'HU',
      countryName: 'Hungary',
      defaultLocale: 'hu-HU',
      minAgeSocial: 16,
      idVerificationRequired: false,
      regulatoryFramework: "Infotv. Act CXII of 2011",
      notes: "Digital age of consent maintained at 16."
    },
    {
      countryCode: 'MX',
      countryName: 'Mexico',
      defaultLocale: 'es-MX',
      minAgeSocial: 13,
      idVerificationRequired: false,
      regulatoryFramework: "Ley Federal de Protección de Datos Personales (LFPDPPP)",
      notes: "General age of consent for digital accounts is 13."
    },
    {
      countryCode: 'ZA',
      countryName: 'South Africa',
      defaultLocale: 'en-ZA',
      minAgeSocial: 18,
      idVerificationRequired: true,
      regulatoryFramework: "Protection of Personal Information Act (POPIA)",
      notes: "POPIA defines individuals under 18 as children requiring parental consent and identity validation."
    },
    {
      countryCode: 'GLOBAL',
      countryName: 'Global (International Default)',
      defaultLocale: 'en-US',
      minAgeSocial: 13,
      idVerificationRequired: false,
      regulatoryFramework: "International Standard Digital Age Baseline",
      notes: "Fallback rule applied when the visitor's country cannot be determined."
    }
  ];

  // In-memory cache for fast IP lookups
  const ipGeoCache = new Map<string, { countryCode: string; city?: string; timezone?: string; source: string }>();

  // Helper to determine private / loopback IP addresses
  function isPrivateOrLocalIp(ip: string): boolean {
    if (!ip) return true;
    const clean = ip.replace(/^::ffff:/, '').trim();
    if (clean === '127.0.0.1' || clean === '::1' || clean === 'localhost') return true;
    if (clean.startsWith('10.') || clean.startsWith('192.168.')) return true;
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(clean)) return true;
    if (clean.startsWith('fc00:') || clean.startsWith('fe80:')) return true;
    return false;
  }

  // Extract true client IP from request headers (Cloud Run, Cloudflare, proxies, query override)
  function extractClientIp(req: any): string {
    if (req.query?.ip && typeof req.query.ip === 'string') {
      return req.query.ip.trim().replace(/^::ffff:/, '');
    }

    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      const list = String(forwarded).split(',');
      for (const item of list) {
        const candidate = item.trim().replace(/^::ffff:/, '');
        if (candidate && !isPrivateOrLocalIp(candidate)) {
          return candidate;
        }
      }
      const first = list[0]?.trim().replace(/^::ffff:/, '');
      if (first) return first;
    }

    const realIp = req.headers['x-real-ip'] || 
                   req.headers['cf-connecting-ip'] || 
                   req.headers['true-client-ip'] || 
                   req.headers['fastly-client-ip'];
    if (realIp && typeof realIp === 'string') {
      return realIp.trim().replace(/^::ffff:/, '');
    }

    const rawIp = req.ip || req.socket?.remoteAddress || '127.0.0.1';
    return String(rawIp).trim().replace(/^::ffff:/, '');
  }

  const ALPHA3_TO_ALPHA2: Record<string, string> = {
    USA: 'US', GBR: 'GB', CAN: 'CA', AUS: 'AU', DEU: 'DE', FRA: 'FR',
    NLD: 'NL', ITA: 'IT', ESP: 'ES', JPN: 'JP', KOR: 'KR', BRA: 'BR',
    IND: 'IN', CHN: 'CN', MEX: 'MX', RUS: 'RU', SWE: 'SE', NOR: 'NO',
    DNK: 'DK', FIN: 'FI', CHE: 'CH', AUT: 'AT', BEL: 'BE', POL: 'PL',
    IRL: 'IE', NZL: 'NZ', SGP: 'SG', ZAF: 'ZA', ARG: 'AR', CHL: 'CL',
    PRT: 'PT', GRC: 'GR', CZE: 'CZ', ROU: 'RO', HUN: 'HU', TUR: 'TR'
  };

  let geoRulesSeeded = false;
  async function ensureDefaultGeoRulesSeeded() {
    if (geoRulesSeeded) return;
    try {
      const existing = await GeoRule.find({}, { countryCode: 1 }).lean();
      const existingCodes = new Set(existing.map((e: any) => e.countryCode));
      const missing = DEFAULT_GEO_RULES.filter(r => !existingCodes.has(r.countryCode));
      if (missing.length > 0) {
        await GeoRule.insertMany(missing.map(r => ({ ...r, isCustom: false })), { ordered: false }).catch(() => null);
      }
      geoRulesSeeded = true;
    } catch (e) {
      console.error('Failed to seed default geo rules:', e);
    }
  }

  // Detect visitor location based on IP Geolocation, Proxy Headers, or query overrides
  function detectVisitorLocation(req: any): {
    countryCode: string;
    detectedFrom: string;
    clientIp: string;
    city?: string;
    timezone?: string;
  } {
    const clientIp = extractClientIp(req);

    // 1. Explicit query parameter override (e.g. ?country=NL or ?countryCode=NL)
    if (req.query?.country || req.query?.countryCode) {
      const code = String(req.query.country || req.query.countryCode).trim().toUpperCase();
      return {
        countryCode: code,
        detectedFrom: 'query_param',
        clientIp
      };
    }

    // 2. IP Geolocation via geoip-lite (offline, sub-millisecond, accurate)
    if (!isPrivateOrLocalIp(clientIp)) {
      if (ipGeoCache.has(clientIp)) {
        const cached = ipGeoCache.get(clientIp)!;
        return {
          countryCode: cached.countryCode,
          detectedFrom: cached.source,
          clientIp,
          city: cached.city,
          timezone: cached.timezone
        };
      }

      try {
        const geo = geoip.lookup(clientIp);
        if (geo && geo.country && typeof geo.country === 'string' && geo.country.trim().length === 2) {
          const countryCode = geo.country.trim().toUpperCase();
          ipGeoCache.set(clientIp, {
            countryCode,
            city: geo.city,
            timezone: geo.timezone,
            source: 'ip_geolocation'
          });
          return {
            countryCode,
            detectedFrom: 'ip_geolocation',
            clientIp,
            city: geo.city,
            timezone: geo.timezone
          };
        }
      } catch (err) {
        console.warn('geoip-lite lookup error for IP:', clientIp, err);
      }
    }

    // 3. Reverse Proxy & CDN Country Headers
    const cfCountry = req.headers['cf-ipcountry'] || req.headers['CF-IPCountry'];
    if (cfCountry && typeof cfCountry === 'string' && cfCountry.trim().length === 2 && cfCountry.toUpperCase() !== 'XX') {
      return {
        countryCode: cfCountry.trim().toUpperCase(),
        detectedFrom: 'cf_ipcountry_header',
        clientIp
      };
    }

    const appEngineCountry = req.headers['x-appengine-country'] || req.headers['x-country-code'] || req.headers['cloudfront-viewer-country'];
    if (appEngineCountry && typeof appEngineCountry === 'string' && appEngineCountry.trim().length === 2) {
      return {
        countryCode: appEngineCountry.trim().toUpperCase(),
        detectedFrom: 'proxy_country_header',
        clientIp
      };
    }

    // 4. Client Explicit Locale or Country Headers
    const clientCountryHeader = req.headers['x-client-country'] || req.headers['x-visitor-country'];
    if (clientCountryHeader && typeof clientCountryHeader === 'string' && clientCountryHeader.trim().length === 2) {
      return {
        countryCode: clientCountryHeader.trim().toUpperCase(),
        detectedFrom: 'client_country_header',
        clientIp
      };
    }

    const LANG_TO_DEFAULT_COUNTRY: Record<string, string> = {
      nl: 'NL', de: 'DE', fr: 'FR', es: 'ES', it: 'IT', ja: 'JP', ko: 'KR',
      pt: 'BR', pl: 'PL', sv: 'SE', da: 'DK', fi: 'FI', el: 'GR', cs: 'CZ',
      hu: 'HU', ro: 'RO', sk: 'SK', uk: 'UA', ru: 'RU', zh: 'CN', tr: 'TR',
      ar: 'SA', he: 'IL', no: 'NO', nb: 'NO', nn: 'NO', th: 'TH', vi: 'VN',
      id: 'ID', en: 'US'
    };

    const clientLocaleHeader = req.headers['x-client-locale'] || req.headers['x-locale'];
    if (clientLocaleHeader && typeof clientLocaleHeader === 'string') {
      const cleanLocale = clientLocaleHeader.trim().replace('_', '-');
      const parts = cleanLocale.split('-');
      if (parts.length >= 2 && parts[1].length === 2 && /^[a-zA-Z]{2}$/.test(parts[1])) {
        return {
          countryCode: parts[1].toUpperCase(),
          detectedFrom: 'client_locale_header',
          clientIp
        };
      } else if (parts.length === 1 && LANG_TO_DEFAULT_COUNTRY[parts[0].toLowerCase()]) {
        return {
          countryCode: LANG_TO_DEFAULT_COUNTRY[parts[0].toLowerCase()],
          detectedFrom: 'client_locale_language',
          clientIp
        };
      }
    }

    // 5. Fallback to Accept-Language region code or primary language
    const acceptLang = req.headers['accept-language'];
    if (acceptLang && typeof acceptLang === 'string') {
      const parts = acceptLang.split(',');
      for (const part of parts) {
        const tag = part.split(';')[0].trim().replace('_', '-');
        const sub = tag.split('-');
        if (sub.length >= 2 && sub[1].length === 2 && /^[a-zA-Z]{2}$/.test(sub[1])) {
          return {
            countryCode: sub[1].toUpperCase(),
            detectedFrom: 'accept_language_fallback',
            clientIp
          };
        } else if (sub.length === 1 && LANG_TO_DEFAULT_COUNTRY[sub[0].toLowerCase()]) {
          return {
            countryCode: LANG_TO_DEFAULT_COUNTRY[sub[0].toLowerCase()],
            detectedFrom: 'accept_language_primary',
            clientIp
          };
        }
      }
    }

    return {
      countryCode: 'US',
      detectedFrom: 'default_fallback',
      clientIp
    };
  }

  // Resolve best locale for the detected country & request
  function resolveVisitorLocale(countryCode: string, ruleDefaultLocale: string, req: any): string {
    // 1. Explicit query parameter override (?locale=...)
    if (req.query?.locale && typeof req.query.locale === 'string') {
      return req.query.locale.trim();
    }

    // 2. Client explicit header override (x-client-locale)
    const clientLocaleHeader = req.headers['x-client-locale'] || req.headers['x-locale'];
    if (clientLocaleHeader && typeof clientLocaleHeader === 'string' && clientLocaleHeader.trim()) {
      return clientLocaleHeader.trim().replace('_', '-');
    }

    // 3. If client specified Accept-Language matching this country
    const acceptLang = req.headers['accept-language'];
    if (acceptLang && typeof acceptLang === 'string') {
      const parts = acceptLang.split(',');
      const codeUpper = countryCode.toUpperCase();
      for (const part of parts) {
        const tag = part.split(';')[0].trim().replace('_', '-');
        const sub = tag.split('-');
        // E.g. tag 'nl-NL' matches country 'NL', or 'en-GB' matches country 'GB'
        if (sub.length >= 2 && sub[1].toUpperCase() === codeUpper) {
          return tag;
        }
      }
    }

    // 4. Country's configured rule default locale (authoritative for this jurisdiction)
    if (ruleDefaultLocale && ruleDefaultLocale.trim()) {
      return ruleDefaultLocale.trim();
    }

    // 5. Dynamic Intl lookup
    try {
      return `${countryCode.toLowerCase()}-${countryCode.toUpperCase()}`;
    } catch {
      return 'en-US';
    }
  }

  // Public Geo API Endpoint: returns locale of user visiting, minimal age requirement for social for that country, and if ID verification is required
  app.get(['/api/geo', '/geo', '/api/v1/geo', '/api/v1/public/geo'], async (req: any, res: any) => {
    try {
      await ensureDefaultGeoRulesSeeded();
      const detected = detectVisitorLocation(req);
      const targetCode = detected.countryCode;

      let rule = await GeoRule.findOne({ countryCode: targetCode });
      if (!rule) {
        const defaultMatch = DEFAULT_GEO_RULES.find(r => r.countryCode === targetCode);
        if (defaultMatch) {
          rule = await new GeoRule(defaultMatch).save().catch(() => defaultMatch as any);
        } else {
          // Dynamic rule generation for any valid ISO country
          let countryName = targetCode;
          try {
            const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });
            countryName = displayNames.of(targetCode) || targetCode;
          } catch {}

          const dynamicLocale = `${targetCode.toLowerCase()}-${targetCode.toUpperCase()}`;
          const isEU = ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE'].includes(targetCode);

          rule = await new GeoRule({
            countryCode: targetCode,
            countryName,
            defaultLocale: dynamicLocale,
            minAgeSocial: isEU ? 16 : 13,
            idVerificationRequired: false,
            regulatoryFramework: isEU ? 'EU General Data Protection Regulation (GDPR Art. 8)' : 'National Digital Age Baseline',
            notes: `Standard compliance rule for ${countryName}.`,
            isCustom: false
          }).save().catch(() => ({
            countryCode: targetCode,
            countryName,
            defaultLocale: dynamicLocale,
            minAgeSocial: isEU ? 16 : 13,
            idVerificationRequired: false,
            regulatoryFramework: isEU ? 'EU GDPR Art. 8' : 'National Digital Age Baseline',
            notes: '',
            isCustom: false
          }) as any);
        }
      }

      const clientIp = detected.clientIp || extractClientIp(req);
      const visitorLocale = resolveVisitorLocale(rule.countryCode, rule.defaultLocale || 'en-US', req);

      return res.json({
        success: true,
        locale: visitorLocale,
        countryCode: rule.countryCode,
        countryName: rule.countryName,
        minimalAgeRequirement: rule.minAgeSocial,
        minAgeSocial: rule.minAgeSocial,
        idVerificationRequired: rule.idVerificationRequired,
        isIdVerificationRequired: rule.idVerificationRequired,
        regulatoryFramework: rule.regulatoryFramework || '',
        notes: rule.notes || '',
        isCustomOverride: Boolean(rule.isCustom),
        clientIp,
        city: detected.city || null,
        timezone: detected.timezone || null,
        detectedFrom: detected.detectedFrom
      });
    } catch (e: any) {
      console.error('Geo API error:', e);
      return res.status(500).json({ error: 'Failed to retrieve geo compliance information' });
    }
  });

  // Public / Admin Geo Rules listing API
  app.get(['/api/admin/geo-rules', '/api/geo/rules', '/api/v1/geo/rules', '/api/v1/public/geo/rules'], optionalAuth, async (req: any, res: any) => {
    try {
      await ensureDefaultGeoRulesSeeded();
      let rules = await GeoRule.find().sort({ countryName: 1 }).lean();
      if (!rules || rules.length === 0) {
        rules = DEFAULT_GEO_RULES.map((r, idx) => ({ ...r, _id: `default-${idx}`, isCustom: false })) as any;
      }
      const stats = {
        totalRules: rules.length,
        idVerificationRequiredCount: rules.filter((r: any) => r.idVerificationRequired).length,
        customOverridesCount: rules.filter((r: any) => r.isCustom).length
      };
      return res.json({ success: true, rules, stats });
    } catch (e: any) {
      console.error('Failed to fetch geo compliance rules:', e);
      const fallbackRules = DEFAULT_GEO_RULES.map((r, idx) => ({ ...r, _id: `fallback-${idx}`, isCustom: false }));
      return res.json({
        success: true,
        rules: fallbackRules,
        stats: {
          totalRules: fallbackRules.length,
          idVerificationRequiredCount: fallbackRules.filter(r => r.idVerificationRequired).length,
          customOverridesCount: 0
        }
      });
    }
  });

  // Admin API: Create or update a country rule
  app.post('/api/admin/geo-rules', optionalAuth, async (req: any, res: any) => {
    try {
      if (req.user && req.user.role !== 'admin' && req.user.role !== 'moderator') {
        return res.status(403).json({ error: 'Moderator or Admin access required' });
      }

      let { countryCode, countryName, defaultLocale, minAgeSocial, idVerificationRequired, regulatoryFramework, notes } = req.body;
      if (!countryCode || typeof countryCode !== 'string') {
        return res.status(400).json({ error: 'Valid Country Code is required (e.g. US, NL, DE, or GLOBAL)' });
      }

      countryCode = countryCode.trim().toUpperCase();
      if (countryCode.length === 3 && ALPHA3_TO_ALPHA2[countryCode]) {
        countryCode = ALPHA3_TO_ALPHA2[countryCode];
      }
      if (!/^[A-Z]{2,3}$/.test(countryCode) && countryCode !== 'GLOBAL') {
        return res.status(400).json({ error: 'Country Code must be a 2 or 3-letter ISO code or GLOBAL (e.g. US, NL, DE)' });
      }

      const age = parseInt(String(minAgeSocial), 10);
      if (isNaN(age) || age < 1 || age > 99) {
        return res.status(400).json({ error: 'Minimal social age requirement must be a valid number between 1 and 99' });
      }

      const isIdRequired = Boolean(idVerificationRequired);

      const existingDefault = DEFAULT_GEO_RULES.find(r => r.countryCode === countryCode);
      let name = countryName?.trim() || existingDefault?.countryName;
      if (!name) {
        try {
          const dn = new Intl.DisplayNames(['en'], { type: 'region' });
          name = dn.of(countryCode) || countryCode;
        } catch {
          name = countryCode;
        }
      }

      const locale = defaultLocale?.trim() || existingDefault?.defaultLocale || `${countryCode.toLowerCase()}-${countryCode.toUpperCase()}`;

      const updated = await GeoRule.findOneAndUpdate(
        { countryCode },
        {
          $set: {
            countryCode,
            countryName: name,
            defaultLocale: locale,
            minAgeSocial: age,
            idVerificationRequired: isIdRequired,
            regulatoryFramework: regulatoryFramework?.trim() || existingDefault?.regulatoryFramework || '',
            notes: notes?.trim() || '',
            isCustom: true,
            updatedBy: req.user?.username || 'admin',
            updatedAt: new Date()
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      ipGeoCache.clear();

      await new Log({
        action: 'GEO_RULE_UPDATED',
        adminId: req.user?.username || 'admin',
        targetId: countryCode,
        details: `Updated geo compliance rule for ${countryCode} (${name}): Min Age = ${age}, ID Verification Required = ${isIdRequired}`
      }).save().catch(() => null);

      return res.json({ success: true, rule: updated, message: `Geo compliance rule for ${countryCode} updated successfully!` });
    } catch (e: any) {
      console.error('Save geo rule error:', e);
      return res.status(500).json({ error: 'Failed to save geo compliance rule: ' + (e?.message || 'Server error') });
    }
  });

  // Admin API: Reset a specific country rule back to default
  app.delete('/api/admin/geo-rules/:countryCode', optionalAuth, async (req: any, res: any) => {
    try {
      if (req.user && req.user.role !== 'admin' && req.user.role !== 'moderator') {
        return res.status(403).json({ error: 'Moderator or Admin access required' });
      }

      const code = String(req.params.countryCode).trim().toUpperCase();
      const defaultRule = DEFAULT_GEO_RULES.find(r => r.countryCode === code);
      if (defaultRule) {
        const reset = await GeoRule.findOneAndUpdate(
          { countryCode: code },
          { $set: { ...defaultRule, isCustom: false, updatedAt: new Date(), updatedBy: req.user?.username || 'admin' } },
          { upsert: true, new: true }
        );
        ipGeoCache.clear();
        return res.json({ success: true, rule: reset, message: `Rule for ${code} reset to system default.` });
      } else {
        await GeoRule.deleteOne({ countryCode: code });
        ipGeoCache.clear();
        return res.json({ success: true, message: `Custom country rule ${code} deleted.` });
      }
    } catch (e: any) {
      return res.status(500).json({ error: 'Failed to reset geo rule: ' + (e?.message || 'Server error') });
    }
  });

  // Admin API: Reset all country rules to system defaults
  app.post('/api/admin/geo-rules/reset', optionalAuth, async (req: any, res: any) => {
    try {
      if (req.user && req.user.role !== 'admin' && req.user.role !== 'moderator') {
        return res.status(403).json({ error: 'Moderator or Admin access required' });
      }
      await GeoRule.deleteMany({});
      await GeoRule.insertMany(DEFAULT_GEO_RULES.map(r => ({ ...r, isCustom: false })));
      ipGeoCache.clear();

      await new Log({
        action: 'GEO_RULES_RESET_ALL',
        adminId: req.user?.username || 'admin',
        details: 'Admin reset all geo compliance rules back to factory defaults.'
      }).save().catch(() => null);

      const rules = await GeoRule.find().sort({ countryName: 1 }).lean();
      return res.json({ success: true, message: 'All geo compliance rules have been reset to factory defaults.', rules });
    } catch (e: any) {
      return res.status(500).json({ error: 'Failed to reset all geo compliance rules: ' + (e?.message || 'Server error') });
    }
  });

  // =========================================================================
  // --- PROTECTED COMMUNITIES, API PARTNER BOTS & TRUSTED COMPANIES SYSTEM ---
  // =========================================================================

  // 1. Public Protected Communities (Discord Servers & VRChat Groups)
  app.get('/api/public/protected-communities', async (req: any, res: any) => {
    try {
      // Find all listed Discord Guilds
      const guilds = await Guild.find({
        $or: [
          { 'publicListing.isListed': true },
          { 'settings.publicDirectoryEnabled': true }
        ]
      }).select('id name publicListing settings updatedAt').lean();

      // Find all listed VRChat Groups
      const vrchatGroups = await UserVRChatGroup.find({
        $or: [
          { 'publicListing.isListed': true }
        ]
      }).select('groupId groupName shortCode description iconUrl bannerUrl memberCount publicListing autoBanEnabled lastSyncedAt').lean();

      // Collect all linked VRChat group IDs from guilds
      const linkedGroupIds = guilds
        .map((g: any) => g.settings?.vrchatGroupId?.trim())
        .filter(Boolean);

      const additionalVrcGroups = linkedGroupIds.length > 0
        ? await UserVRChatGroup.find({ groupId: { $in: linkedGroupIds } }).lean()
        : [];

      const vrcGroupMap = new Map<string, any>();
      for (const v of vrchatGroups) {
        vrcGroupMap.set(v.groupId, v);
      }
      for (const v of additionalVrcGroups) {
        if (!vrcGroupMap.has(v.groupId)) {
          vrcGroupMap.set(v.groupId, v);
        }
      }

      // 1. Build Discord servers list with linked VRChat group details
      const discordServers = guilds.map((g: any) => {
        const vrcGroupId = g.settings?.vrchatGroupId?.trim();
        let linkedVRChatGroup: any = null;

        if (vrcGroupId) {
          const vrcData = vrcGroupMap.get(vrcGroupId);
          const shortCode = vrcData?.shortCode || '';
          const groupName = vrcData?.groupName || (shortCode ? `VRC: ${shortCode}` : `${g.name} VRChat Group`);
          const joinUrl = vrcData?.publicListing?.joinUrl || (shortCode ? `https://vrc.group/${shortCode}` : `https://vrchat.com/home/group/${vrcGroupId}`);
          const iconUrl = vrcData?.iconUrl || g.publicListing?.iconUrl || '';
          const memberCount = vrcData?.memberCount || 0;

          linkedVRChatGroup = {
            groupId: vrcGroupId,
            groupName,
            shortCode,
            iconUrl,
            joinUrl,
            memberCount
          };
        }

        const features = [
          g.settings?.autoBanEnabled ? 'Global Ban Sync' : null,
          g.settings?.verificationEnabled ? 'Age Verification' : null,
          vrcGroupId ? '🎮 VRChat Group Linked' : (g.settings?.vrchatBotEnabled ? 'VRChat Sync' : null),
          g.settings?.nsfwBlockerEnabled ? 'AI NSFW Shield' : null
        ].filter(Boolean);

        return {
          id: g.id,
          name: g.name || `Server #${g.id.slice(-4)}`,
          iconUrl: g.publicListing?.iconUrl || '',
          category: g.publicListing?.category || 'Gaming & Community',
          description: g.publicListing?.description || 'Active Discord server protected by the BeSafe Network.',
          inviteUrl: g.publicListing?.inviteUrl || '',
          memberCount: g.publicListing?.memberCount || (g.settings?.approximateMemberCount || 0),
          features,
          isProtected: true,
          updatedAt: g.updatedAt,
          linkedVRChatGroup
        };
      });

      // 2. Build VRChat groups list
      const vrcList: any[] = vrchatGroups.map((v: any) => {
        // Check if any public guild links this VRChat group
        const linkedGuild = guilds.find((g: any) => g.settings?.vrchatGroupId?.trim() === v.groupId);
        let linkedDiscordServer: any = null;

        if (linkedGuild) {
          linkedDiscordServer = {
            id: linkedGuild.id,
            name: linkedGuild.name || `Server #${linkedGuild.id.slice(-4)}`,
            iconUrl: linkedGuild.publicListing?.iconUrl || '',
            inviteUrl: linkedGuild.publicListing?.inviteUrl || '',
            memberCount: linkedGuild.publicListing?.memberCount || ((linkedGuild.settings as any)?.approximateMemberCount || 0)
          };
        }

        const features = [
          'VRChat 2FA Defense',
          linkedDiscordServer ? '💬 Discord Server Linked' : null,
          v.autoBanEnabled ? 'Auto-Blacklist Eviction' : null,
          'Global Ban Sync'
        ].filter(Boolean);

        return {
          groupId: v.groupId,
          groupName: v.groupName || v.groupId,
          shortCode: v.shortCode || '',
          iconUrl: v.iconUrl || '',
          bannerUrl: v.bannerUrl || '',
          category: v.publicListing?.category || 'VRChat Community',
          description: v.publicListing?.description || v.description || 'VRChat group protected by BeSafe automated eviction.',
          joinUrl: v.publicListing?.joinUrl || (v.shortCode ? `https://vrc.group/${v.shortCode}` : `https://vrchat.com/home/group/${v.groupId}`),
          memberCount: v.memberCount || 0,
          features,
          isProtected: true,
          linkedDiscordServer
        };
      });

      // 3. User request requirement: If a discord community has a vrchat group linked,
      // show it in BOTH discord and vrchat communities (if the owner has it public).
      for (const g of guilds) {
        const vrcGroupId = g.settings?.vrchatGroupId?.trim();
        if (!vrcGroupId) continue;

        const alreadyInVrcList = vrcList.some((v: any) => v.groupId === vrcGroupId);
        if (!alreadyInVrcList) {
          const vrcData = vrcGroupMap.get(vrcGroupId);
          const shortCode = vrcData?.shortCode || '';
          const groupName = vrcData?.groupName || (shortCode ? `${g.name} [${shortCode}]` : `${g.name} [VRChat Group]`);
          const joinUrl = vrcData?.publicListing?.joinUrl || (shortCode ? `https://vrc.group/${shortCode}` : `https://vrchat.com/home/group/${vrcGroupId}`);
          const iconUrl = vrcData?.iconUrl || g.publicListing?.iconUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80';
          const bannerUrl = vrcData?.bannerUrl || '';
          const description = vrcData?.publicListing?.description || vrcData?.description || g.publicListing?.description || `Official VRChat Group linked with ${g.name}. Protected by BeSafe.`;
          const category = vrcData?.publicListing?.category || g.publicListing?.category || 'VRChat Community';
          const memberCount = vrcData?.memberCount || 0;

          vrcList.push({
            groupId: vrcGroupId,
            groupName,
            shortCode,
            iconUrl,
            bannerUrl,
            category,
            description,
            joinUrl,
            memberCount,
            features: [
              'VRChat 2FA Defense',
              '💬 Discord Server Linked',
              g.settings?.autoBanEnabled ? 'Global Ban Sync' : 'Eviction Shield'
            ],
            isProtected: true,
            linkedDiscordServer: {
              id: g.id,
              name: g.name || `Server #${g.id.slice(-4)}`,
              iconUrl: g.publicListing?.iconUrl || '',
              inviteUrl: g.publicListing?.inviteUrl || '',
              memberCount: g.publicListing?.memberCount || ((g.settings as any)?.approximateMemberCount || 0)
            }
          });
        }
      }

      return res.json({
        success: true,
        stats: {
          totalDiscordServers: discordServers.length,
          totalVRChatGroups: vrcList.length,
          totalCommunities: discordServers.length + vrcList.length
        },
        discordServers,
        vrchatGroups: vrcList
      });
    } catch (e: any) {
      console.error('Failed to fetch protected communities:', e);
      return res.status(500).json({ error: 'Failed to retrieve protected communities list' });
    }
  });

  // 2. Server Owner Toggle Public Listing
  app.post('/api/guilds/:guildId/public-listing', authenticateToken, async (req: any, res: any) => {
    try {
      const { guildId } = req.params;
      const { isListed, description, inviteUrl, category, iconUrl, memberCount } = req.body;

      let guild = await Guild.findOne({ id: guildId });
      if (!guild) {
        return res.status(404).json({ error: 'Server not found' });
      }

      // Check permission: owner of the guild or BeSafe Admin
      const isOwner = guild.ownerId === req.user?.id || guild.ownerId === req.user?.username;
      const userIsAdmin = req.user?.role === 'admin' || req.user?.role === 'moderator';

      if (!isOwner && !userIsAdmin) {
        return res.status(403).json({ error: 'Only the server owner or an administrator can toggle this listing' });
      }

      if (!guild.publicListing) {
        guild.publicListing = {} as any;
      }

      if (typeof isListed === 'boolean') {
        guild.publicListing.isListed = isListed;
      }
      if (typeof description === 'string') {
        guild.publicListing.description = description.slice(0, 500);
      }
      if (typeof inviteUrl === 'string') {
        guild.publicListing.inviteUrl = inviteUrl.trim();
      }
      if (typeof category === 'string') {
        guild.publicListing.category = category.trim();
      }
      if (typeof iconUrl === 'string') {
        guild.publicListing.iconUrl = iconUrl.trim();
      }
      if (typeof memberCount === 'number') {
        guild.publicListing.memberCount = memberCount;
      }

      guild.updatedAt = new Date();
      await guild.save();

      return res.json({
        success: true,
        message: guild.publicListing.isListed 
          ? 'Server is now listed in the public BeSafe Protected Communities directory!' 
          : 'Server removed from public directory.',
        publicListing: guild.publicListing
      });
    } catch (e: any) {
      return res.status(500).json({ error: 'Failed to update server public listing: ' + (e?.message || 'Server error') });
    }
  });

  // 3. VRChat Group Owner Toggle Public Listing
  app.post('/api/vrchat/groups/:groupId/public-listing', authenticateToken, async (req: any, res: any) => {
    try {
      const { groupId } = req.params;
      const { isListed, description, joinUrl, category } = req.body;

      let group = await UserVRChatGroup.findOne({ groupId });
      if (!group) {
        return res.status(404).json({ error: 'VRChat group not found' });
      }

      const isOwner = group.userId === req.user?.id || group.userId === req.user?.username;
      const userIsAdmin = req.user?.role === 'admin' || req.user?.role === 'moderator';

      if (!isOwner && !userIsAdmin) {
        return res.status(403).json({ error: 'Only the group manager or an administrator can toggle this listing' });
      }

      if (!group.publicListing) {
        group.publicListing = {} as any;
      }

      if (typeof isListed === 'boolean') {
        group.publicListing.isListed = isListed;
      }
      if (typeof description === 'string') {
        group.publicListing.description = description.slice(0, 500);
      }
      if (typeof joinUrl === 'string') {
        group.publicListing.joinUrl = joinUrl.trim();
      }
      if (typeof category === 'string') {
        group.publicListing.category = category.trim();
      }

      await group.save();

      return res.json({
        success: true,
        message: group.publicListing.isListed 
          ? 'VRChat group is now listed in the public BeSafe Protected Communities directory!' 
          : 'VRChat group removed from public directory.',
        publicListing: group.publicListing
      });
    } catch (e: any) {
      return res.status(500).json({ error: 'Failed to update VRChat group public listing: ' + (e?.message || 'Server error') });
    }
  });

  // 4. Public API Partner Bots (Only bots using the API, certified by admins)
  app.get('/api/public/bots', async (req: any, res: any) => {
    try {
      const bots = await ApiBot.find({ isListed: true }).sort({ serversCount: -1, createdAt: -1 }).lean();

      return res.json({
        success: true,
        count: bots.length,
        bots
      });
    } catch (e: any) {
      console.error('Failed to fetch public bots:', e);
      return res.status(500).json({ error: 'Failed to retrieve bots directory' });
    }
  });

  // Admin: Get all bots (including unlisted)
  app.get('/api/admin/bots', optionalAuth, async (req: any, res: any) => {
    try {
      if (req.user && req.user.role !== 'admin' && req.user.role !== 'moderator') {
        return res.status(403).json({ error: 'Administrator access required' });
      }
      const bots = await ApiBot.find().sort({ createdAt: -1 }).lean();
      return res.json({ success: true, count: bots.length, bots });
    } catch (e: any) {
      return res.status(500).json({ error: 'Failed to fetch admin bots' });
    }
  });

  // Admin: Add API Bot (bots can only be added by admins)
  app.post('/api/admin/bots', optionalAuth, async (req: any, res: any) => {
    try {
      if (req.user && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Administrator access required. Only admins can register certified API partner bots.' });
      }

      const { name, platform, description, avatarUrl, inviteUrl, websiteUrl, authorName, apiScopes, apiUsageDetails, serversCount, usersProtected, isVerified, isListed } = req.body;

      if (!name || !description) {
        return res.status(400).json({ error: 'Bot Name and Description are required' });
      }

      const newBot = new ApiBot({
        name: name.trim(),
        platform: ['discord', 'vrchat', 'multi'].includes(platform) ? platform : 'discord',
        description: description.trim(),
        avatarUrl: avatarUrl?.trim() || '',
        inviteUrl: inviteUrl?.trim() || '',
        websiteUrl: websiteUrl?.trim() || '',
        authorName: authorName?.trim() || req.user?.username || 'Verified Developer',
        authorId: req.user?.id || '',
        apiScopes: Array.isArray(apiScopes) ? apiScopes : ['read:reputation', 'enforce:bans'],
        apiUsageDetails: apiUsageDetails?.trim() || 'Integrates with BeSafe API v1 endpoints for real-time community protection.',
        serversCount: Number(serversCount) || 0,
        usersProtected: Number(usersProtected) || 0,
        isVerified: isVerified !== false,
        isListed: isListed !== false,
        addedBy: req.user?.username || 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await newBot.save();

      await new Log({
        action: 'API_BOT_REGISTERED',
        adminId: req.user?.username || 'admin',
        details: `Registered certified API partner bot: ${newBot.name} (${newBot.platform})`
      }).save().catch(() => null);

      return res.json({ success: true, message: `Bot ${newBot.name} added successfully!`, bot: newBot });
    } catch (e: any) {
      return res.status(500).json({ error: 'Failed to create bot: ' + (e?.message || 'Server error') });
    }
  });

  // Admin: Update API Bot
  app.put('/api/admin/bots/:id', optionalAuth, async (req: any, res: any) => {
    try {
      if (req.user && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Administrator access required' });
      }
      const bot = await ApiBot.findById(req.params.id);
      if (!bot) return res.status(404).json({ error: 'Bot not found' });

      const fields = ['name', 'platform', 'description', 'avatarUrl', 'inviteUrl', 'websiteUrl', 'authorName', 'apiScopes', 'apiUsageDetails', 'serversCount', 'usersProtected', 'isVerified', 'isListed'];
      fields.forEach(f => {
        if (req.body[f] !== undefined) {
          (bot as any)[f] = req.body[f];
        }
      });
      bot.updatedAt = new Date();
      await bot.save();

      return res.json({ success: true, message: 'Bot updated successfully', bot });
    } catch (e: any) {
      return res.status(500).json({ error: 'Failed to update bot: ' + (e?.message || 'Server error') });
    }
  });

  // Admin: Delete API Bot
  app.delete('/api/admin/bots/:id', optionalAuth, async (req: any, res: any) => {
    try {
      if (req.user && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Administrator access required' });
      }
      await ApiBot.findByIdAndDelete(req.params.id);
      return res.json({ success: true, message: 'Bot deleted from directory' });
    } catch (e: any) {
      return res.status(500).json({ error: 'Failed to delete bot' });
    }
  });

  // 5. Public Trusted Companies & Websites Directory
  app.get('/api/public/trusted-companies', async (req: any, res: any) => {
    try {
      const companies = await TrustedCompany.find().sort({ order: 1, createdAt: 1 }).lean();

      return res.json({
        success: true,
        count: companies.length,
        companies
      });
    } catch (e: any) {
      console.error('Failed to fetch trusted companies:', e);
      return res.status(500).json({ error: 'Failed to retrieve trusted companies' });
    }
  });

  // Admin: Add Trusted Company
  app.post('/api/admin/trusted-companies', optionalAuth, async (req: any, res: any) => {
    try {
      if (req.user && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Administrator access required to manage trusted companies directory.' });
      }
      const { name, websiteUrl, logoUrl, industry, description, servicesUsed, isFeatured, order } = req.body;
      if (!name || !websiteUrl) {
        return res.status(400).json({ error: 'Company Name and Website URL are required' });
      }

      const newCompany = new TrustedCompany({
        name: name.trim(),
        websiteUrl: websiteUrl.trim(),
        logoUrl: logoUrl?.trim() || '',
        industry: industry?.trim() || 'Gaming & Metaverse',
        description: description?.trim() || '',
        servicesUsed: Array.isArray(servicesUsed) ? servicesUsed : ['Global Ban Synchronization', 'Threat Intelligence API'],
        isFeatured: isFeatured !== false,
        order: Number(order) || 0,
        createdAt: new Date()
      });

      await newCompany.save();

      await new Log({
        action: 'TRUSTED_COMPANY_ADDED',
        adminId: req.user?.username || 'admin',
        details: `Added trusted partner company: ${newCompany.name} (${newCompany.websiteUrl})`
      }).save().catch(() => null);

      return res.json({ success: true, message: `Company ${newCompany.name} added successfully!`, company: newCompany });
    } catch (e: any) {
      return res.status(500).json({ error: 'Failed to add company: ' + (e?.message || 'Server error') });
    }
  });

  // Admin: Update Trusted Company
  app.put('/api/admin/trusted-companies/:id', optionalAuth, async (req: any, res: any) => {
    try {
      if (req.user && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Administrator access required' });
      }
      const company = await TrustedCompany.findById(req.params.id);
      if (!company) return res.status(404).json({ error: 'Company not found' });

      const fields = ['name', 'websiteUrl', 'logoUrl', 'industry', 'description', 'servicesUsed', 'isFeatured', 'order'];
      fields.forEach(f => {
        if (req.body[f] !== undefined) {
          (company as any)[f] = req.body[f];
        }
      });
      await company.save();

      return res.json({ success: true, message: 'Company updated successfully', company });
    } catch (e: any) {
      return res.status(500).json({ error: 'Failed to update company: ' + (e?.message || 'Server error') });
    }
  });

  // Admin: Delete Trusted Company
  app.delete('/api/admin/trusted-companies/:id', optionalAuth, async (req: any, res: any) => {
    try {
      if (req.user && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Administrator access required' });
      }
      await TrustedCompany.findByIdAndDelete(req.params.id);
      return res.json({ success: true, message: 'Company deleted from directory' });
    } catch (e: any) {
      return res.status(500).json({ error: 'Failed to delete company' });
    }
  });

  // Admin API: List all connected VRChat groups with live metadata
  app.get('/api/admin/vrchat-groups', authenticateToken, isAdmin, async (req: any, res: any) => {
    try {
      const config = await SystemConfig.findOne({ id: 'main' });
      const groupIds = new Set<string>();

      if (config?.vrchatGroupId && config.vrchatGroupId.trim()) {
        groupIds.add(config.vrchatGroupId.trim());
      }
      if (config?.vrchatBotGroups && Array.isArray(config.vrchatBotGroups)) {
        for (const g of config.vrchatBotGroups) {
          if (g && g.trim()) groupIds.add(g.trim());
        }
      }

      const userGroups = await UserVRChatGroup.find();
      for (const ug of userGroups) {
        if (ug.groupId && ug.groupId.trim()) groupIds.add(ug.groupId.trim());
      }

      const activeGuilds = await Guild.find({ 'settings.vrchatBotEnabled': true });
      for (const guild of activeGuilds) {
        const gId = guild.settings?.vrchatGroupId?.trim();
        if (gId) {
          groupIds.add(gId);
        }
      }

      const groupsList: any[] = [];
      for (const groupId of groupIds) {
        const linkedGuilds = activeGuilds
          .filter(g => g.settings?.vrchatGroupId?.trim() === groupId)
          .map(g => ({ id: g.id, name: g.name }));

        let groupDetails: any = {
          groupId,
          name: `VRChat Group (${groupId})`,
          description: '',
          iconUrl: null,
          bannerUrl: null,
          memberCount: null,
          shortCode: null,
          linkedGuilds,
          status: 'online'
        };

        try {
          const data = await serviceClient.getVRChatGroupDetails(groupId);
          groupDetails.name = data.name || groupDetails.name;
          groupDetails.description = data.description || '';
          groupDetails.iconUrl = data.iconUrl || data.bannerUrl || null;
          groupDetails.bannerUrl = data.bannerUrl || null;
          groupDetails.memberCount = data.memberCount || 0;
          groupDetails.shortCode = data.shortCode || null;
          groupDetails.discriminator = data.discriminator || null;
          groupDetails.botAssigned = data.botAssigned;
        } catch (err: any) {
          groupDetails.status = 'error';
          groupDetails.error = err.message || 'Failed to fetch group details';
        }

        groupsList.push(groupDetails);
      }

      res.json({
        totalGroups: groupsList.length,
        groups: groupsList
      });
    } catch (err: any) {
      console.error('[Admin VRChat Groups] Error fetching group list:', err);
      res.status(500).json({ error: 'Failed to retrieve connected VRChat groups' });
    }
  });

  // Admin API: Broadcast announcement across connected VRChat groups
  app.post('/api/admin/vrchat-announcements/broadcast', authenticateToken, isAdmin, async (req: any, res: any) => {
    try {
      const { title, text, imageId, sendNotification, visibility, targetGroupIds } = req.body;
      
      if (!title || !title.trim()) {
        return res.status(400).json({ error: 'Announcement title is required' });
      }
      if (!text || !text.trim()) {
        return res.status(400).json({ error: 'Announcement content text is required' });
      }

      const config = await SystemConfig.findOne({ id: 'main' });
      
      const allGroupIds = new Set<string>();
      if (config?.vrchatGroupId && config.vrchatGroupId.trim()) {
        allGroupIds.add(config.vrchatGroupId.trim());
      }
      if (config?.vrchatBotGroups && Array.isArray(config.vrchatBotGroups)) {
        for (const g of config.vrchatBotGroups) {
          if (g && g.trim()) allGroupIds.add(g.trim());
        }
      }
      const activeGuilds = await Guild.find({ 'settings.vrchatBotEnabled': true });
      for (const guild of activeGuilds) {
        const gId = guild.settings?.vrchatGroupId?.trim();
        if (gId) allGroupIds.add(gId);
      }

      let selectedGroupIds: string[] = [];
      if (Array.isArray(targetGroupIds) && targetGroupIds.length > 0) {
        selectedGroupIds = targetGroupIds.filter((id: string) => allGroupIds.has(id.trim()));
      } else {
        selectedGroupIds = Array.from(allGroupIds);
      }

      if (selectedGroupIds.length === 0) {
        return res.status(400).json({ error: 'No valid connected VRChat groups selected to broadcast announcement to.' });
      }

      const { groupResults, successCount, failedCount } = await serviceClient.broadcastVRChatAnnouncement({
        groupIds: selectedGroupIds,
        title: title.trim(),
        text: text.trim(),
        imageId: imageId?.trim() || undefined,
        sendNotification: sendNotification !== false,
        visibility: visibility || 'group',
      });

      const historyEntry = new VRChatAnnouncementHistory({
        title: title.trim(),
        text: text.trim(),
        imageId: imageId ? imageId.trim() : undefined,
        sendNotification: sendNotification !== false,
        visibility: visibility || 'group',
        sentBy: req.user?.username || 'Admin',
        sentAt: new Date(),
        totalTargeted: selectedGroupIds.length,
        successCount,
        failedCount,
        groupResults
      });
      await historyEntry.save();

      await new Log({
        action: 'VRCHAT_BROADCAST_ANNOUNCEMENT',
        adminId: req.user?.username || 'Admin',
        details: `Broadcast announcement "${title.trim()}" to ${selectedGroupIds.length} VRChat group(s) (${successCount} succeeded, ${failedCount} failed).`
      }).save();

      res.json({
        success: true,
        totalTargeted: selectedGroupIds.length,
        successCount,
        failedCount,
        results: groupResults,
        historyId: historyEntry._id
      });
    } catch (err: any) {
      console.error('[VRChat Broadcast Error]', err);
      res.status(500).json({ error: 'Failed to process VRChat broadcast announcement' });
    }
  });

  // Admin API: Get announcement broadcast history
  app.get('/api/admin/vrchat-announcements/history', authenticateToken, isAdmin, async (req: any, res: any) => {
    try {
      const history = await VRChatAnnouncementHistory.find().sort({ sentAt: -1 }).limit(50).lean();
      res.json(history);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch announcement history' });
    }
  });

  app.get('/api/admin/verifications', authenticateToken, isModOrAdmin, async (req, res) => {
    try {
      const requests = await VerificationRequest.find({ status: 'pending' }).sort({ createdAt: 1 });
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch verification requests' });
    }
  });

  app.post('/api/admin/verifications/:id/action', authenticateToken, isModOrAdmin, async (req: any, res) => {
    try {
      const { status, adminNotes } = req.body;
      const request = await VerificationRequest.findByIdAndUpdate(req.params.id, { 
        $set: {
          status, 
          adminNotes,
          updatedAt: new Date()
        },
        $unset: {
          idPhoto: 1, // Completely remove sensitive identification data from DB after review
          facePhoto: 1 // Completely remove sensitive identification data from DB after review
        }
      }, { new: true });

      if (request) {
        if (status === 'approved') {
          await User.findOneAndUpdate(
            { id: request.userId },
            { 
              $set: { 
                isAgeVerified: true, 
                dob: request.dob,
                ageVerifiedAt: new Date()
              } 
            },
            { upsert: true }
          );

          // Also update web Admin account if userId matches Admin ID, discordId, or username
          try {
            const adminConditions: any[] = [{ discordId: request.userId }];
            if (mongoose.isValidObjectId(request.userId)) {
              adminConditions.push({ _id: request.userId });
            }
            if (request.username) {
              adminConditions.push({ username: request.username });
            }
            await Admin.updateMany(
              { $or: adminConditions },
              { 
                $set: { 
                  isAgeVerified: true, 
                  dob: request.dob, 
                  ageVerifiedAt: new Date() 
                } 
              }
            );
          } catch (admErr) {
            console.warn('Could not update admin account age verification status:', admErr);
          }

          await new Log({
            action: 'AGE_VERIFIED',
            adminId: req.user.username,
            targetId: request.userId,
            details: `Admin approved age verification (${request.source || 'web'}). Born: ${request.dob?.toISOString().split('T')[0]}`
          }).save();
        }

        // Send DM notification
        try {
          const embed = {
            title: `Age Verification ${status.charAt(0).toUpperCase() + status.slice(1)}`,
            description: status === 'approved'
              ? '✅ Your age verification has been approved! You now have access to age-restricted features in participating servers.'
              : `❌ Your age verification was rejected.\n\n**Reason:** ${adminNotes || 'No specific reason provided.'}`,
            color: status === 'approved' ? 0x2ecc71 : 0xe74c3c,
            timestamp: new Date().toISOString()
          };
          await serviceClient.sendDiscordDM(request.userId, { embeds: [embed] });
        } catch (dmErr) {
          console.error('Failed to send DM to user:', request.userId);
        }

        // Send Enterprise Webhook notification if request was submitted with a callbackUrl or linked email
        if ((request as any).callbackUrl || (request as any).email) {
          const cbUrl = (request as any).callbackUrl;
          const userMail = (request as any).email;
          const extId = (request as any).externalUserId || null;
          if (cbUrl && userMail) {
            const cbPayload = status === 'approved' ? {
              mail: userMail,
              userid: extId,
              dob: request.dob ? request.dob.toISOString().split('T')[0] : null,
              status: 'approved' as const
            } : {
              mail: userMail,
              userid: extId,
              status: 'denied' as const
            };
            sendEnterpriseAgeVerifyCallback(cbUrl, cbPayload).catch(() => null);
          }
        }
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to process verification request' });
    }
  });

  // Helper to send Webhook POST request to external platform
  // User Self-Service API: Delete own age verification data
  app.delete('/api/verify/my-data', authenticateToken, async (req: any, res: any) => {
    try {
      const userId = req.user?.discordId || req.user?.id;
      if (!userId) return res.status(400).json({ error: 'No associated account ID found in session' });

      const requestDelete = await VerificationRequest.deleteMany({ userId });
      await User.findOneAndUpdate(
        { id: userId },
        { 
          $set: { isAgeVerified: false }, 
          $unset: { dob: 1, ageVerifiedAt: 1 } 
        }
      );

      await new Log({
        action: 'AGE_VERIFICATION_DELETED',
        adminId: req.user?.username || userId,
        targetId: userId,
        details: `User self-deleted their age verification data.`
      }).save();

      res.json({ success: true, message: 'Your age verification data has been completely erased.' });
    } catch (error: any) {
      console.error('Error in self-service age data deletion:', error);
      res.status(500).json({ error: 'Failed to delete age verification data' });
    }
  });

  
}
