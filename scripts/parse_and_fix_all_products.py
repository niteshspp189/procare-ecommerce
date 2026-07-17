"""
parse_and_fix_all_products.py
Re-parses Website_product_pages.txt with a CLEAN state-machine that:
  1. Strips "Add Mnemonics:" lines and emoji noise (📦 🧴 🧼 ⚙️ etc.)
  2. Correctly separates Key Benefits, How To Use, Specifications
  3. Pairs heading lines with description lines (bold+plain pattern)
  4. Updates local + remote RDS databases
"""
import re
import json
import subprocess
import sys

REMOTE_DB_URL = "postgres://propremiumcare:Mvsc2026##56@database-1.c5wkcis2qg1p.ap-south-1.rds.amazonaws.com:5432/prepreimiumcare_ecommerce"
TXT_PATH = "latest/client_docs/Website_product_pages.txt"

# ─── Noise patterns to strip ─────────────────────────────────────────────────
NOISE_PATTERNS = [
    r'^Add Mnemonics.*$',
    r'^[📦🧴🧼⚙️]+\s*$',       # lone emoji lines
    r'^Top of Form$',
    r'^Bottom of Form$',
    r'^________________+$',
    r'^\s*\.\s*$',              # lone dot lines
]
NOISE_RE = re.compile('|'.join(NOISE_PATTERNS), re.IGNORECASE)

# ─── Section header patterns ──────────────────────────────────────────────────
KB_RE  = re.compile(r'^[📦🧴🧼⚙️]*\s*Key Benefits.*$', re.IGNORECASE)
HTU_RE = re.compile(r'^[📦🧴🧼⚙️]*\s*How\s+[Tt]o\s+[Uu]se.*$', re.IGNORECASE)
SPEC_RE = re.compile(r'^[📦⚙️]*\s*(Specifications|Product Details|Product Specifications|Feature\s+Details).*$', re.IGNORECASE)
STEP_RE    = re.compile(r'^Step\s+\d+[\s:].+', re.IGNORECASE)
NUM_STEP_RE = re.compile(r'^\d+[\.)\s]\s*.+')   # matches "1. text" or "1) text"
SPEC_KV_RE = re.compile(r'^(.+?)\s{2,}\s*(.+)$')  # two or more spaces = key  value


def clean_line(line):
    """Remove bullets and leading numbers."""
    return re.sub(r'^[\u2022\-\*\+]\s*|^\d+[\.\)]\s*', '', line).strip()


def is_noise(line):
    return bool(NOISE_RE.match(line.strip()))


def is_kb_header(line):
    return bool(KB_RE.match(line.strip()))


def is_htu_header(line):
    return bool(HTU_RE.match(line.strip()))


def is_spec_header(line):
    return bool(SPEC_RE.match(line.strip()))


def looks_like_product_title(line, next_lines):
    """Line is a product title if a Key Benefits header appears within 10 non-empty lines."""
    if not line or line.startswith('\t') or is_noise(line):
        return False
    stripped = line.strip()
    if not stripped or len(stripped) < 3:
        return False
    # Reject numbered step lines (1. text  or  1) text)
    if NUM_STEP_RE.match(stripped):
        return False
    # Reject lines starting with Recommended Use, Tip:, Suitable For etc.
    if re.match(r'^(Recommended Use|Tip:|Suitable For|Product|Key Ingredients|Net |Brush Material)', stripped, re.IGNORECASE):
        return False
    if STEP_RE.match(stripped):
        return False
    if is_kb_header(stripped) or is_htu_header(stripped) or is_spec_header(stripped):
        return False
    # Check lookahead
    count = 0
    for nl in next_lines:
        ns = nl.strip()
        if not ns:
            continue
        if is_kb_header(ns):
            return True
        count += 1
        if count >= 10:
            break
    return False


