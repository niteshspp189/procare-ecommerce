import os
import glob
import re
import csv
from pathlib import Path
import subprocess

unmatched_names = [
    "Pro Accessories Suede Brush Rubber Black",
    "Pro Clean Nubuck 2 in 1 Neutral",
    "PRO Care Suede N Nubuck Spray 180 ml-Neutral",
    "PRO Care Hydroshield 180 ml-Neutral",
    "Loving My Bag Kit -Neutral",
    "Suede N Nubuck Shoe Care Kit -Neutral",
    "PRO Insoles Ease Soft Comfort Size 36-46",
    "PRO Insoles Ease Aloe Vera Size 36-46",
    "PRO Insoles Ease Pacific Blue Size 36-46",
    "PRO Insoles Gel Comfort Air walk Size Large",
    "PRO Insoles Gel Comfort Air walk Size Small",
    "PRO Insoles Gel Comfort Foot Bed Size Large",
    "PRO Insoles Gel Comfort Foot Bed Size Small",
    "PRO Insoles Gel Comfort Heel Lovers Size Universal"
]

unzipped_dir = "/mnt/ExtraStorage/Project-Files/session-2026/procare/ecomm/procare-mail/june30/unzipped"
public_dir = "/mnt/ExtraStorage/Project-Files/session-2026/procare/ecomm/storefront/public/images/products"
all_images = glob.glob(f"{unzipped_dir}/**/*.JPG", recursive=True) + glob.glob(f"{unzipped_dir}/**/*.jpg", recursive=True)

def generate_handle(name):
    clean = re.sub(r'[^a-zA-Z0-9\s-]', '', name.lower())
    clean = re.sub(r'\s+', '-', clean.strip())
    return clean

mappings = {}
for name in unmatched_names:
    handle = generate_handle(name)
    keywords = re.sub(r'(pro|accessories|neutral|care|size|large|small|universal|\b\d+-\d+\b|\b\d+\b)', '', name, flags=re.IGNORECASE).strip().split()
    keywords = [k.lower() for k in keywords if len(k) > 2]
    
    found_images = []
    for img in all_images:
        img_name = os.path.basename(img).lower()
        if all(k in img_name for k in keywords) and keywords:
            found_images.append(img)
            
    # Also check directory names just in case
    if not found_images:
        for img in all_images:
            dir_name = os.path.basename(os.path.dirname(img)).lower()
            if all(k in dir_name for k in keywords) and keywords:
                found_images.append(img)
                
    found_images = sorted(list(set(found_images)))
    mappings[name] = {
        'handle': handle,
        'images': found_images
    }

print("Mappings:")
for k, v in mappings.items():
    print(f"Product: {k}")
    print(f"Handle: {v['handle']}")
    print(f"Images found: {len(v['images'])}")
    for img in v['images']:
        print(f"  - {os.path.basename(img)}")
    print("-" * 20)

