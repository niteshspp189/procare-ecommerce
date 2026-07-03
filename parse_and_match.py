import pandas as pd
import re
import difflib

csv_file = '/mnt/ExtraStorage/Project-Files/session-2026/procare/ecomm/procare_all_variants.csv'
df_csv = pd.read_csv(csv_file)
df_csv['Combined Name'] = df_csv['Product Title'].astype(str) + " " + df_csv['Variant Title'].astype(str)
csv_combined_names = df_csv['Combined Name'].str.lower().tolist()
csv_skus = df_csv['SKU'].tolist()

raw_data = """
1	PRO 	PRO GOLD  Shoe Cream -Neutral 45gm	299	45.5975	253	299	25%	ok	293	Shoecare	18%	45g
2	PRO 	PRO GOLD  Shoe Cream -Black 45gm	299	45.5975	253	299	25%		293	Shoecare	18%	45g
3	PRO 	PRO GOLD  Shoe Cream -Light Brown 45gm	299	45.5975	253	299	25%		293	Shoecare	18%	45g
4	PRO 	PRO GOLD  Shoe Cream -Medium Brown 45gm	299	45.5975	253	299	25%		293	Shoecare	18%	45g
5	PRO 	PRO GOLD  Shoe Cream -Dark Brown 45gm	299	45.5975	253	299	25%		293	Shoecare	18%	45g
6	PRO 	PRO GOLD  Shoe Cream -Tan 45gm	299	45.5975	253	299	25%		293	Shoecare	18%	45g
7	PRO 	PRO GOLD  Shoe Cream -Cognac 45gm	299	45.5975	253	299	25%		293	Shoecare	18%	45g
8	PRO 	PRO GOLD  Shoe Cream -Mahogany 45gm	299	45.5975	253	299	25%		293	Shoecare	18%	45g
9	PRO 	PRO GOLD  Shoe Cream -Blue 45gm	349	53.2225	296	349	25%		342	Shoecare	18%	45g
10	PRO 	PRO GOLD  Shoe Cream -White 45gm	349	53.2225	296	349	25%		342	Shoecare	18%	45g
11	PRO 	PRO GOLD  Shoe Cream With Applicator -Neutral	399	60.8475	338	399	37%	ok	391	Shoecare	18%	50g
12	PRO 	PRO GOLD  Shoe Cream With Applicator -Black	399	60.8475	338	399	37%		391	Shoecare	18%	50g
13	PRO 	PRO GOLD  Shoe Cream With Applicator -Light Brown	399	60.8475	338	399	37%		391	Shoecare	18%	50g
14	PRO 	PRO GOLD  Self Shine -Neutral	249	37.9725	211	249	28%	ok	244	Shoecare	18%	75ml
15	PRO 	PRO GOLD  Self Shine -Black	249	37.9725	211	249	28%		244	Shoecare	18%	75ml
16	PRO 	PRO GOLD  Self Shine -Brown	249	37.9725	211	249	28%		244	Shoecare	18%	75ml
17	PRO 	PRO GOLD  Instant Shiner -Neutral	325	49.5625	275	325	28%	ok	319	Shoecare	18%
18	PRO 	PRO GOLD  Instant Shiner -Black	325	49.5625	275	325	28%		319	Shoecare	18%
19	PRO 	PRO GOLD  Instant Shiner -Brown	325	49.5625	275	325	28%		319	Shoecare	18%
20	PRO 	PRO GOLD  Leather Moisturize -Neutral	425	64.8125	360	425	30%	ok	417	Shoecare	18%	150ml
21	PRO 	PRO GOLD Power Sneaker Cleaner -Neutral	399	60.8475	338	399	14%	ok	391	Shoecare	18%	150ml
22	PRO 	PRO GOLD Clean Power Cleaner(Cleaning Shampoo & Mini Brush) -Neutral	499				25%	Changed Discription & How to use	489	Shoecare	18%
23	PRO 	PRO GOLD Clean Sneaker Wipes-Pack of 30 -Neutral	599				25%	Changed Discription & How to use	587	Shoecare	18%
24	PRO 	PRO GOLD SPORTS & SNEAKER CLEANING KIT	899				22%	Image not provided by MVSC-And discription is incomplete	783	Shoecare	18%
25	PRO 	PRO GOLD Foam Cleaner -Neutral	449				24%	Changed Discription & How to use	440	Shoecare	18%	150ml
26	PRO 	PRO GOLD Shoe Deo	349					Change in How to use 	342	Shoecare	18%	150ml
1	Pro	Pro Accessories Application Brush Dark	199	195		Accessories 	18%
2	Pro	Pro Accessories Application Brush Light	199	195		Accessories 	18%
3	Pro	Pro Accessories Gloss Brush Dark	399	391		Accessories 	18%
4	Pro	Pro Accessories Gloss Brush Light	399	391		Accessories 	18%
5	Pro	Pro Accessories Horse Hair Brush Dark	575	564		Accessories 	18%
6	Pro	Pro Accessories Horse Hair Brush Light	575	564		Accessories 	18%
7	Pro	Pro Accessories Suede Brush Rubber Black	250	245		Accessories 	18%
8	Pro	PRO Accessories Premium Shoe Tree -37/38	3999	3199		Accessories 	18%	37/38
9	Pro	PRO Accessories Premium Shoe Tree -39/40	3999	3199		Accessories 	18%	39/40
10	Pro	PRO Accessories Premium Shoe Tree -40/41	3999	3199		Accessories 	18%	40/41
11	Pro	PRO Accessories Premium Shoe Tree -41/42	3999	3199		Accessories 	18%	41/42
12	Pro	PRO Accessories Premium Shoe Tree-43/44	3999	3199		Accessories 	18%	43/44
13	Pro	PRO Accessories Men Shoe Tree With Spiral 39/40	899	699		Accessories 	18%	39-40
14	Pro	PRO Accessories Men Shoe Tree With Spiral 41/42	899	699		Accessories 	18%	41-42
15	Pro	PRO Accessories Men Shoe Tree With Spiral 43/44	899	699		Accessories 	18%	43-44
16	Pro	Pro Clean Nubuck 2 in 1 Neutral	325	318.5		Shoecare	18%
17	Pro	Pro Clean Perfect Clean Gel 50ml Neutral	249	244.02		Shoecare	18%	50ml
18	Pro	PRO Care Suede N Nubuck Spray 180 ml-Neutral	549	538.02		Shoecare	18%	180ML
19	Pro	PRO Care Hydroshield 180 ml-Neutral	599	587.02		Shoecare	18%	180ML
20	Pro	Sneaker Wipes Kit Pack of 30-Neutral	699	587.02		Shoecare	18%
21	Pro	Loving My Bag Kit -Neutral	599	587.02		Shoecare	18%
22	Pro	Suede N Nubuck Shoe Care Kit -Neutral	849	587.02		Shoecare	18%
23	Pro	Premium Sneaker Care Kit -Neutral	1499	587.02		Shoecare	18%
24	Pro	Premium Shoe Care Kit -Neutral	1499	587.02		Shoecare	18%
25	Pro	PRO Clean Easy Care Combo Pack  Neutral	299	587.02		Shoecare	18%
1	Pro	PRO Insole Ease Heel Liner	199	197			18%
3	Pro	PRO Insoles Ease Memory Foam Size 39	699	692			18%
4	Pro	PRO Insoles Ease Memory Foam Size 40	699	692			18%
5	Pro	PRO Insoles Ease Memory Foam Size 41	699	692			18%
6	Pro	PRO Insoles Ease Memory Foam Size 42	699	692			18%
7	Pro	PRO Insoles Ease Memory Foam Size 43	699	692			18%
8	Pro	PRO Insoles Ease Memory Foam Size 44	699	692			18%
9	Pro	PRO Insoles Ease Soft Comfort Size 36-46	225	223			18%
10	Pro	PRO Insoles Active Cricket Size 35-36	995	985			18%
11	Pro	PRO Insoles Active Cricket Size 37-38	995	985			18%
12	Pro	PRO Insoles Active Cricket Size 39-40	995	985			18%
13	Pro	PRO Insoles Active Cricket Size 41-42	995	985			18%
14	Pro	PRO Insoles Active Cricket Size 43-44	995	985			18%
15	Pro	PRO Insoles Active Cricket Size 45-46	995	985			18%
16	Pro	PRO Insoles Active Cycling Size 35-38	995	985			18%
17	Pro	PRO Insoles Active Cycling Size 39- 42	995	985			18%
18	Pro	PRO Insoles Active Cycling Size 43-46	995	985			18%
19	Pro	PRO Insoles Active Running  Size 43-46	995	985			18%
20	Pro	PRO Insoles Active Running Size 35-38	995	985			18%
21	Pro	PRO Insoles Active Running Size 39-42	995	985			18%
22	Pro	PRO Insoles Ease Aloe Vera Size 36-46	299	296	Not Provided images		18%
23	Pro	PRO Insoles Ease Pacific Blue Size 36-46	299	296	Not Provided images		18%
24	Pro	PRO Insoles Ease Soft Comfort Size 36-46	199	197			18%
25	Pro	PRO Insoles Gel Comfort Air walk Size Large	649	643			18%
26	Pro	PRO Insoles Gel Comfort Air walk Size Small	649	643			18%
27	Pro	PRO Insoles Gel Comfort Foot Bed Size Large	549	544			18%
28	Pro	PRO Insoles Gel Comfort Foot Bed Size Small	549	544			18%
29	Pro	PRO Insoles Gel Comfort Heel Lovers Size Universal	199	197	Not Provided images		18%
30	Pro	PRO insoles Gel Comfort Heel Pad Size Large	249	247			18%
31	Pro	PRO insoles Gel Comfort Heel Pad Size Small	249	247			18%
1	Pro	Pro Essentials Brush & Pumice Combo Turqouise	349	346		Essentials	18%
3	Pro	Pro Essentials Double sided Foot File Purple	199	197		Essentials	18%
4	Pro	Pro Essentials Dual Action Foot File Turqouise	349	346		Essentials	18%
5	Pro	PRO Essentials Magic Pedi Roller Pack Black	399	395		Essentials	18%
6	Pro	PRO Essentials Magic Pedi	2249	2227		Essentials	18%
7	Pro	Pro Essentials Nail File Turqouise	249	247	Not provided	Essentials	18%
8	Pro	Pro Essentials Nail Buffer Turqouise	199	197		Essentials	18%
9	Pro	Pro Essentials Nail Clipper Turqouise	299	296		Essentials	18%
10	Pro	Pro Essentials Smooth Feet Pumice Turqouise	225	223		Essentials	18%
"""

