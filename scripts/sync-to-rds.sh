#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# sync-to-rds.sh
#
# Exports the current local Docker postgres DB and imports it into the
# production AWS RDS instance, making production match local exactly.
#
# PRE-REQUISITES:
#   1. Local containers must be running  →  docker compose -f docker-compose.yml up -d
#   2. Docker must be installed (used to run psql without a local install)
#   3. Your machine's IP must be whitelisted in the RDS Security Group
#      (AWS Console → RDS → database-1 → Connectivity → Security Groups → Inbound rules)
#      Add: Type=PostgreSQL, Protocol=TCP, Port=5432, Source=<your-public-ip>/32
#
# USAGE:
#   ./scripts/sync-to-rds.sh
#
# ─────────────────────────────────────────────────────────────────────────────
set -e

# ── Colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# ── Local Docker postgres ─────────────────────────────────────────────────────
LOCAL_CONTAINER="procare_postgres"
LOCAL_DB="procare_ecommerce"
LOCAL_USER="procare_ecommerce"

# ── Production RDS (from docker-compose.prod.yml) ────────────────────────────
# URL: postgres://propremiumcare:Mvsc2026%23%2356@database-1.c5wkcis2qg1p.ap-south-1.rds.amazonaws.com:5432/prepreimiumcare_ecommerce
RDS_HOST="database-1.c5wkcis2qg1p.ap-south-1.rds.amazonaws.com"
RDS_PORT="5432"
RDS_DB="prepreimiumcare_ecommerce"
RDS_USER="propremiumcare"
RDS_PASSWORD="Mvsc2026##56"          # URL-decoded from docker-compose.prod.yml

DUMP_FILE="/tmp/procare_rds_sync_$(date +%Y%m%d_%H%M%S).sql"

# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "================================================="
echo "  ProCare Local → Production RDS Sync"
echo "================================================="
echo ""
warn "This will PERMANENTLY ERASE all data in the production RDS database"
warn "and replace it with your current local database."
echo ""
read -p "  Type 'yes' to confirm: " CONFIRM
[[ "$CONFIRM" == "yes" ]] || error "Aborted."
echo ""

# ── Step 1: Verify local container is running ─────────────────────────────────
info "Step 1/4 — Checking local container..."
docker inspect "$LOCAL_CONTAINER" --format '{{.State.Status}}' 2>/dev/null | grep -q "running" \
  || error "Container '$LOCAL_CONTAINER' is not running. Start it first: docker compose -f docker-compose.yml up -d"
success "Container running."

# ── Step 2: Dump local database ───────────────────────────────────────────────
info "Step 2/4 — Exporting local database to $DUMP_FILE ..."
docker exec "$LOCAL_CONTAINER" pg_dump \
  -U "$LOCAL_USER" \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  "$LOCAL_DB" > "$DUMP_FILE"
DUMP_SIZE=$(du -sh "$DUMP_FILE" | cut -f1)
success "Dump complete — ${DUMP_SIZE}B"

# ── Step 3: Test RDS connectivity ─────────────────────────────────────────────
info "Step 3/4 — Testing RDS connectivity (this may take a few seconds)..."
docker run --rm \
  -e PGPASSWORD="$RDS_PASSWORD" \
  -e PGSSLMODE=no-verify \
  postgres:15-alpine \
  psql -h "$RDS_HOST" -p "$RDS_PORT" -U "$RDS_USER" -d "$RDS_DB" -c "SELECT 1 AS connected;" \
  || error "Cannot connect to RDS. Check your IP is whitelisted in the RDS Security Group. See PRE-REQUISITES at the top of this script."
success "RDS connection OK."

# ── Step 4: Clear RDS and restore ────────────────────────────────────────────
info "Step 4/4 — Clearing production RDS and restoring local dump..."

# Mount the dump into the container and run it in two passes:
#   Pass A: drop/recreate schema (clean slate)
#   Pass B: restore data
docker run --rm \
  -e PGPASSWORD="$RDS_PASSWORD" \
  -e PGSSLMODE=no-verify \
  -v "$DUMP_FILE:/tmp/dump.sql:ro" \
  postgres:15-alpine \
  sh -c "
    echo '-- Clearing schema...' && \
    psql -h ${RDS_HOST} -p ${RDS_PORT} -U ${RDS_USER} -d ${RDS_DB} \
      -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;' \
      -c 'GRANT ALL ON SCHEMA public TO ${RDS_USER};' \
      -c 'GRANT ALL ON SCHEMA public TO public;' \
      -c 'CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";' && \
    echo '-- Restoring dump...' && \
    psql -h ${RDS_HOST} -p ${RDS_PORT} -U ${RDS_USER} -d ${RDS_DB} -f /tmp/dump.sql
  "

success "Restore complete!"

# ── Cleanup ───────────────────────────────────────────────────────────────────
rm -f "$DUMP_FILE"

echo ""
echo "================================================="
echo -e "  ${GREEN}Sync finished successfully!${NC}"
echo "  Production RDS now matches your local DB."
echo ""
echo "  Next step — deploy latest code to production:"
echo "    git add -A && git commit -m 'chore: sync release --deploy=true' && git push"
echo "================================================="
echo ""
