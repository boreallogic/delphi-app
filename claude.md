# Delphi-App Project Guide for Claude

## Project Overview

This is a full-stack Delphi consensus-building application for Gender-Based Violence (GBV) Indicators Framework Validation, developed in partnership between Yukon University, Yukon Status of Women Council (YSWC), and Boreal Logic Inc., funded by SSHRC.

**Core Purpose**: Enable expert consensus building on GBV indicators for northern, rural, and remote communities while preserving principled dissent and surfacing divergence between expert perspectives and lived experience.

## Technology Stack

- **Framework**: Next.js 14 (App Router), React 18, TypeScript 5
- **Database**: PostgreSQL 14+ with Prisma ORM 5
- **Authentication**: Magic links (passwordless) via next-auth
- **Email**: Nodemailer
- **Styling**: Tailwind CSS 3 with Radix UI components
- **Deployment**: Docker/Docker Compose
- **Data Processing**: Papaparse (CSV), JSON

## Quick Start Commands

```bash
# Development
npm install
npm run db:generate        # Generate Prisma client
npm run db:push           # Apply schema to database
npm run db:seed           # Load demo data (50 indicators, 6 panelists)
npm run create-facilitator # Create facilitator account for admin access
npm run dev               # Start dev server (localhost:3000)
npm run db:studio         # Open Prisma Studio database GUI

# Production Deployment
./scripts/deploy-production.sh  # Deploy with Docker (automated)

# Docker Commands
docker-compose up -d      # Start all services
docker-compose logs -f app # View logs
docker-compose down       # Stop services
docker-compose exec app npm run create-facilitator  # Create admin in container
```

## Security Status

### ✅ Production Ready - All Security Issues Resolved (2026-01-28)

**Security Status**: 🟢 Production Ready

1. **Authentication Bypass Removed** ✅
   - All API endpoints require valid authentication
   - Returns 401 Unauthorized for unauthenticated requests
   - Files: `src/lib/session.ts`, `src/app/api/responses/route.ts`

2. **Session Expiry Enforced** ✅
   - Expired cookies properly deleted
   - Invalid cookies cleared on errors
   - Session validation in middleware

3. **Input Validation Added** ✅
   - Comprehensive Zod schemas for all API inputs
   - Rating values: 1-3 or null
   - String length limits enforced
   - Clear validation error messages
   - File: `src/lib/validation.ts`

4. **Rate Limiting Implemented** ✅
   - Magic links: 5 requests per 15 minutes
   - Responses: 100 per hour per panelist
   - Facilitator login: 5 attempts per 15 minutes
   - Redis-based for production (disabled in development)
   - File: `src/lib/rate-limit.ts`

5. **Facilitator Authentication** ✅
   - Password-based auth with bcrypt (10 rounds)
   - Middleware protects `/admin/*` routes
   - Separate 7-day sessions for facilitators
   - Login at: `/admin/login`
   - Files: `src/lib/facilitator-session.ts`, `src/middleware.ts`

**Test Credentials**:
- Facilitator: `admin@example.com` / `securepassword123`

**Documentation**: See `SECURITY_FIXES.md` for complete implementation details and testing checklist.

## Project Structure

