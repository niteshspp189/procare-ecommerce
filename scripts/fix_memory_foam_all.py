import os
import json
import subprocess
import sys

LOCAL_CMD = ["docker", "exec", "-i", "procare_postgres", "psql", "-U", "procare_ecommerce", "-d", "procare_ecommerce", "-t", "-A"]
REMOTE_DB_URL = "postgres://propremiumcare:Mvsc2026##56@database-1.c5wkcis2qg1p.ap-south-1.rds.amazonaws.com:5432/prepreimiumcare_ecommerce"
REMOTE_CMD = ["ssh", "procare", f'docker exec -i procare_postgres psql "{REMOTE_DB_URL}" -t -A']

def run_sql(sql, is_remote=False):
    cmd = REMOTE_CMD if is_remote else LOCAL_CMD
    res = subprocess.run(cmd, input=sql, text=True, check=True, capture_output=True)
    return res.stdout.strip()

def fix_memory_foam(is_remote=False):
    target = "Production RDS DB" if is_remote else "Local Docker DB"
    print(f"==================================================")
    print(f" Fixing Memory Foam Insole & Variant Images for {target}")
    print(f"==================================================")

    # 1. Product metadata update
    sql_prod = "SELECT id FROM product WHERE handle ILIKE '%memory-foam%' AND deleted_at IS NULL;"
    raw_prod = run_sql(sql_prod, is_remote=is_remote)
    if not raw_prod:
        print("  ⚠️ Memory Foam product not found")
        return

    pid = raw_prod.split("\n")[0].strip()

    title = "Pro Insoles Memory Foam"
    desc = "Ultra-soft memory foam insoles that contour to the natural shape of your foot for all-day custom comfort."
    
    key_benefits = (
        "**All-Day Comfort**: Soft memory foam cushioning provides superior comfort for daily wear.\n"
        "**Versatile Use**: Perfect for both formal and casual shoes; suitable for unisex use.\n"
        "**Pressure Relief Support**: Reduces pressure on the ball of the foot for enhanced walking comfort.\n"
        "**Fatigue Reduction**: Innovative design helps minimize energy loss and keeps feet feeling light.\n"
        "**Breathable & Comfortable**: Enhances overall foot comfort during long hours of standing or walking."
    )

    how_to_use = (
        "Step 1: Insert the PRO Memory Foam Insoles into your shoes with the fabric side facing up.\n"
        "Step 2: Ensure the insole fits flat and properly inside the shoe.\n"
        "Step 3: Use daily for enhanced comfort and pressure relief."
    )

    specs = {
        "Product Type": "Memory Foam Comfort Insole",
        "Material": "High-Quality Memory Foam",
        "Design": "Unisex, cushioned comfort insole",
        "Net Content": "1 Pair",
        "Suitable For": "Formal shoes, casual shoes, and sneakers",
        "Function": "Comfort, pressure relief, and fatigue reduction",
        "Size Range": "Size 39-44"
    }

    meta = {
        "key_benefits": key_benefits,
        "how_to_use": how_to_use,
        "product_specifications": specs,
        "suitable_for": "Formal shoes, casual shoes, and sneakers"
    }

    json_meta_sql = json.dumps(meta).replace("'", "''")
    run_sql(f"UPDATE product SET title = '{title}', description = '{desc.replace('\'', '\'\'')}', metadata = '{json_meta_sql}'::jsonb WHERE id = '{pid}';", is_remote=is_remote)

    # 2. Variants image mapping
    v_sql = f"SELECT id, title FROM product_variant WHERE product_id = '{pid}' AND deleted_at IS NULL;"
    v_raw = run_sql(v_sql, is_remote=is_remote)
    
    for vline in v_raw.split("\n"):
        if not vline.strip(): continue
        vid, vtitle = vline.split("|")[0], vline.split("|")[1].strip()

        # Image sets per variant size
        if "39" in vtitle:
            imgs = [
                "/images/products/pro-insoles-ease-memory-foam/Size 39/1.jpg",
                "/images/products/pro-insoles-ease-memory-foam/Size 40/2.jpg",
                "/images/products/pro-insoles-ease-memory-foam/Size 40/3.jpg",
                "/images/products/pro-insoles-ease-memory-foam/Size 40/4.jpg"
            ]
        elif "44" in vtitle:
            imgs = [
                "/images/products/pro-insoles-ease-memory-foam/Size 44/1.jpg",
                "/images/products/pro-insoles-ease-memory-foam/Size 44/2.jpg",
                "/images/products/pro-insoles-ease-memory-foam/Size 44/3.jpg",
                "/images/products/pro-insoles-ease-memory-foam/Size 44/4.jpg"
            ]
        else: # 40, 41, 42, 43
            imgs = [
                "/images/products/pro-insoles-ease-memory-foam/Size 40/1.jpg",
                "/images/products/pro-insoles-ease-memory-foam/Size 40/2.jpg",
                "/images/products/pro-insoles-ease-memory-foam/Size 40/3.jpg",
                "/images/products/pro-insoles-ease-memory-foam/Size 40/4.jpg"
            ]

        v_meta = {
            "gst": "0.18",
            "mrp": "699.0",
            "sellingPrice": "692.0",
            "size": vtitle,
            "image_1": imgs[0],
            "image_2": imgs[1],
            "image_3": imgs[2],
            "image_4": imgs[3]
        }

        v_json_sql = json.dumps(v_meta).replace("'", "''")
        run_sql(f"UPDATE product_variant SET metadata = '{v_json_sql}'::jsonb WHERE id = '{vid}';", is_remote=is_remote)
        print(f"  🎨 Set 4 images for variant {vtitle} (ID: {vid})")

    print(f"  ✅ Fixed Pro Insoles Memory Foam in {target}\n")

if __name__ == "__main__":
    is_remote = "--remote" in sys.argv
    fix_memory_foam(is_remote=False)
    if is_remote:
        fix_memory_foam(is_remote=True)
