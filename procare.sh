#!/bin/bash

# Configuration
RDS_URL="postgres://propremiumcare:Mvsc2026%23%2356@database-1.c5wkcis2qg1p.ap-south-1.rds.amazonaws.com:5432/prepreimiumcare_ecommerce?ssl=true&sslmode=require"
SSH_ALIAS="procare"
BACKUP_DIR=".local/backups"

echo "==========================================="
echo "   ProCare eComm Management Script"
echo "==========================================="
echo "1. Manual VPS Deployment (Pull, Rebuild, Flush Cache)"
echo "2. Download RDS Backup locally"
echo "3. Trigger GitHub Actions Deployment (--deploy=true)"
echo "==========================================="
read -p "Select an option (1/2/3): " option

if [ "$option" == "1" ]; then
    read -p "Enter commit message: " msg
    if [ -z "$msg" ]; then
        msg="Manual deployment update"
    fi
    git add .
    git commit -m "$msg"
    git push
    echo "==========================================="
    echo "🚀 Deploying to VPS manually..."
    ssh $SSH_ALIAS "cd /var/www/procare-ecommerce && git pull && docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build --remove-orphans && docker exec procare_redis redis-cli FLUSHALL && docker restart procare_storefront"
    echo "✅ VPS Deployment complete."

elif [ "$option" == "2" ]; then
    mkdir -p "$BACKUP_DIR"
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_FILE="$BACKUP_DIR/rds_backup_$TIMESTAMP.dump"
    echo "==========================================="
    echo "💾 Connecting to RDS through VPS and taking backup..."
    # We pipe the output directly into the local file
    ssh $SSH_ALIAS "docker run -i --rm postgres:latest pg_dump \"$RDS_URL\" -F c" > "$BACKUP_FILE"
    
    if [ -s "$BACKUP_FILE" ]; then
        echo "✅ Backup successfully downloaded to: $BACKUP_FILE"
    else
        echo "❌ Backup failed or file is empty!"
        rm -f "$BACKUP_FILE"
    fi

elif [ "$option" == "3" ]; then
    read -p "Enter commit message: " msg
    if [ -z "$msg" ]; then
        msg="Trigger GitHub Actions deployment"
    fi
    git add .
    git commit -m "$msg --deploy=true"
    git push
    echo "==========================================="
    echo "✅ GitHub Actions deployment triggered."
else
    echo "❌ Invalid option selected."
fi
