import os
import shutil
import json
import subprocess
import uuid
import datetime

STAGING_DIR = "/mnt/ExtraStorage/Project-Files/session-2026/procare/ecomm/latest/aug3-2026-webp-staging"
MATCHED_DIR = os.path.join(STAGING_DIR, "matched")
UNMATCHED_DIR = os.path.join(STAGING_DIR, "unmatched")
PUBLIC_DIR = "/mnt/ExtraStorage/Project-Files/session-2026/procare/ecomm/storefront/public"
BACKEND_PUBLIC_DIR = "/mnt/ExtraStorage/Project-Files/session-2026/procare/ecomm/backend/public"

def run_query(sql):
    cmd = ["docker", "exec", "-i", "procare_postgres", "psql", "-U", "procare_ecommerce", "-d", "procare_ecommerce", "-t", "-A"]
    res = subprocess.run(cmd, input=sql.encode("utf-8"), capture_output=True)
    if res.returncode != 0:
        raise Exception(f"SQL Error: {res.stderr.decode('utf-8')}")
    output = res.stdout.decode("utf-8").strip()
    return output

def run_query_json(sql):
    output = run_query(sql)
    if not output:
        return []
    try:
        return json.loads(output)
    except:
        return []

def get_product_and_variants(handle):
    res = run_query_json(f"""
        SELECT json_agg(json_build_object('id', id, 'title', title, 'metadata', metadata))
        FROM product_variant 
        WHERE product_id = (SELECT id FROM product WHERE handle = '{handle}' AND deleted_at IS NULL LIMIT 1) 
        AND deleted_at IS NULL
    """)
    prod_id = run_query(f"SELECT id FROM product WHERE handle = '{handle}' AND deleted_at IS NULL LIMIT 1")
    if not prod_id: return None, []
    return prod_id, [(v['id'], v['title'], v['metadata']) for v in res]

def get_existing_images(variant_id):
    res = run_query_json(f"""
        SELECT json_agg(json_build_object('id', i.id, 'url', i.url, 'rank', i.rank) ORDER BY i.rank ASC)
        FROM image i
        JOIN product_variant_product_image pvpi ON pvpi.image_id = i.id
        WHERE pvpi.variant_id = '{variant_id}' AND i.deleted_at IS NULL
    """)
    if not res or res == [None]: return []
    return [(img['id'], img['url'], img['rank']) for img in res]

def update_db(product_id, variant_id, new_url, img_id=None, rank=0, is_new=False):
    if not is_new:
        run_query(f"UPDATE image SET url = '{new_url}', updated_at = NOW() WHERE id = '{img_id}'")
    else:
        img_id = "img_" + str(uuid.uuid4()).replace("-", "")[:28]
        run_query(f"INSERT INTO image (id, url, product_id, rank, created_at, updated_at) VALUES ('{img_id}', '{new_url}', '{product_id}', {rank}, NOW(), NOW())")
        run_query(f"INSERT INTO product_variant_product_image (variant_id, image_id, created_at, updated_at) VALUES ('{variant_id}', '{img_id}', NOW(), NOW())")

def update_metadata_and_thumbnail(product_id, variants):
    for v_id, v_title, v_meta in variants:
        imgs = get_existing_images(v_id)
        if not imgs: continue
        
        # Update variant metadata JSON
        if v_meta is None: v_meta = {}
        updated = False
        for i, img in enumerate(imgs):
            key = f"image_{i+1}"
            if v_meta.get(key) != img[1]:
                v_meta[key] = img[1]
                updated = True
                
        if updated:
            safe_json = json.dumps(v_meta).replace("'", "''")
            run_query(f"UPDATE product_variant SET metadata = '{safe_json}' WHERE id = '{v_id}'")
            print(f"  [+] Updated variant metadata for {v_title}")

    # Update product thumbnail to rank 0 image of the first variant
    if variants:
        first_v_id = variants[0][0]
        first_imgs = get_existing_images(first_v_id)
        if first_imgs:
            thumb = first_imgs[0][1]
            run_query(f"UPDATE product SET thumbnail = '{thumb}' WHERE id = '{product_id}'")
            print(f"  [+] Updated product thumbnail")

def copy_and_process(src_path, dst_url_path, product_id, variant_id, existing_imgs, index):
    # Copy file to public dirs
    for base in [PUBLIC_DIR, BACKEND_PUBLIC_DIR]:
        dst_path = os.path.join(base, dst_url_path.lstrip('/'))
        os.makedirs(os.path.dirname(dst_path), exist_ok=True)
        shutil.copy2(src_path, dst_path)
    
    # DB update
    if index < len(existing_imgs):
        update_db(product_id, variant_id, dst_url_path, img_id=existing_imgs[index][0], is_new=False)
        print(f"  [*] Replaced image {index+1} -> {dst_url_path}")
    else:
        new_rank = existing_imgs[-1][2] + index + 1 if existing_imgs else index
        update_db(product_id, variant_id, dst_url_path, rank=new_rank, is_new=True)
        print(f"  [+] Inserted new image {index+1} -> {dst_url_path}")

