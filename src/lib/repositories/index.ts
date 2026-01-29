import { prisma } from '../db'
import { ResponseRepository } from './response-repository'
import { StudyRepository } from './study-repository'
import { PanelistRepository } from './panelist-repository'

/**
 * Repository instances
 *
 * Centralized access to all repository instances.
 * Use these throughout the application for database operations.
 */
export const repositories = {
  response: new ResponseRepository(prisma),
  study: new StudyRepository(prisma),
  panelist: new PanelistRepository(prisma),
}

// Re-export repository classes for testing
export { ResponseRepository } from './response-repository'
export { StudyRepository } from './study-repository'
export { PanelistRepository } from './panelist-repository'
export { BaseRepository } from './base-repository'
