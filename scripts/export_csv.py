import psycopg2
import pandas as pd
import json

DB_URL = "postgres://procare_ecommerce:procare_ecommerce@localhost:5432/procare_ecommerce"

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
            p.thumbnail,
            p.id AS prod_id
        FROM product p
        JOIN product_variant v ON p.id = v.product_id
        LEFT JOIN product_category_product pcp ON p.id = pcp.product_id
        LEFT JOIN product_category c ON pcp.product_category_id = c.id
        WHERE p.deleted_at IS NULL AND v.deleted_at IS NULL
    """)
    rows = cur.fetchall()

    # Query prices
    cur.execute("""
        SELECT v.id, mp.amount, mp.currency_code, mp.price_list_id
        FROM product_variant v
        JOIN product_variant_price_set pvps ON v.id = pvps.variant_id
        JOIN price_set ps ON pvps.price_set_id = ps.id
        JOIN price mp ON ps.id = mp.price_set_id
        WHERE v.deleted_at IS NULL AND mp.deleted_at IS NULL
    """)
    prices = cur.fetchall()
    # Query all images
    cur.execute("""
        SELECT product_id, url
        FROM image
        WHERE product_id IS NOT NULL
        ORDER BY rank ASC, created_at ASC
    """)
    images = cur.fetchall()
    
    conn.close()

    price_map = {}
    for var_id, amount, curr, plist_id in prices:
        if var_id not in price_map:
            price_map[var_id] = []
        price_map[var_id].append({'amount': amount, 'currency': curr, 'price_list_id': plist_id})

    image_map = {}
    for prod_id, url in images:
        if prod_id not in image_map:
            image_map[prod_id] = []
        # deduplicate
        if url not in image_map[prod_id]:
            image_map[prod_id].append(url)

    report_data = []

    for row in rows:
        prod_title, var_title, sku, category, handle, var_id, p_meta, v_meta, thumbnail, prod_id = row
        p_meta = p_meta or {}
        v_meta = v_meta or {}
        
        var_prices = price_map.get(var_id, [])
        mrp = next((p['amount'] for p in var_prices if p['currency'] == 'inr' and p['price_list_id'] is None), None)
        sp = next((p['amount'] for p in var_prices if p['currency'] == 'inr' and p['price_list_id'] == 'pl_online_sale'), None)
        
        if sp is None and v_meta.get('sellingPrice'):
            sp = v_meta.get('sellingPrice')
        if mrp is None and v_meta.get('mrp'):
            mrp = v_meta.get('mrp')
            
        if mrp is None: mrp = sp
        if sp is None: sp = mrp
        
        specs = p_meta.get('product_specifications', '')
        if isinstance(specs, dict):
            specs = ', '.join([f"{k}: {v}" for k, v in specs.items()])
            
        badges = p_meta.get('product_badges', '')
        if isinstance(badges, list):
            badges = ', '.join([b.get('label', '') for b in badges if isinstance(b, dict)])
            
        # Get images from various sources
        prod_images_db = image_map.get(prod_id, [])
        v_images = [v_meta.get(f'image_{i}') for i in range(1, 10)]
        p_images = [p_meta.get(f'image_{i}') for i in range(1, 10)]
        
        all_images = []
        for img in v_images + p_images + prod_images_db + [thumbnail]:
            if img and isinstance(img, str) and img not in all_images:
                all_images.append(img)

        report_data.append({
            'Product Title': prod_title,
            'Variant Title': var_title,
            'SKU': sku,
            'Category': category or 'Uncategorized',
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

    df = pd.DataFrame(report_data)
    df.to_csv('procare_all_variants.csv', index=False)
    print("Successfully updated procare_all_variants.csv")

if __name__ == '__main__':
    main()
