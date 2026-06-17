# 🐳 ProCare Ecommerce Docker Operations Guide

This guide contains all the daily commands, access URLs, credentials, and database operations needed to manage the local Dockerized ProCare environment.

---

## 🔗 Quick Access URLs

| Service | Access URL | Port |
| :--- | :--- | :--- |
| **Frontend Storefront** | [http://localhost:9000](http://localhost:9000) | `9000` (Proxied via Nginx) |
| **Admin Dashboard UI** | [http://localhost:9000/store-backend](http://localhost:9000/store-backend) | `9000` (Proxied via Nginx) |
| **Backend API Base** | [http://localhost:9000/store](http://localhost:9000/store) | `9000` (Proxied via Nginx) |
| **PostgreSQL Database** | `localhost:5432` | `5432` |
| **Redis Cache** | `localhost:6379` | `6379` |

> [!NOTE]
> All external traffic goes through the reverse proxy Nginx on port `9000`. The backend itself runs internally in the Docker network on port `9000` (and Vite HMR on `5173`), and storefront runs internally on `8000`.

---

## 🔑 Admin Credentials

To log into the Admin Dashboard at [http://localhost:9000/store-backend](http://localhost:9000/store-backend), use either of the following seed accounts:

* **Username Options:**
  - `admin@procareshop.com`
  - `admin@procare.com`
* **Password:** `Admin@2026#`

---

## 🛠️ Daily Docker Commands

Always run these commands from the root directory of the project:

### Service Lifecycle Management

```bash
# Start all services in the background (detached mode)
docker compose up -d

# Restart all services
docker compose restart

# Stop all services and clean up containers/networks
docker compose down

# Rebuild images and start all services
docker compose up --build -d
```

### Checking Logs

```bash
# Follow logs for all services combined
docker compose logs -f

# Follow logs for the backend container only
docker compose logs -f backend

# Follow logs for the storefront container only
docker compose logs -f storefront

# Follow logs for Nginx
docker compose logs -f nginx
```

---

## 💾 Database Backup & Restore Operations

### 1. Taking a Backup (Daily Dump)

Run the automated backup script from the project root directory:
```bash
# Generate a new backup in a folder named with the current date/time:
./db-backup/create-backup.sh
```
This generates a directory like `db-backup/backup_YYYYMMDD_HHMMSS/` containing `procare_ecommerce_backup.sql`.

### 2. Restoring a Backup

To restore your database from a SQL backup file:
```bash
# ⚠️ Warning: This clears the existing public schema
docker exec -i procare_postgres psql -U procare_ecommerce -d procare_ecommerce -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Import the SQL dump
cat db-backup/procare_ecommerce_backup_current.sql | docker exec -i procare_postgres psql -U procare_ecommerce -d procare_ecommerce
```

---

## 🚀 Medusa Seed Scripts & Database Operations

To run migrations or seed data inside the backend container:

```bash
# Run database migrations
docker exec -it procare_backend npx medusa db:migrate

# Seed original dummy products
docker exec -it procare_backend npm run seed

# Seed custom bulk catalog products (20+ items)
docker exec -it procare_backend npx medusa exec src/scripts/seed-more.ts

# Seed inventory quantities (makes products In Stock)
docker exec -it procare_backend npx medusa exec src/scripts/seed-inventory.ts

# Create collections for homepage categories
docker exec -it procare_backend npx medusa exec src/scripts/seed-collections.ts
```
Here are the products in the catalog that have multiple color variants, along with their local storefront URLs:

Pro Gold Color Shoe Cream (10 color variants: Neutral, Black, Light Brown, Medium Brown, Dark Brown, Tan, Cognac, Mahogany, Blue, White)
Local URL: http://localhost:9000/products/pro-gold-color-shoe-cream
Pro Gold Color Shoe Cream with Applicator (3 color variants: Neutral, Light Brown, Black)
Local URL: http://localhost:9000/products/pro-gold-color-shoe-cream-with-applicator
Pro Gold Shine Self Shine (3 color variants: Neutral, Black, Brown)
Local URL: http://localhost:9000/products/pro-gold-shine-self-shine
Pro Gold Shine Instant Shine (3 color variants: Neutral, Black, Brown)
Local URL: http://localhost:9000/products/pro-gold-shine-instant-shine