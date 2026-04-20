# 🐳 ProCare Ecommerce Docker Guide

This guide provides details on the Dockerized setup for the ProCare Ecommerce system.

## 🚀 Quick Access

| Service | Local URL | Port |
|---------|-----------|------|
| **Storefront (Next.js)** | [http://localhost:8000](http://localhost:8000) | 8000 |
| **ProCare Backend API** | [http://localhost:9000](http://localhost:9000) | 9000 |
| **ProCare Admin Dashboard** | [http://localhost:9000/app](http://localhost:9000/app) | 9000 |
| **PostgreSQL Database** | `localhost:5432` | 5432 |
| **Redis Cache** | `localhost:6379` | 6379 |

---

## 🔑 Default Credentials

### ProCare Admin
- **Email**: `admin@procare.com`
- **Password**: `supersecret`

---

## 🛠️ Docker Architecture

The project is orchestrated using `docker-compose`. All services reside in a shared bridge network named `procare_network`.

- **`procare_backend`**: The ProCare Ecommerce core server.
- **`procare_storefront`**: The ProCare Ecommerce Next.js storefront.
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

---

## 🚀 CI/CD Deployment

The project includes a GitHub Actions workflow for automated deployment.

### Triggers
1. **Manual**: Go to Actions tab -> "Deploy ProCare Ecommerce" -> Click **Run workflow**.
2. **Automatic**: Any commit to the `main` branch containing the tag `--deploy=true` will trigger a deployment.

### Target Environment
- **Database**: AWS RDS (PostgreSQL).
- **Compute**: Amazon ECR/ECS (Current configured example).

### Required Secrets
Set these in GitHub Repository Secrets:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`

