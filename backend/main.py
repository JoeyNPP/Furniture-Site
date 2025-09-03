import os
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import Optional, List
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta
import jwt
import bcrypt

app = FastAPI()

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
    # Insert default user if not exists
    cur.execute("""
        INSERT INTO users (username, password)
        VALUES (%s, %s)
        ON CONFLICT (username) DO NOTHING
    """, (
        "joey/alex",
        bcrypt.hashpw("Winter2025$".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    ))
    conn.commit()
    cur.close()
    conn.close()

# Initialize database
init_db()

# JWT settings
SECRET_KEY = os.getenv("SECRET_KEY", "a-very-strong-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

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