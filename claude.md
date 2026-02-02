# Delphi App - Project Guide

## Project Overview

**Name:** Delphi Indicator Validation App
**Purpose:** Expert panel validation of GBV (Gender-Based Violence) Community Risk Assessment indicators for Yukon
**Partners:** Yukon Status of Women Council (YSWC) + Yukon University
**Methodology:** Modified Delphi consensus-building process

### The Big Picture

This Delphi app validates indicators that will be used in a separate **GBV Community Risk Assessment Dashboard**. The dashboard will generate risk profiles for Yukon communities and support YESAB (Yukon Environmental and Socio-economic Assessment Board) submissions.

**Two-track validation approach:**
- **Track A (this app):** Indicator-level validation - experts assess individual indicators in isolation
- **Track B (separate):** Composite validation - testing assembled dashboard output with users

### What This App Does

1. **Expert Panel Assessment:** Panelists (GBV experts, service providers, community representatives) review 73 indicators
2. **Three-Dimension Rating:** Each indicator rated on Priority, Validity, Feasibility (1-3 scale)
3. **Qualitative Feedback:** Reasoning, threshold suggestions, comments, dissent registration
4. **Multi-Round Consensus:** Delphi methodology with 3 planned rounds showing previous results
5. **Track Progress:** Domain-based organization, completion tracking, auto-save

---

## Current State (2026-02-01)

### What's Working ✅

- Study dashboard showing all 73 indicators by 8 domains (A-H)
- Individual indicator assessment pages with full context
- Three rating dimensions (Priority, Validity, Feasibility)
- Qualitative feedback collection
- Dissent registration mechanism
- Auto-save (2-second delay)
- Progress tracking
- Previous round context display (if Round > 1)
- Dev mode auth bypass for testing
- Supabase PostgreSQL database
- Netlify deployment: https://delphi-app.netlify.app/

### What's Missing 🚧

- Domain-by-domain navigation (planned next)
- Collapsible information sections (planned)
- Admin dashboard for facilitators
- Results/consensus analysis view
- Magic link authentication (has endpoint but not tested)
- Email configuration (using Ethereal placeholder)
- Round management (advance rounds, close rounds)
- Panelist invitation system

---

## Technology Stack

### Core Framework
- **Next.js 14.2.33** (App Router)
- **React 18** (Server Components by default)
- **TypeScript 5**
- **Tailwind CSS** for styling

### Database & ORM
- **PostgreSQL** (Supabase hosted)
- **Prisma ORM 5.19.0**
- Database URL: `postgresql://postgres:PWzZLCsfWx5HPqrO@db.bbqbnnmgapvluflpajvn.supabase.co:5432/postgres`

### Deployment
- **Netlify:** https://delphi-app.netlify.app/
- **GitHub:** https://github.com/boreallogic/delphi-app.git
- Auto-deploy on push to main branch

### Data
- **Source Files:**
  - `data/indicators_revised_v2.xlsx` - 73 indicators with full metadata
  - `data/indicator_evidence_v2.json` - Evidence, citations, risk factors
- **Import Scripts:**
  - `scripts/import-indicators.ts` - Excel + JSON merge import
  - `scripts/import-indicators-v2.ts` - JSON-only import

---

## Database Schema

### Key Models

#### Study
- Primary container for a Delphi study
- Fields: name, description, currentRound, totalRounds, consensusThreshold, status
- Status: SETUP | ACTIVE | PAUSED | COMPLETE

#### Indicator (73 total)
- GBV risk indicators to be validated
- Fields: externalId (e.g., "SH01"), name, definition, definitionSimple, tier (1-2), mvp (boolean)
- Domain codes: A-H (Safe Places, Safety/Justice, Health, Economic, Support, Community, Prevention, Data)
- Evidence fields: evidenceSummary, riskFactors, protectiveFactors, keyCitations
- Operationalization: unitOfMeasure, collectionFrequency, operationalization

#### Panelist
- Expert panel members
- Fields: email, name, primaryRole, magicToken, magicTokenExpiry, lastLoginAt
- Roles: EXPERT_GBV, LIVED_EXPERIENCE, SERVICE_PROVIDER, POLICY_MAKER, etc.

