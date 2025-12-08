import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { calculateStats, checkConsensus } from '@/lib/utils'

interface RouteParams {
  params: Promise<{ studyId: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { studyId } = await params
    const { action } = await request.json()

    const study = await prisma.study.findUnique({
      where: { id: studyId },
      include: {
        rounds: { orderBy: { roundNumber: 'asc' } },
        panelists: true,
      },
    })

    if (!study) {
      return NextResponse.json({ error: 'Study not found' }, { status: 404 })
    }

    switch (action) {
      case 'START_ROUND_1': {
        if (study.status !== 'SETUP' || study.currentRound !== 0) {
          return NextResponse.json(
            { error: 'Cannot start round 1 - study not in setup state' },
            { status: 400 }
          )
        }

        await prisma.$transaction([
          prisma.study.update({
            where: { id: studyId },
            data: { status: 'ACTIVE', currentRound: 1 },
          }),
          prisma.round.update({
            where: { 
              studyId_roundNumber: { studyId, roundNumber: 1 } 
            },
            data: { 
              status: 'OPEN', 
              opensAt: new Date() 
            },
          }),
          prisma.auditLog.create({
            data: {
              action: 'ROUND_STARTED',
              actorType: 'FACILITATOR',
              studyId,
              metadata: { roundNumber: 1 },
            },
          }),
        ])

        return NextResponse.json({ success: true, message: 'Round 1 started' })
      }

      case 'CLOSE_ROUND': {
        const currentRound = study.rounds.find(r => r.roundNumber === study.currentRound)
        
        if (!currentRound || currentRound.status !== 'OPEN') {
          return NextResponse.json(
            { error: 'No open round to close' },
            { status: 400 }
          )
        }

        await prisma.$transaction([
          prisma.round.update({
            where: { id: currentRound.id },
            data: { status: 'CLOSED', closedAt: new Date() },
          }),
          prisma.auditLog.create({
            data: {
              action: 'ROUND_CLOSED',
              actorType: 'FACILITATOR',
              studyId,
              metadata: { roundNumber: study.currentRound },
            },
          }),
        ])

        return NextResponse.json({ success: true, message: 'Round closed' })
      }

      case 'ANALYZE_ROUND': {
        const currentRound = study.rounds.find(r => r.roundNumber === study.currentRound)
        
        if (!currentRound || currentRound.status !== 'CLOSED') {
          return NextResponse.json(
            { error: 'Round must be closed before analysis' },
            { status: 400 }
          )
        }

        // Get all responses for this round
        const responses = await prisma.response.findMany({
          where: {
            roundNumber: study.currentRound,
            indicator: { studyId },
          },
          include: {
            panelist: true,
            indicator: true,
          },
        })

        // Group by indicator
        const byIndicator = responses.reduce((acc, r) => {
          if (!acc[r.indicatorId]) acc[r.indicatorId] = []
          acc[r.indicatorId].push(r)
          return acc
        }, {} as Record<string, typeof responses>)

        // Compute summaries for each indicator
        const summaries = []
        
        for (const [indicatorId, indResponses] of Object.entries(byIndicator)) {
          const priorityValues = indResponses
            .map(r => r.priorityRating)
            .filter((v): v is number => v !== null)
          
          const validityValues = indResponses
            .map(r => r.operationalizationValidity)
            .filter((v): v is number => v !== null)
          
          const feasibilityValues = indResponses
            .map(r => r.feasibilityRating)
            .filter((v): v is number => v !== null)

          const priorityStats = calculateStats(priorityValues)
          const validityStats = calculateStats(validityValues)
          const feasibilityStats = calculateStats(feasibilityValues)

          // Calculate by role
          const roles = [...new Set(indResponses.map(r => r.panelist.roleType))]
          const priorityByRole: Record<string, { mean: number; median: number }> = {}
          const validityByRole: Record<string, { mean: number; median: number }> = {}

          for (const role of roles) {
            const roleResponses = indResponses.filter(r => r.panelist.roleType === role)
            
            const rolePriority = roleResponses
              .map(r => r.priorityRating)
              .filter((v): v is number => v !== null)
            
            const roleValidity = roleResponses
              .map(r => r.operationalizationValidity)
              .filter((v): v is number => v !== null)

            if (rolePriority.length > 0) {
              const stats = calculateStats(rolePriority)
              priorityByRole[role] = { mean: stats.mean, median: stats.median }
            }

            if (roleValidity.length > 0) {
              const stats = calculateStats(roleValidity)
              validityByRole[role] = { mean: stats.mean, median: stats.median }
            }
          }

          // Count dissents
          const dissentCount = indResponses.filter(r => r.dissentFlag).length

          summaries.push({
            indicatorId,
            roundId: currentRound.id,
            roundNumber: study.currentRound,
            priorityMean: priorityStats.mean,
            priorityMedian: priorityStats.median,
            priorityStd: priorityStats.std,
            priorityIQR: priorityStats.iqr,
            priorityMin: priorityStats.min,
            priorityMax: priorityStats.max,
            validityMean: validityStats.mean,
            validityMedian: validityStats.median,
            validityStd: validityStats.std,
            validityIQR: validityStats.iqr,
            feasibilityMean: feasibilityStats.mean,
            feasibilityMedian: feasibilityStats.median,
            feasibilityStd: feasibilityStats.std,
            feasibilityIQR: feasibilityStats.iqr,
            consensusReached: checkConsensus(priorityStats.iqr, study.consensusThreshold),
            dissentCount,
            responseCount: indResponses.length,
            priorityByRole,
            validityByRole,
          })
        }

        // Save summaries
        await prisma.$transaction([
          // Delete existing summaries for this round (in case of re-run)
          prisma.roundSummary.deleteMany({
            where: { roundNumber: study.currentRound, round: { studyId } },
          }),
          // Create new summaries
          ...summaries.map(s => prisma.roundSummary.create({ data: s })),
          // Update round status
          prisma.round.update({
            where: { id: currentRound.id },
            data: { status: 'ANALYZED' },
          }),
          prisma.auditLog.create({
            data: {
              action: 'ROUND_ANALYZED',
              actorType: 'SYSTEM',
              studyId,
              metadata: { 
                roundNumber: study.currentRound,
                indicatorsAnalyzed: summaries.length,
                consensusReached: summaries.filter(s => s.consensusReached).length,
              },
            },
          }),
        ])

        return NextResponse.json({ 
          success: true, 
          message: 'Analysis complete',
          consensusCount: summaries.filter(s => s.consensusReached).length,
          totalIndicators: summaries.length,
        })
      }

      case 'START_NEXT_ROUND': {
        const currentRound = study.rounds.find(r => r.roundNumber === study.currentRound)
        const nextRound = study.rounds.find(r => r.roundNumber === study.currentRound + 1)

        if (!currentRound || currentRound.status !== 'ANALYZED') {
          return NextResponse.json(
            { error: 'Current round must be analyzed first' },
            { status: 400 }
          )
        }

        if (!nextRound) {
          return NextResponse.json(
            { error: 'No more rounds available' },
            { status: 400 }
          )
        }

        await prisma.$transaction([
          prisma.study.update({
            where: { id: studyId },
            data: { currentRound: study.currentRound + 1 },
          }),
          prisma.round.update({
            where: { id: nextRound.id },
            data: { status: 'OPEN', opensAt: new Date() },
          }),
          prisma.auditLog.create({
            data: {
              action: 'ROUND_STARTED',
              actorType: 'FACILITATOR',
              studyId,
              metadata: { roundNumber: study.currentRound + 1 },
            },
          }),
        ])

        return NextResponse.json({ 
          success: true, 
          message: `Round ${study.currentRound + 1} started` 
        })
      }

      case 'COMPLETE_STUDY': {
        const currentRound = study.rounds.find(r => r.roundNumber === study.currentRound)

        if (!currentRound || currentRound.status !== 'ANALYZED') {
          return NextResponse.json(
            { error: 'Final round must be analyzed first' },
            { status: 400 }
          )
        }

        await prisma.$transaction([
          prisma.study.update({
            where: { id: studyId },
            data: { status: 'COMPLETE' },
          }),
          prisma.auditLog.create({
            data: {
              action: 'STUDY_COMPLETED',
              actorType: 'FACILITATOR',
              studyId,
            },
          }),
        ])

        return NextResponse.json({ success: true, message: 'Study completed' })
      }

      case 'PAUSE_STUDY': {
        if (study.status !== 'ACTIVE') {
          return NextResponse.json(
            { error: 'Only active studies can be paused' },
            { status: 400 }
          )
        }

        await prisma.$transaction([
          prisma.study.update({
            where: { id: studyId },
            data: { status: 'PAUSED' },
          }),
          prisma.auditLog.create({
            data: {
              action: 'STUDY_PAUSED',
              actorType: 'FACILITATOR',
              studyId,
            },
          }),
        ])

        return NextResponse.json({ success: true, message: 'Study paused' })
      }

      case 'RESUME_STUDY': {
        if (study.status !== 'PAUSED') {
          return NextResponse.json(
            { error: 'Only paused studies can be resumed' },
            { status: 400 }
          )
        }

        await prisma.$transaction([
          prisma.study.update({
            where: { id: studyId },
            data: { status: 'ACTIVE' },
          }),
          prisma.auditLog.create({
            data: {
              action: 'STUDY_RESUMED',
              actorType: 'FACILITATOR',
              studyId,
            },
          }),
        ])

        return NextResponse.json({ success: true, message: 'Study resumed' })
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Study action error:', error)
    return NextResponse.json(
      { error: 'Action failed' },
      { status: 500 }
    )
  }
}
