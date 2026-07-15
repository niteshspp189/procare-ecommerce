import psycopg2
import secrets
import json

RDS_URL = "postgres://propremiumcare:Mvsc2026##56@database-1.c5wkcis2qg1p.ap-south-1.rds.amazonaws.com:5432/prepreimiumcare_ecommerce?sslmode=require"

def generate_id():
    # Generate a Medusa v2 compatible ULID-like random ID for images
    return 'img_01' + ''.join(secrets.choice('0123456789abcdefghijklmnopqrstuvwxyz') for _ in range(24))

def run_migration():
    print("Connecting to database...")
    conn = psycopg2.connect(RDS_URL)
    cur = conn.cursor()

    # Get all active products
    cur.execute("""
        SELECT id, title FROM product WHERE deleted_at IS NULL
    """)
    products = cur.fetchall()
    print(f"Found {len(products)} active products.")

    for pid, title in products:
        # Check if product has Color option
        cur.execute("""
            SELECT COUNT(*) FROM product_option 
            WHERE product_id = %s AND LOWER(title) = 'color'
        """, (pid,))
        has_color = cur.fetchone()[0] > 0

        # Get variants for this product
        cur.execute("""
            SELECT id, title, metadata FROM product_variant 
            WHERE product_id = %s AND deleted_at IS NULL
        """, (pid,))
        variants = cur.fetchall()

        # Collect unique image URLs from variants' metadata
        variant_images = []
        for vid, vtitle, vmeta in variants:
            if not vmeta:
                continue
            # Handle metadata dictionary
            for i in range(1, 7):
                img_key = f"image_{i}"
                if img_key in vmeta and vmeta[img_key]:
                    url = vmeta[img_key].strip()
                    if url and url not in variant_images:
                        variant_images.append(url)

        if not variant_images:
            continue

        print(f"\nProduct: {title} (ID: {pid}) | Has Color Option: {has_color}")
        print(f"  Found variant metadata images: {variant_images}")

        # Get existing images for this product in image table
        cur.execute("""
            SELECT url FROM image WHERE product_id = %s AND deleted_at IS NULL
        """, (pid,))
        existing_urls = [r[0] for r in cur.fetchall()]

        # Insert new images
        next_rank = len(existing_urls)
        for url in variant_images:
            if url in existing_urls:
                print(f"  URL already exists in image table: {url}")
                continue
            
            img_id = generate_id()
            print(f"  Inserting new image {img_id} (rank {next_rank}): {url}")
            cur.execute("""
                INSERT INTO image (id, url, product_id, rank, created_at, updated_at) 
                VALUES (%s, %s, %s, %s, NOW(), NOW())
            """, (img_id, url, pid, next_rank))
            next_rank += 1

        # For non-color products, clear image_1 through image_6 from variants' metadata
        if not has_color:
            print("  Non-color product: Clearing variant metadata image fields to fall back to product.images...")
            for vid, vtitle, vmeta in variants:
                if not vmeta:
                    continue
                modified = False
                for i in range(1, 7):
                    img_key = f"image_{i}"
                    if img_key in vmeta:
                        del vmeta[img_key]
                        modified = True
                if modified:
                    cur.execute("""
                        UPDATE product_variant SET metadata = %s WHERE id = %s
                    """, (json.dumps(vmeta), vid))
                    print(f"    Cleared metadata images for variant: {vtitle} ({vid})")

    # Commit changes
    conn.commit()
    print("\nMigration completed and committed successfully!")
    cur.close()
    conn.close()

if __name__ == "__main__":
    run_migration()
