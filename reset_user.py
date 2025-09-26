import os
import bcrypt
import psycopg2
conn = psycopg2.connect(
    dbname=os.getenv("DB_NAME", "npp_deals"),
    user=os.getenv("DB_USER", "postgres"),
    password=os.getenv("DB_PASSWORD", "26,Sheetpans!"),
    host=os.getenv("DB_HOST", "npp_deals-db"),
    port=os.getenv("DB_PORT", "5432"),
)
cur = conn.cursor()
cur.execute("DELETE FROM users WHERE username = %s", ("joey/alex",))
cur.execute(
    "INSERT INTO users (username, password) VALUES (%s, %s)",
    ("joey/alex", bcrypt.hashpw("Winter2025$".encode(), bcrypt.gensalt()).decode()),
)
conn.commit()
cur.close()
conn.close()
print("User joey/alex reset.")
