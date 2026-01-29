# Production Deployment Guide

## Overview

This guide will help you deploy the Delphi App to production using Docker. The application is production-ready with all security fixes in place.

**Deployment Method**: Docker Compose
**Estimated Time**: 15-30 minutes
**Prerequisites**: Docker and Docker Compose installed

---

## 📋 Pre-Deployment Checklist

### 1. Security Requirements

- [ ] Generate strong `NEXTAUTH_SECRET`: `openssl rand -base64 32`
- [ ] Set secure database password (min 20 characters)
- [ ] Configure production SMTP credentials
- [ ] Create facilitator account for admin access
- [ ] Set up SSL/HTTPS (strongly recommended)

### 2. Environment Configuration

- [ ] Copy `.env.production` to `.env.production.local`
- [ ] Fill in all required values in `.env.production.local`
- [ ] Verify DATABASE_URL format
- [ ] Verify NEXTAUTH_URL matches your domain

### 3. Infrastructure

- [ ] Server with Docker installed
- [ ] Minimum 2GB RAM, 2 CPU cores
- [ ] 20GB disk space
- [ ] Ports 80 and 443 available (for reverse proxy)
- [ ] Domain name configured (optional but recommended)

### 4. SMTP Email

- [ ] SMTP provider account (SendGrid, AWS SES, Mailgun, etc.)
- [ ] SMTP credentials ready
- [ ] Test email delivery from server
- [ ] Configure SPF/DKIM records (recommended)

---

## 🚀 Deployment Steps

### Step 1: Configure Environment

1. **Copy the production environment template:**
```bash
cp .env.production .env.production.local
```

2. **Edit the configuration:**
```bash
nano .env.production.local
```

3. **Required configurations:**

```bash
# Database - Use a strong password
DATABASE_URL="postgresql://postgres:YOUR_SECURE_PASSWORD@db:5432/delphi"
DB_PASSWORD="YOUR_SECURE_PASSWORD"

# Authentication - Generate with: openssl rand -base64 32
NEXTAUTH_SECRET="YOUR_32_CHAR_SECRET"
NEXTAUTH_URL="https://yourdomain.com"  # Your actual domain

# SMTP Email
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="apikey"
SMTP_PASS="YOUR_SENDGRID_API_KEY"
EMAIL_FROM="Delphi Study <noreply@yourdomain.com>"
```

4. **Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### Step 2: Deploy with Script

Run the automated deployment script:

```bash
./scripts/deploy-production.sh
```

This script will:
1. ✅ Verify environment configuration
2. ✅ Build Docker images
3. ✅ Start database
4. ✅ Run migrations
5. ✅ Start application

**Expected output:**
```
=========================================
Deployment Complete!
=========================================

Application is running at: https://yourdomain.com
```

### Step 3: Create Facilitator Account

After deployment, create your first admin account:

```bash
docker-compose exec app npm run create-facilitator
```

Follow the prompts to create your facilitator account.

### Step 4: Verify Deployment

1. **Check application status:**
```bash
docker-compose ps
```

Expected output:
```
NAME                STATUS              PORTS
delphi-app-app-1    Up 2 minutes        0.0.0.0:3000->3000/tcp
delphi-app-db-1     Up 2 minutes        0.0.0.0:5432->5432/tcp
```

2. **Check application logs:**
```bash
docker-compose logs -f app
```

Look for: `✓ Ready in XXXms`

3. **Test the application:**
- Visit: `http://your-server-ip:3000`
- Login at: `/admin/login`
- Test facilitator access
- Request magic link as panelist

---

## 🔒 Setting Up HTTPS (Recommended)

### Option 1: Using Nginx Reverse Proxy

1. **Install Nginx and Certbot:**
```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx
```

2. **Create Nginx configuration:**
```bash
sudo nano /etc/nginx/sites-available/delphi
```

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. **Enable the site:**
```bash
sudo ln -s /etc/nginx/sites-available/delphi /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

4. **Get SSL certificate:**
```bash
sudo certbot --nginx -d yourdomain.com
```

5. **Update NEXTAUTH_URL in .env.production.local:**
```bash
NEXTAUTH_URL="https://yourdomain.com"
```

6. **Restart the application:**
```bash
docker-compose restart app
```

### Option 2: Using Caddy (Automatic HTTPS)

1. **Install Caddy:**
```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

