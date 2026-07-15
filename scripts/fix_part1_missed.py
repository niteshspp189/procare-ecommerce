import os
from PIL import Image

# 1. Pro Magic Pedi Roller
pedi_dir = '/mnt/ExtraStorage/Project-Files/session-2026/procare/ecomm/latest/images_for_review/other/all-product-images/PRO Magic Pedi Roller/Default Variant'
if os.path.exists(pedi_dir):
    # Remove existing 1, 2, 3 .webp or .jpg
    for f in os.listdir(pedi_dir):
        if f.startswith(('1.', '2.', '3.')):
            os.remove(os.path.join(pedi_dir, f))
            print(f"Removed {f} from Pedi Roller")
            
    # Add new image as 1.webp
    src_img = '/home/niteshsp189/Downloads/PRO Essentials Magic Pedi2.JPG'
    dest_img = os.path.join(pedi_dir, '1.webp')
    if os.path.exists(src_img):
        with Image.open(src_img) as img:
            img.save(dest_img, 'WEBP')
        print("Added PRO Essentials Magic Pedi2.JPG as 1.webp")

# 2. Pro Comfort Gel Foot Bed Insoles/Large
insoles_dir = '/mnt/ExtraStorage/Project-Files/session-2026/procare/ecomm/latest/images_for_review/other/all-product-images/Pro Comfort Gel Foot Bed Insoles/Large'
if os.path.exists(insoles_dir):
    for ext in ('.jpg', '.webp'):
        fpath = os.path.join(insoles_dir, f'1{ext}')
        if os.path.exists(fpath):
            os.remove(fpath)
            print(f"Removed {fpath} from Gel Foot Bed Insoles")
