import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      indicatorId,
      roundNumber,
      priorityRating,
      operationalizationValidity,
      feasibilityRating,
      qualitativeReasoning,
      thresholdSuggestion,
      weightSuggestion,
      dissentFlag,
      dissentReason,
      revisedFromPrevious,
    } = body

    if (!indicatorId || !roundNumber) {
      return NextResponse.json(
        { error: 'indicatorId and roundNumber are required' },
        { status: 400 }
      )
    }

    // Verify indicator belongs to panelist's study
    const indicator = await prisma.indicator.findFirst({
      where: {
        id: indicatorId,
        studyId: session.studyId,
      },
    })

    if (!indicator) {
      return NextResponse.json(
        { error: 'Indicator not found' },
        { status: 404 }
      )
    }

    // Upsert response
    const response = await prisma.response.upsert({
      where: {
        panelistId_indicatorId_roundNumber: {
          panelistId: session.panelistId,
          indicatorId,
          roundNumber,
        },
      },
      update: {
        priorityRating,
        operationalizationValidity,
        feasibilityRating,
        qualitativeReasoning,
        thresholdSuggestion,
        weightSuggestion,
        dissentFlag: dissentFlag || false,
        dissentReason,
        revisedFromPrevious: revisedFromPrevious || false,
        updatedAt: new Date(),
      },
      create: {
        panelistId: session.panelistId,
        indicatorId,
        roundNumber,
        priorityRating,
        operationalizationValidity,
        feasibilityRating,
        qualitativeReasoning,
        thresholdSuggestion,
        weightSuggestion,
        dissentFlag: dissentFlag || false,
        dissentReason,
        revisedFromPrevious: false,
      },
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: 'RESPONSE_SAVED',
        actorType: 'PANELIST',
        actorId: session.panelistId,
        studyId: session.studyId,
        metadata: {
          indicatorId,
          roundNumber,
          hasRatings: !!(priorityRating && operationalizationValidity && feasibilityRating),
          hasDissent: dissentFlag,
        },
      },
    })

    return NextResponse.json(response)

  } catch (error) {
    console.error('Response save error:', error)
    return NextResponse.json(
      { error: 'Failed to save response' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const roundNumber = searchParams.get('round')

    const responses = await prisma.response.findMany({
      where: {
        panelistId: session.panelistId,
        ...(roundNumber ? { roundNumber: parseInt(roundNumber) } : {}),
      },
      include: {
        indicator: true,
      },
    })

    return NextResponse.json(responses)

  } catch (error) {
    console.error('Response fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch responses' },
      { status: 500 }
    )
  }
}
