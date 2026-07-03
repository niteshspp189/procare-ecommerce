import json
import psycopg2

with open('excel_dump.json', 'r') as f:
    excel_data = json.load(f)

# Connect to database
conn = psycopg2.connect("postgres://propremiumcare:Mvsc2026%23%2356@database-1.c5wkcis2qg1p.ap-south-1.rds.amazonaws.com:5432/prepreimiumcare_ecommerce?sslmode=require")
cur = conn.cursor()

# Get all products
cur.execute("SELECT p.id, p.title, p.handle FROM product p;")
db_products = {row[1].strip().lower(): {"id": row[0], "handle": row[2], "title": row[1]} for row in cur.fetchall()}

missing_in_db = []
found_in_db = []

for sheet, rows in excel_data.items():
    if sheet == "PENDING": continue
    for row in rows:
        name = row.get("Name Of Product", "")
        if not name or pd.isna(name): continue
        name_clean = str(name).strip().lower()
        
        # Try to find match
        match = db_products.get(name_clean)
        
        # Fuzzy match if exact match fails
        if not match:
            for db_name, db_info in db_products.items():
                if name_clean in db_name or db_name in name_clean:
                    match = db_info
                    break
                    
        if match:
            found_in_db.append({"excel_name": name, "db_name": match["title"], "db_id": match["id"]})
        else:
            missing_in_db.append({"sheet": sheet, "name": name})

print(f"Total found: {len(found_in_db)}")
print(f"Total missing: {len(missing_in_db)}")
print("Missing products:")
for m in missing_in_db:
    print(f" - [{m['sheet']}] {m['name']}")

