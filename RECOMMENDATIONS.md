# Project Structure & Flow Recommendations

## Executive Summary

The delphi-app is well-architected with solid foundations, but has opportunities for improvement in security, code organization, testing, and maintainability. This document provides actionable recommendations organized by priority.

---

## 🔴 CRITICAL PRIORITY - Security & Production Readiness

### 1. Remove Authentication Bypass

**Issue**: Auth bypass active in production code
**Files**: `src/lib/session.ts`, `src/app/api/responses/route.ts`

**Recommendation**:
```typescript
// src/lib/session.ts - REMOVE lines 36-51
export async function getSessionPanelistId(): Promise<string> {
  const session = await getSession()

  if (!session) {
    throw new Error('Unauthorized: No active session')
  }

  return session.panelistId
}
```

**Action**: Create a proper error response for unauthenticated requests

### 2. Add Facilitator Authentication

**Issue**: Admin routes (`/admin/*`) have no authentication

**Recommendation**: Implement middleware-based authentication

```typescript
// src/middleware.ts (CREATE THIS FILE)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Protect admin routes
  if (path.startsWith('/admin')) {
    const facilitatorSession = request.cookies.get('facilitator_session')

    if (!facilitatorSession) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  // Protect panelist routes
  if (path.startsWith('/study/')) {
    const panelistSession = request.cookies.get('delphi_session')

    if (!panelistSession) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/study/:path*']
}
```

**Additional Files Needed**:
- `src/app/admin/login/page.tsx` - Facilitator login page
- `src/app/api/admin/auth/route.ts` - Facilitator authentication endpoint
- `src/lib/facilitator-session.ts` - Facilitator session management

### 3. Add Input Validation

**Issue**: API endpoints lack comprehensive validation

**Recommendation**: Use Zod for schema validation

```bash
npm install zod
```

```typescript
// src/lib/validation.ts (CREATE THIS FILE)
import { z } from 'zod'

export const responseSchema = z.object({
  indicatorId: z.string().uuid(),
  roundNumber: z.number().int().positive(),
  priorityRating: z.number().int().min(1).max(3).nullable(),
  operationalizationValidity: z.number().int().min(1).max(3).nullable(),
  feasibilityRating: z.number().int().min(1).max(3).nullable(),
  reasoning: z.string().max(2000).optional(),
  thresholdSuggestion: z.string().max(1000).optional(),
  weightSuggestion: z.string().max(1000).optional(),
  dissentFlag: z.boolean().default(false),
  dissentReason: z.string().max(1000).optional()
})

export const studySchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  totalRounds: z.number().int().min(1).max(10),
  consensusThreshold: z.number().min(0).max(5),
  indicators: z.array(z.object({
    externalId: z.string(),
    name: z.string(),
    definition: z.string(),
    // ... other fields
  }))
})
```

**Usage in API routes**:
```typescript
// src/app/api/responses/route.ts
import { responseSchema } from '@/lib/validation'

export async function POST(request: Request) {
  const body = await request.json()

  // Validate input
  const validationResult = responseSchema.safeParse(body)
  if (!validationResult.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: validationResult.error.issues },
      { status: 400 }
    )
  }

  const data = validationResult.data
  // ... proceed with validated data
}
```

### 4. Add Rate Limiting

**Issue**: No rate limiting on sensitive endpoints

**Recommendation**: Use `@upstash/ratelimit` with Redis or in-memory store

```bash
npm install @upstash/ratelimit @upstash/redis
```

