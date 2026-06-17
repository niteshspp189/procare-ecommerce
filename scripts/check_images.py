import os
import csv
import re

# Paths
BASE_DIR = "/mnt/ExtraStorage/Project-Files/session-2026/procare/ecomm"
SCRIPTS_DIR = os.path.join(BASE_DIR, "backend/src/scripts")
STOREFRONT_IMAGES_DIR = os.path.join(BASE_DIR, "storefront/public/images/products")

# Load CSV files
CSV_FILES = {
    "Phase_1.csv": "phase1",
    "Accessory_SHCR.csv": "accessory",
    "PENDING.csv": "accessory"
}

# The parsing logic from seed-csv-mrp.ts
def parse_product_and_variant(fullName):
    name = re.sub(r"\s+", " ", fullName).strip()
    lower = name.lower()

    if "shoe cream with applicator" in lower:
        variant = re.sub(r".*with applicator\s*-\s*", "", name, flags=re.IGNORECASE).strip()
        return "Pro Gold Color Shoe Cream with Applicator", variant
    if "shoe cream" in lower:
        variant_temp = re.sub(r".*shoe cream\s*-\s*", "", name, flags=re.IGNORECASE)
        variant = re.sub(r"45g(m)?", "", variant_temp, flags=re.IGNORECASE).strip()
        return "Pro Gold Color Shoe Cream", variant
    if "self-shine" in lower or "self shine" in lower:
        variant = re.sub(r".*self\s*shine\s*-\s*", "", name, flags=re.IGNORECASE).strip()
        return "Pro Gold Shine Self Shine", variant
    if "instant shiner" in lower or "instant shine" in lower:
        variant = re.sub(r".*instant\s*shiner?\s*-\s*", "", name, flags=re.IGNORECASE).strip()
        return "Pro Gold Shine Instant Shine", variant
    if "application brush" in lower:
        variant = "Dark" if "dark" in lower else "Light"
        return "Pro Application Brush", variant
    if "gloss brush" in lower:
        variant = "Dark" if "dark" in lower else "Light"
        return "Pro Gloss Brush", variant
    if "horse hair brush" in lower:
        variant = "Dark" if "dark" in lower else "Light"
        return "Pro Horse Hair Brush", variant
    if "suede brush rubber black" in lower:
        return "Pro Suede Brush", "Default"
    if "premium shoe tree" in lower:
        match = re.search(r"shoe tree\s*-?\s*(\d+/\d+)", name, re.IGNORECASE)
        variant = match.group(1) if match else "Default"
        return "PRO Premium Shoe Tree", variant
    if "shoe tree with spiral" in lower or "men shoe tree with spiral" in lower:
        match = re.search(r"spiral\s*(\d+[\/-]\d+)", name, re.IGNORECASE)
        variant = match.group(1) if match else "Default"
        return "PRO Accessories Men Shoe Tree With Spiral", variant
    if "ease memory foam" in lower:
        match = re.search(r"size\s*(\d+)", name, re.IGNORECASE)
        variant = f"Size {match.group(1)}" if match else "Default"
        return "PRO Insoles Ease Memory Foam", variant
    if "ease soft comfort" in lower:
        return "PRO Insoles Ease Soft", "Default"
    if "gel comfort foot bed" in lower:
        variant = "Large" if "large" in lower else "Small"
        return "PRO Comfort Gel Insoles", variant
    if "gel comfort air walk" in lower or "gel comfort airwalk" in lower:
        variant = "Large" if "large" in lower else "Small"
        return "PRO Comfort Air Walk Gel Insoles", variant
    if "gel comfort heel pad" in lower:
        variant = "Large" if "large" in lower else "Small"
        return "PRO insoles Gel Comfort Heel Pad", variant
    if "ease aloe vera" in lower:
        return "PRO Insoles Ease Aloe Vera", "Default"
    if "active cricket" in lower:
        match = re.search(r"size\s*(\d+-\d+)", name, re.IGNORECASE)
        variant = match.group(1) if match else "Default"
        return "PRO Insoles Active Cricket", variant
    if "active cycling" in lower:
        match = re.search(r"size\s*(\d+-\s*\d+)", name, re.IGNORECASE)
        variant = match.group(1).replace(" ", "") if match else "Default"
        return "PRO Insoles Active Cycling", variant
    if "active running" in lower:
        match = re.search(r"size\s*(\d+-\s*\d+)", name, re.IGNORECASE)
        variant = match.group(1).replace(" ", "") if match else "Default"
        return "PRO Insoles Active Running", variant
    if "ease heel liner" in lower:
        return "PRO Insole Ease Heel Liner", "Default"
    if "brush & pumice combo" in lower:
        return "Pro Essentials Brush & Pumice Combo Turqouise", "Default"
    if "double sided foot file pink" in lower:
        return "Pro Essentials Double sided Foot File Pink", "Default"
    if "double sided foot file pink" in lower:
        return "Pro Essentials Double sided Foot File Pink", "Default"
    if "double sided foot file purple" in lower:
        return "Pro Essentials Double sided Foot File Purple", "Default"
    if "dual action foot file" in lower:
        return "Pro Essentials Dual Action Foot File Turqouise", "Default"
    if "magic pedi roller pack black" in lower:
        return "PRO Essentials Magic Pedi Roller Pack Black", "Default"
    if "magic pedi roller" in lower:
        return "PRO Essentials Magic Pedi Roller", "Default"
    if "nail file" in lower:
        return "Pro Essentials Nail File Turqouise", "Default"
    if "nail buffer" in lower:
        return "Pro Essentials Nail Buffer Turqouise", "Default"
    if "nail clipper" in lower:
        return "Pro Essentials Nail Clipper Turqouise", "Default"
    if "smooth feet pumice" in lower:
        return "Pro Essentials Smooth Feet Pumice Turqouise", "Default"
    if "leather moisturize" in lower or "leather moisturizer" in lower:
        return "Pro Gold Care Leather Moisturizer", "Neutral"
    if "power sneaker cleaner" in lower or "sneaker cleaner" in lower:
        return "Pro Gold Clean Power Cleaning Shampoo", "Neutral"
    if "clean power cleaner" in lower:
        return "PRO GOLD Sneaker Cleaning Kit (Shampoo + Mini Brush)", "Neutral"
    if "clean sneaker wipes" in lower:
        return "PRO GOLD Sneaker Wipes – Pack of 30", "Neutral"
    if "sports & sneaker cleaning kit" in lower:
        return "PRO GOLD SPORTS & SNEAKER CLEANING KIT", "Default"
    if "foam cleaner" in lower:
        return "PRO GOLD Foam Cleaner", "Neutral"
    if "shoe deo" in lower:
        return "PRO GOLD Shoe Deo", "Default"
    if "nubuck 2 in 1" in lower or "nubuck 2in1" in lower:
        return "Pro Suede 2in1", "Default"
    if "perfect clean gel" in lower:
        return "Pro Clean Perfect Clean Gel 50ml Neutral", "Default"
    if "suede n nubuck spray" in lower or "renovator spray" in lower:
        return "PRO Suede and Nubuck Renovator Spray", "Default"
    if "hydroshield" in lower:
        return "PRO Hydroshield", "Default"
    if "color naivy white" in lower:
        return "Pro Color Naivy White 75ml White", "Default"
    if "premium sneaker care kit" in lower:
        return "PRO Premium Sneaker Care Kit", "Default"
    if "easy care combo pack" in lower:
        return "PRO Clean Easy Care Combo Pack Neutral", "Default"

    return name, "Default"

