import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'

// Domain display names
const domainNames: Record<string, string> = {
  'A': 'Safe Places to Stay',
  'B': 'Safety & Justice',
  'C': 'Health & Wellbeing',
  'D': 'Economic Security',
  'E': 'Support Services',
  'F': 'Community Response',
  'G': 'Prevention & Education',
  'H': 'Data & Accountability',
}

export const dynamic = 'force-dynamic'

export default async function StudyPage() {
  const session = await getSession()
  if (!session) {
    return (
      <div className="max-w-2xl mx-auto p-6 mt-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h1 className="text-xl font-bold text-red-900 mb-2">Session Error</h1>
          <p className="text-red-800 mb-4">
            Unable to load your session. This may be due to a database connection issue or you may need to log in.
          </p>
          <p className="text-sm text-red-700">
            Please contact your study administrator if this problem persists.
          </p>
        </div>
      </div>
    )
  }

  const { panelist, study } = session

  // Get all indicators for this study
  const indicators = await prisma.indicator.findMany({
    where: { studyId: study.id },
    orderBy: [{ domainCode: 'asc' }, { externalId: 'asc' }],
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

  // Group indicators by domain
  const byDomain = indicators.reduce((acc, indicator) => {
    const code = indicator.domainCode
    if (!acc[code]) acc[code] = []
    acc[code].push(indicator)
    return acc
  }, {} as Record<string, typeof indicators>)

  const totalIndicators = indicators.length
  const completedCount = completedIds.size
  const progress = totalIndicators > 0 ? Math.round((completedCount / totalIndicators) * 100) : 0

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold">{study.name}</h1>
          <span className="text-sm text-gray-500">
            Round {study.currentRound} of {study.totalRounds}
          </span>
        </div>
        <p className="text-gray-600 mb-4">
          Welcome, {panelist.name || panelist.email}
        </p>

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
          Review each GBV indicator below and provide ratings on three dimensions:
        </p>
        <ul className="text-sm text-blue-800 mt-2 ml-4 list-disc">
          <li><strong>Priority:</strong> How critical is this indicator for measuring GBV risk?</li>
          <li><strong>Validity:</strong> Does this measure what it claims to measure?</li>
          <li><strong>Feasibility:</strong> Can this data be reliably collected?</li>
        </ul>
      </div>

      {/* Domain sections */}
      {Object.entries(byDomain).sort().map(([code, domainIndicators]) => (
        <section key={code} className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
              {code}
            </span>
            {domainNames[code] || `Domain ${code}`}
            <span className="text-sm font-normal text-gray-500">
              ({domainIndicators.filter(i => completedIds.has(i.id)).length}/{domainIndicators.length})
            </span>
          </h2>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {domainIndicators.map((indicator) => {
              const isComplete = completedIds.has(indicator.id)

              return (
                <Link
                  key={indicator.id}
                  href={`/study/indicator/${indicator.id}`}
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
        </section>
      ))}

      {/* Logout */}
      <div className="mt-12 pt-6 border-t text-center">
        <form action="/api/auth/logout" method="POST">
          <button type="submit" className="text-sm text-gray-500 hover:text-gray-700">
            Sign out
          </button>
        </form>
      </div>
    </div>
  )
}
