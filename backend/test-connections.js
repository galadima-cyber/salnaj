#!/usr/bin/env node
/**
 * Salnaj Connection Test
 * Run: node test-connections.js
 *
 * Tests every external service and reports pass/fail.
 * Run this BEFORE deploying to catch config issues early.
 */

require('dotenv').config()
const https   = require('https')
const http    = require('http')
const { execSync } = require('child_process')

const OK   = '✅'
const FAIL = '❌'
const WARN = '⚠️ '

let passed = 0
let failed = 0

function pass(label) { console.log(`  ${OK}  ${label}`); passed++ }
function fail(label, detail = '') {
  console.log(`  ${FAIL}  ${label}`)
  if (detail) console.log(`       → ${detail}`)
  failed++
}
function warn(label) { console.log(`  ${WARN} ${label}`) }

async function testPostgres() {
  console.log('\n─── PostgreSQL ─────────────────────────────')
  const url = process.env.DATABASE_URL
  if (!url) { fail('DATABASE_URL not set'); return }

  try {
    // Use Prisma to test connection
    const result = execSync(
      'npx prisma db execute --stdin <<< "SELECT 1 as ok"',
      { stdio: ['pipe', 'pipe', 'pipe'], timeout: 10000 }
    ).toString()
    pass('Database connection successful')

    // Check if tables exist
    const tables = execSync(
      `node -e "const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.user.count().then(n=>{console.log(n);p.$disconnect()}).catch(e=>{console.error(e.message);process.exit(1)})"`,
      { stdio: ['pipe', 'pipe', 'pipe'], timeout: 10000 }
    ).toString().trim()

    if (parseInt(tables) >= 0) {
      pass(`Users table exists (${tables} users)`)
    }
  } catch (e) {
    fail('Database connection failed', e.message?.split('\n')[0] || 'Unknown error')
    warn('Make sure DATABASE_URL is correct and database is running')
  }
}

async function testRedis() {
  console.log('\n─── Redis ──────────────────────────────────')
  const url = process.env.REDIS_URL
  if (!url) { fail('REDIS_URL not set'); return }

  try {
    const result = execSync(
      `node -e "const Redis=require('ioredis');const r=new Redis('${url}',{lazyConnect:true,maxRetriesPerRequest:1});r.connect().then(()=>r.ping()).then(p=>{console.log(p);r.quit()}).catch(e=>{console.error(e.message);process.exit(1)})"`,
      { stdio: ['pipe', 'pipe', 'pipe'], timeout: 10000 }
    ).toString().trim()
    if (result === 'PONG') pass('Redis connected (PONG received)')
    else fail('Unexpected Redis response', result)
  } catch (e) {
    fail('Redis connection failed', e.message?.split('\n')[0] || 'Check REDIS_URL')
  }
}

async function testPaystack() {
  console.log('\n─── Paystack ───────────────────────────────')
  const key = process.env.PAYSTACK_SECRET_KEY
  if (!key) { fail('PAYSTACK_SECRET_KEY not set'); return }

  return new Promise(resolve => {
    const req = https.get(
      'https://api.paystack.co/transaction?perPage=1',
      { headers: { Authorization: `Bearer ${key}` } },
      res => {
        let data = ''
        res.on('data', d => data += d)
        res.on('end', () => {
          try {
            const json = JSON.parse(data)
            if (json.status) {
              pass(`Paystack API connected (${key.startsWith('sk_live_') ? 'LIVE' : 'TEST'} key)`)
              if (key.startsWith('sk_live_')) warn('Using LIVE Paystack key — real charges apply!')
            } else {
              fail('Paystack API returned error', json.message || 'Unknown')
            }
          } catch {
            fail('Paystack response parse failed')
          }
          resolve()
        })
      }
    )
    req.on('error', e => { fail('Paystack connection failed', e.message); resolve() })
    req.setTimeout(8000, () => { fail('Paystack timeout'); req.destroy(); resolve() })
  })
}

