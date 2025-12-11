import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, roleDisplayNames } from '@/lib/utils'
import { AddPanelistForm } from './add-panelist-form'
import { PanelistActions } from './panelist-actions'

interface PageProps {
  params: Promise<{ studyId: string }>
}

export default async function PanelistsPage({ params }: PageProps) {
  const { studyId } = await params
  
  const study = await prisma.study.findUnique({
    where: { id: studyId },
    include: {
      panelists: {
        orderBy: { createdAt: 'asc' },
      },
      indicators: true,
    },
  })

  if (!study) {
    notFound()
  }

  // Get response counts per panelist for current round
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

  // Group panelists by role
  const byRole = study.panelists.reduce((acc, p) => {
    if (!acc[p.roleType]) acc[p.roleType] = []
    acc[p.roleType].push(p)
    return acc
  }, {} as Record<string, typeof study.panelists>)

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link 
            href={`/admin/studies/${studyId}`}
            className="text-sm text-muted-foreground hover:underline mb-2 block"
          >
            ← Back to Study
          </Link>
          <h1 className="text-2xl font-bold">Manage Panelists</h1>
          <p className="text-muted-foreground">{study.name}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Add panelist form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add Panelist</CardTitle>
                <CardDescription>
                  Invite a new panelist to the study
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AddPanelistForm studyId={studyId} />
              </CardContent>
            </Card>

            {/* Role distribution */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">Panel Composition</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {Object.entries(roleDisplayNames).map(([role, label]) => (
                    <li key={role} className="flex justify-between">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium">
                        {byRole[role]?.length || 0}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between font-medium">
                    <span>Total</span>
                    <span>{study.panelists.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Panelist list */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Panelists ({study.panelists.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {study.panelists.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No panelists added yet. Use the form to invite panelists.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {study.panelists.map((panelist) => {
                      const completed = responseMap.get(panelist.id) || 0
                      const total = study.indicators.length
                      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

                      return (
                        <div 
                          key={panelist.id}
                          className="flex items-center gap-4 p-3 rounded-lg border"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {panelist.name || 'No name'}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {panelist.email}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs px-2 py-0.5 rounded bg-secondary">
                                {roleDisplayNames[panelist.roleType]}
                              </span>
                              {panelist.lastLoginAt && (
                                <span className="text-xs text-muted-foreground">
                                  Last login: {formatDate(panelist.lastLoginAt)}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {completed}/{total}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {percentage}% complete
                            </p>
                          </div>

                          <PanelistActions 
                            panelist={panelist} 
                            studyName={study.name}
                          />
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bulk actions */}
            {study.panelists.length > 0 && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-lg">Bulk Actions</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Send Reminder to All
                  </Button>
                  <Button variant="outline" size="sm">
                    Export Panelist List
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
