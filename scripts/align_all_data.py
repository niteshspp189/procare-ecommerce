import os
import re
import json
import pandas as pd
import subprocess
import sys

REMOTE_DB_URL = "postgres://propremiumcare:Mvsc2026##56@database-1.c5wkcis2qg1p.ap-south-1.rds.amazonaws.com:5432/prepreimiumcare_ecommerce"
EXCEL_PATH = "/home/niteshsp189/Downloads/procare_all_variants (3).xlsx"

# User's pasted price list
price_table_raw = """
Loving My Bag Kit	Default Variant	PG-loving-my-bag-kit-default	Shoe Care	View Product	599	587
PRO GOLD Sneaker Wipes Pack of 30 Kit	Default	PG-sneaker-wipes-pack-of-30-kit-default	Shoe Care	View Product	699	587.02
PRO Insoles Ease Pacific Blue	Default Size	PG-pro-insoles-ease-pacific-blue-default	Insoles	View Product	299	296
PRO Insoles Ease Soft	Default Size	PG-pro-insoles-ease-soft-default	Insoles	View Product	199	197
PRO Insoles Gel Comfort Heel Lovers	Default Size	PG-pro-insoles-gel-comfort-heel-lovers-universal	Insoles	View Product	199	197
PRO Magic Pedi Roller	Default Variant	PG-pro-essentials-magic-pedi-roller-default	Foot Care	View Product	2249	2227
PRO Magic Pedi Roller Pack Black	Default Variant	PG-pro-essentials-magic-pedi-roller-pack-black-def	Foot Care	View Product	399	395
Premium Shoe Care Kit	Default Variant	PG-premium-shoe-care-kit-default	Shoe Care	View Product	1499	1399
Pro Application Brush	Dark	PG-pro-application-brush-dark	Accessories	View Product	199	195
Pro Application Brush	Light	PG-pro-application-brush-light	Accessories	View Product	199	195
Pro Brush & Pumice Combo Turqouise	Default Variant	PG-pro-essentials-brush-pumice-combo-turqouise-def	Foot Care	View Product	349	346
Pro Comfort Air Walk Gel Insoles	Large	PG-pro-comfort-air-walk-gel-insoles-large	Insoles	View Product	649	643
Pro Comfort Air Walk Gel Insoles	Small	PG-pro-comfort-air-walk-gel-insoles-small	Insoles	View Product	649	643
Pro Comfort Gel Foot Bed Insoles	Large	PG-pro-comfort-gel-insoles-large	Insoles	View Product	549	544
Pro Comfort Gel Foot Bed Insoles	Small	PG-pro-comfort-gel-insoles-small	Insoles	View Product	549	544
Pro Double sided Foot File Purple	Default Variant	PG-pro-essentials-double-sided-foot-file-purple-de	Foot Care	View Product	199	197
Pro Dual Action Foot File Turqouise	Default Variant	PG-pro-essentials-dual-action-foot-file-turqouise-	Foot Care	View Product	349	346
Pro Easy Care Combo Pack Neutral	Default Variant	PG-pro-clean-easy-care-combo-pack-neutral-default	Shoe Care	View Product	299	587
Pro Gloss Brush	Dark	PG-pro-gloss-brush-dark	Accessories	View Product	399	391
Pro Gloss Brush	Light	PG-pro-gloss-brush-light	Accessories	View Product	399	391
Pro Gold Instant Shine	Black	PG-pro-gold-shine-instant-shine-black	Shoe Care	View Product	325	319
Pro Gold Instant Shine	Brown	PG-pro-gold-shine-instant-shine-brown	Shoe Care	View Product	325	319
Pro Gold Instant Shine	Neutral	PG-pro-gold-shine-instant-shine-neutral	Shoe Care	View Product	325	319
Pro Gold Leather Moisturizer	Default Variant	PG-pro-gold-care-leather-moisturizer-neutral	Shoe Care	View Product	425	417
Pro Gold Power Cleaning Shampoo	Default Variant	PG-pro-gold-clean-power-cleaning-shampoo-neutral	Shoe Care	View Product	399	391
Pro Gold Self Shine	Black	PG-pro-gold-shine-self-shine-black	Shoe Care	View Product	249	244
Pro Gold Self Shine	Brown	PG-pro-gold-shine-self-shine-brown	Shoe Care	View Product	249	244
Pro Gold Self Shine	Neutral	PG-pro-gold-shine-self-shine-neutral	Shoe Care	View Product	249	244
Pro Gold Shoe Cream	Black	PG-pro-gold-color-shoe-cream-black	Shoe Care	View Product	299	293
Pro Gold Shoe Cream	Blue	PG-pro-gold-color-shoe-cream-blue	Shoe Care	View Product	349	342
Pro Gold Shoe Cream	Cognac	PG-pro-gold-color-shoe-cream-cognac	Shoe Care	View Product	299	293
Pro Gold Shoe Cream	Dark Brown	PG-pro-gold-color-shoe-cream-dark-brown	Shoe Care	View Product	299	293
Pro Gold Shoe Cream	Light Brown	PG-pro-gold-color-shoe-cream-light-brown	Shoe Care	View Product	299	293
Pro Gold Shoe Cream	Mahogany	PG-pro-gold-color-shoe-cream-mahogany	Shoe Care	View Product	299	293
Pro Gold Shoe Cream	Medium Brown	PG-pro-gold-color-shoe-cream-medium-brown	Shoe Care	View Product	299	293
Pro Gold Shoe Cream	Neutral	PG-pro-gold-color-shoe-cream-neutral	Shoe Care	View Product	299	293
Pro Gold Shoe Cream	Tan	PG-pro-gold-color-shoe-cream-tan	Shoe Care	View Product	299	293
Pro Gold Shoe Cream	White	PG-pro-gold-color-shoe-cream-white	Shoe Care	View Product	349	342
Pro Gold Shoe Cream with Applicator	Black	PG-pro-gold-color-shoe-cream-with-applicator-black	Shoe Care	View Product	399	391
Pro Gold Shoe Cream with Applicator	Light Brown	PG-pro-gold-color-shoe-cream-with-applicator-light	Shoe Care	View Product	399	391
Pro Gold Shoe Cream with Applicator	Neutral	PG-pro-gold-color-shoe-cream-with-applicator-neutr	Shoe Care	View Product	399	391
Pro Gold Shoe Deo	Default Variant	PG-pro-gold-shoe-deo-default	Shoe Care	View Product	349	342
Pro Gold Sneaker Cleaning Kit	Default Variant	PG-pro-gold-sneaker-cleaning-kit-shampoo-mini-brus	Shoe Care	View Product	499	489
Pro Gold Sneaker Wipes – Pack of 30	Default Variant	PG-pro-gold-sneaker-wipes-pack-of-30-neutral	Shoe Care	View Product	699	587
Pro Gold Sports & Sneaker Cleaning Kit	Default Variant	PG-pro-gold-sports-sneaker-cleaning-kit-default	Shoe Care	View Product	899	783
Pro Gold Suede n Nubuck Foam Cleaner	Default Variant	PG-pro-gold-foam-cleaner-neutral	Shoe Care	View Product	449	440
Pro Horse Hair Brush	Dark	PG-pro-horse-hair-brush-dark	Accessories	View Product	575	564
Pro Horse Hair Brush	Light	PG-pro-horse-hair-brush-light	Accessories	View Product	575	564
Pro Hydroshield	Default Variant	PG-pro-hydroshield-default	Shoe Care	View Product	599	587
Pro Insole Heel Liner	Default Size	PG-pro-insole-ease-heel-liner-default	Insoles	View Product	199	197
Pro Insoles Active Cricket	35-36	PG-pro-insoles-active-cricket-35-36	Insoles	View Product	995	985
Pro Insoles Active Cricket	37-38	PG-pro-insoles-active-cricket-37-38	Insoles	View Product	995	985
Pro Insoles Active Cricket	39-40	PG-pro-insoles-active-cricket-39-40	Insoles	View Product	995	985
Pro Insoles Active Cricket	41-42	PG-pro-insoles-active-cricket-41-42	Insoles	View Product	995	985
Pro Insoles Active Cricket	43-44	PG-pro-insoles-active-cricket-43-44	Insoles	View Product	995	985
Pro Insoles Active Cricket	45-46	PG-pro-insoles-active-cricket-45-46	Insoles	View Product	995	985
Pro Insoles Active Cycling	35-38	PG-pro-insoles-active-cycling-35-38	Insoles	View Product	995	985
Pro Insoles Active Cycling	39-42	PG-pro-insoles-active-cycling-39-42	Insoles	View Product	995	985
Pro Insoles Active Cycling	43-46	PG-pro-insoles-active-cycling-43-46	Insoles	View Product	995	985
Pro Insoles Active Running	35-38	PG-pro-insoles-active-running-35-38	Insoles	View Product	995	985
Pro Insoles Active Running	39-42	PG-pro-insoles-active-running-39-42	Insoles	View Product	995	985
Pro Insoles Active Running	43-46	PG-pro-insoles-active-running-43-46	Insoles	View Product	995	985
Pro Insoles Ease Aloe Vera	Default Size	PG-pro-insoles-ease-aloe-vera-default	Insoles	View Product	299	296
Pro Insoles Memory Foam	Size 39	PG-pro-insoles-ease-memory-foam-size-39	Insoles	View Product	699	692
Pro Insoles Memory Foam	Size 40	PG-pro-insoles-ease-memory-foam-size-40	Insoles	View Product	699	692
Pro Insoles Memory Foam	Size 41	PG-pro-insoles-ease-memory-foam-size-41	Insoles	View Product	699	692
Pro Insoles Memory Foam	Size 42	PG-pro-insoles-ease-memory-foam-size-42	Insoles	View Product	699	692
Pro Insoles Memory Foam	Size 43	PG-pro-insoles-ease-memory-foam-size-43	Insoles	View Product	699	692
Pro Insoles Memory Foam	Size 44	PG-pro-insoles-ease-memory-foam-size-44	Insoles	View Product	699	692
Pro Nail Buffer Turqouise	Default Variant	PG-pro-essentials-nail-buffer-turqouise-default	Foot Care	View Product	199	197
Pro Nail Clipper Turqouise	Default Variant	PG-pro-essentials-nail-clipper-turqouise-default	Foot Care	View Product	299	296
Pro Nail File Turqouise	Default Variant	PG-pro-essentials-nail-file-turqouise-default	Foot Care	View Product	249	247
Pro Navy White	Default Variant	PG-pro-color-naivy-white-75ml-white-default	Shoe Care	View Product	275	275
Pro Perfect Clean Gel	Default Variant	PG-pro-clean-perfect-clean-gel-50ml-neutral-defaul	Shoe Care	View Product	249	244
Pro Premium Shoe Tree	37/38	PG-pro-premium-shoe-tree-37-38	Accessories	View Product	3999	3199
Pro Premium Shoe Tree	39/40	PG-pro-premium-shoe-tree-39-40	Accessories	View Product	3999	3199
Pro Premium Shoe Tree	40/41	PG-pro-premium-shoe-tree-40-41	Accessories	View Product	3999	3199
Pro Premium Shoe Tree	41/42	PG-pro-premium-shoe-tree-41-42	Accessories	View Product	3999	3199
Pro Premium Shoe Tree	43/44	PG-pro-premium-shoe-tree-43-44	Accessories	View Product	3999	3199
Pro Premium Sneaker Care Kit	Default Variant	PG-pro-premium-sneaker-care-kit-default	Shoe Care	View Product	1499	1399
Pro Shoe Horn Metal 52 Cm	Default Variant	PG-shoe-horn-metal-52-cm-default	Accessories	View Product	649	599
Pro Shoe Tree With Spiral	39/40	PG-pro-accessories-men-shoe-tree-with-spiral-39-40	Accessories	View Product	899	699
Pro Shoe Tree With Spiral	41/42	PG-pro-accessories-men-shoe-tree-with-spiral-41-42	Accessories	View Product	899	699
Pro Shoe Tree With Spiral	43/44	PG-pro-accessories-men-shoe-tree-with-spiral-43-44	Accessories	View Product	899	699
Pro Smooth Feet Pumice Turqouise	Default Variant	PG-pro-essentials-smooth-feet-pumice-turqouise-def	Foot Care	View Product	225	223
Pro Suede Brush	Default Variant	PG-pro-suede-brush-default	Accessories	View Product	250	245
Pro Suede and Nubuck Renovator	Default Variant	PG-pro-suede-and-nubuck-renovator-spray-default	Shoe Care	View Product	549	538
Pro Suede n Nubuck 2in1	Default Variant	PG-pro-suede-2in1-default	Shoe Care	View Product	325	319
Pro insoles Gel Comfort Heel Pad	Large	PG-pro-insoles-gel-comfort-heel-pad-large	Insoles	View Product	249	247
Pro insoles Gel Comfort Heel Pad	Small	PG-pro-insoles-gel-comfort-heel-pad-small	Insoles	View Product	249	247
Suede N Nubuck Shoe Care Kit	Default Variant	PG-suede-n-nubuck-shoe-care-kit-default	Shoe Care	View Product	849	587
"""

