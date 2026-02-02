import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'

// Domain metadata
const domainInfo: Record<string, { name: string; description: string }> = {
  'A': {
    name: 'Safe Places to Stay',
    description: 'Emergency shelters, transitional housing, pet care services',
  },
  'B': {
    name: 'Safety & Justice',
    description: 'Victim services, legal aid, court access, police response',
  },
  'C': {
    name: 'Health & Wellbeing',
    description: 'SANE access, primary care, mental health, substance treatment',
  },
  'D': {
    name: 'Economic Security',
    description: 'Emergency funds, relocation support, childcare, financial services',
  },
  'E': {
    name: 'Support Services',
    description: 'GBV services, crisis lines, counseling, cultural safety',
  },
  'F': {
    name: 'Community Response',
    description: 'Service coordination, community readiness, informal supports',
  },
  'G': {
    name: 'Prevention & Education',
    description: 'Healthy relationships, bystander training, alcohol policy, perpetrator programs',
  },
  'H': {
    name: 'Data & Accountability',
    description: 'Data systems, feedback mechanisms, policy implementation',
  },
}

export const dynamic = 'force-dynamic'

interface DomainPageProps {
  params: Promise<{ code: string }>
}

export default async function DomainPage({ params }: DomainPageProps) {
  const session = await getSession()
  if (!session) {
    redirect('/')
  }

  const { panelist, study } = session
  const { code } = await params

  // Validate domain code
  const domainCode = code.toUpperCase()
  if (!domainInfo[domainCode]) {
    redirect('/study')
  }

  const domain = domainInfo[domainCode]

  // Get indicators for this domain
  const indicators = await prisma.indicator.findMany({
    where: {
      studyId: study.id,
      domainCode: domainCode,
    },
    orderBy: [{ externalId: 'asc' }],
  })

  // Get panelist's responses for current round
  const responses = await prisma.response.findMany({
    where: {
      panelistId: panelist.id,
      roundNumber: study.currentRound,
    },
    select: { indicatorId: true }
  })

  const completedIds = new Set(responses.map(r => r.indicatorId))

  // Calculate domain progress
  const totalIndicators = indicators.length
  const completedCount = indicators.filter(i => completedIds.has(i.id)).length
  const progress = totalIndicators > 0 ? Math.round((completedCount / totalIndicators) * 100) : 0

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link
          href="/study"
          className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
        >
          ← Back to Domain Selection
        </Link>
      </div>

      {/* Domain header */}
      <div className="mb-8">
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0 w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-2xl">
            {domainCode}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {domain.name}
            </h1>
            <p className="text-gray-600">
              {domain.description}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="bg-gray-100 rounded-full h-3 mb-2">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-500">
          {completedCount} of {totalIndicators} indicators assessed ({progress}%)
        </p>
      </div>

      {/* Instructions */}
      <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h2 className="font-semibold text-blue-900 mb-2">Assessment Instructions</h2>
        <p className="text-sm text-blue-800">
          Review each indicator below and provide ratings on three dimensions:
        </p>
        <ul className="text-sm text-blue-800 mt-2 ml-4 list-disc">
          <li><strong>Priority:</strong> How critical is this indicator for measuring GBV risk?</li>
          <li><strong>Validity:</strong> Does this measure what it claims to measure?</li>
          <li><strong>Feasibility:</strong> Can this data be reliably collected?</li>
        </ul>
      </div>

      {/* Indicator cards */}
      {indicators.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No indicators found for this domain.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {indicators.map((indicator) => {
            const isComplete = completedIds.has(indicator.id)

            return (
              <Link
                key={indicator.id}
                href={`/study/indicator/${indicator.id}?domain=${domainCode}`}
                className="block p-4 border rounded-lg hover:border-blue-500 hover:shadow-md transition-all bg-white"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-gray-500">
                        {indicator.externalId}
                      </span>
                      {indicator.tier === 1 ? (
                        <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded font-medium">
                          Tier 1
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                          Tier 2
                        </span>
                      )}
                      {indicator.mvp && (
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">
                          MVP
                        </span>
                      )}
                    </div>
                    <h3 className="font-medium text-gray-900 text-sm line-clamp-2">
                      {indicator.name}
                    </h3>
                  </div>
                  <div className={`text-xl flex-shrink-0 ${isComplete ? 'text-green-600' : 'text-gray-300'}`}>
                    {isComplete ? '✓' : '○'}
                  </div>
                </div>
                <p className="text-xs text-gray-600 line-clamp-2">
                  {indicator.definitionSimple || indicator.definition}
                </p>
              </Link>
            )
          })}
        </div>
      )}

      {/* Navigation hint */}
      {indicators.length > 0 && (
        <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
          <p className="text-sm text-gray-600">
            Select an indicator to begin assessment. You can return to this page at any time.
          </p>
        </div>
      )}
    </div>
  )
}
