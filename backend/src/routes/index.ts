import { Router } from 'express'
import { asyncHandler } from '../middlewares/error.middleware'
import { authenticate } from '../middlewares/auth.middleware'
import { authLimiter, otpLimiter, transactionLimiter } from '../middlewares/rateLimiter.middleware'
import { validate, v } from '../middlewares/validate.middleware'
import { body, param, query } from 'express-validator'

// Controllers
import * as AuthCtrl from '../controllers/auth.controller'
import * as WalletCtrl from '../controllers/wallet.controller'
import * as TxCtrl from '../controllers/transaction.controller'
import * as BulkSmsCtrl from '../controllers/bulkSms.controller'
import * as AirtimeCashCtrl from '../controllers/airtimeCash.controller'
import * as ReferralCtrl from '../controllers/referral.controller'
import * as ApiKeyCtrl from '../controllers/apiKey.controller'
import * as NotificationCtrl from '../controllers/notification.controller'

const router = Router()

// ════════════════════════════════════════════════════════════
// AUTH ROUTES   /api/auth/*
// ════════════════════════════════════════════════════════════

const authRouter = Router()

authRouter.post('/register',
  authLimiter,
  [v.required('fullName', 'Full name'), v.email(), v.phone(), v.password()],
  validate,
  asyncHandler(AuthCtrl.register)
)

authRouter.post('/verify-email',
  [v.required('userId'), v.otp()],
  validate,
  asyncHandler(AuthCtrl.verifyEmail)
)

authRouter.post('/login',
  authLimiter,
  [v.email(), body('password').notEmpty().withMessage('Password is required')],
  validate,
  asyncHandler(AuthCtrl.login)
)

authRouter.post('/refresh',
  [body('refreshToken').notEmpty().withMessage('Refresh token required')],
  validate,
  asyncHandler(AuthCtrl.refreshToken)
)

authRouter.post('/logout',
  authenticate,
  asyncHandler(AuthCtrl.logout)
)

authRouter.post('/forgot-password',
  authLimiter,
  [v.email()],
  validate,
  asyncHandler(AuthCtrl.forgotPassword)
)

authRouter.post('/reset-password',
  [
    body('token').notEmpty().withMessage('Reset token required'),
    v.password(),
  ],
  validate,
  asyncHandler(AuthCtrl.resetPassword)
)

authRouter.post('/set-pin',
  authenticate,
  [v.pin()],
  validate,
  asyncHandler(AuthCtrl.setPin)
)

authRouter.post('/change-pin',
  authenticate,
  [
    body('currentPin').isLength({ min: 4, max: 4 }).withMessage('Current PIN must be 4 digits'),
    body('newPin').isLength({ min: 4, max: 4 }).withMessage('New PIN must be 4 digits'),
  ],
  validate,
  asyncHandler(AuthCtrl.changePin)
)

authRouter.post('/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
  ],
  validate,
  asyncHandler(AuthCtrl.changePassword)
)

authRouter.post('/send-otp',
  authenticate,
  otpLimiter,
  [body('purpose').isIn(['EMAIL_VERIFY', 'PHONE_VERIFY', 'TRANSACTION']).withMessage('Invalid OTP purpose')],
  validate,
  asyncHandler(AuthCtrl.sendOtp)
)

authRouter.get('/me',
  authenticate,
  asyncHandler(AuthCtrl.getMe)
)

// ════════════════════════════════════════════════════════════
// WALLET ROUTES   /api/wallet/*
// ════════════════════════════════════════════════════════════

const walletRouter = Router()
walletRouter.use(authenticate)

walletRouter.get('/balance',
  asyncHandler(WalletCtrl.getBalance)
)

walletRouter.post('/fund/initiate',
  [v.amount('amount', 100)],
  validate,
  asyncHandler(WalletCtrl.initiateFunding)
)

walletRouter.post('/fund/verify',
  asyncHandler(WalletCtrl.verifyFunding)
)

walletRouter.get('/history',
  asyncHandler(WalletCtrl.getWalletHistory)
)

// ════════════════════════════════════════════════════════════
// DATA ROUTES   /api/data/*
// ════════════════════════════════════════════════════════════

