import psycopg2
import pandas as pd
import json

DB_URL = "postgres://propremiumcare:Mvsc2026%23%2356@localhost:5433/prepreimiumcare_ecommerce?sslmode=require"

def main():
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()

    cur.execute("""
        SELECT 
            p.title,
            p.handle,
            v.title as variant_title,
            v.sku,
            p.metadata as p_meta,
            v.metadata as v_meta,
            p.thumbnail,
            p.id as product_id,
            v.id as variant_id
        FROM product p
        JOIN product_variant v ON p.id = v.product_id
        WHERE p.deleted_at IS NULL AND v.deleted_at IS NULL
    """)
    rows = cur.fetchall()
    
    # We also need pricing info to check for MRP
    cur.execute("""
        SELECT v.id, mp.amount, mp.currency_code 
        FROM product_variant v
        JOIN product_variant_price_set pvps ON v.id = pvps.variant_id
        JOIN price_set ps ON pvps.price_set_id = ps.id
        JOIN price mp ON ps.id = mp.price_set_id
        WHERE v.deleted_at IS NULL AND mp.deleted_at IS NULL
    """)
    prices = cur.fetchall()
    
    conn.close()

    price_map = {}
    for var_id, amount, curr in prices:
        if var_id not in price_map:
            price_map[var_id] = []
        price_map[var_id].append({'amount': amount, 'currency': curr})

    missing_data = []

    total_products = len(set(r[0] for r in rows))
    total_variants = len(rows)

    metrics = {
        'Products Missing Images': 0,
        'Products Missing MRP': 0,
        'Products Missing Specifications': 0,
        'Products Missing How to Use': 0,
        'Products Missing Key Benefits': 0,
        'Products Missing Suitable For': 0,
        'Products Missing Custom Badges': 0
    }

    # Track missing per product (base product level)
    missing_flags_per_product = {}

    for row in rows:
        title, handle, var_title, sku, p_meta, v_meta, thumbnail, prod_id, var_id = row
        p_meta = p_meta or {}
        v_meta = v_meta or {}
        
        # Check missing MRP
        var_prices = price_map.get(var_id, [])
        has_inr = any(p['currency'] == 'inr' for p in var_prices)
        
        has_image = thumbnail and 'polish.jpeg' not in thumbnail
        
        has_specs = bool(p_meta.get('product_specifications'))
        has_how_to_use = bool(p_meta.get('how_to_use'))
        has_key_benefits = bool(p_meta.get('key_benefits'))
        has_suitable_for = bool(p_meta.get('suitable_for'))
        has_badges = bool(p_meta.get('product_badges'))

        if title not in missing_flags_per_product:
            missing_flags_per_product[title] = {
                'handle': handle,
                'variants_count': 0,
                'missing_image': not has_image,
                'missing_mrp': not has_inr,
                'missing_specs': not has_specs,
                'missing_how_to_use': not has_how_to_use,
                'missing_key_benefits': not has_key_benefits,
                'missing_suitable_for': not has_suitable_for,
                'missing_badges': not has_badges
            }
        
        missing_flags_per_product[title]['variants_count'] += 1
        
        # If any variant has it, we consider the product to have it (except MRP which should be on all variants)
        if has_inr: missing_flags_per_product[title]['missing_mrp'] = False
        if has_image: missing_flags_per_product[title]['missing_image'] = False
        if has_specs: missing_flags_per_product[title]['missing_specs'] = False
        if has_how_to_use: missing_flags_per_product[title]['missing_how_to_use'] = False
        if has_key_benefits: missing_flags_per_product[title]['missing_key_benefits'] = False
        if has_suitable_for: missing_flags_per_product[title]['missing_suitable_for'] = False
        if has_badges: missing_flags_per_product[title]['missing_badges'] = False

    for title, flags in missing_flags_per_product.items():
        if flags['missing_image']: metrics['Products Missing Images'] += 1
        if flags['missing_mrp']: metrics['Products Missing MRP'] += 1
        if flags['missing_specs']: metrics['Products Missing Specifications'] += 1
        if flags['missing_how_to_use']: metrics['Products Missing How to Use'] += 1
        if flags['missing_key_benefits']: metrics['Products Missing Key Benefits'] += 1
        if flags['missing_suitable_for']: metrics['Products Missing Suitable For'] += 1
        if flags['missing_badges']: metrics['Products Missing Custom Badges'] += 1

        if any([flags['missing_image'], flags['missing_mrp'], flags['missing_specs'], flags['missing_how_to_use'], flags['missing_key_benefits'], flags['missing_suitable_for'], flags['missing_badges']]):
            missing_data.append({
                'Product Title': title,
                'Product URL': f"https://shop.mvshoecare.com/products/{flags['handle']}",
                'Variants Count': flags['variants_count'],
                'Missing Image': 'Yes' if flags['missing_image'] else 'No',
                'Missing MRP': 'Yes' if flags['missing_mrp'] else 'No',
                'Missing Specifications': 'Yes' if flags['missing_specs'] else 'No',
                'Missing How to Use': 'Yes' if flags['missing_how_to_use'] else 'No',
                'Missing Key Benefits': 'Yes' if flags['missing_key_benefits'] else 'No',
                'Missing Suitable For': 'Yes' if flags['missing_suitable_for'] else 'No',
                'Missing Custom Badges': 'Yes' if flags['missing_badges'] else 'No'
            })

    # Summary Report
    summary_data = [
        {'Metric': 'Total Published Products', 'Count': total_products},
        {'Metric': 'Total Product Variants', 'Count': total_variants},
    ]
    for k, v in metrics.items():
        summary_data.append({'Metric': k, 'Count': v})

    df_summary = pd.DataFrame(summary_data)
    df_missing = pd.DataFrame(missing_data)

    df_summary.to_excel('client_report.xlsx', index=False)
    df_missing.to_csv('client_missing_data_report.csv', index=False)

    print("Successfully generated client_report.xlsx and client_missing_data_report.csv")
    print(df_summary.to_string(index=False))

if __name__ == '__main__':
    main()