def parse_benefits(lines):
    """
    Parse key benefits. Two formats exist in the document:
    Format A (old): alternating heading / description lines
        Restores Original Color
        Revives faded leather...
    Format B (new): bullet lines starting with * containing both heading and description
        * Removes Calluses & Hard Skin – Effectively exfoliates...
    """
    cleaned = [clean_line(l) for l in lines if clean_line(l)]
    if not cleaned:
        return ''

    # Detect Format B: most lines contain ' – ' or ' - ' separating heading from desc
    dash_count = sum(1 for l in cleaned if ' – ' in l or ' - ' in l)
    if dash_count >= len(cleaned) * 0.4:  # majority have dashes = Format B
        return '\n'.join(cleaned)

    # Format A: pair heading + description lines
    paired = []
    i = 0
    while i < len(cleaned):
        heading = cleaned[i]
        desc = cleaned[i+1] if i+1 < len(cleaned) else ''
        # heuristic: heading is short (<=8 words), no period, desc is longer sentence
        if (len(heading.split()) <= 8
                and not heading.endswith('.')
                and desc
                and len(desc.split()) > 3):
            paired.append(f"{heading} – {desc}")
            i += 2
        else:
            paired.append(heading)
            i += 1
    return '\n'.join(paired)


def parse_htu(lines):
    """Extract step-by-step instructions, handling both Step X: and 1. 2. 3. formats."""
    steps = []
    cleaned = [l for l in lines if l.strip() and not is_noise(l)]
    i = 0
    while i < len(cleaned):
        line = cleaned[i].strip()
        # "Step X: title" format — next line may be the description
        if STEP_RE.match(line):
            nxt = cleaned[i+1].strip() if i+1 < len(cleaned) else ''
            if nxt and not STEP_RE.match(nxt) and not NUM_STEP_RE.match(nxt):
                steps.append(f"{line}\n{nxt}")
                i += 2
            else:
                steps.append(line)
                i += 1
        # "1. text" or "1) text" numbered list format (whole instruction on one line)
        elif NUM_STEP_RE.match(line):
            steps.append(line)
            i += 1
        elif re.match(r'^(Recommended Use|Tip)[:.]', line, re.IGNORECASE):
            steps.append(line)
            i += 1
        elif line.startswith('To replace'):
            # multi-line sub-section e.g. roller replacement
            steps.append(line)
            i += 1
        else:
            i += 1
    return '\n'.join(steps)


def parse_specs(lines):
    """Parse spec key-value pairs from tab, colon, or wide-space separated lines."""
    specs = {}
    suitable_for = None
    i = 0
    raw = [l.strip() for l in lines if l.strip() and not is_noise(l)]
    
    while i < len(raw):
        line = raw[i]
        if ':' in line and not STEP_RE.match(line):
            k, v = line.split(':', 1)
            k = k.strip()
            v = v.strip()
            if not v and i+1 < len(raw) and not ':' in raw[i+1]:
                v = raw[i+1].strip()
                i += 1
            specs[k] = v
            if k.lower() == 'suitable for':
                suitable_for = v
        elif '\t' in line:
            parts = [p.strip() for p in line.split('\t') if p.strip()]
            if len(parts) >= 2:
                k, v = parts[0], parts[1]
                specs[k] = v
                if k.lower() == 'suitable for':
                    suitable_for = v
            elif len(parts) == 1:
                # next line might be the value
                k = parts[0]
                if i+1 < len(raw):
                    v = raw[i+1].strip()
                    specs[k] = v
                    if k.lower() == 'suitable for':
                        suitable_for = v
                    i += 1
        i += 1
    return specs, suitable_for


# ─── DB helper ────────────────────────────────────────────────────────────────
def psql_run(cmd_list, sql):
    result = subprocess.run(cmd_list, input=sql, text=True, capture_output=True)
    if result.returncode != 0:
        print(f"  SQL ERROR: {result.stderr[:200]}")
    return result.stdout


