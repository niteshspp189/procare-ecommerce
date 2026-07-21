import os
import re
import json
import subprocess
import sys

LOCAL_CMD = ["docker", "exec", "-i", "procare_postgres", "psql", "-U", "procare_ecommerce", "-d", "procare_ecommerce", "-t", "-A"]
REMOTE_DB_URL = "postgres://propremiumcare:Mvsc2026##56@database-1.c5wkcis2qg1p.ap-south-1.rds.amazonaws.com:5432/prepreimiumcare_ecommerce"
REMOTE_CMD = ["ssh", "procare", f'docker exec -i procare_postgres psql "{REMOTE_DB_URL}" -t -A']

def run_sql(sql, is_remote=False):
    cmd = REMOTE_CMD if is_remote else LOCAL_CMD
    res = subprocess.run(cmd, input=sql, text=True, check=True, capture_output=True)
    return res.stdout.strip()

# Perfect product mapping dictionary with exact metadata, descriptions & titles
PERFECT_PRODUCT_DATA = {
    "pro-gold-shine-instant-shine": {
        "title": "Pro Gold Instant Shine",
        "description": "Instant & long-lasting shoe shine liquid polish. Delivers immediate glossy finish in seconds with built-in sponge applicator for smooth, quick, and mess-free application.",
        "key_benefits": (
            "**Instant & Long-Lasting Shine in Seconds**: Delivers immediate glossy finish with extended shine.\n"
            "**Effortless Sponge**: Built-in sponge allows smooth, quick, and mess-free application.\n"
            "**Restores Color, Gloss & Finish**: Revives dull and faded leather, bringing back a rich and polished look.\n"
            "**No Drips. No Streaks.**: Special controlled-flow formula ensures even coverage without residue marks.\n"
            "**100+ Applications**: Long-lasting pack designed for extended usage and value for money."
        ),
        "how_to_use": (
            "Step 1: Clean the Surface\nRemove dust and dirt before application.\n"
            "Step 2: Apply Sponge\nGently press and glide the sponge evenly across the surface.\n"
            "Step 3: Let It Set\nAllow a few minutes for the shine to settle.\n"
            "Step 4: Ready to Wear\nNo buffing required. Instant shine achieved."
        ),
        "product_specifications": {
            "Product Type": "Instant Shoe Shine Liquid",
            "Suitable For": "Leather & Synthetic Leather Products",
            "Product Includes": "1 × Quick Shine Sponge",
            "Net Volume": "1 pc (100+ Applications)",
            "Safety": "Non-Toxic & Eco-Friendly"
        }
    },
    "pro-gold-shine-self-shine": {
        "title": "Pro Gold Self Shine",
        "description": "Self-shine liquid polish for leather and synthetic footwear. Restores rich color depth and natural gloss with no brushing or buffing required.",
        "key_benefits": (
            "**Self Shine – No Buffing Required**: Instant shine formula that delivers a polished finish without the need for brushing or buffing.\n"
            "**Restores Color & Shine**: Revives dull and faded leather, bringing back rich color depth and natural gloss.\n"
            "**Nourishes & Protects Leather**: Conditions the surface to prevent dryness and cracking while forming a protective layer.\n"
            "**Spill-Proof Sponge Applicator**: Convenient built-in applicator ensures smooth, controlled, and mess-free application."
        ),
        "how_to_use": (
            "Step 1: Clean the Surface\nRemove dust and dirt with a dry cloth.\n"
            "Step 2: Shake Well Before Use\nEnsures even distribution of wax and conditioning agents.\n"
            "Step 3: Apply Evenly\nGently glide the sponge applicator across the surface in smooth strokes.\n"
            "Step 4: Allow to Dry\nLet it settle for a few minutes.\n"
            "Step 5: Ready to Use\nNo buffing required — instant self-shine finish achieved."
        ),
        "product_specifications": {
            "Product Type": "Self-Shine Liquid Polish",
            "Suitable For": "Leather & Synthetic Leather Products",
            "Product Includes": "1 × Self Shine Bottle with Sponge Applicator",
            "Net Volume": "75 ml",
            "Key Ingredients": "Carnauba Wax, Beeswax, Conditioning Agents"
        }
    },
    "pro-gold-shoe-deo": {
        "title": "Pro Gold Shoe Deo",
        "description": "Long-lasting shoe deodorizer spray that eliminates unpleasant odors and fights odor-causing bacteria & fungi inside footwear.",
        "key_benefits": (
            "**Long-Lasting Freshness**: Keeps shoes smelling fresh for hours with a powerful odor-control formula.\n"
            "**Fights Fungi & Bacteria**: Helps combat odor-causing bacteria and fungi inside shoes.\n"
            "**Instant Fresh Effect**: Quick spray action refreshes sneakers and shoes within seconds.\n"
            "**Eliminates Bad Odors**: Neutralizes unpleasant smells instead of just masking them."
        ),
        "how_to_use": (
            "Step 1: Shake Well Before Use\nEnsure proper mixing of the formula.\n"
            "Step 2: Spray Inside the Shoe\nHold the bottle upright and spray evenly inside each shoe.\n"
            "Step 3: Let It Dry\nAllow shoes to air dry for a few minutes before wearing.\n"
            "Step 4: Use Regularly\nFor best results, use after every wear."
        ),
        "product_specifications": {
            "Product Type": "Shoe Deodorizer Spray",
            "Suitable For": "Sneakers, Shoes, Canvas, Textiles, Synthetic Materials",
            "Product Includes": "1 × Shoe Deo Spray",
            "Net Volume": "150 ml",
            "Safety": "Non-Toxic & Eco-Friendly"
        }
    },
    "pro-gold-suede-n-nubuck-foam-cleaner": {
        "title": "Pro Gold Suede n Nubuck Foam Cleaner",
        "description": "Instant foaming cleaner specially formulated for delicate suede and nubuck. Penetrates deep to remove surface dirt while restoring natural material texture.",
        "key_benefits": (
            "**Specialized for Suede & Nubuck**: Designed specifically to clean delicate suede and nubuck shoes, bags, and accessories.\n"
            "**Instant Foam Action**: Rich foam penetrates gently to loosen dirt and fight stubborn stains without soaking the material.\n"
            "**Advanced Neutral Formula**: Cleans effectively without altering the original color or finish of leather.\n"
            "**Gentle Yet Effective Cleaning**: Removes surface dirt, marks, and stains while preserving the natural nap of suede."
        ),
        "how_to_use": (
            "Step 1: Dry Brush First\nUse a suede brush to remove loose dust and dirt.\n"
            "Step 2: Apply Foam\nDispense foam onto a clean brush (avoid over-wetting).\n"
            "Step 3: Gently Clean\nWork lightly in circular motions over the stained area.\n"
            "Step 4: Wipe Excess\nBlot with a dry cloth to remove excess foam.\n"
            "Step 5: Air Dry Naturally\nLet the material dry completely away from direct heat.\n"
            "Step 6: Restore Texture\nAfter drying, brush suede gently to lift the nap."
        ),
        "product_specifications": {
            "Product Type": "Foam Cleaner",
            "Suitable For": "Suede & Nubuck Leather",
            "Product Includes": "1 × Foam Cleaner Bottle",
            "Net Volume": "150 ml",
            "Formula Type": "Color-Safe Neutral Formula"
        }
    },
    "pro-gold-sneaker-cleaning-kit": {
        "title": "Pro Gold Sneaker Cleaning Kit",
        "description": "Complete sneaker care kit including power cleaning shampoo and scratch-resistant wooden mini brush for deep cleaning uppers and soles.",
        "key_benefits": (
            "**Complete Sneaker Cleaning Kit**: Includes power cleaning shampoo + premium wooden brush for total sneaker care in one pack.\n"
            "**Quick Clean, Quick Dry Shampoo**: Fast-acting formula cleans efficiently and dries quickly without over-wetting material.\n"
            "**Instant Foam Deep Cleaning**: Creates rich foam that penetrates deep to remove dirt, stains, and grime from uppers and soles.\n"
            "**Scratch-Resistant Wooden Brush**: Durable wooden handle with mixed bristles designed to clean effectively without damaging surfaces."
        ),
        "how_to_use": (
            "Step 1: Remove Loose Dirt\nBrush off surface dust and mud before applying.\n"
            "Step 2: Apply Shampoo\nPump out some foam directly on cloth or brush.\n"
            "Step 3: Work Into Foam\nGently scrub & spread evenly in circular motion.\n"
            "Step 4: Wipe Clean\nRemove excess foam with a clean damp cloth.\n"
            "Step 5: Air Dry\nLet the product dry naturally. Avoid direct heat."
        ),
        "product_specifications": {
            "Product Type": "Sneaker Cleaning Kit",
            "Suitable For": "Sneakers, Coloured Leather, Textiles, Mesh, Canvas, Synthetic Materials",
            "Product Includes": "1 × Cleaning Shampoo, 1 × Mini Wooden Brush",
            "Net Volume": "150 ml",
            "Brush Material": "Wooden Handle with Mixed Bristles"
        }
    },
    "pro-perfect-clean-gel": {
        "title": "Pro Perfect Clean Gel",
        "description": "Gentle leather cleaning gel formulated to remove dirt and restore original luster without leaving sticky residue.",
        "key_benefits": (
            "**Deep Cleaning Action**: Effectively removes dirt, oil, and surface grime from leather articles.\n"
            "**Nourishing Gel Formula**: Keeps leather supple, soft, and moisturized.\n"
            "**Safe for Multi-Leather Types**: Ideal for smooth leather, synthetic leather, and accessories."
        ),
        "how_to_use": (
            "Step 1: Clean Surface\nWipe off surface dust with a dry cloth.\n"
            "Step 2: Apply Gel\nApply a small amount of gel on a soft cloth and spread evenly.\n"
            "Step 3: Buff to Polish\nAllow 2-3 minutes to dry, then buff gently to a smooth finish."
        ),
        "product_specifications": {
            "Product Type": "Leather Cleaning Gel",
            "Suitable For": "Leather & Synthetic Leather",
            "Net Volume": "50 ml"
        }
    },
    "pro-navy-white": {
        "title": "Pro Navy White",
        "description": "Color restoring liquid polish specially formulated for navy and white leather and canvas footwear.",
        "key_benefits": (
            "**Restores White & Navy Gloss**: Revives bright white and deep navy hues effortlessly.\n"
            "**Easy Applicator**: Built-in sponge applicator for clean, even coverage.\n"
            "**Protective Layer**: Guards against scuffs, yellowing, and surface marks."
        ),
        "how_to_use": (
            "Step 1: Clean Surface\nRemove loose dust and dirt.\n"
            "Step 2: Apply Evenly\nPress sponge and glide over discolored areas.\n"
            "Step 3: Allow to Dry\nLet dry for 5 minutes before wearing."
        ),
        "product_specifications": {
            "Product Type": "Color Restorer Liquid",
            "Suitable For": "Navy & White Leather, Canvas, Sneakers",
            "Net Volume": "75 ml"
        }
    },
    "pro-insoles-active-cycling": {
        "title": "Pro Insoles Active Cycling",
        "description": "Ergonomic cycling insoles engineered for power transfer, arch stability, and foot pressure distribution during rides.",
        "key_benefits": (
            "**Enhanced Power Transfer**: Firm arch support core maximizes pedaling efficiency.\n"
            "**Shock & Pressure Relief**: Reduces foot numbness and joint pressure on long rides.\n"
            "**Breathable & Moisture Wicking**: Keeps feet cool and dry inside cycling shoes."
        ),
        "how_to_use": (
            "Step 1: Remove Old Insole\nTake out current shoe insole.\n"
            "Step 2: Trim to Fit\nCompare with old insole and trim along guide lines if necessary.\n"
            "Step 3: Insert & Enjoy\nPlace flat inside cycling shoes with fabric side up."
        ),
        "product_specifications": {
            "Product Type": "Cycling Performance Insole",
            "Suitable For": "Cycling Shoes, Athletic Footwear",
            "Support Type": "Anatomical Arch Support Core",
            "Net Content": "1 Pair"
        }
    },
    "pro-insoles-active-cricket": {
        "title": "Pro Insoles Active Cricket",
        "description": "High-impact athletic insoles engineered for cricket players to absorb shock during bowling, fielding, and running.",
        "key_benefits": (
            "**Maximum Shock Absorption**: Heavy-duty cushioning protects heels and knees from high-impact landings.\n"
            "**Arch & Heel Stability**: Keeps foot aligned during quick direction changes on field.\n"
            "**Durable Construction**: Built to endure rigorous training sessions and matches."
        ),
        "how_to_use": (
            "Step 1: Remove Existing Insole\nTake out current shoe insole.\n"
            "Step 2: Trim if Needed\nTrim front edge to match existing insole contour.\n"
            "Step 3: Insert in Cricket Spikes/Shoes\nEnsure insole lies flat inside footwear."
        ),
        "product_specifications": {
            "Product Type": "Cricket Performance Insole",
            "Suitable For": "Cricket Shoes, Spikes, Training Shoes",
            "Net Content": "1 Pair"
        }
    },
    "pro-insoles-active-running": {
        "title": "Pro Insoles Active Running",
        "description": "Lightweight running insoles designed to reduce runner foot fatigue, absorb heel strike impact, and improve stride posture.",
        "key_benefits": (
            "**Energy Return Cushioning**: High-density foam rebounds energy with every stride.\n"
            "**Joint Impact Reduction**: Reduces strain on ankles, shins, and knees.\n"
            "**Anti-Slip Fabric Surface**: Prevents foot sliding inside running shoes."
        ),
        "how_to_use": (
            "Step 1: Remove Old Insole\nRemove original shoe insoles.\n"
            "Step 2: Trim to Size\nTrim along toe area using old insole as template.\n"
            "Step 3: Insert & Run\nInsert firmly into running or sports shoes."
        ),
        "product_specifications": {
            "Product Type": "Running Performance Insole",
            "Suitable For": "Running Shoes, Trainers, Athletic Footwear",
            "Net Content": "1 Pair"
        }
    },
    "pro-insoles-memory-foam": {
        "title": "Pro Insoles Memory Foam",
        "description": "Ultra-soft memory foam insoles that contour to the natural shape of your foot for all-day custom comfort.",
        "key_benefits": (
            "**Custom Contour Cushioning**: High-grade memory foam adapts to your unique foot shape.\n"
            "**Pressure Relief**: Distributes weight evenly to alleviate foot soreness and fatigue.\n"
            "**All-Day Standing Comfort**: Ideal for work boots, casual shoes, and daily walking."
        ),
        "how_to_use": (
            "Step 1: Trim to Size\nCut along marked shoe size lines on bottom.\n"
            "Step 2: Insert into Footwear\nPlace memory foam insole fabric side up inside shoe."
        ),
        "product_specifications": {
            "Product Type": "Memory Foam Insole",
            "Suitable For": "Casual Shoes, Work Boots, Sneakers",
            "Net Content": "1 Pair"
        }
    },
    "pro-shoe-tree-with-spiral": {
        "title": "Pro Shoe Tree With Spiral",
        "description": "Made from 100% genuine natural wood with durable spiral spring mechanism to preserve shoe shape, prevent leather creases, and absorb interior moisture.",
        "key_benefits": (
            "**100% Genuine Natural Wood**: Crafted from high-grade natural wood to absorb moisture and odor.\n"
            "**Prevents Creases & Cracks**: Maintains original leather shape and prevents toe cap wrinkling.\n"
            "**Flexible Spiral Spring**: Fits smoothly into a wide variety of footwear styles."
        ),
        "how_to_use": (
            "Step 1: Insert Toe Block\nSlide front wooden block deep into toe of shoe.\n"
            "Step 2: Compress Spiral\nFlex spring stem and place rear heel ball against back counter."
        ),
        "product_specifications": {
            "Product Type": "Spiral Spring Shoe Tree",
            "Material": "100% Natural Wood & Steel Spring",
            "Suitable For": "Leather Shoes, Boots, Sneakers",
            "Net Content": "1 Pair"
        }
    },
    "pro-premium-shoe-tree": {
        "title": "Pro Premium Shoe Tree",
        "description": "Made from 100% genuine premium cedar wood with full heel & brass hardware to preserve shape, extend leather life, and absorb moisture.",
        "key_benefits": (
            "**100% Genuine Premium Wood**: Premium solid wood absorbs sweat, moisture, and keeps shoes fresh.\n"
            "**Full Heel Contour**: Preserves entire shoe structure from heel to toe cap.\n"
            "**Dual Brass Tube Spring**: Provides sturdy longitudinal expansion for wrinkle-free leather."
        ),
        "how_to_use": (
            "Step 1: Insert Front Section\nPush front section into toe box.\n"
            "Step 2: Lock Heel Section\nPress down heel piece firmly into heel counter."
        ),
        "product_specifications": {
            "Product Type": "Premium Cedar Shoe Tree",
            "Material": "100% Premium Wood & Brass Hardware",
            "Suitable For": "Dress Shoes, Oxfords, Boots",
            "Net Content": "1 Pair"
        }
    }
}

