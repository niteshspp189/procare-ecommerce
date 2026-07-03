import json
import os
import re
import subprocess
import string
import random

def get_ulid():
    # Simple placeholder for an ID, though Medusa uses ulid. We can use a random string.
    # Actually Medusa IDs start with img_ and then 26 chars.
    chars = string.ascii_lowercase + string.digits
    return "img_" + "".join(random.choices(chars, k=26))

def normalize(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9]', '', text)
    return text

products = []
with open('products.json', 'r') as f:
    for line in f:
        line = line.strip()
        if line:
            products.append(json.loads(line))

base_dir = "/mnt/ExtraStorage/Project-Files/session-2026/procare/ecomm/procare-mail/june30/unzipped/Website work"
out_base = "/mnt/ExtraStorage/Project-Files/session-2026/procare/ecomm/storefront/public/images/products"
sql_statements = []

# To ensure we don't duplicate images in db, we first delete the missing ones.
# Actually we can just delete images for the matched products where rank >= 0 ? 
# The existing products might have NO images (which is why they show fallback).
# We can just insert them with rank 0, 1, 2 etc.

cats = ['Esesstial', 'Insole', 'Shoecare']

for cat in cats:
    cat_dir = os.path.join(base_dir, cat)
    if not os.path.exists(cat_dir):
        continue
    for file in os.listdir(cat_dir):
        if not file.lower().endswith(('.jpg', '.png', '.jpeg')):
            continue
        
        # Parse product name from filename.
        # e.g., "Pro Essentials Brush & Pumice Combo Turqouise2.JPG" -> "Pro Essentials Brush & Pumice Combo Turqouise"
        # "Premium Sneaker Care Kit (1).JPG" -> "Premium Sneaker Care Kit"
        base_name = os.path.splitext(file)[0]
        # Remove trailing numbers, spaces, and brackets like " (1)", "2", "3"
        clean_name = re.sub(r'(\s*\(\d+\)|\s*\d+)$', '', base_name).strip()
        
        # Find matching product
        matched_product = None
        norm_clean = normalize(clean_name)
        for p in products:
            if normalize(p['title']) == norm_clean or normalize(p['title']) == norm_clean.replace("esesstial", "essentials"):
                matched_product = p
                break
        
        # Fallback manual matching for some known discrepancies
        if not matched_product:
            if "Loving My Bag Kit" in clean_name:
                norm_clean = normalize("PRO Loving My Bag Kit")
            elif "Premium Shoe Care Kit" in clean_name:
                norm_clean = normalize("PRO Premium Shoe Care Kit")
            elif "Premium Sneaker Care Kit" in clean_name:
                norm_clean = normalize("PRO Premium Sneaker Care Kit")
            elif "PRO Clean Easy Care Combo Pack" in clean_name:
                norm_clean = normalize("PRO Clean Easy Care Combo Pack Neutral")
            elif "Sneaker Wipes Kit Pack of 30" in clean_name:
                norm_clean = normalize("PRO Sneaker Wipes Kit Pack of 30 Neutral")
            elif "Suede N Nubuck Shoe Care Kit" in clean_name:
                norm_clean = normalize("PRO Suede N Nubuck Shoe Care Kit Neutral")
            elif "Active Cricket" in clean_name:
                norm_clean = normalize("PRO Insoles Active Cricket")
            elif "Active Cycling" in clean_name:
                norm_clean = normalize("PRO Insoles Active Cycling")
            elif "Active Running" in clean_name:
                norm_clean = normalize("PRO Insoles Active Running")
            
            for p in products:
                if normalize(p['title']) == norm_clean:
                    matched_product = p
                    break
        
        if not matched_product:
            print(f"NO MATCH FOR: {file} (clean: {clean_name})")
            continue
            
        print(f"MATCH: {file} -> {matched_product['title']}")
        
        # Determine out folder based on category mapping
        cat_folder = "Foot Care" if cat == "Esesstial" else "Insoles" if cat == "Insole" else "Shoe Care"
        out_dir = os.path.join(out_base, cat_folder)
        os.makedirs(out_dir, exist_ok=True)
        
        # Convert to webp
        webp_name = base_name + ".webp"
        webp_path = os.path.join(out_dir, webp_name)
        src_path = os.path.join(cat_dir, file)
        
        # Run conversion
        subprocess.run(["convert", src_path, "-quality", "85", webp_path])
        
        # SQL insert
        url = f"/images/products/{cat_folder}/{webp_name}"
        img_id = get_ulid()
        # To determine rank, we can just use 0 for (1) or no number, 1 for (2), etc.
        rank = 0
        if "(1)" in base_name or base_name.endswith("1"): rank = 0
        elif "(2)" in base_name or base_name.endswith("2"): rank = 1
        elif "(3)" in base_name or base_name.endswith("3"): rank = 2
        elif "(4)" in base_name or base_name.endswith("4"): rank = 3
        
        sql = f"INSERT INTO image (id, url, created_at, updated_at, rank, product_id) VALUES ('{img_id}', '{url}', now(), now(), {rank}, '{matched_product['id']}');"
        sql_statements.append(sql)

with open('insert_missing_images.sql', 'w') as f:
    for sql in sql_statements:
        f.write(sql + "\n")
