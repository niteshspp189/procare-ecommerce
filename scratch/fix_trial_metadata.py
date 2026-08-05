import psycopg2
import json
import logging

logging.basicConfig(level=logging.INFO)

conn = psycopg2.connect(
    dbname="procare_ecommerce",
    user="procare_ecommerce",
    password="procare_ecommerce",
    host="localhost",
    port=5432
)
cursor = conn.cursor()

cursor.execute("""
    SELECT pv.id, pv.metadata
    FROM product_variant pv
    JOIN product p ON pv.product_id = p.id
    WHERE p.handle IN ('pro-suede-and-nubuck-renovator-spray', 'pro-gold-shine-self-shine', 'pro-application-brush')
""")

for row in cursor.fetchall():
    pv_id, metadata = row
    if not metadata:
        continue

    # Determine product handle
    cursor.execute("""
        SELECT p.handle, pv.title
        FROM product p
        JOIN product_variant pv ON pv.product_id = p.id
        WHERE pv.id = %s
    """, (pv_id,))
    res = cursor.fetchone()
    if not res:
        continue
    handle, variant_title = res

    # Fetch new images from product_variant_product_image
    cursor.execute("""
        SELECT i.url
        FROM image i
        JOIN product_variant_product_image pvpi ON i.id = pvpi.image_id
        WHERE pvpi.variant_id = %s
        ORDER BY i.rank ASC
    """, (pv_id,))
    images = [r[0] for r in cursor.fetchall()]

    new_meta = dict(metadata)
    updated = False
    
    # We map up to the number of images we found
    for i, img_url in enumerate(images):
        key = f"image_{i+1}"
        if key in metadata:
            if metadata[key] != img_url:
                new_meta[key] = img_url
                updated = True
        else:
            new_meta[key] = img_url
            updated = True
            
    if updated:
        cursor.execute("UPDATE product_variant SET metadata = %s WHERE id = %s", (json.dumps(new_meta), pv_id))
        logging.info(f"Updated metadata for variant {variant_title} ({pv_id})")

conn.commit()
cursor.close()
conn.close()
logging.info("Done.")
