# Quick Deployment Guide

## 🚀 Deploy in 5 Minutes

### Prerequisites
- Docker and Docker Compose installed
- SMTP credentials (SendGrid, AWS SES, or similar)
- A domain name (optional but recommended)

---

## Step 1: Configure Environment (2 minutes)

```bash
# 1. Copy the environment template
cp .env.production .env.production.local

# 2. Edit with your values
nano .env.production.local
```

**Minimum required:**
```bash
# Generate this: openssl rand -base64 32
NEXTAUTH_SECRET="your-32-character-secret"

# Your domain or IP
NEXTAUTH_URL="https://yourdomain.com"

# Your SMTP credentials
SMTP_HOST="smtp.sendgrid.net"
SMTP_USER="apikey"
SMTP_PASS="your-sendgrid-api-key"
```

---

## Step 2: Deploy (1 minute)

```bash
./scripts/deploy-production.sh
```

That's it! The script will:
- ✅ Build Docker images
- ✅ Start database
- ✅ Run migrations
- ✅ Start application

---

## Step 3: Create Admin Account (1 minute)

```bash
docker-compose exec app npm run create-facilitator
```

Enter your email and password when prompted.

---

## Step 4: Access Application (1 minute)

**Local deployment:**
- Visit: http://localhost:3000
- Login: http://localhost:3000/admin/login

**Production deployment:**
- Visit: https://yourdomain.com
- Login: https://yourdomain.com/admin/login

---

## Optional: Set Up HTTPS

### Using Caddy (Easiest - Automatic HTTPS)

```bash
# Install Caddy
sudo apt install caddy

# Create config
sudo nano /etc/caddy/Caddyfile
```

Add:
```
yourdomain.com {
    reverse_proxy localhost:3000
}
```

```bash
# Restart Caddy
sudo systemctl restart caddy
```

Done! Caddy handles SSL certificates automatically.

---

## Common Commands

```bash
# View logs
docker-compose logs -f app

# Restart application
docker-compose restart app

# Stop everything
docker-compose down

# Backup database
docker-compose exec db pg_dump -U postgres delphi > backup.sql
```

---

## Troubleshooting

### Can't connect to application
```bash
# Check if running
docker-compose ps

# Check logs
docker-compose logs app
```

### Database errors
```bash
# Check database
docker-compose logs db

# Test connection
docker-compose exec db psql -U postgres -d delphi -c "SELECT 1;"
```

### Email not sending
```bash
# Verify SMTP settings in .env.production.local
# Test from container:
docker-compose exec app node -e "console.log(process.env.SMTP_HOST)"
```

---

## Full Documentation

For complete deployment guide, see: **DEPLOYMENT_GUIDE.md**

---

## ✅ Deployment Checklist

- [ ] Configure .env.production.local
- [ ] Run deployment script
- [ ] Create facilitator account
- [ ] Test login
- [ ] Set up HTTPS (recommended)
- [ ] Configure backups

---

**Need help?** Check DEPLOYMENT_GUIDE.md or application logs.
