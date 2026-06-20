import psycopg2
import pandas as pd
import json

DB_URL = "postgres://propremiumcare:Mvsc2026%23%2356@localhost:5433/prepreimiumcare_ecommerce?sslmode=require"

def main():
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()

    # Query all variants, their products, and their categories
    cur.execute("""
        SELECT 
            p.title AS product_title,
            v.title AS variant_title,
            v.sku,
            c.name AS category_name,
            p.handle,
            v.id AS variant_id,
            p.metadata AS p_meta,
            v.metadata AS v_meta,
            p.thumbnail
        FROM product p
        JOIN product_variant v ON p.id = v.product_id
        LEFT JOIN product_category_product pcp ON p.id = pcp.product_id
        LEFT JOIN product_category c ON pcp.product_category_id = c.id
        WHERE p.deleted_at IS NULL AND v.deleted_at IS NULL
    """)
    rows = cur.fetchall()

    # Query prices
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

    report_data = []

    for row in rows:
        prod_title, var_title, sku, category, handle, var_id, p_meta, v_meta, thumbnail = row
        p_meta = p_meta or {}
        v_meta = v_meta or {}
        
        var_prices = price_map.get(var_id, [])
        inr_price = next((p['amount'] for p in var_prices if p['currency'] == 'inr'), None)
        
        requires_attention = 'No'
        if category and category.lower() in ['insoles', 'foot care', 'insole', 'footcare']:
            requires_attention = 'Yes'
            
        specs = p_meta.get('product_specifications', '')
        if isinstance(specs, dict):
            specs = ', '.join([f"{k}: {v}" for k, v in specs.items()])
            
        badges = p_meta.get('product_badges', '')
        if isinstance(badges, list):
            badges = ', '.join([b.get('label', '') for b in badges if isinstance(b, dict)])
            
        report_data.append({
            'Product Title': prod_title,
            'Variant Title': var_title,
            'SKU': sku,
            'Category': category or 'Uncategorized',
            'URL': f"https://shop.mvshoecare.com/products/{handle}",
            'Price (INR)': inr_price,
            'How To Use': p_meta.get('how_to_use', ''),
            'Key Benefits': p_meta.get('key_benefits', ''),
            'Suitable For': p_meta.get('suitable_for', ''),
            'Specifications': specs,
            'Badges': badges,
            'Thumbnail': thumbnail,
            'Variant Image 1': v_meta.get('image_1', ''),
            'Requires Attention': requires_attention
        })

    df = pd.DataFrame(report_data)

    # Styling function
    def highlight_attention(row):
        color = 'background-color: #ffcccc' if row['Requires Attention'] == 'Yes' else ''
        return [color] * len(row)

    # Use openpyxl via Pandas Styler
    styled_df = df.style.apply(highlight_attention, axis=1)
    
    output_filename = 'full_product_variants_report.xlsx'
    styled_df.to_excel(output_filename, index=False, engine='openpyxl')

    print(f"Successfully generated {output_filename}")

if __name__ == '__main__':
    main()
