# 🐳 ProCare Ecommerce Docker Guide

This guide provides details on the Dockerized setup for the ProCare Ecommerce system.

## 🚀 Quick Access

| Service | Local URL | Port |
|---------|-----------|------|
| **Unified Storefront** | [http://localhost:9000](http://localhost:9000) | 9000 |
| **ProCare Admin Dashboard** | [http://localhost:9000/store-backend](http://localhost:9000/store-backend) | 9000 |
| **Backend API** | [http://localhost:9000/store](http://localhost:9000/store) | 9000 |
| **PostgreSQL Database** | `localhost:5432` | 5432 |
| **Redis Cache** | `localhost:6379` | 6379 |

---

## 🔑 Default Credentials

### ProCare Admin
- **Email**: `admin@procareshop.com`
- **Password**: `Admin@2026#`

---

## 🛠️ Docker Architecture

The project is orchestrated using `docker-compose`. All services reside in a shared bridge network named `procare_network`.

- **`procare_backend`**: The ProCare Ecommerce core server.
- **`procare_storefront`**: The ProCare Ecommerce Next.js storefront.
- **`procare_nginx`**: Reverse Proxy (Entry point for Port 9000).
- **`procare_postgres`**: Database (Postgres 15).
- **`procare_redis`**: Cache and Event Bus (Redis 7).

---

## 📟 Useful Commands

### Management
```bash
# Start all services (with build)
npm run docker:up

# Stop all services
npm run docker:down

# View logs for all services
npm run docker:logs

# View logs for a specific service
docker logs -f procare_backend
docker logs -f procare_storefront
```

### Data Management
```bash
# Manually run database migrations
docker exec procare_backend yarn medusa db:migrate

# Seed dummy products (Original Seed)
docker exec procare_backend yarn seed

# Seed custom bulk products (20+ items)
docker exec procare_backend yarn medusa exec src/scripts/seed-more.ts

# Seed inventory (Makes products In Stock)
docker exec procare_backend yarn medusa exec src/scripts/seed-inventory.ts

# Create specialized collections for homepage
docker exec procare_backend yarn medusa exec src/scripts/seed-collections.ts
```

## ⚙️ Environment Variables

- **Backend**: Configured in `backend/.env` and `docker-compose.yml`.
- **Storefront**: Configured in `storefront/.env`.
  - `MEDUSA_BACKEND_URL`: Set to `http://backend:9000` for internal Docker communication.
  - `NEXT_PUBLIC_MEDUSA_BACKEND_URL`: Set to `http://localhost:9000` for browser communication.

---

## 🗺️ Deployment Roadmap: From VPS to RDS

The system is configured in two phases to handle hardware reliability concerns while transitioning to a professional cloud setup.

### Phase 1: Local VPS / EC2 (Current)
*Used for the first week to ensure everything is functional before scaling.*
- **DB Strategy**: PostgreSQL runs as a Docker container.
- **Reliability**: Uses a **Bind Mount** (`./postgres_data`) for persistence.
- **Safety**: 
  - Run `./scripts/backup-logical.sh` daily to create SQL dumps.
  - Run `./scripts/backup-vps.sh` for a full directory snapshot (requires 5s downtime).

### Phase 2: Switch to AWS RDS
*Goal: Remove dependency on the VPS disk for the database.*
- **How to Switch**:
  1. Set up a PostgreSQL instance on AWS RDS.
  2. Restore your latest backup to RDS.
  3. Update your connection:
     - Stop the local Postgres: `docker stop procare_postgres`
     - Set the `DATABASE_URL` environment variable on your host or in `.env`:
       ```bash
       DATABASE_URL=postgres://user:password@your-rds-endpoint:5432/procare_ecommerce
       ```
     - Restart services: `docker compose up -d`

---

## 🛠️ Data Safety & Backups

We have provided two scripts in the `scripts/` directory:

1. **`backup-logical.sh` (Recommended)**:
   - Uses `pg_dump`.
   - **No downtime**.
   - Creates a compressed `.sql.gz` file.
2. **`backup-vps.sh` (Deep Snapshot)**:
   - Zips the entire `./postgres_data` directory.
   - **Requires 5s downtime** (stops container).
   - Use this before major server migrations.

> **CRITICAL**: Copy your backups from `./backups` to a different machine/cloud storage every day. If the VPS crashes, the local backups will also be inaccessible.

---

## 📦 Repository Structure
We use a **Monorepo** approach (single repository) for both Frontend and Backend.
- **Why?**: It keeps code changes synchronized, simplifies CI/CD workflows, and allows sharing the same project identity and documentation in one place.

# 🔧 Advanced Operations Guide

## �️ Database Migration (Local to VPS)

To move your local database data to the VPS, follow these steps:

### 1. Create a Backup (Local)
On your local machine, run:
```bash
./scripts/backup-logical.sh
```
This creates a file like `backups/procare_logical_backup_YYYYMMDD.sql.gz`.

### 2. Transfer to VPS
```bash
scp backups/procare_logical_backup_TIMESTAMP.sql.gz procare:/var/www/procare-ecommerce/
```

### 3. Restore on VPS
SSH into your VPS and run:
```bash
cd /var/www/procare-ecommerce
# Unzip
gunzip procare_logical_backup_TIMESTAMP.sql.gz
# Clear existing schema (Warning: Destructive)
docker exec procare_postgres psql -U procare_ecommerce -d procare_ecommerce -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
# Import
cat procare_logical_backup_TIMESTAMP.sql | docker exec -i procare_postgres psql -U procare_ecommerce -d procare_ecommerce
```

---

## ⚡ GitHub Actions VPS Pipeline

We have two deployment strategies integrated into the repository.

### Strategy A: VPS SSH Deployment (Active)
*Deploys directly to your Ubuntu VPS via SSH.*

**Required GitHub Secrets:**
1.  **`VPS_SSH_HOST`**: `3.7.7.67`
2.  **`VPS_SSH_USER`**: `root`
3.  **`VPS_SSH_KEY`**: Your Private SSH Key (e.g., contents of `id_rsa`).

**How to Trigger:**
-   Manual trigger from GitHub Actions.
-   Commit with `--deploy=true` tag.

---

## 🔒 Security Best Practices
- **Never commit `.env` files**: They are already in `.gitignore`. Use `scp` to move them to the VPS manually.
- **Port 9000**: Is currently exposed. Ensure your VPS firewall (`ufw`) allows traffic on 80 and 443, but limits 9000 if you want traffic to only go through the host Nginx.