```
delphi-app/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/                      # REST API endpoints
│   │   │   ├── auth/                 # Magic link authentication
│   │   │   ├── admin/auth/           # Facilitator authentication (NEW)
│   │   │   ├── responses/            # Panelist response submission (SECURED)
│   │   │   ├── studies/              # Study CRUD
│   │   │   └── study/[studyId]/      # Study-specific actions
│   │   ├── admin/                    # Facilitator dashboard (SECURED)
│   │   │   ├── login/                # Facilitator login page (NEW)
│   │   │   ├── studies/[studyId]/    # Study management UI
│   │   │   │   ├── results/          # Results & analysis view
│   │   │   │   └── panelists/        # Panelist management
│   │   ├── study/[studyId]/          # Panelist study interface (SECURED)
│   │   │   ├── indicator-assessment.tsx  # Main rating component
│   │   │   ├── study-dashboard.tsx   # Domain batching UI
│   │   │   └── loading.tsx           # Loading skeleton (NEW)
│   │   └── auth/                     # Login/verify pages
│   ├── components/
│   │   ├── error-boundary.tsx        # Error boundary component (NEW)
│   │   ├── providers.tsx             # Client providers wrapper (NEW)
│   │   └── ui/                       # Reusable UI
│   │       ├── skeleton.tsx          # Loading skeletons (NEW)
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       └── rating-scale.tsx
│   └── lib/
│       ├── db.ts                     # Prisma client singleton
│       ├── session.ts                # Panelist session management (SECURED)
│       ├── facilitator-session.ts    # Facilitator session management (NEW)
│       ├── validation.ts             # Zod validation schemas (NEW)
│       ├── rate-limit.ts             # Rate limiting configuration (NEW)
│       ├── email.ts                  # Email service
│       ├── utils.ts                  # Statistical utilities
│       ├── domains.ts                # Domain classification
│       └── repositories/             # Repository layer (NEW)
│           ├── base-repository.ts    # Abstract base repository
│           ├── response-repository.ts
│           ├── study-repository.ts
│           ├── panelist-repository.ts
│           └── index.ts
├── middleware.ts                     # Route protection middleware (NEW)
├── prisma/
│   ├── schema.prisma                 # Database schema (11 models)
│   ├── seed.ts                       # Demo data seeder
│   └── migrations/                   # Migration history
├── scripts/
│   ├── create-facilitator.ts         # Interactive account creation (NEW)
│   ├── create-facilitator-cli.ts     # CLI account creation (NEW)
│   └── deploy-production.sh          # Automated deployment (NEW)
├── data/
│   ├── indicators_revised.csv        # 50 GBV indicators
│   └── indicator_evidence.json       # Research backing
├── docs/                             # User documentation
├── .env.production                   # Production env template (NEW)
├── .env.production.local             # Production secrets (NEW)
├── DEPLOYMENT_GUIDE.md               # Complete deployment guide (NEW)
├── QUICK_DEPLOY.md                   # 5-minute deployment (NEW)
└── SECURITY_FIXES.md                 # Security implementation (NEW)
```

## Database Schema (11 Models)

### Core Models

1. **Study** - Delphi study configuration
   - Status: SETUP, ACTIVE, PAUSED, COMPLETE
   - Fields: name, description, currentRound, totalRounds, consensusThreshold
   - Relations: indicators, panelists, rounds

2. **Indicator** - GBV indicators (50 total)
   - Fields: externalId (e.g., "SH01"), name, definition, definitionSimple
   - Domain: A-H (consolidated), tier (1-2)
   - Evidence: summary, risk/protective factors, citations

3. **Panelist** - Study participants
   - Roles: EXPERT_GBV, LIVED_EXPERIENCE, SERVICE_PROVIDER, POLICY_MAKER, etc.
   - Auth: magic token (64 chars), 24hr expiry
   - Preferences: plain language, high contrast, font size

4. **Response** - Individual panelist ratings
   - Three 1-3 scales: priorityRating, operationalizationValidity, feasibilityRating
   - Qualitative: reasoning, thresholdSuggestion, weightSuggestion
   - Dissent: dissentFlag, dissentReason
   - Unique index: (panelistId, indicatorId, roundNumber)

5. **Round** - Round lifecycle
   - Status: PENDING, OPEN, CLOSED, ANALYZED
   - Timing: opensAt, closesAt, closedAt

6. **RoundSummary** - Computed aggregates per indicator per round
   - Statistics: mean, median, std, IQR, min, max (for each dimension)
   - Consensus: consensusReached (IQR ≤ threshold)
   - Role-stratified: priorityByRole, validityByRole (JSON)

7. **AuditLog** - TRACE infrastructure ready
   - Actions: STUDY_CREATED, ROUND_OPENED, RESPONSE_SAVED, etc.
   - Actor: FACILITATOR, PANELIST, SYSTEM
   - Full audit trail with metadata

