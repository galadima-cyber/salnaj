/**
 * SALNAJ — BRAND CONFIGURATION
 * ─────────────────────────────────────────────────────────────────
 * This is the SINGLE file that controls the entire app's identity.
 * To white-label for a new client:
 *   1. Copy this project
 *   2. Update values below
 *   3. Swap logo asset
 *   4. Deploy
 * ─────────────────────────────────────────────────────────────────
 */

export const brandConfig = {
  app: {
    name: 'Salnaj',
    tagline: 'Fast. Smart. Seamless.',
    description:
      'Nigeria\'s most intelligent VTU platform — buy data, airtime, pay bills, and more in seconds.',
    logo: '/assets/logo.svg',          // swap for client logo
    logoText: 'Salnaj',               // shown when logo SVG is loading
    favicon: '/favicon.ico',
    year: new Date().getFullYear(),
  },

  colors: {
    // Primary — deep sapphire: conveys trust, fintech authority
    primary: '#2D5BE3',
    primaryLight: '#4F78F1',
    primaryDark: '#1A3EB8',

    // Secondary — rich emerald: money, growth, Nigerian energy
    secondary: '#059669',
    secondaryLight: '#10B981',
    secondaryDark: '#047857',

    // Accent — warm amber: CTAs, highlights, urgency without alarm
    accent: '#F59E0B',
    accentLight: '#FCD34D',
    accentDark: '#D97706',

    // Surfaces — light mode
    background: '#F0F4FF',
    surface: '#FFFFFF',
    surfaceElevated: '#F8FAFF',
    border: '#E2E8F8',

    // Surfaces — dark mode
    darkBackground: '#080C18',
    darkSurface: '#0F1526',
    darkSurfaceElevated: '#161D35',
    darkBorder: '#1E2A4A',

    // Text
    textPrimary: '#0A0F1E',
    textSecondary: '#4A5578',
    textMuted: '#8492B4',
    textInverse: '#FFFFFF',

    // Status
    success: '#059669',
    warning: '#D97706',
    error: '#DC2626',
    info: '#2563EB',
  },

  fonts: {
    // Plus Jakarta Sans — modern, geometric, fintech-native
    // Excellent for display, numbers, and UI labels
    heading: '"Plus Jakarta Sans", sans-serif',
    // DM Sans — clean, highly legible at small sizes
    body: '"DM Sans", sans-serif',
    // JetBrains Mono — for reference codes, API keys, transaction IDs
    mono: '"JetBrains Mono", monospace',
    // Google Fonts import URLs
    googleFontsUrl:
      'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap',
  },

  contact: {
    email: 'support@salnaj.ng',           // PLACEHOLDER — client to provide
    phone: '+234 800 000 0000',            // PLACEHOLDER — client to provide
    whatsapp: '+2348000000000',            // PLACEHOLDER — client to provide
    address: 'Nigeria',                    // PLACEHOLDER — client to provide
    instagram: '@salnaj_ng',              // PLACEHOLDER — client to provide
    twitter: '@salnaj_ng',               // PLACEHOLDER — client to provide
    facebook: 'SalnajNG',                // PLACEHOLDER — client to provide
  },

  // ─── Feature Toggles ───────────────────────────────────────────
  // Turn services on/off per client without touching code
  features: {
    // Core (Option 1)
    airtime: true,
    data: true,
    electricity: true,
    cableTv: true,
    education: true,           // WAEC / NECO / JAMB
    walletFunding: true,
    transactionHistory: true,

    // Extended (Option 2)
    airtimeToCash: true,
    bettingWallet: true,
    bulkSms: true,
    rechargeCardPrinting: true,
    referralSystem: true,
    apiAccess: true,

    // Unique Differentiators
    smartBuy: true,
    dataAutopilot: true,
    dataGiftCard: true,
    spendingAnalytics: true,

    // Platform
    darkMode: true,
    pwaInstall: true,
    pushNotifications: true,
  },

  limits: {
    minWalletFunding: 100,           // ₦100
    maxWalletBalance: 500_000,       // ₦500,000
    dailyTransactionLimit: 100_000,  // ₦100,000 for unverified users
    verifiedDailyLimit: 500_000,
    minAirtimePurchase: 50,
    minDataPurchase: 100,
    minElectricityPurchase: 500,
  },

  currency: {
    code: 'NGN',
    symbol: '₦',
    locale: 'en-NG',
  },

  country: {
    name: 'Nigeria',
    code: 'NG',
    callingCode: '+234',
    flag: '🇳🇬',
  },

  // ─── Bank Account ─────────────────────────────────────────────
  // NOTE TO CLIENT: Bank account details needed before going live.
  // This is used for wallet settlement and withdrawal processing.
  settlement: {
    bankName: '',        // CLIENT TO PROVIDE
    accountName: '',     // CLIENT TO PROVIDE
    accountNumber: '',   // CLIENT TO PROVIDE
  },

  // ─── SEO ──────────────────────────────────────────────────────
  seo: {
    title: 'Salnaj — Buy Data, Airtime & Pay Bills Instantly',
    description:
      'Salnaj is Nigeria\'s fastest VTU platform. Buy data, airtime, pay electricity bills, cable TV, and more. Instant delivery, wallet-powered.',
    keywords:
      'buy data Nigeria, VTU platform, MTN data, Airtel airtime, DSTV subscription, electricity bill payment, Salnaj',
    ogImage: '/assets/og-image.png',
  },
} as const

// ─── Type export for autocomplete everywhere ───────────────────
export type BrandConfig = typeof brandConfig
