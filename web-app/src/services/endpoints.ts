import { api } from './api'

// ─── Types ────────────────────────────────────────────────────

export interface User {
  id:              string
  fullName:        string
  email:           string
  phone:           string
  role:            string
  kycStatus:       string
  referralCode:    string
  isEmailVerified: boolean
  isPhoneVerified: boolean
  hasPin?:         boolean
  profilePhoto?:   string
  wallet?: {
    mainBalance: number
    bonusBalance: number
    referralBalance: number
    cashbackBalance: number
  }
}

export interface WalletBalance {
  main:     number
  bonus:    number
  referral: number
  cashback: number
  total:    number
}

export interface DataPlan {
  id:           string
  network:      string
  name:         string
  sizeGb:       number
  sizeLabel:    string
  price:        number
  validityDays: number
  category:     string
  providerCode: string
}

export interface SmartBuyResult {
  rank:         number
  planId:       string
  network:      string
  planName:     string
  sizeLabel:    string
  price:        number
  validityDays: number
  valueScore:   number
  badge?:       string
  providerCode: string
}

export interface Transaction {
  id:            string
  type:          string
  network?:      string
  phone?:        string
  planName?:     string
  amount:        number
  status:        string
  reference:     string
  providerToken?: string
  failureReason?: string
  metadata?:     any
  createdAt:     string
  completedAt?:  string
}

export interface MeterInfo {
  customerName:    string
  customerAddress: string
  meterNumber:     string
  minAmount:       number
}

export interface DecoderInfo {
  customerName:   string
  currentPackage: string
  dueDate?:       string
}

export interface NotificationItem {
  id:        string
  userId:    string
  title:     string
  message:   string
  type:      'TRANSACTION' | 'PROMO' | 'SECURITY' | 'SYSTEM'
  isRead:    boolean
  actionUrl?: string
  metadata?: any
  createdAt: string
}

export interface BulkSmsJob {
  id:          string
  senderId:    string
  message:     string
  totalCount:  number
  sentCount:   number
  failedCount: number
  totalCost:   number
  status:      string
  createdAt:   string
  completedAt?: string
}

export interface AirtimeCashRate {
  rate:          number
  merchantPhone: string
  ussdPattern:   string
}

export interface AirtimeCashItem {
  id:            string
  network:       string
  phoneNumber:   string
  airtimeAmount: number
  cashAmount:    number
  ratePercent:   number
  merchantPhone: string
  reference:     string
  status:        string
  adminNote?:    string
  createdAt:     string
}

export interface ReferralStats {
  referralCode:    string
  referralLink:    string
  referralBalance: number
  mainBalance:     number
  totalEarned:     number
  totalReferred:   number
  minWithdrawal:   number
  referredUsers:   Array<{
    id:        string
    name:      string
    phone:     string
    joinedAt:  string
    hasFunded: boolean
  }>
  earningsHistory: Array<{
    id:        string
    amount:    number
    type:      string
    isPaid:    boolean
    createdAt: string
  }>
}

export interface ApiKeyDetails {
  id:           string
  key:          string
  label:        string
  status:       string
  webhookUrl:   string
  requestCount: number
  monthlyLimit: number
  createdAt:    string
  lastUsedAt?:  string
  endpoints: {
    baseUrl:          string
    documentationUrl: string
  }
}

// ─── Auth API ─────────────────────────────────────────────────

export const authApi = {
  register: (data: {
    fullName: string; email: string; phone: string
    password: string; referralCode?: string
  }) => api.post('/auth/register', data),

  verifyEmail: (userId: string, otp: string) =>
    api.post('/auth/verify-email', { userId, otp }),

  login: (email: string, password: string) =>
    api.post<{ success: boolean; data: {
      accessToken: string; refreshToken: string; user: User
    } }>('/auth/login', { email, password }),

  me: () => api.get<{ success: boolean; data: User }>('/auth/me'),

  logout: () => api.post('/auth/logout'),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),

  setPin: (pin: string) => api.post('/auth/set-pin', { pin }),

  changePin: (data: { currentPin: string; newPin: string }) =>
    api.post('/auth/change-pin', data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/auth/change-password', data),

  sendOtp: (purpose: string) => api.post('/auth/send-otp', { purpose }),
}

// ─── Wallet API ───────────────────────────────────────────────

export const walletApi = {
  getBalance: () =>
    api.get<{ success: boolean; data: WalletBalance }>('/wallet/balance'),

  initiateFunding: (amount: number) =>
    api.post<{ success: boolean; data: {
      authorizationUrl: string; reference: string; amount: number
    } }>('/wallet/fund/initiate', { amount }),

  verifyFunding: (reference: string) =>
    api.post<{ success: boolean; message: string; data: { status: string; balance: number } }>(
      '/wallet/fund/verify', { reference }
    ),

  getHistory: (page = 1, limit = 20) =>
    api.get(`/wallet/history?page=${page}&limit=${limit}`),
}

// ─── Data API ─────────────────────────────────────────────────

export const dataApi = {
  getPlans: (network: string) =>
    api.get<{ success: boolean; data: { plans: DataPlan[] } }>(
      `/data/plans/${network}`
    ),

  smartBuy: (budget: number) =>
    api.get<{ success: boolean; data: {
      budget: number
      results: SmartBuyResult[]
      insight: string
    } }>(`/data/smart-buy?budget=${budget}`),

  purchase: (data: { planId: string; phone: string; pin: string }) =>
    api.post('/data/purchase', data),
}