#### Response
- Individual panelist assessments
- Three 1-3 ratings: priorityRating, operationalizationValidity, feasibilityRating
- Qualitative: qualitativeReasoning, thresholdSuggestion, generalComments
- Dissent: dissentFlag, dissentReason
- Unique constraint: (panelistId, indicatorId, roundNumber)

#### Round
- Round lifecycle tracking
- Fields: roundNumber, status (PENDING | OPEN | CLOSED | ANALYZED), opensAt, closesAt

#### RoundSummary
- Computed aggregate statistics per indicator per round
- Statistics: mean, median, std, IQR for each dimension
- Consensus flag: consensusReached (boolean)
- Role-stratified results: priorityByRole, validityByRole (JSON)

#### AuditLog
- Full audit trail of all actions
- Actions: STUDY_CREATED, ROUND_OPENED, RESPONSE_SAVED, etc.
- Actor types: FACILITATOR, PANELIST, SYSTEM

---

## Application Structure

### Routes

```
/                               → Redirect to /study
/study                          → Study dashboard (all indicators by domain)
/study/indicator/[id]           → Individual indicator assessment page
  ├─ page.tsx                   → Server component (loads data)
  └─ form.tsx                   → Client component (rating form)

/api/responses                  → POST: Save response, GET: Fetch responses
/api/auth/verify                → Magic link verification
/api/auth/logout                → Clear session
```

### Key Files

```
src/
├── app/
│   ├── page.tsx                          # Home (redirects to /study)
│   ├── layout.tsx                        # Root layout
│   ├── globals.css                       # Tailwind styles
│   ├── study/
│   │   ├── page.tsx                      # Study dashboard (domain grid)
│   │   └── indicator/[id]/
│   │       ├── page.tsx                  # Indicator detail + context
│   │       └── form.tsx                  # Rating form (client component)
│   └── api/
│       ├── responses/route.ts            # Save/fetch responses
│       └── auth/
│           ├── verify/route.ts           # Magic link handler
│           └── logout/route.ts           # Session clear
├── components/
│   └── ui/
│       ├── button.tsx                    # Button component
│       └── card.tsx                      # Card components
├── lib/
│   ├── db.ts                            # Prisma client singleton
│   ├── session.ts                       # Session management (dev mode bypass)
│   └── email.ts                         # Email service (placeholder)
├── prisma/
│   ├── schema.prisma                    # Database schema (11 models)
│   └── seed.ts                          # Demo data seeder
├── data/
│   ├── indicators_revised_v2.xlsx       # Source indicator data (73)
│   └── indicator_evidence_v2.json       # Evidence + citations
└── scripts/
    ├── import-indicators.ts             # Primary import script
    └── import-indicators-v2.ts          # Alternate import
```

---

## Domain Structure

### 8 Domains (A-H)

| Code | Name | Indicators | Description |
|------|------|-----------|-------------|
| **A** | Safe Places to Stay | 8 | Emergency shelters, transitional housing, pet care |
| **B** | Safety & Justice | 6 | Victim services, legal aid, court access, police response |
| **C** | Health & Wellbeing | 9 | SANE access, primary care, mental health, substance treatment |
| **D** | Economic Security | 7 | Emergency funds, relocation support, childcare, financial services |
| **E** | Support Services | 11 | GBV services, crisis lines, counseling, cultural safety |
| **F** | Community Response | 6 | Service coordination, community readiness, informal supports |
| **G** | Prevention & Education | 13 | Healthy relationships, bystander training, alcohol policy, perpetrator programs |
| **H** | Data & Accountability | 13 | Data systems, feedback mechanisms, policy implementation |

**Total:** 73 indicators
**MVP Subset:** 29 indicators (Tier 1 + HIGH/MEDIUM reliability)

---

## Assessment Flow (Current)

### User Journey

1. **Landing:** Visit root → Auto-redirect to `/study`
2. **Dashboard:** See all 73 indicators grouped by 8 domains
   - Progress bar shows X/73 completed
   - Green checkmark ✓ for completed, gray circle ○ for pending
   - Tier badges (Tier 1 = Pathway-Critical, Tier 2 = Pathway-Quality)
   - MVP badges for indicators in MVP subset