```typescript
// src/lib/rate-limit.ts (CREATE THIS FILE)
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Use Upstash Redis for production, or LRU cache for development
const redis = process.env.REDIS_URL
  ? new Redis({ url: process.env.REDIS_URL })
  : undefined

export const rateLimiter = {
  magicLink: new Ratelimit({
    redis: redis || new Map(), // Fallback to in-memory for dev
    limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 requests per 15 minutes
    analytics: true,
  }),

  responses: new Ratelimit({
    redis: redis || new Map(),
    limiter: Ratelimit.slidingWindow(100, '1 h'), // 100 responses per hour
    analytics: true,
  }),
}

// Usage helper
export async function checkRateLimit(
  identifier: string,
  limiter: Ratelimit
): Promise<{ success: boolean; remaining?: number }> {
  const { success, remaining } = await limiter.limit(identifier)
  return { success, remaining }
}
```

**Usage in API routes**:
```typescript
// src/app/api/auth/magic-link/route.ts
import { rateLimiter, checkRateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const { email } = await request.json()

  // Rate limit by email
  const { success, remaining } = await checkRateLimit(email, rateLimiter.magicLink)

  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'X-RateLimit-Remaining': remaining?.toString() || '0' } }
    )
  }

  // ... proceed with magic link generation
}
```

### 5. Fix Session Expiry Enforcement

**Issue**: Session expiry checked but cookie not cleared

**File**: `src/lib/session.ts`

**Recommendation**:
```typescript
export async function getSession(): Promise<Session | null> {
  const cookie = cookies().get('delphi_session')
  if (!cookie) return null

  try {
    const decoded = Buffer.from(cookie.value, 'base64').toString('utf-8')
    const session: Session = JSON.parse(decoded)

    // Check expiry
    if (session.exp < Date.now()) {
      // Clear expired cookie
      cookies().delete('delphi_session')
      return null
    }

    return session
  } catch (error) {
    console.error('Session decode error:', error)
    cookies().delete('delphi_session') // Clear invalid cookie
    return null
  }
}
```

---

## 🟠 HIGH PRIORITY - Code Organization & Architecture

### 6. Restructure Directory Layout

**Issue**: Flat structure in `src/app/api/` makes it hard to navigate

**Current**:
```
src/app/api/
├── auth/
├── responses/
├── studies/
└── study/[studyId]/
```

**Recommended**:
```
src/
├── app/
│   ├── (auth)/                    # Route group for auth pages
│   │   ├── login/
│   │   └── verify/
│   ├── (panelist)/                # Route group for panelist pages
│   │   └── study/[studyId]/
│   ├── (facilitator)/             # Route group for admin pages
│   │   └── admin/
│   └── api/
│       ├── v1/                    # API versioning
│       │   ├── auth/
│       │   ├── studies/
│       │   ├── responses/
│       │   └── panelists/
│       └── internal/              # Internal-only endpoints
├── features/                      # Feature-based organization
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── types.ts
│   ├── studies/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types.ts
│   ├── responses/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── types.ts
│   └── analytics/
│       ├── components/
│       ├── services/
│       └── types.ts
├── components/
│   ├── ui/                        # Generic UI components
│   └── layouts/                   # Layout components
├── lib/
│   ├── db/
│   │   ├── client.ts
│   │   ├── migrations.ts
│   │   └── seeds/
│   ├── email/
│   │   ├── client.ts
│   │   ├── templates/
│   │   └── types.ts
│   ├── auth/
│   │   ├── session.ts
│   │   ├── tokens.ts
│   │   └── middleware.ts
│   └── utils/
│       ├── stats.ts
│       ├── validation.ts
│       └── formatting.ts
└── types/
    ├── api.ts
    ├── database.ts
    └── common.ts
```

**Benefits**:
- Feature-based co-location (easier to find related code)
- Clear separation between public/internal APIs
- API versioning support
- Route groups for better organization
- Easier to navigate and maintain

### 7. Extract Business Logic from API Routes

**Issue**: API routes contain too much business logic

**Current** (src/app/api/study/[studyId]/actions/route.ts):
```typescript
export async function POST(request: Request) {
  // 365 lines of business logic mixed with HTTP handling
}
```

**Recommended**: Create service layer

