import os
import re
import json
import subprocess

import sys

REMOTE_DB_URL = "postgres://propremiumcare:Mvsc2026##56@database-1.c5wkcis2qg1p.ap-south-1.rds.amazonaws.com:5432/prepreimiumcare_ecommerce"

def get_db_products(is_remote=False):
    sql = "SELECT id, title, handle, metadata FROM product WHERE deleted_at IS NULL ORDER BY title;"
    if is_remote:
        cmd = ["ssh", "procare", f'docker exec -i procare_postgres psql "{REMOTE_DB_URL}" -t -A']
    else:
        cmd = ["docker", "exec", "-i", "procare_postgres", "psql", "-U", "procare_ecommerce", "-d", "procare_ecommerce", "-t", "-A"]
    res = subprocess.run(cmd, input=sql, text=True, check=True, capture_output=True)
    db_products = []
    for line in res.stdout.strip().split("\n"):
        if not line.strip(): continue
        parts = line.split("|")
        pid, title, handle = parts[0], parts[1], parts[2]
        meta_str = parts[3] if len(parts) > 3 else "{}"
        try:
            meta = json.loads(meta_str) if meta_str else {}
        except:
            meta = {}
        db_products.append({"id": pid, "title": title, "handle": handle, "metadata": meta})
    return db_products

def parse_txt(txt_path):
    with open(txt_path, "r", encoding="utf-8", errors="ignore") as f:
        text = f.read()

    lines = [l.strip() for l in text.split("\n")]
    # Let's parse all sections from the file
    # We can use the formatted JSON extracted by parse_client_doc_to_csv and supplement with our exact mappings
    with open("/mnt/ExtraStorage/Project-Files/session-2026/procare/ecomm/latest/website_product_pages_formatted.json", "r", encoding="utf-8") as f:
        extracted_items = json.load(f)
    return extracted_items, text

