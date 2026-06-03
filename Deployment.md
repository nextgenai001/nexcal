# Production Deployment Guide for NexCal

This guide provides step-by-step instructions for deploying NexCal to your VPS inside a single Docker container environment with a persistent PostgreSQL database and webhook integrations (e.g. for n8n).

---

## 📋 Prerequisites

Before starting, ensure your VPS has the following installed:
1. **Docker**: `docker --version`
2. **Docker Compose**: `docker compose version`
3. **Git**: `git --version`
4. **Domain Name**: A domain (e.g., `booking.yourdomain.com`) pointed to your VPS IP address (using an `A` record).

---

## ⚙️ Environment Variables

NexCal requires the following environment variables to run in production. Create a `.env` file or set them directly in `docker-compose.yml`:

| Variable | Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string. | `postgresql://postgres:postgres_password@db:5432/booking_db?schema=public` |
| `NEXT_PUBLIC_APP_URL` | The public URL of the application. | `https://booking.yourdomain.com` |
| `NEXTAUTH_URL` | The public URL of the auth endpoints. | `https://booking.yourdomain.com` |
| `AUTH_SECRET` | Secret key used for signing session cookies. | Generate via `openssl rand -base64 32` |
| `N8N_WEBHOOK_URL` | URL of your self-hosted n8n webhook receiver. | `https://n8n.yourdomain.com/webhook/nexcal-trigger` |
| `NEXT_PUBLIC_APP_NAME` | The name of your application. | `NexCal` |

---

## 🚀 Deployment Steps

### Step 1: Clone the Code base
SSH into your VPS and clone the project repository:
```bash
git clone <your-repo-url> /var/www/nexcal
cd /var/www/nexcal
```

### Step 2: Verify Configuration Files
Ensure `Dockerfile`, `docker-compose.yml`, and `deploy.sh` exist in your project root. 

Make the deployment script executable:
```bash
chmod +x deploy.sh
```

### Step 3: Configure SSL and Reverse Proxy (Nginx)
To serve the app securely over HTTPS, configure Nginx to proxy traffic to the Docker container (running on port `3000`).

1. Install Nginx and Certbot:
   ```bash
   sudo apt update
   sudo apt install nginx certbot python3-certbot-nginx -y
   ```

2. Create a new Nginx block configuration (`/etc/nginx/sites-available/nexcal`):
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

3. Enable the config and reload Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/nexcal /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

4. Fetch SSL certificate:
   ```bash
   sudo certbot --nginx -d booking.yourdomain.com
   ```

### Step 4: Run the Application
Start the containers using the deployment script:
```bash
./deploy.sh
```
*Note: On first startup, the container automatically executes `npx prisma db push` to push database schemas, tables, and structures.*

### Step 5: Seed Demo Data (Optional)
If you want to populate the database with default organizations, services, and schedules, execute the seed command inside the running container:
```bash
docker compose exec app npm run db:seed
```

Seeded credentials (from `prisma/seed.ts`):
- **OWNER**: `admin@kliniku.com` (password: `changeme123`)
- **STAFF**: `dr.budi@kliniku.com` (password: `changeme123`)
- **STAFF**: `bidan.sari@kliniku.com` (password: `changeme123`)

---

## 🔄 How to Redeploy / Hot-Update

To deploy code updates, simply run:
```bash
./deploy.sh
```
The script will pull modifications from your git repository, compile the Next.js production build, run database updates, and recreate container instances cleanly with zero configuration loss.

---

## 🪵 Checking Application Logs

To inspect the real-time application logs or database container outputs:
```bash
# View app logs
docker compose logs -f app

# View db logs
docker compose logs -f db
```
