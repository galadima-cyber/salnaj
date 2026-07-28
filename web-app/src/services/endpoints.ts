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
  profilePhoto?:   string
  wallet?: { mainBalance: number; bonusBalance: number }
}

export interface WalletBalance {
  main:     number
  bonus:    number
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

export interface PaginatedResponse<T> {
  items:      T[]
  page:       number
  limit:      number
  total:      number
  totalPages: number
}

// ─── Auth ─────────────────────────────────────────────────────

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

  sendOtp: (purpose: string) => api.post('/auth/send-otp', { purpose }),
}

// ─── Wallet ───────────────────────────────────────────────────

export const walletApi = {
  getBalance: () =>
    api.get<{ success: boolean; data: WalletBalance }>('/wallet/balance'),

  initiateFunding: (amount: number) =>
    api.post<{ success: boolean; data: {
      authorizationUrl: string; reference: string; amount: number
    } }>('/wallet/fund/initiate', { amount }),

  getHistory: (page = 1, limit = 20) =>
    api.get(`/wallet/history?page=${page}&limit=${limit}`),
}

// ─── Data ─────────────────────────────────────────────────────

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

// ─── Airtime ──────────────────────────────────────────────────

export const airtimeApi = {
  purchase: (data: {
    network: string; phone: string; amount: number; pin: string
  }) => api.post('/airtime/purchase', data),
}

// ─── Electricity ──────────────────────────────────────────────

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

// ─── Cable TV ─────────────────────────────────────────────────

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

// ─── Education ────────────────────────────────────────────────

export const educationApi = {
  purchase: (data: {
    serviceId: string; variationCode: string
    amount: number; phone: string; quantity?: number; pin: string
  }) => api.post('/education/purchase', data),
}

// ─── Betting ──────────────────────────────────────────────────

export const bettingApi = {
  verifyUser: (userId: string, serviceId: string) =>
    api.post<{ success: boolean; data: { name: string } }>(
      '/betting/verify', { userId, serviceId }
    ),

  fund: (data: {
    serviceId: string; bettingId: string
    amount: number; phone: string; pin: string
  }) => api.post('/betting/fund', data),
}

// ─── Transactions ─────────────────────────────────────────────

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
