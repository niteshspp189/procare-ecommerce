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

def fix_pacific_blue(is_remote=False):
    target = "Production RDS DB" if is_remote else "Local Docker DB"
    print(f"==================================================")
    print(f" Cleaning & Standardizing Pacific Blue for {target}")
    print(f"==================================================")

    sql = "SELECT id, title, metadata FROM product WHERE handle = 'pro-insoles-ease-pacific-blue' AND deleted_at IS NULL;"
    raw = run_sql(sql, is_remote=is_remote)
    if not raw:
        print("  ⚠️ Product not found in DB")
        return

    parts = raw.split("\n")[0].split("|")
    pid = parts[0]
    
    clean_desc = "Memory foam comfort insole engineered for all-day arch support, shock absorption, and daily walking comfort."
    
    clean_benefits = (
        "**All-Day Comfort Cushioning**: High-density memory foam adapts to your foot shape for customized support.\n"
        "**Shock Absorption**: Reduces impact on heels, ankles, and knees during walking or standing.\n"
        "**Arch & Heel Alignment**: Keeps your feet comfortably aligned inside formal and casual footwear.\n"
        "**Breathable & Anti-Slip**: Soft top cover keeps feet dry and prevents foot movement inside shoes."
    )
    
    clean_how_to_use = (
        "Step 1: Insert the PRO Insoles Ease Pacific Blue into your shoes with the fabric side facing up.\n"
        "Step 2: Ensure the insole lies flat and fits comfortably inside your shoe.\n"
        "Step 3: Use daily for enhanced comfort, shock absorption, and pressure relief."
    )
    
    clean_specs = {
        "Product Type": "Memory Foam Comfort Insole",
        "Color": "Pacific Blue",
        "Material": "Memory Foam with Fabric Top Layer",
        "Suitable For": "Formal shoes, casual shoes, and sneakers",
        "Function": "Comfort, Arch Support, and Shock Absorption",
        "Washable": "Yes",
        "Reusable": "Yes"
    }

    try:
        meta = json.loads(parts[2]) if len(parts) > 2 and parts[2] else {}
    except:
        meta = {}

    meta["key_benefits"] = clean_benefits
    meta["how_to_use"] = clean_how_to_use
    meta["product_specifications"] = clean_specs
    meta["suitable_for"] = "Formal shoes, casual shoes, and sneakers"

    json_meta_sql = json.dumps(meta).replace("'", "''")
    clean_desc_sql = clean_desc.replace("'", "''")

    update_sql = f"UPDATE product SET description = '{clean_desc_sql}', metadata = '{json_meta_sql}'::jsonb WHERE id = '{pid}';"
    run_sql(update_sql, is_remote=is_remote)
    print(f"  ✅ Cleaned Pro Insoles Ease Pacific Blue in {target}")

if __name__ == "__main__":
    is_remote = "--remote" in sys.argv
    fix_pacific_blue(is_remote=False)
    if is_remote:
        fix_pacific_blue(is_remote=True)
