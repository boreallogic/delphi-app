import { Panelist, Prisma } from '@prisma/client'
import { BaseRepository } from './base-repository'
import { PrismaClient } from '@prisma/client'

/**
 * Repository for Panelist entity
 *
 * Handles all database operations related to study panelists,
 * including authentication token management.
 */
export class PanelistRepository extends BaseRepository<Panelist> {
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  async findById(id: string): Promise<Panelist | null> {
    return this.prisma.panelist.findUnique({
      where: { id },
      include: {
        study: true,
      },
    })
  }

  async findMany(where?: Prisma.PanelistWhereInput): Promise<Panelist[]> {
    return this.prisma.panelist.findMany({
      where,
      include: {
        study: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async create(data: Prisma.PanelistCreateInput): Promise<Panelist> {
    return this.prisma.panelist.create({
      data,
      include: {
        study: true,
      },
    })
  }

  async update(id: string, data: Prisma.PanelistUpdateInput): Promise<Panelist> {
    return this.prisma.panelist.update({
      where: { id },
      data,
      include: {
        study: true,
      },
    })
  }

  async delete(id: string): Promise<void> {
    await this.prisma.panelist.delete({
      where: { id },
    })
  }

  async count(where?: Prisma.PanelistWhereInput): Promise<number> {
    return this.prisma.panelist.count({ where })
  }

  /**
   * Find panelist by email
   */
  async findByEmail(email: string): Promise<Panelist | null> {
    return this.prisma.panelist.findFirst({
      where: { email: email.toLowerCase().trim() },
      include: {
        study: {
          include: {
            rounds: {
              orderBy: { roundNumber: 'asc' },
            },
          },
        },
      },
    })
  }

  /**
   * Find panelist by magic token
   */
  async findByToken(token: string): Promise<Panelist | null> {
    return this.prisma.panelist.findFirst({
      where: {
        magicToken: token,
        magicTokenExpiry: {
          gt: new Date(),
        },
      },
      include: {
        study: {
          include: {
            rounds: {
              orderBy: { roundNumber: 'asc' },
            },
          },
        },
      },
    })
  }

  /**
   * Set magic token for panelist
   */
  async setMagicToken(
    id: string,
    token: string,
    expiry: Date
  ): Promise<Panelist> {
    return this.prisma.panelist.update({
      where: { id },
      data: {
        magicToken: token,
        magicTokenExpiry: expiry,
      },
    })
  }

  /**
   * Clear magic token after use
   */
  async clearMagicToken(id: string): Promise<Panelist> {
    return this.prisma.panelist.update({
      where: { id },
      data: {
        magicToken: null,
        magicTokenExpiry: null,
      },
    })
  }

  /**
   * Get panelists by study
   */
  async findByStudy(studyId: string): Promise<Panelist[]> {
    return this.prisma.panelist.findMany({
      where: { studyId },
      orderBy: { createdAt: 'asc' },
    })
  }

  /**
   * Get panelist with response statistics
   */
  async getWithStats(id: string) {
    const panelist = await this.findById(id)
    if (!panelist) return null

    const [totalResponses, completedResponses, dissentCount] = await Promise.all([
      this.prisma.response.count({
        where: { panelistId: id },
      }),
      this.prisma.response.count({
        where: {
          panelistId: id,
          priorityRating: { not: null },
        },
      }),
      this.prisma.response.count({
        where: {
          panelistId: id,
          dissentFlag: true,
        },
      }),
    ])

    return {
      ...panelist,
      stats: {
        totalResponses,
        completedResponses,
        dissentCount,
      },
    }
  }

  /**
   * Update preferences
   */
  async updatePreferences(
    id: string,
    preferences: {
      plainLanguage?: boolean
      highContrast?: boolean
      fontSize?: string
    }
  ): Promise<Panelist> {
    // Get current panelist to merge preferences
    const panelist = await this.findById(id)
    if (!panelist) throw new Error('Panelist not found')

    const currentPrefs = (panelist.preferences as any) || {}
    const newPrefs = {
      ...currentPrefs,
      ...preferences,
    }

    return this.prisma.panelist.update({
      where: { id },
      data: {
        preferences: newPrefs,
      },
    })
  }
}