3. **Select Indicator:** Click any indicator card
4. **Assessment Page:**
   - Full indicator context (definition, plain language, evidence, tier rationale)
   - Previous round results (if Round > 1)
   - Rating form with 3 dimensions (1-3 scale)
   - Optional qualitative feedback
   - Dissent registration
   - Auto-save after 2 seconds
5. **Navigation:** Prev/Next buttons to adjacent indicators
6. **Completion:** "Finish Review" button on last indicator → back to dashboard

### Auto-Save Behavior

- Triggers 2 seconds after last change
- Status indicators: "Saving...", "✓ Saved", "⚠ Save failed"
- Manual save button available
- POST to `/api/responses` endpoint

---

## Assessment Dimensions

### Three Rating Scales (1-3)

#### 1. Priority Rating
**Question:** "How critical is this indicator for measuring GBV risk?"
- **1 (Low):** Nice to have but not essential
- **2 (Medium):** Important but not pathway-critical
- **3 (High):** Absolutely essential for understanding risk

#### 2. Operationalization Validity
**Question:** "Does this measure what it claims to measure? Is the operationalization appropriate?"
- **1 (Low):** Poorly defined or measures wrong thing
- **2 (Medium):** Reasonable but could be improved
- **3 (High):** Well-defined and measures correctly

#### 3. Feasibility Rating
**Question:** "Can this data be reliably collected in Yukon communities?"
- **1 (Low):** Very difficult or impossible to collect
- **2 (Medium):** Challenging but possible
- **3 (High):** Straightforward data collection

### Qualitative Fields (Optional)

- **Reasoning:** Explain ratings or suggest improvements
- **Threshold Suggestions:** What = adequate vs. inadequate?
- **General Comments:** Any other feedback
- **Dissent:** Flag + reason if fundamental disagreement

---

## Consensus Methodology

### Delphi Process (Planned)

**Round 1:**
- Panelists assess all indicators independently
- No previous data shown

**Round 2:**
- Show Round 1 aggregate results (median scores)
- Panelists can revise their ratings based on group consensus
- Identify areas of disagreement

**Round 3:**
- Show Round 2 results
- Final opportunity to revise
- Facilitator identifies consensus vs. dissent patterns

**Consensus Criteria:**
- IQR (Interquartile Range) ≤ 1.0 for a dimension
- Simple threshold, transparent calculation
- Dissent preserved even when consensus reached

### Role-Stratified Analysis

Results analyzed by panelist role:
- EXPERT_GBV
- SERVICE_PROVIDER
- LIVED_EXPERIENCE
- POLICY_MAKER
- etc.

Surface divergence between expert opinion and lived experience perspectives.

---

## Development Mode Features

### Auth Bypass (Development Only)

In `src/lib/session.ts`:
```typescript
if (process.env.NODE_ENV === 'development') {
  // Auto-login as first panelist in database
  const panelist = await prisma.panelist.findFirst({
    include: { study: true }
  })
  return { panelist, study: panelist.study }
}
```

**For production:** Remove this bypass and implement proper magic link auth.

### Demo Data

Run `npm run db:seed` to create:
- 1 study: "GBV Indicators Framework Validation Study"
- 3 rounds (Round 1 OPEN)
- 50 indicators (outdated - re-import with `npm run import`)
- 6 sample panelists

**To load current data (73 indicators):**
```bash
npm run import
```

---

## Planned Improvements

### Phase 1: Domain-by-Domain Navigation (Next Up)

**Goal:** Reduce cognitive load by focusing on one domain at a time

**Changes:**
- New route: `/study/domain/[code]` (e.g., `/study/domain/A`)
- Domain selection page showing 8 domain cards
- Complete all indicators in a domain before moving to next
- Domain progress: "5/8 indicators in Safe Places to Stay"
- Return to domain selection after completing domain

**Benefits:**
- Experts can focus on one pathway type at a time
- Better for mobile (less scrolling)
- Clearer sense of progress
- Natural cognitive grouping

### Phase 2: Collapsible Information Architecture

**Goal:** Reduce initial overwhelm, show details on-demand

**Always visible:**
- Indicator name
- Tier badge
- MVP badge
- Core definition

