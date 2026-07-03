import json
import pandas as pd
import difflib

# 1. Load Excel Dump
with open('excel_dump.json', 'r') as f:
    excel_data = json.load(f)

# 2. Load CSV Variants
csv_file = '/mnt/ExtraStorage/Project-Files/session-2026/procare/ecomm/procare_all_variants.csv'
df_csv = pd.read_csv(csv_file)
df_csv['Combined Name'] = df_csv['Product Title'].astype(str) + " " + df_csv['Variant Title'].astype(str)

csv_combined_names = df_csv['Combined Name'].str.lower().tolist()
csv_skus = df_csv['SKU'].tolist()

match_report = []
unmatched = []

# To update the CSV
updates = []

for sheet, rows in excel_data.items():
    if sheet == "PENDING": continue
    
    name_key, mrp_key, sp_key = None, None, None
    for row in rows:
        for k, v in row.items():
            val = str(v).strip().lower()
            if val == "name of product": name_key = k
            elif val == "mrp": mrp_key = k
            elif val == "selling price": sp_key = k
        if name_key: break
            
    if not name_key: continue
        
    for row in rows:
        name = row.get(name_key, "")
        if not name or pd.isna(name) or name == "Name Of Product": continue
        
        name_clean = str(name).strip().lower()
        # Some quick normalizations to improve matching
        name_clean = name_clean.replace("45gm", "45g").replace("45 gm", "45g")
        name_clean = name_clean.replace("-", " ")
        name_clean = name_clean.replace("  ", " ").strip()
        
        mrp = row.get(mrp_key)
        sp = row.get(sp_key)
        try:
            mrp = float(mrp) if not pd.isna(mrp) and str(mrp).strip() != "MRP" else None
            sp = float(sp) if not pd.isna(sp) and str(sp).strip() != "Selling price" else None
        except:
            mrp, sp = None, None
            
        if mrp is None and sp is None: continue

        # Try to find best match in CSV
        # 1. Exact substring match first
        best_match_idx = -1
        best_ratio = 0
        
        # Clean CSV names for matching
        clean_csv_names = [n.replace("-", " ").replace("  ", " ").strip() for n in csv_combined_names]
        
        matches = difflib.get_close_matches(name_clean, clean_csv_names, n=1, cutoff=0.6)
        if matches:
            best_match_str = matches[0]
            best_match_idx = clean_csv_names.index(best_match_str)
            # Find the actual original string
            matched_sku = csv_skus[best_match_idx]
            matched_title = df_csv.iloc[best_match_idx]['Combined Name']
            
            old_mrp = df_csv.iloc[best_match_idx]['MRP (INR)']
            old_sp = df_csv.iloc[best_match_idx]['Selling Price (INR)']
            
            match_report.append({
                "Excel Name": name,
                "Matched Product": matched_title,
                "SKU": matched_sku,
                "Old MRP": old_mrp,
                "New MRP": mrp,
                "Old SP": old_sp,
                "New SP": sp
            })
            
            # Prepare update
            updates.append({
                "index": best_match_idx,
                "new_mrp": mrp,
                "new_sp": sp
            })
        else:
            unmatched.append(name)

# Apply updates to dataframe
for u in updates:
    df_csv.at[u['index'], 'MRP (INR)'] = u['new_mrp']
    df_csv.at[u['index'], 'Selling Price (INR)'] = u['new_sp']

# Drop combined name
df_csv.drop(columns=['Combined Name'], inplace=True)
df_csv.to_csv('procare_all_variants_updated.csv', index=False)

# Write report
with open('/home/niteshsp189/.gemini/antigravity-ide/brain/3e2b5f48-9910-4683-99e7-b4b223fa1fb7/dry_run_report.md', 'w') as f:
    f.write("# Fuzzy Match Dry Run Report\n\n")
    f.write("Below is the mapping between the client's Excel sheet and the SKUs found in `procare_all_variants.csv`.\n\n")
    
    f.write("## 🟢 Successfully Matched & Updated Prices\n")
    f.write("| Excel Name | Matched SKU & Title | Old Price (MRP -> SP) | New Price (MRP -> SP) |\n")
    f.write("|---|---|---|---|\n")
    for r in match_report:
        f.write(f"| {r['Excel Name']} | `{r['SKU']}`<br>{r['Matched Product']} | ₹{r['Old MRP']} -> ₹{r['Old SP']} | **₹{r['New MRP']} -> ₹{r['New SP']}** |\n")
    
    if unmatched:
        f.write("\n## 🔴 Unmatched Products (Could not safely map)\n")
        for u in unmatched:
            f.write(f"- {u}\n")

print("Generated dry_run_report.md and procare_all_variants_updated.csv")
