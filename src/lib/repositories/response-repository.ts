import { Response, Prisma } from '@prisma/client'
import { BaseRepository } from './base-repository'
import { PrismaClient } from '@prisma/client'

/**
 * Repository for Response entity
 *
 * Handles all database operations related to panelist responses,
 * including CRUD operations and specialized queries for analysis.
 */
export class ResponseRepository extends BaseRepository<Response> {
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  async findById(id: string): Promise<Response | null> {
    return this.prisma.response.findUnique({
      where: { id },
      include: {
        indicator: true,
        panelist: true,
      },
    })
  }

  async findMany(where?: Prisma.ResponseWhereInput): Promise<Response[]> {
    return this.prisma.response.findMany({
      where,
      include: {
        indicator: true,
        panelist: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async create(data: Prisma.ResponseCreateInput): Promise<Response> {
    return this.prisma.response.create({
      data,
      include: {
        indicator: true,
        panelist: true,
      },
    })
  }

  async update(id: string, data: Prisma.ResponseUpdateInput): Promise<Response> {
    return this.prisma.response.update({
      where: { id },
      data,
      include: {
        indicator: true,
        panelist: true,
      },
    })
  }

  async delete(id: string): Promise<void> {
    await this.prisma.response.delete({
      where: { id },
    })
  }

  async count(where?: Prisma.ResponseWhereInput): Promise<number> {
    return this.prisma.response.count({ where })
  }

  /**
   * Find responses by panelist and round
   */
  async findByPanelistAndRound(
    panelistId: string,
    roundNumber?: number
  ): Promise<Response[]> {
    return this.prisma.response.findMany({
      where: {
        panelistId,
        ...(roundNumber ? { roundNumber } : {}),
      },
      include: {
        indicator: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Upsert response (create or update based on unique constraint)
   */
  async upsertResponse(data: {
    panelistId: string
    indicatorId: string
    roundNumber: number
    priorityRating?: number | null
    operationalizationValidity?: number | null
    feasibilityRating?: number | null
    qualitativeReasoning?: string | null
    thresholdSuggestion?: string | null
    weightSuggestion?: number | null
    generalComments?: string | null
    dissentFlag?: boolean
    dissentReason?: string | null
    revisedFromPrevious?: boolean
  }): Promise<Response> {
    const { panelistId, indicatorId, roundNumber, ...updateData } = data

    return this.prisma.response.upsert({
      where: {
        panelistId_indicatorId_roundNumber: {
          panelistId,
          indicatorId,
          roundNumber,
        },
      },
      update: {
        ...updateData,
        updatedAt: new Date(),
      },
      create: {
        panelistId,
        indicatorId,
        roundNumber,
        ...updateData,
      },
      include: {
        indicator: true,
        panelist: true,
      },
    })
  }

  /**
   * Get responses for analysis (specific round and study)
   */
  async getResponsesForAnalysis(
    studyId: string,
    roundNumber: number
  ): Promise<
    Array<
      Response & {
        panelist: { id: string; primaryRole: string }
        indicator: { id: string; externalId: string; name: string; studyId: string }
      }
    >
  > {
    return this.prisma.response.findMany({
      where: {
        indicator: { studyId },
        roundNumber,
      },
      include: {
        panelist: {
          select: {
            id: true,
            primaryRole: true,
          },
        },
        indicator: {
          select: {
            id: true,
            externalId: true,
            name: true,
            studyId: true,
          },
        },
      },
    }) as any
  }

  /**
   * Get response completion statistics for a study round
   */
  async getCompletionStats(
    studyId: string,
    roundNumber: number
  ): Promise<{
    total: number
    completed: number
    percentage: number
  }> {
    const [totalPanelists, completedResponses] = await Promise.all([
      this.prisma.panelist.count({ where: { studyId } }),
      this.prisma.response.count({
        where: {
          indicator: { studyId },
          roundNumber,
          priorityRating: { not: null },
        },
      }),
    ])

    const totalIndicators = await this.prisma.indicator.count({
      where: { studyId },
    })

    const totalExpected = totalPanelists * totalIndicators
    const percentage = totalExpected > 0 ? (completedResponses / totalExpected) * 100 : 0

    return {
      total: totalExpected,
      completed: completedResponses,
      percentage: Math.round(percentage * 100) / 100,
    }
  }

  /**
   * Get dissent count for indicators in a round
   */
  async getDissentCounts(
    studyId: string,
    roundNumber: number
  ): Promise<Record<string, number>> {
    const responses = await this.prisma.response.findMany({
      where: {
        indicator: { studyId },
        roundNumber,
        dissentFlag: true,
      },
      select: {
        indicatorId: true,
      },
    })

    return responses.reduce(
      (acc, r) => {
        acc[r.indicatorId] = (acc[r.indicatorId] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )
  }
}
