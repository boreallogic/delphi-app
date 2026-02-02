import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'

// Domain metadata
const domains = [
  {
    code: 'A',
    name: 'Safe Places to Stay',
    description: 'Emergency shelters, transitional housing, pet care services',
  },
  {
    code: 'B',
    name: 'Safety & Justice',
    description: 'Victim services, legal aid, court access, police response',
  },
  {
    code: 'C',
    name: 'Health & Wellbeing',
    description: 'SANE access, primary care, mental health, substance treatment',
  },
  {
    code: 'D',
    name: 'Economic Security',
    description: 'Emergency funds, relocation support, childcare, financial services',
  },
  {
    code: 'E',
    name: 'Support Services',
    description: 'GBV services, crisis lines, counseling, cultural safety',
  },
  {
    code: 'F',
    name: 'Community Response',
    description: 'Service coordination, community readiness, informal supports',
  },
  {
    code: 'G',
    name: 'Prevention & Education',
    description: 'Healthy relationships, bystander training, alcohol policy, perpetrator programs',
  },
  {
    code: 'H',
    name: 'Data & Accountability',
    description: 'Data systems, feedback mechanisms, policy implementation',
  },
]

export const dynamic = 'force-dynamic'

export default async function StudyPage() {
  const session = await getSession()
  if (!session) {
    redirect('/')
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

  // Calculate overall progress
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
        <p className="text-sm text-blue-800 mb-2">
          Select a domain below to begin assessing indicators. Focus on one domain at a time to reduce cognitive load.
        </p>
        <p className="text-sm text-blue-800">
          You'll rate each indicator on three dimensions: <strong>Priority</strong>, <strong>Validity</strong>, and <strong>Feasibility</strong>.
        </p>
      </div>

      {/* Domain cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        {domains.map((domain) => {
          const domainIndicators = byDomain[domain.code] || []
          const domainCompleted = domainIndicators.filter(i => completedIds.has(i.id)).length
          const domainTotal = domainIndicators.length
          const domainProgress = domainTotal > 0 ? Math.round((domainCompleted / domainTotal) * 100) : 0
          const isComplete = domainCompleted === domainTotal && domainTotal > 0

          return (
            <Link
              key={domain.code}
              href={`/study/domain/${domain.code}`}
              className="block p-6 border-2 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all bg-white"
            >
              {/* Domain header */}
              <div className="flex items-start gap-4 mb-3">
                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                  isComplete ? 'bg-green-600' : 'bg-blue-600'
                }`}>
                  {domain.code}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg text-gray-900 mb-1">
                    {domain.name}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {domain.description}
                  </p>
                </div>
              </div>

              {/* Progress */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {domainCompleted} of {domainTotal} indicators
                  </span>
                  <span className={`text-sm font-semibold ${
                    isComplete ? 'text-green-600' : 'text-blue-600'
                  }`}>
                    {domainProgress}%
                  </span>
                </div>
                <div className="bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      isComplete ? 'bg-green-600' : 'bg-blue-600'
                    }`}
                    style={{ width: `${domainProgress}%` }}
                  />
                </div>
              </div>

              {/* Status badge */}
              {isComplete && (
                <div className="mt-3 flex items-center gap-2 text-green-600">
                  <span className="text-lg">✓</span>
                  <span className="text-sm font-medium">Complete</span>
                </div>
              )}
            </Link>
          )
        })}
      </div>

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
