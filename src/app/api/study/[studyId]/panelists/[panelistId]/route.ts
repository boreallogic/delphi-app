import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

interface RouteParams {
  params: Promise<{ studyId: string; panelistId: string }>
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { studyId, panelistId } = await params

    // Verify panelist exists and belongs to study
    const panelist = await prisma.panelist.findFirst({
      where: {
        id: panelistId,
        studyId,
      },
    })

    if (!panelist) {
      return NextResponse.json(
        { error: 'Panelist not found' },
        { status: 404 }
      )
    }

    // Delete panelist (cascade will delete responses)
    await prisma.panelist.delete({
      where: { id: panelistId },
    })

    // Log action
    await prisma.auditLog.create({
      data: {
        action: 'PANELIST_REMOVED',
        actorType: 'FACILITATOR',
        studyId,
        metadata: {
          panelistId,
          email: panelist.email,
        },
      },
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Delete panelist error:', error)
    return NextResponse.json(
      { error: 'Failed to remove panelist' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { studyId, panelistId } = await params
    const body = await request.json()

    // Verify panelist exists and belongs to study
    const panelist = await prisma.panelist.findFirst({
      where: {
        id: panelistId,
        studyId,
      },
    })

    if (!panelist) {
      return NextResponse.json(
        { error: 'Panelist not found' },
        { status: 404 }
      )
    }

    // Update allowed fields
    const updateData: Record<string, unknown> = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.primaryRole !== undefined) updateData.primaryRole = body.primaryRole
    if (body.secondaryRole !== undefined) updateData.secondaryRole = body.secondaryRole
    if (body.expertiseArea !== undefined) updateData.expertiseArea = body.expertiseArea
    if (body.jurisdictionContext !== undefined) updateData.jurisdictionContext = body.jurisdictionContext
    if (body.preferences !== undefined) updateData.preferences = body.preferences

    const updated = await prisma.panelist.update({
      where: { id: panelistId },
      data: updateData,
    })

    return NextResponse.json(updated)

  } catch (error) {
    console.error('Update panelist error:', error)
    return NextResponse.json(
      { error: 'Failed to update panelist' },
      { status: 500 }
    )
  }
}