## Key Components & Line References

### Indicator Assessment Component
**File**: `src/app/study/[studyId]/indicator-assessment.tsx`

**Critical Save Protection System (5 layers)**:
1. **localStorage backup** - Instant save on every field change
2. **Auto-save timer** - 30 seconds
3. **Draft recovery** - On page reload
4. **Retry logic** - 3 attempts with exponential backoff
5. **Browser warning** - On tab close with unsaved data

**Status indicators**: "💾 Draft saved locally", "✓ Auto-saved 2:45 PM"

### Rating Scale Component
**File**: `src/components/ui/rating-scale.tsx`

- 1-3 point Likert-like scale (configurable to 1-5)
- "Unsure"/"Don't Know" option for null values
- Two layouts: standard and compact
- Accessible: ARIA roles, keyboard navigation

### Statistical Utilities
**File**: `src/lib/utils.ts`

```typescript
calculateStats(values: number[]): { mean, median, std, IQR, min, max }
checkConsensus(iqr: number, threshold: number): boolean
generateMagicToken(): string  // 64-char random token
```

## Data Flow Patterns

### Panelist Response Flow
```
1. Receive magic link email
2. Click link → /auth/verify?token=[token]
3. Token validated, session created (delphi_session cookie)
4. Redirect to /study/[studyId]
5. Load indicator assessment
   - Check localStorage for draft
   - If exists: restore + show banner
6. Fill form (one indicator per screen)
   - Each change → localStorage save (instant)
   - 30s timer → database save (3-retry backoff)
7. Click save → POST /api/responses
   - Clear localStorage
   - Status: "✓ Saved"
```

### Delphi Round Lifecycle
```
Setup:
1. Facilitator uploads CSV → Study + Indicators + Rounds created
2. Add panelists → Invitations sent

Round 1:
1. Start Round 1 → Status: OPEN
2. Panelists rate all indicators
3. Close Round → Status: CLOSED

Analysis:
1. Analyze Round → Compute stats (mean, median, IQR)
2. Check consensus (IQR ≤ threshold)
3. Create RoundSummary records
4. Status: ANALYZED

Round N+1:
1. Start next round
2. Panelists see previous stats
3. Can revise ratings based on group data
4. Repeat until consensus or final round
```

### Consensus Detection
```
For each indicator:
  1. Collect all priority ratings
  2. Calculate IQR (Interquartile Range)
  3. Compare: IQR ≤ consensusThreshold (default: 1.0)
  4. If ≤ threshold: consensusReached = true
  5. Store in RoundSummary

Role-Stratified:
  - Filter by role (EXPERT_GBV, SERVICE_PROVIDER, etc.)
  - Calculate mean/median per rating dimension
  - Store in JSON fields (priorityByRole, validityByRole)
```

## Measurement Justice Features

These go beyond standard Delphi methodology:

1. **Role-Stratified Analysis** - Surface divergence between expert vs. lived experience
2. **Dissent Preservation** - Flag + reason tracking, dissent count in summaries
3. **Domain Batching** - Organize by domain (D1-D8), one domain per screen
4. **Plain Language Mode** - Two definition versions per indicator
5. **Evidence-Based Scaffolding** - Research backing, risk/protective factors, citations

## Common Tasks

### Adding New Indicators
1. Update `data/indicators_revised.csv` with new rows
2. Update `data/indicator_evidence.json` with evidence data
3. Run `npm run import-evidence` (if script exists) or re-seed
4. Apply to existing studies via admin panel

### Modifying Rating Scales
**File**: `src/app/study/[studyId]/indicator-assessment.tsx`

Search for `<RatingScale>` components. Each has:
- `value`: Current rating (1-3 or null)
- `onChange`: Handler function
- `labels`: Custom labels per point
- `compactMode`: Layout variant

### Changing Consensus Threshold
**Database**: Update `Study.consensusThreshold` (default: 1.0)
**UI**: Study creation form in `/admin/studies/new`

