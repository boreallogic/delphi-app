import { PrismaClient } from '@prisma/client'

/**
 * Base repository class providing common database operations
 *
 * This abstract class provides a foundation for entity-specific repositories,
 * ensuring consistent patterns for CRUD operations across the application.
 */
export abstract class BaseRepository<T> {
  constructor(protected prisma: PrismaClient) {}

  /**
   * Find entity by ID
   */
  abstract findById(id: string): Promise<T | null>

  /**
   * Find multiple entities
   */
  abstract findMany(where?: any): Promise<T[]>

  /**
   * Create new entity
   */
  abstract create(data: any): Promise<T>

  /**
   * Update entity by ID
   */
  abstract update(id: string, data: any): Promise<T>

  /**
   * Delete entity by ID
   */
  abstract delete(id: string): Promise<void>

  /**
   * Count entities matching criteria
   */
  abstract count(where?: any): Promise<number>
}
