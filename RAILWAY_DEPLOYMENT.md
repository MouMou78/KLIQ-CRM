# KLIQ CRM - Railway Deployment Guide

This guide will help you deploy your KLIQ CRM application to Railway and map it to your custom subdomain.

---

## 📋 Prerequisites

- ✅ GitHub account (you have this)
- ✅ Railway account (you have this)
- ✅ Domain name (for subdomain mapping)
- ✅ Code pushed to GitHub repository

---

## 🚀 Step 1: Push Latest Code to GitHub

The latest optimized code is already in your repository:
- **Repository**: https://github.com/MouMou78/KLIQ-CRM
- **Branch**: main
- **Latest Commit**: Production build with lazy loading optimization

---

## 🗄️ Step 2: Set Up Database on Railway

### Option A: Use Railway's MySQL Plugin (Recommended)

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Provision MySQL"**
4. Railway will automatically create a MySQL database
5. Copy the **DATABASE_URL** (it will look like: `mysql://user:pass@host:port/railway`)

### Option B: Use Existing Database

If you have a MySQL database elsewhere:
- Get the connection string in this format:
  ```
  mysql://username:password@host:port/database_name
  ```

---

## 🚂 Step 3: Deploy to Railway

### 3.1 Create New Project from GitHub

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose **"MouMou78/KLIQ-CRM"** repository
5. Railway will automatically detect it's a Node.js project

### 3.2 Configure Environment Variables

In Railway project settings, add these environment variables:

#### Required Variables

```bash
# Database (from Step 2)
DATABASE_URL=mysql://user:password@host:port/database

# Node Environment
NODE_ENV=production

# Port (Railway provides this automatically, but you can set it)
PORT=3000

# Session Secret (generate a random string)
SESSION_SECRET=your-super-secret-random-string-here
```

#### Optional Variables (if you need these features)

```bash
# OAuth (if you want user authentication)
OAUTH_SERVER_URL=https://your-oauth-server.com
OAUTH_CLIENT_ID=your-client-id
OAUTH_CLIENT_SECRET=your-client-secret

# Email (if you want email notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@kliq.com

# AWS S3 (if you want file uploads)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

### 3.3 Deploy

1. Railway will automatically start building and deploying
2. Wait for the build to complete (~2-3 minutes)
3. You'll get a Railway URL like: `https://kliq-crm-production.up.railway.app`

---

## 🔧 Step 4: Initialize Database

After first deployment, you need to set up the database schema:

### Option A: Run Migrations via Railway CLI

1. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Login to Railway:
   ```bash
   railway login
   ```

3. Link to your project:
   ```bash
   railway link
   ```

4. Run database migrations:
   ```bash
   railway run pnpm db:push
   ```

### Option B: Run Migrations via Railway Dashboard

1. Go to your Railway project
2. Click on your service
3. Go to **"Settings"** → **"Deploy"**
4. Add a **"Custom Start Command"** temporarily:
   ```bash
   pnpm db:push && pnpm start
   ```
5. Redeploy
6. After database is initialized, change back to:
   ```bash
   pnpm start
   ```

---

## 🌐 Step 5: Map to Your Subdomain

### 5.1 Get Railway Domain

1. In Railway project, go to **"Settings"** → **"Domains"**
2. You'll see your Railway URL (e.g., `kliq-crm-production.up.railway.app`)

### 5.2 Add Custom Domain in Railway

1. In Railway project, go to **"Settings"** → **"Domains"**
2. Click **"Custom Domain"**
3. Enter your subdomain (e.g., `crm.kliq.com`)
4. Railway will show you DNS records to add

### 5.3 Configure DNS

Go to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.) and add:

#### Option A: CNAME Record (Recommended)
```
Type: CNAME
Name: crm (or your subdomain)
Value: kliq-crm-production.up.railway.app
TTL: 3600 (or Auto)
```

#### Option B: A Record (if CNAME doesn't work)
Railway will provide you with an IP address to use.

### 5.4 Wait for DNS Propagation

- DNS changes can take 5 minutes to 48 hours
- Usually propagates within 15-30 minutes
- Check status: https://dnschecker.org

---

## ✅ Step 6: Verify Deployment

### 6.1 Test Your Application

1. Visit your Railway URL: `https://kliq-crm-production.up.railway.app`
2. Visit your custom domain: `https://crm.kliq.com`
3. Check that:
   - ✅ Dashboard loads
   - ✅ Login works (or auth bypass works)
   - ✅ Database connection works
   - ✅ All pages load correctly