const dataRouter = Router()
dataRouter.use(authenticate)

dataRouter.get('/plans/:network',
  [param('network').isIn(['MTN', 'AIRTEL', 'GLO', 'ETISALAT']).withMessage('Invalid network')],
  validate,
  asyncHandler(TxCtrl.getDataPlans)
)

dataRouter.get('/smart-buy',
  [query('budget').isFloat({ min: 100 }).withMessage('Budget must be at least ₦100')],
  validate,
  asyncHandler(TxCtrl.smartBuy)
)

dataRouter.post('/purchase',
  transactionLimiter,
  [
    v.required('planId'),
    v.phone(),
    v.pin(),
  ],
  validate,
  asyncHandler(TxCtrl.purchaseData)
)

// ════════════════════════════════════════════════════════════
// AIRTIME ROUTES   /api/airtime/*
// ════════════════════════════════════════════════════════════

const airtimeRouter = Router()
airtimeRouter.use(authenticate)

airtimeRouter.post('/purchase',
  transactionLimiter,
  [v.network(), v.phone(), v.amount('amount', 50), v.pin()],
  validate,
  asyncHandler(TxCtrl.purchaseAirtime)
)

// ════════════════════════════════════════════════════════════
// ELECTRICITY ROUTES   /api/electricity/*
// ════════════════════════════════════════════════════════════

const electricityRouter = Router()
electricityRouter.use(authenticate)

electricityRouter.post('/verify',
  [
    v.required('meterNumber', 'Meter number'),
    v.required('disco', 'DISCO'),
    body('meterType').isIn(['prepaid', 'postpaid']).withMessage('Meter type must be prepaid or postpaid'),
  ],
  validate,
  asyncHandler(TxCtrl.verifyMeter)
)

electricityRouter.post('/purchase',
  transactionLimiter,
  [
    v.required('disco'),
    v.required('meterNumber', 'Meter number'),
    body('meterType').isIn(['prepaid', 'postpaid']).withMessage('Invalid meter type'),
    v.amount('amount', 500),
    v.phone(),
    v.pin(),
  ],
  validate,
  asyncHandler(TxCtrl.purchaseElectricity)
)

// ════════════════════════════════════════════════════════════
// CABLE TV ROUTES   /api/cable/*
// ════════════════════════════════════════════════════════════

const cableRouter = Router()
cableRouter.use(authenticate)

cableRouter.post('/verify',
  [v.required('decoderNumber', 'Decoder number'), v.required('provider')],
  validate,
  asyncHandler(TxCtrl.verifyDecoder)
)

cableRouter.post('/purchase',
  transactionLimiter,
  [
    v.required('provider'),
    v.required('decoderNumber', 'Decoder number'),
    v.required('variationCode', 'Package'),
    v.amount('amount', 1000),
    v.phone(),
    v.pin(),
  ],
  validate,
  asyncHandler(TxCtrl.purchaseCableTv)
)

// ════════════════════════════════════════════════════════════
// EDUCATION ROUTES   /api/education/*
// ════════════════════════════════════════════════════════════

const educationRouter = Router()
educationRouter.use(authenticate)

educationRouter.post('/purchase',
  transactionLimiter,
  [
    body('serviceId').isIn(['waec', 'neco', 'jamb']).withMessage('Invalid service'),
    v.required('variationCode'),
    v.amount('amount', 1000),
    v.phone(),
    body('quantity').optional().isInt({ min: 1, max: 50 }),
    v.pin(),
  ],
  validate,
  asyncHandler(TxCtrl.purchaseEducation)
)

// ════════════════════════════════════════════════════════════
// BULK SMS ROUTES   /api/bulk-sms/*
// ════════════════════════════════════════════════════════════

const bulkSmsRouter = Router()
bulkSmsRouter.use(authenticate)

bulkSmsRouter.post('/estimate',
  asyncHandler(BulkSmsCtrl.estimateCost)
)

bulkSmsRouter.post('/send',
  transactionLimiter,
  asyncHandler(BulkSmsCtrl.sendBulkSms)
)

bulkSmsRouter.get('/history',
  asyncHandler(BulkSmsCtrl.getBulkSmsHistory)
)

