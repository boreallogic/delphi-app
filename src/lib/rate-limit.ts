import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

/**
 * Rate limiting configuration for API endpoints
 *
 * In development: Rate limiting is DISABLED (no Redis configured)
 * In production: Configure REDIS_URL and REDIS_TOKEN environment variables
 */

// Create Redis client only if configured
const redis = process.env.REDIS_URL && process.env.REDIS_TOKEN
  ? new Redis({
      url: process.env.REDIS_URL,
      token: process.env.REDIS_TOKEN,
    })
  : null

// Create rate limiter if Redis is configured
const createRateLimiter = (requests: number, windowMs: number) => {
  if (!redis) {
    // Return null if Redis not configured (development mode)
    return null
  }

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, `${windowMs} ms`),
    analytics: true,
    prefix: 'delphi',
  })
}

/**
 * Rate limiters for different endpoints
 * null in development (no Redis), Ratelimit instance in production
 */
export const rateLimiters = {
  // Magic link requests: 5 requests per 15 minutes per email
  magicLink: createRateLimiter(5, 15 * 60 * 1000),

  // Response submissions: 100 requests per hour per panelist
  responses: createRateLimiter(100, 60 * 60 * 1000),

  // General API: 1000 requests per hour per IP
  api: createRateLimiter(1000, 60 * 60 * 1000),
}

/**
 * Check rate limit and return result
 *
 * @param identifier - Unique identifier (email, IP, user ID, etc.)
 * @param limiter - Rate limiter to use (null in development)
 * @returns Object with success status and remaining requests
 */
export async function checkRateLimit(
  identifier: string,
  limiter: Ratelimit | null
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  // If no rate limiter configured (development), allow all requests
  if (!limiter) {
    return {
      success: true,
      limit: 9999,
      remaining: 9999,
      reset: Date.now() + 3600000,
    }
  }

  const { success, limit, remaining, reset } = await limiter.limit(identifier)

  return {
    success,
    limit,
    remaining,
    reset,
  }
}

/**
 * Get rate limit headers for HTTP responses
 */
export function getRateLimitHeaders(result: {
  limit: number
  remaining: number
  reset: number
}): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  }
}

/**
 * Helper to get client identifier from request
 */
export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')

  const ip = forwarded?.split(',')[0]?.trim() || realIp || cfConnectingIp || 'unknown'

  return ip
}
