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

    // Check expiry
    if (session.exp < Date.now()) {
      return null
    }

    return session
  } catch {
    return null
  }
}

export async function getPanelist() {
  const session = await getSession()
  
  if (!session) {
    return null
  }

  const panelist = await prisma.panelist.findUnique({
    where: { id: session.panelistId },
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

  return panelist
}

export async function requireSession() {
  const session = await getSession()
  
  if (!session) {
    throw new Error('Unauthorized')
  }

  return session
}
