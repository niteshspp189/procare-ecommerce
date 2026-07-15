import os
import re
import json
import csv

def parse_txt_to_structured(txt_path):
    with open(txt_path, 'r', encoding='utf-8', errors='ignore') as f:
        text = f.read()

    lines = [l.strip() for l in text.split('\n')]
    products = []
    curr = {'title': '', 'key_benefits': [], 'how_to_use': [], 'specifications': {}}
    mode = None

    for i, l in enumerate(lines):
        if 'Key Benefits' in l or (l == 'Specifications' and any('Product' in lines[max(0, i-6):i+1] for _ in [0])) or 'Product Details & Specifications' in l:
            # If we already collected benefits or specs for previous product, save and reset
            if curr['title'] and (curr['key_benefits'] or curr['specifications']):
                products.append(curr)
                curr = {'title': '', 'key_benefits': [], 'how_to_use': [], 'specifications': {}}
            
            title = ''
            if 'Key Benefits of' in l:
                title = l.split('Key Benefits of')[-1].strip()
            if not title:
                for j in range(i-1, max(-1, i-15), -1):
                    pre = lines[j]
                    if pre and not pre.startswith('') and not pre.startswith('•') and not any(k in pre for k in ['Bottom of Form', 'Top of Form', 'Step', 'How to', 'Recommended Use:', 'Add Mnemonics', 'Base', 'Safety']) and not set(pre) <= {'_', ' ', '-'}:
                        title = pre
                        break
            curr['title'] = title or f'Product_{len(products)+1}'
            mode = 'kb' if 'Key Benefits' in l else 'sp'
            continue
            
        if 'How to Use' in l or 'How To Use' in l:
            mode = 'hu'
            continue
        if 'Product Details & Specifications' in l or l == 'Specifications' or 'Specifications & Features' in l:
            mode = 'sp'
            continue
        if 'Add Mnemonics' in l or (l == 'Base' and mode == 'kb'):
            mode = None
            continue
            
        if mode == 'kb' and l and not l.startswith('Add'):
            clean = re.sub(r'^[•\-\*]+\s*', '', l).strip()
            if clean and "Key Benefits" not in clean:
                curr['key_benefits'].append(clean)
        elif mode == 'hu' and l and 'Product Details' not in l:
            clean = re.sub(r'^[•]+\s*', '', l).strip()
            if clean and "How to Use" not in clean:
                curr['how_to_use'].append(clean)
        elif mode == 'sp' and (l.startswith('') or l.startswith('•') or ':' in l):
            cl = re.sub(r'^[•\-\*]+\s*', '', l).strip()
            if ':' in cl:
                k, v = cl.split(':', 1)
                k_clean = re.sub(r'\s+', ' ', k.strip())
                v_clean = re.sub(r'\s+', ' ', v.strip())
                if k_clean and v_clean and len(k_clean) < 40:
                    curr['specifications'][k_clean] = v_clean

    if curr['title'] and (curr['key_benefits'] or curr['specifications']):
        products.append(curr)
        
    return products

def main():
    txt_path = "/mnt/ExtraStorage/Project-Files/session-2026/procare/ecomm/latest/Website_product_pages.txt"
    products = parse_txt_to_structured(txt_path)
    print(f"Total extracted products: {len(products)}")
    
    formatted_db_items = []
    all_spec_keys = set()
    for p in products:
        for k in p["specifications"].keys():
            all_spec_keys.add(k)
            
    sorted_spec_keys = sorted(list(all_spec_keys))
    
    csv_rows = []
    for p in products:
        key_benefits_str = "\n".join([f"- {b}" if not b.startswith("-") else b for b in p["key_benefits"]])
        how_to_use_str = "\n".join(p["how_to_use"])
        suitable_for = p["specifications"].get("Suitable For", p["specifications"].get("Suitable for", ""))
        
        db_entry = {
            "title": p["title"],
            "metadata": {
                "key_benefits": key_benefits_str if key_benefits_str else None,
                "how_to_use": how_to_use_str if how_to_use_str else None,
                "suitable_for": suitable_for if suitable_for else None,
                "product_specifications": p["specifications"] if p["specifications"] else None
            }
        }
        formatted_db_items.append(db_entry)
        
        row = {
            "Product Title": p["title"],
            "Key Benefits": key_benefits_str,
            "How to Use": how_to_use_str,
            "Suitable For (DB column)": suitable_for
        }
        for k in sorted_spec_keys:
            row[k] = p["specifications"].get(k, "")
        csv_rows.append(row)
        
    json_path = "/mnt/ExtraStorage/Project-Files/session-2026/procare/ecomm/latest/website_product_pages_formatted.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(formatted_db_items, f, indent=2)
    print(f"Saved formatted JSON to: {json_path}")
    
    csv_path = "/mnt/ExtraStorage/Project-Files/session-2026/procare/ecomm/latest/website_product_pages_extracted.csv"
    fieldnames = ["Product Title", "Key Benefits", "How to Use", "Suitable For (DB column)"] + sorted_spec_keys
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(csv_rows)
    print(f"Saved extracted CSV to: {csv_path}")

if __name__ == "__main__":
    main()
