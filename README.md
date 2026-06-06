<h1 align="center">🗓️ NexCal</h1>

<p align="center">
  <strong>The Open-Source, Multi-Tenant Booking & Scheduling SaaS (Like Cal.com)</strong><br/>
  Create booking pages, manage custom event types, define availability with timezone translation, and embed widgets on any site. Built for multi-tenant self-hosting out of the box.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma" alt="Prisma 7" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss" alt="Tailwind CSS 4" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker" alt="Docker" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="MIT License" />
</p>

---

## ✨ What is NexCal?

**NexCal** is a production-grade, self-hosted, multi-tenant scheduling platform inspired by Cal.com. It allows you to run your own scheduling service where different businesses (tenants) can register, create event types, customize booking forms, configure timezone-specific availability, and accept international bookings.

### Core Target Roles
* 👑 **Platform Admin**: Manages tenant accounts, monitors system audit logs, and tracks webhook performance.
* 🏢 **Tenants (Businesses)**: Configure individual availability, set up dynamic booking forms, manage bookings, and view webhook delivery logs.
* 👥 **End Customers**: Access fast, timezone-converted public booking pages or embedded widgets to book appointments.

---

## 🎯 Key Features

### 🏢 True Multi-Tenancy
* Fully isolated data spaces. Tenants can only view and manage their own Event Types, Bookings, Schedules, and Webhooks.
* Dedicated Admin Dashboard (`/admin`) for system monitoring, user administration, and audit logs.

### 🕐 Advanced Timezone Engine
* All schedules and overrides are entered in the tenant's local timezone.
* Bookings are stored in UTC.
* The public booking wizard automatically detects the customer's browser timezone (or lets them override it) and converts available slots seamlessly.

### 📋 Custom Booking Fields
* Build dynamic, multi-type forms per Event Type (Supports: `text`, `email`, `phone`, `select` with options, and `textarea`).
* Dynamic validation ensures all required data is collected during the public booking flow.

### 🧩 Embed Widget
* A self-contained script (`embed.js`) dynamically builds an iframe pointing to the tenant's scheduling page.
* Built-in `postMessage` protocol listens to height changes within the iframe to resize the parent widget container automatically (zero cut-off scrollbars).

### 🔔 Robust Webhook Dispatcher
* Dispatch event payloads to external URLs when booking lifecycles change.
* Every webhook request is signed using **HMAC-SHA256** for security.
* Automated exponential-backoff retry queue triggers automatically for failed endpoints.
* Transparent logging for all webhook delivery attempts directly in the UI.

---

## 🖥️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16 (App Router, Server Components) |
| **Language** | TypeScript 5 (Strict Mode) |
| **Database** | PostgreSQL 16 |
| **ORM** | Prisma 7 (Postgres Native Adapter) |
| **Auth** | Auth.js v5 (NextAuth) |
| **Styling** | Tailwind CSS v4 |
| **Date Utility** | `date-fns` & `date-fns-tz` |

---

## 🚀 Self-Hosting & Deployment

### Prerequisites
* [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/)

### Quick Start (Docker Compose)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/nexcal.git
   cd nexcal
   ```

2. **Configure Environment Variables**:
   Create a `.env` file from the production template:
   ```bash
   cp .env.production.example .env
   ```
   Open `.env` and set your secrets:
   ```env
   DATABASE_URL="postgresql://postgres:postgres_password@db:5432/nexcal?schema=public"
   AUTH_SECRET="your-32-character-random-auth-secret"
   NEXT_PUBLIC_APP_URL="https://booking.yourdomain.com"
   ```

3. **Start the Stack**:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```

The container entrypoint will automatically run database migrations and seed the fresh instance.

### Default Seed Credentials
The following accounts are created by default when the database is seeded:

| Role | Email | Password | Username/Handle |
|------|-------|----------|-----------------|
| 👑 Platform Admin | `admin@nexcal.app` | `admin123456` | `admin` |
| 🏢 Demo Tenant 1 | `demo@acmecorp.com` | `tenant123456` | `acmecorp` |
| 🎨 Demo Tenant 2 | `hello@janedoe.design` | `tenant123456` | `janedoe` |

> ⚠️ **Security Warning**: Change the default passwords immediately in the Settings panel after logging in!

---

## 💻 Local Development

1. **Start Local Database**:
   ```bash
   docker compose up -d
   ```
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Migrate & Seed**:
   ```bash
   npx prisma db push
   npx prisma db seed
   ```
4. **Run Dev Server**:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧩 Embed Widget Integration

Integrating a tenant's scheduler into any third-party website (WordPress, Webflow, Next.js, static HTML, etc.) is as simple as inserting a script tag and a placeholder div.

```html
<!-- 1. The placeholder element where the scheduler iframe will be injected -->
<div id="nexcal-widget"></div>

<!-- 2. The embed script tag with configuration attributes -->
<script 
  src="https://booking.yourdomain.com/embed.js"
  data-nexcal-user="acmecorp"
  data-nexcal-event="30-min-demo"
  data-nexcal-theme="light"
  async>
</script>
```

### Script Options
* `data-nexcal-user`: The tenant's username.
* `data-nexcal-event` *(Optional)*: Event slug. If omitted, lists all active event types for the user.
* `data-nexcal-theme` *(Optional)*: Force `light` or `dark` theme inside the iframe.

---

## 🔔 Webhooks Integration

NexCal supports outbound webhooks for real-time integration with automated workflows (e.g., n8n, Zapier, custom servers).

### Supported Webhook Events
* `BOOKING_CREATED`: Fired when a customer submits a new booking request.
* `BOOKING_RESCHEDULED`: Fired when an appointment is moved to a new slot.
* `BOOKING_CANCELLED`: Fired when a booking is cancelled by either the tenant or customer.
* `BOOKING_COMPLETED`: Marked as done by the tenant.
* `BOOKING_NO_SHOW`: Marked as no-show by the tenant.

### Verifying Webhook Signatures
Every webhook request contains an `X-NexCal-Signature` header. This signature is an HMAC-SHA256 hash of the JSON payload created using the webhook endpoint secret configured in the tenant settings.

Here is a quick Node.js example showing how to verify the signature:

```javascript
const crypto = require('crypto');

function verifySignature(rawBody, secret, receivedSignature) {
  const computedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');
    
  return crypto.timingSafeEqual(
    Buffer.from(computedSignature, 'utf-8'),
    Buffer.from(receivedSignature, 'utf-8')
  );
}
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
