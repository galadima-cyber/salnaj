import dotenv from 'dotenv'
dotenv.config()

function required(key: string): string {
  const val = process.env[key]
  if (!val) throw new Error(`Missing required environment variable: ${key}`)
  return val
}

function optional(key: string, fallback = ''): string {
  return process.env[key] || fallback
}

export const env = {
  NODE_ENV:    optional('NODE_ENV', 'development'),
  PORT:        parseInt(optional('PORT', '5000')),
  APP_NAME:    optional('APP_NAME', 'Salnaj'),
  APP_URL:     optional('APP_URL', 'http://localhost:5000'),
  FRONTEND_URL: optional('FRONTEND_URL', 'http://localhost:5173'),

  DATABASE_URL: required('DATABASE_URL'),
  REDIS_URL:    optional('REDIS_URL', 'redis://localhost:6379'),

  JWT_SECRET:          required('JWT_SECRET'),
  JWT_REFRESH_SECRET:  required('JWT_REFRESH_SECRET'),
  JWT_EXPIRES_IN:      optional('JWT_EXPIRES_IN', '15m'),
  JWT_REFRESH_EXPIRES_IN: optional('JWT_REFRESH_EXPIRES_IN', '7d'),

  SMTP_HOST:   optional('SMTP_HOST', 'smtp.gmail.com'),
  SMTP_PORT:   parseInt(optional('SMTP_PORT', '587')),
  SMTP_SECURE: optional('SMTP_SECURE', 'false') === 'true',
  SMTP_USER:   optional('SMTP_USER'),
  SMTP_PASS:   optional('SMTP_PASS'),
  EMAIL_FROM:  optional('EMAIL_FROM', 'Salnaj <noreply@salnaj.ng>'),

  TERMII_API_KEY:   optional('TERMII_API_KEY'),
  TERMII_SENDER_ID: optional('TERMII_SENDER_ID', 'Salnaj'),

  PAYSTACK_SECRET_KEY: optional('PAYSTACK_SECRET_KEY'),
  PAYSTACK_PUBLIC_KEY: optional('PAYSTACK_PUBLIC_KEY'),

  VTPASS_API_KEY:    optional('VTPASS_API_KEY'),
  VTPASS_PUBLIC_KEY: optional('VTPASS_PUBLIC_KEY'),
  VTPASS_SECRET_KEY: optional('VTPASS_SECRET_KEY'),
  VTPASS_BASE_URL:   optional('VTPASS_BASE_URL', 'https://sandbox.vtpass.com/api'),

  CLOUDINARY_CLOUD_NAME: optional('CLOUDINARY_CLOUD_NAME'),
  CLOUDINARY_API_KEY:    optional('CLOUDINARY_API_KEY'),
  CLOUDINARY_API_SECRET: optional('CLOUDINARY_API_SECRET'),

  RATE_LIMIT_WINDOW_MS: parseInt(optional('RATE_LIMIT_WINDOW_MS', '900000')),
  RATE_LIMIT_MAX:       parseInt(optional('RATE_LIMIT_MAX', '100')),

  REFERRAL_SIGNUP_BONUS:              parseFloat(optional('REFERRAL_SIGNUP_BONUS', '100')),
  REFERRAL_TRANSACTION_BONUS:         parseFloat(optional('REFERRAL_TRANSACTION_BONUS', '150')),
  REFERRAL_MIN_FUNDING_FOR_BONUS:     parseFloat(optional('REFERRAL_MIN_FUNDING_FOR_BONUS', '500')),

  DAILY_LIMIT_UNVERIFIED: parseFloat(optional('DAILY_LIMIT_UNVERIFIED', '10000')),
  DAILY_LIMIT_VERIFIED:   parseFloat(optional('DAILY_LIMIT_VERIFIED',   '100000')),
  MAX_WALLET_BALANCE:     parseFloat(optional('MAX_WALLET_BALANCE',     '500000')),

  isProd: () => process.env.NODE_ENV === 'production',
  isDev:  () => process.env.NODE_ENV !== 'production',
}
