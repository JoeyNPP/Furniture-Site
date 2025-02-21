-- Step 1: Create the Final `products` Table
CREATE TABLE products (
    "Amazon_URL" TEXT,
    "Asin" TEXT,
    "Price" NUMERIC,
    "MOQ" INTEGER,
    "QTY" INTEGER,
    "UPC" TEXT,
    "Cost" NUMERIC,
    "Vendor" TEXT,
    "Lead Time" TEXT,
    "Exp Date" DATE,
    "FOB" TEXT,
    "ID" SERIAL PRIMARY KEY,
    "Profit/MOQ" NUMERIC,
    "Image URL" TEXT,
    "Title" TEXT,
    "Category" TEXT,
    "Out of Stock" BOOLEAN,
    "Walmart URL" TEXT,
    "EBAY URL" TEXT
);

-- Step 2: Create a Staging Table for Raw Data Import
CREATE TABLE products_staging (
    "Amazon_URL" TEXT,
    "Asin" TEXT,
    "Price" TEXT,
    "MOQ" TEXT,
    "QTY" TEXT,
    "UPC" TEXT,
    "Cost" TEXT,
    "Vendor" TEXT,
    "Lead Time" TEXT,
    "Exp Date" TEXT,
    "FOB" TEXT,
    "ID" SERIAL PRIMARY KEY,
    "Profit/MOQ" TEXT,
    "Image URL" TEXT,
    "Title" TEXT,
    "Category" TEXT,
    "Out of Stock" TEXT,
    "Walmart URL" TEXT,
    "EBAY URL" TEXT
);

-- Step 3: Load the CSV Data into the Staging Table
-- Make sure the file path below matches the actual path to your CSV file.
\copy products_staging (
    "Amazon_URL",
    "Asin",
    "Price",
    "MOQ",
    "QTY",
    "UPC",
    "Cost",
    "Vendor",
    "Lead Time",
    "Exp Date",
    "FOB",
    "Profit/MOQ",
    "Image URL",
    "Title",
    "Category",
    "Out of Stock",
    "Walmart URL",
    "EBAY URL"
) 
FROM 'C:/Users/josep/Documents/NPP_Deals/data/Daily Deals - Upload.csv' 
DELIMITER ',' CSV HEADER;

-- Step 4: Transform and Load Data into the Final `products` Table
INSERT INTO products (
    "Amazon_URL",
    "Asin",
    "Price",
    "MOQ",
    "QTY",
    "UPC",
    "Cost",
    "Vendor",
    "Lead Time",
    "Exp Date",
    "FOB",
    "Profit/MOQ",
    "Image URL",
    "Title",
    "Category",
    "Out of Stock",
    "Walmart URL",
    "EBAY URL"
)
SELECT 
    "Amazon_URL",
    "Asin",
    "Price"::NUMERIC,
    "MOQ"::INTEGER,
    "QTY"::INTEGER,
    "UPC",
    "Cost"::NUMERIC,
    "Vendor",
    "Lead Time",
    TO_DATE("Exp Date", 'YYYY-MM-DD'),
    "FOB",
    REPLACE("Profit/MOQ", '$', '')::NUMERIC,
    "Image URL",
    "Title",
    "Category",
    CASE WHEN LOWER("Out of Stock") = 'x' THEN TRUE ELSE FALSE END,
    "Walmart URL",
    "EBAY URL"
FROM products_staging;

-- Step 5: Verify the Final Data
SELECT * FROM products LIMIT 10;
