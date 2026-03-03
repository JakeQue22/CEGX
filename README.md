# CEGX — Production-Grade Procurement Pipeline CRM (GBP)

A full-stack, production-ready Procurement Pipeline CRM built for UK-based procurement companies. All financial values default to **GBP (£)** with full UK VAT (20%) support.

---

## ✨ Features

| Module | Capabilities |
|--------|-------------|
| **Sales Pipeline** | Kanban drag-and-drop, stage history, automations |
| **Deals** | Full financial snapshots — Revenue, Cost, Ad Spend, VAT, Gross Profit, Margin % |
| **Suppliers** | CRUD, rating, country filter, profitability view |
| **Products** | SKU, categories, bulk pricing tiers, profit calculator |
| **Email Campaigns** | Schedule via BullMQ, open tracking, unsubscribe handling |
| **Notifications** | Real-time bell (polling), unread badge, email triggers |
| **Analytics** | Revenue, profit, ad spend, margin by supplier/product, VAT liability — all in £ |
| **Settings** | Company branding, SMTP, VAT %, ad %, notification preferences |
| **RBAC** | Admin / Sales Manager / Procurement Officer / Viewer |
| **Global Search** | Across deals, suppliers, products, categories |
| **Follow-ups** | Reminders with notification + email trigger 24h before due |
| **Automations** | Rule engine: Deal Won → profit record, Follow-up due → notify, etc. |

---

## 🏗️ Tech Stack

### Backend
- **NestJS** (TypeScript) — modular, decorator-driven REST API
- **Prisma ORM** + **PostgreSQL** — fully normalised schema
- **Redis** — notification pub/sub, BullMQ job queues
- **BullMQ** — scheduled email campaigns, automation cron jobs
- **Nodemailer** — SMTP abstraction (config stored in DB)
- **JWT** (access + refresh tokens), **bcrypt**, **Helmet**, **rate-limiting**

### Frontend
- **Next.js 14** (App Router) — TypeScript
- **TailwindCSS** — dynamic brand colour via CSS variables
- **TanStack Query v5** — data fetching, caching, mutations
- **Zustand** — auth + settings state (persisted to localStorage)
- **Recharts** — analytics charts
- **@hello-pangea/dnd** — Kanban drag-and-drop

---

## 🗂️ Project Structure

```
CEGX/
├── backend/                    # NestJS API
│   ├── prisma/
│   │   ├── schema.prisma       # Complete DB schema (14 models)
│   │   └── seed.ts             # Seeds stages, admin user, settings
│   └── src/
│       ├── auth/               # JWT strategies, guards, decorators
│       ├── users/              # User CRUD (Admin only)
│       ├── settings/           # Company settings singleton
│       ├── suppliers/          # Supplier CRUD + profitability
│       ├── products/           # Products + bulk pricing tiers
│       ├── categories/         # Product categories
│       ├── pipeline/           # Pipeline stage configuration
│       ├── deals/              # Deals + auto financial calculation
│       ├── notifications/      # Notification service
│       ├── campaigns/          # Email campaign scheduling
│       ├── analytics/          # All GBP analytics queries
│       ├── followups/          # Follow-up reminders
│       ├── search/             # Cross-entity global search
│       ├── activity/           # Audit log service
│       ├── automations/        # Automation engine (BullMQ crons)
│       └── common/
│           ├── enums/          # Role enum
│           ├── prisma/         # PrismaService
│           └── services/
│               ├── financial-calculation.service.ts
│               └── email.service.ts
├── frontend/                   # Next.js App Router
│   └── src/
│       ├── app/
│       │   ├── auth/           # Login + Register
│       │   └── (dashboard)/    # Protected routes
│       │       ├── dashboard/  # KPI cards + charts
│       │       ├── pipeline/   # Kanban board
│       │       ├── deals/      # Deals CRUD
│       │       ├── suppliers/  # Supplier management
│       │       ├── products/   # Product + bulk pricing
│       │       ├── categories/ # Category management
│       │       ├── campaigns/  # Email campaigns
│       │       ├── analytics/  # Full analytics page
│       │       ├── settings/   # Company + SMTP + notifications
│       │       ├── notifications/
│       │       ├── followups/
│       │       └── search/
│       ├── components/
│       │   ├── layout/         # Sidebar, Topbar, NotificationBell
│       │   ├── pipeline/       # KanbanBoard, DealCard
│       │   ├── deals/          # DealFinancials
│       │   └── ui/             # Button, Input, Select, Modal, Table, Badge, Card, etc.
│       ├── hooks/              # useAuth, useNotifications, useSettings
│       ├── lib/                # axios, queryClient
│       ├── store/              # authStore, settingsStore (Zustand)
│       └── types/              # All TypeScript interfaces
├── docker-compose.yml
└── .env.example
```

---

## 💰 Financial Calculation Engine

All amounts are calculated in **GBP (£)** with precision arithmetic.

### Product Level
```
Advertising Cost = Base Cost × (ad_percentage / 100)
VAT              = Base Cost × (vat_percentage / 100)
Total Landed     = Base Cost + Advertising Cost + VAT
```

### Bulk Pricing
```
If quantity ≥ bulk tier threshold:
  Use bulk_cost_price instead of base_cost_price
```

### Deal Level (auto-calculated on create/update)
```
Revenue          = sale_price × quantity
Cost             = cost_price_snapshot × quantity
Ad Spend         = Cost × (ad_percentage_snapshot / 100)
VAT on Sale      = Revenue × (vat_percentage_snapshot / 100)
Gross Profit     = Revenue − (Cost + Ad Spend + VAT)
Profit Margin %  = (Gross Profit ÷ Revenue) × 100
```

