# NPP Deals - Full Project Backup
## Created: 2024 - Complete Working State with Invoice Request System

---

# PROJECT STRUCTURE

```
NPP_Deals/
├── backend/
│   ├── Dockerfile
│   ├── main.py
│   └── requirements.txt
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Catalog.js
│   │   │   ├── CategoryPage.js
│   │   │   ├── CustomizeColumnsDialog.js
│   │   │   ├── InternalProductList.js
│   │   │   ├── Login.js
│   │   │   ├── ProductFormDialog.js
│   │   │   └── SettingsDialog.js
│   │   ├── settings/
│   │   │   └── SettingsContext.js
│   │   ├── api.js
│   │   ├── App.js
│   │   ├── emailSender.js
│   │   ├── index.js
│   │   └── theme.js
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
└── FULL_BACKUP_2024.md
```

---

# DOCKER CONFIGURATION

## docker-compose.yml
```yaml
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
        REACT_APP_FRONTEND_URL: http://159.65.184.143:8000
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

## backend/Dockerfile
```dockerfile
# syntax=docker/dockerfile:1
### Builder stage: install dependencies ###
FROM python:3.8-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN python -m pip install --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

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

## frontend/Dockerfile
```dockerfile
FROM node:20-bullseye AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
# Permanent fix for npm 10.8+ broken symlink bug
RUN cd node_modules/.bin && rm -f react-scripts && ln -s ../react-scripts/bin/react-scripts.js react-scripts
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

## frontend/nginx.conf
```nginx
server {
    listen 80;
    server_name localhost;

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

## frontend/package.json
```json
{
  "name": "npp_deals-frontend",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "@emotion/react": "^11.14.0",
    "@emotion/styled": "^11.14.0",
    "@mui/icons-material": "^5.18.0",
    "@mui/material": "^5.18.0",
    "@mui/x-data-grid": "^5.17.26",
    "axios": "^1.12.2",
    "jwt-decode": "^3.1.2",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.30.1",
    "react-scripts": "^5.0.1",
    "xlsx": "^0.18.5"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  },
  "devDependencies": {
    "http-proxy-middleware": "^3.0.3"
  }
}
```

---

# BACKEND CODE

## backend/main.py
```python
import os
import csv
import io
import re
import unicodedata
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import Optional, List
import psycopg2
from psycopg2.extras import RealDictCursor, Json
from datetime import datetime, timedelta
import jwt
import bcrypt

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://159.65.184.143",
        "http://159.65.184.143:80",
        "http://159.65.184.143:3000",
        "http://localhost",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load environment variables
load_dotenv('.env.local', override=True)  # Prefer .env.local for local testing
load_dotenv('.env')  # Fallback to .env for live

# Database connection
def get_db_connection():
    return psycopg2.connect(
        dbname=os.getenv("DB_NAME", "npp_deals"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "26,Sheetpans!"),
        host=os.getenv("DB_HOST", "npp_deals-db"),
        port=os.getenv("DB_PORT", "5432"),
        cursor_factory=RealDictCursor
    )

# Create tables
def init_db():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS products (
            id SERIAL PRIMARY KEY,
            title TEXT,
            category TEXT,
            vendor_id TEXT,
            vendor TEXT,
            price FLOAT,
            cost FLOAT,
            moq INTEGER,
            qty INTEGER,
            upc TEXT,
            asin TEXT,
            lead_time TEXT,
            exp_date TEXT,
            fob TEXT,
            image_url TEXT,
            out_of_stock BOOLEAN DEFAULT FALSE,
            amazon_url TEXT,
            walmart_url TEXT,
            ebay_url TEXT,
            offer_date TIMESTAMP,
            last_sent TIMESTAMP,
            sales_per_month INTEGER,
            net FLOAT,
            date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            username TEXT PRIMARY KEY,
            password TEXT NOT NULL
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS user_settings (
            username TEXT PRIMARY KEY,
            settings JSONB NOT NULL DEFAULT '{"theme": "light", "textScale": 1.0, "columnVisibility": {"title": true, "price": true}}'
        )
    """)
    # Ensure default users exist with shared credentials
    cur.execute("DELETE FROM users WHERE username = %s", ("joey/alex",))
    for username in ("joey", "alex"):
        cur.execute("""
            INSERT INTO users (username, password)
            VALUES (%s, %s)
            ON CONFLICT (username) DO NOTHING
        """, (
            username,
            bcrypt.hashpw("Winter2025$".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        ))
    conn.commit()
    cur.close()
    conn.close()

def normalize_category_value(value: Optional[str]) -> str:
    """Return a normalized key for category comparisons."""
    if not value:
        return ""
    normalized = unicodedata.normalize("NFKD", value)
    ascii_only = normalized.encode("ascii", "ignore").decode("ascii")
    ascii_only = ascii_only.replace("&", " and ")
    ascii_only = re.sub(r"[^\w\s]", " ", ascii_only)
    ascii_only = re.sub(r"\s+", " ", ascii_only)
    return ascii_only.strip().lower()


# Initialize database
init_db()

# JWT settings
SECRET_KEY = os.getenv("SECRET_KEY", "a-very-strong-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "720"))

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# Root endpoint for healthcheck
@app.get("/")
async def root():
    return {"message": "NPP Deals Backend"}

# Pydantic models
class Product(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    vendor_id: Optional[str] = None
    vendor: Optional[str] = None
    price: Optional[float] = None
    cost: Optional[float] = None
    moq: Optional[int] = None
    qty: Optional[int] = None
    upc: Optional[str] = None
    asin: Optional[str] = None
    lead_time: Optional[str] = None
    exp_date: Optional[str] = None
    fob: Optional[str] = None
    image_url: Optional[str] = None
    out_of_stock: Optional[bool] = False
    amazon_url: Optional[str] = None
    walmart_url: Optional[str] = None
    ebay_url: Optional[str] = None
    offer_date: Optional[datetime] = None
    last_sent: Optional[datetime] = None
    sales_per_month: Optional[int] = None
    net: Optional[float] = None

class ProductUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    vendor_id: Optional[str] = None
    vendor: Optional[str] = None
    price: Optional[float] = None
    cost: Optional[float] = None
    moq: Optional[int] = None
    qty: Optional[int] = None
    upc: Optional[str] = None
    asin: Optional[str] = None
    lead_time: Optional[str] = None
    exp_date: Optional[str] = None
    fob: Optional[str] = None
    image_url: Optional[str] = None
    out_of_stock: Optional[bool] = None
    amazon_url: Optional[str] = None
    walmart_url: Optional[str] = None
    ebay_url: Optional[str] = None
    offer_date: Optional[datetime] = None
    last_sent: Optional[datetime] = None
    sales_per_month: Optional[int] = None
    net: Optional[float] = None

class UserSettings(BaseModel):
    theme: Optional[str] = "light"
    textScale: Optional[float] = 1.0
    columnVisibility: Optional[dict] = {"title": True, "price": True}

# Authentication
def verify_password(plain_password, hashed_password):
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    return username

@app.post("/login")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE username = %s", (form_data.username,))
    user = cur.fetchone()
    cur.close()
    conn.close()
    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# Product routes
@app.get("/products")
async def get_products(current_user: str = Depends(get_current_user)):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM products ORDER BY date_added DESC")
    products = cur.fetchall()
    cur.close()
    conn.close()
    return {"products": products}

@app.get("/products/public")
async def get_public_products():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM products WHERE out_of_stock = FALSE ORDER BY date_added DESC")
    products = cur.fetchall()
    cur.close()
    conn.close()
    return products

@app.get("/products/category/{category}")
async def get_products_by_category(category: str):
    normalized_query = normalize_category_value(category)
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT title, price, COALESCE(image_url, '') AS image_url, category
        FROM products
        WHERE category IS NOT NULL
        ORDER BY title ASC
        """
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()

    filtered = [
        row for row in rows
        if normalize_category_value(row.get("category")) == normalized_query
    ]
    if not filtered:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No products found in category {category}",
        )

    display_category = (filtered[0].get("category") or category).strip()

    simplified = [
        {
            "title": row.get("title"),
            "price": row.get("price"),
            "image_url": row.get("image_url") or "https://via.placeholder.com/150",
        }
        for row in filtered
    ]
    return {"category": display_category, "products": simplified}

@app.post("/products")
async def create_product(product: Product, current_user: str = Depends(get_current_user)):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO products (
          title, category, vendor_id, vendor, price, cost, moq, qty, upc, asin, lead_time,
          exp_date, fob, image_url, out_of_stock, amazon_url, walmart_url, ebay_url, offer_date,
          last_sent, sales_per_month, net, date_added
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id
        """, (
            product.title, product.category, product.vendor_id, product.vendor, product.price, product.cost,
            product.moq, product.qty, product.upc, product.asin, product.lead_time, product.exp_date, product.fob,
            product.image_url, product.out_of_stock, product.amazon_url, product.walmart_url, product.ebay_url,
            product.offer_date, product.last_sent, product.sales_per_month, product.net,
            datetime.now()
        ))
    product_id = cur.fetchone()['id']
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Product created successfully", "product_id": product_id}

@app.patch("/products/{id}")
async def update_product(id: int, product: ProductUpdate, current_user: str = Depends(get_current_user)):
    conn = get_db_connection()
    cur = conn.cursor()
    update_fields = []
    values = []
    if product.title is not None:
        update_fields.append("title = %s")
        values.append(product.title)
    if product.category is not None:
        update_fields.append("category = %s")
        values.append(product.category)
    if product.vendor_id is not None:
        update_fields.append("vendor_id = %s")
        values.append(product.vendor_id)
    if product.vendor is not None:
        update_fields.append("vendor = %s")
        values.append(product.vendor)
    if product.price is not None:
        update_fields.append("price = %s")
        values.append(product.price)
    if product.cost is not None:
        update_fields.append("cost = %s")
        values.append(product.cost)
    if product.moq is not None:
        update_fields.append("moq = %s")
        values.append(product.moq)
    if product.qty is not None:
        update_fields.append("qty = %s")
        values.append(product.qty)
    if product.upc is not None:
        update_fields.append("upc = %s")
        values.append(product.upc)
    if product.asin is not None:
        update_fields.append("asin = %s")
        values.append(product.asin)
    if product.lead_time is not None:
        update_fields.append("lead_time = %s")
        values.append(product.lead_time)
    if product.exp_date is not None:
        update_fields.append("exp_date = %s")
        values.append(product.exp_date)
    if product.fob is not None:
        update_fields.append("fob = %s")
        values.append(product.fob)
    if product.image_url is not None:
        update_fields.append("image_url = %s")
        values.append(product.image_url)
    if product.out_of_stock is not None:
        update_fields.append("out_of_stock = %s")
        values.append(product.out_of_stock)
    if product.amazon_url is not None:
        update_fields.append("amazon_url = %s")
        values.append(product.amazon_url)
    if product.walmart_url is not None:
        update_fields.append("walmart_url = %s")
        values.append(product.walmart_url)
    if product.ebay_url is not None:
        update_fields.append("ebay_url = %s")
        values.append(product.ebay_url)
    if product.offer_date is not None:
        update_fields.append("offer_date = %s")
        values.append(product.offer_date)
    if product.last_sent is not None:
        update_fields.append("last_sent = %s")
        values.append(product.last_sent)
    if product.sales_per_month is not None:
        update_fields.append("sales_per_month = %s")
        values.append(product.sales_per_month)
    if product.net is not None:
        update_fields.append("net = %s")
        values.append(product.net)
    if not update_fields:
        cur.close()
        conn.close()
        raise HTTPException(status_code=400, detail="No fields to update")
    values.append(id)
    query = f"UPDATE products SET {', '.join(update_fields)} WHERE id = %s"
    cur.execute(query, values)
    if cur.rowcount == 0:
        cur.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Product not found")
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Product updated successfully"}

@app.delete("/products/{id}")
async def delete_product(id: int, current_user: str = Depends(get_current_user)):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM products WHERE id = %s", (id,))
    if cur.rowcount == 0:
        cur.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Product not found")
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Product deleted successfully"}

@app.post("/products/{id}/mark-out-of-stock")
async def mark_product_out_of_stock(id: int, current_user: str = Depends(get_current_user)):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("UPDATE products SET out_of_stock = true WHERE id = %s", (id,))
    if cur.rowcount == 0:
        cur.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Product not found")
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Product marked as out-of-stock"}

@app.get("/products/search")
async def search_products(query: str, current_user: str = Depends(get_current_user)):
    conn = get_db_connection()
    cur = conn.cursor()
    search_query = f"%{query}%"
    cur.execute("""
        SELECT * FROM products
        WHERE title ILIKE %s
        OR category ILIKE %s
        OR vendor ILIKE %s
        OR upc ILIKE %s
        OR asin ILIKE %s
        ORDER BY date_added DESC
    """, (search_query, search_query, search_query, search_query, search_query))
    products = cur.fetchall()
    cur.close()
    conn.close()
    return {"products": products}

@app.post("/products/import")
async def import_products(file: UploadFile = File(...), current_user: str = Depends(get_current_user)):
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")
    try:
        text = contents.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = contents.decode("latin-1")
    reader = csv.DictReader(io.StringIO(text))
    if reader.fieldnames is None:
        raise HTTPException(status_code=400, detail="CSV file is missing headers")
    field_map = {
        "date": "offer_date",
        "amazon url": "amazon_url",
        "asin": "asin",
        "price": "price",
        "moq": "moq",
        "qty": "qty",
        "upc": "upc",
        "cost": "cost",
        "vendor": "vendor",
        "lead time": "lead_time",
        "exp date": "exp_date",
        "fob": "fob",
        "vendor id": "vendor_id",
        "image url": "image_url",
        "title": "title",
        "category": "category",
        "walmart url": "walmart_url",
        "ebay url": "ebay_url",
        "sales per month": "sales_per_month",
        "net": "net"
    }
    float_fields = {"price", "cost", "net", "sales_per_month"}
    int_fields = {"moq", "qty"}
    conn = get_db_connection()
    cur = conn.cursor()
    inserted = updated = skipped = 0
    for raw_row in reader:
        row = {(key or "").strip(): (value or "").strip() for key, value in raw_row.items()}
        normalized = {key.lower(): value for key, value in row.items() if key}
        asin_value = normalized.get("asin") or None
        title_value = normalized.get("title") or None
        if not asin_value and not title_value:
            skipped += 1
            continue
        record = {}
        for header, column in field_map.items():
            value = normalized.get(header)
            if value in (None, ""):
                continue
            if column in float_fields:
                try:
                    record[column] = float(value.replace(",", ""))
                except ValueError:
                    continue
            elif column in int_fields:
                try:
                    record[column] = int(float(value.replace(",", "")))
                except ValueError:
                    continue
            elif column == "offer_date":
                parsed = None
                for pattern in ("%m/%d/%Y", "%Y-%m-%d", "%m-%d-%Y"):
                    try:
                        parsed = datetime.strptime(value, pattern)
                        break
                    except ValueError:
                        continue
                if parsed:
                    record[column] = parsed
            else:
                record[column] = value
        product_id = None
        if asin_value:
            cur.execute("SELECT id FROM products WHERE asin = %s", (asin_value,))
            match = cur.fetchone()
            if match:
                product_id = match["id"]
        if product_id is None and title_value:
            cur.execute("SELECT id FROM products WHERE title = %s", (title_value,))
            match = cur.fetchone()
            if match:
                product_id = match["id"]
        if product_id:
            if record:
                update_fields = []
                values = []
                for column, value in record.items():
                    update_fields.append(f"{column} = %s")
                    values.append(value)
                values.append(product_id)
                cur.execute(
                    f"UPDATE products SET {', '.join(update_fields)} WHERE id = %s",
                    values
                )
                updated += 1
            else:
                skipped += 1
        else:
            if record:
                columns = list(record.keys())
                placeholders = ["%s"] * len(columns)
                values = [record[column] for column in columns]
                columns.append("date_added")
                placeholders.append("%s")
                values.append(datetime.now())
                cur.execute(
                    f"INSERT INTO products ({', '.join(columns)}) VALUES ({', '.join(placeholders)})",
                    values
                )
                inserted += 1
            else:
                skipped += 1
    conn.commit()
    cur.close()
    conn.close()
    return {"inserted": inserted, "updated": updated, "skipped": skipped}

class UserSettings(BaseModel):
    theme: Optional[str] = "light"
    textScale: Optional[float] = 1.0
    columnVisibility: Optional[dict] = {"title": True, "price": True}

@app.get("/user/settings")
async def get_user_settings(current_user: str = Depends(get_current_user)):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT settings FROM user_settings WHERE username = %s", (current_user,))
    settings = cur.fetchone()
    cur.close()
    conn.close()
    if settings and "settings" in settings:
        return settings["settings"]
    return {"theme": "light", "textScale": 1.0, "columnVisibility": {"title": True, "price": True}}

@app.patch("/user/settings")
async def update_user_settings(settings: UserSettings, current_user: str = Depends(get_current_user)):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO user_settings (username, settings)
        VALUES (%s, %s)
        ON CONFLICT (username) DO UPDATE SET settings = EXCLUDED.settings
    """, (current_user, Json(settings.dict())))
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Settings updated", "settings": settings.dict()}

@app.post("/user/settings")
async def create_user_settings(settings: UserSettings, current_user: str = Depends(get_current_user)):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("INSERT INTO user_settings (username, settings) VALUES (%s, %s) ON CONFLICT (username) DO NOTHING", (current_user, Json(settings.dict())))
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Settings created", "settings": settings.dict()}


# Invoice Request Models and Endpoint
class InvoiceRequest(BaseModel):
    customer_name: str
    customer_email: str
    customer_company: Optional[str] = None
    customer_phone: Optional[str] = None
    product_ids: List[int]


def send_invoice_email(customer_info: dict, products: list):
    """Send invoice request email to NPP sales team."""
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_pass = os.getenv("SMTP_PASS", "")
    recipient_email = os.getenv("INVOICE_RECIPIENT", "sales@nppwholesale.com")

    if not smtp_user or not smtp_pass:
        print("SMTP credentials not configured, skipping email")
        return False

    # Build product table HTML
    product_rows = ""
    for p in products:
        product_rows += f"""
        <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">{p.get('title', 'N/A')}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">{p.get('vendor', 'N/A')}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${p.get('price', 0):.2f}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">{p.get('moq', 'N/A')}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">{p.get('qty', 0)}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">{p.get('fob', 'N/A')}</td>
        </tr>
        """

    html_body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; color: #333;">
        <div style="background: #003087; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">New Invoice Request</h1>
        </div>
        <div style="padding: 20px;">
            <h2 style="color: #003087;">Customer Information</h2>
            <table style="width: 100%; margin-bottom: 20px;">
                <tr><td><strong>Name:</strong></td><td>{customer_info.get('name', 'N/A')}</td></tr>
                <tr><td><strong>Email:</strong></td><td>{customer_info.get('email', 'N/A')}</td></tr>
                <tr><td><strong>Company:</strong></td><td>{customer_info.get('company', 'N/A')}</td></tr>
                <tr><td><strong>Phone:</strong></td><td>{customer_info.get('phone', 'N/A')}</td></tr>
            </table>

            <h2 style="color: #003087;">Requested Products ({len(products)} items)</h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <thead>
                    <tr style="background: #003087; color: white;">
                        <th style="padding: 10px; text-align: left;">Product</th>
                        <th style="padding: 10px; text-align: left;">Vendor</th>
                        <th style="padding: 10px; text-align: left;">Price</th>
                        <th style="padding: 10px; text-align: left;">MOQ</th>
                        <th style="padding: 10px; text-align: left;">In Stock</th>
                        <th style="padding: 10px; text-align: left;">FOB</th>
                    </tr>
                </thead>
                <tbody>
                    {product_rows}
                </tbody>
            </table>

            <p style="color: #666; font-size: 12px;">
                This request was submitted on {datetime.now().strftime('%B %d, %Y at %I:%M %p')} via the NPP Live Catalog.
            </p>
        </div>
    </body>
    </html>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Invoice Request from {customer_info.get('name', 'Customer')} - {len(products)} Products"
    msg["From"] = smtp_user
    msg["To"] = recipient_email
    msg["Reply-To"] = customer_info.get('email', smtp_user)

    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_user, [recipient_email], msg.as_string())
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False


@app.post("/request-invoice")
async def request_invoice(request: InvoiceRequest):
    if not request.product_ids:
        raise HTTPException(status_code=400, detail="No products selected")

    conn = get_db_connection()
    cur = conn.cursor()

    # Fetch the requested products
    placeholders = ','.join(['%s'] * len(request.product_ids))
    cur.execute(f"SELECT * FROM products WHERE id IN ({placeholders})", request.product_ids)
    products = cur.fetchall()
    cur.close()
    conn.close()

    if not products:
        raise HTTPException(status_code=404, detail="No products found")

    customer_info = {
        "name": request.customer_name,
        "email": request.customer_email,
        "company": request.customer_company or "Not provided",
        "phone": request.customer_phone or "Not provided",
    }

    # Send email
    email_sent = send_invoice_email(customer_info, products)

    return {
        "message": "Invoice request submitted successfully",
        "products_count": len(products),
        "email_sent": email_sent,
    }
```

---

# FRONTEND CODE

## frontend/public/index.html
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>NPP Deals</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
```

## frontend/src/index.js
```javascript
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { SettingsProvider } from './settings/SettingsContext';

ReactDOM.render(
  <BrowserRouter>
    <SettingsProvider>
      <App />
    </SettingsProvider>
  </BrowserRouter>,
  document.getElementById('root')
);
```

## frontend/src/App.js
```javascript
import React, { useContext, useMemo } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Login from "./components/Login";
import InternalProductList from "./components/InternalProductList";
import CategoryPage from "./components/CategoryPage";
import Catalog from "./components/Catalog";
import { Box, CssBaseline } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { SettingsContext } from "./settings/SettingsContext";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const location = useLocation();
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};

