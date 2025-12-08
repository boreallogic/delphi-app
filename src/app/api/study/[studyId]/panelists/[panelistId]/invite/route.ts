import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendMagicLinkEmail } from '@/lib/email'
import { generateMagicToken } from '@/lib/utils'

interface RouteParams {
  params: Promise<{ studyId: string; panelistId: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { studyId, panelistId } = await params

    // Get panelist with study
    const panelist = await prisma.panelist.findFirst({
      where: {
        id: panelistId,
        studyId,
      },
      include: {
        study: true,
      },
    })

    if (!panelist) {
      return NextResponse.json(
        { error: 'Panelist not found' },
        { status: 404 }
      )
    }

    // Generate magic token
    const token = generateMagicToken()
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Update panelist with token
    await prisma.panelist.update({
      where: { id: panelistId },
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
        { error: 'Failed to send email' },
        { status: 500 }
      )
    }

    // Log action
    await prisma.auditLog.create({
      data: {
        action: 'INVITE_SENT',
        actorType: 'FACILITATOR',
        actorId: panelistId,
        studyId,
        metadata: {
          email: panelist.email,
        },
      },
    })

    return NextResponse.json({ 
      success: true,
      // Include preview URL in development
      ...(process.env.NODE_ENV !== 'production' && previewUrl ? { previewUrl } : {}),
    })

  } catch (error) {
    console.error('Send invite error:', error)
    return NextResponse.json(
      { error: 'Failed to send invite' },
      { status: 500 }
    )
  }
}