**Expandable sections:**
- 📚 Evidence & Research
- 📏 Operationalization Details
- 📊 Previous Round Results (if Round > 1)
- 💡 Plain Language Definition

### Phase 3: Enhanced Rating UX

**Current:** All fields visible at once
**Proposed:** Progressive disclosure

- Show 3 rating scales first
- "Why?" button next to each rating → expand textarea for that dimension
- Dissent more prominent (orange alert box)
- Contextual help tooltips

### Phase 4: Admin Dashboard

**For facilitators:**
- View aggregate results by indicator
- View consensus status (IQR calculations)
- Advance rounds
- Export data
- Manage panelists

### Phase 5: Production Features

- Real magic link authentication
- SMTP email configuration
- Panelist invitation system
- Round management (open/close/analyze)
- Results visualization
- Export functionality (CSV, JSON)

---

## Design Principles

### 1. Cognitive Load Management
- One domain at a time (planned)
- Progressive disclosure of information
- Clear visual hierarchy
- Minimal decisions per screen

### 2. Transparency
- Show previous round results openly
- Preserve dissent alongside consensus
- Clear labeling of tier, MVP, domain
- Audit trail of all actions

### 3. Flexibility
- Skip and return to indicators
- Revise responses in later rounds
- Optional qualitative feedback
- Dissent mechanism

### 4. Measurement Justice
- Role-stratified analysis
- Preserve lived experience perspective
- No forced consensus (dissent honored)
- Plain language definitions alongside technical

---

## Code Patterns

### Server vs. Client Components

**Server Components (default in Next.js 14):**
- Page components that load data
- Use `async/await` for database queries
- Cannot use React hooks or event handlers
- Example: `src/app/study/page.tsx`

**Client Components (marked with 'use client'):**
- Forms with interactivity
- Use React hooks (useState, useEffect)
- Event handlers (onClick, onChange)
- Example: `src/app/study/indicator/[id]/form.tsx`

### Database Access

Always use Prisma client singleton from `src/lib/db.ts`:

```typescript
import { prisma } from '@/lib/db'

const indicators = await prisma.indicator.findMany({
  where: { studyId: study.id },
  orderBy: [{ domainCode: 'asc' }]
})
```

### Session Management

Current implementation in `src/lib/session.ts`:
- Development: Auto-login first panelist
- Production: Check `delphi_session` cookie (not yet implemented)

### API Routes

Pattern for all API routes:
```typescript
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    // ... handle request

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

---

## Common Tasks

### Add New Panelist (Manual)

```bash
npx prisma studio
# Navigate to Panelist table
# Add record with email, name, primaryRole, studyId
```

### Import/Re-import Indicators

```bash
npm run import
# Loads 73 indicators from data/indicators_revised_v2.xlsx + indicator_evidence_v2.json
```

### View Database

```bash
npm run db:studio
# Opens Prisma Studio in browser
```

### Reset Database

```bash
npm run db:push  # Sync schema
npm run db:seed  # Load demo data
npm run import   # Load 73 indicators
```

### Deploy to Netlify

```bash
git add -A
git commit -m "Your message"
git push origin main
# Netlify auto-deploys
```

### Check Deployment

- Netlify dashboard: https://app.netlify.com/sites/delphi-app
- Live site: https://delphi-app.netlify.app/
- Check build logs for errors

---

## Environment Variables

### Development (.env)

```bash
DATABASE_URL="postgresql://postgres:PWzZLCsfWx5HPqrO@db.bbqbnnmgapvluflpajvn.supabase.co:5432/postgres"
SESSION_SECRET="m7/zwY4/bRWR4L3JniOZOe7hNZXzw3p1FfXR1j0vQnM="
NEXTAUTH_URL="http://localhost:3001"
NODE_ENV="development"

# Email (placeholder)
SMTP_HOST="smtp.ethereal.email"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="ethereal.user@ethereal.email"
SMTP_PASS="ethereal.pass"
EMAIL_FROM="Delphi Study <noreply@example.com>"
```

### Production (Netlify)

Set in: https://app.netlify.com/sites/delphi-app/configuration/env

**Required:**
- `DATABASE_URL` - Supabase connection string
- `SESSION_SECRET` - Session signing secret
- `NEXTAUTH_URL` - https://delphi-app.netlify.app
- `NODE_ENV` - production

**Email (when ready):**
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`

