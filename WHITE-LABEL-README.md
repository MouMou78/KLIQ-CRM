# White Label CRM Template

A production-ready CRM template built with React 19, tRPC, and Tailwind CSS 4. Designed for rapid client deployment with full customization support.

---

## 🚀 Quick Start

### Demo Login

Try the template immediately with the demo account:

- **Email:** `demo@whitelabelcrm.com`
- **Password:** `demo123`

The demo account includes sample data:
- 3 accounts (companies)
- 4 contacts
- 3 deals
- Notes and calendar events

### First-Time Setup

1. **Import to Manus:**
   ```bash
   New Project → Import from GitHub → MouMou78/1twenty-crm-white-label-template
   ```

2. **Seed demo data:**
   ```bash
   pnpm seed:demo
   ```

3. **Customize branding:**
   - Update `VITE_APP_TITLE` in Manus Settings → Secrets
   - Upload logo via Manus Settings → General
   - Customize colors in `client/src/index.css`

4. **Deploy:**
   - Save checkpoint in Manus
   - Click "Publish" button
   - Configure custom domain in Manus Settings → Domains

---

## 📚 Documentation

- **[CLIENT-ONBOARDING.md](./CLIENT-ONBOARDING.md)** - Complete setup workflow for new clients
- **[CUSTOMIZATION-GUIDE.md](./CUSTOMIZATION-GUIDE.md)** - All customization options
- **[INTEGRATION-REMOVAL.md](./INTEGRATION-REMOVAL.md)** - Remove optional integrations
- **[TEMPLATE-CHECKLIST.md](./TEMPLATE-CHECKLIST.md)** - Deployment checklist

---

## ✨ Features

### Core CRM
- **Contacts & Accounts** - Full contact and company management
- **Deals Pipeline** - Visual deal tracking with stages
- **Calendar** - Event scheduling and management
- **Notes** - Attach notes to any entity
- **Email Templates** - Reusable email templates
- **Dashboard** - Analytics and reporting

### Optional Integrations
- **Amplemarket** - Lead sync and enrichment
- **Hunter.io** - Email finding and verification
- **Google Maps** - Location and mapping features
- **AI Chat** - Built-in AI assistant

### Technical Features
- **tRPC** - End-to-end type safety
- **Manus Auth** - OAuth authentication
- **MySQL Database** - Drizzle ORM
- **S3 Storage** - File uploads
- **Email Sending** - Nodemailer integration
- **Dark Mode** - Full theme support

---

## 🛠️ Technology Stack

### Frontend
- React 19.2.1
- Vite 7.1.7
- TailwindCSS 4.1.14
- Shadcn UI (Radix primitives)
- Wouter 3.3.5 (routing)
- tRPC 11.6.0

### Backend
- Express 4.21.2
- Drizzle ORM 0.44.5
- MySQL2 3.15.0
- tRPC 11.6.0
- JWT authentication

### Development
- TypeScript 5.9.3
- Vitest 2.1.4
- Prettier 3.6.2
- PNPM 10.15.1

---

## 📦 Project Structure

```
white-label-crm/
├── client/
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable UI
│   │   ├── lib/           # Utilities
│   │   └── hooks/         # Custom hooks
│   └── public/            # Static assets
├── server/
│   ├── routers.ts         # tRPC procedures
│   ├── db.ts              # Database queries
│   └── _core/             # Framework code
├── drizzle/
│   └── schema.ts          # Database schema
└── shared/                # Shared types
```

---

## 🎨 Customization

### Branding
1. **App Title:** Manus Settings → Secrets → `VITE_APP_TITLE`
2. **Logo:** Manus Settings → General → Upload logo
3. **Colors:** Edit `client/src/index.css` CSS variables
4. **Favicon:** Replace `client/public/favicon.ico`

### Features
- **Remove integrations:** See [INTEGRATION-REMOVAL.md](./INTEGRATION-REMOVAL.md)
- **Add custom fields:** Update `drizzle/schema.ts` and run migrations
- **Custom pages:** Add to `client/src/pages/` and register in `App.tsx`

### Database
- **Schema changes:** Edit `drizzle/schema.ts`
- **Generate migration:** `pnpm drizzle-kit generate`
- **Apply migration:** Use Manus `webdev_execute_sql` tool

---

## 🔐 Security

- **Authentication:** Manus OAuth (JWT-based)
- **Password hashing:** Bcrypt
- **Session management:** HTTP-only cookies
- **CORS:** Configured for production
- **Environment variables:** Never commit `.env` files

---

## 📝 Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm test         # Run tests
pnpm check        # TypeScript type check
pnpm format       # Format code
pnpm seed:demo    # Seed demo user and data
pnpm db:push      # Generate and apply migrations
```

---

## 🚢 Deployment

### Via Manus (Recommended)
1. Save checkpoint: Manus → Save Checkpoint
2. Publish: Manus → Publish button
3. Custom domain: Manus Settings → Domains

### External Hosting
See [CLIENT-ONBOARDING.md](./CLIENT-ONBOARDING.md) for external deployment options.

---

## 📄 License

MIT License - Free for commercial use

---

## 🤝 Support

For template support:
- **Documentation:** See guides in this repository
- **Issues:** Open a GitHub issue
- **Manus Support:** https://help.manus.im

---

## 🎯 Client Onboarding Workflow

1. **Clone template** - Use GitHub "Use this template" button
2. **Import to Manus** - Create new project from GitHub
3. **Customize** - Branding, colors, features
4. **Seed data** - Run `pnpm seed:demo` or add client data
5. **Test** - Verify all features work
6. **Deploy** - Save checkpoint and publish
7. **Domain** - Configure client's custom domain

**Estimated setup time:** 2-4 hours per client

---

## 📊 What's Included

- ✅ Complete CRM functionality
- ✅ Authentication and authorization
- ✅ Database schema and migrations
- ✅ File upload and storage
- ✅ Email sending
- ✅ Dark mode
- ✅ Responsive design
- ✅ Type-safe API
- ✅ Unit tests
- ✅ Production-ready build
- ✅ Demo account with sample data
- ✅ Comprehensive documentation

---

**Version:** 1.0.0  
**Last Updated:** February 11, 2026  
**Template Repository:** https://github.com/MouMou78/1twenty-crm-white-label-template
