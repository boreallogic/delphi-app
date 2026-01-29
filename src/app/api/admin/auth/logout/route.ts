import { NextResponse } from 'next/server'
import { clearFacilitatorSession } from '@/lib/facilitator-session'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    await clearFacilitatorSession()

    return NextResponse.json({ message: 'Logged out successfully' })
  } catch (error) {
    console.error('Facilitator logout error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