```typescript
// src/features/studies/services/round-service.ts (CREATE THIS FILE)
export class RoundService {
  async startRound(studyId: string, roundNumber: number) {
    // Business logic here
    return await prisma.$transaction(async (tx) => {
      const study = await tx.study.findUnique({ where: { id: studyId } })
      // ... logic
    })
  }

  async closeRound(studyId: string, roundNumber: number) {
    // Business logic here
  }

  async analyzeRound(studyId: string, roundNumber: number) {
    // Statistics computation logic
    const responses = await this.getResponsesForRound(studyId, roundNumber)
    const stats = this.computeStatistics(responses)
    return this.saveRoundSummaries(studyId, roundNumber, stats)
  }

  private computeStatistics(responses: Response[]) {
    // Extract statistics computation
  }
}

// src/app/api/v1/studies/[studyId]/actions/route.ts
import { RoundService } from '@/features/studies/services/round-service'

export async function POST(request: Request, { params }: { params: { studyId: string } }) {
  const { action } = await request.json()
  const roundService = new RoundService()

  try {
    switch (action) {
      case 'ANALYZE_ROUND':
        const result = await roundService.analyzeRound(params.studyId, currentRound)
        return NextResponse.json(result)
      // ... other cases
    }
  } catch (error) {
    return handleApiError(error)
  }
}
```

**Benefits**:
- Testable business logic
- Reusable across different endpoints
- Cleaner API routes
- Easier to maintain

### 8. Implement Repository Pattern for Database Access

**Issue**: Direct Prisma calls scattered throughout codebase

**Recommendation**: Create repository layer

```typescript
// src/lib/db/repositories/base-repository.ts (CREATE THIS FILE)
export abstract class BaseRepository<T> {
  constructor(protected prisma: PrismaClient) {}

  abstract findById(id: string): Promise<T | null>
  abstract findMany(where?: any): Promise<T[]>
  abstract create(data: any): Promise<T>
  abstract update(id: string, data: any): Promise<T>
  abstract delete(id: string): Promise<void>
}

// src/lib/db/repositories/response-repository.ts (CREATE THIS FILE)
export class ResponseRepository extends BaseRepository<Response> {
  async findById(id: string) {
    return this.prisma.response.findUnique({ where: { id } })
  }

  async findByPanelistAndRound(panelistId: string, roundNumber: number) {
    return this.prisma.response.findMany({
      where: { panelistId, roundNumber },
      include: { indicator: true }
    })
  }

  async upsertResponse(data: {
    panelistId: string
    indicatorId: string
    roundNumber: number
    priorityRating: number | null
    // ... other fields
  }) {
    return this.prisma.response.upsert({
      where: {
        panelistId_indicatorId_roundNumber: {
          panelistId: data.panelistId,
          indicatorId: data.indicatorId,
          roundNumber: data.roundNumber
        }
      },
      update: data,
      create: data
    })
  }

  async getResponsesForAnalysis(studyId: string, roundNumber: number) {
    return this.prisma.response.findMany({
      where: {
        indicator: { studyId },
        roundNumber
      },
      include: {
        panelist: { select: { id: true, role: true } },
        indicator: true
      }
    })
  }
}

// src/lib/db/repositories/index.ts (CREATE THIS FILE)
import { prisma } from '../client'

export const repositories = {
  response: new ResponseRepository(prisma),
  study: new StudyRepository(prisma),
  panelist: new PanelistRepository(prisma),
  round: new RoundRepository(prisma),
  indicator: new IndicatorRepository(prisma),
}
```

**Benefits**:
- Centralized database queries
- Easier to optimize queries
- Testable with mocks
- Clear data access layer

### 9. Add Custom Hooks for Data Fetching

**Issue**: Data fetching logic duplicated across components

**Recommendation**: Create custom React hooks

