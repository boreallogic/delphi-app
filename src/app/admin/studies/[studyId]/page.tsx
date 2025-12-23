import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RoundStepper, ProgressBar } from '@/components/ui/progress'
import { formatDate, roleDisplayNames } from '@/lib/utils'
import { StudyActions } from './study-actions'

interface PageProps {
  params: Promise<{ studyId: string }>
}

export default async function StudyManagementPage({ params }: PageProps) {
  const { studyId } = await params
  
  const study = await prisma.study.findUnique({
    where: { id: studyId },
    include: {
      indicators: {
        orderBy: { domain: 'asc' },
      },
      panelists: {
        orderBy: { createdAt: 'asc' },
      },
      rounds: {
        orderBy: { roundNumber: 'asc' },
      },
    },
  })

  if (!study) {
    notFound()
  }

  // Get response counts for current round
  const responseCounts = await prisma.response.groupBy({
    by: ['panelistId'],
    where: {
      roundNumber: study.currentRound,
      indicator: { studyId },
      priorityRating: { not: null },
    },
    _count: true,
  })

  const responseMap = new Map(
    responseCounts.map(r => [r.panelistId, r._count])
  )

  // Group indicators by domain
  const domains = study.indicators.reduce((acc, ind) => {
    if (!acc[ind.domain]) acc[ind.domain] = []
    acc[ind.domain].push(ind)
    return acc
  }, {} as Record<string, typeof study.indicators>)

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <Link 
              href="/admin" 
              className="text-sm text-muted-foreground hover:underline mb-2 block"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold">{study.name}</h1>
            {study.description && (
              <p className="text-muted-foreground mt-1">{study.description}</p>
            )}
          </div>
          <span className={`
            px-3 py-1 rounded-full text-sm font-medium
            ${study.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : ''}
            ${study.status === 'SETUP' ? 'bg-blue-100 text-blue-800' : ''}
            ${study.status === 'PAUSED' ? 'bg-amber-100 text-amber-800' : ''}
            ${study.status === 'COMPLETE' ? 'bg-gray-100 text-gray-800' : ''}
          `}>
            {study.status}
          </span>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left column - Study controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Round management */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Round Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-center py-4">
                  <RoundStepper 
                    currentRound={study.currentRound} 
                    totalRounds={study.totalRounds} 
                  />
                </div>

                <div className="space-y-4">
                  {study.rounds.map((round) => (
                    <div 
                      key={round.id}
                      className={`p-4 rounded-lg border ${
                        round.roundNumber === study.currentRound 
                          ? 'border-primary bg-primary/5' 
                          : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Round {round.roundNumber}</h4>
                        <span className={`
                          px-2 py-0.5 rounded text-xs font-medium
                          ${round.status === 'OPEN' ? 'bg-green-100 text-green-800' : ''}
                          ${round.status === 'PENDING' ? 'bg-gray-100 text-gray-600' : ''}
                          ${round.status === 'CLOSED' ? 'bg-blue-100 text-blue-800' : ''}
                          ${round.status === 'ANALYZED' ? 'bg-purple-100 text-purple-800' : ''}
                        `}>
                          {round.status}
                        </span>
                      </div>
                      {round.opensAt && (
                        <p className="text-sm text-muted-foreground">
                          Opens: {formatDate(round.opensAt)}
                        </p>
                      )}
                      {round.closesAt && (
                        <p className="text-sm text-muted-foreground">
                          Closes: {formatDate(round.closesAt)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <StudyActions study={study} />
              </CardContent>
            </Card>

            {/* Panelist progress */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Panelist Progress</CardTitle>
                  <Link href={`/admin/studies/${studyId}/panelists`}>
                    <Button variant="outline" size="sm">Manage Panelists</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {study.panelists.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No panelists added yet.{' '}
                    <Link 
                      href={`/admin/studies/${studyId}/panelists`}
                      className="text-primary hover:underline"
                    >
                      Add panelists
                    </Link>
                  </p>
                ) : (
                  <div className="space-y-3">
                    {study.panelists.map((panelist) => {
                      const completed = responseMap.get(panelist.id) || 0
                      const total = study.indicators.length
                      
                      return (
                        <div key={panelist.id} className="flex items-center gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {panelist.name || panelist.email}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {roleDisplayNames[panelist.primaryRole]}
                            </p>
                          </div>
                          <div className="w-32">
                            <ProgressBar 
                              value={completed} 
                              max={total}
                              showPercentage={false}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground w-16 text-right">
                            {completed}/{total}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column - Quick stats */}
          <div className="space-y-6">
            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Study Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Indicators</p>
                  <p className="text-2xl font-bold">{study.indicators.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Panelists</p>
                  <p className="text-2xl font-bold">{study.panelists.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Consensus Threshold</p>
                  <p className="text-2xl font-bold">IQR ≤ {study.consensusThreshold}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="text-lg">{formatDate(study.createdAt)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Domains */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Indicator Domains</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {Object.entries(domains).map(([domain, indicators]) => (
                    <li key={domain} className="flex justify-between">
                      <span className="text-muted-foreground">
                        {domain.replace(/^D\d+:\s*/, '')}
                      </span>
                      <span className="font-medium">{indicators.length}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Quick actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href={`/admin/studies/${studyId}/results`} className="block">
                  <Button variant="outline" className="w-full">
                    View Results
                  </Button>
                </Link>
                <Button variant="outline" className="w-full">
                  Export Data
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}
