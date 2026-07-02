import psycopg2
import json

conn = psycopg2.connect(
    dbname="prepreimiumcare_ecommerce",
    user="propremiumcare",
    password="Mvsc2026##56",
    host="database-1.c5wkcis2qg1p.ap-south-1.rds.amazonaws.com"
)
cur = conn.cursor()

# Updates for Shoe Cream with Applicator
updates = {
    "Neutral": {
        "image_3": "/images/extra/prod_01KWC2J4SKFHSD8BDBPEAB9KWT_5_Shoe_cream_With_Applicator_Neutral_3.webp",
        "image_4": "/images/extra/prod_01KWC2J4SKFHSD8BDBPEAB9KWT_6_shoe_cream_Applicator_Neutral4.webp"
    },
    "Black": {
        "image_3": "/images/extra/prod_01KWC2J4SKFHSD8BDBPEAB9KWT_3_Shoe_cream_With_Applicator_Black3.webp",
        "image_4": "/images/extra/prod_01KWC2J4SKFHSD8BDBPEAB9KWT_7_shoe_cream_with_applicator_Black4.webp"
    },
    "Light Brown": {
        "image_3": "/images/extra/prod_01KWC2J4SKFHSD8BDBPEAB9KWT_4_Shoe_cream_With_Applicator_Light_Brown3.webp",
        "image_4": "/images/extra/prod_01KWC2J4SKFHSD8BDBPEAB9KWT_8_shoe_cream_with_applicator_Light_Brown4.webp"
    }
}

product_id = "prod_01KWC2J4SKFHSD8BDBPEAB9KWT"

cur.execute("SELECT id, title, metadata FROM product_variant WHERE product_id = %s", (product_id,))
variants = cur.fetchall()

for vid, title, metadata in variants:
    if title in updates:
        metadata["image_3"] = updates[title]["image_3"]
        metadata["image_4"] = updates[title]["image_4"]
        cur.execute("UPDATE product_variant SET metadata = %s WHERE id = %s", (json.dumps(metadata), vid))
        print(f"Updated {title} variant.")

# Delete all images except Common_for_all_5
cur.execute("""
    DELETE FROM image 
    WHERE product_id = %s 
    AND url NOT LIKE '%%_2_Common_for_all_5.webp'
""", (product_id,))
print(f"Deleted {cur.rowcount} variant images from image table.")

conn.commit()
cur.close()
conn.close()
print("Done!")