```typescript
// src/features/responses/hooks/use-responses.ts (CREATE THIS FILE)
import { useState, useEffect } from 'react'
import { Response } from '@prisma/client'

export function useResponses(studyId: string, roundNumber?: number) {
  const [responses, setResponses] = useState<Response[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchResponses() {
      try {
        setLoading(true)
        const query = roundNumber ? `?round=${roundNumber}` : ''
        const res = await fetch(`/api/v1/responses${query}`)

        if (!res.ok) throw new Error('Failed to fetch responses')

        const data = await res.json()
        setResponses(data)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchResponses()
  }, [studyId, roundNumber])

  return { responses, loading, error }
}

// src/features/responses/hooks/use-save-response.ts (CREATE THIS FILE)
export function useSaveResponse() {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const saveResponse = async (data: ResponseData) => {
    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/v1/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to save response')
      }

      return await res.json()
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setSaving(false)
    }
  }

  return { saveResponse, saving, error }
}
```

**Benefits**:
- Reusable data fetching logic
- Consistent error handling
- Easier to test
- Better loading states

---

## 🟡 MEDIUM PRIORITY - Testing & Quality

### 10. Add Comprehensive Testing

**Issue**: No tests in the codebase

**Recommendation**: Set up testing infrastructure

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

```typescript
// vitest.config.ts (CREATE THIS FILE)
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})

// tests/setup.ts (CREATE THIS FILE)
import '@testing-library/jest-dom'
import { beforeAll, afterAll, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

beforeAll(() => {
  // Setup before all tests
})

afterEach(() => {
  cleanup()
})

afterAll(() => {
  // Cleanup after all tests
})
```

**Example Tests**:

```typescript
// src/lib/utils/stats.test.ts (CREATE THIS FILE)
import { describe, it, expect } from 'vitest'
import { calculateStats, checkConsensus } from './stats'

describe('calculateStats', () => {
  it('calculates mean correctly', () => {
    const result = calculateStats([1, 2, 3, 4, 5])
    expect(result.mean).toBe(3)
  })

  it('calculates median correctly for odd length', () => {
    const result = calculateStats([1, 2, 3, 4, 5])
    expect(result.median).toBe(3)
  })

  it('calculates IQR correctly', () => {
    const result = calculateStats([1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(result.iqr).toBeCloseTo(4, 1)
  })

  it('handles empty array', () => {
    const result = calculateStats([])
    expect(result.mean).toBeNaN()
  })
})

describe('checkConsensus', () => {
  it('returns true when IQR is below threshold', () => {
    expect(checkConsensus(0.5, 1.0)).toBe(true)
  })

  it('returns false when IQR is above threshold', () => {
    expect(checkConsensus(1.5, 1.0)).toBe(false)
  })

  it('returns true when IQR equals threshold', () => {
    expect(checkConsensus(1.0, 1.0)).toBe(true)
  })
})
```

```typescript
// src/features/responses/components/rating-scale.test.tsx (CREATE THIS FILE)
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RatingScale } from './rating-scale'

describe('RatingScale', () => {
  it('renders all rating options', () => {
    render(
      <RatingScale
        value={null}
        onChange={() => {}}
        labels={['Low', 'Medium', 'High']}
      />
    )

    expect(screen.getByText('Low')).toBeInTheDocument()
    expect(screen.getByText('Medium')).toBeInTheDocument()
    expect(screen.getByText('High')).toBeInTheDocument()
  })

  it('calls onChange when option is clicked', () => {
    const onChange = vi.fn()
    render(
      <RatingScale
        value={null}
        onChange={onChange}
        labels={['Low', 'Medium', 'High']}
      />
    )

    fireEvent.click(screen.getByText('Medium'))
    expect(onChange).toHaveBeenCalledWith(2)
  })

  it('highlights selected value', () => {
    render(
      <RatingScale
        value={2}
        onChange={() => {}}
        labels={['Low', 'Medium', 'High']}
      />
    )

    const mediumButton = screen.getByText('Medium').closest('button')
    expect(mediumButton).toHaveClass('bg-blue-500') // or whatever your selected class is
  })

  it('shows unsure option', () => {
    render(
      <RatingScale
        value={null}
        onChange={() => {}}
        labels={['Low', 'Medium', 'High']}
      />
    )

    expect(screen.getByText(/unsure/i)).toBeInTheDocument()
  })
})
```

