import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      description,
      totalRounds,
      consensusThreshold,
      indicators,
    } = body

    if (!name || !indicators || indicators.length === 0) {
      return NextResponse.json(
        { error: 'Name and indicators are required' },
        { status: 400 }
      )
    }

    // Create study with indicators in a transaction
    const study = await prisma.$transaction(async (tx) => {
      // Create study
      const newStudy = await tx.study.create({
        data: {
          name,
          description: description || null,
          totalRounds: totalRounds || 3,
          consensusThreshold: consensusThreshold || 1.0,
          status: 'SETUP',
          currentRound: 0,
        },
      })

      // Create rounds
      for (let i = 1; i <= (totalRounds || 3); i++) {
        await tx.round.create({
          data: {
            studyId: newStudy.id,
            roundNumber: i,
            status: 'PENDING',
          },
        })
      }

      // Create indicators
      for (const ind of indicators) {
        await tx.indicator.create({
          data: {
            studyId: newStudy.id,
            externalId: ind.externalId,
            category: ind.category,
            name: ind.name,
            definition: ind.definition,
            unitOfMeasure: ind.unitOfMeasure,
            operationalization: ind.operationalization,
            collectionFrequency: ind.collectionFrequency,
            originalPriority: ind.originalPriority,
            notes: ind.notes || null,
            domain: ind.domain,
          },
        })
      }

      // Log creation
      await tx.auditLog.create({
        data: {
          action: 'STUDY_CREATED',
          actorType: 'FACILITATOR',
          studyId: newStudy.id,
          metadata: {
            indicatorCount: indicators.length,
            totalRounds,
          },
        },
      })

      return newStudy
    })

    return NextResponse.json(study)

  } catch (error) {
    console.error('Study creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create study' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const studies = await prisma.study.findMany({
      include: {
        _count: {
          select: {
            indicators: true,
            panelists: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(studies)
  } catch (error) {
    console.error('Study fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch studies' },
      { status: 500 }
    )
  }
}
