import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studyId: string }> }
) {
  try {
    const { studyId } = await params

    const indicators = await prisma.indicator.findMany({
      where: { studyId },
      select: {
        id: true,
        externalId: true,
        name: true,
        definitionSimple: true,
        domainCode: true,
        domain: true,
        tier: true,
      },
      orderBy: [
        { domainCode: 'asc' },
        { externalId: 'asc' },
      ],
    })

    return NextResponse.json({ indicators })
  } catch (error) {
    console.error('Failed to fetch indicators:', error)
    return NextResponse.json(
      { error: 'Failed to fetch indicators' },
      { status: 500 }
    )
  }
}