**Package.json scripts**:
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

### 11. Add API Integration Tests

**Recommendation**: Test API endpoints with real database

```typescript
// tests/api/responses.test.ts (CREATE THIS FILE)
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { POST } from '@/app/api/v1/responses/route'
import { prisma } from '@/lib/db'

describe('POST /api/v1/responses', () => {
  let testStudy: any
  let testPanelist: any
  let testIndicator: any

  beforeEach(async () => {
    // Create test data
    testStudy = await prisma.study.create({
      data: {
        name: 'Test Study',
        totalRounds: 3,
        consensusThreshold: 1.0,
        status: 'ACTIVE'
      }
    })

    testPanelist = await prisma.panelist.create({
      data: {
        email: 'test@example.com',
        name: 'Test Panelist',
        studyId: testStudy.id,
        role: 'EXPERT_GBV'
      }
    })

    testIndicator = await prisma.indicator.create({
      data: {
        externalId: 'TEST01',
        name: 'Test Indicator',
        definition: 'Test definition',
        studyId: testStudy.id,
        domainCode: 'A'
      }
    })
  })

  afterEach(async () => {
    // Clean up test data
    await prisma.response.deleteMany()
    await prisma.indicator.deleteMany()
    await prisma.panelist.deleteMany()
    await prisma.study.deleteMany()
  })

  it('creates a new response', async () => {
    const request = new Request('http://localhost:3000/api/v1/responses', {
      method: 'POST',
      body: JSON.stringify({
        indicatorId: testIndicator.id,
        roundNumber: 1,
        priorityRating: 3,
        reasoning: 'Test reasoning'
      })
    })

    // Mock session
    vi.mock('@/lib/auth/session', () => ({
      getSessionPanelistId: () => testPanelist.id
    }))

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.priorityRating).toBe(3)
    expect(data.reasoning).toBe('Test reasoning')
  })

  it('updates existing response', async () => {
    // Create initial response
    await prisma.response.create({
      data: {
        panelistId: testPanelist.id,
        indicatorId: testIndicator.id,
        roundNumber: 1,
        priorityRating: 2
      }
    })

    const request = new Request('http://localhost:3000/api/v1/responses', {
      method: 'POST',
      body: JSON.stringify({
        indicatorId: testIndicator.id,
        roundNumber: 1,
        priorityRating: 3
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(data.priorityRating).toBe(3)

    // Verify only one response exists
    const count = await prisma.response.count({
      where: {
        panelistId: testPanelist.id,
        indicatorId: testIndicator.id,
        roundNumber: 1
      }
    })
    expect(count).toBe(1)
  })

  it('rejects invalid rating values', async () => {
    const request = new Request('http://localhost:3000/api/v1/responses', {
      method: 'POST',
      body: JSON.stringify({
        indicatorId: testIndicator.id,
        roundNumber: 1,
        priorityRating: 999 // Invalid rating
      })
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})
```

### 12. Add Pre-commit Hooks

**Recommendation**: Set up Husky for git hooks

```bash
npm install --save-dev husky lint-staged
npx husky-init
```

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  },
  "scripts": {
    "prepare": "husky install"
  }
}
```

```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
npm run test
```

---

## 🟢 LOW PRIORITY - Developer Experience & Performance

### 13. Add TypeScript Path Aliases

**Issue**: Relative imports are hard to maintain

**Current**:
```typescript
import { calculateStats } from '../../../lib/utils'
```

**Recommended** (already configured, but ensure consistency):
```typescript
import { calculateStats } from '@/lib/utils'
```

Verify `tsconfig.json`:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/features/*": ["./src/features/*"]
    }
  }
}
```