def get_folder_name(baseProductTitle):
    title = baseProductTitle.lower()
    if "applicator" in title: return "Shoe cream with applicator"
    if "color shoe cream" in title: return "Shoe Cream"
    if "self shine" in title: return "Self Shine"
    if "instant shine" in title: return "Instant Shine"
    if "leather moisturizer" in title: return "Leather Moisturize -Neutral"
    if "power cleaning shampoo" in title: return "Power Sneaker Cleaner -Neutral"
    if "sneaker cleaning kit" in title: return "PRO GOLD Clean Power Cleaner(Cleaning Shampoo & Mini Brush) -Neutral"
    if "sneaker wipes" in title: return "PRO GOLD Clean Sneaker Wipes-Pack of 30 -Neutral"
    if "foam cleaner" in title: return "Foam Cleaner -Neutral"
    if "shoe deo" in title: return "Shoe Deo"
    if "application brush" in title: return "Application Brush"
    if "gloss brush" in title: return "Gloss Brush"
    if "horse hair brush" in title: return "Horse hair Brush"
    if "suede brush" in title: return "Suede Brush"
    if "premium shoe tree" in title: return "Shoe Tree/Premium Shoe Tree"
    if "spiral" in title: return "Shoe Tree/hoe Tree With Spiral"
    if "nubuck 2in1" in title or "nubuck 2 in 1" in title or "suede 2in1" in title or "suede 2 in 1" in title: return "Nubuck 2 in 1 Neutral"
    if "perfect clean gel" in title: return "Perfect Clean Gel 50ml Neutral"
    if "suede and nubuck renovator" in title: return "Suede N Nubuck Spray 180 ml-Neutral"
    if "hydroshield" in title: return "New folder (2)"
    return ""

