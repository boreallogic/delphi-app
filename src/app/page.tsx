import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { prisma } from '@/lib/db'

// Force dynamic rendering - this page queries the database for current study status
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  // Get the single study (should always exist after seed)
  const study = await prisma.study.findFirst({
    include: {
      _count: {
        select: {
          indicators: true,
          panelists: true,
        },
      },
    },
  })

  if (!study) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <Card>
            <CardHeader className="text-center">
              <CardTitle>No Study Found</CardTitle>
              <CardDescription>
                Please run the database seed to create a study
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center text-sm text-gray-600">
              <p>Run: npm run db:seed</p>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  const statusColor = {
    ACTIVE: 'bg-green-100 text-green-800',
    SETUP: 'bg-blue-100 text-blue-800',
    PAUSED: 'bg-amber-100 text-amber-800',
    COMPLETE: 'bg-gray-100 text-gray-800',
  }[study.status]

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Yukon University + YSWC</CardTitle>
            <CardDescription className="text-base mt-2">
              GBV Indicators Framework Validation Study
              <span className="block text-xs mt-1">Funded by SSHRC</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border rounded-lg bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{study.name}</h3>
                <span className={`px-2 py-1 rounded text-xs font-medium ${statusColor}`}>
                  {study.status}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {study._count.indicators} indicators • {study._count.panelists} panelists • Round {study.currentRound} of {study.totalRounds}
              </p>
            </div>

            <a
              href="/study"
              className="block p-4 border-2 border-blue-600 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors text-center"
            >
              <p className="text-blue-900 font-medium text-lg">
                Enter Assessment Panel →
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Review and rate {study._count.indicators} GBV indicators
              </p>
            </a>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-gray-500">
          <p>Yukon University • Yukon Status of Women Council</p>
          <p className="text-xs mt-1">In partnership with Boreal Logic Inc.</p>
        </div>
      </div>
    </main>
  )
}
