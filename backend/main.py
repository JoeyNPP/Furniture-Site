from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import psycopg2
from psycopg2.extras import RealDictCursor
import requests
import json
from datetime import datetime


def get_db_connection():
    return psycopg2.connect(
        dbname="npp_deals",
        user="postgres",
        password="26,Sheetpans!",
        host="localhost",
        cursor_factory=RealDictCursor
    )


app = FastAPI()

# CORS: Adjust in production as needed
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Product model for creation with Optional types for non-required fields
class Product(BaseModel):
    amazon_url: Optional[str] = None
    asin: Optional[str] = None
    price: Optional[float] = None
    moq: Optional[int] = None
    qty: Optional[int] = None
    upc: Optional[str] = None
    cost: Optional[float] = None
    vendor: Optional[str] = None
    lead_time: Optional[str] = None
    exp_date: Optional[str] = None
    fob: Optional[str] = None
    profit_moq: Optional[float] = None
    image_url: Optional[str] = None
    title: str
    category: Optional[str] = None
    out_of_stock: bool = False
    walmart_url: Optional[str] = None
    ebay_url: Optional[str] = None
    offer_date: Optional[str] = None
    last_sent: Optional[str] = None

    class Config:
        extra = "ignore"


# Model for partial updates (all fields optional)
class ProductUpdate(BaseModel):
    amazon_url: Optional[str] = None
    asin: Optional[str] = None
    price: Optional[float] = None
    moq: Optional[int] = None
    qty: Optional[int] = None
    upc: Optional[str] = None
    cost: Optional[float] = None
    vendor: Optional[str] = None
    lead_time: Optional[str] = None
    exp_date: Optional[str] = None
    fob: Optional[str] = None
    profit_moq: Optional[float] = None
    image_url: Optional[str] = None
    title: Optional[str] = None
    category: Optional[str] = None
    out_of_stock: Optional[bool] = None
    walmart_url: Optional[str] = None
    ebay_url: Optional[str] = None
    offer_date: Optional[str] = None
    last_sent: Optional[str] = None

    class Config:
        extra = "ignore"


# ================ GET /products/ ================
@app.get("/products/")
def get_products():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM products;")
    rows = cur.fetchall()
    cur.close()
    conn.close()

    # Convert numeric id to string for consistency
    for row in rows:
        row["id"] = str(row["id"])
    return {"products": rows}