def update_product(cmd_list, product_id, metadata):
    meta_str = json.dumps(metadata, ensure_ascii=False).replace("'", "''")
    sql = f"UPDATE product SET metadata = '{meta_str}'::jsonb WHERE id = '{product_id}';"
    psql_run(cmd_list, sql)


# ─── Product-to-DB title mapping ─────────────────────────────────────────────
TITLE_MAP = {
    'pro gold color shoe cream': 'Pro Gold Shoe Cream',
    'pro gold care leather moisturizer ok': 'Pro Gold Leather Moisturizer',
    'pro gold care leather moisturizer': 'Pro Gold Leather Moisturizer',
    'key benefits – pro gold color shoe cream with applicator': 'Pro Gold Shoe Cream with Applicator',
    'pro gold clean power cleaning shampoo ok': 'Pro Gold Power Cleaning Shampoo',
    'pro gold shine instant shine': 'Pro Gold Instant Shine',
    'pro gold shine self shine': 'Pro Gold Self Shine',
    'pro gold sneaker cleaning kit not-ok': 'Pro Gold Sneaker Cleaning Kit',
    'pro gold sneaker cleaning kit': 'Pro Gold Sneaker Cleaning Kit',
    'pro gold sneaker wipes – pack of 30 not-ok': 'Pro Gold Sneaker Wipes – Pack of 30',
    'pro gold sneaker wipes – pack of 30': 'Pro Gold Sneaker Wipes – Pack of 30',
    'pro gold foam cleaner not-ok': 'Pro Gold Suede n Nubuck Foam Cleaner',
    'pro gold foam cleaner': 'Pro Gold Suede n Nubuck Foam Cleaner',
    'pro gold shoe deo not -ok': 'Pro Gold Shoe Deo',
    'pro gold shoe deo': 'Pro Gold Shoe Deo',
    'key benefits – pro gold sneaker cleaning kit': 'Pro Gold Sports & Sneaker Cleaning Kit',
    'key benefits – pro horse hair brush': 'Pro Horse Hair Brush',
    'key benefits – pro application brush': 'Pro Application Brush',
    'key benefits – pro gloss brush': 'Pro Gloss Brush',
    'key benefits – pro suede brush': 'Pro Suede Brush',
    'key benefits – pro suede 2in1': 'Pro Suede n Nubuck 2in1',
    'key benefits – pro premium shoe tree': 'Pro Premium Shoe Tree',
    'key benefits – pro insoles ease memory foam': 'Pro Insoles Memory Foam',
    'key benefits – pro comfort air walk gel insoles': 'Pro Comfort Air Walk Gel Insoles',
    'key benefits – pro comfort gel insoles': 'Pro Comfort Gel Foot Bed Insoles',
    'key benefits – pro insoles ease soft': 'Pro Insoles Ease Soft',
    'key benefits – pro hydroshield': 'Pro Hydroshield',
    'key benefits – pro suede and nubuck ok': 'Pro Suede and Nubuck Renovator',
    'key benefits – pro spiral shoe tree': 'Pro Shoe Tree With Spiral',
    'pro essentials brush & pumice combo turqouise': 'Pro Brush & Pumice Combo Turqouise',
    'pro essentials smooth feet pumice turqouise': 'Pro Smooth Feet Pumice Turqouise',
    'pro essentials dual action foot file turqouise': 'Pro Dual Action Foot File Turqouise',
    'pro essentials nail buffer turqouise': 'Pro Nail Buffer Turqouise',
    'pro essentials nail clipper turqouise': 'Pro Nail Clipper Turqouise',
    'pro essentials nail file turqouise': 'Pro Nail File Turqouise',
    'pro essentials magic pedi roller pack black': 'Pro Magic Pedi Roller Pack Black',
    'pro essentials double sided foot file purple': 'Pro Double sided Foot File Purple',
    'pro essentials magic pedi light green': 'Pro Magic Pedi Roller',
    'pro insoles gel comfort foot bed size large-size small , large': 'Pro Comfort Gel Foot Bed Insoles',
    'pro insoles gel comfort heel arch support': 'Pro insoles Gel Comfort Heel Pad',
    'pro clean nubuck 2 in 1 neutral': 'Pro Suede n Nubuck 2in1',
    'pro insoles ease aloe vera size 36-46': 'Pro Insoles Ease Aloe Vera',
    'pro color naivy white 75ml white': 'Pro Navy White',
    'pro clean easy care combo pack neutral': 'Pro Easy Care Combo Pack Neutral',
    'pro insole ease heel liner': 'Pro Insole Heel Liner',
    'pro insoles active running size 43-46': 'Pro Insoles Active Running',
    'pro insoles active cycling size 35-38': 'Pro Insoles Active Cycling',
    'pro insoles active cricket size 35-36': 'Pro Insoles Active Cricket',
    'premium sneaker care kit -neutral': 'Pro Premium Sneaker Care Kit',
    'suede n nubuck shoe care kit': 'Suede N Nubuck Shoe Care Kit',
    'pro sneaker wipes (pack of 30) big kit': 'PRO GOLD Sneaker Wipes Pack of 30 Kit',
    'loving my bag kit -neutral': 'Pro Loving My Bag Kit',
    'pro perfect leather cleaning gel': 'Pro Perfect Clean Gel',
    'pro shoe horn metal 52cm': 'Pro Shoe Horn Metal 52 Cm',
    'pro insoles gel comfort heel lovers': 'Pro Insoles Gel Comfort Heel Lovers',
    'pro insoles ease pacific blue': 'Pro Insoles Ease Pacific Blue',
    'pro insoles memory foam': 'Pro Insoles Memory Foam',
    'pro insoles active running': 'Pro Insoles Active Running',
    'pro insoles active cycling': 'Pro Insoles Active Cycling',
    'pro insoles active cricket': 'Pro Insoles Active Cricket',
    'pro premium shoe tree': 'Pro Premium Shoe Tree',
    'pro shoe tree with spiral': 'Pro Shoe Tree With Spiral',
    'pro hydroshield': 'Pro Hydroshield',
    'pro navy white 75ml white': 'Pro Navy White',
}


