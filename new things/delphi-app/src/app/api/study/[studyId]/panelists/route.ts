import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

interface RouteParams {
  params: Promise<{ studyId: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { studyId } = await params
    const { email, name, roleType } = await request.json()

    if (!email || !roleType) {
      return NextResponse.json(
        { error: 'Email and role type are required' },
        { status: 400 }
      )
    }

    // Verify study exists
    const study = await prisma.study.findUnique({
      where: { id: studyId },
    })

    if (!study) {
      return NextResponse.json(
        { error: 'Study not found' },
        { status: 404 }
      )
    }

    // Check if panelist already exists in this study
    const existing = await prisma.panelist.findFirst({
      where: {
        studyId,
        email: email.toLowerCase().trim(),
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'This email is already a panelist in this study' },
        { status: 400 }
      )
    }

    // Create panelist
    const panelist = await prisma.panelist.create({
      data: {
        studyId,
        email: email.toLowerCase().trim(),
        name: name || null,
        roleType,
      },
    })

    // Log action
    await prisma.auditLog.create({
      data: {
        action: 'PANELIST_ADDED',
        actorType: 'FACILITATOR',
        studyId,
        metadata: {
          panelistId: panelist.id,
          email: panelist.email,
          roleType,
        },
      },
    })

    return NextResponse.json(panelist)

  } catch (error) {
    console.error('Add panelist error:', error)
    return NextResponse.json(
      { error: 'Failed to add panelist' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { studyId } = await params

    const panelists = await prisma.panelist.findMany({
      where: { studyId },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(panelists)

  } catch (error) {
    console.error('Fetch panelists error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch panelists' },
      { status: 500 }
    )
  }
}
