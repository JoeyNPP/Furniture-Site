# Safe SSL Deployment Guide

## Important: Read Before Starting
This guide will safely deploy SSL for catalog.nat-procurement.com with full backup and rollback capability.

---

## Step 1: Open Terminal and Connect to Droplet

```bash
ssh root@104.131.49.141
```

---

## Step 2: Create Complete Backup (IMPORTANT!)

Run these commands one at a time:

```bash
# Create timestamped backup directory
BACKUP_DIR="/root/NPP_Deals_Backup_$(date +%Y%m%d_%H%M%S)"
echo "Creating backup at: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# Backup all code
cd /root/NPP_Deals
cp -r . "$BACKUP_DIR/"
echo "✓ Code backed up"

# Backup database
docker exec npp_deals_npp_deals-db-1 pg_dump -U postgres npp_deals > "$BACKUP_DIR/database_backup.sql"
echo "✓ Database backed up"

# Save container state
docker ps -a > "$BACKUP_DIR/containers.txt"
docker images > "$BACKUP_DIR/images.txt"
echo "✓ Container state saved"

echo ""
echo "BACKUP COMPLETE at: $BACKUP_DIR"
echo "You can safely proceed with deployment"
```

**✓ CHECKPOINT:** Verify you see "BACKUP COMPLETE" before continuing.

---

## Step 3: Pull Latest Code from GitHub

```bash
cd /root/NPP_Deals

# Check current git status
git status

# Fetch and update to latest version
git fetch --all
git reset --hard origin/main

# Verify new files are present
ls -la setup-ssl.sh backup-and-deploy.sh
```

**✓ CHECKPOINT:** You should see both `setup-ssl.sh` and `backup-and-deploy.sh` files listed.

---

## Step 4: Install Certbot (SSL Certificate Tool)

```bash
# Update package lists
apt-get update

# Install Certbot
apt-get install -y certbot

# Verify installation
certbot --version
```

**✓ CHECKPOINT:** You should see a version number like "certbot 2.x.x"

---

## Step 5: Stop Containers (Required for SSL)

```bash
cd /root/NPP_Deals
docker-compose down
```

**✓ CHECKPOINT:** You should see containers stopping. The site will be temporarily offline (this is normal).

---

## Step 6: Get SSL Certificate from Let's Encrypt

```bash
certbot certonly --standalone \
  --non-interactive \
  --agree-tos \
  --email sales@nat-procurement.com \
  -d catalog.nat-procurement.com
```

**✓ CHECKPOINT:** You should see "Successfully received certificate" or "Congratulations!"

If you see an error, STOP and tell me what it says. Common issues:
- DNS not propagated (wait 10 more minutes)
- Port 80 blocked (shouldn't happen, we just stopped containers)

---

## Step 7: Verify SSL Certificate Was Created

```bash
ls -la /etc/letsencrypt/live/catalog.nat-procurement.com/
```

**✓ CHECKPOINT:** You should see files: `fullchain.pem`, `privkey.pem`, `cert.pem`, `chain.pem`

---

## Step 8: Restart Containers with SSL

```bash
cd /root/NPP_Deals
docker-compose up -d --build
```

**✓ CHECKPOINT:** This will take 2-3 minutes. Wait for "Started" messages.

---

## Step 9: Verify Deployment

```bash
# Check all containers are running
docker-compose ps

# Check logs for any errors
docker-compose logs --tail=50
```

**✓ CHECKPOINT:** All 3 containers should show "Up"

---

## Step 10: Test Your Site

Open these URLs in your browser:

1. **HTTPS (secure):** https://catalog.nat-procurement.com/catalog
   - Should show your catalog with a padlock icon

2. **IP address (still works):** http://104.131.49.141/catalog
   - Should redirect to HTTPS

3. **Admin login:** https://catalog.nat-procurement.com
   - Login with joey / Winter2025$
   - Test adding/editing products
   - Test CSV upload/download

---

## Step 11: Setup Auto-Renewal (IMPORTANT!)

SSL certificates expire after 90 days. Set up auto-renewal:

```bash
# Test renewal process (dry run)
certbot renew --dry-run

# If successful, add auto-renewal cron job
(crontab -l 2>/dev/null; echo "0 0,12 * * * certbot renew --quiet --deploy-hook 'docker-compose -f /root/NPP_Deals/docker-compose.yml restart npp_deals-frontend'") | crontab -

# Verify cron job was added
crontab -l
```

**✓ CHECKPOINT:** You should see the renewal command in the cron list.

---

## ✅ DEPLOYMENT COMPLETE!

Your catalog is now live at: **https://catalog.nat-procurement.com**

---

## 🚨 ROLLBACK PROCEDURE (If Anything Goes Wrong)

If you need to restore the backup:

```bash
# Stop current containers
cd /root/NPP_Deals
docker-compose down

# Remove current code
cd /root
rm -rf NPP_Deals

# Restore from backup (use your actual backup directory name)
cp -r /root/NPP_Deals_Backup_YYYYMMDD_HHMMSS NPP_Deals

# Restore database
cd NPP_Deals
docker-compose up -d
sleep 10  # Wait for database to start
docker exec -i npp_deals_npp_deals-db-1 psql -U postgres npp_deals < database_backup.sql

# Restart containers
docker-compose restart
```

Your site will be back to the state before deployment.

---

## Support

If you encounter any errors at any step, STOP and copy the error message. I'll help you resolve it before continuing.
