import { redirect } from 'next/navigation'
import { getPanelist } from '@/lib/session'
import { prisma } from '@/lib/db'
import { StudyDashboard } from './study-dashboard'

interface PageProps {
  params: Promise<{ studyId: string }>
}

export default async function StudyPage({ params }: PageProps) {
  const { studyId } = await params

  // TEMPORARY: Get any panelist for testing (auth bypassed)
  let panelist = await getPanelist()

  // If no panelist exists, get the study directly
  if (!panelist) {
    const study = await prisma.study.findUnique({
      where: { id: studyId },
      include: {
        rounds: {
          orderBy: { roundNumber: 'asc' },
        },
        panelists: {
          take: 1,
        },
      },
    })

    if (!study) {
      redirect('/admin')
    }

    // Use the first panelist if available
    if (study.panelists.length > 0) {
      panelist = await prisma.panelist.findUnique({
        where: { id: study.panelists[0].id },
        include: {
          study: {
            include: {
              rounds: {
                orderBy: { roundNumber: 'asc' },
              },
            },
          },
        },
      })
    }
  }

  // If still no panelist, redirect to admin to create study
  if (!panelist) {
    redirect('/admin')
  }

  const study = panelist.study

  // Get indicators grouped by domain
  const indicators = await prisma.indicator.findMany({
    where: { studyId },
    orderBy: [
      { domain: 'asc' },
      { externalId: 'asc' },
    ],
  })

  // Get current round
  const currentRound = study.rounds.find(r => r.status === 'OPEN') || 
                       study.rounds[study.rounds.length - 1]

  // Get panelist's responses for current round
  const responses = await prisma.response.findMany({
    where: {
      panelistId: panelist.id,
      roundNumber: study.currentRound,
    },
  })

  // Get previous round summaries if not round 1
  const previousSummaries = study.currentRound > 1 
    ? await prisma.roundSummary.findMany({
        where: {
          roundNumber: study.currentRound - 1,
          indicator: { studyId },
        },
        include: { indicator: true },
      })
    : []

  // Group indicators by domain for batching
  const domains = indicators.reduce((acc, indicator) => {
    const domain = indicator.domain
    if (!acc[domain]) {
      acc[domain] = []
    }
    acc[domain].push(indicator)
    return acc
  }, {} as Record<string, typeof indicators>)

  // Calculate progress per domain
  const domainProgress = Object.entries(domains).map(([domain, domainIndicators]) => {
    const completed = domainIndicators.filter(ind => 
      responses.some(r => r.indicatorId === ind.id && r.priorityRating !== null)
    ).length

    return {
      id: domain,
      name: domain.replace(/^D\d+:\s*/, ''), // Remove "D1: " prefix for display
      total: domainIndicators.length,
      completed,
    }
  })

  return (
    <StudyDashboard
      study={study}
      panelist={panelist}
      indicators={indicators}
      domains={domainProgress}
      responses={responses}
      previousSummaries={previousSummaries}
      currentRound={study.currentRound}
    />
  )
}
