import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { roleDisplayNames } from '@/lib/utils'

interface RouteParams {
  params: Promise<{ studyId: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { studyId } = await params
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json'

    // Get study with all data
    const study = await prisma.study.findUnique({
      where: { id: studyId },
      include: {
        indicators: {
          orderBy: [{ domain: 'asc' }, { externalId: 'asc' }],
        },
        panelists: true,
        rounds: {
          orderBy: { roundNumber: 'asc' },
        },
      },
    })

    if (!study) {
      return NextResponse.json({ error: 'Study not found' }, { status: 404 })
    }

    // Get all summaries
    const summaries = await prisma.roundSummary.findMany({
      where: {
        indicator: { studyId },
      },
      include: {
        indicator: true,
      },
      orderBy: [
        { roundNumber: 'asc' },
        { indicator: { domain: 'asc' } },
      ],
    })

    // Get all responses (for detailed export)
    const responses = await prisma.response.findMany({
      where: {
        indicator: { studyId },
      },
      include: {
        panelist: true,
        indicator: true,
      },
      orderBy: [
        { roundNumber: 'asc' },
        { indicator: { domain: 'asc' } },
      ],
    })

    // Get dissent details
    const dissents = responses.filter(r => r.dissentFlag)

    if (format === 'json') {
      const exportData = {
        study: {
          id: study.id,
          name: study.name,
          description: study.description,
          status: study.status,
          totalRounds: study.totalRounds,
          currentRound: study.currentRound,
          consensusThreshold: study.consensusThreshold,
          createdAt: study.createdAt,
          ratingScale: {
            type: '3-point',
            labels: { 1: 'Low', 2: 'Medium', 3: 'High' },
            dontKnowHandling: 'Excluded from statistics (stored as null)',
          },
        },
        panelComposition: Object.entries(roleDisplayNames).map(([role, label]) => ({
          role,
          label,
          primaryRoleCount: study.panelists.filter(p => p.primaryRole === role).length,
          secondaryRoleCount: study.panelists.filter(p => p.secondaryRole === role).length,
        })),
        panelistMetadata: study.panelists.map(p => ({
          id: p.id,
          primaryRole: roleDisplayNames[p.primaryRole],
          secondaryRole: p.secondaryRole ? roleDisplayNames[p.secondaryRole] : null,
          expertiseArea: p.expertiseArea,
          jurisdictionContext: p.jurisdictionContext,
        })),
        indicators: study.indicators.map(ind => ({
          id: ind.externalId,
          name: ind.name,
          domain: ind.domain,
          category: ind.category,
          definition: ind.definition,
          unitOfMeasure: ind.unitOfMeasure,
          operationalization: ind.operationalization,
          originalPriority: ind.originalPriority,
        })),
        roundSummaries: summaries.map(s => ({
          indicatorId: s.indicator.externalId,
          indicatorName: s.indicator.name,
          domain: s.indicator.domain,
          roundNumber: s.roundNumber,
          priority: {
            mean: s.priorityMean,
            median: s.priorityMedian,
            std: s.priorityStd,
            iqr: s.priorityIQR,
            min: s.priorityMin,
            max: s.priorityMax,
          },
          validity: {
            mean: s.validityMean,
            median: s.validityMedian,
            std: s.validityStd,
            iqr: s.validityIQR,
          },
          feasibility: {
            mean: s.feasibilityMean,
            median: s.feasibilityMedian,
            std: s.feasibilityStd,
            iqr: s.feasibilityIQR,
          },
          consensusReached: s.consensusReached,
          dissentCount: s.dissentCount,
          responseCount: s.responseCount,
          priorityByRole: s.priorityByRole,
          validityByRole: s.validityByRole,
        })),
        dissentRegister: dissents.map(r => ({
          indicatorId: r.indicator.externalId,
          indicatorName: r.indicator.name,
          roundNumber: r.roundNumber,
          panelistPrimaryRole: roleDisplayNames[r.panelist.primaryRole],
          panelistSecondaryRole: r.panelist.secondaryRole ? roleDisplayNames[r.panelist.secondaryRole] : null,
          reason: r.dissentReason,
          priorityRating: r.priorityRating,
          validityRating: r.operationalizationValidity,
        })),
        exportedAt: new Date().toISOString(),
      }

      return new NextResponse(JSON.stringify(exportData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="delphi-results-${studyId}.json"`,
        },
      })
    }

    // CSV format
    if (format === 'csv') {
      const latestRound = Math.max(...summaries.map(s => s.roundNumber), 0)
      const latestSummaries = summaries.filter(s => s.roundNumber === latestRound)

      const headers = [
        'Indicator ID',
        'Indicator Name',
        'Domain',
        'Category',
        'Round',
        'Priority Median',
        'Priority Mean',
        'Priority IQR',
        'Validity Median',
        'Feasibility Median',
        'Consensus Reached',
        'Dissent Count',
        'Response Count',
        'Original Priority',
      ]

      const rows = latestSummaries.map(s => [
        s.indicator.externalId,
        `"${s.indicator.name.replace(/"/g, '""')}"`,
        `"${s.indicator.domain.replace(/"/g, '""')}"`,
        `"${s.indicator.category.replace(/"/g, '""')}"`,
        s.roundNumber,
        s.priorityMedian?.toFixed(2) || '',
        s.priorityMean?.toFixed(2) || '',
        s.priorityIQR?.toFixed(2) || '',
        s.validityMedian?.toFixed(2) || '',
        s.feasibilityMedian?.toFixed(2) || '',
        s.consensusReached ? 'Yes' : 'No',
        s.dissentCount,
        s.responseCount,
        s.indicator.originalPriority,
      ])

      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="delphi-results-${studyId}.csv"`,
        },
      })
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 })

  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
