# NPP Deals Full System Backup - November 23, 2025 (Version 2)

This backup contains all critical configuration and source files for the NPP Deals catalog system.

## Restore Instructions

1. Clone the repository: `git clone https://github.com/JoeyNPP/NPP_Deals.git`
2. Replace files with the contents below
3. Run `docker-compose up -d --build` to deploy

---

## docker-compose.yml

```yaml
version: '3.3'

services:
  npp_deals-db:
    image: postgres:13
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: 26,Sheetpans!
      POSTGRES_DB: npp_deals
      TZ: America/New_York
    volumes:
      - pgdata:/var/lib/postgresql/data
    container_name: npp_deals_npp_deals-db-1
  npp_deals-backend:
    build: ./backend
    environment:
      DB_NAME: npp_deals
      DB_USER: postgres
      DB_PASSWORD: 26,Sheetpans!
      DB_HOST: npp_deals-db
      DB_PORT: 5432
      SECRET_KEY: a-very-strong-secret-key
      TZ: America/New_York
    ports:
      - "8000:8000"
    depends_on:
      - npp_deals-db
    container_name: npp_deals_npp_deals-backend-1
  npp_deals-frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        REACT_APP_FRONTEND_URL: http://104.131.49.141:8000
    environment:
      TZ: America/New_York
    ports:
      - "80:80"
    depends_on:
      - npp_deals-backend
    container_name: npp_deals_npp_deals-frontend-1
volumes:
  pgdata:
```

---

## backend/Dockerfile

```dockerfile
# syntax=docker/dockerfile:1
### Builder stage: install dependencies ###
FROM python:3.8-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN python -m pip install --upgrade pip --root-user-action=ignore \
    && pip install --no-cache-dir --root-user-action=ignore -r requirements.txt

### Final stage: copy in both site-packages and CLI tools ###
FROM python:3.8-slim
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=America/New_York
RUN apt-get update \
    && apt-get install -y --no-install-recommends tzdata \
    && ln -snf /usr/share/zoneinfo/$TZ /etc/localtime \
    && echo $TZ > /etc/timezone \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=builder /usr/local/lib/python3.8/site-packages /usr/local/lib/python3.8/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
EXPOSE 8000
```

---

## frontend/Dockerfile

```dockerfile
FROM node:20-bullseye AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
# Run react-scripts directly via node to avoid symlink issues
RUN node node_modules/react-scripts/bin/react-scripts.js build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

---

## frontend/nginx.conf

```nginx
server {
    listen 80;
    server_name catalog.nat-procurement.com localhost;

    root /usr/share/nginx/html;
    index index.html;

    location /static/ {
        try_files $uri =404;
    }

    location / {
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass http://npp_deals-backend:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## frontend/.env.production

```
PUBLIC_URL=
REACT_APP_API_URL=/api
```

---

## frontend/src/theme.js

```javascript
import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    primary: { main: "#003087" },
    secondary: { main: "#00A651" },
    success: { main: "#00A651" },
    warning: { main: "#FF6B00" },
    background: { default: "#F5F7FA" },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    h3: { fontWeight: 700 },
    h5: { fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          transition: "0.3s",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
          },
        },
      },
    },
  },
});
```

---

## backend/requirements.txt

```
fastapi==0.118.0
uvicorn[standard]==0.33.0
psycopg2-binary==2.9.10
python-dotenv==1.0.1
PyJWT==2.9.0
bcrypt==4.3.0
python-multipart==0.0.20
pytz==2024.1
```

---

## backend/main.py (CORS section)

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://104.131.49.141",
        "http://104.131.49.141:80",
        "http://104.131.49.141:3000",
        "https://catalog.nat-procurement.com",
        "http://catalog.nat-procurement.com",
        "http://localhost",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Deployment Information

- **Droplet IP:** 104.131.49.141
- **Domain (planned):** catalog.nat-procurement.com
- **GitHub Repo:** https://github.com/JoeyNPP/NPP_Deals.git
- **Login credentials:** joey / Winter2025$

## Deploy Commands (on droplet)

```bash
ssh root@104.131.49.141
cd /root/NPP_Deals
git pull origin main
docker-compose down
docker-compose up -d --build
```

## Local Development Commands

```bash
# Start full stack locally
docker-compose up -d --build

# View at http://localhost/catalog (public) or http://localhost (admin login)

# Stop containers
docker-compose down
```

## Key Features (as of this backup)

1. **Public Catalog** (`/catalog`)
   - Product cards with image, price, MOQ, qty, deal cost
   - Checkbox selection with qty dropdown (MOQ multiples + all units option)
   - Request Invoice button on each card (adds product + any selected to email)
   - Header Request Invoice button for bulk selection
   - Mailto links to sales@nat-procurement.com

2. **Filters**
   - Deal Cost presets (Under $1K, $1K-$2.5K, etc.)
   - Marketplace (Amazon, Walmart, eBay)
   - Categories
   - FOB Ports
   - In Stock Only toggle

3. **Sorting**
   - Newest/Oldest
   - Price Low/High
   - Deal Cost Low/High
   - MOQ Low/High

4. **Admin Panel** (`/` with login)
   - Full product management
   - CSV import with flexible date parsing (7 formats supported)
   - CSV export with timestamps
   - Mark out of stock
   - Dark mode toggle (persists across sessions)
   - EST timezone tracking for new products

---

## Git Commit History (recent)

- `51c0eee98` - Add flexible CSV date parsing, EST timezone support, and dark mode fix
- `213a795bc` - Fix Request Invoice button to use unified email format
- `9e5789dc7` - Add qty selector to Request Invoice button on product cards
- `c7252f7ab` - Add SSL support for catalog.nat-procurement.com

---

## Recent Updates (November 24, 2025)

### CSV Import/Export Enhancements
- **Flexible Date Parsing**: Upload CSVs with 7 different date/time formats
  - `11/21/2025, 12:00:00 AM` (with comma and AM/PM)
  - `11/21/2025 12:00:00 AM` (without comma)
  - `11/21/2025` (date only)
  - `2025-11-21` (ISO format)
  - `11-21-2025` (dashes)
  - `2025-11-21 00:00:00` (ISO with time)
  - `11/21/2025 00:00:00` (24-hour format)
- **Column Header Support**: Accepts both "Date" and "Offer Date", "Last Sent"
- **Boolean Handling**: out_of_stock accepts true/false/1/0/yes/y
- **Download Format**: Exports with timestamps for full data backup

### Timezone Support
- Added pytz==2024.1 for accurate EST/EDT handling
- New products automatically use current EST time (not midnight)
- Maintains accurate timestamps for offer tracking

### Dark Mode Fix
- Fixed persistence issue (was checking wrong property)
- Now properly saves and restores dark/light theme across sessions

---

*Backup updated: November 24, 2025 at ~2:40 PM EST*
