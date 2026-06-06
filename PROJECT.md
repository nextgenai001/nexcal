# NexCal — Multi-Tenant SaaS Booking Platform

> **Version**: 3.0.0 (in progress)  
> **Started**: 2026-06-06  
> **Stack**: Next.js 16, TypeScript, Prisma 7, PostgreSQL 16, Auth.js v5, Tailwind CSS v4

---

## What Is NexCal?

NexCal is a self-hosted, open-source scheduling and booking platform inspired by Cal.com.  
Any business can get an account, set their availability, create event types, and share their booking page — or embed it on their own website.

**Platform Admin** (you) manages tenant accounts.  
**Tenants** (businesses) manage their own events, schedules, and bookings in full isolation.  
**End Customers** book via public pages or embeddable widgets.

---

## Key Features

- 🌐 **Multi-Tenancy** — each business has a fully isolated account
- 🔐 **Role-based access** — `PLATFORM_ADMIN` vs `TENANT`
- 📅 **Event Types** — per-tenant events with custom booking form fields
- 🕐 **Timezone-aware scheduling** — stored in UTC, displayed in visitor's local time
- 🧩 **Embed Widget** — drop-in `<script>` tag for any website (Next.js, WordPress, etc.)
- 🔔 **Webhooks** — n8n-compatible, HMAC-signed, with retry + delivery logs
- 🌍 **i18n** — English by default, infrastructure ready for more languages
- 📊 **Admin Monitoring** — system health, audit logs, webhook failure tracking
- 🐳 **Docker-first** — one `docker compose up` to self-host on any VPS

---

## URL Structure

| Path | Who | Description |
|------|-----|-------------|
| `/admin/*` | PLATFORM_ADMIN | User management, system monitoring |
| `/user/*` | TENANT | Dashboard, events, bookings, webhooks, settings |
| `/[username]` | Public | Tenant's public booking page (all event types, tabbed) |
| `/[username]/[eventSlug]` | Public | Single event booking flow |
| `/[username]/[eventSlug]/embed` | Public | Iframe-embeddable booking widget |
| `/embed.js` | Public | Self-contained embed script |
| `/booking/manage/[token]` | Customer | Self-service reschedule/cancel |
| `/login` | All | Authentication page |

---

## Todo List

### Phase 1 — Database Schema + Fresh Seed
- [x] Rewrite `prisma/schema.prisma` (new Role enum, EventType, Booking, WebhookEndpoint, WebhookDelivery, AuditLog)
- [x] Wipe existing database
- [x] Run `prisma migrate dev --name init`
- [x] Rewrite `prisma/seed.ts` (1 platform admin + 2 demo tenants)
- [x] Run seed successfully

### Phase 2 — Auth & Middleware
- [x] Update `src/lib/auth.ts` — new session fields (username, role, timezone)
- [x] Update `src/lib/auth.config.ts`
- [x] Update `src/types/` — new TypeScript interfaces
- [x] Rewrite `src/middleware.ts` — enforce `/admin/*` = PLATFORM_ADMIN, `/user/*` = authenticated
- [x] Update login page to work with new role model

### Phase 3 — Admin Panel
- [x] `/admin/dashboard` — system health, tenant count, booking stats, webhook failures
- [x] `/admin/users` — tenant list with search
- [x] `/admin/users/new` — create tenant form
- [x] `/admin/users/[id]` — edit tenant, reset password, view stats
- [x] `/admin/logs` — audit log + webhook delivery failures
- [x] Admin layout with sidebar navigation
- [x] Server actions for user CRUD

### Phase 4 — Tenant Panel
- [x] `/user/dashboard` — today's bookings, week summary
- [x] `/user/events` — event type list
- [x] `/user/events/new` — create event + custom fields builder
- [x] `/user/events/[id]` — edit event type
- [x] `/user/schedule` — weekly availability + date overrides
- [x] `/user/bookings` — booking management table
- [x] `/user/bookings/new` — manually add customer to a slot
- [x] `/user/bookings/[id]` — view/edit/update booking status
- [x] `/user/webhooks` — webhook endpoint management
- [x] `/user/webhooks/new` — add endpoint
- [x] `/user/webhooks/[id]/logs` — delivery log
- [x] `/user/settings` — business profile, timezone, embed code generator
- [x] Tenant layout with sidebar navigation
- [x] Server actions for all tenant operations

