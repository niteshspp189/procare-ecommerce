import os
import json
import pandas as pd
import subprocess

REMOTE_DB_URL = "postgres://propremiumcare:Mvsc2026##56@database-1.c5wkcis2qg1p.ap-south-1.rds.amazonaws.com:5432/prepreimiumcare_ecommerce"

def run_query(sql):
    cmd = ["ssh", "procare", f'docker exec -i procare_postgres psql "{REMOTE_DB_URL}" -t -A']
    res = subprocess.run(cmd, input=sql, text=True, check=True, capture_output=True)
    out = res.stdout.strip()
    if not out:
        return []
    try:
        return json.loads(out)
    except Exception as e:
        print("Error parsing JSON:", e)
        print("Raw output:", out[:500])
        return []

def main():
    print("Fetching products from RDS...")
    sql_products = """
        SELECT json_agg(row_to_json(t)) FROM (
            SELECT p.id as pid, p.title as p_title, p.handle, p.status, p.thumbnail, p.metadata as p_meta,
                   v.id as vid, v.title as v_title, v.sku, v.metadata as v_meta,
                   c.name as cat_name
            FROM product p
            JOIN product_variant v ON v.product_id = p.id
            LEFT JOIN product_category_product pcp ON pcp.product_id = p.id
            LEFT JOIN product_category c ON c.id = pcp.product_category_id
            WHERE p.deleted_at IS NULL AND v.deleted_at IS NULL
        ) t;
    """
    products_data = run_query(sql_products)

    print("Fetching prices from RDS...")
    sql_prices = """
        SELECT json_agg(row_to_json(t)) FROM (
            SELECT v.id as variant_id, p.amount, p.currency_code, p.price_list_id
            FROM price p
            JOIN product_variant_price_set pvps ON p.price_set_id = pvps.price_set_id
            JOIN product_variant v ON pvps.variant_id = v.id
            WHERE p.deleted_at IS NULL
        ) t;
    """
    prices_data = run_query(sql_prices)
    
    print("Fetching images from RDS...")
    sql_images = """
        SELECT json_agg(row_to_json(t)) FROM (
            SELECT product_id as pid, url
            FROM image
            ORDER BY rank ASC, created_at ASC
        ) t;
    """
    images_data = run_query(sql_images)

    price_map = {}
    for r in prices_data:
        vid = r["variant_id"]
        amount = r["amount"]
        currency = r["currency_code"]
        pl_id = r["price_list_id"]
        if vid not in price_map:
            price_map[vid] = []
        price_map[vid].append({"amount": float(amount) if amount else 0.0, "currency_code": currency, "price_list_id": pl_id})

    image_map = {}
    for r in images_data:
        pid = r["pid"]
        url = r["url"]
        if pid not in image_map:
            image_map[pid] = []
        if url not in image_map[pid]:
            image_map[pid].append(url)

    csv_rows = []
    variants_dict = {}
    
    for row in products_data:
        vid = row["vid"]
        if vid not in variants_dict:
            variants_dict[vid] = {
                "pid": row["pid"], "p_title": row["p_title"], "handle": row["handle"], "status": row["status"],
                "thumbnail": row["thumbnail"], "p_meta": row["p_meta"] or {},
                "vid": vid, "v_title": row["v_title"], "sku": row["sku"], "v_meta": row["v_meta"] or {},
                "categories": set()
            }
        if row["cat_name"]:
            variants_dict[vid]["categories"].add(row["cat_name"])

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
        size_val = data["v_title"]
        if size_val.lower() in ["default variant", "default", "neutral", "universal"]:
            size_val = p_meta.get("size", size_val)

        def format_image_link(img_url):
            if not img_url:
                return ""
            if not img_url.startswith("http"):
                # prepend domain if it's a relative path
                if not img_url.startswith("/"):
                    img_url = "/" + img_url
                img_url = f"https://propremiumcare.com{img_url}"
            return f'=HYPERLINK("{img_url}", "View")'

        product_url = f"https://propremiumcare.com/products/{data['handle']}"
        
        csv_rows.append({
            'Product Title': data["p_title"],
            'Variant Title': data["v_title"],
            'Size': size_val,
            'SKU': data["sku"],
            'Category': category,
            'Product Page URL': f'=HYPERLINK("{product_url}", "View")',
            'MRP (INR)': mrp,
            'Selling Price (INR)': sp,
            'How To Use': p_meta.get('how_to_use', ''),
            'Key Benefits': p_meta.get('key_benefits', ''),
            'Suitable For': p_meta.get('suitable_for', ''),
            'Specifications': specs,
            'Badges': badges,
            'Thumbnail': format_image_link(data["thumbnail"]),
            'Total Images Available': len(all_images),
            'Variant Image 1': format_image_link(all_images[0] if len(all_images) > 0 else ''),
            'Variant Image 2': format_image_link(all_images[1] if len(all_images) > 1 else ''),
            'Variant Image 3': format_image_link(all_images[2] if len(all_images) > 2 else ''),
            'Variant Image 4': format_image_link(all_images[3] if len(all_images) > 3 else ''),
            'Variant Image 5': format_image_link(all_images[4] if len(all_images) > 4 else ''),
            'Variant Image 6': format_image_link(all_images[5] if len(all_images) > 5 else ''),
            'Variant Image 7': format_image_link(all_images[6] if len(all_images) > 6 else ''),
            'Variant Image 8': format_image_link(all_images[7] if len(all_images) > 7 else ''),
            'Variant Image 9': format_image_link(all_images[8] if len(all_images) > 8 else ''),
            'Variant Image 10': format_image_link(all_images[9] if len(all_images) > 9 else '')
        })

    df = pd.DataFrame(csv_rows)
    
    custom_order = [
        "Loving My Bag Kit",
        "PRO GOLD Sneaker Wipes Pack of 30 Kit",
        "PRO Insoles Ease Pacific Blue",
        "PRO Insoles Ease Soft",
        "PRO Insoles Gel Comfort Heel Lovers",
        "PRO Magic Pedi Roller",
        "PRO Magic Pedi Roller Pack Black",
        "Premium Shoe Care Kit",
        "Pro Application Brush",
        "Pro Brush & Pumice Combo Turqouise",
        "Pro Comfort Air Walk Gel Insoles",
        "Pro Comfort Gel Foot Bed Insoles",
        "Pro Double sided Foot File Purple",
        "Pro Dual Action Foot File Turqouise",
        "Pro Easy Care Combo Pack Neutral",
        "Pro Gloss Brush",
        "Pro Gold Instant Shine",
        "Pro Gold Leather Moisturizer",
        "Pro Gold Power Cleaning Shampoo",
        "Pro Gold Self Shine",
        "Pro Gold Shoe Cream",
        "Pro Gold Shoe Cream with Applicator",
        "Pro Gold Shoe Deo",
        "Pro Gold Sneaker Cleaning Kit",
        "Pro Gold Sneaker Wipes – Pack of 30",
        "Pro Gold Sports & Sneaker Cleaning Kit",
        "Pro Gold Suede n Nubuck Foam Cleaner",
        "Pro Horse Hair Brush",
        "Pro Hydroshield",
        "Pro Insole Heel Liner",
        "Pro Insoles Active Cricket",
        "Pro Insoles Active Cycling",
        "Pro Insoles Active Running",
        "Pro Insoles Ease Aloe Vera",
        "Pro Insoles Memory Foam",
        "Pro Nail Buffer Turqouise",
        "Pro Nail Clipper Turqouise",
        "Pro Nail File Turqouise",
        "Pro Navy White",
        "Pro Perfect Clean Gel",
        "Pro Premium Shoe Tree",
        "Pro Premium Sneaker Care Kit",
        "Pro Shoe Horn Metal 52 Cm",
        "Pro Shoe Tree With Spiral",
        "Pro Smooth Feet Pumice Turqouise",
        "Pro Suede Brush",
        "Pro Suede and Nubuck Renovator",
        "Pro Suede n Nubuck 2in1",
        "Pro Suede n Nubuck 2in1- test",
        "Pro insoles Gel Comfort Heel Pad",
        "Suede N Nubuck Shoe Care Kit"
    ]
    
    def get_sort_title(title):
        t = title.strip().lower()
        if t.startswith("pro "):
            t = t[4:]
        return t

    normalized_custom_order = [get_sort_title(name) for name in custom_order]

    def get_sort_index(title):
        t = get_sort_title(title)
        if t in normalized_custom_order:
            return normalized_custom_order.index(t)
        return 9999

    df['SortIndex'] = df['Product Title'].apply(get_sort_index)
    df = df.sort_values(by=['SortIndex', 'Product Title', 'Variant Title'])
    df = df.drop(columns=['SortIndex'])
    
    # Add sequential S.No as the first column to preserve custom sort order
    df.insert(0, 'S.No', range(1, len(df) + 1))
    
    excel_path = "/mnt/ExtraStorage/Project-Files/session-2026/procare/ecomm/latest/client_docs/excel/procare_all_variants.xlsx"
    df.to_excel(excel_path, index=False)
    print(f"Excel generated at {excel_path} with {len(df)} rows.")

if __name__ == "__main__":
    main()
