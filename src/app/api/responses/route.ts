import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    // TEMPORARY: Try session first, fall back to first panelist for testing
    let session = await getSession()
    let panelistId: string
    let studyId: string

    if (!session) {
      // AUTH BYPASS: Use first available panelist for testing
      const panelist = await prisma.panelist.findFirst({
        include: { study: true }
      })

      if (!panelist) {
        return NextResponse.json(
          { error: 'No panelists found in database' },
          { status: 404 }
        )
      }

      panelistId = panelist.id
      studyId = panelist.studyId
      console.log('⚠️ AUTH BYPASSED: Using panelist', panelist.email)
    } else {
      panelistId = session.panelistId
      studyId = session.studyId
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
      generalComments,
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
        studyId: studyId,
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
          panelistId: panelistId,
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
        generalComments,
        dissentFlag: dissentFlag || false,
        dissentReason,
        revisedFromPrevious: revisedFromPrevious || false,
        updatedAt: new Date(),
      },
      create: {
        panelistId: panelistId,
        indicatorId,
        roundNumber,
        priorityRating,
        operationalizationValidity,
        feasibilityRating,
        qualitativeReasoning,
        thresholdSuggestion,
        weightSuggestion,
        generalComments,
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
        actorId: panelistId,
        studyId: studyId,
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
    // TEMPORARY: Try session first, fall back to first panelist for testing
    let session = await getSession()
    let panelistId: string

    if (!session) {
      // AUTH BYPASS: Use first available panelist for testing
      const panelist = await prisma.panelist.findFirst()

      if (!panelist) {
        return NextResponse.json(
          { error: 'No panelists found in database' },
          { status: 404 }
        )
      }

      panelistId = panelist.id
      console.log('⚠️ AUTH BYPASSED: Using panelist', panelist.email)
    } else {
      panelistId = session.panelistId
    }

    const { searchParams } = new URL(request.url)
    const roundNumber = searchParams.get('round')

    const responses = await prisma.response.findMany({
      where: {
        panelistId: panelistId,
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
