import psycopg2
import secrets

RDS_URL = "postgres://propremiumcare:Mvsc2026##56@database-1.c5wkcis2qg1p.ap-south-1.rds.amazonaws.com:5432/prepreimiumcare_ecommerce?sslmode=require"

def generate_id():
    return 'pvpi_01' + ''.join(secrets.choice('0123456789abcdefghijklmnopqrstuvwxyz') for _ in range(24))

def run():
    conn = psycopg2.connect(RDS_URL)
    cur = conn.cursor()

    # Get variants for products with Color option
    cur.execute("""
        SELECT v.id, v.title, v.metadata, p.title
        FROM product_variant v
        JOIN product p ON v.product_id = p.id
        WHERE p.id IN (SELECT DISTINCT product_id FROM product_option WHERE LOWER(title) = 'color')
          AND v.deleted_at IS NULL
    """)
    variants = cur.fetchall()
    print(f"Found {len(variants)} color variants to link.")

    for vid, vtitle, vmeta, ptitle in variants:
        if not vmeta:
            continue
        
        # Collect image URLs from metadata
        urls = []
        for i in range(1, 7):
            key = f"image_{i}"
            if key in vmeta and vmeta[key]:
                url = vmeta[key].strip()
                if url and url not in urls:
                    urls.append(url)

        if not urls:
            continue

        print(f"\nProduct: {ptitle} | Variant: {vtitle} ({vid})")
        print(f"  Metadata image URLs: {urls}")

        for url in urls:
            # Find image ID for this URL and product
            cur.execute("""
                SELECT id FROM image WHERE url = %s AND deleted_at IS NULL
            """, (url,))
            row = cur.fetchone()
            if not row:
                print(f"  Warning: Image URL not found in image table: {url}")
                continue
            img_id = row[0]

            # Check if already linked
            cur.execute("""
                SELECT id FROM product_variant_product_image 
                WHERE variant_id = %s AND image_id = %s AND deleted_at IS NULL
            """, (vid, img_id))
            link_row = cur.fetchone()
            if link_row:
                print(f"  Already linked image {img_id}")
                continue

            # Link variant to image
            link_id = generate_id()
            print(f"  Linking image {img_id} to variant (link_id: {link_id})")
            cur.execute("""
                INSERT INTO product_variant_product_image (id, variant_id, image_id, created_at, updated_at)
                VALUES (%s, %s, %s, NOW(), NOW())
            """, (link_id, vid, img_id))

    conn.commit()
    print("\nVariant image links committed successfully!")
    cur.close()
    conn.close()

if __name__ == "__main__":
    run()
