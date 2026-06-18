import os
import sys
import json
import psycopg2
from psycopg2.extras import RealDictCursor

DRIVE_DIR = '/mnt/ExtraStorage/Project-Files/session-2026/procare/ecomm/product-data/june-17/Website-20260617T104551Z-3-001/Website'
DB_URL = "postgres://procare_ecommerce:procare_ecommerce@localhost:5432/procare_ecommerce"

def main():
    if not os.path.exists(DRIVE_DIR):
        print(f"Error: Drive folder not found at {DRIVE_DIR}")
        sys.exit(1)

    # 1. Collect all drive files recursively
    drive_files = {} # relative_path -> filename
    for root, dirs, files in os.walk(DRIVE_DIR):
        for f in files:
            if f.lower().endswith(('.jpg', '.jpeg', '.png')):
                full_path = os.path.join(root, f)
                rel_path = os.path.relpath(full_path, DRIVE_DIR)
                drive_files[rel_path] = f

    print(f"Found {len(drive_files)} images in the drive folder.")

    # 2. Query mapped images from DB
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get all image URLs from product_variant metadata and product images
        cur.execute("SELECT url FROM image;")
        db_images = [r['url'] for r in cur.fetchall()]
        
        cur.execute("SELECT thumbnail FROM product WHERE thumbnail IS NOT NULL;")
        db_thumbnails = [r['thumbnail'] for r in cur.fetchall()]

        cur.execute("SELECT metadata FROM product_variant WHERE metadata IS NOT NULL;")
        variant_meta = [r['metadata'] for r in cur.fetchall()]

        cur.execute("SELECT metadata FROM product WHERE metadata IS NOT NULL;")
        product_meta = [r['metadata'] for r in cur.fetchall()]

        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error connecting to Postgres: {e}")
        sys.exit(1)

    # Compile all image names present in the DB
    db_image_basenames = set()
    
    # helper to extract image names from paths/URLs
    def add_url(url):
        if not url:
            return
        # clean url/path
        base = os.path.basename(url)
        # remove webp extension if it was converted to webp
        base_no_ext = os.path.splitext(base)[0].lower()
        db_image_basenames.add(base_no_ext)

    for url in db_images:
        add_url(url)
    for url in db_thumbnails:
        add_url(url)
        
    def parse_meta(meta):
        if not meta:
            return
        try:
            if isinstance(meta, str):
                meta = json.loads(meta)
            if isinstance(meta, dict):
                for k, v in meta.items():
                    if isinstance(v, str) and ('/' in v or '.' in v):
                        add_url(v)
        except Exception:
            pass

    for meta in variant_meta:
        parse_meta(meta)

    for meta in product_meta:
        parse_meta(meta)

    # 3. Match drive files against DB images
    used_images = []
    skipped_images = []

    # Prepare cleaned DB names
    clean_db_names = {name.replace("  ", " ").strip().lower() for name in db_image_basenames}

    for rel_path, filename in sorted(drive_files.items()):
        name_no_ext = os.path.splitext(filename)[0].lower()
        # Clean double spaces or minor spelling differences during match check
        clean_name = name_no_ext.replace("  ", " ").strip()
        
        matched = False
        if clean_name in clean_db_names:
            matched = True
        else:
            # Try matching parts of the name or direct mapping names
            for db_name in clean_db_names:
                if db_name in clean_name or clean_name in db_name:
                    matched = True
                    break
        
        if matched:
            used_images.append((rel_path, filename))
        else:
            skipped_images.append((rel_path, filename))

    # Output results
    print("\n--- RESULTS ---")
    print(f"Total Used Images: {len(used_images)}")
    print(f"Total Skipped Images: {len(skipped_images)}")

    print("\n### Used Images:")
    for rel_path, f in used_images:
        print(f"- {rel_path}")

    print("\n### Skipped Images:")
    for rel_path, f in skipped_images:
        print(f"- {rel_path}")

if __name__ == '__main__':
    main()
