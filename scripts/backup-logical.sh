#!/bin/bash

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/procare_logical_backup_$TIMESTAMP.sql"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

echo "🔍 Starting logical backup (pg_dump) of procare_ecommerce database..."

# Run pg_dump inside the container
docker exec procare_postgres pg_dump -U procare_ecommerce procare_ecommerce > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Logical backup completed: $BACKUP_FILE"
    # Compress the SQL file
    gzip "$BACKUP_FILE"
    echo "📉 Compressed to: ${BACKUP_FILE}.gz"
else
    echo "❌ Backup failed!"
    exit 1
fi