### 14. Implement Error Boundary

**Issue**: No global error handling in UI

**Recommendation**: Add error boundaries

```typescript
// src/components/error-boundary.tsx (CREATE THIS FILE)
'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error boundary caught:', error, errorInfo)

    // Log to error tracking service (e.g., Sentry)
    // logErrorToService(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-4">
              We're sorry for the inconvenience. Please try refreshing the page.
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
```

**Usage in layout**:
```typescript
// src/app/layout.tsx
import { ErrorBoundary } from '@/components/error-boundary'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  )
}
```

### 15. Add Loading States

**Issue**: No global loading indicators

**Recommendation**: Add Suspense boundaries and loading components

```typescript
// src/app/study/[studyId]/loading.tsx (CREATE THIS FILE)
export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  )
}

// src/components/ui/skeleton.tsx (CREATE THIS FILE)
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  )
}

// src/components/loading-indicator.tsx (CREATE THIS FILE)
export function IndicatorCardSkeleton() {
  return (
    <div className="border rounded-lg p-6 space-y-4">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-32 w-full" />
    </div>
  )
}
```

### 16. Optimize Database Queries

**Issue**: Some queries could be more efficient

**Recommendations**:

1. **Add database indexes** (already done, verify):
```prisma
// prisma/schema.prisma
model Response {
  // Add composite index for common queries
  @@index([indicatorId, roundNumber])
  @@index([panelistId, roundNumber])
}

model Indicator {
  @@index([domainCode])
  @@index([tier])
}
```

2. **Use `select` to reduce payload**:
```typescript
// Before
const panelists = await prisma.panelist.findMany({
  where: { studyId }
})

// After
const panelists = await prisma.panelist.findMany({
  where: { studyId },
  select: {
    id: true,
    email: true,
    name: true,
    role: true,
    // Exclude magicToken, magicTokenExpiry for security
  }
})
```

3. **Batch queries with Prisma's `findMany` instead of loops**:
```typescript
// Before (N+1 query problem)
for (const indicator of indicators) {
  const responses = await prisma.response.findMany({
    where: { indicatorId: indicator.id }
  })
}

// After
const responses = await prisma.response.findMany({
  where: {
    indicatorId: { in: indicators.map(i => i.id) }
  }
})
```

### 17. Add Logging Infrastructure

**Issue**: Console.log statements scattered, no structured logging

**Recommendation**: Use structured logging library

```bash
npm install pino pino-pretty
```

```typescript
// src/lib/logger.ts (CREATE THIS FILE)
import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  } : undefined,
})

// Usage:
// logger.info({ studyId, action }, 'Starting round analysis')
// logger.error({ error, panelistId }, 'Failed to save response')
// logger.warn({ sessionId }, 'Session expired')
```

**Replace console.log calls**:
```typescript
// Before
console.log('⚠️ AUTH BYPASSED: Using panelist', panelist.id)

// After
logger.warn({ panelistId: panelist.id }, 'Auth bypassed for testing')
```

### 18. Add Environment Variable Validation

**Issue**: Missing env vars cause runtime errors

**Recommendation**: Validate on startup

```typescript
// src/lib/env.ts (CREATE THIS FILE)
import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().email(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
})

export const env = envSchema.parse(process.env)

// Usage:
// import { env } from '@/lib/env'
// const databaseUrl = env.DATABASE_URL
```

Add to `next.config.js`:
```javascript
// Validate env on build
require('./src/lib/env')

module.exports = {
  // ... config
}
```

---

## 📊 Additional Recommendations

### 19. Add Analytics & Monitoring

**Recommendation**: Integrate analytics for usage tracking

```bash
npm install @vercel/analytics @sentry/nextjs
```

**Sentry for error tracking**:
```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
})
```

**Track key metrics**:
- Response completion rates
- Average time per indicator
- Consensus rates per round
- Error rates

