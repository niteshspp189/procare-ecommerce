import subprocess
import os
import string
import random

def get_ulid():
    chars = string.ascii_lowercase + string.digits
    return "img_" + "".join(random.choices(chars, k=26))

base_dir = "/mnt/ExtraStorage/Project-Files/session-2026/procare/ecomm/procare-mail/june30/unzipped/Website work"
out_base = "/mnt/ExtraStorage/Project-Files/session-2026/procare/ecomm/storefront/public/images/products"
sql_stmts = []

mappings = [
    ("Esesstial/PRO Essentials Magic Pedi.JPG", "Foot Care", "PRO Essentials Magic Pedi Roller.webp", "prod_01KWC2J4T18XWKMJYJCA3NTB66", 0),
    ("Esesstial/PRO Essentials Magic Pedi2.JPG", "Foot Care", "PRO Essentials Magic Pedi Roller2.webp", "prod_01KWC2J4T18XWKMJYJCA3NTB66", 1),
    ("Esesstial/PRO Essentials Magic Pedi3.JPG", "Foot Care", "PRO Essentials Magic Pedi Roller3.webp", "prod_01KWC2J4T18XWKMJYJCA3NTB66", 2),
    ("Insole/PRO Insoles Gel Comfort Air walk  (1).JPG", "Insoles", "PRO Comfort Air Walk Gel Insoles (1).webp", "prod_01KWC2J4SVAFKRBG6PH1C5Z16F", 0),
    ("Insole/PRO Insoles Gel Comfort Air walk  (2).JPG", "Insoles", "PRO Comfort Air Walk Gel Insoles (2).webp", "prod_01KWC2J4SVAFKRBG6PH1C5Z16F", 1),
    ("Insole/PRO Insoles Gel Comfort Air walk  (3).JPG", "Insoles", "PRO Comfort Air Walk Gel Insoles (3).webp", "prod_01KWC2J4SVAFKRBG6PH1C5Z16F", 2),
]

for src, cat_folder, out_name, prod_id, rank in mappings:
    src_path = os.path.join(base_dir, src)
    out_dir = os.path.join(out_base, cat_folder)
    out_path = os.path.join(out_dir, out_name)
    subprocess.run(["convert", src_path, "-quality", "85", out_path])
    
    url = f"/images/products/{cat_folder}/{out_name}"
    img_id = get_ulid()
    sql_stmts.append(f"INSERT INTO image (id, url, created_at, updated_at, rank, product_id) VALUES ('{img_id}', '{url}', now(), now(), {rank}, '{prod_id}');")

sql_stmts.append("UPDATE product p SET thumbnail = (SELECT i.url FROM image i WHERE i.product_id = p.id ORDER BY i.rank ASC LIMIT 1) WHERE id IN ('prod_01KWC2J4T18XWKMJYJCA3NTB66', 'prod_01KWC2J4SVAFKRBG6PH1C5Z16F');")

with open("fix_missed_images.sql", "w") as f:
    f.write("\n".join(sql_stmts))