### 6.2 Check Performance

Your production build should show:
- ⚡ Load time: ~595ms
- ⚡ First paint: ~275ms
- ⚡ 19 total files
- ⚡ No hanging issues

---

## 🔒 Step 7: Security & Production Checklist

### Essential Security

- [ ] Change `SESSION_SECRET` to a strong random string
- [ ] Enable HTTPS (Railway does this automatically)
- [ ] Set `NODE_ENV=production`
- [ ] Disable auth bypass in production (remove `BYPASS_AUTH=true`)
- [ ] Set up proper OAuth or authentication

### Optional Enhancements

- [ ] Set up monitoring (Railway provides basic monitoring)
- [ ] Configure backup for database
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Configure CDN for static assets
- [ ] Set up staging environment

---

## 🔄 Step 8: Continuous Deployment

Railway automatically deploys when you push to GitHub:

1. Make changes to your code locally
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```
3. Railway automatically detects the push and redeploys
4. Wait ~2-3 minutes for deployment
5. Your changes are live!

---

## 📊 Railway Project Settings

### Recommended Settings

**Build Settings:**
- Build Command: `pnpm install && pnpm build`
- Start Command: `pnpm start`
- Watch Paths: `/**/*`

**Deployment Settings:**
- Auto Deploy: ✅ Enabled
- Branch: `main`
- Restart Policy: On Failure
- Max Retries: 10

**Resources:**
- Memory: 512 MB - 1 GB (adjust based on usage)
- CPU: Shared (upgrade if needed)

---

## 🐛 Troubleshooting

### Build Fails

**Error**: `pnpm: command not found`
- **Solution**: Add `nixpacks.toml` file (already included in repo)

**Error**: `Cannot find module`
- **Solution**: Make sure `pnpm install` runs before `pnpm build`

### Database Connection Fails

**Error**: `ECONNREFUSED` or `Access denied`
- **Solution**: Check `DATABASE_URL` is correct
- **Solution**: Make sure Railway MySQL plugin is running
- **Solution**: Check database credentials

### Application Won't Start

**Error**: `Port already in use`
- **Solution**: Railway sets `PORT` automatically, don't hardcode it

**Error**: `Module not found` in production
- **Solution**: Make sure dependencies are in `dependencies`, not `devDependencies`

### Custom Domain Not Working

**Error**: `DNS_PROBE_FINISHED_NXDOMAIN`
- **Solution**: Wait for DNS propagation (15-30 minutes)
- **Solution**: Check CNAME record is correct
- **Solution**: Use `dig crm.kliq.com` to verify DNS

---

## 💰 Railway Pricing

### Free Tier (Starter Plan)
- $5 free credit per month
- Enough for small projects
- Sleeps after inactivity

### Paid Plans
- **Developer**: $5/month + usage
- **Team**: $20/month + usage
- Pay only for what you use

### Estimated Costs for KLIQ CRM
- Small usage: ~$5-10/month
- Medium usage: ~$15-25/month
- Includes: Hosting + Database + Bandwidth

---

## 📞 Support

### Railway Support
- Documentation: https://docs.railway.app
- Discord: https://discord.gg/railway
- Help: help@railway.app

### KLIQ CRM Issues
- GitHub Issues: https://github.com/MouMou78/KLIQ-CRM/issues
- Check logs in Railway dashboard

---

## 🎯 Quick Reference

### Important URLs
- Railway Dashboard: https://railway.app/dashboard
- Your GitHub Repo: https://github.com/MouMou78/KLIQ-CRM
- Railway Docs: https://docs.railway.app

### Important Commands
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link to project
railway link

# View logs
railway logs

# Run migrations
railway run pnpm db:push

# Open project in browser
railway open
```

### Environment Variables Quick Copy
```bash
DATABASE_URL=mysql://user:password@host:port/database
NODE_ENV=production
PORT=3000
SESSION_SECRET=your-random-secret-here
```

---

## ✅ Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Railway project created
- [ ] MySQL database provisioned
- [ ] Environment variables configured
- [ ] Application deployed successfully
- [ ] Database migrations run
- [ ] Custom domain configured
- [ ] DNS records added
- [ ] Application tested and working
- [ ] Security settings reviewed
- [ ] Monitoring enabled

---

## 🎉 You're Done!

Your KLIQ CRM should now be live at:
- **Railway URL**: https://your-app.railway.app
- **Custom Domain**: https://crm.kliq.com

Enjoy your blazing-fast, production-ready CRM! 🚀

---

**Need Help?** Check the troubleshooting section or reach out for support.
