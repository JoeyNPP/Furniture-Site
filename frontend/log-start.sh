#!/bin/bash
echo "Starting frontend service at $(date)" > /root/NPP_Deals/frontend/start.log
/usr/bin/node /root/NPP_Deals/frontend/start-frontend.js 2>&1 | tee -a /root/NPP_Deals/frontend/start.log
