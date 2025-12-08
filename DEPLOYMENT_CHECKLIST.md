# Netlify Deployment Checklist

Use this checklist to ensure you've completed all steps for successful deployment.

## Pre-Deployment Setup

### 1. External Services Setup
- [ ] **PostgreSQL Database** - Set up database on:
  - [ ] Neon (https://neon.tech) *recommended for serverless*
  - [ ] Supabase (https://supabase.com)
  - [ ] Railway (https://railway.app)
  - [ ] Other PostgreSQL provider
- [ ] Copy database connection string (DATABASE_URL)

- [ ] **SMTP Email Service** - Set up email service:
  - [ ] Resend (https://resend.com) *recommended*
  - [ ] SendGrid
  - [ ] Amazon SES
  - [ ] Mailgun
  - [ ] Other SMTP provider
- [ ] Get SMTP credentials (host, port, username, password)

### 2. Generate Secrets
- [ ] Generate NEXTAUTH_SECRET:
  ```bash
  openssl rand -base64 32
  ```
- [ ] Save the generated secret for later use

### 3. Prepare Project Files
- [ ] All files are in the delphi-app folder
- [ ] `.nvmrc` file exists (specifies Node 20)
- [ ] `netlify.toml` file exists
- [ ] `next.config.js` is updated for Netlify
- [ ] `package.json` has compatible dependencies

## Deployment Method A: Git-Based (Recommended)

### Step 1: Push to Git Repository
- [ ] Initialize git repository (if not already):
  ```bash
  git init
  ```
- [ ] Create repository on GitHub/GitLab/Bitbucket
- [ ] Add remote:
  ```bash
  git remote add origin <your-repo-url>
  ```
- [ ] Commit and push:
  ```bash
  git add .
  git commit -m "Prepare for Netlify deployment"
  git push -u origin main
  ```

### Step 2: Connect to Netlify
- [ ] Go to https://app.netlify.com/
- [ ] Click "Add new site" → "Import an existing project"
- [ ] Choose your Git provider
- [ ] Select the repository
- [ ] Netlify auto-detects Next.js settings
- [ ] Click "Deploy site"

### Step 3: Configure Environment Variables
- [ ] Go to: Site settings → Environment variables
- [ ] Add each variable from `.env.netlify`:
  - [ ] DATABASE_URL
  - [ ] NEXTAUTH_URL (use your Netlify URL: `https://yourapp.netlify.app`)
  - [ ] NEXTAUTH_SECRET
  - [ ] SMTP_HOST
  - [ ] SMTP_PORT
  - [ ] SMTP_SECURE
  - [ ] SMTP_USER
  - [ ] SMTP_PASS
  - [ ] EMAIL_FROM

### Step 4: Trigger Redeploy
- [ ] Go to Deploys tab
- [ ] Click "Trigger deploy" → "Deploy site"
- [ ] Wait for deployment to complete
- [ ] Check build logs for any errors

## Deployment Method B: Manual Drag & Drop

### Step 1: Local Build
- [ ] Install Node 20:
  ```bash
  nvm install 20 && nvm use 20
  ```
  Or download from https://nodejs.org/

- [ ] Install dependencies:
  ```bash
  npm install
  ```

- [ ] Create `.env` file with your DATABASE_URL:
  ```bash
  cp .env.example .env
  # Edit .env with your database URL
  ```

- [ ] Generate Prisma client and build:
  ```bash
  npm run db:generate
  npm run db:push
  npm run build
  ```

- [ ] Create deployment zip:
  ```bash
  zip -r netlify-deploy.zip .next public package.json package-lock.json netlify.toml next.config.js prisma node_modules/.prisma
  ```

### Step 2: Upload to Netlify
- [ ] Go to https://app.netlify.com/
- [ ] Drag and drop `netlify-deploy.zip` onto dashboard
  OR
- [ ] Click "Add new site" → "Deploy manually"

### Step 3: Configure Environment Variables
- [ ] Same as Git method Step 3 above

### Step 4: Redeploy with Environment Variables
- [ ] Go to Deploys tab
- [ ] Click "Trigger deploy" → "Deploy site"

## Post-Deployment Verification

### Database Setup
- [ ] Run database migrations:
  ```bash
  npx prisma migrate deploy
  ```
  (Connect to your database directly or use Netlify CLI)

- [ ] (Optional) Seed demo data:
  ```bash
  npm run db:seed
  ```

### Testing
- [ ] Visit your Netlify URL
- [ ] Test user registration/login
- [ ] Verify magic link emails are received
- [ ] Check that you can log in successfully
- [ ] Test basic functionality (create study, add indicators, etc.)

### Security & Performance
- [ ] Verify HTTPS is enabled (automatic on Netlify)
- [ ] Check that environment variables are not exposed client-side
- [ ] Test email delivery (check spam folder too)
- [ ] Monitor Netlify function logs for errors

## Optional: Custom Domain

- [ ] Go to: Site settings → Domain management
- [ ] Click "Add custom domain"
- [ ] Follow DNS configuration instructions
- [ ] Update NEXTAUTH_URL environment variable to custom domain
- [ ] Redeploy site

## Monitoring

- [ ] Set up Netlify email notifications for deployment failures
- [ ] Monitor database usage on provider dashboard
- [ ] Monitor email sending limits
- [ ] Check Netlify bandwidth usage

## Troubleshooting

If deployment fails, check:
- [ ] Build logs in Netlify (Deploys → Click on deploy)
- [ ] Function logs (Functions tab)
- [ ] Database connection from Netlify (check firewall rules)
- [ ] All environment variables are set correctly
- [ ] NEXTAUTH_SECRET is set
- [ ] Database migrations have run

Common issues:
- [ ] "Cannot find module @prisma/client" → Ensure build command includes `npm run db:generate`
- [ ] "Database connection failed" → Check DATABASE_URL and database firewall
- [ ] "Magic links not working" → Verify SMTP credentials and NEXTAUTH_URL
- [ ] "500 errors" → Check function logs for specific errors

## Success Criteria

Your deployment is successful when:
- [x] Build completes without errors
- [x] Site loads at Netlify URL
- [x] Can access login page
- [x] Magic link emails are received
- [x] Can log in with magic link
- [x] Facilitator dashboard loads
- [x] Can create a study (if you have facilitator access)
- [x] Database operations work correctly

---

📚 **Need more details?** See [NETLIFY_DEPLOYMENT.md](./NETLIFY_DEPLOYMENT.md) for comprehensive guide.

🐛 **Having issues?** Check the Troubleshooting section in NETLIFY_DEPLOYMENT.md