### Email Template Customization
**File**: `src/lib/email.ts`

Templates:
- `sendMagicLinkEmail()` - Login link
- `sendRoundNotification()` - Round opened notification

Modify HTML + text variants in each function.

### Adding New Panelist Roles
1. **Schema**: `prisma/schema.prisma` - Update `PanelistRole` enum
2. **Utils**: `src/lib/utils.ts` - Add to `getRoleDisplayName()`
3. **Database**: Run `npm run db:migrate` to create migration
4. **UI**: Update role selection dropdown in panelist creation form

## API Endpoints Quick Reference

### Authentication
- `POST /api/auth/magic-link` - Request login link (email enumeration safe, rate limited: 5/15min)
- `POST /api/auth/verify` - Verify token, create session

### Facilitator Authentication
- `POST /api/admin/auth/login` - Facilitator login (rate limited: 5/15min)
- `POST /api/admin/auth/logout` - Facilitator logout

### Study Management
- `GET /api/study` - List all studies
- `POST /api/study` - Create study (with indicators)
- `POST /api/study/[studyId]/actions` - Lifecycle actions (START_ROUND_1, CLOSE_ROUND, ANALYZE_ROUND, etc.)

### Responses
- `POST /api/responses` - Save/update response (requires panelist auth, rate limited: 100/hr)
- `GET /api/responses?round=[N]` - Fetch panelist responses (requires panelist auth)

### Panelists
- `GET /api/study/[studyId]/panelists` - List panelists
- `POST /api/study/[studyId]/panelists` - Add panelist
- `POST /api/study/[studyId]/panelists/[id]/invite` - Send invitation
- `DELETE /api/study/[studyId]/panelists/[id]` - Remove panelist

### Export
- `GET /api/study/[studyId]/export?format=csv|json` - Export results

## Environment Variables

**Required**:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_URL` - Base URL for magic links (http://localhost:3000 in dev)
- `NEXTAUTH_SECRET` - Session signing secret (generate: `openssl rand -base64 32`)

**Email (Production)**:
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`
- `EMAIL_FROM` - From address (default: "Delphi Study <noreply@boreallogic.ca>")

**Development**: Uses Ethereal.email test SMTP (preview URLs in console)

## Testing & Demo Data

### Seed Data (npm run db:seed)
- 1 study: "GBV Indicators Framework Validation Study"
- 3 rounds (Round 1 OPEN)
- 50 GBV indicators (from CSV + evidence JSON)
- 6 sample panelists:
  - Dr. Jane Smith (EXPERT_GBV)
  - Dr. Maria Garcia (EXPERT_GBV)
  - Sarah Johnson (SERVICE_PROVIDER + LIVED_EXPERIENCE)
  - Anonymous A (LIVED_EXPERIENCE)
  - Michael Chen (POLICY_MAKER + COMMUNITY_MEMBER)
  - Dr. Alex Chen (MEDICAL_PROFESSIONAL)

### Manual Testing Workflow
1. Start dev server: `npm run dev`
2. Seed database: `npm run db:seed`
3. Request magic link: http://localhost:3000/auth/login
4. Check console for Ethereal preview URL
5. Click magic link → redirected to study dashboard
6. Rate indicators (auto-save, localStorage backup)
7. Check Prisma Studio for saved responses

## Architecture Improvements (2026-01-28)

### Repository Layer Pattern ✅

**Created**: Centralized database access with repository pattern

**Files**:
- `src/lib/repositories/base-repository.ts` - Abstract base
- `src/lib/repositories/response-repository.ts` - Response operations
- `src/lib/repositories/study-repository.ts` - Study operations
- `src/lib/repositories/panelist-repository.ts` - Panelist operations

**Usage**:
```typescript
import { repositories } from '@/lib/repositories'

// Get responses
const responses = await repositories.response.findByPanelistAndRound(
  panelistId,
  roundNumber
)

// Upsert response
const response = await repositories.response.upsertResponse({
  panelistId,
  indicatorId,
  roundNumber,
  priorityRating: 3,
  // ...
})

// Get study with stats
const stats = await repositories.study.getStatistics(studyId)
```

