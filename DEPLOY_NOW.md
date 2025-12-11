# 🚀 Deploy to Netlify - Step by Step

## You're Ready! Here's What to Do:

### Step 1: Go to Netlify (2 minutes)

1. Open: **https://app.netlify.com/**
2. Click: **"Add new site"** → **"Import an existing project"**
3. Choose: **"GitHub"**
4. Select: **`boreallogic/delphi-app`** repository
5. Build settings (should auto-detect):
   - Build command: `npm run db:generate && npm run build`
   - Publish directory: `.next`
6. Click: **"Deploy site"**

⏱️ Wait 2-3 minutes for deployment to complete

---

### Step 2: Copy Your Netlify URL (30 seconds)

After deployment completes:
- You'll see a URL like: `https://magnificent-unicorn-123abc.netlify.app`
- **Copy this URL** - you'll need it in the next step

---

### Step 3: Add Environment Variables to Netlify (5 minutes)

1. In Netlify dashboard, go to: **Site settings → Environment variables**
2. Click: **"Add a variable"**
3. Add these **8 variables** (copy/paste from below):

---

**Variable 1:**
```
Key: DATABASE_URL
Value: postgresql://neondb_owner:npg_2JlduEs4yiDr@ep-sparkling-river-afg8ps68-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

**Variable 2:**
```
Key: NEXTAUTH_SECRET
Value: XOrW7o9/ho7HxNTDO69Yji17ISivtjypjSulGgDUGdg=
```

**Variable 3:**
```
Key: NEXTAUTH_URL
Value: YOUR-NETLIFY-URL-FROM-STEP-2
```
⚠️ Use the URL you copied in Step 2!

**Variable 4:**
```
Key: SMTP_HOST
Value: smtp.resend.com
```

**Variable 5:**
```
Key: SMTP_PORT
Value: 587
```

**Variable 6:**
```
Key: SMTP_SECURE
Value: false
```

**Variable 7:**
```
Key: SMTP_USER
Value: resend
```

**Variable 8:**
```
Key: SMTP_PASS
Value: re_bsS6X2dr_5H6ygauZXLH1ZaPxE4APza7t
```

**Variable 9:**
```
Key: EMAIL_FROM
Value: Delphi Study <noreply@boreallogic.ca>
```

---

### Step 4: Redeploy (2 minutes)

1. Go to: **Deploys** tab
2. Click: **"Trigger deploy"** → **"Deploy site"**
3. Wait for deployment to complete

---

### Step 5: Test Your App! 🎉

1. Visit your Netlify URL
2. You should see the Delphi app homepage
3. Click **"Login"** or go to `/auth/login`
4. Enter your email address
5. Check your email for the magic link
6. Click the link to log in

✅ **You're live!**

---

## Quick Checklist

- [ ] Deploy to Netlify (Step 1)
- [ ] Copy Netlify URL (Step 2)
- [ ] Add all 9 environment variables (Step 3)
- [ ] Trigger redeploy (Step 4)
- [ ] Test login with magic link (Step 5)

---

## Troubleshooting

**Build fails?**
- Check Netlify build logs for errors
- Verify Node version is set to 20 (should be automatic from .nvmrc)

**500 error when visiting site?**
- Make sure all environment variables are added
- Check Netlify function logs: Functions tab → View logs

**Magic link not arriving?**
- Check spam folder
- Verify SMTP credentials are correct
- Check Netlify function logs for email errors

**Database connection error?**
- Verify DATABASE_URL is correct
- Make sure Neon database is active

---

## What's Configured

✅ GitHub repository: https://github.com/boreallogic/delphi-app
✅ Neon PostgreSQL database (schema deployed)
✅ Resend email service (configured)
✅ Next.js 14 with App Router
✅ Prisma ORM
✅ NextAuth magic link authentication
✅ Tailwind CSS
✅ All environment variables ready

---

**Ready to deploy? Go to https://app.netlify.com/ and follow the steps above!**
