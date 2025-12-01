#!/bin/bash
# SSL Setup Script for catalog.nat-procurement.com
# Run this on the droplet after deploying the updated code

echo "========================================="
echo "SSL Setup for catalog.nat-procurement.com"
echo "========================================="
echo ""

# Step 1: Install Certbot
echo "Step 1: Installing Certbot..."
apt-get update
apt-get install -y certbot

# Step 2: Stop containers to free up port 80 for Certbot
echo ""
echo "Step 2: Stopping Docker containers..."
cd /root/NPP_Deals
docker-compose down

# Step 3: Get SSL certificate
echo ""
echo "Step 3: Obtaining SSL certificate from Let's Encrypt..."
certbot certonly --standalone \
  --non-interactive \
  --agree-tos \
  --email sales@nat-procurement.com \
  -d catalog.nat-procurement.com

# Step 4: Restart containers with SSL
echo ""
echo "Step 4: Starting Docker containers with SSL..."
docker-compose up -d --build

# Step 5: Setup auto-renewal
echo ""
echo "Step 5: Setting up auto-renewal..."
# Add renewal cron job (runs twice daily)
(crontab -l 2>/dev/null; echo "0 0,12 * * * certbot renew --quiet --deploy-hook 'docker-compose -f /root/NPP_Deals/docker-compose.yml restart npp_deals-frontend'") | crontab -

echo ""
echo "========================================="
echo "SSL Setup Complete!"
echo "========================================="
echo ""
echo "Your site is now available at:"
echo "  https://catalog.nat-procurement.com"
echo ""
echo "Certificate auto-renewal is configured."
echo "Certificates will renew automatically before expiration."
echo ""
