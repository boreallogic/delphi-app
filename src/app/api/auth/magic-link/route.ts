import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendMagicLinkEmail } from '@/lib/email'
import { generateMagicToken } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Find panelist by email (across all studies)
    const panelist = await prisma.panelist.findFirst({
      where: { 
        email: email.toLowerCase().trim() 
      },
      include: {
        study: true,
      },
    })

    if (!panelist) {
      // Don't reveal whether email exists for security
      // But still return success to prevent email enumeration
      return NextResponse.json({
        message: 'If you are a registered panelist, you will receive an email shortly.',
      })
    }

    // Generate magic token
    const token = generateMagicToken()
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Update panelist with token
    await prisma.panelist.update({
      where: { id: panelist.id },
      data: {
        magicToken: token,
        magicTokenExpiry: expiry,
      },
    })

    // Build magic link URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const magicLink = `${baseUrl}/auth/verify?token=${token}`

    // Send email
    const { success, previewUrl } = await sendMagicLinkEmail({
      to: panelist.email,
      name: panelist.name || undefined,
      studyName: panelist.study.name,
      magicLink,
    })

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to send email. Please try again.' },
        { status: 500 }
      )
    }

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: 'MAGIC_LINK_SENT',
        actorType: 'SYSTEM',
        actorId: panelist.id,
        studyId: panelist.studyId,
        metadata: { email: panelist.email },
      },
    })

    return NextResponse.json({
      message: 'Login link sent successfully',
      // Include preview URL in development
      ...(process.env.NODE_ENV !== 'production' && previewUrl ? { previewUrl } : {}),
    })

  } catch (error) {
    console.error('Magic link error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