icon_map = {
    "pro clean": "eco", "pro fresh": "leaf", "pro care": "thumb", "european expertise": "award",
    "free shipping": "free-shipping", "30 day return": "30-day-return", "eco friendly": "eco-friendly",
    "complete kit": "complete-kit", "cleaning": "thumb", "effective clean": "leaf", "pro ease": "eco",
    "comfort": "leaf", "skin friendly": "natural", "made in europe": "award", "gel comfort": "star",
    "cushioning": "thumb", "hand washable": "eco", "essentials": "eco", "callus & dead skin remover": "natural",
    "replaceable roller": "leaf", "pack of 2 roller": "award", "pro accessories": "eco",
    "high quality bristles": "natural", "beech wood handle": "leaf", "pro shine": "eco",
    "color refreshing": "leaf", "shine": "thumb", "brush and pumice combo": "natural",
    "removes callus and dead skin": "eco", "high grade steel": "natural", "for coarse & fine filing": "natural",
    "high density sponge": "natural", "effective cleaning agent": "leaf", "high quality wood": "leaf",
    "protects colors": "thumb", "water repellent": "water", "dirt repellent": "leaf", "shine boost": "star",
    "travel friendly": "plane"
}

custom_title_map = {
    "pro gold color shoe cream-10colors ,black,neutral,blue,tan,white,mahogany,medium brown ,dark brown ,cognac,light brown": "Pro Gold Shoe Cream",
    "pro gold clean power cleaning shampoo": "Pro Gold Power Cleaning Shampoo",
    "pro gold shine instant shine-3color neutral , black, brown-ok": "Pro Gold Instant Shine",
    "pro gold shine self shine-3color neutral, black, brown": "Pro Gold Self Shine",
    "pro gold sneaker cleaning kit": "Pro Gold Sneaker Cleaning Kit",
    "pro gold sneaker wipes – pack of 30": "Pro Gold Sneaker Wipes – Pack of 30",
    "pro gold foam cleaner": "Pro Gold Suede n Nubuck Foam Cleaner",
    "pro gold shoe deo": "Pro Gold Shoe Deo",
    "pro essentials brush & pumice combo turqouise": "Pro Brush & Pumice Combo Turqouise",
    "pro essentials smooth feet pumice turqouise": "Pro Smooth Feet Pumice Turqouise",
    "pro essentials dual action foot file turqouise": "Pro Dual Action Foot File Turqouise",
    "pro essentials nail buffer turqouise": "Pro Nail Buffer Turqouise",
    "pro essentials nail clipper turqouise": "Pro Nail Clipper Turqouise",
    "pro essentials nail file turqouise": "Pro Nail File Turqouise",
    "pro essentials magic pedi roller pack black": "Pro Magic Pedi Roller Pack Black",
    "pro essentials double sided foot file purple": "Pro Double sided Foot File Purple",
    "pro essentials magic pedi light green": "PRO Magic Pedi Roller",
    "pro insoles gel comfort foot bed size large-size small , large": "Pro Comfort Gel Foot Bed Insoles",
    "pro clean nubuck 2 in 1 neutral": "Pro Suede n Nubuck 2in1",
    "pro insoles ease aloe vera size 36-46": "Pro Insoles Ease Aloe Vera",
    "pro color naivy white 75ml white": "Pro Navy White",
    "pro clean easy care combo pack neutral": "Pro Easy Care Combo Pack Neutral",
    "pro insole ease heel liner": "Pro Insole Heel Liner",
    "pro insoles active running size 43-46": "Pro Insoles Active Running",
    "pro insoles active cycling size 35-38": "Pro Insoles Active Cycling",
    "pro insoles active cricket size 35-36": "Pro Insoles Active Cricket",
    "premium sneaker care kit": "Pro Premium Sneaker Care Kit",
    "pro sneaker wipes (pack of 30) big kit": "PRO GOLD Sneaker Wipes Pack of 30 Kit",
    "loving my bag kit": "Loving My Bag Kit",
    "pro perfect leather cleaning gel": "Pro Perfect Clean Gel",
    "pro shoe horn metal 52cm": "Pro Shoe Horn Metal 52 Cm"
}

