import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { prisma } from './db'

interface FacilitatorSession {
  facilitatorId: string
  email: string
  exp: number
}

const SESSION_COOKIE_NAME = 'facilitator_session'
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days

/**
 * Get facilitator session from cookie
 */
export async function getFacilitatorSession(): Promise<FacilitatorSession | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)

    if (!sessionCookie?.value) {
      return null
    }

    const session = JSON.parse(
      Buffer.from(sessionCookie.value, 'base64').toString()
    ) as FacilitatorSession

    // Check expiry and clear cookie if expired
    if (session.exp < Date.now()) {
      cookieStore.delete(SESSION_COOKIE_NAME)
      return null
    }

    return session
  } catch (error) {
    // Clear invalid cookie
    const cookieStore = await cookies()
    cookieStore.delete(SESSION_COOKIE_NAME)
    return null
  }
}

/**
 * Create facilitator session
 */
export async function createFacilitatorSession(facilitatorId: string, email: string): Promise<void> {
  const session: FacilitatorSession = {
    facilitatorId,
    email,
    exp: Date.now() + SESSION_DURATION,
  }

  const sessionValue = Buffer.from(JSON.stringify(session)).toString('base64')

  const cookieStore = await cookies()
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: sessionValue,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000, // Convert to seconds
    path: '/',
  })
}

/**
 * Clear facilitator session
 */
export async function clearFacilitatorSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

/**
 * Require facilitator session (throws if not authenticated)
 */
export async function requireFacilitatorSession(): Promise<FacilitatorSession> {
  const session = await getFacilitatorSession()

  if (!session) {
    throw new Error('Unauthorized: Facilitator authentication required')
  }

  return session
}

/**
 * Verify facilitator credentials
 */
export async function verifyFacilitatorCredentials(
  email: string,
  password: string
): Promise<{ success: boolean; facilitatorId?: string; error?: string }> {
  try {
    const facilitator = await prisma.facilitator.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (!facilitator) {
      // Don't reveal whether email exists
      return { success: false, error: 'Invalid email or password' }
    }

    const isValid = await bcrypt.compare(password, facilitator.passwordHash)

    if (!isValid) {
      return { success: false, error: 'Invalid email or password' }
    }

    return { success: true, facilitatorId: facilitator.id }
  } catch (error) {
    console.error('Facilitator authentication error:', error)
    return { success: false, error: 'Authentication failed' }
  }
}

/**
 * Create facilitator account (for admin setup)
 */
export async function createFacilitatorAccount(
  email: string,
  password: string,
  name?: string
): Promise<{ success: boolean; facilitatorId?: string; error?: string }> {
  try {
    // Check if email already exists
    const existing = await prisma.facilitator.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (existing) {
      return { success: false, error: 'Email already registered' }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create facilitator
    const facilitator = await prisma.facilitator.create({
      data: {
        email: email.toLowerCase().trim(),
        name,
        passwordHash,
      },
    })

    return { success: true, facilitatorId: facilitator.id }
  } catch (error) {
    console.error('Facilitator account creation error:', error)
    return { success: false, error: 'Failed to create account' }
  }
}