// ─── Airtime API ──────────────────────────────────────────────

export const airtimeApi = {
  purchase: (data: {
    network: string; phone: string; amount: number; pin: string
  }) => api.post('/airtime/purchase', data),
}

// ─── Electricity API ──────────────────────────────────────────

export const electricityApi = {
  verifyMeter: (meterNumber: string, disco: string, meterType: string) =>
    api.post<{ success: boolean; data: MeterInfo }>(
      '/electricity/verify', { meterNumber, disco, meterType }
    ),

  purchase: (data: {
    disco: string; meterNumber: string; meterType: string
    amount: number; phone: string; pin: string
  }) => api.post('/electricity/purchase', data),
}

// ─── Cable TV API ─────────────────────────────────────────────

export const cableApi = {
  verifyDecoder: (decoderNumber: string, provider: string) =>
    api.post<{ success: boolean; data: DecoderInfo }>(
      '/cable/verify', { decoderNumber, provider }
    ),

  purchase: (data: {
    provider: string; decoderNumber: string; variationCode: string
    amount: number; phone: string; pin: string
  }) => api.post('/cable/purchase', data),
}

// ─── Education API ────────────────────────────────────────────

export const educationApi = {
  purchase: (data: {
    serviceId: string; variationCode: string
    amount: number; phone: string; quantity?: number; pin: string
  }) => api.post('/education/purchase', data),
}

// ─── Bulk SMS API ─────────────────────────────────────────────

export const bulkSmsApi = {
  estimate: (message: string, recipients: string[]) =>
    api.post<{ success: boolean; data: {
      charCount: number
      pages: number
      recipientCount: number
      costPerPage: number
      totalUnits: number
      totalCost: number
    } }>('/bulk-sms/estimate', { message, recipients }),

  send: (data: {
    senderId: string
    message: string
    recipients: string[] | string
    pin: string
  }) => api.post<{ success: boolean; message: string; data: {
    reference: string
    jobId: string
    recipientsCount: number
    pages: number
    totalCost: number
  } }>('/bulk-sms/send', data),

  getHistory: (page = 1, limit = 15) =>
    api.get<{ success: boolean; data: {
      items: BulkSmsJob[]
      meta: { page: number; limit: number; total: number; totalPages: number }
    } }>(`/bulk-sms/history?page=${page}&limit=${limit}`),
}

// ─── Airtime to Cash API ──────────────────────────────────────

export const airtimeCashApi = {
  getRates: () =>
    api.get<{ success: boolean; data: {
      rates: Record<string, AirtimeCashRate>
      minAmount: number
      maxAmount: number
    } }>('/airtime-to-cash/rates'),

  submit: (data: {
    network: string
    phoneNumber: string
    airtimeAmount: number
    pin: string
  }) => api.post<{ success: boolean; message: string; data: {
    reference: string
    network: string
    airtimeAmount: number
    cashPayout: number
    ratePercent: number
    merchantPhone: string
    ussdCode: string
    instructions: string
  } }>('/airtime-to-cash/submit', data),

  getHistory: (page = 1, limit = 15) =>
    api.get<{ success: boolean; data: {
      items: AirtimeCashItem[]
      meta: { page: number; limit: number; total: number; totalPages: number }
    } }>(`/airtime-to-cash/history?page=${page}&limit=${limit}`),
}

// ─── Referral API ─────────────────────────────────────────────

export const referralApi = {
  getStats: () =>
    api.get<{ success: boolean; data: ReferralStats }>('/referrals/stats'),

  withdraw: (data: { amount: number; pin: string }) =>
    api.post<{ success: boolean; message: string; data: {
      reference: string
      referralBalance: number
      mainBalance: number
    } }>('/referrals/withdraw', data),
}

// ─── API Key / Reseller API ───────────────────────────────────

export const apiKeyApi = {
  get: () =>
    api.get<{ success: boolean; data: ApiKeyDetails }>('/api-keys'),

  regenerate: () =>
    api.post<{ success: boolean; message: string; data: ApiKeyDetails }>('/api-keys/regenerate'),

  updateWebhook: (webhookUrl: string) =>
    api.put<{ success: boolean; message: string; data: { webhookUrl: string } }>(
      '/api-keys/webhook', { webhookUrl }
    ),
}

// ─── Notifications API ────────────────────────────────────────

export const notificationApi = {
  getAll: (page = 1, limit = 20) =>
    api.get<{ success: boolean; data: {
      items: NotificationItem[]
      unreadCount: number
      meta: { page: number; limit: number; total: number; totalPages: number }
    } }>(`/notifications?page=${page}&limit=${limit}`),

  markAsRead: (id: string) =>
    api.patch(`/notifications/${id}/read`),

  markAllAsRead: () =>
    api.post('/notifications/mark-all-read'),
}

// ─── Transactions API ─────────────────────────────────────────

export const txApi = {
  getAll: (params?: { page?: number; limit?: number; type?: string; status?: string }) => {
    const q = new URLSearchParams()
    if (params?.page)   q.set('page',   String(params.page))
    if (params?.limit)  q.set('limit',  String(params.limit))
    if (params?.type)   q.set('type',   params.type)
    if (params?.status) q.set('status', params.status)
    return api.get<{ success: boolean; data: Transaction[]; meta: Record<string,number> }>(
      `/transactions?${q.toString()}`
    )
  },

  getOne: (id: string) =>
    api.get<{ success: boolean; data: Transaction }>(`/transactions/${id}`),
}