def clean_line(line):
    return re.sub(r'^[•\-*+\d\.\s]+\s*', '', line).strip()

def get_icon_id(label):
    lbl_clean = label.strip().lower()
    if lbl_clean in icon_map:
        return icon_map[lbl_clean]
    if "clean" in lbl_clean or "eco" in lbl_clean:
        return "eco"
    if "fresh" in lbl_clean or "odor" in lbl_clean or "fragrance" in lbl_clean:
        return "leaf"
    if "care" in lbl_clean or "protect" in lbl_clean or "comfort" in lbl_clean or "cushion" in lbl_clean:
        return "thumb"
    if "europe" in lbl_clean or "expertise" in lbl_clean or "standard" in lbl_clean or "premium" in lbl_clean:
        return "award"
    return "eco"

def parse_badges(badges_str):
    if not isinstance(badges_str, str) or not badges_str.strip():
        return None
    badges_list = []
    for p in badges_str.split(","):
        label = p.strip()
        if label:
            badges_list.append({"label": label, "iconId": get_icon_id(label)})
    return badges_list

def parse_docx_text():
    with open('latest/Website_product_pages.txt', 'r', encoding='utf-8') as f:
        text = f.read()
    lines = [l.strip() for l in text.split('\n')]
    products = []
    current_product = None
    mode = None
    for i, line in enumerate(lines):
        if not line: continue
        is_header = False
        if not line.startswith(('•', '', '*', '-', 'Step', 'How to', 'Recommended Use:', '1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', '9.')) and len(line) > 3:
            for offset in range(1, 5):
                if i + offset < len(lines):
                    next_l = lines[i+offset].strip()
                    if next_l == 'Key Benefits' or next_l == 'Key Benefits of':
                        is_header = True
                        break
        if is_header and not set(line) <= {'_', ' ', '-', '|'}:
            if current_product:
                products.append(current_product)
            current_product = {
                'title': line.replace(' OK', '').replace(' NOT-OK', '').replace(' Not -OK', '').replace('-Neutral', '').strip(),
                'key_benefits': [],
                'how_to_use': [],
                'suitable_for': None,
                'specifications': {}
            }
            mode = 'kb'
            continue
        if not current_product: continue
        if line in ['Key Benefits', 'Key Benefits of']:
            mode = 'kb'
            continue
        elif line in ['Specifications', 'Product Details & Specifications', 'Product Specifications', 'Feature\tDetails']:
            mode = 'sp'
            continue
        elif line in ['How to Use', 'How To Use']:
            mode = 'hu'
            continue
        elif line.startswith('Recommended Use:') or line.startswith('Recommended use:'):
            current_product['how_to_use'].append(line)
            mode = None
            continue
        if mode == 'kb':
            if 'Key Benefits' not in line and not line.startswith('___'):
                cl = clean_line(line)
                if cl: current_product['key_benefits'].append(cl)
        elif mode == 'hu':
            cl = clean_line(line)
            if cl: current_product['how_to_use'].append(cl)
        elif mode == 'sp':
            cl = line.replace('•', '').replace('', '').replace('*', '').strip()
            if ':' in cl:
                k, v = cl.split(':', 1)
                k = k.strip()
                v = v.strip()
                current_product['specifications'][k] = v
                if k.lower() == 'suitable for':
                    current_product['suitable_for'] = v
            elif '\t' in cl:
                parts = cl.split('\t')
                if len(parts) >= 2:
                    k = parts[0].strip()
                    v = parts[1].strip()
                    current_product['specifications'][k] = v
                    if k.lower() == 'suitable for':
                        current_product['suitable_for'] = v
    if current_product:
        products.append(current_product)
    return products