// ════════════════════════════════════════════════════════════
// AIRTIME TO CASH ROUTES   /api/airtime-to-cash/*
// ════════════════════════════════════════════════════════════

const airtimeCashRouter = Router()
airtimeCashRouter.use(authenticate)

airtimeCashRouter.get('/rates',
  asyncHandler(AirtimeCashCtrl.getRates)
)

airtimeCashRouter.post('/submit',
  transactionLimiter,
  asyncHandler(AirtimeCashCtrl.submitConversion)
)

airtimeCashRouter.get('/history',
  asyncHandler(AirtimeCashCtrl.getConversionHistory)
)

airtimeCashRouter.post('/:id/confirm-transfer',
  asyncHandler(AirtimeCashCtrl.confirmTransfer)
)

airtimeCashRouter.patch('/:id/complete',
  asyncHandler(AirtimeCashCtrl.completeConversion)
)

airtimeCashRouter.patch('/:id/reject',
  asyncHandler(AirtimeCashCtrl.rejectConversion)
)

// ════════════════════════════════════════════════════════════
// REFERRAL ROUTES   /api/referrals/*
// ════════════════════════════════════════════════════════════

const referralRouter = Router()
referralRouter.use(authenticate)

referralRouter.get('/stats',
  asyncHandler(ReferralCtrl.getReferralStats)
)

referralRouter.post('/withdraw',
  transactionLimiter,
  asyncHandler(ReferralCtrl.withdrawReferralEarnings)
)

// ════════════════════════════════════════════════════════════
// API KEYS ROUTES   /api/api-keys/*
// ════════════════════════════════════════════════════════════

const apiKeyRouter = Router()
apiKeyRouter.use(authenticate)

apiKeyRouter.get('/',
  asyncHandler(ApiKeyCtrl.getApiKey)
)

apiKeyRouter.post('/regenerate',
  asyncHandler(ApiKeyCtrl.regenerateApiKey)
)

apiKeyRouter.put('/webhook',
  asyncHandler(ApiKeyCtrl.updateWebhook)
)

// ════════════════════════════════════════════════════════════
// NOTIFICATION ROUTES   /api/notifications/*
// ════════════════════════════════════════════════════════════

const notificationRouter = Router()
notificationRouter.use(authenticate)

notificationRouter.get('/',
  asyncHandler(NotificationCtrl.getNotifications)
)

notificationRouter.patch('/:id/read',
  asyncHandler(NotificationCtrl.markAsRead)
)

notificationRouter.post('/mark-all-read',
  asyncHandler(NotificationCtrl.markAllAsRead)
)

// ════════════════════════════════════════════════════════════
// TRANSACTION HISTORY   /api/transactions/*
// ════════════════════════════════════════════════════════════

const txRouter = Router()
txRouter.use(authenticate)

txRouter.get('/', asyncHandler(TxCtrl.getTransactions))
txRouter.get('/:id', asyncHandler(TxCtrl.getTransaction))

// ════════════════════════════════════════════════════════════
// WEBHOOK ROUTES   /api/webhooks/*
// ════════════════════════════════════════════════════════════

const webhookRouter = Router()
webhookRouter.post('/paystack', asyncHandler(WalletCtrl.paystackWebhook))

// ════════════════════════════════════════════════════════════
// HEALTH CHECK   /api/health
// ════════════════════════════════════════════════════════════

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: process.env.APP_NAME || 'Salnaj',
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
  })
})

// ════════════════════════════════════════════════════════════
// MOUNT ALL ROUTERS
// ════════════════════════════════════════════════════════════

router.use('/auth', authRouter)
router.use('/wallet', walletRouter)
router.use('/data', dataRouter)
router.use('/airtime', airtimeRouter)
router.use('/electricity', electricityRouter)
router.use('/cable', cableRouter)
router.use('/education', educationRouter)
router.use('/bulk-sms', bulkSmsRouter)
router.use('/airtime-to-cash', airtimeCashRouter)
router.use('/referrals', referralRouter)
router.use('/api-keys', apiKeyRouter)
router.use('/notifications', notificationRouter)
router.use('/transactions', txRouter)
router.use('/webhooks', webhookRouter)

export default router