**Benefits**:
- Centralized database queries
- Easier to test (can mock repositories)
- Consistent patterns
- Easier to optimize queries

### Error Boundaries ✅

**Created**: React error boundaries to prevent full app crashes

**Files**:
- `src/components/error-boundary.tsx` - Error boundary component
- `src/components/providers.tsx` - Provider wrapper
- `src/app/layout.tsx` - Integrated in root layout

**Features**:
- Catches component errors gracefully
- Shows user-friendly error message
- Displays stack trace in development
- "Try again" and "Go home" buttons

### Loading States ✅

**Created**: Professional loading indicators with skeletons

**Files**:
- `src/components/ui/skeleton.tsx` - Skeleton components
- `src/app/admin/loading.tsx` - Admin loading
- `src/app/study/[studyId]/loading.tsx` - Study loading
- `src/app/admin/studies/[studyId]/results/loading.tsx` - Results loading

**Components**:
- `<Skeleton />` - Basic animated placeholder
- `<CardSkeleton />` - Pre-configured card
- `<TableRowSkeleton />` - Pre-configured table row
- `<IndicatorCardSkeleton />` - Indicator-specific

---

## Production Deployment

### Prerequisites
- Docker and Docker Compose installed
- SMTP credentials (SendGrid, AWS SES, etc.)
- Domain name (optional but recommended)

### Quick Deploy

```bash
# 1. Start Docker Desktop
open -a Docker

# 2. Deploy (automated script)
./scripts/deploy-production.sh

# 3. Access application
open http://localhost:3000/admin/login
```

**Facilitator credentials**: `admin@example.com` / `securepassword123`

### Production Deployment

See comprehensive guides:
- **QUICK_DEPLOY.md** - 5-minute deployment guide
- **DEPLOYMENT_GUIDE.md** - Complete deployment documentation (100+ sections)
- **DEPLOYMENT_STATUS.md** - Current status and next steps

### Environment Variables

Required for production:
- `DATABASE_URL` - PostgreSQL connection
- `NEXTAUTH_SECRET` - Session signing secret (generate: `openssl rand -base64 32`)
- `NEXTAUTH_URL` - Your domain (e.g., `https://yourdomain.com`)
- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` - Email delivery
- `EMAIL_FROM` - From address

Optional:
- `REDIS_URL`, `REDIS_TOKEN` - For distributed rate limiting

---

## Known Issues & TODOs

### Critical (Production Ready) ✅
- [x] Remove auth bypass - ✅ COMPLETED
- [x] Add facilitator authentication - ✅ COMPLETED
- [x] Fix session expiry - ✅ COMPLETED
- [x] Add rate limiting - ✅ COMPLETED
- [x] Add input validation - ✅ COMPLETED

### High Priority (Optional Improvements)
- [ ] Extract round management business logic into service layer
- [ ] Add custom React hooks for data fetching
- [ ] Write unit tests for utilities (calculateStats, checkConsensus)
- [ ] Write integration tests for API endpoints

### Medium Priority
- [ ] Pre-commit hooks (Husky + lint-staged)
- [ ] Additional database indexes for performance
- [ ] Structured logging (Pino)
- [ ] Environment variable validation on startup

### Low Priority
- [ ] Feature-based directory restructuring
- [ ] Analytics & monitoring integration
- [ ] Performance profiling
- [ ] Multi-stage Docker optimization

## Code Style & Patterns

### General Patterns
- **TypeScript strict mode** enabled
- **Functional components** with React hooks
- **Server components** by default (Next.js 14)
- **API routes** in `app/api/` following REST conventions
- **Error handling**: try/catch with detailed error messages
- **Transactions**: Use Prisma transactions for atomic operations
- **Audit logging**: Log all major actions to AuditLog table
- **Component structure**: Small, focused, single responsibility

### Architecture Patterns (New)
- **Repository pattern** for database access - Use `repositories.*` instead of direct Prisma
- **Error boundaries** for crash prevention - Automatic in root layout
- **Loading skeletons** for better UX - Add `loading.tsx` next to routes
- **Input validation** with Zod - Validate all API inputs
- **Rate limiting** with Upstash - Protect sensitive endpoints
- **Session management** - Separate panelist and facilitator sessions

## Prisma Operations

### Common Queries
```typescript
// Get study with all relations
const study = await prisma.study.findUnique({
  where: { id: studyId },
  include: { indicators: true, panelists: true, rounds: true }
})

