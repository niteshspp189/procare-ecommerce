#!/bin/bash

# Configuration
BACKUP_DIR="./backups"
DB_DATA_DIR="./postgres_data"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="procare_db_backup_$TIMESTAMP.tar.gz"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

echo "📦 Starting physical backup of PostgreSQL data directory..."

# Stop the container briefly to ensure data consistency during file copy
# (Alternative: use pg_dump for live backup, but this zips the actual files)
docker stop procare_postgres

# Create a compressed tarball
tar -czf "$BACKUP_DIR/$BACKUP_NAME" "$DB_DATA_DIR"

# Restart the container
docker start procare_postgres

echo "✅ Backup completed: $BACKUP_DIR/$BACKUP_NAME"
echo "⚠️ IMPORTANT: Move this file to another machine (S3, Dropbox, etc.) immediately!"
