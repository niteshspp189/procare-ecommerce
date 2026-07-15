import os
import glob
import shutil
import psycopg2
import json
import secrets
import sys

def generate_id(prefix='img_01'):
    return prefix + ''.join(secrets.choice('0123456789abcdefghijklmnopqrstuvwxyz') for _ in range(24))

LOCAL_URL = "postgres://procare_ecommerce:procare_ecommerce@localhost:5432/procare_ecommerce"
RDS_URL = "postgres://propremiumcare:Mvsc2026##56@database-1.c5wkcis2qg1p.ap-south-1.rds.amazonaws.com:5432/prepreimiumcare_ecommerce?sslmode=require"

def run_db_update(db_url):
    print(f"Connecting to DB...")
    # Because we're inside the VM and postgres is in docker for local, we should connect to the local docker exposed port if we use localhost, or we use docker exec. We will just use docker exec for local to be safe, but psycopg2 might work if port 5432 is exposed. 
    # Actually for local, docker ps showed: 0.0.0.0:5432->5432/tcp so localhost:5432 should work!
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()

    cur.execute("SELECT id, title, handle FROM product WHERE deleted_at IS NULL")
    products = cur.fetchall()

    updated = 0

    for pid, ptitle, handle in products:
        # Check if product has color variants
        cur.execute("SELECT COUNT(*) FROM product_option WHERE product_id = %s AND LOWER(title) = 'color'", (pid,))
        has_color = cur.fetchone()[0] > 0

        cur.execute("SELECT id, title, metadata FROM product_variant WHERE product_id = %s AND deleted_at IS NULL", (pid,))
        variants = cur.fetchall()

        # Build list of new image URLs for this product based on our final folder
        source_dir = os.path.join('/mnt/ExtraStorage/Project-Files/session-2026/procare/ecomm/latest/all-product-images', ptitle)
        
        all_product_urls = []
        variant_image_updates = {}
        
        if os.path.exists(source_dir):
            # For each variant directory, find images
            for var_dir_name in os.listdir(source_dir):
                var_dir_path = os.path.join(source_dir, var_dir_name)
                if not os.path.isdir(var_dir_path): continue
                
                images = sorted([f for f in os.listdir(var_dir_path) if f.lower().endswith(('.webp', '.jpg', '.jpeg', '.png'))])
                
                var_urls = []
                for img in images:
                    url = f"/images/products/{handle}/{var_dir_name}/{img}"
                    var_urls.append(url)
                    if url not in all_product_urls:
                        all_product_urls.append(url)
                
                # Match var_dir_name to actual variant title
                # E.g. "Default Variant", "Black", "Size 39"
                matching_vid = None
                for vid, vtitle, vmeta in variants:
                    if vtitle.lower() == var_dir_name.lower():
                        matching_vid = (vid, vmeta)
                        break
                
                if matching_vid and var_urls:
                    variant_image_updates[matching_vid[0]] = (matching_vid[1], var_urls)
                elif var_dir_name.lower() == "default variant" and len(variants) == 1:
                    # If it's single variant, apply to the only variant
                    variant_image_updates[variants[0][0]] = (variants[0][2], var_urls)

        # Clear existing images for this product
        cur.execute("DELETE FROM product_variant_product_image WHERE image_id IN (SELECT id FROM image WHERE product_id = %s)", (pid,))
        cur.execute("DELETE FROM image WHERE product_id = %s", (pid,))

        # Insert new images
        img_id_map = {}
        for rank, url in enumerate(all_product_urls):
            img_id = generate_id()
            img_id_map[url] = img_id
            cur.execute("""
                INSERT INTO image (id, url, product_id, rank, created_at, updated_at) 
                VALUES (%s, %s, %s, %s, NOW(), NOW())
            """, (img_id, url, pid, rank))

        # Update thumbnail on product
        if all_product_urls:
            cur.execute("UPDATE product SET thumbnail = %s WHERE id = %s", (all_product_urls[0], pid))

        # Update variant metadata and links
        for vid, (vmeta, urls) in variant_image_updates.items():
            if vmeta is None:
                vmeta = {}
            # Clear old image_1...image_6
            for i in range(1, 10):
                vmeta.pop(f"image_{i}", None)
            
            # If it has color, set image_1...image_6 in metadata
            if has_color:
                for i, url in enumerate(urls[:6]):
                    vmeta[f"image_{i+1}"] = url
            
            cur.execute("UPDATE product_variant SET metadata = %s WHERE id = %s", (json.dumps(vmeta), vid))
            
            # Link to product_variant_product_image
            for url in urls:
                link_id = generate_id('pvpi_01')
                img_id = img_id_map[url]
                cur.execute("""
                    INSERT INTO product_variant_product_image (id, variant_id, image_id, created_at, updated_at)
                    VALUES (%s, %s, %s, NOW(), NOW())
                """, (link_id, vid, img_id))

        updated += 1
        
    conn.commit()
    print(f"Updated DB successfully for {updated} products.")
    cur.close()
    conn.close()


def sync_folders():
    golden_dir = '/mnt/ExtraStorage/Project-Files/session-2026/procare/ecomm/latest/images_for_review/other/all-product-images'
    final_dir = '/mnt/ExtraStorage/Project-Files/session-2026/procare/ecomm/latest/all-product-images'
    storefront_dir = '/mnt/ExtraStorage/Project-Files/session-2026/procare/ecomm/storefront/public/images/products'

    print("Clearing and syncing final folders...")
    if os.path.exists(final_dir):
        shutil.rmtree(final_dir)
    shutil.copytree(golden_dir, final_dir)

    if os.path.exists(storefront_dir):
        shutil.rmtree(storefront_dir)
    os.makedirs(storefront_dir, exist_ok=True)

    # To map properly, we need the DB to give us title -> handle mapping.
    conn = psycopg2.connect(LOCAL_URL)
    cur = conn.cursor()
    cur.execute("SELECT title, handle FROM product")
    mapping = {r[0]: r[1] for r in cur.fetchall()}
    cur.close()
    conn.close()

    for ptitle in os.listdir(final_dir):
        src_p = os.path.join(final_dir, ptitle)
        if not os.path.isdir(src_p): continue
        
        handle = mapping.get(ptitle)
        if not handle:
            # Fallback handle generation
            handle = ptitle.lower().replace(' ', '-').replace('&', 'and').replace('–', '-')
        
        dest_p = os.path.join(storefront_dir, handle)
        shutil.copytree(src_p, dest_p)
    print("Folders synced.")

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'sync':
        sync_folders()
    elif len(sys.argv) > 1 and sys.argv[1] == 'db':
        target = sys.argv[2]
        if target == 'local':
            run_db_update(LOCAL_URL)
        elif target == 'remote':
            run_db_update(RDS_URL)
    else:
        print("Usage: python reseed_images.py sync | db [local|remote]")