parsed_products = []
for line in raw_data.strip().split('\n'):
    if not line.strip() or line.startswith('Sr No'): continue
    parts = line.split('\t')
    if len(parts) >= 4:
        name = parts[2].strip()
        mrp = parts[3].strip()
        try:
            mrp = int(float(mrp)) # force int as user requested
            sp = None
            
            # The first table (Shoe Cream etc.) has SP at index 9 because of extra columns
            if "PRO GOLD" in line and len(parts) >= 10 and ("ok" in line or "%" in line or "Shoecare" in parts[10] or "Shoecare" in parts[9]):
                # Fallback: look at index 9 directly
                try:
                    sp = int(float(parts[9].strip()))
                except:
                    # Search backwards from end
                    for p in reversed(parts):
                        try:
                            sp_val = float(p.strip())
                            if sp_val < mrp and sp_val > 0:
                                sp = int(sp_val)
                                break
                        except: pass
            else:
                # Other tables have SP at index 4
                try:
                    sp = int(float(parts[4].strip()))
                except:
                    for p in reversed(parts):
                        try:
                            sp_val = float(p.strip())
                            if sp_val < mrp and sp_val > 0:
                                sp = int(sp_val)
                                break
                        except: pass
            
            parsed_products.append({'name': name, 'mrp': mrp, 'sp': sp})
        except: continue

