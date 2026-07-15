#!/bin/bash

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SSH_ALIAS="procare"
VPS_PATH="/var/www/procare-ecommerce"

echo "================================================="
echo "        ProCare eComm Deployment Utility         "
echo "================================================="
echo "1) Deploy Code to VPS (git commit + push + remote rebuild & restart)"
echo "2) Sync Local Product Images to VPS via rsync"
echo "3) Deploy & Sync Both (Code + Images)"
echo "================================================="
read -p "Select deployment option (1/2/3): " OPTION

deploy_code() {
    echo "-------------------------------------------------"
    echo "Starting Code Deployment to VPS..."
    cd "$PROJECT_ROOT" || exit 1
    
    read -p "Enter git commit message (default: 'chore: automated deployment update'): " MSG
    if [ -z "$MSG" ]; then
        MSG="chore: automated deployment update"
    fi

    echo "Staged changes and committing to local git..."
    git add .
    git commit -m "$MSG" || echo "No changes to commit locally."
    
    echo "Pushing code to origin main..."
    git push origin main || { echo "❌ Git push failed!"; return 1; }

    echo "🚀 Pulling latest code on VPS and rebuilding containers..."
    ssh "$SSH_ALIAS" "cd $VPS_PATH && git pull origin main && docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build --remove-orphans && docker exec procare_redis redis-cli FLUSHALL && docker restart procare_storefront"
    
    echo "✅ VPS Code Deployment complete."
}

sync_images() {
    echo "-------------------------------------------------"
    echo "Starting Image Synchronization to VPS..."
    cd "$PROJECT_ROOT" || exit 1
    
    # Check if rsync is available locally
    if command -v rsync >/dev/null 2>&1; then
        echo "Syncing storefront/public/images/products/ to VPS..."
        rsync -avz --delete storefront/public/images/products/ "$SSH_ALIAS:$VPS_PATH/storefront/public/images/products/"
        echo "Restarts nginx/storefront on VPS to ensure clean caching..."
        ssh "$SSH_ALIAS" "cd $VPS_PATH && docker restart procare_storefront procare_nginx"
        echo "✅ Image Sync complete."
    else
        echo "⚠️  rsync not found locally, falling back to scp..."
        scp -r storefront/public/images/products/* "$SSH_ALIAS:$VPS_PATH/storefront/public/images/products/"
        ssh "$SSH_ALIAS" "cd $VPS_PATH && docker restart procare_storefront procare_nginx"
        echo "✅ Image Sync via SCP complete."
    fi
}

case "$OPTION" in
    1)
        deploy_code
        ;;
    2)
        sync_images
        ;;
    3)
        deploy_code
        sync_images
        ;;
    *)
        echo "❌ Invalid option selected."
        exit 1
        ;;
esac

echo "================================================="
echo "Deployment operations finished."