def find_best_item_for_product(title, handle, extracted_items, raw_text):
    # Mapping dictionary for exact known title differences between DB and client doc
    custom_map = {
        "Pro Clean Perfect Clean Gel 50ml Neutral": "Pro Perfect Leather Cleaning Gel",
        "Pro Comfort Air Walk Gel Insoles": "PRO Comfort Air Walk Gel Insoles",
        "Pro Gold Foam Cleaner": "PRO GOLD Foam Cleaner NOT-OK",
        "Pro Gold Shine Instant Shine": "Pro Gold Shine Instant Shine-3Color Neutral , Black, Brown-OK",
        "Pro Gold Shine Self Shine": "Pro Gold Shine Self Shine-3Color Neutral, Black, Brown OK",
        "Pro Gold Shoe Deo": "PRO GOLD Shoe Deo Not -OK",
        "Pro Gold Sneaker Wipes – Pack of 30": "PRO GOLD Sneaker Wipes – Pack of 30 NOT-OK",
        "Pro Insoles Gel Comfort Heel Lovers": "PRO Insoles Gel Comfort Foot Bed Size Large-Size S",
        "Pro Loving My Bag Kit": "Loving My Bag Kit -Neutral",
        "Pro Premium Sneaker Care Kit": "Premium Sneaker Care Kit -Neutral",
        "Pro Shoe Horn Metal 52 Cm": "Pro Shoe Horn Metal 52cm",
        "Shoe Horn Metal 52 Cm": "Pro Shoe Horn Metal 52cm",
        "Suede N Nubuck Shoe Care Kit": "SUEDE N NUBUCK SHOE CARE KIT",
        "Pro Gold Care Leather Moisturizer": "Key Benefits of Pro Care Leather Moisturizer",
        "Pro Gold Sneaker Cleaning Kit (Shampoo + Mini Brush)": "PRO GOLD Sneaker Cleaning Kit NOT-OK",
        "Pro Gold Color Shoe Cream with Applicator": "Pro Gold Color Shoe Cream-10Colors ,Black,Neutral,Blue,Tan,white,Mahogany,Medium brown ,Dark Brown ,cognac,Light Brown",
        "Pro Suede and Nubuck Renovator Spray": "PRO Suede and Nubuck OK",
        "Pro insoles Gel Comfort Heel Pad": "PRO Insoles Gel Comfort Heel Arch Support",
        "Pro Color Navy White 75ml": "Pro Color Naivy White 75ml White",
        "Pro Navy White": "Pro Color Naivy White 75ml White",
        "Pro Clean Easy Care Combo Pack Neutral": "PRO Clean Easy Care Combo Pack Neutral",
        "Pro Essentials Brush & Pumice Combo Turqouise": "Pro Essentials Brush & Pumice Combo Turqouise",
        "Pro Essentials Double sided Foot File Purple": "Pro Essentials Double sided Foot File Purple",
        "Pro Essentials Dual Action Foot File Turqouise": "Pro Essentials Dual Action Foot File Turqouise",
        "Pro Essentials Magic Pedi Roller": "PRO Essentials Magic Pedi Roller Pack Black",
        "Pro Essentials Magic Pedi Roller Pack Black": "PRO Essentials Magic Pedi Roller Pack Black",
        "Pro Essentials Nail Buffer Turqouise": "Pro Essentials Nail Buffer Turqouise",
        "Pro Essentials Nail Clipper Turqouise": "Pro Essentials Nail Clipper Turqouise",
        "Pro Essentials Nail File Turqouise": "Pro Essentials Nail File Turqouise",
        "Pro Essentials Smooth Feet Pumice Turqouise": "Pro Essentials Smooth Feet Pumice Turqouise",
        "Pro Insole Ease Heel Liner": "PRO Insole Ease Heel Liner",
        "Pro Insoles Active Cricket": "PRO Insoles Active Cricket Size 35-36",
        "Pro Insoles Active Cycling": "PRO Insoles Active Cycling Size 35-38",
        "Pro Insoles Active Running": "PRO Insoles Active Running Size 43-46",
        "Pro Insoles Ease Aloe Vera": "PRO Insoles Ease Aloe Vera Size 36-46",
    }

    target_key = custom_map.get(title)
    if target_key:
        for item in extracted_items:
            jt = item["title"].strip().split("\n")[0].replace("﻿", "").strip()
            if target_key.lower() in jt.lower() or jt.lower() in target_key.lower():
                return item

    # Try fuzzy checking extracted items
    for item in extracted_items:
        jt = item["title"].strip().split("\n")[0].replace("﻿", "").strip()
        t1 = "".join(c for c in title.lower() if c.isalnum())
        t2 = "".join(c for c in jt.lower() if c.isalnum())
        if t1 == t2 or (len(t1) > 8 and t1 in t2) or (len(t2) > 8 and t2 in t1):
            return item

    return None