def normalize(title):
    t = title.lower().strip()
    # Strip trailing markers
    t = re.sub(r'\s*(ok|not-ok|not -ok|✅|❌)\s*$', '', t).strip()
    # Strip leading "key benefits –" prefix
    t = re.sub(r'^key benefits\s*[–-]\s*', '', t).strip()
    # Strip color/size suffixes
    t = re.sub(r'\s*-?\s*(10colors|3color|2\s*color|neutral|black|brown|ok).*$', '', t).strip()
    return t


def parse_all():
    with open(TXT_PATH, 'r', encoding='utf-8-sig') as f:
        raw_lines = [l.rstrip('\r\n') for l in f.readlines()]

    # Remove noise lines in place
    lines = [l for l in raw_lines]

    # Find product boundaries
    product_starts = []
    for i, line in enumerate(lines):
        lookahead = [lines[j] for j in range(i+1, min(i+12, len(lines)))]
        if looks_like_product_title(line, lookahead):
            product_starts.append(i)

    products = []
    for idx, start in enumerate(product_starts):
        end = product_starts[idx+1] if idx+1 < len(product_starts) else len(lines)
        block = lines[start:end]

        title_raw = block[0].strip()
        # Clean title
        title_clean = re.sub(r'\s*(OK|NOT-OK|Not -OK|✅|❌)\s*', ' ', title_raw).strip()
        title_clean = re.sub(r'\s+', ' ', title_clean)

        mode = None
        kb_lines = []
        htu_lines = []
        spec_lines = []

        for line in block[1:]:
            stripped = line.strip()

            # Skip noise
            if is_noise(stripped) or (not stripped):
                continue

            # Section detectors
            if is_kb_header(stripped):
                mode = 'kb'
                continue
            if is_htu_header(stripped):
                mode = 'htu'
                continue
            if is_spec_header(stripped):
                mode = 'spec'
                continue

            if mode == 'kb':
                kb_lines.append(stripped)
            elif mode == 'htu':
                htu_lines.append(line)  # preserve tabs
            elif mode == 'spec':
                spec_lines.append(line)  # preserve tabs

        key_benefits = parse_benefits(kb_lines)
        how_to_use   = parse_htu(htu_lines)
        specs, suitable_for = parse_specs(spec_lines)

        products.append({
            'title_raw': title_raw,
            'title_clean': title_clean,
            'key_benefits': key_benefits,
            'how_to_use': how_to_use,
            'product_specifications': specs,
            'suitable_for': suitable_for,
        })

    return products


