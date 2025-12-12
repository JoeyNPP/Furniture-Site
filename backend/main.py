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
import pytz
from psycopg2.extras import RealDictCursor, Json
from datetime import datetime, timedelta
import jwt
import bcrypt

app = FastAPI()

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

# Load environment variables
load_dotenv('.env.local', override=True)  # Prefer .env.local for local testing
load_dotenv('.env')  # Fallback to .env for live

# Database connection
def get_db_connection():
    return psycopg2.connect(
        dbname=os.getenv("DB_NAME", "npp_furniture"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "26,Sheetpans!"),
        host=os.getenv("DB_HOST", "npp_furniture-db"),
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
            sku TEXT,
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
            date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            -- Furniture-specific fields
            room_type TEXT,
            style TEXT,
            material TEXT,
            color TEXT,
            brand TEXT,
            width FLOAT,
            depth FLOAT,
            height FLOAT,
            weight FLOAT,
            condition TEXT DEFAULT 'New',
            warranty TEXT,
            assembly_required BOOLEAN DEFAULT FALSE,
            features TEXT[],
            secondary_images TEXT[]
        )
    """)
    # Add new columns if they don't exist (for existing databases)
    furniture_columns = [
        ("room_type", "TEXT"),
        ("style", "TEXT"),
        ("material", "TEXT"),
        ("color", "TEXT"),
        ("brand", "TEXT"),
        ("width", "FLOAT"),
        ("depth", "FLOAT"),
        ("height", "FLOAT"),
        ("weight", "FLOAT"),
        ("condition", "TEXT DEFAULT 'New'"),
        ("warranty", "TEXT"),
        ("assembly_required", "BOOLEAN DEFAULT FALSE"),
        ("features", "TEXT[]"),
        ("secondary_images", "TEXT[]"),
        ("sku", "TEXT"),  # New SKU column to replace ASIN
    ]
    for col_name, col_type in furniture_columns:
        try:
            cur.execute(f"ALTER TABLE products ADD COLUMN IF NOT EXISTS {col_name} {col_type}")
        except Exception:
            pass  # Column might already exist

    # Commit table structure changes before attempting migrations
    conn.commit()

    # Migrate data from asin to sku if asin column exists and sku is empty
    try:
        cur.execute("""
            UPDATE products
            SET sku = asin
            WHERE asin IS NOT NULL
            AND asin != ''
            AND (sku IS NULL OR sku = '')
        """)
        conn.commit()
    except Exception as e:
        conn.rollback()  # Rollback failed transaction so subsequent queries work
        print(f"SKU migration note: {e}")
    # Enhanced users table with roles and metadata
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            username TEXT PRIMARY KEY,
            password TEXT NOT NULL,
            email TEXT,
            role TEXT DEFAULT 'viewer',
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT NOW(),
            last_login TIMESTAMP,
            created_by TEXT
        )
    """)
    # Add new columns if they don't exist (for existing databases)
    for col, col_type, default in [
        ('email', 'TEXT', None),
        ('role', 'TEXT', "'viewer'"),
        ('is_active', 'BOOLEAN', 'TRUE'),
        ('created_at', 'TIMESTAMP', 'NOW()'),
        ('last_login', 'TIMESTAMP', None),
        ('created_by', 'TEXT', None),
    ]:
        try:
            if default:
                cur.execute(f"ALTER TABLE users ADD COLUMN {col} {col_type} DEFAULT {default}")
            else:
                cur.execute(f"ALTER TABLE users ADD COLUMN {col} {col_type}")
            conn.commit()
        except Exception:
            conn.rollback()  # Column likely already exists

    cur.execute("""
        CREATE TABLE IF NOT EXISTS user_settings (
            username TEXT PRIMARY KEY,
            settings JSONB NOT NULL DEFAULT '{"theme": "light", "textScale": 1.0, "columnVisibility": {"title": true, "price": true}}'
        )
    """)

    # Audit log table for tracking user actions
    cur.execute("""
        CREATE TABLE IF NOT EXISTS audit_logs (
            id SERIAL PRIMARY KEY,
            timestamp TIMESTAMP DEFAULT NOW(),
            username TEXT,
            action TEXT NOT NULL,
            resource_type TEXT,
            resource_id TEXT,
            details JSONB,
            ip_address TEXT
        )
    """)

    # Company settings table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS company_settings (
            key TEXT PRIMARY KEY,
            value JSONB NOT NULL
        )
    """)

    # Ensure default admin users exist
    cur.execute("DELETE FROM users WHERE username = %s", ("joey/alex",))
    for username, role in [("joseph", "admin"), ("joey", "admin"), ("alex", "admin")]:
        cur.execute("""
            INSERT INTO users (username, password, role, is_active, created_at)
            VALUES (%s, %s, %s, TRUE, NOW())
            ON CONFLICT (username) DO UPDATE SET role = EXCLUDED.role
        """, (
            username,
            bcrypt.hashpw("Winter2025$".encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
            role
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
    return {"message": "NPP Office Furniture Backend"}

# Pydantic models
class Product(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    vendor_id: Optional[str] = None
    vendor: Optional[str] = None
    price: Optional[float] = None
    moq: Optional[int] = None
    qty: Optional[int] = None
    upc: Optional[str] = None
    sku: Optional[str] = None
    lead_time: Optional[str] = None
    exp_date: Optional[str] = None
    fob: Optional[str] = None
    image_url: Optional[str] = None
    out_of_stock: Optional[bool] = False
    offer_date: Optional[datetime] = None
    last_sent: Optional[datetime] = None
    date_added: Optional[datetime] = None
    # Furniture-specific fields
    room_type: Optional[str] = None
    style: Optional[str] = None
    material: Optional[str] = None
    color: Optional[str] = None
    brand: Optional[str] = None
    width: Optional[float] = None
    depth: Optional[float] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    condition: Optional[str] = "New"
    warranty: Optional[str] = None
    assembly_required: Optional[bool] = False
    features: Optional[List[str]] = None
    secondary_images: Optional[List[str]] = None

class ProductUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    vendor_id: Optional[str] = None
    vendor: Optional[str] = None
    price: Optional[float] = None
    moq: Optional[int] = None
    qty: Optional[int] = None
    upc: Optional[str] = None
    sku: Optional[str] = None
    lead_time: Optional[str] = None
    exp_date: Optional[str] = None
    fob: Optional[str] = None
    image_url: Optional[str] = None
    out_of_stock: Optional[bool] = None
    offer_date: Optional[datetime] = None
    last_sent: Optional[datetime] = None
    # Furniture-specific fields
    room_type: Optional[str] = None
    style: Optional[str] = None
    material: Optional[str] = None
    color: Optional[str] = None
    brand: Optional[str] = None
    width: Optional[float] = None
    depth: Optional[float] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    condition: Optional[str] = None
    warranty: Optional[str] = None
    assembly_required: Optional[bool] = None
    features: Optional[List[str]] = None
    secondary_images: Optional[List[str]] = None

class UserSettings(BaseModel):
    theme: Optional[str] = "light"
    textScale: Optional[float] = 1.0
    columnVisibility: Optional[dict] = {"title": True, "price": True}

# User management models
class UserCreate(BaseModel):
    username: str
    password: str
    email: Optional[str] = None
    role: str = "viewer"  # admin, manager, sales, viewer

class UserUpdate(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None  # For password reset

class UserResponse(BaseModel):
    username: str
    email: Optional[str]
    role: str
    is_active: bool
    created_at: Optional[datetime]
    last_login: Optional[datetime]
    created_by: Optional[str]

class CompanySettingsUpdate(BaseModel):
    company_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    address: Optional[str] = None
    default_fob: Optional[str] = None
    default_lead_time: Optional[str] = None
    low_stock_threshold: Optional[int] = 5

# Role permissions mapping
ROLE_PERMISSIONS = {
    "admin": ["read", "write", "delete", "manage_users", "manage_settings", "view_audit_logs"],
    "manager": ["read", "write", "delete", "view_audit_logs"],
    "sales": ["read", "send_emails", "download"],
    "viewer": ["read"]
}

def check_permission(role: str, permission: str) -> bool:
    """Check if a role has a specific permission"""
    return permission in ROLE_PERMISSIONS.get(role, [])

# Audit logging helper
def log_audit(username: str, action: str, resource_type: str = None, resource_id: str = None, details: dict = None, ip_address: str = None):
    """Log an action to the audit trail"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO audit_logs (username, action, resource_type, resource_id, details, ip_address)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (username, action, resource_type, resource_id, Json(details) if details else None, ip_address))
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Audit log error: {e}")

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

