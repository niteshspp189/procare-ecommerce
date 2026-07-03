import pandas as pd
import re
import os
import shutil

csv_file = '/mnt/ExtraStorage/Project-Files/session-2026/procare/ecomm/procare_all_variants.csv'
df = pd.read_csv(csv_file)

# Cast all potential Variant Image columns to object to prevent dtype errors
for i in range(1, 15):
    col = f"Variant Image {i}"
    if col in df.columns:
        df[col] = df[col].astype(object)

import glob
unzipped_dir = "/mnt/ExtraStorage/Project-Files/session-2026/procare/ecomm/procare-mail/june30/unzipped"
public_dir = "/mnt/ExtraStorage/Project-Files/session-2026/procare/ecomm/storefront/public/images/products"
all_images = glob.glob(f"{unzipped_dir}/**/*.JPG", recursive=True) + glob.glob(f"{unzipped_dir}/**/*.jpg", recursive=True)

def generate_handle(name):
    clean = re.sub(r'[^a-zA-Z0-9\s-]', '', name.lower())
    clean = re.sub(r'\s+', '-', clean.strip())
    return clean

placeholder_url = "/images/placeholder.jpg"
fixed_count = 0
not_found_count = 0

for index, row in df.iterrows():
    if row['Thumbnail'] == '/images/polish.jpeg' or pd.isna(row['Thumbnail']) or row['Thumbnail'] == '':
        name = str(row['Product Title'])
        handle = generate_handle(name)
        
        # Determine keywords
        keywords = re.sub(r'(pro|accessories|neutral|care|size|large|small|universal|\b\d+-\d+\b|\b\d+\b)', '', name, flags=re.IGNORECASE).strip().split()
        keywords = [k.lower() for k in keywords if len(k) > 2]
        
        found_images = []
        for img in all_images:
            img_name = os.path.basename(img).lower()
            if all(k in img_name for k in keywords) and keywords:
                found_images.append(img)
                
        if not found_images:
            for img in all_images:
                dir_name = os.path.basename(os.path.dirname(img)).lower()
                if all(k in dir_name for k in keywords) and keywords:
                    found_images.append(img)
                    
        found_images = sorted(list(set(found_images)))
        
        if found_images:
            dest_dir = os.path.join(public_dir, handle)
            os.makedirs(dest_dir, exist_ok=True)
            img_urls = []
            
            for idx, img_path in enumerate(found_images, 1):
                ext = os.path.splitext(img_path)[1].lower()
                dest_path = os.path.join(dest_dir, f"{idx}{ext}")
                shutil.copy2(img_path, dest_path)
                img_urls.append(f"/images/products/{handle}/{idx}{ext}")
                
            df.at[index, 'Thumbnail'] = img_urls[0]
            df.at[index, 'Total Images Available'] = len(img_urls)
            for idx, url in enumerate(img_urls):
                col_name = f"Variant Image {idx+1}"
                if col_name in df.columns:
                    df.at[index, col_name] = url
                    
            fixed_count += 1
            print(f"Fixed: {name} ({len(img_urls)} images)")
        else:
            df.at[index, 'Thumbnail'] = placeholder_url
            df.at[index, 'Total Images Available'] = 1
            df.at[index, 'Variant Image 1'] = placeholder_url
            not_found_count += 1
            print(f"Not Found: {name} (Applied Placeholder)")

df.to_csv(csv_file, index=False)
print(f"Total Fixed: {fixed_count}, Total Not Found: {not_found_count}")
