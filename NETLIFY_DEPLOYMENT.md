# Netlify Deployment Guide - Delphi App

This guide will help you deploy the Delphi Method application to Netlify.

## ⚠️ Important Prerequisites

This is a **full-stack application** with server-side requirements. You **CANNOT** use simple drag-and-drop deployment without first setting up:

1. **PostgreSQL Database** (external service required)
2. **SMTP Email Service** (for magic link authentication)
3. **Environment Variables** (configured in Netlify)

## Quick Start - Two Deployment Methods

### Method 1: Git-Based Deployment (Recommended)

This is the easiest method as it enables automatic deployments on git push.

1. **Push your code to GitHub/GitLab/Bitbucket**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Connect to Netlify**
   - Go to [Netlify](https://app.netlify.com/)
   - Click "Add new site" → "Import an existing project"
   - Connect your Git provider and select the repository
   - Netlify will auto-detect the Next.js configuration

3. **Configure environment variables** (see section below)

4. **Deploy!** - Netlify will build and deploy automatically

### Method 2: Manual Drag & Drop Deployment

⚠️ **Important**: You must build the project locally first before drag & drop.

#### Step 1: Set up External Services

**A. PostgreSQL Database**

Choose one of these providers:
- **Neon** (https://neon.tech) - Free tier available, serverless PostgreSQL
- **Supabase** (https://supabase.com) - Free tier, full backend
- **Railway** (https://railway.app) - Simple PostgreSQL hosting
- **Vercel Postgres** (https://vercel.com/storage/postgres)

After creating your database, copy the connection string (looks like: `postgresql://user:password@host:5432/database`)

**B. SMTP Email Service**

Choose one of these providers:
- **Resend** (https://resend.com) - Modern, developer-friendly
- **SendGrid** (https://sendgrid.com) - Popular choice
- **Amazon SES** - Low cost, reliable
- **Mailgun** - Easy setup

Get your SMTP credentials (host, port, username, password).

#### Step 2: Build Locally

1. **Install Node 20** (if not already installed)
   ```bash
   # Using nvm (recommended)
   nvm install 20
   nvm use 20

   # Or download from https://nodejs.org/
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create .env file** (for local build only)
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your database URL:
   ```
   DATABASE_URL="postgresql://user:password@host:5432/database"
   ```

4. **Generate Prisma client and build**
   ```bash
   npm run db:generate
   npm run db:push  # Push schema to your database
   npm run build
   ```

5. **Create deployment package**
   ```bash
   # Zip the necessary files for Netlify
   zip -r netlify-deploy.zip .next public package.json package-lock.json netlify.toml next.config.js prisma node_modules/.prisma
   ```

#### Step 3: Deploy to Netlify

1. Go to [Netlify](https://app.netlify.com/)
2. Drag and drop your **netlify-deploy.zip** file onto the Netlify dashboard
3. OR: Click "Add new site" → "Deploy manually" and drop the folder

#### Step 4: Configure Environment Variables in Netlify

After deployment, you MUST set these environment variables:

1. Go to: **Site settings** → **Environment variables** → **Add a variable**

2. Add these required variables:

```
DATABASE_URL=postgresql://user:password@host:5432/database
NEXTAUTH_URL=https://your-app-name.netlify.app
NEXTAUTH_SECRET=<generate-a-secret>
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
EMAIL_FROM=noreply@yourdomain.com
```

3. **Generate NEXTAUTH_SECRET**:
   ```bash
   openssl rand -base64 32
   ```
   Copy the output and use it as NEXTAUTH_SECRET.

#### Step 5: Trigger Redeploy

After setting environment variables:
1. Go to **Deploys** tab
2. Click **Trigger deploy** → **Deploy site**
3. Wait for build to complete

## Environment Variables Reference

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` | ✅ Yes |
| `NEXTAUTH_URL` | Your Netlify app URL | `https://yourapp.netlify.app` | ✅ Yes |
| `NEXTAUTH_SECRET` | Secret for session signing | Generated with openssl | ✅ Yes |
| `SMTP_HOST` | SMTP server hostname | `smtp.resend.com` | ✅ Yes |
| `SMTP_PORT` | SMTP server port | `587` | ✅ Yes |
| `SMTP_SECURE` | Use TLS | `false` | No |
| `SMTP_USER` | SMTP username | Your SMTP username | ✅ Yes |
| `SMTP_PASS` | SMTP password | Your SMTP password | ✅ Yes |
| `EMAIL_FROM` | From email address | `noreply@yourdomain.com` | No |
| `NODE_ENV` | Environment | `production` | Auto-set |

## Post-Deployment Steps

### 1. Run Database Migrations

After first deployment, you may need to run migrations:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Link to your site
netlify link

# Run migration via Netlify CLI
netlify env:import .env  # If you have local .env
```

Or connect to your database directly and run:
```bash
npx prisma migrate deploy
```

### 2. Test Authentication

1. Visit your Netlify URL
2. Try to log in with an email
3. Check that magic link emails are sent
4. Verify you can log in

### 3. Optional: Seed Demo Data

If you want demo data for testing:
```bash
netlify dev  # Run local dev environment connected to Netlify
npm run db:seed
```

## Troubleshooting

### Build Fails

**Error: Cannot find module '@prisma/client'**
- Solution: Ensure `npm run db:generate` runs before build
- Check netlify.toml has correct build command

**Error: Node version incompatible**
- Solution: Ensure .nvmrc specifies Node 20
- Check netlify.toml has NODE_VERSION = "20"

### Database Connection Fails

**Error: Can't reach database server**
- Check DATABASE_URL is correct in Netlify environment variables
- Verify your database service allows connections from Netlify IPs
- Some services require IP whitelisting - check provider docs

### Email Not Sending

**Magic links not arriving**
- Check SMTP credentials are correct in Netlify environment
- Verify SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
- Check spam folder
- Try using a test service like Ethereal Email first

### 500 Internal Server Error

**After successful deployment**
- Check Netlify function logs: Site → Functions → View logs
- Common causes:
  - Missing environment variables
  - Database connection issue
  - NEXTAUTH_SECRET not set

### Prisma Client Not Found

**Error during runtime**
- Solution: Redeploy with proper build command
- Ensure `npm run db:generate` is in build command
- Check node_modules/.prisma is included in deployment

## Performance Optimization

### Database

- Use connection pooling (Prisma supports this with Neon, Supabase)
- Add database indexes for frequently queried fields
- Consider using Prisma Accelerate for caching

### Next.js

- Images: Use Next.js Image component for optimization
- Enable caching headers in netlify.toml
- Consider edge functions for better global performance

## Security Checklist

- [ ] NEXTAUTH_SECRET is strong and unique (32+ characters)
- [ ] DATABASE_URL is not exposed in client-side code
- [ ] SMTP credentials are environment variables only
- [ ] HTTPS is enabled (automatic on Netlify)
- [ ] Database allows connections only from necessary IPs
- [ ] Email rate limiting is configured (via your SMTP provider)

## Custom Domain Setup

1. Go to **Site settings** → **Domain management**
2. Click **Add custom domain**
3. Follow Netlify's DNS configuration instructions
4. Update NEXTAUTH_URL environment variable to your custom domain
5. Redeploy

## Monitoring & Logs

- **Build logs**: Deploys tab → Click on a deploy
- **Function logs**: Functions tab → Select function → View logs
- **Error tracking**: Consider adding Sentry or similar
- **Database monitoring**: Use your database provider's dashboard

## Costs to Consider

| Service | Free Tier | Paid Plans |
|---------|-----------|------------|
| Netlify | 100GB bandwidth/mo | $19+/mo |
| Neon (DB) | 512MB storage | $19+/mo |
| Resend (Email) | 100 emails/day | $20+/mo |

**Estimated total for small project**: $0-20/month depending on usage.

## Support Resources

- **Netlify Docs**: https://docs.netlify.com/
- **Next.js on Netlify**: https://docs.netlify.com/integrations/frameworks/next-js/
- **Prisma Docs**: https://www.prisma.io/docs
- **NextAuth Docs**: https://authjs.dev/

## Common Questions

**Q: Can I use Netlify's built-in PostgreSQL?**
A: Netlify doesn't provide PostgreSQL. Use external services like Neon or Supabase.

**Q: Will automatic deployments work?**
A: Yes! If using Git-based deployment, Netlify auto-deploys on push to main branch.

**Q: Can I use this with Netlify's free tier?**
A: Yes, for development and small-scale projects. Monitor bandwidth usage.

**Q: How do I update the app after changes?**
A:
- Git method: Just push to your repo
- Manual method: Rebuild locally and re-upload

**Q: Can I preview branches?**
A: Yes! Netlify creates preview deployments for pull requests automatically (Git method only).

---

**Need Help?** Check the main README.md or open an issue in the repository.