async def get_current_user_with_role(token: str = Depends(oauth2_scheme)):
    """Get current user with their role information"""
    username = await get_current_user(token)
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT username, role, is_active FROM users WHERE username = %s", (username,))
    user = cur.fetchone()
    cur.close()
    conn.close()
    if not user or not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="User account is disabled")
    return {"username": user["username"], "role": user.get("role", "viewer")}

def require_permission(permission: str):
    """Dependency to check if user has required permission"""
    async def check(user: dict = Depends(get_current_user_with_role)):
        if not check_permission(user["role"], permission):
            raise HTTPException(status_code=403, detail=f"Permission denied: requires '{permission}'")
        return user
    return check

@app.post("/login")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE username = %s", (form_data.username,))
    user = cur.fetchone()

    if not user or not verify_password(form_data.password, user["password"]):
        log_audit(form_data.username, "login_failed", details={"reason": "invalid_credentials"})
        cur.close()
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if user is active
    if not user.get("is_active", True):
        log_audit(form_data.username, "login_failed", details={"reason": "account_disabled"})
        cur.close()
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is disabled. Contact administrator.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Update last login timestamp
    cur.execute("UPDATE users SET last_login = NOW() WHERE username = %s", (user["username"],))
    conn.commit()
    cur.close()
    conn.close()

    # Log successful login
    log_audit(user["username"], "login_success")

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"], "role": user.get("role", "viewer")},
        expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "username": user["username"],
        "role": user.get("role", "viewer")
    }

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

