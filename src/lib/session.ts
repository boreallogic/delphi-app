import { cookies } from 'next/headers'
import { prisma } from './db'

export async function getSession() {
  // DEV MODE: Skip auth - return first panelist for testing
  // TODO: Implement proper session management
  if (process.env.NODE_ENV === 'development') {
    const panelist = await prisma.panelist.findFirst({
      include: { study: true }
    })

    if (panelist) {
      return {
        panelistId: panelist.id,
        studyId: panelist.studyId,
        panelist,
        study: panelist.study
      }
    }
  }

  // In production, check for session cookie
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('delphi_session')

  if (!sessionCookie?.value) return null

  // TODO: Implement proper session verification
  return null
}
