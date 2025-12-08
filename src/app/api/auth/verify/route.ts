import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    // Find panelist with this token
    const panelist = await prisma.panelist.findUnique({
      where: { magicToken: token },
      include: { study: true },
    })

    if (!panelist) {
      return NextResponse.json(
        { error: 'Invalid or expired link' },
        { status: 401 }
      )
    }

    // Check token expiry
    if (panelist.magicTokenExpiry && panelist.magicTokenExpiry < new Date()) {
      return NextResponse.json(
        { error: 'This link has expired. Please request a new one.' },
        { status: 401 }
      )
    }

    // Clear the magic token (one-time use)
    await prisma.panelist.update({
      where: { id: panelist.id },
      data: {
        magicToken: null,
        magicTokenExpiry: null,
        lastLoginAt: new Date(),
      },
    })

    // Create session cookie
    // In production, use a proper session token with JWT or similar
    const sessionToken = Buffer.from(JSON.stringify({
      panelistId: panelist.id,
      studyId: panelist.studyId,
      email: panelist.email,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    })).toString('base64')

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set('delphi_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: 'PANELIST_LOGIN',
        actorType: 'PANELIST',
        actorId: panelist.id,
        studyId: panelist.studyId,
      },
    })

    return NextResponse.json({
      success: true,
      studyId: panelist.studyId,
      panelistId: panelist.id,
    })

  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