# ================ POST /products/ ================
@app.post("/products/")
def create_product(product: Product):
    # Use the provided offer_date or default to the current datetime
    offer_date_value = product.offer_date if product.offer_date is not None else datetime.now().isoformat()

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO products (
          amazon_url, asin, price, moq, qty, upc, cost, vendor, lead_time,
          exp_date, fob, profit_moq, image_url, title, category, out_of_stock,
          walmart_url, ebay_url, offer_date
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id;
    """, (
        product.amazon_url,
        product.asin,
        product.price,
        product.moq,
        product.qty,
        product.upc,
        product.cost,
        product.vendor,
        product.lead_time,
        product.exp_date,
        product.fob,
        product.profit_moq,
        product.image_url,
        product.title,
        product.category,
        product.out_of_stock,
        product.walmart_url,
        product.ebay_url,
        offer_date_value
    ))
    new_id = cur.fetchone()["id"]
    conn.commit()
    cur.close()
    conn.close()

    return {"message": "Product created successfully", "product_id": str(new_id)}


# ================ PATCH /products/{product_id}/ ================
@app.patch("/products/{product_id}/")
def update_product(product_id: int, product: ProductUpdate):
    conn = get_db_connection()
    cur = conn.cursor()
    # Fetch current record
    cur.execute("SELECT * FROM products WHERE id = %s;", (product_id,))
    current = cur.fetchone()
    if not current:
        cur.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Product not found")

    new_amazon_url = product.amazon_url if product.amazon_url is not None else current["amazon_url"]
    new_asin = product.asin if product.asin is not None else current["asin"]
    new_price = product.price if product.price is not None else current["price"]
    new_moq = product.moq if product.moq is not None else current["moq"]
    new_qty = product.qty if product.qty is not None else current["qty"]
    new_upc = product.upc if product.upc is not None else current["upc"]
    new_cost = product.cost if product.cost is not None else current["cost"]
    new_vendor = product.vendor if product.vendor is not None else current["vendor"]
    new_lead_time = product.lead_time if product.lead_time is not None else current["lead_time"]
    new_exp_date = product.exp_date if product.exp_date is not None else current["exp_date"]
    new_fob = product.fob if product.fob is not None else current["fob"]
    new_profit_moq = product.profit_moq if product.profit_moq is not None else current["profit_moq"]
    new_image_url = product.image_url if product.image_url is not None else current["image_url"]
    new_title = product.title if product.title is not None else current["title"]
    new_category = product.category if product.category is not None else current["category"]
    new_out_of_stock = product.out_of_stock if product.out_of_stock is not None else current["out_of_stock"]
    new_walmart_url = product.walmart_url if product.walmart_url is not None else current["walmart_url"]
    new_ebay_url = product.ebay_url if product.ebay_url is not None else current["ebay_url"]
    new_offer_date = product.offer_date if product.offer_date is not None else current.get("offer_date")
    new_last_sent = product.last_sent if product.last_sent is not None else current.get("last_sent")

    update_query = """
    UPDATE products SET 
      amazon_url = %s,
      asin = %s,
      price = %s,
      moq = %s,
      qty = %s,
      upc = %s,
      cost = %s,
      vendor = %s,
      lead_time = %s,
      exp_date = %s,
      fob = %s,
      profit_moq = %s,
      image_url = %s,
      title = %s,
      category = %s,
      out_of_stock = %s,
      walmart_url = %s,
      ebay_url = %s,
      offer_date = %s,
      last_sent = %s
    WHERE id = %s;
    """
    cur.execute(update_query, (
        new_amazon_url, new_asin, new_price, new_moq, new_qty, new_upc, new_cost,
        new_vendor, new_lead_time, new_exp_date, new_fob, new_profit_moq, new_image_url,
        new_title, new_category, new_out_of_stock, new_walmart_url, new_ebay_url,
        new_offer_date, new_last_sent, product_id
    ))
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Product updated successfully", "product_id": product_id}

# ================ DELETE /products/{product_id}/ ================
@app.delete("/products/{product_id}/")
def delete_product(product_id: int):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM products WHERE id = %s RETURNING id;", (product_id,))
    deleted = cur.fetchone()
    if not deleted:
        cur.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Product not found")
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Product deleted successfully", "product_id": product_id}

# ================ POST /products/{product_id}/mark-out-of-stock/ ================
@app.post("/products/{product_id}/mark-out-of-stock/")
def mark_out_of_stock(product_id: int):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("UPDATE products SET out_of_stock = TRUE WHERE id = %s RETURNING id;", (product_id,))
    updated = cur.fetchone()
    if not updated:
        cur.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Product not found")
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Product marked as out-of-stock", "product_id": product_id}

# ================ POST /products/{product_id}/send-email/ ================
@app.post("/products/{product_id}/send-email/")
def send_product_email(product_id: int):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM products WHERE id = %s;", (product_id,))
    product_row = cur.fetchone()
    if not product_row:
        cur.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Product not found")
    title = product_row["title"] or "Untitled"
    email_data = {
        "subject": title,
        "content": f"<h1>{title}</h1><p>Auto-generated single product email</p>",
        "public": False,
        "email_template_id": None
    }
    KIT_API_URL = "https://api.kit.com/v4/broadcasts"
    HEADERS = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-Kit-Api-Key": "kit_a0a183e8fd744ca557d96126e488ae22"
    }
    try:
        resp = requests.post(KIT_API_URL, data=json.dumps(email_data), headers=HEADERS)
    except Exception as e:
        cur.close()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error contacting Kit: {str(e)}")
    if resp.status_code == 201:
        now_str = datetime.now().isoformat()
        cur.execute("UPDATE products SET last_sent=%s WHERE id=%s;", (now_str, product_id))
        conn.commit()
        cur.close()
        conn.close()
        return {"success": True, "product_id": product_id, "last_sent": now_str}
    else:
        error_text = resp.text
        cur.close()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Kit API error: {error_text}")


# ================ POST /products/send-group-email/ ================
@app.post("/products/send-group-email/")
def send_group_email(product_ids: List[int]):
    if not product_ids:
        raise HTTPException(status_code=400, detail="No product IDs provided")
    conn = get_db_connection()
    cur = conn.cursor()
    format_strings = ",".join(["%s"] * len(product_ids))
    cur.execute(f"SELECT * FROM products WHERE id IN ({format_strings});", tuple(product_ids))
    rows = cur.fetchall()
    if not rows:
        cur.close()
        conn.close()
        raise HTTPException(status_code=404, detail="No matching products found")
    combined_html = ""
    for row in rows:
        combined_html += f"<h2>{row['title']}</h2><p>Auto-generated group email content</p><hr>"
    email_data = {
        "subject": f"Group Deal: {len(rows)} Products",
        "content": combined_html,
        "public": False,
        "email_template_id": None
    }
    KIT_API_URL = "https://api.kit.com/v4/broadcasts"
    HEADERS = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-Kit-Api-Key": "kit_a0a183e8fd744ca557d96126e488ae22"
    }
    resp = requests.post(KIT_API_URL, data=json.dumps(email_data), headers=HEADERS)
    if resp.status_code == 201:
        now_str = datetime.now().isoformat()
        cur.execute(
            f"UPDATE products SET last_sent=%s WHERE id IN ({format_strings});",
            (now_str, *product_ids)
        )
        conn.commit()
        cur.close()
        conn.close()
        return {"success": True, "count": len(rows), "last_sent": now_str}
    else:
        err_text = resp.text
        cur.close()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Kit API error: {err_text}")