All values are **snapshotted** at deal creation to preserve financial history.

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local development)

### 1. Clone & Configure
```bash
git clone <repo>
cd CEGX
cp .env.example .env
# Edit .env with your secrets
```

### 2. Run with Docker
```bash
docker-compose up -d
```

Services:
- **Backend API**: http://localhost:3000/api
- **Swagger Docs**: http://localhost:3000/api/docs
- **Frontend**: http://localhost:4000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### 3. Local Development

**Backend:**
```bash
cd backend
cp .env.example .env
# Set DATABASE_URL, REDIS_URL, JWT_SECRET, JWT_REFRESH_SECRET

npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run start:dev
```

**Frontend:**
```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

---

## 🔐 Default Credentials (after seed)

| Field | Value |
|-------|-------|
| Email | `admin@cegx.co.uk` |
| Password | `Admin123!` |
| Role | `ADMIN` |

> ⚠️ **Change the default password immediately in production.**

---

## 🔑 Environment Variables

### Backend (`backend/.env`)
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/cegx
REDIS_URL=redis://localhost:6379
JWT_SECRET=<min-32-char-secret>
JWT_REFRESH_SECRET=<min-32-char-secret>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:4000
APP_URL=http://localhost:3000
```

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

---

## 🏛️ Database Schema

**14 models** across 3 domains:

**Core**: `User`, `CompanySettings`
**Product**: `ProductCategory`, `Product`, `BulkPricing`, `Supplier`
**Pipeline**: `PipelineStage`, `Deal`, `DealStageHistory`
**Communication**: `EmailCampaign`, `CampaignRecipient`, `Notification`, `FollowUp`
**Audit**: `ActivityLog`

---

## 🔒 RBAC

| Permission | Admin | Sales Mgr | Procurement Officer | Viewer |
|-----------|-------|-----------|---------------------|--------|
| Edit company settings | ✅ | ❌ | ❌ | ❌ |
| Manage users | ✅ | ❌ | ❌ | ❌ |
| Manage pipeline/deals | ✅ | ✅ | ❌ | 👁 |
| Manage suppliers | ✅ | ❌ | ✅ | 👁 |
| Manage products | ✅ | ❌ | ✅ | 👁 |
| Run email campaigns | ✅ | ✅ | ❌ | ❌ |
| View analytics | ✅ | ✅ | ❌ | ❌ |

---

## 📊 API Endpoints

Full Swagger documentation available at `/api/docs` when running locally.

Key endpoint groups:
- `POST /api/auth/login` — login, returns JWT tokens
- `GET /api/analytics/dashboard` — KPI summary
- `PATCH /api/deals/:id/stage` — move deal to new stage (triggers automation)
- `POST /api/campaigns/:id/schedule` — schedule email campaign via BullMQ
- `GET /api/search?q=` — global search
- `GET /api/notifications/unread-count` — for bell badge

---

## 🤖 Automation Engine

Built on BullMQ with cron-based triggers:

| Trigger | Action |
|---------|--------|
| Deal moved to Won | Create profit record + notify assigned user |
| Follow-up due in 24h | Create notification + optional email |
| New supplier added | Notify admin |
| Deal inactive 7 days | Reminder notification |
| Campaign scheduled | BullMQ delayed job sends bulk emails |

---

## 📦 Deployment

### Railway
1. Push to GitHub
2. Create Railway project → Add PostgreSQL + Redis services
3. Deploy backend & frontend from monorepo
4. Set environment variables in Railway dashboard

### AWS ECS (production)
1. Build Docker images: `docker-compose build`
2. Push to ECR
3. Deploy via ECS Fargate with RDS PostgreSQL + ElastiCache Redis
4. Use ALB for load balancing
5. Enable multi-AZ for high availability

### Scaling Considerations
- **Horizontal scaling**: Backend is stateless (JWT), scales behind load balancer
- **BullMQ**: Use Redis Cluster for high-throughput job queues
- **Database**: Enable read replicas for analytics queries
- **Caching**: Redis caching for settings, stages (low-churn data)
- **CDN**: Serve Next.js static assets via CloudFront/Vercel Edge

---

## 🛡️ Security Notes

### Dependency Versions

| Package | Version | Status |
|---------|---------|--------|
| `nodemailer` | `^7.0.11` | ✅ Fixed — DoS (recursive addressparser) + email routing vulns resolved |
| `next` | `14.2.35` | ✅ Fixed — authorization bypass (CVE-2024-46982), cache poisoning, middleware bypass, server components DoS resolved |

### Remaining Known Issue — Next.js HTTP Deserialization DoS

**Advisory**: "Next.js HTTP request deserialization can lead to DoS when using insecure React Server Components"
**Affects**: `>= 13.0.0, < 15.0.8`
**Patched**: Next.js `15.0.8+`

This vulnerability has **no patch available in the 14.x series**. Upgrading to Next.js 15 requires:
- React 19 upgrade (`react`, `react-dom`)
- Async `params` and `searchParams` in page components
- Async `cookies()` and `headers()` calls
- Updated `next.config.ts` format changes

**Mitigation in this project**: The app uses `'use client'` directives for all interactive components and does **not** use unsafe React Server Component patterns (e.g., rendering untrusted user input in RSC). The risk is therefore significantly reduced. Upgrade to Next.js 15 when the team is ready for the migration.

---

## 🔧 Development Scripts

```bash
# Backend
npm run start:dev       # Hot-reload development
npm run start:prod      # Production mode
npm run build           # Compile TypeScript
npx prisma studio       # Visual DB browser

# Frontend
npm run dev             # Development server
npm run build           # Production build
npm run lint            # ESLint
```

---

## 📄 Licence

Private — CEGX Procurement Systems Ltd.