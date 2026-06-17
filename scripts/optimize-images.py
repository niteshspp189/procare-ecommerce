import os
import shutil
from PIL import Image

# Directories
SOURCE_IMAGES_DIR = "product-data/june-17/Website-20260617T104551Z-3-001/Website"
SOURCE_ICONS_DIR = "product-data/june-17/procare-excel-icon"

DEST_IMAGES_DIR = "storefront/public/images/products"
DEST_ICONS_DIR = "storefront/public/images/icons"

MAX_DIMENSION = 1000
WEBP_QUALITY = 80

def setup_dirs():
    os.makedirs(DEST_IMAGES_DIR, exist_ok=True)
    os.makedirs(DEST_ICONS_DIR, exist_ok=True)

def copy_icons():
    print("🚀 Copying feature icons...")
    for item in os.listdir(SOURCE_ICONS_DIR):
        src_path = os.path.join(SOURCE_ICONS_DIR, item)
        if os.path.isfile(src_path) and item.endswith(".png"):
            dest_path = os.path.join(DEST_ICONS_DIR, item)
            shutil.copy2(src_path, dest_path)
            print(f"  Copied icon: {item}")

def optimize_product_images():
    print("🚀 Optimizing product images...")
    total_original_size = 0
    total_optimized_size = 0
    optimized_count = 0

    # Walk through the images directory
    for root, _, files in os.walk(SOURCE_IMAGES_DIR):
        for file in files:
            ext = os.path.splitext(file)[1].lower()
            if ext not in [".jpg", ".jpeg", ".png", ".tiff", ".bmp"]:
                continue

            src_path = os.path.join(root, file)
            
            # Recreate subdirectory structure in destination
            rel_dir = os.path.relpath(root, SOURCE_IMAGES_DIR)
            dest_dir = os.path.join(DEST_IMAGES_DIR, rel_dir)
            os.makedirs(dest_dir, exist_ok=True)

            # Change extension to .webp for the destination file
            file_no_ext = os.path.splitext(file)[0]
            dest_file = f"{file_no_ext}.webp"
            dest_path = os.path.join(dest_dir, dest_file)

            original_size = os.path.getsize(src_path)
            total_original_size += original_size

            try:
                # Open, resize, and convert
                with Image.open(src_path) as img:
                    # Convert to RGB mode if not already (RGBA to RGB handling)
                    if img.mode in ("RGBA", "LA", "P"):
                        background = Image.new("RGB", img.size, (255, 255, 255))
                        # Use paste with alpha mask if RGBA
                        if img.mode == "RGBA":
                            background.paste(img, mask=img.split()[3])
                        else:
                            background.paste(img)
                        img = background
                    elif img.mode != "RGB":
                        img = img.convert("RGB")

                    # Resize if width or height exceeds MAX_DIMENSION
                    w, h = img.size
                    if w > MAX_DIMENSION or h > MAX_DIMENSION:
                        if w > h:
                            new_w = MAX_DIMENSION
                            new_h = int(h * (MAX_DIMENSION / w))
                        else:
                            new_h = MAX_DIMENSION
                            new_w = int(w * (MAX_DIMENSION / h))
                        
                        # Use Resampling.LANCZOS if available, fallback to ANTIALIAS
                        try:
                            resampling = Image.Resampling.LANCZOS
                        except AttributeError:
                            resampling = Image.ANTIALIAS
                            
                        img = img.resize((new_w, new_h), resampling)
                        # print(f"    Resized: {file} ({w}x{h} -> {new_w}x{new_h})")

                    # Save as WebP
                    img.save(dest_path, "WEBP", quality=WEBP_QUALITY)

                optimized_size = os.path.getsize(dest_path)
                total_optimized_size += optimized_size
                optimized_count += 1
                
                pct = (1 - (optimized_size / original_size)) * 100
                print(f"  Optimized: {os.path.join(rel_dir, file)} -> {dest_file} ({original_size/1024/1024:.2f}MB to {optimized_size/1024:.1f}KB, -{pct:.1f}%)")

            except Exception as e:
                print(f"  ❌ Failed to process {src_path}: {e}")

    print("==========================================")
    print(f"📊 Optimization Summary:")
    print(f"  Processed Images: {optimized_count}")
    print(f"  Original Size: {total_original_size/1024/1024:.2f} MB")
    print(f"  Optimized Size: {total_optimized_size/1024/1024:.2f} MB")
    if total_original_size > 0:
        overall_pct = (1 - (total_optimized_size / total_original_size)) * 100
        print(f"  Overall Space Saved: {overall_pct:.2f}%")
    print("==========================================")

if __name__ == "__main__":
    setup_dirs()
    copy_icons()
    optimize_product_images()
