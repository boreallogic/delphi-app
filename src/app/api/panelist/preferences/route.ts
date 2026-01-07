import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function POST(request: NextRequest) {
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

    const newPrefs = await request.json()

    // Get existing preferences
    const panelist = await prisma.panelist.findUnique({
      where: { id: panelistId },
    })

    const existingPrefs = (panelist?.preferences as Record<string, unknown>) || {}

    // Merge and save
    const mergedPrefs = { ...existingPrefs, ...newPrefs }

    await prisma.panelist.update({
      where: { id: panelistId },
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

    const panelist = await prisma.panelist.findUnique({
      where: { id: panelistId },
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
