import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  // Get the single study
  const study = await prisma.study.findFirst({
    include: {
      _count: {
        select: {
          indicators: true,
          panelists: true,
        },
      },
      rounds: {
        orderBy: { roundNumber: 'asc' },
      },
    },
  })

  // If no study exists, show setup message
  if (!study) {
    return (
      <main className="min-h-screen p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-8">Facilitator Dashboard</h1>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                No study data found. Please run the seed script:
              </p>
              <code className="block bg-muted p-2 rounded mb-4">
                npm run db:seed
              </code>
              <p className="text-sm text-muted-foreground">
                This will load all 50 indicators with evidence data automatically.
              </p>
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
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Facilitator Dashboard</h1>
            <p className="text-muted-foreground">
              YWC GBV Indicators Validation Study
            </p>
          </div>
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{study.name}</CardTitle>
                <CardDescription>
                  Created {formatDate(study.createdAt)}
                </CardDescription>
              </div>
              <span className={`px-2 py-1 rounded text-sm font-medium ${statusColor}`}>
                {study.status}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Indicators</p>
                <p className="text-xl font-semibold">{study._count.indicators}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {study._count.indicators === 50 ? 'All loaded ✓' : ''}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Panelists</p>
                <p className="text-xl font-semibold">{study._count.panelists}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Round</p>
                <p className="text-xl font-semibold">
                  {study.currentRound} / {study.totalRounds}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Consensus Threshold</p>
                <p className="text-xl font-semibold">IQR ≤ {study.consensusThreshold}</p>
              </div>
            </div>

            {study.description && (
              <p className="text-sm text-muted-foreground mb-4">
                {study.description}
              </p>
            )}

            <div className="flex gap-2">
              <Link href={`/admin/studies/${study.id}`}>
                <Button size="sm">
                  Manage Rounds
                </Button>
              </Link>
              <Link href={`/admin/studies/${study.id}/panelists`}>
                <Button variant="outline" size="sm">
                  Manage Panelists
                </Button>
              </Link>
              <Link href={`/admin/studies/${study.id}/results`}>
                <Button variant="outline" size="sm">
                  View Results
                </Button>
              </Link>
              <Link href={`/study/${study.id}`}>
                <Button variant="outline" size="sm">
                  Preview Assessment
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Study Progress by Round */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Rounds Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {study.rounds.map((round) => (
                <div key={round.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Round {round.roundNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {round.status === 'PENDING' && 'Not started'}
                      {round.status === 'OPEN' && round.opensAt && `Opened ${formatDate(round.opensAt)}`}
                      {round.status === 'CLOSED' && round.closedAt && `Closed ${formatDate(round.closedAt)}`}
                    </p>
                  </div>
                  <span className={`
                    px-2 py-1 rounded text-xs font-medium
                    ${round.status === 'PENDING' ? 'bg-gray-100 text-gray-800' : ''}
                    ${round.status === 'OPEN' ? 'bg-green-100 text-green-800' : ''}
                    ${round.status === 'CLOSED' ? 'bg-blue-100 text-blue-800' : ''}
                  `}>
                    {round.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
