/**
 * Import Evidence Script
 *
 * Populates evidence fields for indicators from the evidence JSON file.
 * Run with: npm run import-evidence
 *
 * This script updates all existing indicators with their evidence data:
 * - Evidence summary
 * - Risk factors from literature
 * - Protective factors
 * - Key citations
 * - Data quality notes
 * - RRN (Rural/Remote/Northern) relevance level
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

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

async function importEvidence() {
  console.log('🔬 Starting evidence import...\n')

  // Load evidence JSON
  const evidencePath = path.join(process.cwd(), 'data', 'indicator_evidence.json')

  if (!fs.existsSync(evidencePath)) {
    console.error('❌ Evidence file not found at:', evidencePath)
    console.error('   Please ensure data/indicator_evidence.json exists')
    process.exit(1)
  }

  const evidenceRaw = fs.readFileSync(evidencePath, 'utf-8')
  const evidenceData: EvidenceData = JSON.parse(evidenceRaw)

  console.log('📊 Evidence data loaded:')
  console.log(`   Source: ${evidenceData.metadata.source}`)
  console.log(`   Version: ${evidenceData.metadata.version}`)
  console.log(`   Indicators: ${Object.keys(evidenceData.indicators).length}`)
  console.log('')

  let updatedCount = 0
  let notFoundCount = 0

  // Process each indicator
  for (const [externalId, evidence] of Object.entries(evidenceData.indicators)) {
    try {
      // Find all indicators with this external ID (may be multiple across studies)
      const result = await prisma.indicator.updateMany({
        where: { externalId },
        data: {
          evidenceSummary: evidence.evidence_summary,
          riskFactors: evidence.risk_factors,
          protectiveFactors: evidence.protective_factors,
          keyCitations: evidence.key_citations,
          dataQualityNotes: evidence.data_quality_notes,
          rrnRelevance: evidence.rrn_relevance,
        },
      })

      if (result.count > 0) {
        updatedCount += result.count
        console.log(`✅ ${externalId}: Updated ${result.count} indicator(s)`)
      } else {
        notFoundCount++
        console.log(`⚠️  ${externalId}: No indicators found (not imported yet)`)
      }
    } catch (error) {
      console.error(`❌ ${externalId}: Error updating:`, error)
    }
  }

  console.log('')
  console.log('📈 Import complete!')
  console.log(`   Updated: ${updatedCount} indicator(s)`)
  console.log(`   Not found: ${notFoundCount} indicator(s)`)
  console.log('')

  if (notFoundCount > 0) {
    console.log('💡 Tip: Indicators marked "not found" will be updated when they are imported via CSV')
  }
}

importEvidence()
  .catch((error) => {
    console.error('❌ Import failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
