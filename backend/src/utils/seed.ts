/**
 * Database Seeder — run: npm run db:seed
 * Seeds data plans, system config, and a default admin user.
 */
import prisma     from '../config/database'
import { logger } from '../config/logger'
import bcrypt     from 'bcryptjs'
import fs         from 'fs'
import path       from 'path'

// ─── Load plans: generated file first, fallback to defaults ───
let dataPlans: Array<{
  network: string; name: string; sizeGb: number; sizeLabel: string
  price: number; validityDays: number; category: string; providerCode: string
}>

try {
  const genPath = path.join(__dirname, 'plans-seed.generated.js')
  if (fs.existsSync(genPath)) {
    const mod = require(genPath)
    dataPlans = mod.GENERATED_DATA_PLANS
    logger.info(`Using ${dataPlans.length} real VTPass plans from generated file`)
  } else {
    throw new Error('no generated file')
  }
} catch {
  logger.warn('⚠️  Using placeholder codes — run node fetch-vtpass-plans.js to get real codes')
  dataPlans = [
    // MTN
    { network:'MTN',      name:'MTN 100MB',       sizeGb:0.1,  sizeLabel:'100MB', price:100,  validityDays:1,  category:'DAILY',   providerCode:'mtn-10mb'        },
    { network:'MTN',      name:'MTN 1GB',          sizeGb:1,    sizeLabel:'1GB',   price:305,  validityDays:30, category:'SME',     providerCode:'mtn-1gb'         },
    { network:'MTN',      name:'MTN 2GB',          sizeGb:2,    sizeLabel:'2GB',   price:610,  validityDays:30, category:'SME',     providerCode:'mtn-2gb'         },
    { network:'MTN',      name:'MTN 3GB',          sizeGb:3,    sizeLabel:'3GB',   price:900,  validityDays:30, category:'SME',     providerCode:'mtn-3gb'         },
    { network:'MTN',      name:'MTN 5GB',          sizeGb:5,    sizeLabel:'5GB',   price:1520, validityDays:30, category:'SME',     providerCode:'mtn-5gb'         },
    { network:'MTN',      name:'MTN 10GB',         sizeGb:10,   sizeLabel:'10GB',  price:2990, validityDays:30, category:'SME',     providerCode:'mtn-10gb'        },
    // AIRTEL
    { network:'AIRTEL',   name:'Airtel 500MB',     sizeGb:0.5,  sizeLabel:'500MB', price:160,  validityDays:30, category:'SME',     providerCode:'airtel-500mb'    },
    { network:'AIRTEL',   name:'Airtel 1GB',       sizeGb:1,    sizeLabel:'1GB',   price:305,  validityDays:30, category:'SME',     providerCode:'airtel-1gb'      },
    { network:'AIRTEL',   name:'Airtel 2GB',       sizeGb:2,    sizeLabel:'2GB',   price:580,  validityDays:30, category:'SME',     providerCode:'airtel-2gb'      },
    { network:'AIRTEL',   name:'Airtel 6GB',       sizeGb:6,    sizeLabel:'6GB',   price:1700, validityDays:7,  category:'WEEKLY',  providerCode:'airtel-6gb'      },
    { network:'AIRTEL',   name:'Airtel 10GB',      sizeGb:10,   sizeLabel:'10GB',  price:2875, validityDays:30, category:'SME',     providerCode:'airtel-10gb'     },
    // GLO
    { network:'GLO',      name:'Glo 1GB',          sizeGb:1,    sizeLabel:'1GB',   price:290,  validityDays:30, category:'SME',     providerCode:'glo-1gb'         },
    { network:'GLO',      name:'Glo 2GB',          sizeGb:2,    sizeLabel:'2GB',   price:530,  validityDays:30, category:'SME',     providerCode:'glo-2gb'         },
    { network:'GLO',      name:'Glo 5GB',          sizeGb:5,    sizeLabel:'5GB',   price:1440, validityDays:30, category:'SME',     providerCode:'glo-5gb'         },
    { network:'GLO',      name:'Glo 5GB 14-Day',   sizeGb:5,    sizeLabel:'5GB',   price:1610, validityDays:14, category:'WEEKLY',  providerCode:'glo-5gb-2weeks'  },
    { network:'GLO',      name:'Glo 10GB',         sizeGb:10,   sizeLabel:'10GB',  price:2760, validityDays:30, category:'SME',     providerCode:'glo-10gb'        },
    // ETISALAT (9mobile)
    { network:'ETISALAT', name:'9mobile 1GB',      sizeGb:1,    sizeLabel:'1GB',   price:345,  validityDays:30, category:'SME',     providerCode:'etisalat-1gb'    },
    { network:'ETISALAT', name:'9mobile 2.5GB',    sizeGb:2.5,  sizeLabel:'2.5GB', price:800,  validityDays:30, category:'SME',     providerCode:'etisalat-2-5gb'  },
    { network:'ETISALAT', name:'9mobile 5GB',      sizeGb:5,    sizeLabel:'5GB',   price:1610, validityDays:30, category:'SME',     providerCode:'etisalat-5gb'    },
  ]
}

