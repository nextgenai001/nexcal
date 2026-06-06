# Production Deployment Guide for NexCal

This guide provides step-by-step instructions for deploying NexCal to your VPS inside a Docker environment with a persistent PostgreSQL database, multi-tenancy auth, timezone translation, and dynamic webhooks.

---

## 📋 Prerequisites

Before starting, ensure your VPS has the following installed:
1. **Docker**: `docker --version`
2. **Docker Compose**: `docker compose version`
3. **Git**: `git --version`
4. **Domain Name**: A domain (e.g., `booking.yourdomain.com`) pointed to your VPS IP address (using an `A` record).

---

## ⚙️ Environment Variables

NexCal is configured using server-level environment variables in a `.env` file. Create a `.env` file in the project root containing:

| Variable | Required | Description | Example |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Yes | PostgreSQL connection string. | `postgresql://postgres:postgres_password@db:5432/nexcal?schema=public` |
| `NEXT_PUBLIC_APP_URL` | Yes | The public URL of the application. | `https://booking.yourdomain.com` |
| `AUTH_SECRET` | Yes | Secret key used for signing session cookies. | Generate via `openssl rand -base64 32` |
| `AUTH_TRUST_HOST` | Yes | Trust reverse proxies (set `true` in production). | `true` |
| `NEXT_PUBLIC_APP_NAME` | No | Custom display name for the platform. | `NexCal` |

*Note: Integration credentials (such as webhook endpoints and client settings) are configured dynamically by tenants in their dashboard UI, not via environment variables.*

---

## 🚀 Deployment Steps

### Step 1: Clone the Codebase
SSH into your VPS and clone the project repository:
```bash
git clone <your-repo-url> /var/www/nexcal
cd /var/www/nexcal
```

### Step 2: Set Up Environment Configuration
Copy the production environment template and edit the values:
```bash
cp .env.production.example .env
nano .env
```
Ensure you generate a secure `AUTH_SECRET` and set the correct `DATABASE_URL` and `NEXT_PUBLIC_APP_URL`.

### Step 3: Configure SSL and Reverse Proxy (Caddy or Nginx)
To serve the app securely over HTTPS, configure a reverse proxy to route traffic to the container (running on port `3000`).

#### Option A: Caddy (Recommended)
Caddy automatically handles SSL generation and renewal.
Create a `Caddyfile` in the project root:
```caddy
booking.yourdomain.com {
    reverse_proxy localhost:3000
}
```

#### Option B: Nginx
If using Nginx, configure Nginx to proxy traffic:
1. Create a configuration block (`/etc/nginx/sites-available/nexcal`):
   ```nginx
   server {
       server_name booking.yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```
2. Enable it and run Certbot to configure SSL certificates:
   ```bash
   sudo ln -s /etc/nginx/sites-available/nexcal /etc/nginx/sites-enabled/
   sudo systemctl reload nginx
   sudo certbot --nginx -d booking.yourdomain.com
   ```

### Step 4: Launch the Containers
Launch the stack using Docker Compose:
```bash
docker compose -f docker-compose.prod.yml up -d --build
```
On first startup, the container entrypoint will automatically run database migrations (`npx prisma migrate deploy`) and seed the initial tenant/admin accounts.

### Step 5: Default Seed Logins
Once running, you can log in to NexCal using these default accounts:

| Role | Email | Password | Username/Handle |
| :--- | :--- | :--- | :--- |
| 👑 Platform Admin | `admin@nexcal.app` | `admin123456` | `admin` |
| 🏢 Demo Tenant 1 | `demo@acmecorp.com` | `tenant123456` | `acmecorp` |
| 🎨 Demo Tenant 2 | `hello@janedoe.design` | `tenant123456` | `janedoe` |

> ⚠️ **Warning**: Log in and update these default passwords immediately in the Settings pane!

---

## 🪵 Container Logs & Operations

To view logs or manage containers:
```bash
# Inspect application output
docker compose -f docker-compose.prod.yml logs -f app

# Inspect database output
docker compose -f docker-compose.prod.yml logs -f db

# Stop the stack
docker compose -f docker-compose.prod.yml down
```
