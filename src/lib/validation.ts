import { z } from 'zod'

/**
 * Validation schemas for API endpoints
 * Uses Zod for runtime type checking and validation
 */

// Response submission validation
export const responseSchema = z.object({
  indicatorId: z.string().uuid('Invalid indicator ID'),
  roundNumber: z.number().int().positive('Round number must be positive'),

  // Rating fields: 1-3 scale or null for "Unsure"
  priorityRating: z.number().int().min(1).max(3).nullable().optional(),
  operationalizationValidity: z.number().int().min(1).max(3).nullable().optional(),
  feasibilityRating: z.number().int().min(1).max(3).nullable().optional(),

  // Qualitative fields with length limits
  qualitativeReasoning: z.string().max(2000, 'Reasoning must be under 2000 characters').optional(),
  thresholdSuggestion: z.string().max(1000, 'Threshold suggestion must be under 1000 characters').optional(),
  weightSuggestion: z.number().min(0).max(100, 'Weight must be between 0 and 100').nullable().optional(),
  generalComments: z.string().max(2000, 'General comments must be under 2000 characters').optional(),

  // Dissent tracking
  dissentFlag: z.boolean().default(false),
  dissentReason: z.string().max(1000, 'Dissent reason must be under 1000 characters').optional(),

  // Revision tracking
  revisedFromPrevious: z.boolean().default(false),
})

// Study creation validation
export const studySchema = z.object({
  name: z.string().min(1, 'Study name is required').max(200, 'Study name must be under 200 characters'),
  description: z.string().max(2000, 'Description must be under 2000 characters').optional(),
  totalRounds: z.number().int().min(1, 'Must have at least 1 round').max(10, 'Maximum 10 rounds allowed'),
  consensusThreshold: z.number().min(0, 'Threshold must be positive').max(5, 'Threshold too high'),
  allowDissentFlags: z.boolean().default(true),
})

// Panelist creation validation
export const panelistSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required').max(200, 'Name must be under 200 characters'),
  role: z.enum([
    'EXPERT_GBV',
    'LIVED_EXPERIENCE',
    'SERVICE_PROVIDER',
    'POLICY_MAKER',
    'COMMUNITY_MEMBER',
    'MEDICAL_PROFESSIONAL',
  ], {
    message: 'Invalid panelist role'
  }),
  jurisdiction: z.enum(['LARGE', 'SMALL', 'BOTH']).optional(),
})

// Magic link request validation
export const magicLinkSchema = z.object({
  email: z.string().email('Invalid email address'),
})

// Token verification validation
export const verifyTokenSchema = z.object({
  token: z.string().length(64, 'Invalid token format'),
})

// Study action validation
export const studyActionSchema = z.object({
  action: z.enum([
    'START_ROUND_1',
    'CLOSE_ROUND',
    'ANALYZE_ROUND',
    'START_NEXT_ROUND',
    'COMPLETE_STUDY',
    'PAUSE_STUDY',
    'RESUME_STUDY',
  ], {
    message: 'Invalid action'
  }),
  roundNumber: z.number().int().positive().optional(),
})

// Panelist preferences validation
export const preferencesSchema = z.object({
  plainLanguageEnabled: z.boolean().default(true),
  highContrast: z.boolean().default(false),
  fontSize: z.enum(['small', 'medium', 'large']).default('medium'),
})

// Helper function to format Zod errors for API responses
export function formatValidationErrors(error: z.ZodError): { field: string; message: string }[] {
  return error.issues.map(err => ({
    field: err.path.join('.'),
    message: err.message,
  }))
}

// Type exports for TypeScript
export type ResponseInput = z.infer<typeof responseSchema>
export type StudyInput = z.infer<typeof studySchema>
export type PanelistInput = z.infer<typeof panelistSchema>
export type MagicLinkInput = z.infer<typeof magicLinkSchema>
export type VerifyTokenInput = z.infer<typeof verifyTokenSchema>
export type StudyActionInput = z.infer<typeof studyActionSchema>
export type PreferencesInput = z.infer<typeof preferencesSchema>