### Phase 5 — Public Booking Flow + Timezone Engine
- [x] Update slot engine (`src/lib/slots.ts`) for UTC storage + timezone display
- [x] `/[username]/page.tsx` — public profile, all events (tabbed)
- [x] `/[username]/[eventSlug]/page.tsx` — multi-step booking wizard
- [x] Visitor timezone detection (Intl API) + override dropdown
- [x] Double-booking prevention (server-side re-check)
- [x] `/booking/manage/[token]` — customer self-service (reschedule/cancel)

### Phase 6 — Embed System
- [x] `/embed.js/route.ts` — dynamic JS snippet endpoint
- [x] `/[username]/[eventSlug]/embed/page.tsx` — iframe-optimized booking page
- [x] postMessage height-resizing logic
- [x] Theme param (light/dark)
- [x] Embed code generator in tenant settings

### Phase 7 — Webhook System
- [x] `src/lib/webhooks.ts` — dispatch, HMAC signing, retry queue
- [x] `/api/webhooks/process/route.ts` — retry processor
- [x] Background retry loop (module-level singleton)
- [x] Webhook delivery logs in admin + tenant panels
- [x] Tenant: test webhook delivery endpoint
- [x] Webhook events: BOOKING_CREATED, BOOKING_RESCHEDULED, BOOKING_CANCELLED, BOOKING_COMPLETED, BOOKING_NO_SHOW

### Phase 8 — i18n Cleanup
- [x] Remove Indonesian locale files
- [x] Keep English only (`src/lib/i18n/locales/en.json`)
- [x] Keep i18n provider/server infrastructure for future languages
- [x] Add translation keys for all new features

### Phase 9 — Fault Tolerance + Monitoring
- [x] Error boundaries at every route segment level
- [x] Rate limiting on public booking endpoints (10/IP/hour)
- [x] AuditLog writes on all mutations
- [x] Admin dashboard reads live metrics from DB
- [x] Structured error logging format

### Phase 10 — Docker + Docs
- [x] Update `docker-compose.prod.yml`
- [x] Update `docker-entrypoint.sh`
- [x] Create `Caddyfile.example`
- [x] Rewrite `README.md`
- [x] Update `PROJECT.md` (this file)

---

## Future Features (Post-Launch)

> These are planned but **not** included in the current implementation.

| Feature | Notes |
|---------|-------|
| **Sub-staff per tenant** | Allow tenants to invite team members with their own schedules. Requires adding a `TenantMember` model and per-member schedule/event linking. |
| **Additional languages** | i18n structure is ready — add `locales/[lang].json` and register in the i18n config. |
| **Payment integration** | Gateway-agnostic factory pattern already in codebase — can re-enable Midtrans, add Stripe. |
| **Recurring bookings** | Weekly/monthly subscription schedules per event type. |
| **PWA + push notifications** | Progressive Web App with mobile home screen and push notification support. |
| **Google Calendar sync** | Per-tenant OAuth to push confirmed bookings to their Google Calendar. |
| **Native email notifications** | Direct SMTP integration (without n8n) for booking confirmations and reminders. |
| **Analytics dashboard** | Per-tenant BI: booking trends, peak hours, most popular event types. |
| **Custom domains** | Allow tenants to use their own domain (e.g., `book.acme.com`) instead of `/acme`. |

---

## Environment Variables

See `.env.example` for all required variables.

### Required
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Secret for signing auth tokens (`openssl rand -base64 32`) |
| `AUTH_TRUST_HOST` | Set `true` when behind a reverse proxy |
| `NEXT_PUBLIC_APP_URL` | Public URL (e.g., `https://book.yourdomain.com`) |

### Optional
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_APP_NAME` | Display name (default: "NexCal") |
| `SEED_ADMIN_EMAIL` | Platform admin email for seed |
| `SEED_ADMIN_PASSWORD` | Platform admin password for seed |

---

## Self-Hosting (VPS)

```bash
# 1. Clone the repo
git clone https://github.com/yourusername/nexcal.git
cd nexcal

# 2. Copy and configure environment
cp .env.production.example .env
nano .env   # Set DATABASE_URL, AUTH_SECRET, NEXT_PUBLIC_APP_URL

# 3. Start
docker compose -f docker-compose.prod.yml up -d --build

# 4. Open in browser
open http://your-vps-ip:3000

# 5. Login with the platform admin credentials from seed
# Then create tenant accounts from Admin → Users
```

For HTTPS/SSL, see `Caddyfile.example`.
