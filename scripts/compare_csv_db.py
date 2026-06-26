import psycopg2
import pandas as pd
import json
import re

DB_URL = "postgres://procare_ecommerce:procare_ecommerce@localhost:5432/procare_ecommerce"

def normalize_text(text):
    if pd.isna(text) or not text:
        return ""
    # Strip spaces, normalize newlines, formatting and punctuation
    text = str(text).replace('\r\n', '\n').replace('\r', '\n')
    text = text.replace('**', '') # Ignore markdown bold styling differences
    text = re.sub(r'\s+', ' ', text).strip().lower()
    return text

def main():
    # Load CSV
    csv_df = pd.read_csv('procare_all_variants.csv')
    print(f"Loaded {len(csv_df)} variants from CSV.")

    # Connect to DB
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()

    # Query all database data
    cur.execute("""
        SELECT 
            v.sku,
            p.title AS p_title,
            v.title AS v_title,
            c.name AS category_name,
            p.metadata AS p_meta,
            v.metadata AS v_meta,
            p.thumbnail
        FROM product p
        JOIN product_variant v ON p.id = v.product_id
        LEFT JOIN product_category_product pcp ON p.id = pcp.product_id
        LEFT JOIN product_category c ON pcp.product_category_id = c.id
        WHERE p.deleted_at IS NULL AND v.deleted_at IS NULL
    """)
    db_rows = cur.fetchall()

    # Query prices
    cur.execute("""
        SELECT v.sku, mp.amount, mp.price_list_id
        FROM product_variant v
        JOIN product_variant_price_set pvps ON v.id = pvps.variant_id
        JOIN price_set ps ON pvps.price_set_id = ps.id
        JOIN price mp ON ps.id = mp.price_set_id
        WHERE v.deleted_at IS NULL AND mp.deleted_at IS NULL AND mp.currency_code = 'inr'
    """)
    price_rows = cur.fetchall()
    conn.close()

    # Map prices
    price_map = {}
    for sku, amount, price_list_id in price_rows:
        if sku not in price_map:
            price_map[sku] = {}
        if price_list_id is None:
            price_map[sku]['mrp'] = float(amount)
        elif price_list_id == 'pl_online_sale':
            price_map[sku]['sp'] = float(amount)

    # Map DB rows
    db_map = {}
    for row in db_rows:
        sku, p_title, v_title, category_name, p_meta, v_meta, thumbnail = row
        p_meta = p_meta or {}
        v_meta = v_meta or {}
        db_map[sku] = {
            'p_title': p_title,
            'v_title': v_title,
            'category': category_name or 'Uncategorized',
            'p_meta': p_meta,
            'v_meta': v_meta,
            'thumbnail': thumbnail,
            'mrp': price_map.get(sku, {}).get('mrp'),
            'sp': price_map.get(sku, {}).get('sp')
        }

    mismatches = []
    missing_skus = []

    for idx, csv_row in csv_df.iterrows():
        sku = csv_row['SKU']
        if not sku:
            continue
        
        # Strip/normalize SKU
        sku = str(sku).strip()

        if sku not in db_map:
            missing_skus.append(sku)
            continue

        db_row = db_map[sku]

        # 1. Product Title
        csv_p_title = csv_row['Product Title']
        db_p_title = db_row['p_title']
        # If updated title is present in CSV, check that too
        if not pd.isna(csv_row.get('Updated Title')):
            csv_p_title = csv_row['Updated Title']
        if normalize_text(csv_p_title) != normalize_text(db_p_title):
            mismatches.append((sku, 'Product Title', csv_p_title, db_p_title))

        # 2. Variant Title
        csv_v_title = csv_row['Variant Title']
        db_v_title = db_row['v_title']
        if normalize_text(csv_v_title) != normalize_text(db_v_title):
            mismatches.append((sku, 'Variant Title', csv_v_title, db_v_title))

        # 3. Category
        csv_category = csv_row['Category']
        db_category = db_row['category']
        # Note: script overrides Foot Care to Insoles in report, but let's check exact DB category here
        if normalize_text(csv_category) != normalize_text(db_category):
            mismatches.append((sku, 'Category', csv_category, db_category))

        # 4. MRP
        csv_mrp = csv_row['MRP (INR)']
        db_mrp = db_row['mrp']
        if not pd.isna(csv_mrp):
            try:
                csv_mrp_f = float(csv_mrp)
                db_mrp_f = float(db_mrp) if db_mrp is not None else None
                if db_mrp_f != csv_mrp_f:
                    mismatches.append((sku, 'MRP (INR)', csv_mrp, db_mrp))
            except Exception as e:
                mismatches.append((sku, 'MRP parsing error', csv_mrp, db_mrp))

        # 5. Selling Price
        csv_sp = csv_row['Selling Price (INR)']
        db_sp = db_row['sp']
        if not pd.isna(csv_sp):
            try:
                csv_sp_f = float(csv_sp)
                db_sp_f = float(db_sp) if db_sp is not None else None
                if db_sp_f != csv_sp_f:
                    mismatches.append((sku, 'Selling Price (INR)', csv_sp, db_sp))
            except Exception as e:
                mismatches.append((sku, 'Selling Price parsing error', csv_sp, db_sp))

        # 6. How To Use
        csv_how = csv_row['How To Use']
        db_how = db_row['p_meta'].get('how_to_use', '')
        if normalize_text(csv_how) != normalize_text(db_how):
            mismatches.append((sku, 'How To Use', csv_how, db_how))

        # 7. Key Benefits
        csv_benefits = csv_row['Key Benefits']
        db_benefits = db_row['p_meta'].get('key_benefits', '')
        if normalize_text(csv_benefits) != normalize_text(db_benefits):
            mismatches.append((sku, 'Key Benefits', csv_benefits, db_benefits))

        # 8. Suitable For
        csv_suitable = csv_row['Suitable For']
        db_suitable = db_row['p_meta'].get('suitable_for', '')
        if normalize_text(csv_suitable) != normalize_text(db_suitable):
            mismatches.append((sku, 'Suitable For', csv_suitable, db_suitable))

        # 9. Specifications
        csv_specs = csv_row['Specifications']
        db_specs_obj = db_row['p_meta'].get('product_specifications', '')
        # Formulate db specifications string
        if isinstance(db_specs_obj, dict):
            db_specs = ', '.join([f"{k}: {v}" for k, v in db_specs_obj.items()])
        else:
            db_specs = str(db_specs_obj)
        if normalize_text(csv_specs) != normalize_text(db_specs):
            mismatches.append((sku, 'Specifications', csv_specs, db_specs))

        # 10. Badges
        csv_badges = csv_row['Badges']
        db_badges_list = db_row['p_meta'].get('product_badges', '')
        if isinstance(db_badges_list, list):
            db_badges = ', '.join([b.get('label', '') for b in db_badges_list if isinstance(b, dict)])
        else:
            db_badges = str(db_badges_list)
        if normalize_text(csv_badges) != normalize_text(db_badges):
            mismatches.append((sku, 'Badges', csv_badges, db_badges))

        # 11. Thumbnail
        csv_thumb = csv_row['Thumbnail']
        db_thumb = db_row['thumbnail']
        if normalize_text(csv_thumb) != normalize_text(db_thumb):
            mismatches.append((sku, 'Thumbnail', csv_thumb, db_thumb))

        # 12. Variant Image 1
        csv_img1 = csv_row['Variant Image 1']
        db_img1 = db_row['v_meta'].get('image_1', '')
        if normalize_text(csv_img1) != normalize_text(db_img1):
            mismatches.append((sku, 'Variant Image 1', csv_img1, db_img1))

    print(f"\nDiscrepancies Analysis:")
    print(f"=======================")
    print(f"SKUs missing in Database: {len(missing_skus)}")

    print(f"\nMismatch count by column:")
    cols_mismatched = {}
    for sku, col, csv_val, db_val in mismatches:
        cols_mismatched[col] = cols_mismatched.get(col, 0) + 1
    for col, count in cols_mismatched.items():
        print(f" - {col}: {count} rows mismatch")

    print(f"\nDetailed image path mismatches:")
    for sku, col, csv_val, db_val in mismatches:
        if col in ['Thumbnail', 'Variant Image 1']:
            print(f"SKU: {sku} | Column: {col}")
            print(f"  CSV: {csv_val}")
            print(f"  DB:  {db_val}")

    print(f"\nDetailed text mismatches (if any left):")
    for sku, col, csv_val, db_val in mismatches:
        if col not in ['Thumbnail', 'Variant Image 1']:
            print(f"SKU: {sku} | Column: {col}")
            print(f"  CSV: {str(csv_val)[:100]}")
            print(f"  DB:  {str(db_val)[:100]}")

if __name__ == '__main__':
    main()

if __name__ == '__main__':
    main()
