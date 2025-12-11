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

    const newPrefs = await request.json()

    // Get existing preferences
    const panelist = await prisma.panelist.findUnique({
      where: { id: session.panelistId },
    })

    const existingPrefs = (panelist?.preferences as Record<string, unknown>) || {}

    // Merge and save
    const mergedPrefs = { ...existingPrefs, ...newPrefs }

    await prisma.panelist.update({
      where: { id: session.panelistId },
      data: {
        preferences: mergedPrefs,
      },
    })

    return NextResponse.json({ success: true, preferences: mergedPrefs })

  } catch (error) {
    console.error('Preferences update error:', error)
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const panelist = await prisma.panelist.findUnique({
      where: { id: session.panelistId },
      select: { preferences: true },
    })

    return NextResponse.json(panelist?.preferences || {})

  } catch (error) {
    console.error('Preferences fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    )
  }
}
