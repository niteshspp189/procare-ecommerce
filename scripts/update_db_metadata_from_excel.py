import os
import json
import pandas as pd
import subprocess
import sys

EXCEL_PATH = "/home/niteshsp189/Downloads/procare_all_variants (3).xlsx"
REMOTE_DB_URL = "postgres://propremiumcare:Mvsc2026##56@database-1.c5wkcis2qg1p.ap-south-1.rds.amazonaws.com:5432/prepreimiumcare_ecommerce"

icon_map = {
    "pro clean": "eco",
    "pro fresh": "leaf",
    "pro care": "thumb",
    "european expertise": "award",
    "free shipping": "free-shipping",
    "30 day return": "30-day-return",
    "eco friendly": "eco-friendly",
    "complete kit": "complete-kit",
    "cleaning": "thumb",
    "effective clean": "leaf",
    "pro ease": "eco",
    "comfort": "leaf",
    "skin friendly": "natural",
    "made in europe": "award",
    "gel comfort": "star",
    "cushioning": "thumb",
    "hand washable": "eco",
    "essentials": "eco",
    "callus & dead skin remover": "natural",
    "replaceable roller": "leaf",
    "pack of 2 roller": "award",
    "pro accessories": "eco",
    "high quality bristles": "natural",
    "beech wood handle": "leaf",
    "pro shine": "eco",
    "color refreshing": "leaf",
    "shine": "thumb",
    "brush and pumice combo": "natural",
    "removes callus and dead skin": "eco",
    "high grade steel": "natural",
    "for coarse & fine filing": "natural",
    "high density sponge": "natural",
    "effective cleaning agent": "leaf",
    "high quality wood": "leaf",
    "protects colors": "thumb",
    "water repellent": "water",
    "dirt repellent": "leaf",
    "shine boost": "star",
    "travel friendly": "plane",
}

def get_icon_id(label):
    lbl_clean = label.strip().lower()
    if lbl_clean in icon_map:
        return icon_map[lbl_clean]
    
    # Fallback checks
    if "clean" in lbl_clean or "eco" in lbl_clean:
        return "eco"
    if "fresh" in lbl_clean or "odor" in lbl_clean or "fragrance" in lbl_clean:
        return "leaf"
    if "care" in lbl_clean or "protect" in lbl_clean or "comfort" in lbl_clean or "cushion" in lbl_clean:
        return "thumb"
    if "europe" in lbl_clean or "expertise" in lbl_clean or "standard" in lbl_clean or "premium" in lbl_clean:
        return "award"
    if "shipping" in lbl_clean:
        return "free-shipping"
    if "return" in lbl_clean:
        return "30-day-return"
    if "friendly" in lbl_clean:
        return "eco-friendly"
    if "kit" in lbl_clean or "combo" in lbl_clean:
        return "complete-kit"
    if "travel" in lbl_clean:
        return "plane"
    
    return "eco"

def parse_badges(badges_str):
    if not isinstance(badges_str, str) or not badges_str.strip():
        return None
    badges_list = []
    # Split by comma
    parts = badges_str.split(",")
    for p in parts:
        label = p.strip()
        if label:
            badges_list.append({
                "label": label,
                "iconId": get_icon_id(label)
            })
    return badges_list if badges_list else None

def parse_specifications(spec_str):
    if not isinstance(spec_str, str) or not spec_str.strip():
        return None
    specs = {}
    parts = spec_str.split(",")
    current_key = None
    for part in parts:
        part = part.strip()
        if ":" in part:
            k, v = part.split(":", 1)
            current_key = k.strip()
            specs[current_key] = v.strip()
        else:
            if current_key and part:
                specs[current_key] += ", " + part
    return specs if specs else None

def normalize_title(title):
    t = title.strip().lower()
    if t.startswith("pro "):
        t = t[4:]
    return t

