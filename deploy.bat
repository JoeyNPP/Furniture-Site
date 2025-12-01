@echo off
echo Deploying NPP Deals to droplet...
echo.

ssh root@104.131.49.141 "cd /root/NPP_Deals && git fetch origin main && git reset --hard origin/main && docker-compose down && docker-compose up -d --build"

echo.
echo Deployment complete!
echo Check status at: http://104.131.49.141/catalog
pause
