import Link from 'next/link'
import { prisma } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProgressBar } from '@/components/ui/progress'
import { formatDate } from '@/lib/utils'

export default async function AdminDashboard() {
  // In production, add proper facilitator authentication
  const studies = await prisma.study.findMany({
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
    orderBy: { createdAt: 'desc' },
  })

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Facilitator Dashboard</h1>
            <p className="text-muted-foreground">
              Manage Delphi studies and monitor progress
            </p>
          </div>
          <Link href="/admin/studies/new">
            <Button>Create New Study</Button>
          </Link>
        </div>

        {studies.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                No studies created yet.
              </p>
              <Link href="/admin/studies/new">
                <Button>Create Your First Study</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {studies.map((study) => (
              <Card key={study.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{study.name}</CardTitle>
                      <CardDescription>
                        Created {formatDate(study.createdAt)}
                      </CardDescription>
                    </div>
                    <span className={`
                      px-2 py-1 rounded text-sm font-medium
                      ${study.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : ''}
                      ${study.status === 'SETUP' ? 'bg-blue-100 text-blue-800' : ''}
                      ${study.status === 'PAUSED' ? 'bg-amber-100 text-amber-800' : ''}
                      ${study.status === 'COMPLETE' ? 'bg-gray-100 text-gray-800' : ''}
                    `}>
                      {study.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Indicators</p>
                      <p className="text-xl font-semibold">{study._count.indicators}</p>
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
                      <Button variant="outline" size="sm">
                        Manage Study
                      </Button>
                    </Link>
                    <Link href={`/admin/studies/${study.id}/panelists`}>
                      <Button variant="outline" size="sm">
                        Panelists
                      </Button>
                    </Link>
                    <Link href={`/admin/studies/${study.id}/results`}>
                      <Button variant="outline" size="sm">
                        Results
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
