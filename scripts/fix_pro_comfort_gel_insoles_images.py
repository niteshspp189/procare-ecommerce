import sys
import subprocess
import uuid

REMOTE_DB_URL = "postgres://propremiumcare:Mvsc2026##56@database-1.c5wkcis2qg1p.ap-south-1.rds.amazonaws.com:5432/prepreimiumcare_ecommerce"

def run_sql(sql, is_remote=False):
    if is_remote:
        cmd = ["ssh", "procare", f'docker exec -i procare_postgres psql "{REMOTE_DB_URL}" -t -A']
    else:
        cmd = ["docker", "exec", "-i", "procare_postgres", "psql", "-U", "procare_ecommerce", "-d", "procare_ecommerce", "-t", "-A"]
    res = subprocess.run(cmd, input=sql, text=True, check=True, capture_output=True)
    return [l.strip().split("|") for l in res.stdout.strip().split("\n") if l.strip()]

def main():
    is_remote = "--remote" in sys.argv
    target_name = "remote RDS" if is_remote else "local"
    print(f"=== Fixing images for pro-comfort-gel-insoles on {target_name} ===")

    # 1. Get product id and handle
    res = run_sql("SELECT id, handle, thumbnail FROM product WHERE handle = 'pro-comfort-gel-insoles' AND deleted_at IS NULL;", is_remote=is_remote)
    if not res:
        print("Product pro-comfort-gel-insoles not found!")
        return
    pid, handle, thumb = res[0][0], res[0][1], res[0][2] if len(res[0]) > 2 else ""
    print(f"Product ID: {pid}")

    # Ensure thumbnail is /images/products/pro-comfort-gel-insoles/1.webp
    desired_thumb = "/images/products/pro-comfort-gel-insoles/1.webp"
    if thumb != desired_thumb:
        run_sql(f"UPDATE product SET thumbnail = '{desired_thumb}' WHERE id = '{pid}';", is_remote=is_remote)
        print(f"Updated product thumbnail to {desired_thumb}")

    # 2. Get variants
    res_vars = run_sql(f"SELECT id, title FROM product_variant WHERE product_id = '{pid}' AND deleted_at IS NULL ORDER BY title;", is_remote=is_remote)
    variants = {v[1].strip().lower(): v[0] for v in res_vars}
    print("Variants found:", variants)

    # 3. List desired image URLs
    base_images = [
        "/images/products/pro-comfort-gel-insoles/1.webp",
        "/images/products/pro-comfort-gel-insoles/2.webp",
        "/images/products/pro-comfort-gel-insoles/3.webp",
    ]
    large_images = [f"/images/products/pro-comfort-gel-insoles/large-{i}.webp" for i in range(1, 8)]
    small_images = [f"/images/products/pro-comfort-gel-insoles/small-{i}.webp" for i in range(1, 8)]

    all_desired_images = base_images + large_images + small_images

    # 4. Ensure each image exists in `image` table and map URL -> image_id
    url_to_id = {}
    res_imgs = run_sql(f"SELECT id, url FROM image WHERE url LIKE '/images/products/pro-comfort-gel-insoles/%';", is_remote=is_remote)
    for img_id, url in res_imgs:
        url_to_id[url] = img_id

    for rank, url in enumerate(all_desired_images):
        if url not in url_to_id:
            new_id = "img_" + uuid.uuid4().hex.upper()[:24]
            run_sql(f"INSERT INTO image (id, url, created_at, updated_at, product_id, rank) VALUES ('{new_id}', '{url}', NOW(), NOW(), '{pid}', {rank});", is_remote=is_remote)
            url_to_id[url] = new_id
            print(f"Inserted image: {url} -> {new_id}")
        else:
            # Also ensure product_id and rank are correct for existing image
            img_id = url_to_id[url]
            run_sql(f"UPDATE image SET product_id = '{pid}', rank = {rank} WHERE id = '{img_id}';", is_remote=is_remote)

    # 5. Remove any old `.jpg` links or incorrect links from `product_variant_product_image` for these variants
    for vtitle, vid in variants.items():
        # Get current links
        res_links = run_sql(f"SELECT pvpi.variant_id, pvpi.image_id, idx.url FROM product_variant_product_image pvpi JOIN image idx ON pvpi.image_id = idx.id WHERE pvpi.variant_id = '{vid}';", is_remote=is_remote)
        print(f"\nVariant {vtitle} ({vid}) currently has {len(res_links)} linked images:")
        for _, img_id, url in res_links:
            if ".jpg" in url or ("large-" in url and "small" in vtitle) or ("small-" in url and "large" in vtitle):
                run_sql(f"DELETE FROM product_variant_product_image WHERE variant_id = '{vid}' AND image_id = '{img_id}';", is_remote=is_remote)
                print(f"  Removed old/mismatched image link: {url}")

        # Now link desired images for this variant
        if "large" in vtitle:
            desired_for_var = base_images + large_images
        elif "small" in vtitle:
            desired_for_var = base_images + small_images
        else:
            desired_for_var = base_images

        # Check existing links again after cleanup
        current_linked_ids = set(l[0] for l in run_sql(f"SELECT image_id FROM product_variant_product_image WHERE variant_id = '{vid}';", is_remote=is_remote))
        for url in desired_for_var:
            img_id = url_to_id[url]
            if img_id not in current_linked_ids:
                link_id = "pvpi_" + uuid.uuid4().hex.upper()[:24]
                run_sql(f"INSERT INTO product_variant_product_image (id, variant_id, image_id, created_at, updated_at) VALUES ('{link_id}', '{vid}', '{img_id}', NOW(), NOW());", is_remote=is_remote)
                print(f"  Linked {url} ({img_id}) to variant {vtitle}")

    print(f"\n🎉 Successfully fixed all pro-comfort-gel-insoles images and variant links on {target_name}!")

if __name__ == "__main__":
    main()