// ─── System config ────────────────────────────────────────────
const systemConfigs = [
  { key: 'maintenance_mode',         value: 'false',  description: 'Set true to show maintenance page',              isPublic: true  },
  { key: 'data_purchase_enabled',    value: 'true',   description: 'Toggle data purchases on/off',                   isPublic: true  },
  { key: 'airtime_purchase_enabled', value: 'true',   description: 'Toggle airtime purchases on/off',                isPublic: true  },
  { key: 'electricity_enabled',      value: 'true',   description: 'Toggle electricity payments on/off',             isPublic: true  },
  { key: 'cable_tv_enabled',         value: 'true',   description: 'Toggle cable TV on/off',                         isPublic: true  },
  { key: 'education_enabled',        value: 'true',   description: 'Toggle WAEC/NECO/JAMB on/off',                   isPublic: true  },
  { key: 'betting_enabled',          value: 'true',   description: 'Toggle betting wallet funding on/off',           isPublic: true  },
  { key: 'bulk_sms_enabled',         value: 'true',   description: 'Toggle bulk SMS on/off',                         isPublic: true  },
  { key: 'min_wallet_funding',       value: '100',    description: 'Minimum wallet funding amount (₦)',              isPublic: true  },
  { key: 'max_wallet_balance',       value: '500000', description: 'Maximum wallet balance per user (₦)',            isPublic: true  },
  { key: 'sms_unit_cost',            value: '2.8',    description: 'Cost per SMS from Termii (₦)',                   isPublic: false },
  { key: 'sms_selling_price',        value: '4.0',    description: 'Price charged per SMS to user (₦)',              isPublic: false },
  { key: 'vtpass_alert_threshold',   value: '5000',   description: 'Alert when VTPass balance drops below (₦)',      isPublic: false },
  { key: 'referral_signup_bonus',    value: '100',    description: 'Bonus for new referee on first funding (₦)',     isPublic: true  },
  { key: 'referral_referrer_bonus',  value: '150',    description: 'Bonus for referrer (₦)',                        isPublic: true  },
  { key: 'data_plan_margin_percent', value: '15',     description: 'Default markup % over VTPass cost',             isPublic: false },
  { key: 'app_version',              value: '1.0.0',  description: 'Current app version',                           isPublic: true  },
]

// ─── Main ─────────────────────────────────────────────────────
async function seed() {
  logger.info('🌱 Starting database seed...\n')

  // 1. Data plans
  logger.info(`Seeding ${dataPlans.length} data plans...`)
  let planCount = 0
  for (const plan of dataPlans) {
    await prisma.dataPlan.upsert({
      where:  { network_providerCode: { network: plan.network as 'MTN', providerCode: plan.providerCode } },
      update: { name: plan.name, sizeGb: plan.sizeGb, sizeLabel: plan.sizeLabel, price: plan.price, validityDays: plan.validityDays, category: plan.category, isActive: true },
      create: { network: plan.network as 'MTN', name: plan.name, sizeGb: plan.sizeGb, sizeLabel: plan.sizeLabel, price: plan.price, validityDays: plan.validityDays, category: plan.category, providerCode: plan.providerCode, isActive: true },
    })
    planCount++
  }
  logger.info(`✓ ${planCount} data plans seeded`)

  // 2. System config
  logger.info(`Seeding ${systemConfigs.length} system configs...`)
  for (const config of systemConfigs) {
    await prisma.systemConfig.upsert({
      where:  { key: config.key },
      update: { description: config.description, isPublic: config.isPublic },
      create: config,
    })
  }
  logger.info(`✓ ${systemConfigs.length} system configs seeded`)

  // 3. Default admin (only if none exists)
  const adminExists = await prisma.user.findFirst({
    where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
    select: { id: true },
  })

  if (!adminExists) {
    const DEFAULT_PASSWORD = 'ChangeMe@123!'
    const hash = await bcrypt.hash(DEFAULT_PASSWORD, 12)
    const admin = await prisma.user.create({
      data: {
        fullName: 'Super Admin', email: 'admin@salnaj.ng',
        phone: '08000000000', passwordHash: hash,
        referralCode: 'SNJ-ADMIN', role: 'SUPER_ADMIN',
        kycStatus: 'FULL_KYC', isEmailVerified: true, isPhoneVerified: true,
      },
    })
    await prisma.wallet.create({ data: { userId: admin.id } })

    logger.warn('\n────────────────────────────────────────────────')
    logger.warn('⚠️  DEFAULT ADMIN CREATED — CHANGE PASSWORD NOW!')
    logger.warn('    Email:    admin@salnaj.ng')
    logger.warn(`    Password: ${DEFAULT_PASSWORD}`)
    logger.warn('    Login at: /admin')
    logger.warn('────────────────────────────────────────────────\n')
  } else {
    logger.info('✓ Admin user already exists — skipped')
  }

  logger.info(`\n✅ Seed complete — ${planCount} plans | ${systemConfigs.length} configs`)
}

seed()
  .catch(err => { logger.error('Seed failed', { err }); process.exit(1) })
  .finally(() => prisma.$disconnect())