def normalize_title(title):
    t = title.strip().lower()
    if t.startswith("pro "):
        t = t[4:]
    return t

def main():
    print("Parsing client docx text...")
    parsed_products = parse_docx_text()
    
    # Map parsed title to DB title
    parsed_map = {}
    for p in parsed_products:
        t_clean = p['title'].lower().strip()
        matched_db_title = custom_title_map.get(t_clean, p['title'])
        parsed_map[normalize_title(matched_db_title)] = p
        
    # Read badges from the Excel sheet
    print("Reading badges from Excel...")
    excel_df = pd.read_excel(EXCEL_PATH)
    badges_map = {}
    for idx, r in excel_df.iterrows():
        title = r["Product Title"]
        if pd.isna(title): continue
        norm = normalize_title(title)
        if pd.notna(r.get("Badges")):
            badges_map[norm] = str(r["Badges"]).strip()

    # Parse expected prices
    print("Parsing target price list...")
    expected_prices = {}
    for line in price_table_raw.strip().split('\n'):
        parts = line.split('\t')
        if len(parts) >= 7:
            sku = parts[2].strip()
            mrp = float(parts[5].strip())
            sp = float(parts[6].strip())
            expected_prices[sku] = (mrp, sp)

    # Perform updates on local and remote DB
    for is_remote in [False, True]:
        target = "remote RDS" if is_remote else "local"
        print(f"\nProcessing {target} database updates...")
        
        # 1. Fetch products & variants
        if is_remote:
            psql_cmd = ["ssh", "procare", f'docker exec -i procare_postgres psql "{REMOTE_DB_URL}" -t -A']
        else:
            psql_cmd = ["docker", "exec", "-i", "procare_postgres", "psql", "-U", "procare_ecommerce", "-d", "procare_ecommerce", "-t", "-A"]
            
        sql_fetch_prods = "SELECT id, title, metadata FROM product WHERE deleted_at IS NULL;"
        res = subprocess.run(psql_cmd, input=sql_fetch_prods, text=True, check=True, capture_output=True)
        
        db_products = []
        for line in res.stdout.strip().split('\n'):
            if not line.strip(): continue
            parts = line.split('|')
            pid = parts[0]
            title = parts[1]
            meta_str = parts[2] if len(parts) > 2 else "{}"
            try:
                meta = json.loads(meta_str) if meta_str else {}
            except:
                meta = {}
            db_products.append({"id": pid, "title": title, "metadata": meta})

        # 2. Update product metadata
        updated_meta_count = 0
        for p in db_products:
            norm = normalize_title(p["title"])
            
            # Start with a clean copy or merge
            meta = p["metadata"] or {}
            
            # Find parsed clean docx metadata
            # Fallback mappings for Heel Lovers and Gel Foot Bed Insoles
            parsed_data = None
            if norm == normalize_title("Pro Insoles Gel Comfort Heel Lovers"):
                parsed_data = parsed_map.get(normalize_title("Pro Comfort Gel Foot Bed Insoles"))
            else:
                parsed_data = parsed_map.get(norm)
                
            if parsed_data:
                # Re-align with clean docx
                meta["key_benefits"] = "\n".join([f"- {b}" if not b.startswith("-") else b for b in parsed_data["key_benefits"]])
                meta["how_to_use"] = "\n".join(parsed_data["how_to_use"])
                meta["suitable_for"] = parsed_data["suitable_for"]
                meta["product_specifications"] = parsed_data["specifications"]
            
            # Map badges from excel
            excel_badges_str = badges_map.get(norm)
            if excel_badges_str:
                meta["product_badges"] = parse_badges(excel_badges_str)
                
            # Update product row
            meta_str = json.dumps(meta).replace("'", "''")
            sql_update = f"UPDATE product SET metadata = '{meta_str}'::jsonb WHERE id = '{p['id']}';"
            subprocess.run(psql_cmd, input=sql_update, text=True, check=True, capture_output=True)
            updated_meta_count += 1
            
        print(f"Updated metadata for {updated_meta_count} products in {target}.")

        # 3. Update variant pricing (both variant.metadata and price table)
        sql_fetch_vars = """
            SELECT v.id, v.sku, pvps.price_set_id, v.metadata 
            FROM product_variant v 
            LEFT JOIN product_variant_price_set pvps ON v.id = pvps.variant_id 
            WHERE v.deleted_at IS NULL;
        """
        res = subprocess.run(psql_cmd, input=sql_fetch_vars, text=True, check=True, capture_output=True)
        
        db_variants = []
        for line in res.stdout.strip().split('\n'):
            if not line.strip(): continue
            parts = line.split('|')
            vid = parts[0]
            sku = parts[1]
            price_set_id = parts[2]
            meta_str = parts[3] if len(parts) > 3 else "{}"
            try:
                meta = json.loads(meta_str) if meta_str else {}
            except:
                meta = {}
            db_variants.append({"id": vid, "sku": sku, "price_set_id": price_set_id, "metadata": meta})

        updated_price_count = 0
        for v in db_variants:
            sku = v["sku"]
            if sku in expected_prices:
                mrp, sp = expected_prices[sku]
                
                # A. Update variant metadata
                v_meta = v["metadata"] or {}
                v_meta["mrp"] = str(mrp)
                v_meta["sellingPrice"] = str(sp)
                v_meta_str = json.dumps(v_meta).replace("'", "''")
                
                sql_update_var = f"UPDATE product_variant SET metadata = '{v_meta_str}'::jsonb WHERE id = '{v['id']}';"
                subprocess.run(psql_cmd, input=sql_update_var, text=True, check=True, capture_output=True)
                
                # B. Update price table
                # Check default MRP price
                sql_update_mrp = f"""
                    UPDATE price 
                    SET amount = {mrp}, raw_amount = '{{"value": "{mrp}", "precision": 20}}'::jsonb
                    WHERE price_set_id = '{v['price_set_id']}' AND currency_code = 'inr' AND price_list_id IS NULL;
                """
                subprocess.run(psql_cmd, input=sql_update_mrp, text=True, check=True, capture_output=True)
                
                # Check sale price
                sql_update_sp = f"""
                    UPDATE price 
                    SET amount = {sp}, raw_amount = '{{"value": "{sp}", "precision": 20}}'::jsonb
                    WHERE price_set_id = '{v['price_set_id']}' AND currency_code = 'inr' AND price_list_id = 'pl_online_sale';
                """
                subprocess.run(psql_cmd, input=sql_update_sp, text=True, check=True, capture_output=True)
                
                updated_price_count += 1
                
        print(f"Aligned pricing for {updated_price_count} product variants in {target}.")

if __name__ == "__main__":
    main()
