import os
import psycopg2
import json
import secrets
import subprocess

def generate_id(prefix='img_01'):
    return prefix + ''.join(secrets.choice('0123456789abcdefghijklmnopqrstuvwxyz') for _ in range(24))

LOCAL_URL = "postgres://procare_ecommerce:procare_ecommerce@localhost:5432/procare_ecommerce"
REMOTE_DB_URL = "postgres://propremiumcare:Mvsc2026##56@database-1.c5wkcis2qg1p.ap-south-1.rds.amazonaws.com:5432/prepreimiumcare_ecommerce"

def generate_sql():
    print("Connecting to local DB to generate SQL for remote...")
    conn = psycopg2.connect(LOCAL_URL)
    cur = conn.cursor()

    cur.execute("SELECT id, title, handle FROM product WHERE deleted_at IS NULL")
    products = cur.fetchall()

    sql_statements = ["BEGIN;"]

    for pid, ptitle, handle in products:
        # Check if product has color variants
        cur.execute("SELECT COUNT(*) FROM product_option WHERE product_id = %s AND LOWER(title) = 'color'", (pid,))
        has_color = cur.fetchone()[0] > 0

        cur.execute("SELECT id, title, metadata FROM product_variant WHERE product_id = %s AND deleted_at IS NULL", (pid,))
        variants = cur.fetchall()

        source_dir = os.path.join('/mnt/ExtraStorage/Project-Files/session-2026/procare/ecomm/latest/all-product-images', ptitle)
        
        all_product_urls = []
        variant_image_updates = {}
        
        if os.path.exists(source_dir):
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
                
                matching_vid = None
                for vid, vtitle, vmeta in variants:
                    if vtitle.lower() == var_dir_name.lower():
                        matching_vid = (vid, vmeta)
                        break
                
                if matching_vid and var_urls:
                    variant_image_updates[matching_vid[0]] = (matching_vid[1], var_urls)
                elif var_dir_name.lower() == "default variant" and len(variants) == 1:
                    variant_image_updates[variants[0][0]] = (variants[0][2], var_urls)

        # Clear existing images
        sql_statements.append(f"DELETE FROM product_variant_product_image WHERE image_id IN (SELECT id FROM image WHERE product_id = '{pid}');")
        sql_statements.append(f"DELETE FROM image WHERE product_id = '{pid}';")

        # Insert new images
        img_id_map = {}
        for rank, url in enumerate(all_product_urls):
            img_id = generate_id()
            img_id_map[url] = img_id
            sql_statements.append(f"INSERT INTO image (id, url, product_id, rank, created_at, updated_at) VALUES ('{img_id}', '{url}', '{pid}', {rank}, NOW(), NOW());")

        if all_product_urls:
            sql_statements.append(f"UPDATE product SET thumbnail = '{all_product_urls[0]}' WHERE id = '{pid}';")

        for vid, (vmeta, urls) in variant_image_updates.items():
            if vmeta is None:
                vmeta = {}
            for i in range(1, 10):
                vmeta.pop(f"image_{i}", None)
            
            if has_color:
                for i, url in enumerate(urls[:6]):
                    vmeta[f"image_{i+1}"] = url
            
            json_meta_str = json.dumps(vmeta).replace("'", "''")
            sql_statements.append(f"UPDATE product_variant SET metadata = '{json_meta_str}'::jsonb WHERE id = '{vid}';")
            
            for url in urls:
                link_id = generate_id('pvpi_01')
                img_id = img_id_map[url]
                sql_statements.append(f"INSERT INTO product_variant_product_image (id, variant_id, image_id, created_at, updated_at) VALUES ('{link_id}', '{vid}', '{img_id}', NOW(), NOW());")

    sql_statements.append("COMMIT;")
    
    cur.close()
    conn.close()

    with open("remote_db_update.sql", "w") as f:
        f.write("\n".join(sql_statements))
    
    print("Generated remote_db_update.sql.")

def run_remote():
    print("Running remote_db_update.sql on remote RDS via SSH...")
    cmd = ["ssh", "procare", f'docker exec -i procare_postgres psql "{REMOTE_DB_URL}" -t -A']
    with open("remote_db_update.sql", "r") as f:
        sql = f.read()
    
    res = subprocess.run(cmd, input=sql, text=True, check=True, capture_output=True)
    print("Success! Remote DB updated.")

if __name__ == '__main__':
    generate_sql()
    run_remote()
