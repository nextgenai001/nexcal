# 🚀 NexCal v3.0 — Launch Kit

> Internal marketing assets and drafts for launching NexCal v3.0.
> Customize templates based on the destination platform.

---

## 📝 Draft 1: Reddit (r/selfhosted & r/nextjs)

### Title Options:
* `I built an open-source, self-hosted Cal.com alternative with timezone conversion, webhooks, and an auto-resizing embed widget`
* `Show r/selfhosted: NexCal v3.0 — A multi-tenant booking & scheduling SaaS you can run on a $5/mo VPS`
* `Say goodbye to Calendly fees. Here is my self-hosted scheduling platform built with Next.js 16 and Prisma 7`

### Body:

Hey r/selfhosted!

I’ve been building **NexCal**—a self-hosted, multi-tenant scheduling and booking platform inspired by Cal.com. Version 3.0 has been rewritten from scratch to support multi-tenancy. You can host it yourself and offer booking services to multiple businesses (each with isolated dashboards).

**Key Features in v3.0:**

* 🏢 **True Multi-Tenancy**: Separate tenant workspaces. Platform Admins manage accounts and logs, while Tenants manage schedules, events, and CRM.
* 🕐 **Capitals Timezone Engine**: Combobox selector mapping capital cities of all countries in the world. Displays live local clocks and UTC offsets. Detects visitors' browser timezones automatically.
* 📋 **Dynamic Form Fields**: Tenants build customized forms for each event type (supports input fields, textareas, phone numbers, and dropdown selects).
* 🧩 **Drop-in Embed Widget (`embed.js`)**: A script tag that injects an iframe. The iframe uses `postMessage` and `ResizeObserver` to communicate height changes back to the host window, ensuring zero cutoff or double scrollbars.
* 🔔 **Reliable Webhooks**: outbound events (created, rescheduled, cancelled) signed with HMAC-SHA256, featuring an automated exponential backoff retry loop and delivery log page.
* 🛡️ **Race-Condition Safety**: 3-layer anti double-booking checks: Zod validation -> server slot reservation -> database constraints.

**Tech stack**: Next.js 16, TypeScript 5, Prisma 7, PostgreSQL, Tailwind CSS v4, Docker.

**Quick Start**:
```bash
git clone https://github.com/yourusername/nexcal.git
cd nexcal
cp .env.production.example .env
# Edit .env variables (AUTH_SECRET, DATABASE_URL)
docker compose -f docker-compose.prod.yml up -d --build
```

The database seeds automatically with a Platform Admin and two demo tenants to play with!

GitHub: https://github.com/yourusername/nexcal

I'd love to hear your feedback on self-hosting scheduling platforms. What feature would make you host your own scheduler?

---

## 🐦 Draft 2: Twitter/X Thread

### Thread Structure:

**Tweet 1 (Hook)**
Paying $15/month per user for booking tools adds up fast.

So I built a self-hosted, multi-tenant alternative inspired by Cal.com. 

Meet NexCal v3.0. Secure, timezone-aware, extensible, and 100% open-source.

Here is what it does: 👇

---

**Tweet 2**
🏢 **True Multi-Tenancy**
Create multiple isolated business profiles on a single deployment.
- Tenants manage schedules, custom fields, and CRM.
- Platform Admins monitor user status and audit logs from a dedicated panel.
- Fast, secure cookie authentication via Auth.js v5.

---

**Tweet 3**
🕐 **Capitals Timezone Engine**
International booking is tricky. NexCal stores schedules in UTC and uses a global lookup database of world capital cities.
- Dynamic timezone selector with live local clocks.
- Automatic browser timezone detection.
- Flawless slot calculations with date-fns-tz.

---

**Tweet 4**
🧩 **Resizing Embed Widget**
No more ugly double scrollbars when embedding your calendar.
Our vanilla JS `embed.js` script injects an iframe that uses `ResizeObserver` and `postMessage` to auto-expand to fit the host container. 

---

**Tweet 5**
🔔 **Developer Integrations**
Connect your booking flows to n8n, Zapier, or your backend.
- HMAC-SHA256 signature verification.
- In-depth delivery logs and request payloads.
- Automated exponential-backoff retry queue for failing endpoints.

---

**Tweet 6 (CTA)**
NexCal v3.0 is built on Next.js 16 (App Router), Prisma 7, Tailwind CSS v4, and PostgreSQL.

Try it out on GitHub, star the repo, and host it on a $5 VPS:
⭐ https://github.com/yourusername/nexcal

---

## 💼 Draft 3: LinkedIn Post

**Introducing NexCal v3.0 — The Multi-Tenant Scheduling & Booking SaaS You Own**

Are you paying high monthly subscription fees per user for Calendly or Acuity? For a small agency or clinic, subscription fees can drain budgets, and you lose absolute ownership of customer data.

Today, I'm sharing **NexCal v3.0**—a self-hosted, multi-tenant booking and scheduling platform designed to be a private alternative to Cal.com.

**What's new in v3.0:**

* 🚀 **Multi-Tenant Architecture**: Launch your own booking platform. Users create isolated accounts, manage their own events, schedules, and custom forms.
* 🌍 **Global Timezone Selector**: Built-in global database of world capitals. The booking wizard translates slots to local visitor times on the fly.
* 🧩 **Perfect iframe Embeds**: A drop-in javascript snippet (`embed.js`) that automatically resizes the parent iframe on the host page to eliminate double scrollbars.
* ⚡ **Integrations & Webhooks**: HMAC-SHA256 signed event webhooks with built-in retry queues and delivery logs, perfect for automated CRM syncing.

**Why Self-Host?**
1. **100% Data Ownership**: Host it on your own servers to ensure compliance.
2. **Flat Costs**: Host 1 or 100 business profiles on a single $6 VPS without scaling subscription charges.
3. **Customizability**: Extensible Tailwind CSS layouts and TypeScript schemas ready for branding.

Source code and Docker quick-start guide are available on GitHub:
👉 https://github.com/yourusername/nexcal

#OpenSource #NextJS #SaaS #SelfHosted #WebDevelopment #TimezoneDesign #CalendlyAlternative #Docker
