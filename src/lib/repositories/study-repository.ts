import { Study, Prisma } from '@prisma/client'
import { BaseRepository } from './base-repository'
import { PrismaClient } from '@prisma/client'

/**
 * Repository for Study entity
 *
 * Handles all database operations related to Delphi studies,
 * including CRUD operations and study lifecycle management.
 */
export class StudyRepository extends BaseRepository<Study> {
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  async findById(id: string): Promise<Study | null> {
    return this.prisma.study.findUnique({
      where: { id },
      include: {
        indicators: true,
        panelists: true,
        rounds: {
          orderBy: { roundNumber: 'asc' },
        },
      },
    })
  }

  async findMany(where?: Prisma.StudyWhereInput): Promise<Study[]> {
    return this.prisma.study.findMany({
      where,
      include: {
        _count: {
          select: {
            indicators: true,
            panelists: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async create(data: Prisma.StudyCreateInput): Promise<Study> {
    return this.prisma.study.create({
      data,
      include: {
        indicators: true,
        panelists: true,
        rounds: true,
      },
    })
  }

  async update(id: string, data: Prisma.StudyUpdateInput): Promise<Study> {
    return this.prisma.study.update({
      where: { id },
      data,
      include: {
        indicators: true,
        panelists: true,
        rounds: true,
      },
    })
  }

  async delete(id: string): Promise<void> {
    await this.prisma.study.delete({
      where: { id },
    })
  }

  async count(where?: Prisma.StudyWhereInput): Promise<number> {
    return this.prisma.study.count({ where })
  }

  /**
   * Get study with full details (indicators, panelists, rounds, summaries)
   */
  async getFullStudy(id: string) {
    return this.prisma.study.findUnique({
      where: { id },
      include: {
        indicators: {
          orderBy: { externalId: 'asc' },
        },
        panelists: {
          orderBy: { createdAt: 'asc' },
        },
        rounds: {
          orderBy: { roundNumber: 'asc' },
          include: {
            summaries: {
              include: {
                indicator: true,
              },
            },
          },
        },
      },
    })
  }

  /**
   * Get current round for study
   */
  async getCurrentRound(id: string) {
    const study = await this.prisma.study.findUnique({
      where: { id },
      include: {
        rounds: {
          where: { status: 'OPEN' },
          take: 1,
        },
      },
    })

    return study?.rounds[0] || null
  }

  /**
   * Update study status
   */
  async updateStatus(
    id: string,
    status: 'SETUP' | 'ACTIVE' | 'PAUSED' | 'COMPLETE'
  ): Promise<Study> {
    return this.prisma.study.update({
      where: { id },
      data: { status },
    })
  }

  /**
   * Advance to next round
   */
  async advanceRound(id: string): Promise<Study> {
    const study = await this.findById(id)
    if (!study) throw new Error('Study not found')

    return this.prisma.study.update({
      where: { id },
      data: {
        currentRound: study.currentRound + 1,
      },
    })
  }

  /**
   * Get study statistics
   */
  async getStatistics(id: string) {
    const [
      study,
      indicatorCount,
      panelistCount,
      responseCount,
      consensusCount,
    ] = await Promise.all([
      this.findById(id),
      this.prisma.indicator.count({ where: { studyId: id } }),
      this.prisma.panelist.count({ where: { studyId: id } }),
      this.prisma.response.count({
        where: { indicator: { studyId: id } },
      }),
      this.prisma.roundSummary.count({
        where: {
          indicator: { studyId: id },
          consensusReached: true,
        },
      }),
    ])

    return {
      study,
      indicators: indicatorCount,
      panelists: panelistCount,
      responses: responseCount,
      consensus: consensusCount,
      consensusPercentage:
        indicatorCount > 0
          ? Math.round((consensusCount / indicatorCount) * 100)
          : 0,
    }
  }

  /**
   * Create study with rounds in transaction
   * Note: Indicators should be created separately as they have many fields
   */
  async createStudyWithRounds(data: {
    name: string
    description?: string
    totalRounds: number
    consensusThreshold: number
    allowDissentFlags?: boolean
  }) {
    return this.prisma.$transaction(async (tx) => {
      // Create study
      const study = await tx.study.create({
        data: {
          name: data.name,
          description: data.description,
          totalRounds: data.totalRounds,
          consensusThreshold: data.consensusThreshold,
          allowDissentFlags: data.allowDissentFlags ?? true,
          status: 'SETUP',
          currentRound: 1,
        },
      })

      // Create rounds
      const rounds = Array.from({ length: data.totalRounds }, (_, i) => ({
        studyId: study.id,
        roundNumber: i + 1,
        status: 'PENDING' as const,
      }))

      await tx.round.createMany({
        data: rounds,
      })

      // Log action
      await tx.auditLog.create({
        data: {
          action: 'STUDY_CREATED',
          actorType: 'FACILITATOR',
          studyId: study.id,
          metadata: {
            totalRounds: data.totalRounds,
          },
        },
      })

      return study
    })
  }
}
