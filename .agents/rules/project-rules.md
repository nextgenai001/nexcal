---
trigger: always_on
---

# NexCal Project Rules & Coding Guidelines

This document outlines the strict guidelines and conventions for AI development on NexCal. It focuses on architecture, localization, error-handling behavior, monitoring protocols, coding implementation, and verification standards. Do not deviate from these rules.

---

## 1. Core Stack & Architecture

- Use Next.js 16 App Router structures and Server Components by default.
- Maintain strict TypeScript type safety across the entire application without using loose typing or generic fallbacks.
- Enforce strict database multi-tenancy. Every database query, mutation, and resource retrieval must explicitly filter on the tenant's user identifier to guarantee absolute data isolation.
- Enforce role-based access control. Route access, action dispatching, and page rendering must verify the appropriate user role using system helpers for Platform Administrators and Tenants.

---

## 2. i18n & Localization (Multi-Language Support)

- Hardcoded user-facing strings are strictly prohibited in components, actions, or utilities.
- For server-side rendering, layout configuration, and server actions, fetch dictionary translators dynamically through the server translation utility.
- For client-side interactivity, utilize the react hook context provider to access the translation function.
- Store all language entries inside the JSON locale namespace translation files.
- Support dynamic parameter insertion within translation strings using curly-brace placeholder definitions.

---

## 3. Robust 2-Sided Error Handling & Logging

All errors must be captured on both sides of the execution context (Server-Side and Browser-Side) and logged to the central database monitor.

### Browser-Side (Client-Side) Logging

- Implement React error boundaries at the segment and layout level to catch browser-side application crashes.
- Intercept unexpected errors, runtime failures, and failed client fetch requests using the central log client.
- Automatically capture diagnostic browser context, current route paths, component source labels, and browser-side stack traces.

### Server-Side (Backend-Side) Logging

- Wrap all Server Actions, API routes, database queries, and background processes in try-catch structures.
- Intercept server-side execution exceptions, validation failures, database constraint violations, and third-party integration drops.
- Log server-side stack traces, request context, metadata payloads, and user session identifiers securely without exposing raw trace messages to client viewports.

---

## 4. Live Monitoring & Observability Dashboard

Platform Administrators monitor application activity using a dedicated interface.

### Application Error Stream

- Display a unified feed of database error logs classified by component origin (Client, Server, API).
- Provide administrative tools to inspect expanded stack traces, clean up logs, delete specific entries, and update rolling log retention policies dynamically.

### Webhook Delivery & Integration Failures

- Track outbound webhooks triggered by booking state changes (created, rescheduled, cancelled, etc.).
- Maintain delivery details for every webhook attempt, including response codes, payloads, raw body responses, retry attempts, and exponential backoff states.
- Expose system-wide integration logs to the platform administrator, and filter specific webhook delivery logs to the respective tenant dashboard.

---

## 5. Timezone & Scheduling Engine Rules

- Store weekly availability schedules and specific date overrides in the tenant's local time zone format as string structures.
- Store all booking timelines, start dates, and end dates in the database strictly in UTC.
- Translate available time slots dynamically between the tenant's local timezone and the customer's browser-detected timezone during the public booking wizard flow.
- Maintain visitor timezone selections and overrides throughout the multi-step scheduling process.

---

## 6. Coding Implementation Guidelines

- Prioritize code cleanliness, readability, and modularity. Do not bundle distinct responsibilities into single files.
- Keep Client Components small and light; lift heavy computations and database fetching into Server Components.
- When generating files, match the exact naming and organizational convention of existing directories (actions, components, lib, app, types).

---

## 7. Change Verification & Quality Gate Rules

Verification rigor is determined by the sensitivity and footprint of the change.

### Minor & Non-Sensitive Changes

- Examples: Static UI alignment fixes, css updates, documentation improvements, copy translations, and simple text modifications.
- Protocol: Rely on IDE syntax highlighting, local editor diagnostic checks, and standard manual visual verification.
- Required Commands to Execute:
  - Run fast local typescript check: npx tsc --noEmit

### Important & Sensitive Changes

- Examples: Database schema modifications (prisma definitions, migrations, seeds), authentication or role-based access control adjustments (rbac filters, session configuration, middleware logic), webhook engines (dispatchers, HMAC signing, retries), and timezone slot computation engines.
- Protocol: Perform full static analysis and verification before delivering code changes. Run complete compilation builds alongside lint check commands to ensure there are no syntax, module import, or type signature regressions.
- Required Commands to Execute:
  - Run build validation check: npm run build
  - Run lint validation check: npm run lint

---

