import { cookies } from 'next/headers'
import { prisma } from './db'

interface Session {
  panelistId: string
  studyId: string
  email: string
  exp: number
}

export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('delphi_session')

    if (!sessionCookie?.value) {
      return null
    }

    const session = JSON.parse(
      Buffer.from(sessionCookie.value, 'base64').toString()
    ) as Session

    // Check expiry and clear cookie if expired
    if (session.exp < Date.now()) {
      cookieStore.delete('delphi_session')
      return null
    }

    return session
  } catch (error) {
    // Clear invalid cookie
    const cookieStore = await cookies()
    cookieStore.delete('delphi_session')
    return null
  }
}

export async function requireSession() {
  const session = await getSession()
  
  if (!session) {
    throw new Error('Unauthorized')
  }

  return session
}
