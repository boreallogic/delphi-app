# Delphi Method Application

**GBV Indicators Framework Validation**  
Yukon Women's Coalition / Boreal Logic Inc.

A full-stack web application for conducting Delphi method studies to achieve expert consensus on gender-based violence indicators for northern, rural, and remote communities.

---

## Overview

This application operationalizes the Delphi method for indicator validation with specific features designed for measurement justice:

- **Multi-round consensus building** with configurable thresholds
- **Role-stratified analysis** to surface divergence between expert and lived experience perspectives
- **Principled dissent tracking** to preserve minority viewpoints
- **Domain-batched assessment** to reduce cognitive load
- **Plain-language mode** for accessibility
- **Self-hostable architecture** for data sovereignty

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | Magic links (email-based, passwordless) |
| Styling | Tailwind CSS |
| Hosting | Docker / any VPS |

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- SMTP credentials (or use ethereal.email for development)

### Local Development

```bash
# Clone and install
git clone <repository>
cd delphi-app
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database URL and other settings

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# (Optional) Seed demo data
npm run db:seed

# Start development server
npm run dev
```

Visit `http://localhost:3000`

### Docker Deployment

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

## Project Structure

```
delphi-app/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Demo data seeder
├── src/
│   ├── app/
│   │   ├── api/           # API routes
│   │   ├── admin/         # Facilitator dashboard
│   │   ├── auth/          # Login/verification
│   │   └── study/         # Panelist interface
│   ├── components/
│   │   └── ui/            # Reusable components
│   └── lib/
│       ├── db.ts          # Prisma client
│       ├── email.ts       # Email service
│       ├── session.ts     # Auth helpers
│       └── utils.ts       # Utilities
├── docker-compose.yml
├── Dockerfile
└── .env.example
```

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXTAUTH_URL` | Base URL for magic links | Yes |
| `NEXTAUTH_SECRET` | Cookie signing secret | Yes |
| `SMTP_HOST` | SMTP server host | Production |
| `SMTP_PORT` | SMTP server port | Production |
| `SMTP_USER` | SMTP username | Production |
| `SMTP_PASS` | SMTP password | Production |
| `EMAIL_FROM` | From address for emails | No |

### Consensus Configuration

When creating a study, you can configure:

- **Consensus Threshold (IQR)**: Default 1.0. Lower = stricter consensus requirement.
- **Number of Rounds**: Typically 2-3.
- **Allow Dissent Flags**: Enable panelists to flag principled disagreement.

## Usage Guide

### For Facilitators

1. **Create Study**: Upload indicator CSV, configure rounds and threshold
2. **Add Panelists**: Invite participants by email with role designation
3. **Manage Rounds**: Open rounds, monitor progress, close and analyze
4. **Review Results**: View consensus status, role-stratified analysis, export data

### For Panelists

1. **Receive Invitation**: Get magic link email
2. **Access Study**: Click link, no password needed
3. **Rate Indicators**: By domain, with qualitative reasoning
4. **Review & Revise**: See group statistics in subsequent rounds
5. **Flag Dissent**: Mark principled disagreement for preservation

### CSV Import Format

Required columns for indicator import:

| Column | Description |
|--------|-------------|
| ID | Unique identifier (e.g., "SH01") |
| Category | Indicator category |
| Indicator Name | Display name |
| Definition | Full definition |
| Unit of Measure | Measurement unit |
| Operationalization | How to collect/calculate |
| Collection Frequency | Annual, quarterly, etc. |
| Priority | Original priority (HIGH/MEDIUM/LOW) |
| Notes/Edge Cases | Special considerations |
| Domain | Domain assignment (e.g., "D1: Shelter Infrastructure") |

## Measurement Justice Features

This application implements several features beyond standard Delphi methodology:

### Dissent Preservation

Panelists can flag "principled dissent" to ensure minority viewpoints are recorded in final reports, preventing false consensus.

### Role-Stratified Analysis

Compare ratings across panelist types (GBV experts, measurement experts, lived experience, service providers, policy makers). Identifies where expert consensus diverges from community perspectives.

### Domain Batching

Indicators grouped by domain to reduce cognitive load. Panelists complete one domain at a time with progress tracking.

### Plain Language Mode

Simplified indicator descriptions for non-technical panelists (configurable per-panelist).

## API Reference

### Authentication

- `POST /api/auth/magic-link` - Request login link
- `POST /api/auth/verify` - Verify token and create session

### Studies

- `GET /api/study` - List all studies
- `POST /api/study` - Create study with indicators
- `POST /api/study/[id]/actions` - Manage round lifecycle

### Responses

- `GET /api/responses` - Get panelist responses
- `POST /api/responses` - Save/update response

### Export

- `GET /api/study/[id]/export?format=csv|json` - Export results

## Development

```bash
# Run development server with hot reload
npm run dev

# Generate Prisma client after schema changes
npm run db:generate

# Create migration
npm run db:migrate

# Open Prisma Studio (database GUI)
npm run db:studio

# Type checking
npx tsc --noEmit
```

## Deployment

### Netlify Deployment (Recommended)

This project is configured for easy deployment to Netlify. See the comprehensive deployment guides:

📘 **[Netlify Deployment Guide](./NETLIFY_DEPLOYMENT.md)** - Complete step-by-step instructions

✅ **[Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)** - Quick checklist format

Key files for Netlify:
- `netlify.toml` - Netlify configuration
- `.nvmrc` - Node version specification (Node 20)
- `.env.netlify` - Environment variables template

### Quick Deployment Steps

1. **Set up external services** (PostgreSQL + SMTP)
2. **Choose deployment method**:
   - **Git-based** (recommended): Connect repository to Netlify
   - **Manual**: Build locally and drag & drop
3. **Configure environment variables** in Netlify dashboard
4. **Deploy!**

### General Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure production `DATABASE_URL`
- [ ] Set strong `NEXTAUTH_SECRET` (use `openssl rand -base64 32`)
- [ ] Configure SMTP for production emails
- [ ] Set correct `NEXTAUTH_URL` (your domain)
- [ ] Run `npm run db:migrate:deploy`
- [ ] Configure SSL/HTTPS
- [ ] Set up database backups

## TRACE Integration

The application logs all significant actions to an audit log table for potential integration with TRACE behavioral audit infrastructure:

- Study creation/modification
- Round lifecycle events
- Response submissions
- Login events

## Security Considerations

- Magic links expire after 24 hours
- Session cookies are HTTP-only and secure in production
- No passwords stored
- All data stays in your infrastructure
- Panelist data isolated per study

## License

Proprietary - Boreal Logic Inc. All rights reserved.

---

**Built for the Yukon Women's Coalition GBV Indicators Project**  
*Northern Recursive Infrastructure Lab (NRIL)*
