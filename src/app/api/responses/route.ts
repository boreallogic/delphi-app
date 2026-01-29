import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'
import { responseSchema, formatValidationErrors } from '@/lib/validation'
import { rateLimiters, checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit'
import { repositories } from '@/lib/repositories'

export async function POST(request: NextRequest) {
  try {
    // Require valid session
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to continue.' },
        { status: 401 }
      )
    }

    const panelistId = session.panelistId
    const studyId = session.studyId

    // Check rate limit (100 responses per hour per panelist)
    const rateLimitResult = await checkRateLimit(panelistId, rateLimiters.responses)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Too many responses submitted. Please try again later.',
          retryAfter: new Date(rateLimitResult.reset * 1000).toISOString(),
        },
        {
          status: 429,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      )
    }

    const body = await request.json()

    // Validate input
    const validationResult = responseSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: formatValidationErrors(validationResult.error),
        },
        { status: 400 }
      )
    }

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
    } = validationResult.data

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

    // Upsert response using repository
    const response = await repositories.response.upsertResponse({
      panelistId,
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
      revisedFromPrevious: revisedFromPrevious || false,
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

    return NextResponse.json(response, {
      headers: getRateLimitHeaders(rateLimitResult),
    })

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
    // Require valid session
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to continue.' },
        { status: 401 }
      )
    }

    const panelistId = session.panelistId

    const { searchParams } = new URL(request.url)
    const roundNumber = searchParams.get('round')

    // Use repository to fetch responses
    const responses = await repositories.response.findByPanelistAndRound(
      panelistId,
      roundNumber ? parseInt(roundNumber) : undefined
    )

    return NextResponse.json(responses)

  } catch (error) {
    console.error('Response fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch responses' },
      { status: 500 }
    )
  }
}