## 8. Project File Structure & Tree Maintenance

### Codebase Directory Tree

Below is the current visual structure of the project files.

<!-- START_TREE -->

├── prisma
│   ├── migrations
│   │   ├── 20260606123845_init_v3
│   │   │   └── migration.sql
│   │   ├── 20260606142350_add_global_breaks
│   │   │   └── migration.sql
│   │   └── migration_lock.toml
│   ├── schema.prisma
│   └── seed.ts
├── public
│   ├── embed.js
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── src
│   ├── actions
│   │   ├── admin-users.ts
│   │   ├── auth.ts
│   │   ├── booking-actions.ts
│   │   ├── errors.ts
│   │   ├── event-types.ts
│   │   ├── locale.ts
│   │   ├── public-booking.ts
│   │   ├── schedule-actions.ts
│   │   ├── tenant-settings.ts
│   │   └── webhook-actions.ts
│   ├── app
│   │   ├── [username]
│   │   │   ├── [slug]
│   │   │   │   ├── success
│   │   │   │   │   └── page.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── admin
│   │   │   ├── dashboard
│   │   │   │   └── page.tsx
│   │   │   ├── errors
│   │   │   │   ├── ErrorsPageClient.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── logs
│   │   │   │   └── page.tsx
│   │   │   ├── users
│   │   │   │   ├── [id]
│   │   │   │   │   ├── EditTenantClient.tsx
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── new
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   └── UsersSearchClient.tsx
│   │   │   ├── error.tsx
│   │   │   ├── layout.tsx
│   │   │   └── loading.tsx
│   │   ├── api
│   │   │   ├── auth
│   │   │   │   └── [...nextauth]
│   │   │   │       └── route.ts
│   │   │   └── cron
│   │   │       └── webhooks
│   │   │           └── route.ts
│   │   ├── login
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── unauthorized
│   │   │   └── page.tsx
│   │   ├── user
│   │   │   ├── bookings
│   │   │   │   ├── [id]
│   │   │   │   │   ├── BookingActions.tsx
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── new
│   │   │   │   │   ├── BookingForm.tsx
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── BookingFilterTabs.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── dashboard
│   │   │   │   └── page.tsx
│   │   │   ├── events
│   │   │   │   ├── [id]
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── new
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── EventTypeCard.tsx
│   │   │   │   ├── EventTypeForm.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── schedule
│   │   │   │   ├── DateOverridesForm.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   └── ScheduleForm.tsx
│   │   │   ├── settings
│   │   │   │   ├── EmbedCodeGenerator.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   └── SettingsForm.tsx
│   │   │   ├── webhooks
│   │   │   │   ├── [id]
│   │   │   │   │   └── logs
│   │   │   │   │       └── page.tsx
│   │   │   │   ├── new
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── WebhookForm.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   └── WebhookList.tsx
│   │   │   ├── error.tsx
│   │   │   ├── layout.tsx
│   │   │   └── loading.tsx
│   │   ├── error.tsx
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── loading.tsx
│   │   ├── not-found.tsx
│   │   └── page.tsx
│   ├── components
│   │   ├── admin
│   │   │   ├── AdminHeader.tsx
│   │   │   └── AdminSidebar.tsx
│   │   ├── booking
│   │   │   ├── BookingWizard.tsx
│   │   │   └── EmbedResizer.tsx
│   │   ├── ui
│   │   │   └── TimezoneCombobox.tsx
│   │   └── user
│   │       ├── UserHeader.tsx
│   │       └── UserSidebar.tsx
│   ├── lib
│   │   ├── i18n
│   │   │   ├── locales
│   │   │   │   └── en.json
│   │   │   ├── provider.tsx
│   │   │   └── server.ts
│   │   ├── webhooks
│   │   │   └── dispatcher.ts
│   │   ├── auth.config.ts
│   │   ├── auth.ts
│   │   ├── prisma.ts
│   │   ├── rbac.ts
│   │   ├── slots.ts
│   │   ├── timezones-data.ts
│   │   └── webhooks.ts
│   ├── types
│   │   └── next-auth.d.ts
│   └── middleware.ts
├── .dockerignore
├── .env.example
├── .env.production.example
├── .gitignore
├── deploy.sh
├── Deployment.md
├── docker-compose.prod.yml
├── docker-compose.yml
├── docker-entrypoint.sh
├── Dockerfile
├── eslint.config.mjs
├── general_rules.md
├── LICENSE
├── next-env.d.ts
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── prisma.config.ts
├── PROJECT.md
├── README.md
├── ROADMAP.md
└── tsconfig.json

<!-- END_TREE -->