### 20. Add Feature Flags

**Recommendation**: Control feature rollout

```typescript
// src/lib/feature-flags.ts (CREATE THIS FILE)
export const features = {
  plainLanguageMode: process.env.FEATURE_PLAIN_LANGUAGE === 'true',
  dissentTracking: process.env.FEATURE_DISSENT === 'true',
  roleStratification: process.env.FEATURE_ROLE_STRAT === 'true',
  evidenceTooltips: process.env.FEATURE_EVIDENCE === 'true',
} as const

export function isFeatureEnabled(feature: keyof typeof features): boolean {
  return features[feature]
}
```

**Usage**:
```typescript
{isFeatureEnabled('plainLanguageMode') && (
  <PlainLanguageToggle />
)}
```

### 21. Improve Docker Configuration

**Current issues**:
- No health checks on app service
- No resource limits
- No multi-stage build for smaller images

**Recommended Dockerfile**:
```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Set permissions
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "server.js"]
```

**Add health check endpoint**:
```typescript
// src/app/api/health/route.ts (CREATE THIS FILE)
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected'
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error.message
      },
      { status: 503 }
    )
  }
}
```

**Updated docker-compose.yml**:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
      POSTGRES_DB: delphi
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD:-postgres}@postgres:5432/delphi
      NEXTAUTH_URL: ${NEXTAUTH_URL:-http://localhost:3000}
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      NODE_ENV: production
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3

volumes:
  postgres_data:
```

---

## Summary & Action Plan

### Immediate Actions (Week 1)
1. ✅ Remove authentication bypass code
2. ✅ Add input validation with Zod
3. ✅ Fix session expiry enforcement
4. ✅ Add facilitator authentication middleware
5. ✅ Set up rate limiting

### Short-term (Weeks 2-4)
6. ✅ Implement service layer
7. ✅ Add repository pattern
8. ✅ Create custom hooks
9. ✅ Add unit tests (80% coverage goal)
10. ✅ Set up CI/CD with GitHub Actions

### Medium-term (Months 2-3)
11. ✅ Restructure directory layout
12. ✅ Add integration tests
13. ✅ Implement error boundaries
14. ✅ Add structured logging
15. ✅ Optimize database queries

### Long-term (Months 3-6)
16. ✅ Add analytics & monitoring
17. ✅ Implement feature flags
18. ✅ Add comprehensive documentation
19. ✅ Performance optimization
20. ✅ Accessibility audit & improvements

### Ongoing
- Code reviews
- Documentation updates
- Security audits
- Performance monitoring
- User feedback integration

---

## Metrics to Track

### Code Quality
- Test coverage (target: >80%)
- TypeScript strict mode compliance
- Linting errors (target: 0)
- Code duplication (target: <5%)

### Performance
- Page load time (target: <2s)
- API response time (target: <200ms p95)
- Database query time (target: <100ms p95)
- Bundle size (target: <500KB)

### Security
- Authentication success rate
- Failed login attempts
- Session expiry compliance
- Rate limit violations

### User Experience
- Response completion rate
- Average time per indicator
- Error rate (target: <1%)
- Browser compatibility (target: 95%+)

---

## Questions for Product Team

1. **Authentication**: Should facilitators have multi-factor authentication?
2. **Data Retention**: How long should responses be kept after study completion?
3. **Export**: What additional export formats are needed (Excel, SPSS)?
4. **Accessibility**: What WCAG level should we target (A, AA, AAA)?
5. **Internationalization**: Will the app need to support multiple languages?
6. **Mobile**: Is a mobile-responsive design sufficient, or do we need a native app?
7. **Offline**: Should the app work offline with sync later?
8. **Backup**: What is the backup/disaster recovery requirement?

---

This document provides a roadmap for improving the delphi-app project structure, security, and maintainability. Prioritize the critical security issues first, then move to architecture improvements and testing.