def resolve_image_path(csvImgName, folderName):
    if not csvImgName or not csvImgName.strip() or not folderName:
        return None
    clean = re.sub(r"\s+", " ", csvImgName).strip()
    norm = clean.lower()
    
    if norm == "pro gold shoe cream -light brown 2": clean = "PRO GOLD  Shoe Cream -Light Brown (2)"
    elif norm == "pro gold shoe cream -medium brown 2": clean = "PRO GOLD  Shoe Cream -Medium Brown (2)"
    elif norm == "pro gold shoe cream -dark brown 2": clean = "PRO GOLD  Shoe Cream -Dark Brown  (2)"
    elif norm == "pro gold shoe cream -tan 2": clean = "PRO GOLD  Shoe Cream -Tan (2)"
    elif norm == "pro gold shoe cream -mahogany 2": clean = "PRO GOLD  Shoe Cream -Mahogany (2)"
    elif norm == "pro gold shoe cream -blue 2": clean = "PRO GOLD  Shoe Cream -Blue (2)"
    elif norm == "pro gold shoe cream -white 2": clean = "PRO GOLD  Shoe Cream -White (2)"
    elif norm == "pro gold shoe cream -neutral 2": clean = "PRO GOLD  Shoe Cream -Neutral2"
    elif norm == "pro gold shoe cream -neutral": clean = "PRO GOLD  Shoe Cream -Neutral"
    elif norm == "pro gold shoe cream -black": clean = "PRO GOLD  Shoe Cream -Black"
    elif norm == "pro gold shoe cream -black 2" or norm == "pro gold shoe cream -black2": clean = "PRO GOLD  Shoe Cream -Black2"
    elif norm == "pro gold shoe cream -light brown": clean = "PRO GOLD  Shoe Cream -Light Brown"
    elif norm == "pro gold shoe cream -medium brown": clean = "PRO GOLD  Shoe Cream -Medium Brown"
    elif norm == "pro gold shoe cream -dark brown": clean = "PRO GOLD  Shoe Cream -Dark Brown"
    elif norm == "pro gold shoe cream -tan": clean = "PRO GOLD  Shoe Cream -Tan"
    elif norm == "pro gold shoe cream -cognac": clean = "PRO GOLD  Shoe Cream -Cognac"
    elif norm == "pro gold shoe cream -cognac 2" or norm == "pro gold shoe cream -cognac(2)": clean = "PRO GOLD  Shoe Cream -Cognac  (2)"
    elif norm == "pro gold shoe cream -mahogany": clean = "PRO GOLD  Shoe Cream -Mahogany"
    elif norm == "pro gold shoe cream -blue": clean = "PRO GOLD  Shoe Cream -Blue"
    elif norm == "pro gold shoe cream -white": clean = "PRO GOLD  Shoe Cream -White"
    
    elif norm == "pro gold shoe cream with applicator -neutral 2": clean = "Shoe Cream With Applicator -Neutral (2)"
    elif norm == "pro gold shoe cream with applicator -black 2": clean = "Shoe Cream With Applicator -Black (2)"
    elif norm == "pro gold shoe cream with applicator -light brown 2": clean = "Shoe Cream With Applicator -Light Brown (2)"
    elif norm == "pro gold shoe cream with applicator -neutral": clean = "Shoe Cream With Applicator -Neutral"
    elif norm == "pro gold shoe cream with applicator -black": clean = "Shoe Cream With Applicator -Black"
    elif norm == "pro gold shoe cream with applicator -light brown": clean = "Shoe Cream With Applicator -Light Brown"
    
    elif norm == "pro gold self shine -neutral2": clean = "Self Shine -Neutral  (2)"
    elif norm == "pro gold self shine -neutral": clean = "Self Shine -Neutral"
    elif norm == "pro gold self shine -black2": clean = "Self Shine -Black 2"
    elif norm == "pro gold self shine -black": clean = "Self Shine -Black"
    elif norm == "pro gold self shine -brown2": clean = "Self Shine -Brown  (2)"
    elif norm == "pro gold self shine -brown": clean = "Self Shine -Brown"
    
    elif norm == "pro gold instant shiner -neutral2": clean = "Instant Shiner -Neutral (2)"
    elif norm == "pro gold instant shiner -neutral": clean = "Instant Shiner -Neutral"
    elif norm == "pro gold instant shiner -black2": clean = "Instant Shiner -Black (2)"
    elif norm == "pro gold instant shiner -black": clean = "Instant Shiner -Black"
    elif norm == "pro gold instant shiner -brown2": clean = "Instant Shiner -Brown (2)"
    elif norm == "pro gold instant shiner -brown": clean = "Instant Shiner -Brown"
    
    elif norm == "suede n nubuck spray 180 ml-neutral 1": clean = "Suede N Nubuck Spray 180 ml-Neutral 1"
    elif norm == "suede n nubuck spray 180 ml-neutral 2": clean = "Suede N Nubuck Spray 180 ml-Neutral 2"
    
    elif norm == "application brush dark1": clean = "Application Brush Dark (1)"
    elif norm == "application brush dark2": clean = "Application Brush Dark (2)"
    elif norm == "application brush light1": clean = "Application Brush Light (1)"
    elif norm == "application brush light2": clean = "Application Brush Light (2)"
    
    elif norm == "horse hair brush dark1": clean = "Horse Hair Brush Dark (1)"
    elif norm == "horse hair brush dark2": clean = "Horse Hair Brush Dark (2)"
    elif norm == "horse hair brush light1": clean = "Horse Hair Brush Light (1)"
    elif norm == "horse hair brush light 2" or norm == "horse hair brush light2": clean = "Horse Hair Brush Light (2)"
    
    elif norm == "gloss brush dark1": clean = "Gloss Brush Dark (1)"
    elif norm == "gloss brush dark2": clean = "Gloss Brush Dark (2)"
    elif norm == "gloss brush light1": clean = "Gloss Brush Light (1)"
    elif norm == "gloss brush light2": clean = "Gloss Brush Light (2)"
    
    elif norm == "suede brush rubber black1": clean = "Suede Brush Rubber Black (1)"
    elif norm == "suede brush rubber black2": clean = "Suede Brush Rubber Black (2)"
    
    elif norm == "premium shoe tree 1": clean = "Premium Shoe Tree (1)"
    elif norm == "premium shoe tree 2": clean = "Premium Shoe Tree (2)"
    
    elif norm == "shoe tree with spiral": clean = "Shoe Tree With Spiral"
    elif norm == "shoe tree with spiral 2": clean = "Shoe Tree With Spiral (2)"
    
    elif norm == "hydroshield 180 ml-neutral 1": clean = "Hydroshield 180 ml-Neutral (1)"
    elif norm == "hydroshield 180 ml-neutral 2": clean = "Hydroshield 180 ml-Neutral (2)"
 
    elif norm == "nubuck 2 in 1 neutral 1": clean = "Nubuck 2 in 1 Neutral (1)"
    elif norm == "nubuck 2 in 1 neutral2" or norm == "nubuck 2 in 1 neutral 2": clean = "Nubuck 2 in 1 Neutral (2)"
 
    elif norm == "perfect clean gel 50ml neutral 1": clean = "Perfect Clean Gel 50ml Neutral (1)"
    elif norm == "perfect clean gel 50ml neutral 2": clean = "Perfect Clean Gel 50ml Neutral (2)"
 
    elif norm == "leather moisturize -neutral": clean = "Leather Moisturize -Neutral"
    elif norm == "leather moisturize -neutral 2": clean = "Leather Moisturize -Neutral (2)"
 
    elif norm == "power sneaker cleaner -neutral": clean = "Power Sneaker Cleaner -Neutral"
    elif norm == "power sneaker cleaner -neutral 2": clean = "Power Sneaker Cleaner -Neutral (2)"
 
    elif norm == "pro gold clean power cleaner(cleaning shampoo & mini brush) -neutral (1)" or norm == "pro gold clean power cleaner(cleaning shampoo & mini brush) -neutral":
        clean = "PRO GOLD Clean Power Cleaner(Cleaning Shampoo & Mini Brush) -Neutral (1)"
    elif norm == "pro gold clean power cleaner(cleaning shampoo & mini brush) -neutral (2)" or norm == "pro gold clean power cleaner(cleaning shampoo & mini brush) -neutral2":
        clean = "PRO GOLD Clean Power Cleaner(Cleaning Shampoo & Mini Brush) -Neutral (2)"
 
    elif norm == "pro gold clean sneaker wipes-pack of 30 -neutral": clean = "PRO GOLD Clean Sneaker Wipes-Pack of 30 -Neutral"
    elif norm == "pro gold clean sneaker wipes-pack of 30 -neutral 2" or norm == "pro gold clean sneaker wipes-pack of 30 -neutral2": clean = "PRO GOLD Clean Sneaker Wipes-Pack of 30 -Neutral 2"
 
    elif norm == "foam cleaner -neutral": clean = "Foam Cleaner -Neutral"
    elif norm == "foam cleaner -neutral 2": clean = "Foam Cleaner -Neutral (2)"
 
    elif norm == "pro gold shoe deo": clean = "Shoe Deo"
    elif norm == "pro gold shoe deo 2": clean = "Shoe Deo 2"
 
    return f"/images/products/{folderName}/{clean}.webp"

