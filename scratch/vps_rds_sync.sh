#!/bin/bash
set -e

RDS_HOST="database-1.c5wkcis2qg1p.ap-south-1.rds.amazonaws.com"
RDS_PORT="5432"
RDS_DB="prepreimiumcare_ecommerce"
RDS_USER="propremiumcare"
RDS_PASSWORD="Mvsc2026##56"

DUMP_FILE="/tmp/local_db_dump.sql"
KEYS_FILE="/tmp/production_api_keys.sql"

echo "=== VPS -> RDS Safe Sync ==="

echo "1. Backing up production API keys..."
docker run --rm -e PGPASSWORD="$RDS_PASSWORD" postgres:latest pg_dump \
  -h "$RDS_HOST" -p "$RDS_PORT" -U "$RDS_USER" -d "$RDS_DB" \
  --table=api_key --table=publishable_api_key_sales_channel --data-only --inserts > "$KEYS_FILE"

echo "2. Dropping and recreating RDS schema..."
docker run --rm -e PGPASSWORD="$RDS_PASSWORD" postgres:latest psql \
  -h "$RDS_HOST" -p "$RDS_PORT" -U "$RDS_USER" -d "$RDS_DB" -c \
  "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO $RDS_USER; GRANT ALL ON SCHEMA public TO public; CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"

echo "3. Importing local DB dump into RDS..."
docker run --rm -e PGPASSWORD="$RDS_PASSWORD" -v "$DUMP_FILE:/tmp/dump.sql:ro" postgres:latest psql \
  -h "$RDS_HOST" -p "$RDS_PORT" -U "$RDS_USER" -d "$RDS_DB" -f "/tmp/dump.sql"

echo "4. Restoring production API keys..."
docker run --rm -e PGPASSWORD="$RDS_PASSWORD" postgres:15-alpine psql \
  -h "$RDS_HOST" -p "$RDS_PORT" -U "$RDS_USER" -d "$RDS_DB" -c \
  "DELETE FROM publishable_api_key_sales_channel; DELETE FROM api_key;"

docker run --rm -e PGPASSWORD="$RDS_PASSWORD" -v "$KEYS_FILE:/tmp/keys.sql:ro" postgres:15-alpine psql \
  -h "$RDS_HOST" -p "$RDS_PORT" -U "$RDS_USER" -d "$RDS_DB" -f "/tmp/keys.sql"

echo "=== Migration Complete! ==="
