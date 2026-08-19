# Deployment & Daily Commands

This file serves as the memory for the AI agent and the developer to remember daily commands and critical deployment steps. It is automatically loaded by the AI because it is located in `.agents/rules/`.

## 1. Production Database (AWS RDS)
- The production database is hosted on **AWS RDS**.
- The VPS has a local Docker container called `procare_postgres`, but this is **NOT** used for production. Do not connect the live app to it.
- **Backups**: Use the official backup script located at `latest/db-backup/backup-database.sh`. This script correctly connects to the RDS instance and creates a dump.

## 2. Deploying to VPS
To deploy changes or restart the containers on the VPS, you **MUST** use the production compose file. If you just run `docker compose up -d`, it will use the local test database!

**Correct Deployment Command on VPS:**
```bash
cd /var/www/procare-ecommerce
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d backend storefront
```

## 3. Syncing Changes to VPS
If you are syncing files manually via `rsync` from your local machine to the VPS, make sure you **DO NOT overwrite the `.env` file**. 
The local `.env` has test Razorpay keys, while the VPS `.env` has the live `rzp_live` keys.

**Safe Sync Command (Run from local machine):**
```bash
rsync -avz --exclude='.git' --exclude='node_modules' --exclude='.medusa' --exclude='.next' --exclude='.env' --exclude='untracked_files' ./ procare:/var/www/procare-ecommerce/
```

## 4. Medusa Admin Rebuilds
If you modify the Admin UI (e.g. adding a new sidebar page), the backend container must be rebuilt.
The `backend/Dockerfile` compiles the admin and places it in `/server/public/admin`.
If the Admin UI doesn't reflect your changes after a rebuild, ensure the `Dockerfile` deletes the old cache first (`rm -rf /server/public/admin`) to avoid nested `admin/admin` directories.

## 5. Medusa Graph Query Pagination
By default, `query.graph({ entity: "cart" })` and other entities only return **15 records**.
If you are doing manual scripts or admin routes that need to process historical data (like finding old missing orders), always include `pagination: { take: 500 }` (or larger) in your graph queries.