def clean_variant_color_images(is_remote=False):
    sql = "SELECT id, title, metadata FROM product_variant WHERE deleted_at IS NULL;"
    raw = run_sql(sql, is_remote=is_remote)
    for line in raw.split("\n"):
        if not line.strip(): continue
        parts = line.split("|")
        vid = parts[0]
        vtitle = parts[1].strip()
        meta_str = parts[2] if len(parts) > 2 else "{}"
        try:
            meta = json.loads(meta_str) if meta_str else {}
        except:
            meta = {}

        if not meta: continue
        
        # If variant is Black or Brown, filter out 'Neutral' images from variant metadata
        if vtitle.lower() in ["black", "brown", "blue", "tan", "white", "mahogany", "cognac"]:
            changed = False
            image_keys = [k for k in meta.keys() if k.startswith("image_")]
            for ik in image_keys:
                img_url = str(meta[ik])
                # Check if image URL contains 'Neutral' when variant is non-neutral
                if "Neutral" in img_url or "neutral" in img_url:
                    del meta[ik]
                    changed = True
            
            if changed:
                # Re-index remaining images image_1, image_2...
                sorted_img_vals = [meta[k] for k in sorted([k for k in meta.keys() if k.startswith("image_")])]
                for k in list(meta.keys()):
                    if k.startswith("image_"):
                        del meta[k]
                for idx, url in enumerate(sorted_img_vals, 1):
                    meta[f"image_{idx}"] = url

                json_meta_sql = json.dumps(meta).replace("'", "''")
                update_sql = f"UPDATE product_variant SET metadata = '{json_meta_sql}'::jsonb WHERE id = '{vid}';"
                run_sql(update_sql, is_remote=is_remote)
                print(f"  🎨 Cleaned cross-variant images for: {vtitle} (Variant ID: {vid})")

