/**
 * Unified Indicator Import Script
 *
 * Merges data from two sources:
 * - Excel (indicators_revised_v2.xlsx): Primary structural data
 * - JSON (indicator_evidence_v2.json): Evidence enrichment
 *
 * Usage:
 *   npx ts-node scripts/import-indicators.ts
 *   npx ts-node scripts/import-indicators.ts --dry-run
 *   npx ts-node scripts/import-indicators.ts --study-id <id>
 */

import * as XLSX from 'xlsx'
import * as fs from 'fs'
import * as path from 'path'
import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

// File paths (relative to project root)
const EXCEL_PATH = path.join(__dirname, '../data/indicators_revised_v2.xlsx')
const JSON_PATH = path.join(__dirname, '../data/indicator_evidence_v2.json')

interface ExcelRow {
  ID: string
  Category: string
  'Indicator Name': string
  Definition: string
  Definition_Plain?: string
  'Unit of Measure': string
  Operationalization: string
  'Collection Frequency': string
  Priority: string
  'Notes/Edge Cases'?: string
  Domain_Original: string
  Domain_Code: string
  Domain_Name: string
  Domain_Question?: string
  Tier: number
  Tier_Rationale?: string
  Data_Reliability: string
  MVP: string
}

interface JsonIndicator {
  name: string
  definition: string
  definition_plain?: string
  tier: number
  tier_rationale?: string
  mvp: boolean
  data_reliability: string
  baseline_category?: string
  domain: string
  domain_question?: string
  threshold?: {
    adequate: string
    partial: string
    major_gap: string
    critical: string
  }
  unit_of_measure: string
  collection_frequency: string
  evidence_summary?: string
  risk_factors?: string[]
  protective_factors?: string[]
  key_citations?: string[]
  data_quality_notes?: string
  rrn_relevance?: string
}

interface JsonData {
  metadata: {
    title: string
    version: string
    indicator_count: number
    mvp_indicator_count: number
  }
  indicators: Record<string, JsonIndicator>
}

async function loadExcelData(): Promise<Map<string, ExcelRow>> {
  console.log(`📊 Loading Excel data from: ${EXCEL_PATH}`)

  if (!fs.existsSync(EXCEL_PATH)) {
    throw new Error(`Excel file not found: ${EXCEL_PATH}`)
  }

  const workbook = XLSX.readFile(EXCEL_PATH)
  const sheet = workbook.Sheets['All_Indicators'] || workbook.Sheets[workbook.SheetNames[0]]
  const rows: ExcelRow[] = XLSX.utils.sheet_to_json(sheet)

  const map = new Map<string, ExcelRow>()
  for (const row of rows) {
    if (row.ID) {
      map.set(row.ID, row)
    }
  }

  console.log(`   Found ${map.size} indicators in Excel`)
  return map
}

function loadJsonData(): Map<string, JsonIndicator> {
  console.log(`📚 Loading JSON evidence from: ${JSON_PATH}`)

  if (!fs.existsSync(JSON_PATH)) {
    console.log('   ⚠️  JSON file not found, proceeding without evidence data')
    return new Map()
  }

  const raw = fs.readFileSync(JSON_PATH, 'utf-8')
  const data: JsonData = JSON.parse(raw)

  console.log(`   Found ${Object.keys(data.indicators).length} indicators in JSON`)
  console.log(`   Version: ${data.metadata.version}`)

  return new Map(Object.entries(data.indicators))
}

function mergeIndicator(excelRow: ExcelRow, jsonData?: JsonIndicator) {
  // Excel is primary source, JSON enriches with evidence
  return {
    externalId: excelRow.ID,
    category: excelRow.Category,
    name: excelRow['Indicator Name'],
    definition: excelRow.Definition,
    definitionSimple: excelRow.Definition_Plain || jsonData?.definition_plain || null,
    unitOfMeasure: excelRow['Unit of Measure'],
    operationalization: excelRow.Operationalization,
    collectionFrequency: excelRow['Collection Frequency'],
    originalPriority: excelRow.Priority,
    notes: excelRow['Notes/Edge Cases'] || null,

    // Domain info
    domain: excelRow.Domain_Original,
    domainCode: excelRow.Domain_Code,
    domainName: excelRow.Domain_Name,
    domainQuestion: excelRow.Domain_Question || jsonData?.domain_question || null,

    // Tier & MVP
    tier: excelRow.Tier || 1,
    tierRationale: excelRow.Tier_Rationale || jsonData?.tier_rationale || null,
    dataReliability: excelRow.Data_Reliability || 'MEDIUM',
    mvp: excelRow.MVP?.toLowerCase() === 'yes' || excelRow.MVP === 'true' || jsonData?.mvp === true,

    // Evidence from JSON (enrichment)
    evidenceSummary: jsonData?.evidence_summary || null,
    riskFactors: jsonData?.risk_factors || null,
    protectiveFactors: jsonData?.protective_factors || null,
    keyCitations: jsonData?.key_citations || null,
    dataQualityNotes: jsonData?.data_quality_notes || null,
    rrnRelevance: jsonData?.rrn_relevance || null,
    baselineCategory: jsonData?.baseline_category || null,
    thresholds: jsonData?.threshold || null,
  }
}