function App() {
  const { settings } = useContext(SettingsContext);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: settings.darkMode ? "dark" : "light",
        },
      }),
    [settings.darkMode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route
            path="/products"
            element={
              <ProtectedRoute>
                <InternalProductList />
              </ProtectedRoute>
            }
          />
          <Route path="/category/:category" element={<CategoryPage />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Box>
    </ThemeProvider>
  );
}

export default App;
```

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

## frontend/src/api.js
```javascript
import jwtDecode from "jwt-decode"; // Compatible with jwt-decode@3.x

export const API_BASE_URL = "/api";

const withAuthHeaders = (token, extra = {}) => ({
  Authorization: `Bearer ${token}`,
  ...extra,
});

async function login(username, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ username, password }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Login failed for ${username}:`, error);
    throw error;
  }
}

function requireToken() {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Authentication token not found");
  }
  return token;
}

async function fetchProducts() {
  const token = requireToken();
  try {
    const decodedToken = jwtDecode(token);
    console.debug("Fetching products with token exp:", decodedToken.exp);
    const response = await fetch(`${API_BASE_URL}/products`, {
      headers: withAuthHeaders(token, { "Content-Type": "application/json" }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Fetch products error:", error);
    throw error;
  }
}

async function fetchPublicProducts() {
  try {
    const response = await fetch(`${API_BASE_URL}/products/public`, {
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Fetch public products error:", error);
    throw error;
  }
}

async function createProduct(data) {
  const token = requireToken();
  try {
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: "POST",
      headers: withAuthHeaders(token, { "Content-Type": "application/json" }),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Create product error:", error);
    throw error;
  }
}

async function updateProduct(id, data) {
  const token = requireToken();
  try {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: "PATCH",
      headers: withAuthHeaders(token, { "Content-Type": "application/json" }),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Update product error for ID ${id}:`, error);
    throw error;
  }
}