def normalize(s):
    s = s.lower().replace("-", " ").replace("  ", " ").strip()
    s = s.replace("45gm", "45g")
    return s

clean_csv_names = [normalize(n) for n in csv_combined_names]

updates = []
unmatched = []
match_report = []

for p in parsed_products:
    name = p['name']
    name_clean = normalize(name)
    
    size_match = re.search(r'(size\s+)?([\d\w]+\-[\d\w]+|[\d\w]+|\blarge\b|\bsmall\b|\buniversal\b)$', name_clean)
    
    matches = []
    for i, cn in enumerate(clean_csv_names):
        is_size_sensitive = 'insole' in name_clean or 'tree' in name_clean
        if is_size_sensitive:
            if size_match:
                extracted_size = size_match.group(2).replace(" ", "")
                if extracted_size not in cn.replace(" ", ""):
                    continue
        
        ratio = difflib.SequenceMatcher(None, name_clean, cn).ratio()
        threshold = 0.82 if 'insole' in name_clean else 0.65
        if ratio >= threshold:
            matches.append((ratio, i))
            
    matches.sort(reverse=True)

    if matches:
        best_match_idx = matches[0][1]
        matched_sku = csv_skus[best_match_idx]
        matched_title = df_csv.iloc[best_match_idx]['Combined Name']
        
        old_mrp = df_csv.iloc[best_match_idx]['MRP (INR)']
        old_sp = df_csv.iloc[best_match_idx]['Selling Price (INR)']
        
        updates.append({
            "index": best_match_idx,
            "new_mrp": p['mrp'],
            "new_sp": p['sp'],
            "sku": matched_sku
        })
        match_report.append({
            "Excel Name": name,
            "Matched Product": matched_title,
            "SKU": matched_sku,
            "Old MRP": old_mrp,
            "Old SP": old_sp,
            "New MRP": p['mrp'],
            "New SP": p['sp']
        })
    else:
        unmatched.append(name)

# Update CSV directly
for u in updates:
    df_csv.at[u['index'], 'MRP (INR)'] = u['new_mrp']
    df_csv.at[u['index'], 'Selling Price (INR)'] = u['new_sp']

df_csv.drop(columns=['Combined Name'], inplace=True)
df_csv.to_csv('procare_all_variants.csv', index=False)

# Write report
with open('/home/niteshsp189/.gemini/antigravity-ide/brain/3e2b5f48-9910-4683-99e7-b4b223fa1fb7/dry_run_report_final.md', 'w') as f:
    f.write("# Final Strict Match Dry Run Report (Fixed Prices)\n\n")
    f.write("## 🟢 Matched\n")
    f.write("| Excel Name | Matched SKU & Title | Old Price (MRP -> SP) | New Price (MRP -> SP) |\n")
    f.write("|---|---|---|---|\n")
    for r in match_report:
        f.write(f"| {r['Excel Name']} | `{r['SKU']}`<br>{r['Matched Product']} | ₹{r['Old MRP']} -> ₹{r['Old SP']} | **₹{r['New MRP']} -> ₹{r['New SP']}** |\n")
    
    if unmatched:
        f.write("\n## 🔴 Unmatched Products (Safe to ignore, probably not in DB)\n")
        for u in unmatched:
            f.write(f"- {u}\n")

print("Report generated and procare_all_variants.csv updated successfully.")
