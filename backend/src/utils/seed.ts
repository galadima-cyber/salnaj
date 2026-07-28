/**
 * Database seeder — run once after first migration
 * Usage: npx ts-node src/utils/seed.ts
 *
 * Seeds:
 *  - All active data plans (MTN, Airtel, Glo, 9mobile)
 *  - System config defaults
 */

import prisma from '../config/database'
import { logger } from '../config/logger'

// ─── Data Plans ───────────────────────────────────────────────
// Prices set with a markup over typical VTPass wholesale cost.
// Update providerCode to match your exact VTPass variation codes.

const dataPlans = [
  // ── MTN ─────────────────────────────────────────────────
  { network: 'MTN', name: 'MTN 500MB', sizeGb: 0.5,  sizeLabel: '500MB', price: 160,  validityDays: 30,  category: 'SME',       providerCode: 'mtn-10mb-110' },
  { network: 'MTN', name: 'MTN 1GB',   sizeGb: 1,    sizeLabel: '1GB',   price: 300,  validityDays: 30,  category: 'SME',       providerCode: 'mtn-10mb-111' },
  { network: 'MTN', name: 'MTN 2GB',   sizeGb: 2,    sizeLabel: '2GB',   price: 580,  validityDays: 30,  category: 'SME',       providerCode: 'mtn-10mb-112' },
  { network: 'MTN', name: 'MTN 3GB',   sizeGb: 3,    sizeLabel: '3GB',   price: 850,  validityDays: 30,  category: 'SME',       providerCode: 'mtn-10mb-113' },
  { network: 'MTN', name: 'MTN 5GB',   sizeGb: 5,    sizeLabel: '5GB',   price: 1450, validityDays: 30,  category: 'SME',       providerCode: 'mtn-10mb-114' },
  { network: 'MTN', name: 'MTN 10GB',  sizeGb: 10,   sizeLabel: '10GB',  price: 2800, validityDays: 30,  category: 'SME',       providerCode: 'mtn-10mb-115' },
  { network: 'MTN', name: 'MTN 50MB',  sizeGb: 0.05, sizeLabel: '50MB',  price: 50,   validityDays: 1,   category: 'DAILY',     providerCode: 'mtn-10mb-116' },
  { network: 'MTN', name: 'MTN 200MB', sizeGb: 0.2,  sizeLabel: '200MB', price: 100,  validityDays: 3,   category: 'DAILY',     providerCode: 'mtn-10mb-117' },
  { network: 'MTN', name: 'MTN 1GB 7-Day', sizeGb: 1, sizeLabel: '1GB', price: 350, validityDays: 7,   category: 'WEEKLY',    providerCode: 'mtn-10mb-118' },
  { network: 'MTN', name: 'MTN 20GB',  sizeGb: 20,   sizeLabel: '20GB',  price: 5500, validityDays: 30,  category: 'CORPORATE', providerCode: 'mtn-10mb-119' },

  // ── AIRTEL ──────────────────────────────────────────────
  { network: 'AIRTEL', name: 'Airtel 500MB', sizeGb: 0.5, sizeLabel: '500MB', price: 150,  validityDays: 30, category: 'SME',     providerCode: 'airtel-500mb' },
  { network: 'AIRTEL', name: 'Airtel 1GB',   sizeGb: 1,   sizeLabel: '1GB',   price: 280,  validityDays: 30, category: 'SME',     providerCode: 'airtel-1gb' },
  { network: 'AIRTEL', name: 'Airtel 2GB',   sizeGb: 2,   sizeLabel: '2GB',   price: 550,  validityDays: 30, category: 'SME',     providerCode: 'airtel-2gb' },
  { network: 'AIRTEL', name: 'Airtel 3GB',   sizeGb: 3,   sizeLabel: '3GB',   price: 820,  validityDays: 30, category: 'SME',     providerCode: 'airtel-3gb' },
  { network: 'AIRTEL', name: 'Airtel 5GB',   sizeGb: 5,   sizeLabel: '5GB',   price: 1400, validityDays: 30, category: 'SME',     providerCode: 'airtel-5gb' },
  { network: 'AIRTEL', name: 'Airtel 6GB',   sizeGb: 6,   sizeLabel: '6GB',   price: 1650, validityDays: 7,  category: 'WEEKLY',  providerCode: 'airtel-6gb-7' },
  { network: 'AIRTEL', name: 'Airtel 10GB',  sizeGb: 10,  sizeLabel: '10GB',  price: 2700, validityDays: 30, category: 'SME',     providerCode: 'airtel-10gb' },
  { network: 'AIRTEL', name: 'Airtel 100MB', sizeGb: 0.1, sizeLabel: '100MB', price: 75,   validityDays: 1,  category: 'DAILY',   providerCode: 'airtel-100mb' },
  { network: 'AIRTEL', name: 'Airtel 20GB',  sizeGb: 20,  sizeLabel: '20GB',  price: 5200, validityDays: 30, category: 'CORPORATE', providerCode: 'airtel-20gb' },

  // ── GLO ─────────────────────────────────────────────────
  { network: 'GLO', name: 'Glo 500MB', sizeGb: 0.5, sizeLabel: '500MB', price: 140,  validityDays: 30, category: 'SME',    providerCode: 'glo-500mb' },
  { network: 'GLO', name: 'Glo 1GB',   sizeGb: 1,   sizeLabel: '1GB',   price: 270,  validityDays: 30, category: 'SME',    providerCode: 'glo-1gb' },
  { network: 'GLO', name: 'Glo 2GB',   sizeGb: 2,   sizeLabel: '2GB',   price: 500,  validityDays: 30, category: 'SME',    providerCode: 'glo-2gb' },
  { network: 'GLO', name: 'Glo 5GB',   sizeGb: 5,   sizeLabel: '5GB',   price: 1350, validityDays: 30, category: 'SME',    providerCode: 'glo-5gb' },
  { network: 'GLO', name: 'Glo 5GB 14-Day', sizeGb: 5, sizeLabel: '5GB', price: 1500, validityDays: 14, category: 'WEEKLY', providerCode: 'glo-5gb-14' },
  { network: 'GLO', name: 'Glo 10GB',  sizeGb: 10,  sizeLabel: '10GB',  price: 2600, validityDays: 30, category: 'SME',    providerCode: 'glo-10gb' },
  { network: 'GLO', name: 'Glo 15GB',  sizeGb: 15,  sizeLabel: '15GB',  price: 3900, validityDays: 30, category: 'CORPORATE', providerCode: 'glo-15gb' },

  // ── 9MOBILE (ETISALAT) ──────────────────────────────────
  { network: 'ETISALAT', name: '9mobile 1GB',  sizeGb: 1,  sizeLabel: '1GB',  price: 350,  validityDays: 30, category: 'SME',     providerCode: 'etisalat-1gb' },
  { network: 'ETISALAT', name: '9mobile 2.5GB',sizeGb: 2.5,sizeLabel: '2.5GB',price: 750,  validityDays: 30, category: 'SME',     providerCode: 'etisalat-2-5gb' },
  { network: 'ETISALAT', name: '9mobile 5GB',  sizeGb: 5,  sizeLabel: '5GB',  price: 1500, validityDays: 30, category: 'SME',     providerCode: 'etisalat-5gb' },
  { network: 'ETISALAT', name: '9mobile 11.5GB',sizeGb:11.5,sizeLabel:'11.5GB',price:3000, validityDays: 30, category: 'CORPORATE',providerCode:'etisalat-11-5gb' },
]

