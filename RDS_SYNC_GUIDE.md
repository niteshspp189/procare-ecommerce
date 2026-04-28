# 🛡️ ProCare Database Sync Guide (RDS to Local)

This guide provides the exact steps to backup your production AWS RDS database and restore it into your local Docker development environment.

## 📋 Prerequisites

Ensure your local project is running and you have SSH access to the production VPS.

---

## 🚀 Step 1: Export from Production (RDS)

Run this command from your **Local Machine**. It uses the VPS backend container (which has the `pg_dump` tool) to extract data from RDS and save it directly to your current local directory.

```bash
ssh procare "docker exec procare_backend sh -c \"export PGPASSWORD='Mvsc2026##56'; pg_dump -U propremiumcare -h database-1.c5wkcis2qg1p.ap-south-1.rds.amazonaws.com -d prepreimiumcare_ecommerce --no-owner\"" > prod_backup_$(date +%F).sql
```

> **Note:** If the command fails with `pg_dump: command not found`, first install the client on the VPS container once:
> `ssh procare "docker exec procare_backend apk add --no-cache postgresql-client"`

---

## 🧹 Step 2: Clear Local Database

Before restoring, wipe your local database schema to avoid "Duplicate ID" or "Unique Constraint" errors.

```bash
docker exec procare_postgres psql -U procare_ecommerce -d procare_ecommerce -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

---

## 📥 Step 3: Restore Locally

Inject the production dump into your local Docker container. Replace `FILE_NAME.sql` with the actual file generated in Step 1.

```bash
docker exec -i procare_postgres psql -U procare_ecommerce -d procare_ecommerce < prod_backup_XXXX-XX-XX.sql
```

---

## 🔍 Step 4: Verify Success

Check that your local DB now matches production (you should see 23 products).

```bash
docker exec procare_postgres psql -U procare_ecommerce -d procare_ecommerce -c "SELECT count(*) FROM product"
```

### 💡 Pro Tips:
*   **SSL Support**: The RDS instance requires SSL. The `pg_dump` command handles this automatically through the existing VPS configuration.
*   **Wait for Nginx**: After a restore, your local Medusa backend might need a minute to re-index the new data. If the storefront shows "No products," simply restart the backend container: `docker restart procare_backend`.

---
*Created on 2026-04-24 by Antigravity.*
