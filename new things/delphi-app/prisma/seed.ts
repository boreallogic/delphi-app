/**
 * Database seed script for Delphi application
 * 
 * Usage: npm run db:seed
 * 
 * This creates a demo study with sample indicators and panelists
 * for testing and development purposes.
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

// Sample indicators if no CSV is provided
const sampleIndicators = [
  {
    externalId: 'SH01',
    category: 'Shelter & Housing',
    name: 'Emergency Shelter Beds per Capita',
    definition: 'Number of emergency shelter beds available for GBV survivors per 10,000 population',
    unitOfMeasure: 'Beds per 10,000',
    operationalization: 'Count total emergency beds / Population * 10,000',
    collectionFrequency: 'Annual',
    originalPriority: 'HIGH',
    notes: 'Include both dedicated GBV shelters and overflow capacity',
    domain: 'D1: Shelter Infrastructure',
  },
  {
    externalId: 'SH02',
    category: 'Shelter & Housing',
    name: 'Average Shelter Stay Duration',
    definition: 'Average number of days survivors stay in emergency shelter',
    unitOfMeasure: 'Days',
    operationalization: 'Sum of all stay durations / Number of stays',
    collectionFrequency: 'Quarterly',
    originalPriority: 'MEDIUM',
    notes: 'Longer stays may indicate housing barriers',
    domain: 'D1: Shelter Infrastructure',
  },
  {
    externalId: 'HA01',
    category: 'Housing Access',
    name: 'Transitional Housing Units',
    definition: 'Number of transitional housing units available for GBV survivors',
    unitOfMeasure: 'Units',
    operationalization: 'Count of dedicated transitional units',
    collectionFrequency: 'Annual',
    originalPriority: 'HIGH',
    notes: 'Include only units with dedicated GBV mandate',
    domain: 'D2: Housing Access',
  },
  {
    externalId: 'HC01',
    category: 'Healthcare Response',
    name: 'SANE Availability',
    definition: 'Availability of Sexual Assault Nurse Examiners within region',
    unitOfMeasure: 'Binary/Hours',
    operationalization: '1 = Available 24/7, 0.5 = Limited hours, 0 = Not available',
    collectionFrequency: 'Annual',
    originalPriority: 'HIGH',
    notes: 'Consider travel time for remote communities',
    domain: 'D4: Healthcare Response',
  },
  {
    externalId: 'LJ01',
    category: 'Legal & Justice',
    name: 'Protection Order Processing Time',
    definition: 'Average time from application to issuance of emergency protection orders',
    unitOfMeasure: 'Hours',
    operationalization: 'Sum of processing times / Number of orders',
    collectionFrequency: 'Quarterly',
    originalPriority: 'HIGH',
    notes: 'Track emergency vs. standard orders separately',
    domain: 'D5: Legal/Justice Access',
  },
]

// Sample panelists
const samplePanelists = [
  { email: 'expert1@example.com', name: 'Dr. Jane Smith', roleType: 'EXPERT_GBV' },
  { email: 'expert2@example.com', name: 'Dr. Maria Garcia', roleType: 'EXPERT_MEASUREMENT' },
  { email: 'provider1@example.com', name: 'Sarah Johnson', roleType: 'SERVICE_PROVIDER' },
  { email: 'lived1@example.com', name: 'Anonymous A', roleType: 'LIVED_EXPERIENCE' },
  { email: 'policy1@example.com', name: 'Michael Chen', roleType: 'POLICY_MAKER' },
]

async function main() {
  console.log('🌱 Seeding database...')

  // Check for existing studies
  const existingStudy = await prisma.study.findFirst()
  if (existingStudy) {
    console.log('⚠️  Database already has data. Skipping seed.')
    console.log('   To reset, run: npx prisma migrate reset')
    return
  }

  // Create demo study
  const study = await prisma.study.create({
    data: {
      name: 'YWC GBV Indicators Validation Study',
      description: 'Delphi study to validate and prioritize GBV indicators for the Yukon Women\'s Coalition framework.',
      status: 'SETUP',
      currentRound: 0,
      totalRounds: 3,
      consensusThreshold: 1.0,
    },
  })

  console.log(`✅ Created study: ${study.name}`)

  // Create rounds
  for (let i = 1; i <= study.totalRounds; i++) {
    await prisma.round.create({
      data: {
        studyId: study.id,
        roundNumber: i,
        status: 'PENDING',
      },
    })
  }
  console.log(`✅ Created ${study.totalRounds} rounds`)

  // Try to load indicators from CSV, fall back to samples
  let indicators = sampleIndicators
  const csvPath = path.join(process.cwd(), 'prisma', 'indicators.csv')
  
  if (fs.existsSync(csvPath)) {
    console.log('📄 Found indicators.csv, loading...')
    // CSV parsing logic would go here
    // For now, use samples
  }

  // Create indicators
  for (const ind of indicators) {
    await prisma.indicator.create({
      data: {
        studyId: study.id,
        ...ind,
      },
    })
  }
  console.log(`✅ Created ${indicators.length} indicators`)

  // Create sample panelists
  for (const p of samplePanelists) {
    await prisma.panelist.create({
      data: {
        studyId: study.id,
        email: p.email,
        name: p.name,
        roleType: p.roleType as any,
      },
    })
  }
  console.log(`✅ Created ${samplePanelists.length} sample panelists`)

  // Log seed action
  await prisma.auditLog.create({
    data: {
      action: 'DATABASE_SEEDED',
      actorType: 'SYSTEM',
      studyId: study.id,
      metadata: {
        indicatorCount: indicators.length,
        panelistCount: samplePanelists.length,
      },
    },
  })

  console.log('')
  console.log('🎉 Seed complete!')
  console.log('')
  console.log('Next steps:')
  console.log('  1. Start the dev server: npm run dev')
  console.log('  2. Open http://localhost:3000/admin')
  console.log('  3. Start Round 1 to begin the study')
  console.log('')
  console.log('Sample panelist emails for testing:')
  samplePanelists.forEach(p => console.log(`  - ${p.email} (${p.roleType})`))
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