def main():
    print("Parsing text file...")
    products = parse_all()
    print(f"  Parsed {len(products)} product blocks")

    # Build lookup: normalized parsed title → product data
    parsed_map = {}
    for p in products:
        raw_norm = normalize(p['title_raw'])
        # Try TITLE_MAP first
        db_title = TITLE_MAP.get(raw_norm)
        if not db_title:
            # try substring matches
            for key, val in TITLE_MAP.items():
                if key in raw_norm or raw_norm in key:
                    db_title = val
                    break
        if db_title:
            parsed_map[db_title.lower()] = p
        else:
            parsed_map[raw_norm] = p

    print(f"  Mapped {len(parsed_map)} entries to DB titles\n")

    # Print summary
    print("=== Parsed Key Benefits + How To Use Summary ===")
    for db_title, p in parsed_map.items():
        kb_count = len([l for l in p['key_benefits'].split('\n') if l.strip()])
        htu_count = len([l for l in p['how_to_use'].split('\n') if l.strip()])
        ok_kb = "✅" if kb_count > 0 else "❌"
        ok_htu = "✅" if htu_count > 0 else "❌"
        print(f"  {ok_kb} KB:{kb_count:>2}  {ok_htu} HTU:{htu_count:>2}  │  {db_title[:60]}")

    print("\n=== Updating databases... ===")

    for is_remote in [False, True]:
        target = "remote RDS" if is_remote else "local"
        print(f"\n  → {target}")

        if is_remote:
            psql_cmd = ["ssh", "procare", f'docker exec -i procare_postgres psql "{REMOTE_DB_URL}" -t -A -F"|"']
        else:
            psql_cmd = ["docker", "exec", "-i", "procare_postgres", "psql",
                        "-U", "procare_ecommerce", "-d", "procare_ecommerce", "-t", "-A", "-F|"]

        # Fetch all products from DB
        sql_fetch = "SELECT id, title, metadata FROM product WHERE deleted_at IS NULL;"
        res = psql_run(psql_cmd, sql_fetch)

        updated = 0
        skipped = 0
        for row in res.strip().split('\n'):
            if not row.strip():
                continue
            parts = row.split('|')
            if len(parts) < 3:
                continue
            pid, db_title = parts[0], parts[1]
            meta_raw = '|'.join(parts[2:])
            try:
                meta = json.loads(meta_raw) if meta_raw.strip() else {}
            except:
                meta = {}

            # Find parsed data for this product
            db_norm = db_title.lower()
            parsed = parsed_map.get(db_norm)

            if parsed:
                # Update metadata fields
                if parsed['key_benefits']:
                    meta['key_benefits'] = parsed['key_benefits']
                if parsed['how_to_use']:
                    meta['how_to_use'] = parsed['how_to_use']
                if parsed['product_specifications']:
                    meta['product_specifications'] = parsed['product_specifications']
                if parsed['suitable_for']:
                    meta['suitable_for'] = parsed['suitable_for']

                update_product(psql_cmd, pid, meta)
                updated += 1
            else:
                skipped += 1

        print(f"    Updated: {updated}  │  No match: {skipped}")

    print("\n✅ Done.")


if __name__ == '__main__':
    main()
