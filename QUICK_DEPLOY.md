# KLIQ CRM - Quick Deploy to Railway (5 Minutes)

## 🚀 Fast Track Deployment

### Step 1: Database (2 minutes)
1. Go to [Railway](https://railway.app/dashboard)
2. Click **"New Project"** → **"Provision MySQL"**
3. Copy the **DATABASE_URL** from MySQL plugin

### Step 2: Deploy App (2 minutes)
1. Click **"New Project"** → **"Deploy from GitHub repo"**
2. Select **"MouMou78/KLIQ-CRM"**
3. Add environment variables:
   ```
   DATABASE_URL=<paste from step 1>
   NODE_ENV=production
   SESSION_SECRET=<any random string>
   ```
4. Wait for deployment (~2 minutes)

### Step 3: Initialize Database (1 minute)
1. In Railway CLI or dashboard, run:
   ```bash
   railway run pnpm db:push
   ```

### Step 4: Map Subdomain
1. Railway → **Settings** → **Domains** → **Custom Domain**
2. Enter: `crm.yourdomain.com`
3. Add CNAME record in your DNS:
   ```
   Type: CNAME
   Name: crm
   Value: <your-railway-url>.railway.app
   ```

### Step 5: Done! ✅
Visit `https://crm.yourdomain.com`

---

## 🆘 Need Help?
See full guide: [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)