print("=== STARTING FULL ROLLOUT ===")

# 1. Process manually matched overrides
manual_matches = {
    'Foam Cleaner -Neutral': {'handle': 'pro-gold-foam-cleaner', 'variant_matches': ['Neutral', 'Default Variant'], 'files': {'u_2.webp': 'r_2.webp'}},
    '034A': {'handle': 'pro-gold-shoe-deo', 'variant_matches': ['150 ml', 'Default Variant'], 'files': {'u_1.webp': 'n_4.webp'}},
    'Leather Moisturize -Neutral': {'handle': 'pro-gold-care-leather-moisturizer', 'variant_matches': ['Neutral', 'Default Variant'], 'files': {'u_1.webp': 'r_3.webp', 'u_2.webp': 'r_4.webp'}},
    'Nubuck 2 in 1 Neutral': {'handle': 'pro-suede-2in1', 'variant_matches': ['Neutral', 'Default Variant'], 'files': {'u_1.webp': 'r_1.webp', 'u_2.webp': 'r_2.webp'}},
}

for folder_name, rule in manual_matches.items():
    print(f"\nProcessing Manual Override: {folder_name}")
    src_folder = os.path.join(UNMATCHED_DIR, folder_name)
    if not os.path.exists(src_folder):
        print(f"  [-] Folder missing: {src_folder}")
        continue
        
    p_id, variants = get_product_and_variants(rule['handle'])
    if not p_id:
        print(f"  [-] Product handle not found: {rule['handle']}")
        continue

    # Find the matching variant
    target_variants = [v for v in variants if v[1] in rule['variant_matches']]
    if not target_variants:
        print(f"  [-] Variant not found. Available: {[v[1] for v in variants]}")
        continue
        
    for v_id, v_title, _ in target_variants:
        existing_imgs = get_existing_images(v_id)
        
        for u_name, r_name in rule['files'].items():
            src_file = os.path.join(src_folder, u_name)
            if not os.path.exists(src_file):
                print(f"  [-] File missing: {src_file}")
                continue
                
            index = int(r_name.split('_')[1].split('.')[0]) - 1
            dst_url = f"/images/products/{rule['handle']}/{v_title.replace('/', '-')}/{r_name}"
            copy_and_process(src_file, dst_url, p_id, v_id, existing_imgs, index)
            
    update_metadata_and_thumbnail(p_id, variants)

# 2. Process Matched directory
for handle in os.listdir(MATCHED_DIR):
    handle_dir = os.path.join(MATCHED_DIR, handle)
    if not os.path.isdir(handle_dir): continue
    
    print(f"\nProcessing Product: {handle}")
    p_id, variants = get_product_and_variants(handle)
    if not p_id:
        print(f"  [-] Product handle not found: {handle}")
        continue
        
    for staged_variant in os.listdir(handle_dir):
        staged_v_dir = os.path.join(handle_dir, staged_variant)
        if not os.path.isdir(staged_v_dir): continue
        
        # The staged variant name is usually {v_title}_{orig_prefix} or similar from the fuzzy script
        # Let's extract the actual variant title by finding it in the DB variants
        target_variants = []
        is_color = any(c in staged_variant for c in ['Dark', 'Light', 'Black', 'Neutral', 'Brown', 'Pacific Blue'])
        
        if is_color:
            target_variants = [v for v in variants if v[1] in staged_variant]
        else:
            # If it's a size or default variant, we apply to ALL variants of this product 
            # (e.g. shoe trees sizes 39-40, 41-42 get the same image)
            target_variants = variants
            
        for v_id, v_title, _ in target_variants:
            existing_imgs = get_existing_images(v_id)
            
            for file_name in sorted(os.listdir(staged_v_dir)):
                if not file_name.endswith('.webp'): continue
                src_file = os.path.join(staged_v_dir, file_name)
                
                # e.g., r_1.webp -> index 0
                index = int(file_name.split('_')[1].split('.')[0]) - 1
                dst_url = f"/images/products/{handle}/{v_title.replace('/', '-')}/{file_name}"
                
                copy_and_process(src_file, dst_url, p_id, v_id, existing_imgs, index)
                
    update_metadata_and_thumbnail(p_id, variants)

print("\n=== FULL ROLLOUT COMPLETE ===")