async function deleteProduct(id) {
  const token = requireToken();
  try {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: "DELETE",
      headers: withAuthHeaders(token, { "Content-Type": "application/json" }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Delete product error for ID ${id}:`, error);
    throw error;
  }
}

async function markOutOfStock(id) {
  const token = requireToken();
  try {
    const response = await fetch(`${API_BASE_URL}/products/${id}/mark-out-of-stock`, {
      method: "POST",
      headers: withAuthHeaders(token, { "Content-Type": "application/json" }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Mark out-of-stock error for ID ${id}:`, error);
    throw error;
  }
}

async function uploadProducts(file) {
  const token = requireToken();
  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${API_BASE_URL}/products/import`, {
      method: "POST",
      headers: withAuthHeaders(token),
      body: formData,
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Upload products error:", error);
    throw error;
  }
}

async function fetchProductsByCategory(category) {
  const token = localStorage.getItem("token");
  const headers = token ? withAuthHeaders(token) : {};
  try {
    const response = await fetch(`${API_BASE_URL}/products/category/${encodeURIComponent(category)}`, {
      headers,
    });
    if (!response.ok) {
      if (response.status === 404) {
        return { category, products: [] };
      }
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Fetch products by category failed for ${category}:`, error);
    throw error;
  }
}

async function searchProducts(query) {
  const token = requireToken();
  try {
    const response = await fetch(`${API_BASE_URL}/products/search?query=${encodeURIComponent(query)}`, {
      headers: withAuthHeaders(token, { "Content-Type": "application/json" }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Search products error for query '${query}':`, error);
    throw error;
  }
}

export async function fetchUserSettings() {
  const token = localStorage.getItem("token");
  if (!token) {
    return null;
  }
  try {
    const response = await fetch(`${API_BASE_URL}/user/settings`, {
      headers: withAuthHeaders(token, { "Content-Type": "application/json" }),
    });
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Fetch user settings error:", error);
    return null;
  }
}

export async function persistUserSettings(nextSettings) {
  const token = localStorage.getItem("token");
  if (!token) {
    return;
  }
  const options = {
    headers: withAuthHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(nextSettings),
  };
  try {
    let response = await fetch(`${API_BASE_URL}/user/settings`, {
      method: "PATCH",
      ...options,
    });
    if (response.status === 404) {
      response = await fetch(`${API_BASE_URL}/user/settings`, {
        method: "POST",
        ...options,
      });
    }
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
  } catch (error) {
    console.error("Persist user settings error:", error);
  }
}

async function requestInvoice(customerInfo, productIds) {
  try {
    const response = await fetch(`${API_BASE_URL}/request-invoice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_name: customerInfo.name,
        customer_email: customerInfo.email,
        customer_company: customerInfo.company,
        customer_phone: customerInfo.phone,
        product_ids: productIds,
      }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Request invoice error:", error);
    throw error;
  }
}

export {
  login,
  fetchProducts,
  fetchPublicProducts,
  fetchProductsByCategory,
  createProduct,
  updateProduct,
  deleteProduct,
  markOutOfStock,
  searchProducts,
  uploadProducts,
  requestInvoice,
};
```

## frontend/src/settings/SettingsContext.js
```javascript
import React, { createContext, useContext, useEffect, useState } from "react";
import { fetchUserSettings, persistUserSettings } from "../api";

const DEFAULT_SETTINGS = {
  theme: "light",
  textScale: 1.0,
  columnVisibility: { title: true, price: true },
};

const loadStoredSettings = () => {
  try {
    const raw = localStorage.getItem("userSettings");
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (error) {
    console.error("Failed to parse stored user settings:", error);
  }
  return DEFAULT_SETTINGS;
};

const SettingsContext = createContext({
  settings: DEFAULT_SETTINGS,
  updateSettings: () => {},
});

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(loadStoredSettings);

  useEffect(() => {
    let isMounted = true;
    const bootstrap = async () => {
      const remoteSettings = await fetchUserSettings();
      if (remoteSettings && isMounted) {
        setSettings((prev) => {
          const merged = { ...prev, ...remoteSettings };
          localStorage.setItem("userSettings", JSON.stringify(merged));
          return merged;
        });
      }
    };

    bootstrap();
    return () => {
      isMounted = false;
    };
  }, []);

  const updateSettings = (partialSettings) => {
    setSettings((prev) => {
      const merged = { ...prev, ...partialSettings };
      localStorage.setItem("userSettings", JSON.stringify(merged));
      persistUserSettings(merged);
      return merged;
    });
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export { SettingsContext };
export const useSettings = () => useContext(SettingsContext);
```

## frontend/src/components/Login.js
```javascript
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TextField, Button, Box, Typography, Container } from "@mui/material";
import { login } from "../api";

const Login = () => {
  const [username, setUsername] = useState("joey"); // Default to commonly used account
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Use the intended username if form input is empty or invalid, otherwise use input
    const finalUsername = username.trim() === "" ? "joey" : username.trim();
    try {
      const response = await login(finalUsername, password);
      const { access_token } = response;
      if (access_token) {
        localStorage.setItem("token", access_token);
        navigate("/products");
      } else {
        setError("Login failed: No token received");
      }
    } catch (err) {
      setError("Login failed: " + err.message);
    }
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 8, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Typography component="h1" variant="h5">
          Sign in
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Username"
            name="username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            helperText="Use username 'joey' or 'alex'"
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <Typography color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Sign In
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default Login;
```

## frontend/src/components/Catalog.js
```javascript
import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  Typography,
  Chip,
  CircularProgress,
  TextField,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Drawer,
  IconButton,
  Divider,
  useMediaQuery,
  AppBar,
  Toolbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import MenuIcon from "@mui/icons-material/Menu";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import { fetchPublicProducts, requestInvoice } from "../api";
import { theme } from "../theme";

const Catalog = () => {
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);

  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState({});
  const [selectedVendors, setSelectedVendors] = useState({});
  const [selectedFobs, setSelectedFobs] = useState({});
  const [showInStockOnly, setShowInStockOnly] = useState(true);
  const [selectedForInvoice, setSelectedForInvoice] = useState([]);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchPublicProducts();
        setProducts(data);
        setFiltered(data);
      } catch (err) {
        console.error("Failed to load catalog:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    let result = products;

    if (showInStockOnly) result = result.filter((p) => p.qty > 0 && !p.out_of_stock);
    if (search) {
      result = result.filter(
        (p) =>
          p.title?.toLowerCase().includes(search.toLowerCase()) ||
          p.asin?.toLowerCase().includes(search.toLowerCase()) ||
          p.vendor?.toLowerCase().includes(search.toLowerCase())
      );
    }

    const activeCats = Object.keys(selectedCategories).filter((k) => selectedCategories[k]);
    if (activeCats.length) result = result.filter((p) => activeCats.includes(p.category));

    const activeVendors = Object.keys(selectedVendors).filter((k) => selectedVendors[k]);
    if (activeVendors.length) result = result.filter((p) => activeVendors.includes(p.vendor));

    const activeFobs = Object.keys(selectedFobs).filter((k) => selectedFobs[k]);
    if (activeFobs.length) result = result.filter((p) => p.fob && activeFobs.includes(p.fob));

    setFiltered(result);
  }, [search, selectedCategories, selectedVendors, selectedFobs, showInStockOnly, products]);

  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))].sort();
  const vendors = [...new Set(products.map((p) => p.vendor).filter(Boolean))].sort();
  const fobPorts = [...new Set(products.map((p) => p.fob).filter(Boolean))].sort();

  const toggleItem = (type, value) => {
    const setter =
      type === "category"
        ? setSelectedCategories
        : type === "vendor"
        ? setSelectedVendors
        : setSelectedFobs;
    setter((prev) => ({ ...prev, [value]: !prev[value] }));
  };

  const toggleInvoice = (id) => {
    setSelectedForInvoice((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleOpenModal = () => {
    if (selectedForInvoice.length === 0) {
      setSnackbar({ open: true, message: "Please select at least one product", severity: "warning" });
      return;
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleSubmitInvoice = async () => {
    if (!customerInfo.name || !customerInfo.email) {
      setSnackbar({ open: true, message: "Name and email are required", severity: "error" });
      return;
    }

    setSubmitting(true);
    try {
      await requestInvoice(customerInfo, selectedForInvoice);
      setSnackbar({
        open: true,
        message: "Invoice request submitted successfully! We will contact you soon.",
        severity: "success",
      });
      setModalOpen(false);
      setSelectedForInvoice([]);
      setCustomerInfo({ name: "", email: "", company: "", phone: "" });
    } catch (err) {
      console.error("Failed to submit invoice request:", err);
      setSnackbar({
        open: true,
        message: "Failed to submit request. Please try again.",
        severity: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CircularProgress sx={{ display: "block", margin: "100px auto" }} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh", bgcolor: "#F5F7FA" }}>
        {/* Header */}
        <AppBar position="sticky" sx={{ bgcolor: "#003087", height: { xs: 70, md: 80 }, boxShadow: 3 }}>
          <Toolbar sx={{ justifyContent: "space-between", height: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              {isMobile && (
                <IconButton color="inherit" onClick={() => setDrawerOpen(true)}>
                  <MenuIcon />
                </IconButton>
              )}
              <Box
                component="img"
                src="/NPP-logo-full-white.png"
                alt="NPP"
                sx={{ height: { xs: 44, md: 60 } }}
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            </Box>
            <Typography variant="h5" sx={{ color: "white", fontWeight: 600 }}>
              LIVE CATALOG
            </Typography>
            {selectedForInvoice.length > 0 && (
              <Button
                variant="contained"
                color="success"
                size="large"
                startIcon={<ShoppingCartIcon />}
                onClick={handleOpenModal}
                sx={{ fontWeight: 600 }}
              >
                Request Invoice ({selectedForInvoice.length})
              </Button>
            )}
            {selectedForInvoice.length === 0 && <Box sx={{ width: 200 }} />}
          </Toolbar>
        </AppBar>

        <Box sx={{ display: "flex", flexGrow: 1 }}>
          {/* Sidebar */}
          <Drawer
            variant={isMobile ? "temporary" : "permanent"}
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            sx={{
              width: 280,
              flexShrink: 0,
              "& .MuiDrawer-paper": {
                width: 280,
                p: 3,
                mt: { xs: 0, md: "80px" },
                height: { md: "calc(100vh - 80px)" },
              },
            }}
          >
            {isMobile && (
              <IconButton onClick={() => setDrawerOpen(false)} sx={{ alignSelf: "flex-end" }}>
                x
              </IconButton>
            )}
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: "#003087" }}>
              Categories
            </Typography>
            <FormGroup>
              {categories.map((cat) => (
                <FormControlLabel
                  key={cat}
                  control={
                    <Checkbox
                      checked={!!selectedCategories[cat]}
                      onChange={() => toggleItem("category", cat)}
                      sx={{ color: "#003087", "&.Mui-checked": { color: "#003087" } }}
                    />
                  }
                  label={cat}
                />
              ))}
            </FormGroup>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: "#003087" }}>
              Vendors
            </Typography>
            <FormGroup>
              {vendors.map((v) => (
                <FormControlLabel
                  key={v}
                  control={
                    <Checkbox
                      checked={!!selectedVendors[v]}
                      onChange={() => toggleItem("vendor", v)}
                      sx={{ color: "#003087", "&.Mui-checked": { color: "#003087" } }}
                    />
                  }
                  label={v}
                />
              ))}
            </FormGroup>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: "#003087" }}>
              FOB Ports
            </Typography>
            <FormGroup>
              {fobPorts.map((fob) => (
                <FormControlLabel
                  key={fob}
                  control={
                    <Checkbox
                      checked={!!selectedFobs[fob]}
                      onChange={() => toggleItem("fob", fob)}
                      sx={{ color: "#003087", "&.Mui-checked": { color: "#003087" } }}
                    />
                  }
                  label={fob}
                />
              ))}
            </FormGroup>
            <Divider sx={{ my: 2 }} />
            <FormControlLabel
              control={
                <Checkbox
                  checked={showInStockOnly}
                  onChange={(e) => setShowInStockOnly(e.target.checked)}
                  sx={{ color: "#00A651", "&.Mui-checked": { color: "#00A651" } }}
                />
              }
              label="In Stock Only"
            />
          </Drawer>

          {/* Main Content */}
          <Box sx={{ flexGrow: 1, p: 3, ml: { md: "280px" } }}>
            <TextField
              fullWidth
              label="Search products, ASIN, vendor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ mb: 3, maxWidth: 600, bgcolor: "white", borderRadius: 1 }}
            />
            <Typography gutterBottom sx={{ color: "#555" }}>
              Showing {filtered.length} products
              {selectedForInvoice.length > 0 && (
                <Chip
                  label={`${selectedForInvoice.length} selected`}
                  color="primary"
                  size="small"
                  sx={{ ml: 2 }}
                />
              )}
            </Typography>

            <Grid container spacing={3}>
              {filtered.map((p) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={p.id}>
                  <Card
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      bgcolor: "white",
                      borderRadius: 2,
                    }}
                  >
                    <Box sx={{ position: "relative" }}>
                      <CardMedia
                        component="img"
                        height="200"
                        image={p.image_url || "/no-image.png"}
                        alt={p.title}
                        sx={{ objectFit: "contain", bgcolor: "#f9f9f9" }}
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedForInvoice.includes(p.id)}
                            onChange={() => toggleInvoice(p.id)}
                            sx={{ color: "#003087", "&.Mui-checked": { color: "#003087" } }}
                          />
                        }
                        label="Request Invoice"
                        sx={{
                          position: "absolute",
                          top: 8,
                          left: 8,
                          bgcolor: "rgba(255,255,255,0.95)",
                          borderRadius: 1,
                          px: 1,
                          m: 0,
                        }}
                      />
                    </Box>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" noWrap sx={{ fontWeight: 600 }}>
                        {p.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Vendor: {p.vendor}
                      </Typography>
                      <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
                        <Chip label={`$${p.price}`} color="primary" size="small" />
                        <Chip label={`MOQ ${p.moq}`} size="small" variant="outlined" />
                        <Chip
                          label={`${p.qty} In Stock`}
                          color={p.qty > 0 ? "success" : "error"}
                          size="small"
                        />
                        {p.fob && <Chip label={p.fob} variant="outlined" size="small" />}
                      </Box>
                    </CardContent>
                    <CardActions sx={{ px: 2, pb: 2 }}>
                      {p.amazon_url && (
                        <Button size="small" href={p.amazon_url} target="_blank">
                          Amazon
                        </Button>
                      )}
                      {p.walmart_url && (
                        <Button size="small" href={p.walmart_url} target="_blank">
                          Walmart
                        </Button>
                      )}
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Box>

        {/* Customer Info Modal */}
        <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ bgcolor: "#003087", color: "white" }}>
            Request Invoice - {selectedForInvoice.length} Product(s)
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Typography variant="body2" sx={{ mb: 2, color: "#555" }}>
              Please provide your contact information and we'll send you an invoice for the selected
              products.
            </Typography>
            <TextField
              fullWidth
              label="Your Name *"
              value={customerInfo.name}
              onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
              sx={{ mb: 2 }}
              required
            />
            <TextField
              fullWidth
              label="Email Address *"
              type="email"
              value={customerInfo.email}
              onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
              sx={{ mb: 2 }}
              required
            />
            <TextField
              fullWidth
              label="Company Name"
              value={customerInfo.company}
              onChange={(e) => setCustomerInfo({ ...customerInfo, company: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Phone Number"
              value={customerInfo.phone}
              onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleCloseModal} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={handleSubmitInvoice}
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
};

export default Catalog;
```

## frontend/src/components/CategoryPage.js
```javascript
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchProductsByCategory } from "../api";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const CategoryPage = () => {
  const { category } = useParams();
  const safeCategory = useMemo(() => decodeURIComponent(category || ""), [category]);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [displayCategory, setDisplayCategory] = useState(safeCategory);
  const categoryLabel = displayCategory || safeCategory;


  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    setProducts([]);
    setDisplayCategory(safeCategory);
    fetchProductsByCategory(safeCategory)
      .then((payload) => {
        if (!isMounted) return;
        setProducts(payload?.products ?? []);
        const rawCategory = typeof payload?.category === 'string' ? payload.category.trim() : '';
        setDisplayCategory(rawCategory || safeCategory);
      })
      .catch(() => {
        if (!isMounted) return;
        setError("We couldn't load products for this category right now. Please try again later.");
        setProducts([]);
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [safeCategory]);

  if (loading) {
    return <div>Loading {categoryLabel} products.</div>;
  }

  if (error) {
    return <div role="alert">{error}</div>;
  }

  if (!products.length) {
    return <div>No products found in {categoryLabel}.</div>;
  }

  return (
    <div>
      <h1>{categoryLabel} Products</h1>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
        {products.map((product) => (
          <article
            key={`${product.title}-${product.price}`}
            style={{
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "16px",
              width: "260px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
            }}
          >
            <img
              src={product.image_url}
              alt={product.title}
              style={{ width: "100%", height: "160px", objectFit: "cover", borderRadius: "4px" }}
              loading="lazy"
            />
            <h2 style={{ fontSize: "1.1rem", margin: "12px 0 8px" }}>{product.title}</h2>
            <p style={{ fontWeight: 600 }}>{currencyFormatter.format(product.price ?? 0)}</p>
            <button
              type="button"
              onClick={() => window.alert(`Add ${product.title} to cart`)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "4px",
                border: "none",
                backgroundColor: "#1976d2",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Buy
            </button>
          </article>
        ))}
      </div>
    </div>
  );
};

export default CategoryPage;
```

## frontend/src/components/SettingsDialog.js
```javascript
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Stack,
  Typography,
} from "@mui/material";

const SettingsDialog = ({ open, onClose, settings, updateSettings }) => {
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    if (open) {
      setLocalSettings(settings);
    }
  }, [settings, open]);

  const handleThemeChange = (event) => {
    setLocalSettings((prev) => ({ ...prev, theme: event.target.value }));
  };

  const handleTextScaleChange = (event, value) => {
    setLocalSettings((prev) => ({ ...prev, textScale: value }));
  };

  const handleSave = () => {
    updateSettings(localSettings);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Display & Settings</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <FormControl fullWidth>
            <InputLabel id="settings-theme-label">Theme</InputLabel>
            <Select
              labelId="settings-theme-label"
              value={localSettings.theme}
              label="Theme"
              onChange={handleThemeChange}
            >
              <MenuItem value="light">Light</MenuItem>
              <MenuItem value="dark">Dark</MenuItem>
            </Select>
          </FormControl>
          <Stack spacing={1}>
            <Typography variant="subtitle2" color="text.secondary">
              Text Scale
            </Typography>
            <Slider
              value={localSettings.textScale}
              min={0.75}
              max={1.5}
              step={0.05}
              valueLabelDisplay="auto"
              onChange={handleTextScaleChange}
            />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SettingsDialog;
```

## frontend/src/components/CustomizeColumnsDialog.js
```javascript
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  Checkbox,
  ListItemText,
  Typography
} from "@mui/material";

/**
 * columns: array of { field, headerName, width, etc. }
 * columnVisibilityModel: an object that tracks which columns are visible
 * onColumnVisibilityChange: callback when user toggles a column
 */
const CustomizeColumnsDialog = ({
  open,
  onClose,
  columns = [],
  columnVisibilityModel = {},
  onColumnVisibilityChange
}) => {
  // If columns is empty, prevent .map() errors
  if (!columns.length) {
    return (
      <Dialog open={open} onClose={onClose}>
        <DialogTitle>Customize Columns</DialogTitle>
        <DialogContent>
          <Typography>No columns available.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  // Handle toggling a column's visibility
  const handleToggleColumn = (field) => {
    const currentlyVisible =
      Object.prototype.hasOwnProperty.call(columnVisibilityModel, field)
        ? !!columnVisibilityModel[field]
        : true;
    const updatedModel = { ...columnVisibilityModel, [field]: !currentlyVisible };
    onColumnVisibilityChange(updatedModel);
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Customize Columns</DialogTitle>
      <DialogContent dividers>
        <List>
          {columns.map((col) => (
            <ListItem key={col.field} dense button onClick={() => handleToggleColumn(col.field)}>
              <Checkbox
                checked={
                  Object.prototype.hasOwnProperty.call(columnVisibilityModel, col.field)
                    ? !!columnVisibilityModel[col.field]
                    : true
                }
                tabIndex={-1}
                disableRipple
              />
              <ListItemText primary={col.headerName} />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomizeColumnsDialog;
```

## frontend/src/emailSender.js
```javascript
import axios from "axios";
import { updateProduct } from "./api"; // Ensure this points to the correct API function

const API_URL = "https://api.kit.com/v4/broadcasts";
const API_KEY = "kit_a0a183e8fd744ca557d96126e488ae22";

const headers = {
  Accept: "application/json",
  "Content-Type": "application/json",
  "X-Kit-Api-Key": API_KEY,
};

/**
 * Send Individual Emails & Update Last Sent
 */
export async function sendIndividualEmails(selectedProducts) {
  if (!selectedProducts || selectedProducts.length === 0) {
    console.error("No products selected for individual email.");
    return;
  }

  for (const product of selectedProducts) {
    if (!product || !product.title) {
      console.error("Skipping invalid product:", product);
      continue;
    }

    // Standardize lead time and price formatting as needed
    let leadTime = product.lead_time || "";
    if (leadTime.includes("Days")) {
      leadTime = leadTime.replace("Days", "Business Days");
    }
    let price = product.price || "0";
    try {
      price = parseFloat(price).toFixed(2);
    } catch {
      // Leave as is
    }

    // Build the email body (matches your Python formatting)
    const emailBody = buildPythonStyleEmail({
      subject: product.title || "",
      amazonUrl: product.amazon_url || "",
      walmartUrl: product.walmart_url || "",
      ebayUrl: product.ebay_url || "",
      imageUrl: product.image_url || "",
      price,
      moq: product.moq || "0",
      qty: product.qty || "0",
      asin: product.asin || "",
      fob: product.fob || "",
      expDate: product.exp_date || "",
      leadTime,
    });

    const emailData = {
      subject: (product.title || "").trim(),
      content: emailBody,
      public: false, // Draft mode
      email_template_id: null,
    };

    try {
      const response = await axios.post(API_URL, emailData, { headers });
      if (response.status === 201) {
        console.log(`Email draft successfully created for: ${product.title}`);

        if (product.id) {
          try {
            console.log(`Updating last_sent for Product ID: ${product.id}`);
            await updateLastSent(product.id);
            console.log(`last_sent successfully updated for: ${product.id}`);
          } catch (err) {
            console.error(`Failed to update last_sent for ${product.id}:`, err);
          }
        } else {
          console.error(`Invalid product ID for last_sent update:`, product);
        }
      } else {
        console.error(`Failed to send email for ${product.title}:`, response.data);
      }
    } catch (error) {
      console.error(`Error sending email for ${product.title}:`, error);
    }
  }
}

/**
 * Send Group Email & Update Last Sent for All Products
 */
export async function sendGroupEmail(selectedProducts) {
  if (!selectedProducts || selectedProducts.length === 0) {
    console.error("No products selected for group email.");
    return;
  }

  let combinedHTML = "";
  for (const product of selectedProducts) {
    if (!product || !product.title) {
      console.error("Skipping invalid product in group:", product);
      continue;
    }

    let leadTime = product.lead_time || "";
    if (leadTime.includes("Days")) {
      leadTime = leadTime.replace("Days", "Business Days");
    }
    let price = product.price || "0";
    try {
      price = parseFloat(price).toFixed(2);
    } catch {
      // Leave as is
    }

    combinedHTML += buildPythonStyleEmail({
      subject: product.title || "",
      amazonUrl: product.amazon_url || "",
      walmartUrl: product.walmart_url || "",
      ebayUrl: product.ebay_url || "",
      imageUrl: product.image_url || "",
      price,
      moq: product.moq || "0",
      qty: product.qty || "0",
      asin: product.asin || "",
      fob: product.fob || "",
      expDate: product.exp_date || "",
      leadTime,
    });

    combinedHTML += "<hr>";
  }

  const emailData = {
    subject: `Group Deal: ${selectedProducts.length} Products Available!`,
    content: combinedHTML,
    public: false,
    email_template_id: null,
  };

  try {
    const response = await axios.post(API_URL, emailData, { headers });
    if (response.status === 201) {
      console.log("Group email draft successfully created.");

      for (const product of selectedProducts) {
        if (product && product.id) {
          try {
            console.log(`Updating last_sent for Product ID: ${product.id}`);
            await updateLastSent(product.id);
            console.log(`last_sent successfully updated for: ${product.id}`);
          } catch (err) {
            console.error(`Failed to update last_sent for ${product.id}:`, err);
          }
        } else {
          console.error(`Invalid product ID for last_sent update:`, product);
        }
      }
    } else {
      console.error("Failed to send group email:", response.data);
    }
  } catch (error) {
    console.error("Error sending group email:", error);
  }
}

/**
 * Update Last Sent Timestamp in DB
 * The updateProduct function (from your api.js) returns the parsed JSON,
 * so we remove the check on response.status and simply await the update.
 */
async function updateLastSent(productId) {
  if (!productId) {
    console.error("updateLastSent called with invalid product ID.");
    return;
  }

  try {
    console.log(`Sending update request for last_sent: ${productId}`);
    await updateProduct(productId, { last_sent: new Date().toISOString() });
    console.log(`Successfully updated last_sent for Product ID: ${productId}`);
  } catch (err) {
    console.error(`Error updating last_sent for product ${productId}:`, err);
  }
}

/**
 * Build the Email EXACTLY Like Python Code
 */
function buildPythonStyleEmail({
  subject,
  amazonUrl,
  walmartUrl,
  ebayUrl,
  imageUrl,
  price,
  moq,
  qty,
  asin,
  fob,
  expDate,
  leadTime,
}) {
  let emailBody = `
    <div style="text-align:center; padding:20px;">
        <h2 style="font-size:18px; margin-bottom:20px;">${subject}</h2>
        <img src="${imageUrl}" alt="${subject}" style="max-width:300px; max-height:300px; object-fit:contain; display:block; margin:auto; margin-top:40px; margin-bottom:40px;"/>
  `;

  if (amazonUrl.includes("https")) {
    emailBody += `
            <a href="${amazonUrl}" style="background-color:#FF9900; color:white; padding:15px 25px; text-decoration:none; display:inline-block; font-size:16px; margin:5px; border-radius:5px;">Amazon Link</a>
    `;
  }
  if (walmartUrl.includes("https")) {
    emailBody += `
            <a href="${walmartUrl}" style="background-color:#0071CE; color:white; padding:15px 25px; text-decoration:none; display:inline-block; font-size:16px; margin:5px; border-radius:5px;">Walmart Link</a>
    `;
  }
  if (ebayUrl.includes("https")) {
    emailBody += `
            <a href="${ebayUrl}" style="background-color:#E53238; color:white; padding:15px 25px; text-decoration:none; display:inline-block; font-size:16px; margin:5px; border-radius:5px;">eBay Link</a>
    `;
  }

  emailBody += `
            <p style="font-size:18px; margin-top:40px;">$${price} EA, MOQ ${moq}, ${qty} Available.</p>
            <p style="font-size:18px;">ASIN: ${asin}</p>
  `;

  if (fob) emailBody += `<p style="font-size:18px;">FOB: ${fob}</p>`;
  if (expDate) emailBody += `<p style="font-size:18px;">Expiration Date: ${expDate}</p>`;

  emailBody += `<p style="font-size:18px;">Lead Time: ${leadTime}</p></div>`;

  return emailBody;
}
```

---

# NPP BRANDING REFERENCE

| Element | Value | Usage |
|---------|-------|-------|
| Primary Color | #003087 (navy) | Header, buttons, checkboxes |
| Secondary Color | #00A651 (green) | Success, "In Stock" |
| Warning Color | #FF6B00 (orange) | "Out of Stock" |
| Background | #F5F7FA | Page background |
| Card Background | #FFFFFF | Product cards |
| Font Family | Inter, Roboto | All text |
| Border Radius | 12px | Cards, 8px for buttons |
| Logo | NPP-logo-full-white.png | Header (white on navy) |

---

# SMTP CONFIGURATION FOR EMAIL

Add to backend `.env`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
INVOICE_RECIPIENT=sales@nppwholesale.com
```

---

# END OF BACKUP
