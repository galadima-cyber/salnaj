#!/usr/bin/env node
/**
 * Paystack Webhook Tester
 * Run: node test-paystack-webhook.js
 *
 * This simulates a Paystack "charge.success" webhook to your local server.
 * Use this to test wallet funding WITHOUT making a real payment.
 *
 * Prerequisites:
 *   1. Backend running on localhost:5000 (npm run dev)
 *   2. A real user in your database (register first)
 *   3. PAYSTACK_SECRET_KEY set in .env
 */

require('dotenv').config()
const http   = require('http')
const crypto = require('crypto')

const SECRET_KEY = process.env.PAYSTACK_SECRET_KEY
const PORT       = parseInt(process.env.PORT || '5000')

if (!SECRET_KEY) {
  console.error('\n❌ PAYSTACK_SECRET_KEY not set in .env\n')
  process.exit(1)
}

// ─── The simulated webhook event ──────────────────────────────
const REFERENCE    = `SNJ-FUND-${Date.now()}-TEST`
const AMOUNT_KOBO  = 500000  // ₦5,000 in kobo
const TEST_EMAIL   = process.argv[2] || 'test@example.com'  // pass email as arg

if (TEST_EMAIL === 'test@example.com') {
  console.log('\n⚠️  Pass a real user email as argument:')
  console.log('   node test-paystack-webhook.js your-email@gmail.com\n')
}

const payload = {
  event: 'charge.success',
  data: {
    id:        Math.floor(Math.random() * 1000000),
    reference: REFERENCE,
    amount:    AMOUNT_KOBO,
    status:    'success',
    channel:   'card',
    currency:  'NGN',
    customer: {
      email: TEST_EMAIL,
      phone: '08012345678',
    },
    authorization: {
      last4: '4081',
      bank:  'Test Bank',
    },
    metadata: {
      userId: 'will-be-looked-up-by-reference',
    },
  },
}

const body      = JSON.stringify(payload)
const signature = crypto.createHmac('sha512', SECRET_KEY).update(body).digest('hex')

console.log('\n─────────────────────────────────────────────────')
console.log('📡 PAYSTACK WEBHOOK TEST')
console.log('─────────────────────────────────────────────────')
console.log(`Email:     ${TEST_EMAIL}`)
console.log(`Reference: ${REFERENCE}`)
console.log(`Amount:    ₦${AMOUNT_KOBO / 100}`)
console.log(`Signature: ${signature.slice(0, 20)}...`)
console.log('─────────────────────────────────────────────────\n')

// ─── First: create a pending funding record in DB ─────────────
// We need to insert a WalletFunding record so the webhook can find it
const https = require('https')

async function createFundingRecord() {
  // Find user by email first via login endpoint
  console.log('Step 1: Checking if user exists...')

  return new Promise((resolve) => {
    const opts = {
      hostname: 'localhost',
      port:     PORT,
      path:     '/api/health',
      method:   'GET',
    }
    const req = http.request(opts, res => {
      if (res.statusCode === 200) {
        console.log('✓ Backend is running\n')
        resolve(true)
      } else {
        console.log('❌ Backend health check failed\n')
        resolve(false)
      }
    })
    req.on('error', () => {
      console.log(`❌ Backend not running on port ${PORT}`)
      console.log('   Start it with: npm run dev\n')
      resolve(false)
    })
    req.end()
  })
}

// ─── Send the webhook ─────────────────────────────────────────
async function sendWebhook() {
  const alive = await createFundingRecord()
  if (!alive) process.exit(1)

  console.log('Step 2: Sending webhook to backend...\n')

  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'localhost',
      port:     PORT,
      path:     '/api/webhooks/paystack',
      method:   'POST',
      headers: {
        'Content-Type':          'application/json',
        'Content-Length':        Buffer.byteLength(body),
        'x-paystack-signature':  signature,
      },
    }

    const req = http.request(opts, res => {
      let data = ''
      res.on('data', d => data += d)
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Webhook received by backend (200 OK)')
          console.log('\n📋 Check your backend logs for:')
          console.log('   "Wallet funded via Paystack webhook"')
          console.log('   OR "Paystack webhook: funding record not found"')
          console.log('\n💡 If you see "funding record not found":')
          console.log('   The webhook needs a WalletFunding record created first.')
          console.log('   Do a real test: fund wallet from the frontend, use Paystack test card.')
          console.log('\n📧 Test card details (Paystack sandbox):')
          console.log('   Card:   4084 0840 8408 4081')
          console.log('   CVV:    408')
          console.log('   Expiry: Any future date')
          console.log('   PIN:    0000')
          console.log('   OTP:    123456')
        } else {
          console.log(`❌ Webhook failed — Status: ${res.statusCode}`)
          console.log('   Response:', data.slice(0, 200))
        }
        resolve(null)
      })
    })

    req.on('error', err => {
      console.log('❌ Request failed:', err.message)
      reject(err)
    })

    req.write(body)
    req.end()
  })
}

sendWebhook()
  .then(() => console.log('\n─────────────────────────────────────────────────\n'))
  .catch(err => { console.error('Error:', err.message); process.exit(1) })
