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


