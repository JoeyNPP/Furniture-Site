#!/bin/bash
# Safe Deployment Script with Backup
# This creates a backup before making any changes

set -e  # Exit on any error

echo "========================================="
echo "SAFE DEPLOYMENT WITH BACKUP"
echo "========================================="
echo ""

# Step 1: Create backup directory with timestamp
BACKUP_DIR="/root/NPP_Deals_Backup_$(date +%Y%m%d_%H%M%S)"
echo "Step 1: Creating backup at $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# Step 2: Backup current code
echo "Step 2: Backing up current code..."
cd /root/NPP_Deals
cp -r . "$BACKUP_DIR/"
echo "✓ Code backed up"

# Step 3: Export database
echo "Step 3: Backing up database..."
docker exec npp_deals_npp_deals-db-1 pg_dump -U postgres npp_deals > "$BACKUP_DIR/database_backup.sql"
echo "✓ Database backed up"

# Step 4: Save current container state
echo "Step 4: Saving container information..."
docker ps -a > "$BACKUP_DIR/containers.txt"
docker images > "$BACKUP_DIR/images.txt"
echo "✓ Container state saved"

echo ""
echo "========================================="
echo "BACKUP COMPLETE!"
echo "Location: $BACKUP_DIR"
echo "========================================="
echo ""
echo "Backup includes:"
echo "  - All source code"
echo "  - Complete database dump"
echo "  - Container configurations"
echo ""
echo "To restore from backup if needed:"
echo "  cd /root"
echo "  rm -rf NPP_Deals"
echo "  cp -r $BACKUP_DIR NPP_Deals"
echo "  cd NPP_Deals"
echo "  docker-compose down"
echo "  docker-compose up -d"
echo "  # Restore database:"
echo "  docker exec -i npp_deals_npp_deals-db-1 psql -U postgres npp_deals < database_backup.sql"
echo ""
read -p "Backup complete. Continue with deployment? (yes/no): " CONTINUE

if [ "$CONTINUE" != "yes" ]; then
    echo "Deployment cancelled. Your backup is safe at $BACKUP_DIR"
    exit 0
fi

echo ""
echo "========================================="
echo "DEPLOYING NEW VERSION"
echo "========================================="
echo ""

# Pull latest code
echo "Pulling latest code from GitHub..."
git pull origin main

# Run SSL setup
echo "Running SSL setup..."
chmod +x setup-ssl.sh
./setup-ssl.sh

echo ""
echo "========================================="
echo "DEPLOYMENT COMPLETE!"
echo "========================================="
echo ""
echo "Test your site at: https://catalog.nat-procurement.com"
echo ""
echo "If anything goes wrong, restore backup with:"
echo "  cd /root"
echo "  docker-compose -f NPP_Deals/docker-compose.yml down"
echo "  rm -rf NPP_Deals"
echo "  cp -r $BACKUP_DIR NPP_Deals"
echo "  cd NPP_Deals"
echo "  docker-compose up -d"
echo "  docker exec -i npp_deals_npp_deals-db-1 psql -U postgres npp_deals < database_backup.sql"
echo ""
