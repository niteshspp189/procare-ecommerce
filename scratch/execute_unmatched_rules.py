import os
import shutil
import json
import subprocess
import uuid

UNMATCHED_DIR = "/mnt/ExtraStorage/Project-Files/session-2026/procare/ecomm/latest/aug3-2026-webp-staging/unmatched"
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

def copy_file(src_path, dst_url_path):
    for base in [PUBLIC_DIR, BACKEND_PUBLIC_DIR]:
        dst_path = os.path.join(base, dst_url_path.lstrip('/'))
        os.makedirs(os.path.dirname(dst_path), exist_ok=True)
        shutil.copy2(src_path, dst_path)

def update_metadata_and_thumbnail(product_id, variants, thumb_variant_id=None):
    for v_id, v_title, v_meta in variants:
        imgs = get_existing_images(v_id)
        if not imgs: continue
        
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

    if variants:
        v_id_for_thumb = thumb_variant_id or variants[0][0]
        first_imgs = get_existing_images(v_id_for_thumb)
        if first_imgs:
            thumb = first_imgs[0][1]
            run_query(f"UPDATE product SET thumbnail = '{thumb}' WHERE id = '{product_id}'")
            print(f"  [+] Updated product thumbnail")

print("=== STARTING UNMATCHED RULES ROLLOUT ===")

# The 17 rules from the user
rules = [
    # 4. Nubuck 2 in 1 Neutral (Fixing previous incorrect r_1, r_2 mapping to r_2, r_3)
    {
        'folder': 'Nubuck 2 in 1 Neutral',
        'handle': 'pro-suede-2in1',
        'type': 'replace',
        'map': {'u_1.webp': 2, 'u_2.webp': 3} # 2nd and 3rd place (index 1 and 2)
    },
    # 5. Power Sneaker Cleaner -Neutral
    {
        'folder': 'Power Sneaker Cleaner -Neutral',
        'handle': 'pro-gold-clean-power-cleaning-shampoo',
        'type': 'insert_top',
        'map': {'u_1.webp': 1, 'u_2.webp': 2}
    },
    # 6. PRO Clean Easy Care Combo Pack
    {
        'folder': 'PRO Clean Easy Care Combo Pack',
        'handle': 'pro-clean-easy-care-combo-pack-neutral',
        'type': 'replace',
        'map': {'u_2.webp': 1, 'u_3.webp': 2, 'u_1.webp': 3}
    },
    # 7. PRO Essentials Magic Pedi
    {
        'folder': 'PRO Essentials Magic Pedi',
        'handle': 'pro-essentials-magic-pedi-roller',
        'type': 'replace',
        'map': {'u_2.webp': 1, 'u_3.webp': 2, 'u_1.webp': 3}
    },
    # 8. PRO GOLD Clean Power Cleaner(Cleaning Shampoo & Mini Brush) -Neutral
    {
        'folder': 'PRO GOLD Clean Power Cleaner(Cleaning Shampoo & Mini Brush) -Neutral',
        'handle': 'pro-gold-sneaker-cleaning-kit-shampoo-mini-brush',
        'type': 'replace',
        'map': {'u_2.webp': 1, 'u_1.webp': 2}
    },
    # 9. PRO GOLD Clean Sneaker Wipes-Pack of 30 -Neutral
    {
        'folder': 'PRO GOLD Clean Sneaker Wipes-Pack of 30 -Neutral',
        'handle': 'pro-gold-sneaker-wipes-pack-of-30',
        'type': 'replace',
        'map': {'u_1.webp': 3, 'u_2.webp': 4}
    },
    # 10. PRO Insole Ease Heel Liner
    {
        'folder': 'PRO Insole Ease Heel Liner',
        'handle': 'pro-insole-ease-heel-liner',
        'type': 'replace_and_delete',
        'map': {'u_1.webp': 1, 'u_2.webp': 2, 'u_3.webp': 3},
        'delete_after': 3
    },
    # 11. PRO Insoles Ease Memory Foam
    {
        'folder': 'PRO Insoles Ease Memory Foam',
        'handle': 'pro-insoles-ease-memory-foam',
        'type': 'replace_all_variants',
        'map': {'u_1.webp': 1, 'u_2.webp': 2, 'u_3.webp': 3, 'u_4.webp': 4}
    },
    # 12. PRO Insoles Ease Soft Comfort
    {
        'folder': 'PRO Insoles Ease Soft Comfort',
        'handle': 'pro-insoles-ease-soft',
        'type': 'replace',
        'map': {'u_1.webp': 1, 'u_2.webp': 2, 'u_3.webp': 3}
    },
    # 13. PRO Insoles Gel Comfort Air walk
    {
        'folder': 'PRO Insoles Gel Comfort Air walk',
        'handle': 'pro-comfort-air-walk-gel-insoles',
        'type': 'replace_all_variants',
        'map': {'u_1.webp': 1, 'u_2.webp': 2, 'u_3.webp': 3}
    },
    # 14. PRO Insoles Gel Comfort Foot Bed
    {
        'folder': 'PRO Insoles Gel Comfort Foot Bed',
        'handle': 'pro-comfort-gel-insoles',
        'type': 'replace_all_variants',
        'map': {'u_1.webp': 1, 'u_2.webp': 2, 'u_3.webp': 3}
    },
    # 15 & 16. Sneaker Wipes Kit Pack of 30
    {
        'folder': 'Sneaker Wipes Kit Pack of',
        'handle': 'pro-gold-sneaker-wipes-pack-of-30-kit',
        'type': 'replace',
        'map': {'u_1.webp': 1}
    },
    {
        'folder': 'Sneaker Wipes Kit Pack of 30',
        'handle': 'pro-gold-sneaker-wipes-pack-of-30-kit',
        'type': 'replace',
        'map': {'u_1.webp': 2, 'u_2.webp': 3}
    },
    # 17. Suede N Nubuck Spray 180 ml-Neutral
    {
        'folder': 'Suede N Nubuck Spray 180 ml-Neutral',
        'handle': 'pro-suede-and-nubuck-renovator-spray',
        'type': 'replace_all_variants',
        'map': {'u_1.webp': 1, 'u_2.webp': 2}
    }
]

