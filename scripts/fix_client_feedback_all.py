import os
import re
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

def clean_text_spacing(text):
    if not text:
        return text
    # Add space after colons if missing (e.g. Step 2:Spray -> Step 2: Spray)
    text = re.sub(r'(\w+):([A-Za-z])', r'\1: \2', text)
    # Fix concatenated camel/title case words (e.g. FreshnessKeeps -> Freshness Keeps)
    text = re.sub(r'([a-z])([A-Z])', r'\1 \2', text)
    # Fix 100+ Applications if jammed
    text = re.sub(r'100\+\s*Applications', '100+ Applications', text)
    return text.strip()

def fix_all_products(is_remote=False):
    target = "Production RDS" if is_remote else "Local DB"
    print(f"==================================================")
    print(f" Starting Comprehensive Fix for {target}")
    print(f"==================================================")

    # 1. Clean titles with unwanted strings ('Designed for professional results', '39.0', 'size 39-40')
    title_cleanups = [
        ("Pro Insoles Active Cycling%", "Pro Insoles Active Cycling"),
        ("Pro Insoles Active Cricket%", "Pro Insoles Active Cricket"),
        ("Pro Insoles Active Running%", "Pro Insoles Active Running"),
        ("Pro Insoles Memory Foam%", "Pro Insoles Memory Foam"),
        ("Pro Shoe Tree With Spiral%", "Pro Shoe Tree With Spiral"),
    ]

    for pattern, new_title in title_cleanups:
        sql = f"UPDATE product SET title = '{new_title}' WHERE title LIKE '{pattern}' AND deleted_at IS NULL;"
        run_sql(sql, is_remote=is_remote)
        print(f"  ✅ Standardized title: {new_title}")

    # 2. Get all products
    sql = "SELECT id, title, handle, description, metadata FROM product WHERE deleted_at IS NULL;"
    raw = run_sql(sql, is_remote=is_remote)
    
    for line in raw.split("\n"):
        if not line.strip():
            continue
        parts = line.split("|")
        pid = parts[0]
        title = parts[1]
        handle = parts[2]
        desc = parts[3] if len(parts) > 3 else ""
        meta_str = parts[4] if len(parts) > 4 else "{}"
        try:
            meta = json.loads(meta_str) if meta_str else {}
        except:
            meta = {}

        updated = False

        # --- Common Issue Cleanups ---
        # Remove 'Designed for professional results' from description
        if "designed for professional results" in desc.lower():
            desc = re.sub(r'(?i)designed for professional results\.?\s*', '', desc).strip()
            updated = True

        # Clean spaces in description, how_to_use, key_benefits
        cleaned_desc = clean_text_spacing(desc)
        if cleaned_desc != desc:
            desc = cleaned_desc
            updated = True

        if meta.get("how_to_use"):
            cleaned_hu = clean_text_spacing(meta["how_to_use"])
            if cleaned_hu != meta["how_to_use"]:
                meta["how_to_use"] = cleaned_hu
                updated = True

        if meta.get("key_benefits"):
            cleaned_kb = clean_text_spacing(meta["key_benefits"])
            if cleaned_kb != meta["key_benefits"]:
                meta["key_benefits"] = cleaned_kb
                updated = True

        specs = meta.get("product_specifications") or {}

        # --- Product-Specific Pointers ---

        # Point 1: Self Shine (75ml & 1X Self Shine)
        if "self shine" in title.lower() and "foam" not in title.lower():
            if not isinstance(specs, dict): specs = {}
            specs["Net Volume"] = "75 ml"
            specs["Product Includes"] = "1 × Self Shine Bottle with Sponge Applicator"
            meta["product_specifications"] = specs
            updated = True

        # Point 2: Instant Shoe Shine (100+ Applications)
        if "instant shine" in title.lower():
            if "100+" not in desc:
                desc = "100+ Applications. Delivers immediate glossy finish in seconds with extended shine. Easy built-in sponge applicator for smooth, quick, and mess-free application."
                updated = True
            if not isinstance(specs, dict): specs = {}
            specs["Net Volume"] = "1pc (100+ Applications)"
            specs["Product Includes"] = "1 × Quick Shine Sponge"
            meta["product_specifications"] = specs
            updated = True

        # Point 3 & 4 & 5: Sneaker Cleaning Kit, Foam Cleaner, Shoe Deo
        if "sneaker cleaning kit" in title.lower():
            if not isinstance(specs, dict): specs = {}
            specs["Net Volume"] = "150 ml"
            specs["Product Includes"] = "1 × Cleaning Shampoo, 1 × Mini Wooden Brush"
            meta["product_specifications"] = specs
            updated = True

        if "foam cleaner" in title.lower():
            if not isinstance(specs, dict): specs = {}
            specs["Net Volume"] = "150 ml"
            specs["Product Includes"] = "1 × Foam Cleaner Bottle"
            meta["product_specifications"] = specs
            updated = True

        if "shoe deo" in title.lower():
            if not isinstance(specs, dict): specs = {}
            specs["Net Volume"] = "150 ml"
            specs["Product Includes"] = "1 × Shoe Deo Spray"
            meta["product_specifications"] = specs
            updated = True

        # Point 28 & 29: Shoe Trees (Insert "100%" genuine wood/materials)
        if "shoe tree" in title.lower():
            if "100%" not in desc:
                desc = "Made from 100% genuine premium wood, designed to maintain shoe shape and absorb moisture."
                updated = True

        if updated:
            json_meta = json.dumps(meta).replace("'", "''")
            clean_desc_sql = desc.replace("'", "''")
            update_sql = f"UPDATE product SET description = '{clean_desc_sql}', metadata = '{json_meta}'::jsonb WHERE id = '{pid}';"
            run_sql(update_sql, is_remote=is_remote)
            print(f"  ✅ Updated product: {title}")

    print(f"Finished updating {target}.\n")

if __name__ == "__main__":
    is_remote = "--remote" in sys.argv
    fix_all_products(is_remote=False)
    if is_remote:
        fix_all_products(is_remote=True)