def apply_perfect_updates(is_remote=False):
    target = "Production RDS" if is_remote else "Local DB"
    print(f"==================================================")
    print(f" Applying Perfect Data & Formatting for {target}")
    print(f"==================================================")

    # 1. Standardize titles
    title_cleanups = [
        ("Pro Insoles Active Cycling%", "Pro Insoles Active Cycling"),
        ("Pro Insoles Active Cricket%", "Pro Insoles Active Cricket"),
        ("Pro Insoles Active Running%", "Pro Insoles Active Running"),
        ("Pro Insoles Memory Foam%", "Pro Insoles Memory Foam"),
        ("Pro Shoe Tree With Spiral%", "Pro Shoe Tree With Spiral"),
    ]
    for pattern, new_t in title_cleanups:
        sql = f"UPDATE product SET title = '{new_t}' WHERE title LIKE '{pattern}' AND deleted_at IS NULL;"
        run_sql(sql, is_remote=is_remote)

    # 2. Update specific targeted products
    for handle, data in PERFECT_PRODUCT_DATA.items():
        sql = f"SELECT id, title, metadata FROM product WHERE (handle = '{handle}' OR title ILIKE '%{data['title']}%') AND deleted_at IS NULL LIMIT 1;"
        raw = run_sql(sql, is_remote=is_remote)
        if not raw:
            print(f"  ⚠️ Product not found: {handle} / {data['title']}")
            continue

        parts = raw.split("\n")[0].split("|")
        pid = parts[0]
        curr_title = parts[1]
        meta_str = parts[2] if len(parts) > 2 else "{}"
        try:
            meta = json.loads(meta_str) if meta_str else {}
        except:
            meta = {}

        # Update metadata fields
        meta["key_benefits"] = data["key_benefits"]
        meta["how_to_use"] = data["how_to_use"]
        meta["product_specifications"] = data["product_specifications"]
        if "Suitable For" in data["product_specifications"]:
            meta["suitable_for"] = data["product_specifications"]["Suitable For"]

        json_meta_sql = json.dumps(meta).replace("'", "''")
        clean_desc_sql = data["description"].replace("'", "''")
        clean_title_sql = data["title"].replace("'", "''")

        update_sql = f"UPDATE product SET title = '{clean_title_sql}', description = '{clean_desc_sql}', metadata = '{json_meta_sql}'::jsonb WHERE id = '{pid}';"
        run_sql(update_sql, is_remote=is_remote)
        print(f"  ✅ Perfectly updated: {data['title']}")

    # 3. Clean color variant images
    clean_variant_color_images(is_remote=is_remote)

    print(f"Finished updating {target}.\n")

if __name__ == "__main__":
    is_remote = "--remote" in sys.argv
    apply_perfect_updates(is_remote=False)
    if is_remote:
        apply_perfect_updates(is_remote=True)