for rule in rules:
    print(f"\nProcessing Rule: {rule['folder']} -> {rule['handle']}")
    src_folder = os.path.join(UNMATCHED_DIR, rule['folder'])
    if not os.path.exists(src_folder):
        print(f"  [-] Folder missing: {src_folder}")
        continue
        
    p_id, variants = get_product_and_variants(rule['handle'])
    if not p_id:
        print(f"  [-] Product handle not found: {rule['handle']}")
        continue

    # Determine which variants to process
    if rule['type'] in ['replace_all_variants']:
        target_variants = variants
    else:
        # Just default to first variant or default variant
        target_variants = [v for v in variants if v[1] in ['Default Variant', 'Neutral', '150 ml']]
        if not target_variants:
            target_variants = [variants[0]]

    for v_id, v_title, _ in target_variants:
        existing_imgs = get_existing_images(v_id)
        
        if rule['type'] == 'insert_top':
            # We need to shift existing images down by the number of insertions
            num_insert = len(rule['map'])
            for i in range(len(existing_imgs)-1, -1, -1):
                img_id, url, rank = existing_imgs[i]
                new_rank = rank + num_insert
                run_query(f"UPDATE image SET rank = {new_rank} WHERE id = '{img_id}'")
            
            # Now insert the new ones
            for u_name, target_pos in rule['map'].items():
                src_file = os.path.join(src_folder, u_name)
                if not os.path.exists(src_file): continue
                dst_url = f"/images/products/{rule['handle']}/{v_title.replace('/', '-')}/n_{target_pos}.webp"
                copy_file(src_file, dst_url)
                update_db(p_id, v_id, dst_url, rank=target_pos-1, is_new=True)
                print(f"  [+] Inserted {u_name} at pos {target_pos}")
                
        elif rule['type'] in ['replace', 'replace_and_delete', 'replace_all_variants']:
            for u_name, target_pos in rule['map'].items():
                src_file = os.path.join(src_folder, u_name)
                if not os.path.exists(src_file): continue
                
                dst_url = f"/images/products/{rule['handle']}/{v_title.replace('/', '-')}/r_{target_pos}.webp"
                copy_file(src_file, dst_url)
                
                index = target_pos - 1
                if index < len(existing_imgs):
                    update_db(p_id, v_id, dst_url, img_id=existing_imgs[index][0], is_new=False)
                    print(f"  [*] Replaced pos {target_pos} with {u_name}")
                else:
                    new_rank = existing_imgs[-1][2] + 1 if existing_imgs else index
                    update_db(p_id, v_id, dst_url, rank=new_rank, is_new=True)
                    print(f"  [+] Inserted new pos {target_pos} with {u_name}")
            
            if rule['type'] == 'replace_and_delete':
                delete_after = rule['delete_after']
                if len(existing_imgs) > delete_after:
                    for i in range(delete_after, len(existing_imgs)):
                        img_id = existing_imgs[i][0]
                        # Remove from DB
                        run_query(f"DELETE FROM product_variant_product_image WHERE image_id = '{img_id}'")
                        run_query(f"UPDATE image SET deleted_at = NOW() WHERE id = '{img_id}'")
                        print(f"  [-] Deleted extra image {i+1}")

    update_metadata_and_thumbnail(p_id, variants)

print("\n=== UNMATCHED RULES ROLLOUT COMPLETE ===")
