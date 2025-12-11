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
    definitionSimple: 'How many emergency shelter beds are available for every 10,000 people in the community?',
    unitOfMeasure: 'Beds per 10,000',
    operationalization: 'Count total emergency beds / Population * 10,000',
    collectionFrequency: 'Annual',
    originalPriority: 'HIGH',
    notes: 'Include both dedicated GBV shelters and overflow capacity',
    domain: 'D1: Shelter Infrastructure',
    domainCode: 'A',
    domainName: 'Safe Places to Stay',
    domainQuestion: 'Can survivors access emergency and transitional housing?',
    tier: 1,
    tierRationale: 'Core capacity measure with HIGH priority and reliable data',
    dataReliability: 'HIGH',
    evidenceSummary: 'Access to emergency shelter is consistently identified as a critical protective factor across the literature. Lack of shelter access is associated with women remaining in or returning to violent situations.',
    riskFactors: [
      'Long waitlists to access services (Mantler, 2024; Heggie et al., 2022)',
      'Shelters do not reflect unique needs of rural women (Weeks, 2016)',
      'Lack of emergency housing (Moffitt, 2022; Zorn, 2017; Farhall, 2020)',
    ],
    protectiveFactors: [
      'Access to shelters / safe houses (CREVAWC, 2021; Faller, 2021; Hope et al., 2023)',
      'Access to specialized GBV-specific services (Carter-Snell et al., 2020)',
    ],
    keyCitations: [
      'CREVAWC (2021)',
      'Faller (2021)',
      'Women\'s Shelters Canada surveys',
    ],
    dataQualityNotes: 'Surveys by Women\'s Shelters Canada and ESVA are well documented but primarily in PDF format.',
    rrnRelevance: 'HIGH - Critical infrastructure gap in northern/remote communities',
  },
  {
    externalId: 'SH02',
    category: 'Shelter & Housing',
    name: 'Average Shelter Stay Duration',
    definition: 'Average number of days survivors stay in emergency shelter',
    definitionSimple: 'On average, how long do people stay in emergency shelters?',
    unitOfMeasure: 'Days',
    operationalization: 'Sum of all stay durations / Number of stays',
    collectionFrequency: 'Quarterly',
    originalPriority: 'MEDIUM',
    notes: 'Longer stays may indicate housing barriers',
    domain: 'D1: Shelter Infrastructure',
    domainCode: 'A',
    domainName: 'Safe Places to Stay',
    domainQuestion: 'Can survivors access emergency and transitional housing?',
    tier: 1,
    tierRationale: 'MEDIUM priority but important indicator of housing access barriers',
    dataReliability: 'MEDIUM',
    evidenceSummary: 'Extended shelter stays often reflect systemic housing access barriers and lack of affordable transitional options.',
    riskFactors: [
      'Lack of affordable housing (Tutty, 2015)',
      'Waitlists for transitional programs (Women\'s Shelters Canada, 2022)',
      'Insufficient income support (Farhall, 2020)',
    ],
    protectiveFactors: [
      'Access to transitional housing programs (YWCA Canada, 2021)',
      'Coordinated housing support services (Hope et al., 2023)',
    ],
    keyCitations: [
      'Women\'s Shelters Canada (2022)',
      'Tutty (2015)',
      'Farhall (2020)',
    ],
    dataQualityNotes: 'Most shelters track length of stay, though definitions may vary between emergency and transitional programs.',
    rrnRelevance: 'HIGH - Housing access is particularly challenging in northern/remote communities',
  },
  {
    externalId: 'HA01',
    category: 'Housing Access',
    name: 'Transitional Housing Units',
    definition: 'Number of transitional housing units available for GBV survivors',
    definitionSimple: 'How many longer-term housing units are available for survivors after emergency shelter?',
    unitOfMeasure: 'Units',
    operationalization: 'Count of dedicated transitional units',
    collectionFrequency: 'Annual',
    originalPriority: 'HIGH',
    notes: 'Include only units with dedicated GBV mandate',
    domain: 'D2: Housing Access',
    domainCode: 'A',
    domainName: 'Safe Places to Stay',
    domainQuestion: 'Can survivors access emergency and transitional housing?',
    tier: 1,
    tierRationale: 'Critical housing resource with HIGH priority',
    dataReliability: 'HIGH',
    evidenceSummary: 'Transitional housing programs provide critical bridge between emergency shelter and permanent housing, reducing returns to violent relationships.',
    riskFactors: [
      'Limited transitional housing capacity (Moffitt, 2022)',
      'Geographic isolation from services (Weeks, 2016)',
      'Lack of flexible housing options (Zorn, 2017)',
    ],
    protectiveFactors: [
      'Dedicated transitional housing programs (Faller, 2021)',
      'Housing-first approaches (Tutty et al., 2016)',
      'Flexible program models (YWCA Canada, 2021)',
    ],
    keyCitations: [
      'Moffitt (2022)',
      'Faller (2021)',
      'Tutty et al. (2016)',
    ],
    dataQualityNotes: 'Data typically from Women\'s Shelters Canada surveys and provincial housing agencies.',
    rrnRelevance: 'CRITICAL - Almost no transitional housing in rural/remote/northern regions',
  },
  {
    externalId: 'HC01',
    category: 'Healthcare Response',
    name: 'SANE Availability',
    definition: 'Availability of Sexual Assault Nurse Examiners within region',
    definitionSimple: 'Are specially trained nurses available to help survivors after sexual assault?',
    unitOfMeasure: 'Binary/Hours',
    operationalization: '1 = Available 24/7, 0.5 = Limited hours, 0 = Not available',
    collectionFrequency: 'Annual',
    originalPriority: 'HIGH',
    notes: 'Consider travel time for remote communities',
    domain: 'D4: Healthcare Response',
    domainCode: 'C',
    domainName: 'Health Care That Understands',
    domainQuestion: 'Do healthcare providers recognize and respond to GBV?',
    tier: 1,
    tierRationale: 'Critical forensic capacity with HIGH priority',
    dataReliability: 'HIGH',
    evidenceSummary: 'SANE programs improve forensic evidence quality, reduce secondary trauma, and increase prosecution rates.',
    riskFactors: [
      'No SANE-trained staff in region (Du Mont et al., 2014)',
      'Geographic barriers to access (Mantler, 2024)',
      'Lack of trauma-informed care training (Carter-Snell et al., 2020)',
    ],
    protectiveFactors: [
      'Access to SANE programs (Du Mont & Parnis, 2003)',
      'Trauma-informed healthcare practices (Campbell et al., 2015)',
      'Coordinated response teams (Greeson & Campbell, 2013)',
    ],
    keyCitations: [
      'Du Mont et al. (2014)',
      'Campbell et al. (2015)',
      'Carter-Snell et al. (2020)',
    ],
    dataQualityNotes: 'Hospital and health authority records provide reliable data on SANE program availability.',
    rrnRelevance: 'CRITICAL - Major gap in northern/remote healthcare capacity',
  },
  {
    externalId: 'LJ01',
    category: 'Legal & Justice',
    name: 'Protection Order Processing Time',
    definition: 'Average time from application to issuance of emergency protection orders',
    definitionSimple: 'How long does it take to get a protection order after applying?',
    unitOfMeasure: 'Hours',
    operationalization: 'Sum of processing times / Number of orders',
    collectionFrequency: 'Quarterly',
    originalPriority: 'HIGH',
    notes: 'Track emergency vs. standard orders separately',
    domain: 'D5: Legal/Justice Access',
    domainCode: 'D',
    domainName: 'Protection and Justice',
    domainQuestion: 'Can survivors access legal protection and support?',
    tier: 1,
    tierRationale: 'Time-sensitive safety measure with HIGH priority',
    dataReliability: 'MEDIUM',
    evidenceSummary: 'Timely access to protection orders is critical for survivor safety, with delays increasing risk of further violence.',
    riskFactors: [
      'Court system delays (Hornosty & Doherty, 2002)',
      'Geographic barriers to court access (Mantler, 2024)',
      'Lack of legal representation (Tutty et al., 2006)',
    ],
    protectiveFactors: [
      'Expedited protection order processes (Messing et al., 2014)',
      'Access to legal advocates (Wathen et al., 2015)',
      'Coordinated justice response (CREVAWC, 2021)',
    ],
    keyCitations: [
      'Messing et al. (2014)',
      'Wathen et al. (2015)',
      'CREVAWC (2021)',
    ],
    dataQualityNotes: 'Provincial court data varies in accessibility and format across jurisdictions.',
    rrnRelevance: 'HIGH - Circuit courts and limited legal services create processing delays',
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
