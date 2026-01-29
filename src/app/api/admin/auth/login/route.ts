import { NextRequest, NextResponse } from 'next/server'
import { verifyFacilitatorCredentials, createFacilitatorSession } from '@/lib/facilitator-session'
import { rateLimiters, checkRateLimit, getRateLimitHeaders, getClientIdentifier } from '@/lib/rate-limit'
import { z } from 'zod'
import { formatValidationErrors } from '@/lib/validation'

export const dynamic = 'force-dynamic'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP address (5 attempts per 15 minutes)
    const clientId = getClientIdentifier(request)
    const rateLimitResult = await checkRateLimit(`facilitator-login:${clientId}`, rateLimiters.magicLink)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Too many login attempts. Please try again later.',
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
    const validationResult = loginSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: formatValidationErrors(validationResult.error),
        },
        { status: 400 }
      )
    }

    const { email, password } = validationResult.data

    // Verify credentials
    const result = await verifyFacilitatorCredentials(email, password)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Authentication failed' },
        {
          status: 401,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      )
    }

    // Create session
    await createFacilitatorSession(result.facilitatorId!, email)

    return NextResponse.json(
      { message: 'Login successful' },
      {
        headers: getRateLimitHeaders(rateLimitResult),
      }
    )
  } catch (error) {
    console.error('Facilitator login error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
