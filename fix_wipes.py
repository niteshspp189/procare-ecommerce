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
    ("Shoecare/Sneaker Wipes Kit Pack of 30.JPG", "Shoe Care", "PRO GOLD Sneaker Wipes - Pack of 30 (1).webp", "prod_01KWC2J4SK6QPE0G45PEWQBTBT", 0),
    ("Shoecare/Sneaker Wipes Kit Pack of 30 (2).JPG", "Shoe Care", "PRO GOLD Sneaker Wipes - Pack of 30 (2).webp", "prod_01KWC2J4SK6QPE0G45PEWQBTBT", 1),
    ("Shoecare/Sneaker Wipes Kit Pack of 30 (3).JPG", "Shoe Care", "PRO GOLD Sneaker Wipes - Pack of 30 (3).webp", "prod_01KWC2J4SK6QPE0G45PEWQBTBT", 2),
]

for src, cat_folder, out_name, prod_id, rank in mappings:
    src_path = os.path.join(base_dir, src)
    out_dir = os.path.join(out_base, cat_folder)
    out_path = os.path.join(out_dir, out_name)
    subprocess.run(["convert", src_path, "-quality", "85", out_path])
    
    url = f"/images/products/{cat_folder}/{out_name}"
    img_id = get_ulid()
    sql_stmts.append(f"INSERT INTO image (id, url, created_at, updated_at, rank, product_id) VALUES ('{img_id}', '{url}', now(), now(), {rank}, '{prod_id}');")

sql_stmts.append("UPDATE product p SET thumbnail = (SELECT i.url FROM image i WHERE i.product_id = p.id ORDER BY i.rank ASC LIMIT 1) WHERE id IN ('prod_01KWC2J4SK6QPE0G45PEWQBTBT');")

with open("fix_wipes.sql", "w") as f:
    f.write("\n".join(sql_stmts))
