/**
 * Import v2 indicators from Excel + JSON evidence
 *
 * Usage: npx tsx scripts/import-indicators-v2.ts
 *
 * This script:
 * 1. Reads indicators from indicators_revised_v2.xlsx
 * 2. Merges evidence data from indicator_evidence_v2.json
 * 3. Clears existing indicators for the study
 * 4. Imports fresh indicator set
 */

import { PrismaClient, Prisma } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

// We'll use a simple xlsx parser via csv conversion
// First, let's check if we have the json file which has all the data we need

interface IndicatorEvidence {
  name: string
  definition: string
  definition_plain: string
  tier: number
  tier_rationale: string
  mvp: boolean
  data_reliability: string
  baseline_category: string
  domain: string
  domain_question: string
  threshold: {
    adequate: string
    partial: string
    major_gap: string
    critical: string
  }
  unit_of_measure: string
  collection_frequency: string
  evidence_summary: string
  risk_factors: string[]
  protective_factors: string[]
  key_citations: string[]
  data_quality_notes: string
  rrn_relevance: string
}

interface EvidenceFile {
  metadata: {
    title: string
    version: string
    indicator_count: number
    mvp_indicator_count: number
  }
  indicators: Record<string, IndicatorEvidence>
}

async function main() {
  console.log('🚀 Starting v2 indicator import...')

  // Read the JSON evidence file (has all the data we need)
  const evidencePath = path.join(process.cwd(), 'data', 'indicator_evidence_v2.json')

  if (!fs.existsSync(evidencePath)) {
    console.error('❌ indicator_evidence_v2.json not found in data/ folder')
    console.log('   Please copy the file to: data/indicator_evidence_v2.json')
    process.exit(1)
  }

  const evidenceData: EvidenceFile = JSON.parse(fs.readFileSync(evidencePath, 'utf-8'))

  console.log(`📊 Found ${Object.keys(evidenceData.indicators).length} indicators`)
  console.log(`📊 MVP indicators: ${evidenceData.metadata.mvp_indicator_count}`)

  // Get or create the study
  let study = await prisma.study.findFirst()

  if (!study) {
    console.log('📝 Creating new study...')
    study = await prisma.study.create({
      data: {
        name: 'GBV Indicators Framework Validation Study',
        description: 'Delphi validation study for GBV indicators in northern and rural communities (Track A + Track B)',
        status: 'ACTIVE',
        currentRound: 1,
        totalRounds: 3,
      }
    })
  }

  console.log(`📚 Using study: ${study.name} (${study.id})`)

  // Clear existing indicators (this will cascade delete responses too!)
  console.log('🗑️  Clearing existing indicators...')
  const deleted = await prisma.indicator.deleteMany({
    where: { studyId: study.id }
  })
  console.log(`   Deleted ${deleted.count} existing indicators`)

  // Domain code mapping based on domain names
  const domainCodeMap: Record<string, string> = {
    'Safe Places to Stay': 'A',
    'Money and Independence': 'B',
    'Health Care That Understands': 'C',
    'Help When You Need It': 'D',
    'Justice That Works': 'E',
    'Community Conditions': 'F',
    'Prevention and Awareness': 'G',
    'Knowing What Works': 'H',
  }

  // Category mapping based on indicator ID prefix
  const categoryMap: Record<string, string> = {
    'SH': 'Shelter & Housing',
    'CC': 'Community Context',
    'EC': 'Economic Security',
    'HC': 'Healthcare',
    'INT': 'Intersectional Access',
    'JU': 'Justice',
    'PR': 'Prevention',
    'PL': 'Policy',
    'TR': 'Transportation',
    'CR': 'Crisis Services',
    'DA': 'Data & Accountability',
  }

  // Import indicators
  console.log('📥 Importing indicators...')
  let imported = 0
  let mvpCount = 0

  for (const [externalId, indicator] of Object.entries(evidenceData.indicators)) {
    // Determine category from ID prefix
    const prefix = externalId.replace(/[0-9]/g, '')
    const category = categoryMap[prefix] || 'Other'

    // Determine domain code
    const domainCode = domainCodeMap[indicator.domain] || 'F'

    await prisma.indicator.create({
      data: {
        studyId: study.id,
        externalId,
        category,
        name: indicator.name,
        definition: indicator.definition,
        definitionSimple: indicator.definition_plain,
        unitOfMeasure: indicator.unit_of_measure,
        operationalization: indicator.evidence_summary || 'See evidence base',
        collectionFrequency: indicator.collection_frequency,
        originalPriority: indicator.tier === 1 ? 'HIGH' : 'MEDIUM',
        notes: indicator.data_quality_notes,

        // Domain
        domain: indicator.domain,
        domainCode,
        domainName: indicator.domain,
        domainQuestion: indicator.domain_question,

        // Tiering & MVP
        tier: indicator.tier,
        tierRationale: indicator.tier_rationale,
        dataReliability: indicator.data_reliability,
        mvp: indicator.mvp,
        baselineCategory: indicator.baseline_category,
        thresholds: indicator.threshold === null ? Prisma.JsonNull : indicator.threshold,

        // Evidence
        evidenceSummary: indicator.evidence_summary,
        riskFactors: indicator.risk_factors === null ? Prisma.JsonNull : indicator.risk_factors,
        protectiveFactors: indicator.protective_factors === null ? Prisma.JsonNull : indicator.protective_factors,
        keyCitations: indicator.key_citations === null ? Prisma.JsonNull : indicator.key_citations,
        dataQualityNotes: indicator.data_quality_notes,
        rrnRelevance: indicator.rrn_relevance,
      }
    })

    imported++
    if (indicator.mvp) mvpCount++

    if (imported % 10 === 0) {
      console.log(`   Imported ${imported} indicators...`)
    }
  }

  console.log('')
  console.log('✅ Import complete!')
  console.log(`   Total indicators: ${imported}`)
  console.log(`   MVP indicators: ${mvpCount}`)
  console.log('')

  // Verify
  const verification = await prisma.indicator.groupBy({
    by: ['domainCode'],
    where: { studyId: study.id },
    _count: true,
  })

  console.log('📊 Indicators by domain:')
  for (const v of verification.sort((a, b) => a.domainCode.localeCompare(b.domainCode))) {
    console.log(`   ${v.domainCode}: ${v._count}`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
