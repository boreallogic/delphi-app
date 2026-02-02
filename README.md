# GBV Indicator Framework - Delphi Study Application

**Version 2.0** - Clean rebuild with simplified UX

Expert consensus application for validating gender-based violence indicators in northern and rural communities.

Yukon University + Yukon Status of Women Council
SSHRC Funded | Boreal Logic Inc.

---

## Quick Start

```bash
# 1. Start database
npm run docker:up

# 2. Install dependencies
npm install

# 3. Set up database
cp .env.example .env
npm run db:push
npm run db:seed

# 4. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/           # Magic link auth endpoints
│   │   └── responses/      # Save panelist responses
│   ├── auth/               # Auth pages
│   ├── study/              # Panelist interface
│   │   └── indicator/[id]/ # Individual indicator assessment
│   ├── globals.css         # Clean styles
│   ├── layout.tsx
│   └── page.tsx            # Login
├── lib/
│   ├── auth.ts             # Session management (HMAC signed)
│   ├── db.ts               # Prisma client
│   └── email.ts            # Magic link emails
prisma/
├── schema.prisma           # Database schema
└── seed.ts                 # Demo data
data/
├── indicators_revised.csv  # Current indicator set
└── indicator_evidence.json # Evidence base
```

---

## Key Features

- **Card-based overview**: All indicators organized by domain
- **Click-to-assess**: Open any indicator for detailed rating
- **Auto-save**: Responses save automatically
- **Magic link auth**: Passwordless login via email
- **Progress tracking**: Visual progress through indicator set
- **Dissent flagging**: Record formal disagreement with consensus

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Database | PostgreSQL 16 |
| ORM | Prisma |
| Auth | Magic links (HMAC signed sessions) |
| Styling | Tailwind CSS |

---

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:seed` | Seed demo data |
| `npm run import:csv` | Import indicators from CSV |
| `npm run docker:up` | Start Postgres container |

---

## Environment Variables

```env
DATABASE_URL="postgresql://postgres:delphidev@localhost:5432/delphi"
SESSION_SECRET="generate-with-openssl-rand-hex-32"
NEXTAUTH_URL="http://localhost:3000"
```

For production, also configure SMTP:
```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-user
SMTP_PASS=your-pass
SMTP_FROM="GBV Study <study@example.com>"
```

---

## Deployment

1. Set `NODE_ENV=production`
2. Generate strong `SESSION_SECRET`: `openssl rand -hex 32`
3. Configure SMTP for email
4. Run `npm run db:migrate:deploy`
5. Run `npm run build && npm start`

---

## Previous Version

The v1 codebase is preserved in the `archive/v1-original-build` branch.

---

Boreal Logic Inc. | Yukon University | YSWC