def extract_unique_values(rows, field_name):
    """Extract unique values from comma-separated fields.

    For example, if products have room_type values like:
    - "Office"
    - "Office, Living Room"
    - "Living Room, Bedroom"

    This returns: ["Bedroom", "Living Room", "Office"]
    """
    unique_values = set()
    for row in rows:
        value = row[field_name]
        if value:
            # Split by comma and strip whitespace
            parts = [p.strip() for p in value.split(",")]
            for part in parts:
                if part:  # Skip empty strings
                    unique_values.add(part)
    return sorted(list(unique_values))

@app.get("/products/filters")
async def get_product_filters():
    """Get all available filter options from the database.

    Supports comma-separated multi-values in fields like room_type, style, material, color.
    For example, a product with room_type="Office, Living Room" will contribute both
    "Office" and "Living Room" as separate filter options.
    """
    conn = get_db_connection()
    cur = conn.cursor()

    # Get distinct values for each filter field
    filters = {}

    # Categories (single value, no comma parsing needed)
    cur.execute("SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category != '' AND out_of_stock = FALSE ORDER BY category")
    filters["categories"] = [row["category"] for row in cur.fetchall()]

    # Multi-value fields - fetch all values and parse comma-separated entries
    cur.execute("SELECT room_type FROM products WHERE room_type IS NOT NULL AND room_type != '' AND out_of_stock = FALSE")
    filters["room_types"] = extract_unique_values(cur.fetchall(), "room_type")

    cur.execute("SELECT style FROM products WHERE style IS NOT NULL AND style != '' AND out_of_stock = FALSE")
    filters["styles"] = extract_unique_values(cur.fetchall(), "style")

    cur.execute("SELECT material FROM products WHERE material IS NOT NULL AND material != '' AND out_of_stock = FALSE")
    filters["materials"] = extract_unique_values(cur.fetchall(), "material")

    cur.execute("SELECT color FROM products WHERE color IS NOT NULL AND color != '' AND out_of_stock = FALSE")
    filters["colors"] = extract_unique_values(cur.fetchall(), "color")

    # Brands (single value typically, but support multi-value just in case)
    cur.execute("SELECT brand FROM products WHERE brand IS NOT NULL AND brand != '' AND out_of_stock = FALSE")
    filters["brands"] = extract_unique_values(cur.fetchall(), "brand")

    # Conditions (single value, no comma parsing needed)
    cur.execute("SELECT DISTINCT condition FROM products WHERE condition IS NOT NULL AND condition != '' AND out_of_stock = FALSE ORDER BY condition")
    filters["conditions"] = [row["condition"] for row in cur.fetchall()]

    # FOB locations (single value, no comma parsing needed)
    cur.execute("SELECT DISTINCT fob FROM products WHERE fob IS NOT NULL AND fob != '' AND out_of_stock = FALSE ORDER BY fob")
    filters["fob_locations"] = [row["fob"] for row in cur.fetchall()]

    # Price range
    cur.execute("SELECT MIN(price) as min_price, MAX(price) as max_price FROM products WHERE out_of_stock = FALSE AND price IS NOT NULL")
    price_range = cur.fetchone()
    filters["price_range"] = {"min": price_range["min_price"] or 0, "max": price_range["max_price"] or 10000}

    cur.close()
    conn.close()
    return filters

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

