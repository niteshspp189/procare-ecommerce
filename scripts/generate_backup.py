import os
import json
import re
import csv
import shutil
import psycopg2

RDS_URL = "postgres://propremiumcare:Mvsc2026##56@database-1.c5wkcis2qg1p.ap-south-1.rds.amazonaws.com:5432/prepreimiumcare_ecommerce?sslmode=require"
BASE_DIR = "/var/www/procare-ecommerce"
STOREFRONT_PUBLIC = os.path.join(BASE_DIR, "storefront", "public")
BACKUP_DIR = os.path.join(BASE_DIR, "catalog_alignment_backup_latest")
LOCAL_DIR = os.path.join(BACKUP_DIR, ".local")
BACKUPS_DIR = os.path.join(LOCAL_DIR, "backups")
IMAGES_DIR = os.path.join(LOCAL_DIR, "all-product-images")

def sanitize(name):
    if not name:
        return "Unknown"
    return re.sub(r'[<>:"/\\|?*]', '_', str(name)).strip()

def main():
    print("Starting backup and extraction script...")
    
    # Create directories
    os.makedirs(BACKUP_DIR, exist_ok=True)
    os.makedirs(LOCAL_DIR, exist_ok=True)
    os.makedirs(BACKUPS_DIR, exist_ok=True)
    os.makedirs(IMAGES_DIR, exist_ok=True)
    
    # 1. Connect to RDS DB
    print("Connecting to production RDS database...")
    conn = psycopg2.connect(RDS_URL)
    cur = conn.cursor()
    
    # 2. Query products
    print("Querying products table...")
    cur.execute("""
        SELECT id, title, handle, status, thumbnail, metadata
        FROM product
        WHERE deleted_at IS NULL
    """)
    products_rows = cur.fetchall()
    
    rds_products = []
    for r in products_rows:
        rds_products.append({
            "id": r[0],
            "title": r[1],
            "handle": r[2],
            "status": r[3],
            "thumbnail": r[4],
            "metadata": r[5] or {}
        })
        
    with open(os.path.join(BACKUP_DIR, "rds_products.json"), "w", encoding="utf-8") as f:
        json.dump(rds_products, f, indent=2)
        
    # 3. Query product variants
    print("Querying product variants table...")
    cur.execute("""
        SELECT id, product_id, title, sku, metadata
        FROM product_variant
        WHERE deleted_at IS NULL
    """)
    variants_rows = cur.fetchall()
    
    rds_variants = []
    for r in variants_rows:
        rds_variants.append({
            "id": r[0],
            "product_id": r[1],
            "title": r[2],
            "sku": r[3],
            "metadata": r[4] or {}
        })
        
    with open(os.path.join(BACKUP_DIR, "rds_variants.json"), "w", encoding="utf-8") as f:
        json.dump(rds_variants, f, indent=2)
        
    # 4. Query variant price sets
    print("Querying variant price sets...")
    cur.execute("""
        SELECT id, variant_id, price_set_id
        FROM product_variant_price_set
    """)
    pricesets_rows = cur.fetchall()
    
    rds_pricesets = []
    for r in pricesets_rows:
        rds_pricesets.append({
            "id": r[0],
            "variant_id": r[1],
            "price_set_id": r[2]
        })
        
    with open(os.path.join(BACKUP_DIR, "rds_variant_pricesets.json"), "w", encoding="utf-8") as f:
        json.dump(rds_pricesets, f, indent=2)
        
    # 5. Query prices
    print("Querying prices...")
    cur.execute("""
        SELECT id, amount, currency_code, price_set_id, price_list_id
        FROM price
        WHERE deleted_at IS NULL
    """)
    prices_rows = cur.fetchall()
    
    rds_prices = []
    for r in prices_rows:
        rds_prices.append({
            "id": r[0],
            "amount": float(r[1]) if r[1] is not None else 0.0,
            "currency_code": r[2],
            "price_set_id": r[3],
            "price_list_id": r[4]
        })
        
    with open(os.path.join(BACKUP_DIR, "rds_prices.json"), "w", encoding="utf-8") as f:
        json.dump(rds_prices, f, indent=2)
        
    # 6. Query images
    print("Querying images...")
    cur.execute("""
        SELECT id, url, product_id, rank
        FROM image
        ORDER BY rank ASC, created_at ASC
    """)
    images_rows = cur.fetchall()
    
    rds_images = []
    for r in images_rows:
        rds_images.append({
            "id": r[0],
            "url": r[1],
            "product_id": r[2],
            "rank": r[3]
        })
        
    with open(os.path.join(BACKUP_DIR, "rds_images.json"), "w", encoding="utf-8") as f:
        json.dump(rds_images, f, indent=2)
        
    # Query product category product link
    print("Querying product category links...")
    cur.execute("""
        SELECT pcp.product_id, c.name
        FROM product_category_product pcp
        JOIN product_category c ON pcp.product_category_id = c.id
    """)
    category_rows = cur.fetchall()
    category_map = {}
    for r in category_rows:
        category_map[r[0]] = r[1]
        
    # Map prices
    price_map = {}
    for p in rds_prices:
        var_id = next((ps["variant_id"] for ps in rds_pricesets if ps["price_set_id"] == p["price_set_id"]), None)
        if var_id:
            if var_id not in price_map:
                price_map[var_id] = []
            price_map[var_id].append(p)
            
    # Map images
    image_map = {}
    for img in rds_images:
        prod_id = img["product_id"]
        if prod_id:
            if prod_id not in image_map:
                image_map[prod_id] = []
            if img["url"] not in image_map[prod_id]:
                image_map[prod_id].append(img["url"])
                
    # 7. Generate procare_all_variants.csv
    print("Generating CSV report for all variants...")
    csv_rows = []
    
    # Sort products for clean deterministic output
    sorted_products = sorted(rds_products, key=lambda x: x["title"])
    for p in sorted_products:
        prod_id = p["id"]
        prod_title = p["title"]
        handle = p["handle"]
        p_meta = p["metadata"] or {}
        thumbnail = p["thumbnail"]
        category = category_map.get(prod_id, "Uncategorized")
        
        specs = p_meta.get('product_specifications', '')
        if isinstance(specs, dict):
            specs = ', '.join([f"{k}: {v}" for k, v in specs.items()])
            
        badges = p_meta.get('product_badges', '')
        if isinstance(badges, list):
            badges = ', '.join([b.get('label', '') for b in badges if isinstance(b, dict)])
            
        p_variants = [v for v in rds_variants if v["product_id"] == prod_id]
        sorted_variants = sorted(p_variants, key=lambda x: x["title"])
        
        for v in sorted_variants:
            var_id = v["id"]
            var_title = v["title"]
            sku = v["sku"]
            v_meta = v["metadata"] or {}
            
            var_prices = price_map.get(var_id, [])
            mrp = next((p['amount'] for p in var_prices if p['currency_code'] == 'inr' and p['price_list_id'] is None), None)
            sp = next((p['amount'] for p in var_prices if p['currency_code'] == 'inr' and p['price_list_id'] == 'pl_online_sale'), None)
            
            if sp is None and v_meta.get('sellingPrice'):
                sp = float(v_meta.get('sellingPrice'))
            if mrp is None and v_meta.get('mrp'):
                mrp = float(v_meta.get('mrp'))
                
            if mrp is None: mrp = sp
            if sp is None: sp = mrp
            
            # Images checklist
            prod_images_db = image_map.get(prod_id, [])
            v_images = [v_meta.get(f'image_{i}') for i in range(1, 10)]
            p_images = [p_meta.get(f'image_{i}') for i in range(1, 10)]
            
            all_images = []
            for img in v_images + p_images + prod_images_db + [thumbnail]:
                if img and isinstance(img, str) and img not in all_images:
                    all_images.append(img)
                    
            csv_rows.append({
                'Product Title': prod_title,
                'Variant Title': var_title,
                'SKU': sku,
                'Category': category,
                'URL': f"https://shop.mvshoecare.com/products/{handle}",
                'MRP (INR)': mrp,
                'Selling Price (INR)': sp,
                'How To Use': p_meta.get('how_to_use', ''),
                'Key Benefits': p_meta.get('key_benefits', ''),
                'Suitable For': p_meta.get('suitable_for', ''),
                'Specifications': specs,
                'Badges': badges,
                'Thumbnail': thumbnail,
                'Total Images Available': len(all_images),
                'Variant Image 1': all_images[0] if len(all_images) > 0 else '',
                'Variant Image 2': all_images[1] if len(all_images) > 1 else '',
                'Variant Image 3': all_images[2] if len(all_images) > 2 else '',
                'Variant Image 4': all_images[3] if len(all_images) > 3 else '',
                'Variant Image 5': all_images[4] if len(all_images) > 4 else '',
                'Variant Image 6': all_images[5] if len(all_images) > 5 else '',
                'Variant Image 7': all_images[6] if len(all_images) > 6 else '',
                'Variant Image 8': all_images[7] if len(all_images) > 7 else '',
                'Variant Image 9': all_images[8] if len(all_images) > 8 else '',
                'Variant Image 10': all_images[9] if len(all_images) > 9 else ''
            })
            
    csv_path = os.path.join(BACKUP_DIR, "procare_all_variants.csv")
    with open(csv_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=[
            'Product Title', 'Variant Title', 'SKU', 'Category', 'URL', 'MRP (INR)', 'Selling Price (INR)',
            'How To Use', 'Key Benefits', 'Suitable For', 'Specifications', 'Badges', 'Thumbnail',
            'Total Images Available', 'Variant Image 1', 'Variant Image 2', 'Variant Image 3',
            'Variant Image 4', 'Variant Image 5', 'Variant Image 6', 'Variant Image 7',
            'Variant Image 8', 'Variant Image 9', 'Variant Image 10'
        ])
        writer.writeheader()
        writer.writerows(csv_rows)
        
    print(f"Generated {csv_path} with {len(csv_rows)} variants.")
    
    # 8. Copy Images
    print("Copying current active images to backup directory...")
    copied_count = 0
    for row in csv_rows:
        prod_title = sanitize(row['Product Title'])
        var_title = sanitize(row['Variant Title'])
        
        prod_dir = os.path.join(IMAGES_DIR, prod_title)
        os.makedirs(prod_dir, exist_ok=True)
        
        # Copy main product thumbnail / images
        img_urls = []
        for i in range(1, 11):
            url = row.get(f'Variant Image {i}')
            if url and url not in img_urls:
                img_urls.append(url)
                
        # Also copy the thumbnail
        thumb = row.get('Thumbnail')
        if thumb and thumb not in img_urls:
            img_urls.append(thumb)
            
        for img_url in img_urls:
            if img_url.startswith("/"):
                img_url = img_url[1:]
                
            src_path = os.path.join(STOREFRONT_PUBLIC, img_url)
            if os.path.exists(src_path):
                filename = os.path.basename(src_path)
                
                # If variant specific, save in variant subfolder, else in product root folder
                if var_title != "Default" and var_title != "Universal":
                    var_dir = os.path.join(prod_dir, var_title)
                    os.makedirs(var_dir, exist_ok=True)
                    dst_path = os.path.join(var_dir, filename)
                else:
                    dst_path = os.path.join(prod_dir, filename)
                    
                if not os.path.exists(dst_path):
                    shutil.copy2(src_path, dst_path)
                    copied_count += 1
                    
    print(f"Copied {copied_count} unique image files to {IMAGES_DIR}.")
    
    # 9. Generate report.md by parsing the master data markdown file on VPS
    master_md_path = "/tmp/master_data.md"
    if os.path.exists(master_md_path):
        print("Parsing master data markdown file and validating RDS catalog...")
        sections = {}
        current_section = None
        
        with open(master_md_path, 'r', encoding='utf-8') as f:
            for line in f:
                line_str = line.strip()
                if not line_str:
                    continue
                m = re.match(r"^##\s+([^(]+)", line_str)
                if m:
                    current_section = m.group(1).strip()
                    sections[current_section] = []
                    continue
                if current_section and line_str.startswith('|'):
                    if '---' in line_str or 'Name Of Product' in line_str or 'Sr No' in line_str:
                        continue
                    parts = [p.strip() for p in line_str.split('|')]
                    if len(parts) >= 2:
                        if parts[0] == '':
                            parts = parts[1:]
                        if parts[-1] == '':
                            parts = parts[:-1]
                        sections[current_section].append(parts)
                        
        parsed_items = []
        for sec, rows in sections.items():
            for row in rows:
                if not row or len(row) < 5:
                    continue
                sr_no = row[0]
                brand = row[1]
                name = row[2]
                if sec == "Phase 1":
                    mrp = row[3]
                    selling = row[8]
                    cat = row[9]
                    size = row[11] if len(row) > 11 else ""
                else:
                    mrp = row[3]
                    selling = row[4]
                    cat = row[6] if len(row) > 6 else ""
                    size = row[8] if len(row) > 8 else ""
                    
                parsed_items.append({
                    "section": sec,
                    "sr_no": sr_no,
                    "brand": brand,
                    "name": name,
                    "mrp": float(mrp) if mrp and mrp != "—" and mrp != "" else 0.0,
                    "selling": float(selling) if selling and selling != "—" and selling != "" else 0.0,
                    "category": cat,
                    "size": size
                })
                
        # Load indexing helper maps
        rds_handle_to_prod = {p['handle']: p for p in rds_products}
        
        pricing = {}
        priceset_to_variant = {ps['price_set_id']: ps['variant_id'] for ps in rds_pricesets}
        for p in rds_prices:
            if p.get('currency_code') != 'inr':
                continue
            ps_id = p.get('price_set_id')
            v_id = priceset_to_variant.get(ps_id)
            if v_id:
                if v_id not in pricing:
                    pricing[v_id] = {'mrp': 0.0, 'selling': 0.0}
                amount = float(p['amount'])
                if p.get('price_list_id') == 'pl_online_sale':
                    pricing[v_id]['selling'] = amount
                elif p.get('price_list_id') is None:
                    pricing[v_id]['mrp'] = amount
                    
        # Match helper function from verify_mrp_master.py
        def map_name_to_handle_and_variant(name, section):
            lower = name.lower().replace("  ", " ").strip()
            if "shoe cream with applicator" in lower:
                color = name.replace("PRO GOLD  Shoe Cream With Applicator -", "").replace("Premium Shoe Care Kit -", "").strip()
                color = color.split("-")[-1].strip()
                return "pro-gold-color-shoe-cream-with-applicator", color
            if "shoe cream" in lower:
                m = re.search(r"shoe cream\s*-\s*([a-zA-Z\s]+)", name, re.IGNORECASE)
                color = m.group(1).replace("45gm", "").replace("45g", "").strip() if m else "Neutral"
                return "pro-gold-color-shoe-cream", color
            if "self shine" in lower or "self-shine" in lower:
                m = re.search(r"self\s*shine\s*-\s*([a-zA-Z\s]+)", name, re.IGNORECASE)
                color = m.group(1).strip() if m else "Neutral"
                return "pro-gold-shine-self-shine", color
            if "instant shiner" in lower or "instant shine" in lower:
                m = re.search(r"instant\s*shiner?\s*-\s*([a-zA-Z\s]+)", name, re.IGNORECASE)
                color = m.group(1).strip() if m else "Neutral"
                return "pro-gold-shine-instant-shine", color
            if "application brush" in lower:
                variant = "Dark" if "dark" in lower else "Light"
                return "pro-application-brush", variant
            if "gloss brush" in lower:
                variant = "Dark" if "dark" in lower else "Light"
                return "pro-gloss-brush", variant
            if "horse hair brush" in lower:
                variant = "Dark" if "dark" in lower else "Light"
                return "pro-horse-hair-brush", variant
            if "suede brush rubber black" in lower:
                return "pro-suede-brush", "Default"
            if "premium shoe tree" in lower:
                m = re.search(r"(\d+/\d+)", name)
                size = m.group(1) if m else "Default"
                return "pro-premium-shoe-tree", size
            if "shoe tree with spiral" in lower:
                m = re.search(r"(\d+/\d+)", name)
                size = m.group(1) if m else "Default"
                return "pro-accessories-men-shoe-tree-with-spiral", size
            if "ease memory foam" in lower:
                m = re.search(r"size\s*(\d+)", lower)
                size = f"Size {m.group(1)}" if m else "Default"
                return "pro-insoles-ease-memory-foam", size
            if "ease soft comfort" in lower:
                return "pro-insoles-ease-soft", "Default"
            if "active cricket" in lower:
                m = re.search(r"size\s*(\d+-\d+)", lower)
                size = m.group(1) if m else "Default"
                return "pro-insoles-active-cricket", size
            if "active cycling" in lower:
                m = re.search(r"size\s*(\d+-\d+|\d+-\s*\d+)", lower)
                size = m.group(1).replace(" ", "") if m else "Default"
                return "pro-insoles-active-cycling", size
            if "active running" in lower:
                m = re.search(r"size\s*(\d+-\d+)", lower)
                size = m.group(1) if m else "Default"
                return "pro-insoles-active-running", size
            if "ease aloe vera" in lower:
                return "pro-insoles-ease-aloe-vera", "Default"
            if "ease pacific blue" in lower:
                return "pro-insoles-ease-pacific-blue", "Default"
            if "gel comfort air walk" in lower:
                variant = "Large" if "large" in lower else "Small"
                return "pro-comfort-air-walk-gel-insoles", variant
            if "gel comfort foot bed" in lower:
                variant = "Large" if "large" in lower else "Small"
                return "pro-comfort-gel-insoles", variant
            if "gel comfort heel lovers" in lower:
                return "pro-insoles-gel-comfort-heel-lovers", "Universal"
            if "gel comfort heel pad" in lower:
                variant = "Large" if "large" in lower else "Small"
                return "pro-insoles-gel-comfort-heel-pad", variant
            if "ease heel liner" in lower:
                return "pro-insole-ease-heel-liner", "Default"
            if "brush & pumice combo" in lower:
                return "pro-essentials-brush-pumice-combo-turqouise", "Default"
            if "double sided foot file pink" in lower:
                return "pro-essentials-double-sided-foot-file-pink", "Default"
            if "double sided foot file purple" in lower:
                return "pro-essentials-double-sided-foot-file-purple", "Default"
            if "dual action foot file" in lower:
                return "pro-essentials-dual-action-foot-file-turqouise", "Default"
            if "magic pedi roller pack black" in lower:
                return "pro-essentials-magic-pedi-roller-pack-black", "Default"
            if "magic pedi" in lower:
                return "pro-essentials-magic-pedi-roller", "Default"
            if "nail file" in lower:
                return "pro-essentials-nail-file-turqouise", "Default"
            if "nail buffer" in lower:
                return "pro-essentials-nail-buffer-turqouise", "Default"
            if "nail clipper" in lower:
                return "pro-essentials-nail-clipper-turqouise", "Default"
            if "smooth feet pumice" in lower:
                return "pro-essentials-smooth-feet-pumice-turqouise", "Default"
            if "naivy white" in lower:
                return "pro-color-naivy-white-75ml-white", "Default"
            if "leather moisturize" in lower:
                return "pro-gold-care-leather-moisturizer", "Neutral"
            if "power sneaker cleaner" in lower:
                return "pro-gold-clean-power-cleaning-shampoo", "Neutral"
            if "clean power cleaner" in lower:
                return "pro-gold-sneaker-cleaning-kit-shampoo-mini-brush", "Neutral"
            if "sneaker wipes" in lower:
                return "pro-gold-sneaker-wipes-pack-of-30", "Neutral"
            if "foam cleaner" in lower:
                return "pro-gold-foam-cleaner", "Neutral"
            if "shoe deo" in lower:
                return "pro-gold-shoe-deo", "Default"
            if "suede n nubuck spray" in lower:
                return "pro-suede-and-nubuck-renovator-spray", "Default"
            if "hydroshield" in lower:
                return "pro-hydroshield", "Default"
            if "premium sneaker care kit" in lower:
                return "pro-premium-sneaker-care-kit", "Default"
            if "shoe horn metal 52 cm" in lower:
                return "shoe-horn-metal-52-cm", "Default"
            if "nubuck 2 in 1" in lower:
                return "pro-suede-2in1", "Default"
            if "perfect clean gel" in lower:
                return "pro-clean-perfect-clean-gel-50ml-neutral", "Default"
            if "easy care combo" in lower:
                return "pro-clean-easy-care-combo-pack-neutral", "Default"
            if "loving my bag" in lower:
                return "loving-my-bag-kit", "Default"
            if "suede n nubuck shoe care kit" in lower:
                return "suede-n-nubuck-shoe-care-kit", "Default"
            if "premium shoe care kit" in lower:
                return "premium-shoe-care-kit", "Default"
            if "sneaker wipes kit pack" in lower:
                return "sneaker-wipes-kit-pack", "Default"
            if "sports & sneaker cleaning kit" in lower:
                return "pro-gold-sports-sneaker-cleaning-kit", "Default"
            return None, None
            
        mismatches_count = 0
        missing_count = 0
        report_rows = []
        
        for item in parsed_items:
            handle, var_title = map_name_to_handle_and_variant(item['name'], item['section'])
            r_res = {"found": False}
            if handle:
                p = rds_handle_to_prod.get(handle)
                if p:
                    p_vars = [v for v in rds_variants if v['product_id'] == p['id']]
                    v_match = None
                    for v in p_vars:
                        db_v_title = v['title'].lower().strip()
                        cli_v_title = var_title.lower().strip()
                        if (db_v_title == cli_v_title or 
                            (cli_v_title in ["default", "neutral", "universal"] and db_v_title in ["default", "neutral", "universal", "default variant", "default size"]) or
                            len(p_vars) == 1):
                            v_match = v
                            break
                    if v_match:
                        price_info = pricing.get(v_match['id'], {'mrp': 0.0, 'selling': 0.0})
                        r_res = {
                            "found": True,
                            "sku": v_match['sku'],
                            "db_mrp": price_info['mrp'],
                            "db_selling": price_info['selling']
                        }
            
            client_name = item['name']
            client_mrp = item['mrp']
            client_selling = item['selling']
            sku = r_res.get('sku', '—')
            r_found = "✅ Yes" if r_res['found'] else "❌ No"
            
            r_mrp_val = r_res.get('db_mrp', 0.0) if r_res['found'] else 0.0
            r_sell_val = r_res.get('db_selling', 0.0) if r_res['found'] else 0.0
            
            db_mrp = f"{r_mrp_val:.2f}" if r_res['found'] else "—"
            db_selling = f"{r_sell_val:.2f}" if r_res['found'] else "—"
            
            mrp_mismatch = False
            selling_mismatch = False
            
            if r_res['found']:
                if abs(r_mrp_val - client_mrp) > 0.01:
                    mrp_mismatch = True
                if abs(r_sell_val - client_selling) > 0.01:
                    selling_mismatch = True
                    
            disp_mrp = f"⚠️ **{db_mrp}**" if mrp_mismatch else db_mrp
            disp_selling = f"⚠️ **{db_selling}**" if selling_mismatch else db_selling
            
            if not r_res['found']:
                missing_count += 1
            elif mrp_mismatch or selling_mismatch:
                mismatches_count += 1
                
            report_rows.append(f"| {item['section']} | {client_name} | `{sku}` | {r_found} | {client_mrp:.2f} | {disp_mrp} | {client_selling:.2f} | {disp_selling} |")
            
        report_path = os.path.join(BACKUP_DIR, "report.md")
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write("# MRP Online Validation Report (Latest State)\n\n")
            f.write("This report validates the 90 variants from the client's master data against the live **RDS Database**.\n\n")
            f.write("## 1. Summary of Matches & Discrepancies\n\n")
            f.write("| Section | Client Product Name | SKU | RDS Match? | Client MRP | DB MRP | Client Selling | DB Selling |\n")
            f.write("| --- | --- | --- | --- | --- | --- | --- | --- |\n")
            for r_line in report_rows:
                f.write(r_line + "\n")
            f.write(f"\n### Stats:\n")
            f.write(f"- **Total Variants Checked**: {len(parsed_items)}\n")
            f.write(f"- **Missing Variants**: {missing_count}\n")
            f.write(f"- **Price Mismatches**: {mismatches_count}\n")
            
        print(f"Generated validation report at {report_path}")
        
    cur.close()
    conn.close()
    print("Done! Backup script execution successfully completed.")

if __name__ == "__main__":
    main()
