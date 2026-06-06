# 🗺️ NexCal Roadmap

> **Current Release:** v3.0.0 (Stable)
> **Status:** Active development. Accepting feature requests and contributions.

This document outlines the version history, shipped milestones, and future goals for the NexCal scheduling platform.

---

## 🚀 Shipped & Completed

### ✅ v3.0.0 — Multi-Tenant Booking SaaS (Current)
Converted the scheduler from a single-business clinic tool into a self-hosted SaaS platform (similar to Cal.com).

* **True Multi-Tenancy**: Isolated tenant workspaces where users manage schedules, bookings, and integrations.
* **Platform Admin Control**: Dashboard for Platform Admins to monitor tenant accounts, review system audit logs, and track webhook metrics.
* **Global Timezone Combobox**: Sleek timezone selector with a world capitals clock database, providing live offset displays and browser auto-detection.
* **Custom Fields Builder**: Flexible form builder allowing tenants to configure form fields per event type (text, email, select options, textarea).
* **Embed Widget (`embed.js`)**: Dynamic iframe integration with automatic sizing listener (`postMessage`) to match page height without scrollbar clipping.
* **HMAC-Signed Webhooks**: Real-time event notifications with cryptographic signature verification and an automatic backoff retry engine.
* **Edge-Compatible Security**: Integrated Next.js middleware and Auth.js v5 for edge-optimized page routing security.

---

### ✅ v2.0 – v2.5 — Team Clinic Scheduler
Developed team features and clinical integrations.
* **Multi-Provider Schedules**: Configured doctor/provider selectors.
* **Smart Scheduling Engine**: Set up dual-layer buffer times.
* **Virtual Consultations**: Native Google Calendar OAuth with automatic Google Meet conference generation.
* **Customer Self-Service**: Portal allowing customers to reschedule/cancel bookings up to 24 hours prior.

---

### ✅ v1.0 — Initial Release
* **Basic Calendar**: Calendar slots with double-booking safety guard.
* **Core CRM**: Bookings list and statuses.

---

## 🔮 Future Roadmap

These features are planned for future major releases. Contributions, feedback, and PRs are highly encouraged!

### 👥 v3.5 — Tenant Team Expansion
* **Sub-staff invite**: Allow tenants to invite team members under their business profile.
* **Team Event Types**: Create shared event types (round-robin scheduling or collective availability).

### 💳 v3.6 — Payments Re-activation
* **Gateway-Agnostic Payments**: Reactivate the payment factory block to support Stripe and Xendit.
* **Pre-paid Event Booking**: Require successful gateway authorization before bookings are set to `CONFIRMED`.

### 🔄 v4.0 — Enterprise Upgrades
* **Recurring Bookings**: Allow clients to book recurring slots (e.g. weekly consulting blocks) in one checkout flow.
* **Custom Domains**: Allow tenants to map their own domains (e.g. `book.acme.com`) instead of paths (`/acme`).
* **Progressive Web App (PWA)**: Support offline layouts and browser push notifications for reminders.
