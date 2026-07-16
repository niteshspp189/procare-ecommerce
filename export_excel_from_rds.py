import os
import json
import psycopg2
import pandas as pd
import re

RDS_URL = "postgres://propremiumcare:Mvsc2026##56@database-1.c5wkcis2qg1p.ap-south-1.rds.amazonaws.com:5432/prepreimiumcare_ecommerce?sslmode=require"

def main():
    print("Connecting to production RDS database...")
    conn = psycopg2.connect(RDS_URL)
    cur = conn.cursor()

    cur.execute("""
        SELECT p.id, p.title, p.handle, p.status, p.thumbnail, p.metadata,
               v.id, v.title, v.sku, v.metadata,
               pcp.product_category_id, c.name
        FROM product p
        JOIN product_variant v ON v.product_id = p.id
        LEFT JOIN product_category_product pcp ON pcp.product_id = p.id
        LEFT JOIN product_category c ON c.id = pcp.product_category_id
        WHERE p.deleted_at IS NULL AND v.deleted_at IS NULL
    """)
    rows = cur.fetchall()

    # Get prices
    cur.execute("""
        SELECT v.id as variant_id, p.amount, p.currency_code, p.price_list_id
        FROM price p
        JOIN product_variant_price_set pvps ON p.price_set_id = pvps.price_set_id
        JOIN product_variant v ON pvps.variant_id = v.id
        WHERE p.deleted_at IS NULL
    """)
    price_rows = cur.fetchall()
    
    price_map = {}
    for r in price_rows:
        vid, amount, currency, pl_id = r
        if vid not in price_map:
            price_map[vid] = []
        price_map[vid].append({"amount": float(amount) if amount else 0.0, "currency_code": currency, "price_list_id": pl_id})

    # Get images
    cur.execute("""
        SELECT product_id, url
        FROM image
        ORDER BY rank ASC, created_at ASC
    """)
    img_rows = cur.fetchall()
    image_map = {}
    for pid, url in img_rows:
        if pid not in image_map:
            image_map[pid] = []
        if url not in image_map[pid]:
            image_map[pid].append(url)

    # Process and build CSV rows
    csv_rows = []
    
    # We may have duplicate rows for categories if multiple categories are mapped. Group by variant.
    variants_dict = {}
    
    for r in rows:
        pid, p_title, handle, status, thumbnail, p_meta, vid, v_title, sku, v_meta, cat_id, cat_name = r
        
        if vid not in variants_dict:
            variants_dict[vid] = {
                "pid": pid, "p_title": p_title, "handle": handle, "status": status,
                "thumbnail": thumbnail, "p_meta": p_meta or {},
                "vid": vid, "v_title": v_title, "sku": sku, "v_meta": v_meta or {},
                "categories": set()
            }
        if cat_name:
            variants_dict[vid]["categories"].add(cat_name)

    for vid, data in variants_dict.items():
        p_meta = data["p_meta"]
        v_meta = data["v_meta"]
        category = ", ".join(sorted(list(data["categories"]))) if data["categories"] else "Uncategorized"
        
        specs = p_meta.get('product_specifications', '')
        if isinstance(specs, dict):
            specs = ', '.join([f"{k}: {v}" for k, v in specs.items()])
            
        badges = p_meta.get('product_badges', '')
        if isinstance(badges, list):
            badges = ', '.join([b.get('label', '') for b in badges if isinstance(b, dict)])

        var_prices = price_map.get(vid, [])
        mrp = next((p['amount'] for p in var_prices if p['currency_code'] == 'inr' and p['price_list_id'] is None), None)
        sp = next((p['amount'] for p in var_prices if p['currency_code'] == 'inr' and p['price_list_id'] == 'pl_online_sale'), None)
        
        if sp is None and v_meta.get('sellingPrice'):
            sp = float(v_meta.get('sellingPrice'))
        if mrp is None and v_meta.get('mrp'):
            mrp = float(v_meta.get('mrp'))
            
        if mrp is None: mrp = sp
        if sp is None: sp = mrp

        # Images checklist
        prod_images_db = image_map.get(data["pid"], [])
        v_images = [v_meta.get(f'image_{i}') for i in range(1, 10)]
        p_images = [p_meta.get(f'image_{i}') for i in range(1, 10)]
        
        all_images = []
        for img in v_images + p_images + prod_images_db + [data["thumbnail"]]:
            if img and isinstance(img, str) and img not in all_images:
                all_images.append(img)
                
        # Determine Size explicitly
        # In Medusa, the variant title is usually the size. 
        # If it's a dummy value like "Default Variant" or "Universal" or "Neutral", we keep it or empty.
        size_val = data["v_title"]
        if size_val.lower() in ["default variant", "default", "neutral", "universal"]:
            # Maybe there's a size in metadata?
            size_val = p_meta.get("size", size_val)

        csv_rows.append({
            'Product Title': data["p_title"],
            'Variant Title': data["v_title"],
            'Size': size_val,
            'SKU': data["sku"],
            'Category': category,
            'Product Page URL': f"https://shop.mvshoecare.com/products/{data['handle']}",
            'MRP (INR)': mrp,
            'Selling Price (INR)': sp,
            'How To Use': p_meta.get('how_to_use', ''),
            'Key Benefits': p_meta.get('key_benefits', ''),
            'Suitable For': p_meta.get('suitable_for', ''),
            'Specifications': specs,
            'Badges': badges,
            'Thumbnail': data["thumbnail"],
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

    df = pd.DataFrame(csv_rows)
    # Sort for deterministic output
    df = df.sort_values(by=['Product Title', 'Variant Title'])
    
    excel_path = "/tmp/procare_all_variants.xlsx"
    df.to_excel(excel_path, index=False)
    print(f"Excel generated at {excel_path} with {len(df)} rows.")

    cur.close()
    conn.close()

if __name__ == "__main__":
    main()