2. **Create Caddyfile:**
```bash
sudo nano /etc/caddy/Caddyfile
```

```
yourdomain.com {
    reverse_proxy localhost:3000
}
```

3. **Restart Caddy:**
```bash
sudo systemctl restart caddy
```

Caddy automatically handles SSL certificates via Let's Encrypt!

---

## 📊 Post-Deployment Tasks

### 1. Seed Demo Data (Optional)

If you want to test with demo data:

```bash
docker-compose exec app npm run db:seed
```

This creates:
- 1 demo study
- 50 GBV indicators
- 6 sample panelists

**⚠️ Note**: Only use this in development/testing. Do NOT seed production data.

### 2. Create Your First Study

1. Log in as facilitator
2. Navigate to "Create New Study"
3. Upload your indicators CSV
4. Configure study settings
5. Add panelists
6. Send invitations

### 3. Set Up Backups

**Database backups** (recommended daily):

```bash
# Backup script
docker-compose exec db pg_dump -U postgres delphi > backup-$(date +%Y%m%d).sql

# Restore from backup
docker-compose exec -T db psql -U postgres delphi < backup-20260128.sql
```

**Automated backup cron job:**

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /path/to/delphi-app && docker-compose exec db pg_dump -U postgres delphi > backups/backup-$(date +\%Y\%m\%d).sql
```

### 4. Monitor Application

**View logs in real-time:**
```bash
docker-compose logs -f app
```

**View database logs:**
```bash
docker-compose logs -f db
```

**Check resource usage:**
```bash
docker stats
```

### 5. Configure Rate Limiting (Optional)

For production with multiple instances, use Redis:

1. **Add Redis to docker-compose.yml:**
```yaml
services:
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  redis_data:
```

2. **Update .env.production.local:**
```bash
REDIS_URL="redis://redis:6379"
```

3. **Restart application:**
```bash
docker-compose restart app
```

---

## 🔧 Maintenance

### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose build --no-cache
docker-compose down
docker-compose up -d

# Run any new migrations
docker-compose --profile migrate up migrate
```

### Scale Application

To run multiple app instances:

```bash
docker-compose up -d --scale app=3
```

**⚠️ Note**: Requires load balancer (Nginx/Caddy) and Redis for rate limiting.

### Restart Services

```bash
# Restart app only
docker-compose restart app

# Restart all services
docker-compose restart

# Full restart (clears containers)
docker-compose down && docker-compose up -d
```

### View Container Status

```bash
# List running containers
docker-compose ps

# Detailed status
docker-compose ps -a

# Resource usage
docker stats
```

---

## 🐛 Troubleshooting

### Application Won't Start

**Check logs:**
```bash
docker-compose logs app
```

**Common issues:**
- Database not ready → Wait 30 seconds, restart app
- Missing environment variables → Check .env.production.local
- Port 3000 in use → Check `docker-compose ps` or `lsof -i :3000`

### Database Connection Errors

**Check database status:**
```bash
docker-compose logs db
```

**Test connection:**
```bash
docker-compose exec db psql -U postgres -d delphi -c "SELECT 1;"
```

**Reset database (⚠️ DESTRUCTIVE):**
```bash
docker-compose down -v  # Deletes volumes!
docker-compose up -d db
docker-compose --profile migrate up migrate
```

### Email Not Sending

**Test SMTP connection:**
```bash
# Inside app container
docker-compose exec app node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});
transporter.verify().then(console.log).catch(console.error);
"
```

**Common issues:**
- Wrong SMTP credentials → Verify with provider
- Firewall blocking port 587 → Check server firewall
- SPF/DKIM not configured → Configure DNS records

### High Memory Usage

**Check container resources:**
```bash
docker stats
```

**Increase container limits in docker-compose.yml:**
```yaml
app:
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 2G
```

### Cannot Access Application