@app.get("/products/check-duplicate")
async def check_duplicate(sku: Optional[str] = None, upc: Optional[str] = None, current_user: str = Depends(get_current_user)):
    """Check if a product with the given SKU or UPC already exists"""
    if not sku and not upc:
        return {"duplicate": False, "products": []}

    conn = get_db_connection()
    cur = conn.cursor()

    duplicates = []
    if sku and sku.strip():
        cur.execute("SELECT id, title, sku, upc, vendor FROM products WHERE sku = %s AND sku != ''", (sku.strip(),))
        duplicates.extend(cur.fetchall())

    if upc and upc.strip():
        cur.execute("SELECT id, title, sku, upc, vendor FROM products WHERE upc = %s AND upc != ''", (upc.strip(),))
        upc_dups = cur.fetchall()
        # Avoid adding duplicates if same product matched by both SKU and UPC
        existing_ids = {d['id'] for d in duplicates}
        duplicates.extend([d for d in upc_dups if d['id'] not in existing_ids])

    cur.close()
    conn.close()

    return {"duplicate": len(duplicates) > 0, "products": duplicates}

@app.post("/products")
async def create_product(product: Product, current_user: str = Depends(get_current_user)):
    conn = get_db_connection()
    cur = conn.cursor()

    # Use current EST time for offer_date if not provided or if it's a date without time
    est_tz = pytz.timezone('America/New_York')
    current_est = datetime.now(est_tz)

    offer_date = product.offer_date
    if offer_date:
        # If offer_date is provided but has midnight time (12:00 AM), use current EST time
        if offer_date.hour == 0 and offer_date.minute == 0 and offer_date.second == 0:
            # Keep the date but use current time
            offer_date = est_tz.localize(datetime.combine(offer_date.date(), current_est.time()))
    else:
        # If no offer_date provided, use current EST time
        offer_date = current_est

    cur.execute("""
        INSERT INTO products (
          title, category, vendor_id, vendor, price, moq, qty, upc, sku, lead_time,
          exp_date, fob, image_url, out_of_stock, offer_date, last_sent, date_added,
          room_type, style, material, color, brand, width, depth, height, weight,
          condition, warranty, assembly_required, features, secondary_images
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id
        """, (
            product.title, product.category, product.vendor_id, product.vendor, product.price,
            product.moq, product.qty, product.upc, product.sku, product.lead_time, product.exp_date, product.fob,
            product.image_url, product.out_of_stock, offer_date, product.last_sent, current_est,
            product.room_type, product.style, product.material, product.color, product.brand,
            product.width, product.depth, product.height, product.weight,
            product.condition, product.warranty, product.assembly_required, product.features, product.secondary_images
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
    if product.moq is not None:
        update_fields.append("moq = %s")
        values.append(product.moq)
    if product.qty is not None:
        update_fields.append("qty = %s")
        values.append(product.qty)
    if product.upc is not None:
        update_fields.append("upc = %s")
        values.append(product.upc)
    if product.sku is not None:
        update_fields.append("sku = %s")
        values.append(product.sku)
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
    if product.offer_date is not None:
        update_fields.append("offer_date = %s")
        values.append(product.offer_date)
    if product.last_sent is not None:
        update_fields.append("last_sent = %s")
        values.append(product.last_sent)
    # Furniture-specific fields
    if product.room_type is not None:
        update_fields.append("room_type = %s")
        values.append(product.room_type)
    if product.style is not None:
        update_fields.append("style = %s")
        values.append(product.style)
    if product.material is not None:
        update_fields.append("material = %s")
        values.append(product.material)
    if product.color is not None:
        update_fields.append("color = %s")
        values.append(product.color)
    if product.brand is not None:
        update_fields.append("brand = %s")
        values.append(product.brand)
    if product.width is not None:
        update_fields.append("width = %s")
        values.append(product.width)
    if product.depth is not None:
        update_fields.append("depth = %s")
        values.append(product.depth)
    if product.height is not None:
        update_fields.append("height = %s")
        values.append(product.height)
    if product.weight is not None:
        update_fields.append("weight = %s")
        values.append(product.weight)
    if product.condition is not None:
        update_fields.append("condition = %s")
        values.append(product.condition)
    if product.warranty is not None:
        update_fields.append("warranty = %s")
        values.append(product.warranty)
    if product.assembly_required is not None:
        update_fields.append("assembly_required = %s")
        values.append(product.assembly_required)
    if product.features is not None:
        update_fields.append("features = %s")
        values.append(product.features)
    if product.secondary_images is not None:
        update_fields.append("secondary_images = %s")
        values.append(product.secondary_images)
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
        OR sku ILIKE %s
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
        "offer date": "offer_date",
        "last sent": "last_sent",
        "sku": "sku",
        "price": "price",
        "moq": "moq",
        "qty": "qty",
        "upc": "upc",
        "vendor": "vendor",
        "lead time": "lead_time",
        "exp date": "exp_date",
        "fob": "fob",
        "vendor id": "vendor_id",
        "image url": "image_url",
        "title": "title",
        "category": "category",
        "out of stock": "out_of_stock",
        # Furniture-specific fields
        "room type": "room_type",
        "style": "style",
        "material": "material",
        "color": "color",
        "brand": "brand",
        "width": "width",
        "depth": "depth",
        "height": "height",
        "weight": "weight",
        "condition": "condition",
        "warranty": "warranty",
        "assembly required": "assembly_required",
    }
    float_fields = {"price", "width", "depth", "height", "weight"}
    int_fields = {"moq", "qty"}
    bool_fields = {"out_of_stock", "assembly_required"}
    conn = get_db_connection()
    cur = conn.cursor()
    inserted = updated = skipped = 0
    for raw_row in reader:
        row = {(key or "").strip(): (value or "").strip() for key, value in raw_row.items()}
        normalized = {key.lower(): value for key, value in row.items() if key}
        sku_value = normalized.get("sku") or None
        title_value = normalized.get("title") or None
        if not sku_value and not title_value:
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
            elif column in bool_fields:
                # Handle boolean values: "true", "false", "1", "0", etc.
                record[column] = value.lower() in ("true", "1", "yes", "y")
            elif column in ("offer_date", "last_sent"):
                parsed = None
                # Try multiple date formats including ones with time
                patterns = [
                    "%m/%d/%Y, %I:%M:%S %p",  # 11/21/2025, 12:00:00 AM
                    "%m/%d/%Y %I:%M:%S %p",   # 11/21/2025 12:00:00 AM
                    "%m/%d/%Y",               # 11/21/2025
                    "%Y-%m-%d",               # 2025-11-21
                    "%m-%d-%Y",               # 11-21-2025
                    "%Y-%m-%d %H:%M:%S",      # 2025-11-21 00:00:00
                    "%m/%d/%Y %H:%M:%S",      # 11/21/2025 00:00:00
                ]
                for pattern in patterns:
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
        if sku_value:
            cur.execute("SELECT id FROM products WHERE sku = %s", (sku_value,))
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
    recipient_email = os.getenv("INVOICE_RECIPIENT", "sales@npp-office-furniture.com")

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
            <h1 style="margin: 0;">New Quote Request - NPP Office Furniture</h1>
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
                This request was submitted on {datetime.now().strftime('%B %d, %Y at %I:%M %p')} via the NPP Office Furniture Catalog.
            </p>
        </div>
    </body>
    </html>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Quote Request from {customer_info.get('name', 'Customer')} - {len(products)} Products"
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


# ============= USER MANAGEMENT ENDPOINTS =============

@app.get("/admin/users")
async def list_users(user: dict = Depends(require_permission("manage_users"))):
    """List all users (admin only)"""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT username, email, role, is_active, created_at, last_login, created_by
        FROM users ORDER BY created_at DESC
    """)
    users = cur.fetchall()
    cur.close()
    conn.close()
    return {"users": users}

@app.post("/admin/users")
async def create_user(new_user: UserCreate, user: dict = Depends(require_permission("manage_users"))):
    """Create a new user (admin only)"""
    conn = get_db_connection()
    cur = conn.cursor()

    # Check if username already exists
    cur.execute("SELECT username FROM users WHERE username = %s", (new_user.username,))
    if cur.fetchone():
        cur.close()
        conn.close()
        raise HTTPException(status_code=400, detail="Username already exists")

    # Validate role
    if new_user.role not in ROLE_PERMISSIONS:
        cur.close()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {list(ROLE_PERMISSIONS.keys())}")

    # Hash password and create user
    hashed_password = bcrypt.hashpw(new_user.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    cur.execute("""
        INSERT INTO users (username, password, email, role, is_active, created_at, created_by)
        VALUES (%s, %s, %s, %s, TRUE, NOW(), %s)
    """, (new_user.username, hashed_password, new_user.email, new_user.role, user["username"]))

    conn.commit()
    cur.close()
    conn.close()

    # Log the action
    log_audit(user["username"], "user_created", "user", new_user.username,
              {"role": new_user.role, "email": new_user.email})

    return {"message": f"User '{new_user.username}' created successfully", "username": new_user.username}

@app.get("/admin/users/{username}")
async def get_user(username: str, user: dict = Depends(require_permission("manage_users"))):
    """Get a specific user's details (admin only)"""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT username, email, role, is_active, created_at, last_login, created_by
        FROM users WHERE username = %s
    """, (username,))
    user_data = cur.fetchone()
    cur.close()
    conn.close()

    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")

    return user_data

@app.patch("/admin/users/{username}")
async def update_user(username: str, user_update: UserUpdate, user: dict = Depends(require_permission("manage_users"))):
    """Update a user's details (admin only)"""
    conn = get_db_connection()
    cur = conn.cursor()

    # Check if user exists
    cur.execute("SELECT username FROM users WHERE username = %s", (username,))
    if not cur.fetchone():
        cur.close()
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent admin from disabling themselves
    if username == user["username"] and user_update.is_active is False:
        cur.close()
        conn.close()
        raise HTTPException(status_code=400, detail="Cannot disable your own account")

    # Build update query
    updates = []
    values = []

    if user_update.email is not None:
        updates.append("email = %s")
        values.append(user_update.email)

    if user_update.role is not None:
        if user_update.role not in ROLE_PERMISSIONS:
            cur.close()
            conn.close()
            raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {list(ROLE_PERMISSIONS.keys())}")
        # Prevent admin from demoting themselves
        if username == user["username"] and user_update.role != "admin":
            cur.close()
            conn.close()
            raise HTTPException(status_code=400, detail="Cannot change your own role")
        updates.append("role = %s")
        values.append(user_update.role)

    if user_update.is_active is not None:
        updates.append("is_active = %s")
        values.append(user_update.is_active)

    if user_update.password is not None:
        hashed_password = bcrypt.hashpw(user_update.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        updates.append("password = %s")
        values.append(hashed_password)

    if updates:
        values.append(username)
        cur.execute(f"UPDATE users SET {', '.join(updates)} WHERE username = %s", values)
        conn.commit()

        # Log the action
        log_audit(user["username"], "user_updated", "user", username,
                  {"changes": user_update.dict(exclude_none=True, exclude={"password"})})

    cur.close()
    conn.close()

    return {"message": f"User '{username}' updated successfully"}

@app.delete("/admin/users/{username}")
async def delete_user(username: str, user: dict = Depends(require_permission("manage_users"))):
    """Delete a user (admin only)"""
    conn = get_db_connection()
    cur = conn.cursor()

    # Prevent admin from deleting themselves
    if username == user["username"]:
        cur.close()
        conn.close()
        raise HTTPException(status_code=400, detail="Cannot delete your own account")

    # Check if user exists
    cur.execute("SELECT username FROM users WHERE username = %s", (username,))
    if not cur.fetchone():
        cur.close()
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")

    # Delete user settings first (foreign key constraint)
    cur.execute("DELETE FROM user_settings WHERE username = %s", (username,))
    # Delete user
    cur.execute("DELETE FROM users WHERE username = %s", (username,))
    conn.commit()
    cur.close()
    conn.close()

    # Log the action
    log_audit(user["username"], "user_deleted", "user", username)

    return {"message": f"User '{username}' deleted successfully"}

# ============= AUDIT LOG ENDPOINTS =============

@app.get("/admin/audit-logs")
async def get_audit_logs(
    limit: int = 100,
    offset: int = 0,
    username: Optional[str] = None,
    action: Optional[str] = None,
    user: dict = Depends(require_permission("view_audit_logs"))
):
    """Get audit logs (admin/manager only)"""
    conn = get_db_connection()
    cur = conn.cursor()

    query = "SELECT * FROM audit_logs WHERE 1=1"
    params = []

    if username:
        query += " AND username = %s"
        params.append(username)
    if action:
        query += " AND action LIKE %s"
        params.append(f"%{action}%")

    query += " ORDER BY timestamp DESC LIMIT %s OFFSET %s"
    params.extend([limit, offset])

    cur.execute(query, params)
    logs = cur.fetchall()

    # Get total count
    count_query = "SELECT COUNT(*) as count FROM audit_logs WHERE 1=1"
    count_params = []
    if username:
        count_query += " AND username = %s"
        count_params.append(username)
    if action:
        count_query += " AND action LIKE %s"
        count_params.append(f"%{action}%")

    cur.execute(count_query, count_params)
    total = cur.fetchone()["count"]

    cur.close()
    conn.close()

    return {"logs": logs, "total": total, "limit": limit, "offset": offset}

# ============= COMPANY SETTINGS ENDPOINTS =============

@app.get("/admin/company-settings")
async def get_company_settings(user: dict = Depends(require_permission("manage_settings"))):
    """Get company settings (admin only)"""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT key, value FROM company_settings")
    rows = cur.fetchall()
    cur.close()
    conn.close()

    # Convert to dictionary
    settings = {}
    for row in rows:
        settings[row["key"]] = row["value"]

    return settings

@app.patch("/admin/company-settings")
async def update_company_settings(settings: CompanySettingsUpdate, user: dict = Depends(require_permission("manage_settings"))):
    """Update company settings (admin only)"""
    conn = get_db_connection()
    cur = conn.cursor()

    # Update each non-null setting
    settings_dict = settings.dict(exclude_none=True)
    for key, value in settings_dict.items():
        cur.execute("""
            INSERT INTO company_settings (key, value)
            VALUES (%s, %s)
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
        """, (key, Json(value)))

    conn.commit()
    cur.close()
    conn.close()

    # Log the action
    log_audit(user["username"], "company_settings_updated", "settings", None, settings_dict)

    return {"message": "Company settings updated", "settings": settings_dict}

# ============= CURRENT USER INFO ENDPOINT =============

@app.get("/user/me")
async def get_current_user_info(current_user: str = Depends(get_current_user)):
    """Get current user's info including role"""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT username, email, role, is_active, created_at, last_login
        FROM users WHERE username = %s
    """, (current_user,))
    user = cur.fetchone()
    cur.close()
    conn.close()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Add permissions based on role
    user_dict = dict(user)
    user_dict["permissions"] = ROLE_PERMISSIONS.get(user["role"], [])

    return user_dict

