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

def fix_color_variant_images(is_remote=False):
    target = "Production RDS DB" if is_remote else "Local Docker DB"
    print(f"==================================================")
    print(f" Fixing Color Variant Images for {target}")
    print(f"==================================================")

    # 1. Fix Pro Application Brush explicitly
    sql_brush = "SELECT id FROM product WHERE handle = 'pro-application-brush' AND deleted_at IS NULL;"
    pid_brush = run_sql(sql_brush, is_remote=is_remote)
    if pid_brush:
        v_sql = f"SELECT id, title FROM product_variant WHERE product_id = '{pid_brush}' AND deleted_at IS NULL;"
        v_raw = run_sql(v_sql, is_remote=is_remote)
        for vline in v_raw.split("\n"):
            if not vline.strip(): continue
            vid, vtitle = vline.split("|")[0], vline.split("|")[1].strip()
            
            if vtitle.lower() == "dark":
                v_meta = {
                    "gst": "0.18",
                    "mrp": "199.0",
                    "sellingPrice": "195.0",
                    "size": "",
                    "image_1": "/images/products/pro-application-brush/Dark/Application Brush Dark (1).webp",
                    "image_2": "/images/products/pro-application-brush/Dark/Application Brush Dark (2).webp"
                }
            elif vtitle.lower() == "light":
                v_meta = {
                    "gst": "0.18",
                    "mrp": "199.0",
                    "sellingPrice": "195.0",
                    "size": "",
                    "image_1": "/images/products/pro-application-brush/Light/Application Brush Light (1).webp",
                    "image_2": "/images/products/pro-application-brush/Light/Application Brush Light (2).webp"
                }
            else:
                continue

            v_json_sql = json.dumps(v_meta).replace("'", "''")
            run_sql(f"UPDATE product_variant SET metadata = '{v_json_sql}'::jsonb WHERE id = '{vid}';", is_remote=is_remote)
            print(f"  🎨 Fixed variant \"{vtitle}\" for Pro Application Brush (ID: {vid}) -> 2 unique images")

    # 2. General audit across all variants to ensure no variant has image URLs from a different color folder
    v_all_sql = "SELECT v.id, v.title, p.title as ptitle, p.handle, v.metadata FROM product_variant v JOIN product p ON p.id = v.product_id WHERE v.deleted_at IS NULL AND p.deleted_at IS NULL;"
    v_all_raw = run_sql(v_all_sql, is_remote=is_remote)
    
    cleaned_count = 0
    for line in v_all_raw.split("\n"):
        if not line.strip(): continue
        parts = line.split("|")
        vid, vtitle, ptitle, phandle = parts[0], parts[1], parts[2], parts[3]
        meta_str = parts[4] if len(parts) > 4 else "{}"

        try: meta = json.loads(meta_str) if meta_str else {}
        except: meta = {}
        if not meta: continue

        image_keys = sorted([k for k in meta.keys() if k.startswith("image_")])
        if not image_keys: continue

        vtitle_clean = vtitle.lower().replace(" ", "").replace("_", "").replace("-", "")
        
        # Check if any image URL points to a folder of ANOTHER color variant
        filtered_urls = []
        has_cross_color = False

        for k in image_keys:
            url = meta[k]
            if not url: continue
            
            # Check path segments
            url_lower = url.lower()
            # If product has multiple color variants, check if URL path contains mismatched color name
            if "/dark/" in url_lower and "light" in vtitle_clean:
                has_cross_color = True
                print(f"  🚨 Removing Dark image from Light variant: {url}")
            elif "/light/" in url_lower and "dark" in vtitle_clean:
                has_cross_color = True
                print(f"  🚨 Removing Light image from Dark variant: {url}")
            else:
                filtered_urls.append(url)

        if has_cross_color:
            # Re-index image_1, image_2...
            for k in image_keys:
                del meta[k]
            for idx, url in enumerate(filtered_urls, 1):
                meta[f"image_{idx}"] = url

            json_meta_sql = json.dumps(meta).replace("'", "''")
            run_sql(f"UPDATE product_variant SET metadata = '{json_meta_sql}'::jsonb WHERE id = '{vid}';", is_remote=is_remote)
            cleaned_count += 1

    print(f"  ✅ Finished color variant audit in {target}.\n")

if __name__ == "__main__":
    is_remote = "--remote" in sys.argv
    fix_color_variant_images(is_remote=False)
    if is_remote:
        fix_color_variant_images(is_remote=True)