# Read and validate CSVs
for filename, format_type in CSV_FILES.items():
    filepath = os.path.join(SCRIPTS_DIR, filename)
    print(f"\n==========================================")
    print(f"📖 Checking CSV: {filename}")
    print(f"==========================================")
    if not os.path.exists(filepath):
        print(f"❌ File not found: {filepath}")
        continue
        
    with open(filepath, "r", encoding="utf-8") as f:
        # Skip header metadata lines if present
        lines = f.readlines()
        
    # Standard csv reader on lines from index 2 onwards
    reader = csv.reader(lines[2:])
    
    row_count = 0
    missing_count = 0
    success_count = 0
    
    for row in reader:
        if not row or len(row) < 5:
            continue
        name = row[2].strip()
        if not name or name == "Name Of Product":
            continue
            
        row_count += 1
        base, variant = parse_product_and_variant(name)
        folder = get_folder_name(base)
        
        # Determine image indexes based on format
        if format_type == "phase1":
            img_cols = [row[15], row[16], row[17], row[18]] if len(row) > 18 else []
        else:
            img_cols = [row[11], row[12], row[13], row[14]] if len(row) > 14 else []
            
        # Clean images list
        img_cols = [img.strip() for img in img_cols if img.strip()]
        
        if not img_cols:
            print(f"⚠️ Row {row_count}: Product '{name}' has NO image columns specified in CSV.")
            continue
            
        for idx, img_name in enumerate(img_cols):
            resolved = resolve_image_path(img_name, folder)
            if not resolved:
                print(f"❌ Row {row_count}: '{name}' - Image {idx+1} '{img_name}' could not be resolved (None returned).")
                missing_count += 1
                continue
                
            # Check local file
            local_rel_path = resolved.replace("/images/products/", "")
            local_full_path = os.path.join(STOREFRONT_IMAGES_DIR, local_rel_path)
            
            if os.path.exists(local_full_path):
                # Verify size
                sz = os.path.getsize(local_full_path)
                # print(f"  ✅ '{name}' -> {resolved} ({sz/1024:.1f} KB)")
                success_count += 1
            else:
                print(f"❌ Row {row_count}: '{name}' - Resolved to '{resolved}' but file NOT FOUND locally.")
                missing_count += 1

    print(f"📊 Summary for {filename}:")
    print(f"  Total processed variant rows: {row_count}")
    print(f"  Successfully verified image links: {success_count}")
    print(f"  Missing or broken image links: {missing_count}")
