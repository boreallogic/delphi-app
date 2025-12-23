import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ConsensusBadge } from '@/components/ui/progress'
import { roleDisplayNames } from '@/lib/utils'
import { ExportButton } from './export-button'

interface PageProps {
  params: Promise<{ studyId: string }>
}

export default async function ResultsPage({ params }: PageProps) {
  const { studyId } = await params
  
  const study = await prisma.study.findUnique({
    where: { id: studyId },
    include: {
      indicators: {
        orderBy: [{ domain: 'asc' }, { externalId: 'asc' }],
      },
      rounds: {
        orderBy: { roundNumber: 'asc' },
      },
    },
  })

  if (!study) {
    notFound()
  }

  // Get latest summaries (from most recent analyzed round)
  const latestAnalyzedRound = study.rounds
    .filter(r => r.status === 'ANALYZED')
    .sort((a, b) => b.roundNumber - a.roundNumber)[0]

  const summaries = latestAnalyzedRound
    ? await prisma.roundSummary.findMany({
        where: {
          roundNumber: latestAnalyzedRound.roundNumber,
          indicator: { studyId },
        },
        include: {
          indicator: true,
        },
        orderBy: {
          indicator: { domain: 'asc' },
        },
      })
    : []

  // Calculate stats
  const consensusCount = summaries.filter(s => s.consensusReached).length
  const totalDissents = summaries.reduce((sum, s) => sum + s.dissentCount, 0)

  // Group by domain
  const byDomain = summaries.reduce((acc, s) => {
    const domain = s.indicator.domain
    if (!acc[domain]) acc[domain] = []
    acc[domain].push(s)
    return acc
  }, {} as Record<string, typeof summaries>)

  // Sort indicators by priority within each domain
  Object.values(byDomain).forEach(group => {
    group.sort((a, b) => (b.priorityMedian || 0) - (a.priorityMedian || 0))
  })

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <Link 
              href={`/admin/studies/${studyId}`}
              className="text-sm text-muted-foreground hover:underline mb-2 block"
            >
              ← Back to Study
            </Link>
            <h1 className="text-2xl font-bold">Results & Consensus</h1>
            <p className="text-muted-foreground">{study.name}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Ratings use a 3-point scale (Low/Medium/High). "Don't Know" responses excluded from statistics.
            </p>
          </div>
          <ExportButton studyId={studyId} />
        </div>

        {!latestAnalyzedRound ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No rounds have been analyzed yet. Complete and analyze a round to see results.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Summary stats */}
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Round Analyzed</p>
                  <p className="text-3xl font-bold">
                    {latestAnalyzedRound.roundNumber} / {study.totalRounds}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Consensus Reached</p>
                  <p className="text-3xl font-bold text-green-600">
                    {consensusCount} / {summaries.length}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Consensus Rate</p>
                  <p className="text-3xl font-bold">
                    {summaries.length > 0 
                      ? Math.round((consensusCount / summaries.length) * 100)
                      : 0}%
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total Dissent Flags</p>
                  <p className="text-3xl font-bold text-amber-600">{totalDissents}</p>
                </CardContent>
              </Card>
            </div>

            {/* Results by domain */}
            {Object.entries(byDomain).map(([domain, domainSummaries]) => (
              <Card key={domain} className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">{domain}</CardTitle>
                  <CardDescription>
                    {domainSummaries.filter(s => s.consensusReached).length} of{' '}
                    {domainSummaries.length} indicators reached consensus
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-2">ID</th>
                          <th className="text-left py-2 px-2">Indicator</th>
                          <th className="text-center py-2 px-2">Priority</th>
                          <th className="text-center py-2 px-2">Validity</th>
                          <th className="text-center py-2 px-2">Feasibility</th>
                          <th className="text-center py-2 px-2">IQR</th>
                          <th className="text-center py-2 px-2">Status</th>
                          <th className="text-center py-2 px-2">Dissents</th>
                        </tr>
                      </thead>
                      <tbody>
                        {domainSummaries.map((summary) => (
                          <tr key={summary.id} className="border-b hover:bg-muted/50">
                            <td className="py-2 px-2 font-mono text-xs">
                              {summary.indicator.externalId}
                            </td>
                            <td className="py-2 px-2 max-w-xs truncate" title={summary.indicator.name}>
                              {summary.indicator.name}
                            </td>
                            <td className="py-2 px-2 text-center">
                              <span className="font-semibold">{summary.priorityMedian?.toFixed(1)}</span>
                              <span className="text-muted-foreground text-xs ml-1">
                                (μ={summary.priorityMean?.toFixed(1)})
                              </span>
                            </td>
                            <td className="py-2 px-2 text-center">
                              {summary.validityMedian?.toFixed(1)}
                            </td>
                            <td className="py-2 px-2 text-center">
                              {summary.feasibilityMedian?.toFixed(1)}
                            </td>
                            <td className="py-2 px-2 text-center font-mono">
                              {summary.priorityIQR?.toFixed(2)}
                            </td>
                            <td className="py-2 px-2 text-center">
                              <ConsensusBadge 
                                iqr={summary.priorityIQR || 0} 
                                threshold={study.consensusThreshold}
                              />
                            </td>
                            <td className="py-2 px-2 text-center">
                              {summary.dissentCount > 0 && (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">
                                  {summary.dissentCount}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Role-stratified analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Role-Stratified Analysis</CardTitle>
                <CardDescription>
                  Compare how different panelist types rated the indicators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  This analysis helps identify where expert opinions diverge from lived experience perspectives.
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Analysis uses primary roles only. Secondary roles are not included in stratification.
                </p>

                {summaries.length > 0 && summaries[0].priorityByRole && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-2">Indicator</th>
                          {Object.keys(roleDisplayNames).map(role => (
                            <th key={role} className="text-center py-2 px-1 text-xs">
                              {roleDisplayNames[role]}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {summaries.slice(0, 20).map((summary) => {
                          const roleData = summary.priorityByRole as Record<string, { mean: number; median: number }> | null
                          
                          return (
                            <tr key={summary.id} className="border-b">
                              <td className="py-2 px-2 truncate max-w-[200px]" title={summary.indicator.name}>
                                {summary.indicator.externalId}: {summary.indicator.name}
                              </td>
                              {Object.keys(roleDisplayNames).map(role => (
                                <td key={role} className="py-2 px-1 text-center">
                                  {roleData?.[role]?.median?.toFixed(1) || '-'}
                                </td>
                              ))}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                    {summaries.length > 20 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Showing first 20 indicators. Export full data for complete analysis.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </main>
  )
}