1. **Check firewall:**
```bash
sudo ufw status
sudo ufw allow 3000/tcp  # If using port 3000 directly
sudo ufw allow 80/tcp    # For HTTP
sudo ufw allow 443/tcp   # For HTTPS
```

2. **Check Nginx/Caddy status:**
```bash
sudo systemctl status nginx
# or
sudo systemctl status caddy
```

3. **Check application port:**
```bash
curl http://localhost:3000
```

---

## 📈 Performance Optimization

### Enable Redis Caching

See "Configure Rate Limiting" section above.

### Database Connection Pooling

Already configured in Prisma. For high traffic:

```bash
# In .env.production.local
DATABASE_URL="postgresql://postgres:password@db:5432/delphi?connection_limit=20"
```

### Enable Compression

Nginx automatically enables gzip. For Caddy, it's automatic.

### Monitor Performance

Use Docker stats:
```bash
docker stats --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

---

## 🔐 Security Best Practices

### ✅ Already Implemented
- ✅ Authentication on all endpoints
- ✅ Session expiry enforcement
- ✅ Input validation (Zod schemas)
- ✅ Rate limiting (with Redis)
- ✅ Bcrypt password hashing
- ✅ CSRF protection (Next.js)
- ✅ SQL injection prevention (Prisma)

### 🔒 Additional Recommendations

1. **Use HTTPS** - Encrypt all traffic
2. **Firewall** - Only expose ports 80, 443, 22
3. **Regular Updates** - Keep Docker images updated
4. **Database Backups** - Daily automated backups
5. **Monitoring** - Set up error tracking (Sentry)
6. **Logs** - Centralized logging (ELK, Grafana)
7. **Secrets** - Use Docker secrets or vault for sensitive data

---

## 📞 Support & Resources

### Documentation
- `README.md` - Project overview
- `SECURITY_FIXES.md` - Security implementation
- `IMPROVEMENTS_SUMMARY.md` - Architecture improvements
- `claude.md` - Developer guide

### Logs Location
- Application: `docker-compose logs app`
- Database: `docker-compose logs db`
- Nginx: `/var/log/nginx/`

### Quick Commands Reference

```bash
# Deploy
./scripts/deploy-production.sh

# View logs
docker-compose logs -f app

# Restart
docker-compose restart app

# Create facilitator
docker-compose exec app npm run create-facilitator

# Backup database
docker-compose exec db pg_dump -U postgres delphi > backup.sql

# Update application
git pull && docker-compose build && docker-compose up -d

# Stop everything
docker-compose down

# Stop and remove volumes (⚠️ DESTRUCTIVE)
docker-compose down -v
```

---

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] Configure .env.production.local
- [ ] Generate NEXTAUTH_SECRET
- [ ] Set secure database password
- [ ] Configure SMTP credentials
- [ ] Verify Docker installed
- [ ] Domain DNS configured (if using)

### Deployment
- [ ] Run deployment script
- [ ] Verify containers running
- [ ] Check application logs
- [ ] Create facilitator account
- [ ] Test facilitator login
- [ ] Test panelist magic link flow

### Post-Deployment
- [ ] Set up HTTPS (Nginx/Caddy)
- [ ] Configure firewall rules
- [ ] Set up database backups
- [ ] Test email delivery
- [ ] Create first study
- [ ] Add panelists
- [ ] Monitor for 24 hours

### Optional
- [ ] Set up Redis for rate limiting
- [ ] Configure monitoring/alerting
- [ ] Set up log aggregation
- [ ] Enable CDN (if applicable)
- [ ] Performance testing

---

## 🎉 You're All Set!

Your Delphi App is now deployed and ready for production use.

**Security Status**: ✅ Production-ready with all critical fixes
**Performance**: ✅ Optimized for production workloads
**Monitoring**: ✅ Logging and health checks enabled
**Backups**: 🟡 Remember to configure automated backups

**Questions?** Check the documentation or logs for troubleshooting.

---

**Deployment Version**: 1.1.0-security
**Last Updated**: 2026-01-28
**Status**: ✅ Production Ready