// Upsert response (one per panelist/indicator/round)
const response = await prisma.response.upsert({
  where: {
    panelistId_indicatorId_roundNumber: {
      panelistId,
      indicatorId,
      roundNumber
    }
  },
  update: { priorityRating, reasoning, ... },
  create: { panelistId, indicatorId, roundNumber, priorityRating, ... }
})

// Get responses for analysis
const responses = await prisma.response.findMany({
  where: { indicator: { studyId }, roundNumber },
  include: { panelist: true, indicator: true }
})
```

### Transactions Example
```typescript
await prisma.$transaction(async (tx) => {
  // Create study
  const study = await tx.study.create({ data: { ... } })

  // Create rounds
  await tx.round.createMany({ data: rounds })

  // Create indicators
  await tx.indicator.createMany({ data: indicators })

  // Log action
  await tx.auditLog.create({ data: { action: 'STUDY_CREATED', ... } })
})
```

## Deployment Notes

### Docker Production
```bash
# Build and start
docker-compose up -d

# Run migrations
docker-compose run --rm migrations

# View logs
docker-compose logs -f app

# Stop
docker-compose down
```

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Configure production `DATABASE_URL`
- [ ] Generate strong `NEXTAUTH_SECRET`
- [ ] Configure production SMTP
- [ ] Set correct `NEXTAUTH_URL` (production domain)
- [ ] Run `npm run db:migrate:deploy`
- [ ] Configure SSL/HTTPS
- [ ] Set up database backups
- [ ] Remove auth bypass code
- [ ] Add rate limiting
- [ ] Configure monitoring/logging

## Data Sovereignty & Self-Hosting

This application is designed for **self-hosting** to support data sovereignty, critical for research with Indigenous communities and sensitive GBV data:

- **Docker Compose** for easy deployment
- **PostgreSQL** database (no external data storage)
- **Local file storage** for CSV/JSON data
- **No external API calls** except SMTP for email
- **TRACE integration ready** for behavioral audit trails

## Project Maturity

**Stage**: Late beta / pre-production
- Core functionality complete
- Save protection robust (5-layer system)
- UX refined through user feedback
- Documentation comprehensive
- Security fixes needed before production
- No test coverage yet

## Contact & Support

- **Boreal Logic Inc.**: Development partner
- **Yukon University**: Research lead
- **YSWC**: Community partner
- **Funding**: SSHRC

## Additional Documentation

- `README.md` - Comprehensive project overview
- `IMPLEMENTATION_SUMMARY.md` - Save protection system
- `SAVE_PROTECTION_FEATURES.md` - Technical deep dive
- `RECOVERY_INSTRUCTIONS.md` - User-facing recovery guide
- `docs/PANELIST_GUIDE.md` - User instructions
- `agent-templates/` - AI agent workflow templates

## File Editing Guidelines

### Before Modifying Files
1. Always read the file first
2. Understand existing patterns
3. Check for related files (imports, exports)
4. Review recent git history if available

### Avoid Over-Engineering
- Don't add features beyond what's requested
- Don't refactor unrelated code
- Don't add unnecessary abstractions
- Keep solutions simple and focused
- Only add error handling for real scenarios

### Security Considerations
- Validate all user inputs
- Use parameterized queries (Prisma handles this)
- Don't log sensitive data
- Check authentication before protected operations
- Rate limit public endpoints
- Use HTTPS in production
