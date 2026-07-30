#!/usr/bin/env node
/**
 * VTPass Plan Fetcher
 * Run: node fetch-vtpass-plans.js
 *
 * What this does:
 * 1. Connects to VTPass API using your keys
 * 2. Fetches real variation codes for all 4 networks
 * 3. Writes a ready-to-use seed file with correct codes
 * 4. Shows you current VTPass wallet balance
 *
 * Run this BEFORE running db:seed
 */

require('dotenv').config()
const https = require('https')
const fs    = require('fs')
const path  = require('path')

const API_KEY    = process.env.VTPASS_API_KEY
const SECRET_KEY = process.env.VTPASS_SECRET_KEY
const BASE_URL   = process.env.VTPASS_BASE_URL || 'https://sandbox.vtpass.com/api'

if (!API_KEY || !SECRET_KEY) {
  console.error('\n❌ VTPASS_API_KEY and VTPASS_SECRET_KEY must be set in .env\n')
  process.exit(1)
}

const isSandbox = BASE_URL.includes('sandbox')
console.log(`\n🔌 Connecting to VTPass ${isSandbox ? '(SANDBOX)' : '(LIVE)'}...`)
console.log(`   URL: ${BASE_URL}\n`)

// ─── Helper: HTTPS GET ─────────────────────────────────────────
function vtpassGet(endpoint) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${endpoint}`
    const req = https.get(url, {
      headers: {
        'api-key':    API_KEY,
        'secret-key': SECRET_KEY,
        'Content-Type': 'application/json',
      },
    }, res => {
      let data = ''
      res.on('data', d => data += d)
      res.on('end', () => {
        try { resolve(JSON.parse(data)) }
        catch { reject(new Error(`Invalid JSON from ${endpoint}: ${data.slice(0, 100)}`)) }
      })
    })
    req.on('error', reject)
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')) })
  })
}

// ─── Fetch variations for a service ───────────────────────────
async function fetchVariations(serviceID) {
  try {
    const data = await vtpassGet(`/service-variations?serviceID=${serviceID}`)
    if (data.content && data.content.varations) {
      return data.content.varations
    }
    if (data.content && data.content.variations) {
      return data.content.variations
    }
    console.warn(`  ⚠️  No variations found for ${serviceID}:`, JSON.stringify(data).slice(0, 200))
    return []
  } catch (err) {
    console.warn(`  ⚠️  Failed to fetch ${serviceID}: ${err.message}`)
    return []
  }
}

// ─── Map VTPass variation to our DataPlan format ───────────────
function mapPlan(variation, network, category = 'SME') {
  const name  = variation.name || variation.variation_name || ''
  const code  = variation.variation_code || ''
  const price = parseFloat(variation.variation_amount || variation.fixedPrice || 0)

  // Extract size from name (e.g. "MTN 1GB" → 1, "MTN 500MB" → 0.5)
  const gbMatch  = name.match(/(\d+(?:\.\d+)?)\s*GB/i)
  const mbMatch  = name.match(/(\d+(?:\.\d+)?)\s*MB/i)
  const sizeGb   = gbMatch ? parseFloat(gbMatch[1]) : mbMatch ? parseFloat(mbMatch[1]) / 1024 : 0
  const sizeLabel= gbMatch ? `${gbMatch[1]}GB` : mbMatch ? `${mbMatch[1]}MB` : 'Unknown'

  // Extract validity from name
  const dayMatch     = name.match(/(\d+)\s*[Dd]ay/)
  const monthMatch   = name.match(/(\d+)\s*[Mm]onth/)
  const validityDays = monthMatch
    ? parseInt(monthMatch[1]) * 30
    : dayMatch ? parseInt(dayMatch[1]) : 30

  // Determine category
  let cat = category
  if (name.toLowerCase().includes('sme'))       cat = 'SME'
  if (name.toLowerCase().includes('corporate')) cat = 'CORPORATE'
  if (validityDays <= 3)  cat = 'DAILY'
  if (validityDays === 7) cat = 'WEEKLY'

  return { network, name, sizeGb, sizeLabel, price, validityDays, category: cat, providerCode: code }
}

// ─── Main ──────────────────────────────────────────────────────
async function main() {
  // 1. Check balance first
  try {
    const balData = await vtpassGet('/balance')
    if (balData.code === '000') {
      const bal = balData.contents?.balance ?? balData.wallet_balance ?? 'unknown'
      console.log(`💰 VTPass Wallet Balance: ₦${bal}`)
      if (parseFloat(bal) < 500) {
        console.log('   ⚠️  Balance is low. Top up before processing real purchases.')
      }
    }
  } catch (e) {
    console.log('   Could not fetch balance:', e.message)
  }

  console.log('\n📦 Fetching data plans for all networks...\n')

  const services = [
    { serviceID: 'mtn-data',      network: 'MTN'      },
    { serviceID: 'airtel-data',   network: 'AIRTEL'   },
    { serviceID: 'glo-data',      network: 'GLO'      },
    { serviceID: 'etisalat-data', network: 'ETISALAT' },
  ]

  const allPlans = []
  const summary  = {}

  for (const svc of services) {
    process.stdout.write(`  Fetching ${svc.network}...`)
    const variations = await fetchVariations(svc.serviceID)
    const plans = variations
      .map(v => mapPlan(v, svc.network))
      .filter(p => p.price > 0 && p.providerCode && p.sizeGb > 0)

    allPlans.push(...plans)
    summary[svc.network] = plans.length
    console.log(` ✓ ${plans.length} plans found`)

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 500))
  }

  if (allPlans.length === 0) {
    console.log('\n❌ No plans fetched. Check your API keys and VTPass URL.\n')
    process.exit(1)
  }

  console.log(`\n✅ Total plans fetched: ${allPlans.length}`)
  Object.entries(summary).forEach(([net, count]) => console.log(`   ${net}: ${count} plans`))

  // 2. Apply a small markup over VTPass price (your profit margin)
  // You buy at VTPass price, sell at our price
  // Adjust MARGIN_PERCENT to set your profit %
  const MARGIN_PERCENT = 15  // 15% markup — you can change this
  const markedUp = allPlans.map(p => ({
    ...p,
    price: Math.ceil(p.price * (1 + MARGIN_PERCENT / 100) / 10) * 10, // round up to nearest 10
  }))

  console.log(`\n💲 Applied ${MARGIN_PERCENT}% margin on all plans`)

  // 3. Generate the seed data file
  const seedContent = generateSeedFile(markedUp, MARGIN_PERCENT)
  const seedPath    = path.join(__dirname, 'src', 'utils', 'plans-seed.generated.ts')
  fs.writeFileSync(seedPath, seedContent)

  console.log(`\n📄 Generated: src/utils/plans-seed.generated.ts`)
  console.log('   This file has real VTPass codes and your marked-up prices.')

  // 4. Print sample plans
  console.log('\n📋 Sample plans:')
  markedUp.slice(0, 8).forEach(p => {
    console.log(`   ${p.network} ${p.sizeLabel} — ₦${p.price} (${p.validityDays}d) [${p.providerCode}]`)
  })

  console.log('\n─────────────────────────────────────────────────')
  console.log('Next step:')
  console.log('  Update src/utils/seed.ts to import from plans-seed.generated.ts')
  console.log('  OR run: npm run db:seed (it will use the generated file automatically)')
  console.log('─────────────────────────────────────────────────\n')
}

// ─── Generate seed file content ───────────────────────────────
function generateSeedFile(plans, marginPercent) {
  const date = new Date().toISOString()
  const plansJson = JSON.stringify(plans, null, 2)

  return `/**
 * AUTO-GENERATED by fetch-vtpass-plans.js
 * Generated: ${date}
 * VTPass URL: ${BASE_URL}
 * Margin applied: ${marginPercent}%
 *
 * DO NOT EDIT MANUALLY — run fetch-vtpass-plans.js to regenerate
 */

export const GENERATED_DATA_PLANS = ${plansJson} as const
`
}

main().catch(err => {
  console.error('\n❌ Error:', err.message)
  process.exit(1)
})