def get_db_products(is_remote=False):
    sql = "SELECT id, title, metadata FROM product WHERE deleted_at IS NULL;"
    if is_remote:
        cmd = ["ssh", "procare", f'docker exec -i procare_postgres psql "{REMOTE_DB_URL}" -t -A']
    else:
        cmd = ["docker", "exec", "-i", "procare_postgres", "psql", "-U", "procare_ecommerce", "-d", "procare_ecommerce", "-t", "-A"]
    res = subprocess.run(cmd, input=sql, text=True, check=True, capture_output=True)
    products = []
    for line in res.stdout.strip().split("\n"):
        if not line.strip(): continue
        parts = line.split("|")
        pid = parts[0]
        title = parts[1]
        meta_str = parts[2] if len(parts) > 2 else "{}"
        try:
            meta = json.loads(meta_str) if meta_str else {}
        except:
            meta = {}
        products.append({"id": pid, "title": title, "metadata": meta})
    return products

def update_db_product(pid, metadata, is_remote=False):
    meta_str = json.dumps(metadata).replace("'", "''")
    sql = f"UPDATE product SET metadata = '{meta_str}'::jsonb WHERE id = '{pid}';"
    if is_remote:
        cmd = ["ssh", "procare", f'docker exec -i procare_postgres psql "{REMOTE_DB_URL}" -t -A']
    else:
        cmd = ["docker", "exec", "-i", "procare_postgres", "psql", "-U", "procare_ecommerce", "-d", "procare_ecommerce", "-t", "-A"]
    subprocess.run(cmd, input=sql, text=True, check=True, capture_output=True)

def main():
    print("Reading Excel sheet...")
    df = pd.read_excel(EXCEL_PATH)
    
    # Group by normalized product title to collect all metadata
    product_data = {}
    for idx, r in df.iterrows():
        title = r["Product Title"]
        if pd.isna(title): continue
        norm = normalize_title(title)
        
        # Initialize if not present
        if norm not in product_data:
            product_data[norm] = {
                "how_to_use": None,
                "key_benefits": None,
                "suitable_for": None,
                "specifications": None,
                "badges": None
            }
        
        # Keep non-null values
        if pd.notna(r.get("How To Use")) and not product_data[norm]["how_to_use"]:
            product_data[norm]["how_to_use"] = str(r["How To Use"]).strip()
        if pd.notna(r.get("Key Benefits")) and not product_data[norm]["key_benefits"]:
            product_data[norm]["key_benefits"] = str(r["Key Benefits"]).strip()
        if pd.notna(r.get("Suitable For")) and not product_data[norm]["suitable_for"]:
            product_data[norm]["suitable_for"] = str(r["Suitable For"]).strip()
        if pd.notna(r.get("Specifications")) and not product_data[norm]["specifications"]:
            product_data[norm]["specifications"] = str(r["Specifications"]).strip()
        if pd.notna(r.get("Badges")) and not product_data[norm]["badges"]:
            product_data[norm]["badges"] = str(r["Badges"]).strip()

    # Do local and remote DB updates
    for is_remote in [False, True]:
        target = "remote RDS" if is_remote else "local"
        print(f"\nUpdating {target} database metadata...")
        db_products = get_db_products(is_remote)
        
        # Build db lookup map
        db_map = {normalize_title(p["title"]): p for p in db_products}
        
        updated_count = 0
        for norm_title, data in product_data.items():
            if norm_title in db_map:
                p = db_map[norm_title]
                meta = p["metadata"] or {}
                
                # Merge client fields
                if data["how_to_use"]:
                    meta["how_to_use"] = data["how_to_use"]
                if data["key_benefits"]:
                    meta["key_benefits"] = data["key_benefits"]
                if data["suitable_for"]:
                    meta["suitable_for"] = data["suitable_for"]
                
                # Parse complex fields
                if data["specifications"]:
                    parsed_specs = parse_specifications(data["specifications"])
                    if parsed_specs:
                        meta["product_specifications"] = parsed_specs
                if data["badges"]:
                    parsed_badges = parse_badges(data["badges"])
                    if parsed_badges:
                        meta["product_badges"] = parsed_badges
                
                update_db_product(p["id"], meta, is_remote)
                updated_count += 1
                
        print(f"Updated metadata for {updated_count}/{len(db_products)} products in {target} database.")

if __name__ == "__main__":
    main()