async function testVTPass() {
  console.log('\n─── VTPass ─────────────────────────────────')
  const apiKey    = process.env.VTPASS_API_KEY
  const secretKey = process.env.VTPASS_SECRET_KEY
  const baseUrl   = process.env.VTPASS_BASE_URL

  if (!apiKey || !secretKey) { fail('VTPASS_API_KEY or VTPASS_SECRET_KEY not set'); return }

  const isSandbox = baseUrl?.includes('sandbox')
  if (isSandbox) warn('Using VTPass SANDBOX — no real transactions')
  else warn('Using VTPass LIVE — real purchases will be made!')

  return new Promise(resolve => {
    const url = new URL(`${baseUrl}/balance`)
    const options = {
      hostname: url.hostname,
      path:     url.pathname,
      method:   'GET',
      headers:  {
        'api-key':    apiKey,
        'secret-key': secretKey,
      },
    }

    const req = https.request(options, res => {
      let data = ''
      res.on('data', d => data += d)
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          if (json.code === '000') {
            const bal = json.contents?.balance ?? 'unknown'
            pass(`VTPass connected — Wallet balance: ₦${bal}`)
            if (parseFloat(bal) < 1000) warn('VTPass balance low! Fund before testing purchases.')
          } else {
            fail('VTPass API error', json.response_description || JSON.stringify(json))
          }
        } catch {
          fail('VTPass response parse failed', data.slice(0, 100))
        }
        resolve()
      })
    })
    req.on('error', e => { fail('VTPass connection failed', e.message); resolve() })
    req.setTimeout(10000, () => { fail('VTPass timeout'); req.destroy(); resolve() })
    req.end()
  })
}

async function testTermii() {
  console.log('\n─── Termii SMS ─────────────────────────────')
  const key = process.env.TERMII_API_KEY
  if (!key) { fail('TERMII_API_KEY not set'); return }

  return new Promise(resolve => {
    const req = https.get(
      `https://api.ng.termii.com/api/get-balance?api_key=${key}`,
      res => {
        let data = ''
        res.on('data', d => data += d)
        res.on('end', () => {
          try {
            const json = JSON.parse(data)
            if (json.balance !== undefined) {
              pass(`Termii connected — SMS balance: ${json.balance} units`)
              if (json.balance < 50) warn('Low Termii balance — top up before going live')
            } else {
              fail('Termii API error', json.message || JSON.stringify(json))
            }
          } catch {
            fail('Termii response parse failed')
          }
          resolve()
        })
      }
    )
    req.on('error', e => { fail('Termii connection failed', e.message); resolve() })
    req.setTimeout(8000, () => { fail('Termii timeout'); req.destroy(); resolve() })
  })
}

async function testEmail() {
  console.log('\n─── Email (SMTP) ───────────────────────────')
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!user || !pass) { fail('SMTP_USER or SMTP_PASS not set'); return }

  try {
    execSync(
      `node -e "
        const n=require('nodemailer');
        const t=n.createTransport({host:'smtp.gmail.com',port:587,secure:false,auth:{user:'${user}',pass:'${pass}'}});
        t.verify().then(()=>{console.log('ok');process.exit(0)}).catch(e=>{console.error(e.message);process.exit(1)})
      "`,
      { stdio: ['pipe', 'pipe', 'pipe'], timeout: 12000 }
    )
    pass(`SMTP connected (${user})`)
  } catch (e) {
    const msg = e.stderr?.toString() || e.message || ''
    if (msg.includes('Invalid login')) fail('Gmail login failed — check App Password (not regular password)')
    else if (msg.includes('2FA'))       fail('Gmail 2FA issue — generate App Password from Google Account')
    else fail('SMTP connection failed', msg.split('\n')[0])
  }
}

async function testJwt() {
  console.log('\n─── JWT Secrets ────────────────────────────')
  const s1 = process.env.JWT_SECRET
  const s2 = process.env.JWT_REFRESH_SECRET
  if (!s1)        fail('JWT_SECRET not set')
  else if (s1.length < 32) fail('JWT_SECRET too short (should be 64+ chars hex)')
  else            pass(`JWT_SECRET set (${s1.length} chars)`)

  if (!s2)        fail('JWT_REFRESH_SECRET not set')
  else if (s2 === s1) fail('JWT_REFRESH_SECRET must be DIFFERENT from JWT_SECRET')
  else            pass('JWT_REFRESH_SECRET set and unique')
}

async function main() {
  console.log('\n╔══════════════════════════════════════════╗')
  console.log('║    SALNAJ CONNECTION TEST                ║')
  console.log('╚══════════════════════════════════════════╝')

  await testJwt()
  await testPostgres()
  await testRedis()
  await testEmail()
  await testTermii()
  await testPaystack()
  await testVTPass()

  console.log('\n──────────────────────────────────────────')
  console.log(`Result: ${passed} passed, ${failed} failed`)

  if (failed === 0) {
    console.log('\n🎉 ALL CONNECTIONS WORKING!')
    console.log('   You are ready to run: npm run dev\n')
  } else {
    console.log('\n⚠️  Fix the failed connections before deploying.\n')
    process.exit(1)
  }
}

main().catch(err => {
  console.error('\nTest script error:', err.message)
  process.exit(1)
})