const systemConfigs = [
  { key: 'maintenance_mode',        value: 'false',  description: 'Set to true to show maintenance page', isPublic: true },
  { key: 'data_purchase_enabled',   value: 'true',   description: 'Enable/disable data purchases',         isPublic: true },
  { key: 'airtime_purchase_enabled',value: 'true',   description: 'Enable/disable airtime purchases',      isPublic: true },
  { key: 'electricity_enabled',     value: 'true',   description: 'Enable/disable electricity bills',      isPublic: true },
  { key: 'cable_tv_enabled',        value: 'true',   description: 'Enable/disable cable TV',               isPublic: true },
  { key: 'min_wallet_funding',      value: '100',    description: 'Minimum wallet funding amount (₦)',     isPublic: true },
  { key: 'max_wallet_balance',      value: '500000', description: 'Maximum wallet balance (₦)',            isPublic: true },
  { key: 'sms_per_unit_cost',       value: '2.8',    description: 'Cost per SMS unit from Termii (₦)',    isPublic: false },
  { key: 'sms_selling_price',       value: '4.0',    description: 'Price charged per SMS to user (₦)',    isPublic: false },
  { key: 'vtpass_wallet_alert_threshold', value: '5000', description: 'Alert when VTPass balance drops below this (₦)', isPublic: false },
  { key: 'referral_signup_bonus',   value: '100',    description: 'Bonus for new referees (₦)',           isPublic: true },
  { key: 'referral_referrer_bonus', value: '150',    description: 'Bonus for referrers (₦)',             isPublic: true },
]

async function seed() {
  logger.info('🌱 Starting database seed...')

  // ── Data Plans ─────────────────────────────────────────────
  logger.info(`Seeding ${dataPlans.length} data plans...`)
  let planCount = 0
  for (const plan of dataPlans) {
    await prisma.dataPlan.upsert({
      where: {
        network_providerCode: {
          network:      plan.network as 'MTN',
          providerCode: plan.providerCode,
        },
      },
      update: {
        name:         plan.name,
        sizeGb:       plan.sizeGb,
        sizeLabel:    plan.sizeLabel,
        price:        plan.price,
        validityDays: plan.validityDays,
        category:     plan.category,
        isActive:     true,
      },
      create: plan as any,
    })
    planCount++
  }
  logger.info(`✓ ${planCount} data plans seeded`)

  // ── System Config ──────────────────────────────────────────
  logger.info(`Seeding ${systemConfigs.length} system configs...`)
  for (const config of systemConfigs) {
    await prisma.systemConfig.upsert({
      where:  { key: config.key },
      update: { description: config.description, isPublic: config.isPublic },
      create: config,
    })
  }
  logger.info(`✓ ${systemConfigs.length} system configs seeded`)

  logger.info('\n✅ Database seeded successfully!')
}

seed()
  .catch(err => {
    logger.error('Seed failed', { err })
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
