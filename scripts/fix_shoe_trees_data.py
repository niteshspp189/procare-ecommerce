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

def fix_shoe_trees(is_remote=False):
    target = "Production RDS DB" if is_remote else "Local Docker DB"
    print(f"==================================================")
    print(f" Fixing Shoe Trees Data & Images for {target}")
    print(f"==================================================")

    # 1. Pro Shoe Tree With Spiral
    sql_spiral = "SELECT id, metadata FROM product WHERE handle = 'pro-accessories-men-shoe-tree-with-spiral' AND deleted_at IS NULL;"
    raw_spiral = run_sql(sql_spiral, is_remote=is_remote)
    if raw_spiral:
        pid, meta_str = raw_spiral.split("\n")[0].split("|")[0], raw_spiral.split("\n")[0].split("|")[1] if "|" in raw_spiral else "{}"
        try: meta = json.loads(meta_str) if meta_str else {}
        except: meta = {}
        
        meta["key_benefits"] = (
            "**100% Genuine Natural Wood**: Crafted from high-grade natural wood to absorb moisture and odor.\n"
            "**Prevents Creases & Cracks**: Maintains original leather shape and prevents toe cap wrinkling.\n"
            "**Flexible Spiral Spring**: Fits smoothly into a wide variety of footwear styles."
        )
        meta["how_to_use"] = (
            "Step 1: Insert Toe Block\nSlide front wooden block deep into toe of shoe.\n"
            "Step 2: Compress Spiral\nFlex spring stem and place rear heel ball against back counter."
        )
        meta["product_specifications"] = {
            "Product Type": "Spiral Spring Shoe Tree",
            "Material": "100% Natural Wood & Steel Spring",
            "Suitable For": "Leather Shoes, Boots, Sneakers",
            "Net Content": "1 Pair"
        }
        
        desc = "Made from 100% genuine natural wood with durable spiral spring mechanism to preserve shoe shape, prevent leather creases, and absorb interior moisture."
        title = "Pro Shoe Tree With Spiral"
        
        json_meta_sql = json.dumps(meta).replace("'", "''")
        run_sql(f"UPDATE product SET title = '{title}', description = '{desc.replace('\'', '\'\'')}', metadata = '{json_meta_sql}'::jsonb WHERE id = '{pid}';", is_remote=is_remote)
        
        # Clean variants metadata images for spiral
        v_sql = f"SELECT id, title FROM product_variant WHERE product_id = '{pid}' AND deleted_at IS NULL;"
        v_raw = run_sql(v_sql, is_remote=is_remote)
        for vline in v_raw.split("\n"):
            if not vline.strip(): continue
            vid, vtitle = vline.split("|")[0], vline.split("|")[1]
            folder_name = vtitle.replace("/", "_")
            v_meta = {
                "gst": "0.18",
                "mrp": "899.0",
                "sellingPrice": "699.0",
                "size": vtitle,
                "image_1": f"/images/products/pro-accessories-men-shoe-tree-with-spiral/{folder_name}/shoe-tree-with-spiral-1.webp",
                "image_2": f"/images/products/pro-accessories-men-shoe-tree-with-spiral/{folder_name}/shoe-tree-with-spiral-2.webp",
                "image_3": f"/images/products/pro-accessories-men-shoe-tree-with-spiral/{folder_name}/3.webp"
            }
            v_json_sql = json.dumps(v_meta).replace("'", "''")
            run_sql(f"UPDATE product_variant SET metadata = '{v_json_sql}'::jsonb WHERE id = '{vid}';", is_remote=is_remote)

        print(f"  ✅ Fixed Pro Shoe Tree With Spiral in {target}")

    # 2. Pro Premium Shoe Tree
    sql_premium = "SELECT id, metadata FROM product WHERE handle = 'pro-premium-shoe-tree' AND deleted_at IS NULL;"
    raw_premium = run_sql(sql_premium, is_remote=is_remote)
    if raw_premium:
        pid, meta_str = raw_premium.split("\n")[0].split("|")[0], raw_premium.split("\n")[0].split("|")[1] if "|" in raw_premium else "{}"
        try: meta = json.loads(meta_str) if meta_str else {}
        except: meta = {}
        
        meta["key_benefits"] = (
            "**100% Genuine Premium Wood**: Premium solid wood absorbs sweat, moisture, and keeps shoes fresh.\n"
            "**Full Heel Contour**: Preserves entire shoe structure from heel to toe cap.\n"
            "**Dual Brass Tube Spring**: Provides sturdy longitudinal expansion for wrinkle-free leather."
        )
        meta["how_to_use"] = (
            "Step 1: Insert Front Section\nPush front section into toe box.\n"
            "Step 2: Lock Heel Section\nPress down heel piece firmly into heel counter."
        )
        meta["product_specifications"] = {
            "Product Type": "Premium Cedar Shoe Tree",
            "Material": "100% Premium Wood & Brass Hardware",
            "Suitable For": "Dress Shoes, Oxfords, Boots",
            "Net Content": "1 Pair"
        }
        
        desc = "Made from 100% genuine premium cedar wood with full heel & brass hardware to preserve shape, extend leather life, and absorb moisture."
        title = "Pro Premium Shoe Tree"
        
        json_meta_sql = json.dumps(meta).replace("'", "''")
        run_sql(f"UPDATE product SET title = '{title}', description = '{desc.replace('\'', '\'\'')}', metadata = '{json_meta_sql}'::jsonb WHERE id = '{pid}';", is_remote=is_remote)
        
        # Clean variants metadata images for premium
        v_sql = f"SELECT id, title FROM product_variant WHERE product_id = '{pid}' AND deleted_at IS NULL;"
        v_raw = run_sql(v_sql, is_remote=is_remote)
        for vline in v_raw.split("\n"):
            if not vline.strip(): continue
            vid, vtitle = vline.split("|")[0], vline.split("|")[1]
            folder_name = vtitle.replace("/", "_")
            v_meta = {
                "gst": "0.18",
                "mrp": "3999.0",
                "sellingPrice": "3199.0",
                "size": vtitle,
                "image_1": f"/images/products/pro-premium-shoe-tree/{folder_name}/premium-shoe-tree-1.webp",
                "image_2": f"/images/products/pro-premium-shoe-tree/{folder_name}/premium-shoe-tree-2.webp",
                "image_3": f"/images/products/pro-premium-shoe-tree/{folder_name}/3.webp",
                "image_4": f"/images/products/pro-premium-shoe-tree/{folder_name}/4.webp"
            }
            v_json_sql = json.dumps(v_meta).replace("'", "''")
            run_sql(f"UPDATE product_variant SET metadata = '{v_json_sql}'::jsonb WHERE id = '{vid}';", is_remote=is_remote)

        print(f"  ✅ Fixed Pro Premium Shoe Tree in {target}")

if __name__ == "__main__":
    is_remote = "--remote" in sys.argv
    fix_shoe_trees(is_remote=False)
    if is_remote:
        fix_shoe_trees(is_remote=True)
