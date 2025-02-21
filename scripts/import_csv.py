import csv
import psycopg2
from config.db_config import DB_CONFIG

# Connect to the database
conn = psycopg2.connect(**DB_CONFIG)
cursor = conn.cursor()

# CSV file path
csv_file_path = r"C:\Users\josep\Documents\NPP Deals\data\Daily Deals - Upload.csv"

# Insert data function
def import_csv():
    with open(csv_file_path, mode='r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for row in reader:
            cursor.execute("""
                INSERT INTO product_import (
                    amazon_url, asin, price, moq, qty, upc, cost, vendor,
                    lead_time, exp_date, fob, product_id, profit_moq, image_url,
                    title, category, out_of_stock, walmart_url, ebay_url
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                row['Amazon URL'], row['Asin'], row['Price'], row['MOQ'], row['QTY'],
                row['UPC'], row['Cost'], row['Vendor'], row['Lead Time'], row['Exp Date'],
                row['FOB'], row['ID'], row['Profit/MOQ'], row['Image URL'], row['Title'],
                row['Category'], row['Out of Stock'], row['Walmart URL'], row['EBAY URL']
            ))

    # Commit changes and close connection
    conn.commit()
    cursor.close()
    conn.close()

# Run import
if __name__ == "__main__":
    import_csv()