def extract_from_raw_text(title, raw_text):
    # Locate section in raw text by searching synonyms or core words
    synonyms = {
        "Premium Shoe Care Kit": "Premium Color Restoring Shoe Cream",
        "Pro Accessories Men Shoe Tree With Spiral": "PRO Spiral Shoe Tree",
        "Pro Application Brush": "Pro Application Brush",
        "Pro Comfort Air Walk Gel Insoles": "PRO Comfort Air Walk Gel Insoles",
        "Pro Comfort Gel Insoles": "PRO Comfort Gel Insoles",
        "Pro Essentials Double sided Foot File Pink": "Pro Essentials Double sided Foot File Purple",
        "Pro Gloss Brush": "Pro Gloss Brush",
        "Pro Gold Sports & Sneaker Cleaning Kit": "Sneakers, Sports Shoes, Casual Shoes",
        "Pro Horse Hair Brush": "Pro Horse Hair Brush",
        "Pro Hydroshield": "PRO Hydroshield",
        "Pro Insoles Ease Memory Foam": "PRO Insoles Ease Memory Foam",
        "Pro Insoles Ease Pacific Blue": "PRO Insoles Ease Memory Foam",
        "Pro Insoles Ease Soft": "PRO INSOLES EASE SOFT",
        "Pro Premium Shoe Tree": "PRO Premium Shoe Tree",
        "Pro Suede 2in1": "Pro Suede 2in1",
        "Pro Suede Brush": "Pro Suede Brush",
        "Pro Suede and Nubuck Renovator Spray": "Suede and Nubuck Renovator Spray",
    }
    search_term = synonyms.get(title, title.replace("Pro ", "").replace("Gold ", "").strip())
    pos = raw_text.lower().find(search_term.lower())
    if pos == -1:
        # Try finding first 2 words
        words = [w for w in search_term.split() if len(w) > 2]
        if words:
            pos = raw_text.lower().find(words[0].lower())
    if pos == -1:
        return None

    # Get lines from pos to next major product heading or 60 lines
    chunk = raw_text[pos:pos+4000]
    lines = [l.strip() for l in chunk.split("\n")]
    
    key_benefits = []
    how_to_use = []
    specifications = {}
    suitable_for = ""
    mode = None

    for line in lines[:80]:
        if any(h in line.lower() for h in ["key benefits", "benefits:"]):
            mode = "kb"
            continue
        elif any(h in line.lower() for h in ["how to use", "directions:", "application:"]):
            mode = "hu"
            continue
        elif any(h in line.lower() for h in ["specifications", "product details"]):
            mode = "sp"
            continue
        elif line.startswith("Key Benefits –") and mode:
            break # next product

        if mode == "kb" and line and not line.startswith("Key Benefits"):
            clean = re.sub(r'^[•\-\*]+\s*', '', line).strip()
            if clean and len(clean) > 3:
                key_benefits.append(f"- {clean}" if not clean.startswith("-") else clean)
        elif mode == "hu" and line and not line.startswith("How to Use"):
            clean = re.sub(r'^[•\-\*]+\s*', '', line).strip()
            if clean and len(clean) > 3:
                how_to_use.append(clean)
        elif mode == "sp" and (":" in line or "–" in line or "-" in line):
            cl = re.sub(r'^[•\-\*]+\s*', '', line).strip()
            if ":" in cl:
                k, v = cl.split(":", 1)
                specifications[k.strip()] = v.strip()
                if "suitable" in k.lower():
                    suitable_for = v.strip()

    return {
        "metadata": {
            "key_benefits": "\n".join(key_benefits) if key_benefits else None,
            "how_to_use": "\n".join(how_to_use) if how_to_use else None,
            "suitable_for": suitable_for if suitable_for else None,
            "product_specifications": specifications if specifications else None
        }
    }

def main():
    is_remote = "--remote" in sys.argv
    db_products = get_db_products(is_remote=is_remote)
    txt_path = "/mnt/ExtraStorage/Project-Files/session-2026/procare/ecomm/latest/Website_product_pages.txt"
    extracted_items, raw_text = parse_txt(txt_path)

    target_name = "remote RDS" if is_remote else "local"
    print(f"Total active DB products ({target_name}): {len(db_products)}")
    updated_count = 0

    for p in db_products:
        item = find_best_item_for_product(p["title"], p["handle"], extracted_items, raw_text)
        if not item:
            item = extract_from_raw_text(p["title"], raw_text)

        if not item:
            print(f"⚠️ No direct match or fallback for DB product: {p['title']}")
            continue

        meta = p["metadata"] or {}
        new_meta = item.get("metadata", {})
        if not new_meta:
            continue

        # Update metadata fields
        meta["key_benefits"] = new_meta.get("key_benefits") or meta.get("key_benefits")
        meta["how_to_use"] = new_meta.get("how_to_use") or meta.get("how_to_use")
        meta["suitable_for"] = new_meta.get("suitable_for") or meta.get("suitable_for")
        meta["product_specifications"] = new_meta.get("product_specifications") or meta.get("product_specifications")

        # Save using stdin to avoid bash escaping issues
        json_meta_str = json.dumps(meta).replace("'", "''")
        update_sql = f"UPDATE product SET metadata = '{json_meta_str}'::jsonb WHERE id = '{p['id']}';\n"
        if is_remote:
            psql_args = ["ssh", "procare", f'docker exec -i procare_postgres psql "{REMOTE_DB_URL}" -t -A']
        else:
            psql_args = ["docker", "exec", "-i", "procare_postgres", "psql", "-U", "procare_ecommerce", "-d", "procare_ecommerce", "-t", "-A"]
        
        subprocess.run(psql_args, input=update_sql, text=True, check=True, capture_output=True)
        updated_count += 1
        print(f"✅ Updated metadata for {target_name} product: {p['title']}")

    print(f"\n🎉 Successfully updated metadata for {updated_count}/{len(db_products)} products in {target_name} database.")

if __name__ == "__main__":
    main()
