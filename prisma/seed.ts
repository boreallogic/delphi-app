/**
 * Database seed script for Delphi application
 *
 * Usage: npm run db:seed
 *
 * This automatically loads all 50 indicators from CSV with evidence from JSON.
 * The app is designed for a single study, so this creates the YWC GBV study.
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import Papa from 'papaparse'

const prisma = new PrismaClient()

interface CSVRow {
  ID: string
  Category: string
  'Indicator Name': string
  Definition: string
  Definition_Plain: string
  'Unit of Measure': string
  Operationalization: string
  'Collection Frequency': string
  Priority: string
  'Notes/Edge Cases': string
  Domain_Original: string
  Domain_Code: string
  Domain_Name: string
  Domain_Question: string
  Tier: string
  Tier_Rationale: string
  Data_Reliability: string
}

interface EvidenceData {
  metadata: {
    title: string
    version: string
    source: string
    prepared_for: string
    prepared_by: string
  }
  indicators: {
    [key: string]: {
      name: string
      evidence_summary: string
      risk_factors: string[]
      protective_factors: string[]
      key_citations: string[]
      data_quality_notes: string
      rrn_relevance: string
    }
  }
}

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

  // Load CSV
  const csvPath = path.join(process.cwd(), 'data', 'indicators_revised.csv')
  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV file not found at ${csvPath}`)
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8')
  const csvResult = Papa.parse<CSVRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
  })

  if (csvResult.errors.length > 0) {
    console.error('CSV parsing errors:', csvResult.errors)
    throw new Error('Failed to parse CSV')
  }

  console.log(`📄 Loaded ${csvResult.data.length} indicators from CSV`)

  // Load evidence JSON
  const jsonPath = path.join(process.cwd(), 'data', 'indicator_evidence.json')
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Evidence JSON not found at ${jsonPath}`)
  }

  const evidenceData: EvidenceData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
  console.log(`📚 Loaded evidence data for ${Object.keys(evidenceData.indicators).length} indicators`)

  // Create the single study
  const study = await prisma.study.create({
    data: {
      name: 'GBV Indicators Framework Validation Study',
      description: 'Delphi study to validate and prioritize GBV indicators. A collaboration between Yukon University and Yukon Status of Women Council, funded by SSHRC.',
      status: 'ACTIVE',
      currentRound: 1,
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
        status: i === 1 ? 'OPEN' : 'PENDING',
        opensAt: i === 1 ? new Date() : null,
      },
    })
  }
  console.log(`✅ Created ${study.totalRounds} rounds (Round 1 is OPEN)`)

  // Create indicators by merging CSV and evidence data
  let createdCount = 0
  for (const row of csvResult.data) {
    const externalId = row.ID
    const evidence = evidenceData.indicators[externalId]

    // Build domain string with code prefix
    const domain = `${row.Domain_Original}`

    await prisma.indicator.create({
      data: {
        studyId: study.id,
        externalId: externalId,
        category: row.Category,
        name: row['Indicator Name'],
        definition: row.Definition,
        definitionSimple: row.Definition_Plain,
        unitOfMeasure: row['Unit of Measure'],
        operationalization: row.Operationalization,
        collectionFrequency: row['Collection Frequency'],
        originalPriority: row.Priority,
        notes: row['Notes/Edge Cases'],
        domain: domain,
        domainCode: row.Domain_Code,
        domainName: row.Domain_Name,
        domainQuestion: row.Domain_Question,
        tier: parseInt(row.Tier),
        tierRationale: row.Tier_Rationale,
        dataReliability: row.Data_Reliability,
        // Evidence fields
        evidenceSummary: evidence?.evidence_summary || null,
        riskFactors: evidence?.risk_factors || null,
        protectiveFactors: evidence?.protective_factors || null,
        keyCitations: evidence?.key_citations || null,
        dataQualityNotes: evidence?.data_quality_notes || null,
        rrnRelevance: evidence?.rrn_relevance || null,
      },
    })
    createdCount++
  }

  console.log(`✅ Created ${createdCount} indicators with evidence data`)

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
        indicatorCount: createdCount,
        panelistCount: samplePanelists.length,
        csvSource: 'data/indicators_revised.csv',
        evidenceSource: 'data/indicator_evidence.json',
      },
    },
  })

  console.log('')
  console.log('🎉 Seed complete!')
  console.log('')
  console.log(`   Loaded all ${createdCount} indicators with:`)
  console.log('   • Plain language definitions')
  console.log('   • Evidence summaries')
  console.log('   • Risk and protective factors')
  console.log('   • Research citations')
  console.log('   • Domain codes A-H')
  console.log('   • Tier 1 and Tier 2 classifications')
  console.log('')
  console.log('Next steps:')
  console.log('  1. Start the dev server: npm run dev')
  console.log('  2. Open http://localhost:3000')
  console.log('  3. Access admin dashboard or view study directly')
  console.log('')
  console.log('Sample panelist emails for testing:')
  samplePanelists.forEach(p => console.log(`  - ${p.email} (${p.roleType})`))
  console.log('')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