async function importIndicators(studyId: string, dryRun: boolean) {
  console.log('\n🚀 Starting indicator import...\n')

  // Load data from both sources
  const excelData = await loadExcelData()
  const jsonData = loadJsonData()

  // Merge and prepare indicators
  const indicators = []
  let matchedCount = 0
  let excelOnlyCount = 0

  for (const [id, excelRow] of excelData) {
    const jsonIndicator = jsonData.get(id)
    if (jsonIndicator) {
      matchedCount++
    } else {
      excelOnlyCount++
    }

    indicators.push(mergeIndicator(excelRow, jsonIndicator))
  }

  console.log(`\n📋 Merge summary:`)
  console.log(`   Total indicators: ${indicators.length}`)
  console.log(`   Matched in both sources: ${matchedCount}`)
  console.log(`   Excel only (no evidence): ${excelOnlyCount}`)
  console.log(`   MVP indicators: ${indicators.filter(i => i.mvp).length}`)

  if (dryRun) {
    console.log('\n🔍 DRY RUN - No changes made to database')
    console.log('\nSample merged indicator:')
    console.log(JSON.stringify(indicators[0], null, 2))
    return
  }

  // Clear existing indicators for this study
  console.log(`\n🗑️  Clearing existing indicators for study ${studyId}...`)
  const deleted = await prisma.indicator.deleteMany({
    where: { studyId }
  })
  console.log(`   Deleted ${deleted.count} existing indicators`)

  // Insert new indicators
  console.log(`\n📥 Inserting ${indicators.length} indicators...`)

  let inserted = 0
  for (const indicator of indicators) {
    // Handle JSON fields - convert null to Prisma.JsonNull
    const {
      riskFactors,
      protectiveFactors,
      keyCitations,
      thresholds,
      ...rest
    } = indicator

    await prisma.indicator.create({
      data: {
        ...rest,
        studyId,
        riskFactors: riskFactors === null ? Prisma.JsonNull : riskFactors,
        protectiveFactors: protectiveFactors === null ? Prisma.JsonNull : protectiveFactors,
        keyCitations: keyCitations === null ? Prisma.JsonNull : keyCitations,
        thresholds: thresholds === null ? Prisma.JsonNull : thresholds,
      }
    })
    inserted++

    // Progress indicator
    if (inserted % 10 === 0) {
      process.stdout.write(`   ${inserted}/${indicators.length}\r`)
    }
  }

  console.log(`\n✅ Successfully imported ${inserted} indicators`)

  // Summary stats
  const stats = await prisma.indicator.groupBy({
    by: ['domainCode'],
    where: { studyId },
    _count: true,
  })

  console.log('\n📊 Indicators by domain:')
  for (const stat of stats) {
    console.log(`   ${stat.domainCode}: ${stat._count}`)
  }
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')

  // Get or create study
  let studyId = args.find(a => a.startsWith('--study-id='))?.split('=')[1]

  if (!studyId) {
    // Find the first study or create one
    const study = await prisma.study.findFirst()

    if (study) {
      studyId = study.id
      console.log(`📌 Using existing study: ${study.name} (${studyId})`)
    } else {
      // Create a default study
      const newStudy = await prisma.study.create({
        data: {
          name: 'YWC GBV Indicators Framework',
          description: 'Delphi validation study for GBV indicators in Yukon',
          totalRounds: 3,
          consensusThreshold: 0.67,
        }
      })
      studyId = newStudy.id
      console.log(`📌 Created new study: ${newStudy.name} (${studyId})`)
    }
  }

  await importIndicators(studyId, dryRun)

  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error('❌ Import failed:', e)
  await prisma.$disconnect()
  process.exit(1)
})
