import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  const cookieStore = await cookies()
  cookieStore.delete('delphi_session')

  return NextResponse.redirect(new URL('/', process.env.NEXTAUTH_URL || 'http://localhost:3000'))
}