---

## Testing Strategy

### Current State
- ❌ No automated tests
- ✅ Manual testing in development
- ✅ TypeScript type checking
- ✅ Build validation on deploy

### Planned Testing

**Unit Tests:**
- Consensus calculation (IQR, median)
- Validation logic
- Session management

**Integration Tests:**
- API endpoints (POST /api/responses)
- Database operations
- Round advancement logic

**E2E Tests:**
- Complete assessment flow
- Multi-round workflow
- Admin operations

---

## Known Issues & Limitations

### Current Limitations

1. **No Admin Dashboard:** Facilitators can't manage rounds or view results in UI
2. **Manual Panelist Management:** No invitation system, must add via database
3. **No Email:** Magic links not functional (using dev mode bypass)
4. **No Results View:** Can't see aggregate consensus data
5. **Single Study Only:** Database supports multiple studies but UI assumes one
6. **No Round Management:** Can't advance/close rounds via UI

### Technical Debt

1. **Auth System Incomplete:** Magic link endpoints exist but untested
2. **No Input Validation:** API routes don't validate input with Zod
3. **No Rate Limiting:** API open to abuse
4. **Manual Indicator Import:** No UI for indicator management
5. **Hardcoded Domain Names:** Should come from database

---

## Related Projects

### GBV Risk Assessment Dashboard (Separate Project)

**Location:** `~/Projects/GBV Risk Indicators/`

**Purpose:** The actual working tool that uses validated indicators to generate community risk profiles

**Key Files:**
- `SYSTEM_DESIGN.md` - Dashboard architecture, thresholds, scoring
- `indicators_revised_v2.xlsx` - Same 73 indicators (master source)
- `indicator_evidence_v2.json` - Same evidence data
- `CLAUDE.md` - Project context and decisions

**Relationship:**
- Delphi App (this) = Validation tool (Track A)
- Dashboard = Production tool (uses validated indicators)
- Two-track validation ensures both indicator quality AND usability

---

## Quick Reference

### Commands

```bash
# Development
npm run dev                  # Start dev server (localhost:3001)
npm run build               # Build for production
npm run start               # Run production build

# Database
npm run db:generate         # Generate Prisma client
npm run db:push            # Sync schema to database
npm run db:seed            # Load demo data
npm run db:studio          # Open database GUI
npm run import             # Import 73 indicators

# Deployment
git push origin main       # Auto-deploys to Netlify
```

### URLs

- **Local:** http://localhost:3001
- **Production:** https://delphi-app.netlify.app/
- **Supabase:** https://supabase.com/dashboard/project/bbqbnnmgapvluflpajvn
- **Netlify:** https://app.netlify.com/sites/delphi-app
- **GitHub:** https://github.com/boreallogic/delphi-app

---

## Development Workflow

### Making Changes

1. **Create branch (optional):**
   ```bash
   git checkout -b feature/domain-navigation
   ```

2. **Make changes** - edit files

3. **Test locally:**
   ```bash
   npm run dev
   # Visit http://localhost:3001
   ```

4. **Build test:**
   ```bash
   npm run build
   ```

5. **Commit and push:**
   ```bash
   git add -A
   git commit -m "Add domain-by-domain navigation"
   git push origin main  # or feature branch
   ```

6. **Check Netlify deployment**
   - Auto-deploys on push to main
   - Check build logs if errors

### Debugging

**Check dev server logs:**
```bash
tail -f /private/tmp/claude/-Users-ajamason/tasks/[task-id].output
```

**Database inspection:**
```bash
npm run db:studio
```

**Check Netlify build:**
- Dashboard → Deploys → Click latest deploy → View logs

---

## Contact & Context

**Project Lead:** Aja Mason (Boreal Logic Inc.)
**Partners:** Yukon Status of Women Council, Yukon University
**Funding:** SSHRC
**Timeline:** Phase 1 MVP - 3-4 months

**Session Notes:**
- Created: 2026-02-01
- Major milestone: First working assessment interface deployed
- Next up: Domain-by-domain navigation flow

---

*Last Updated: 2026-02-01*
*Version: 1.0*
*Status: MVP assessment interface complete, domain navigation planned*
