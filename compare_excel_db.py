import json
import pandas as pd

with open('excel_dump.json', 'r') as f:
    excel_data = json.load(f)

with open('db_api_dump.json', 'r') as f:
    db_data = json.load(f)

db_products = {}
for p in db_data.get("products", []):
    title = p.get("title", "")
    variants = p.get("variants", [])
    
    mrp = None
    sp = None
    if variants:
        calc = variants[0].get("calculated_price")
        if calc:
            mrp = calc.get("original_amount")
            sp = calc.get("calculated_amount")
            
    db_products[title.strip().lower()] = {
        "title": title,
        "mrp": mrp,
        "sp": sp,
        "id": p.get("id")
    }

report_lines = ["# Product Validation Report\n\n"]
report_lines.append("This report compares the 92 products from the client's Excel file against the live database to verify Name, MRP, and Selling Price.\n\n")

missing_in_db = []
price_mismatches = []
matched_perfectly = []

for sheet, rows in excel_data.items():
    if sheet == "PENDING": continue
    
    # Find the keys for Name, MRP, SP
    name_key = None
    mrp_key = None
    sp_key = None
    
    for row in rows:
        # Check if this row is the header row
        for k, v in row.items():
            if str(v).strip().lower() == "name of product":
                name_key = k
            elif str(v).strip().lower() == "mrp":
                mrp_key = k
            elif str(v).strip().lower() == "selling price":
                sp_key = k
                
        if name_key: 
            break
            
    if not name_key:
        print(f"Could not find headers in sheet {sheet}")
        continue
        
    for row in rows:
        name = row.get(name_key, "")
        if not name or pd.isna(name) or name == "Name Of Product": continue
        
        name_clean = str(name).strip().lower()
        
        excel_mrp = row.get(mrp_key)
        excel_sp = row.get(sp_key)
        try:
            excel_mrp = float(excel_mrp) if not pd.isna(excel_mrp) and str(excel_mrp).strip() != "MRP" else None
            excel_sp = float(excel_sp) if not pd.isna(excel_sp) and str(excel_sp).strip() != "Selling price" else None
        except:
            pass
            
        # Try to find match
        match = db_products.get(name_clean)
        
        # Fuzzy match if exact match fails
        if not match:
            for db_name, db_info in db_products.items():
                if name_clean in db_name or db_name in name_clean:
                    match = db_info
                    break
                    
        if match:
            # Check price
            db_mrp = match.get("mrp")
            db_sp = match.get("sp")
            
            issues = []
            if excel_mrp is not None and db_mrp is not None and excel_mrp != db_mrp:
                issues.append(f"MRP mismatch (Excel: ₹{excel_mrp}, DB: ₹{db_mrp})")
            if excel_sp is not None and db_sp is not None and excel_sp != db_sp:
                issues.append(f"SP mismatch (Excel: ₹{excel_sp}, DB: ₹{db_sp})")
                
            if issues:
                price_mismatches.append({"excel_name": name, "db_name": match["title"], "issues": issues})
            else:
                matched_perfectly.append(name)
        else:
            missing_in_db.append({"sheet": sheet, "name": name, "mrp": excel_mrp, "sp": excel_sp})

report_lines.append(f"## Summary\n- **Perfect Matches**: {len(matched_perfectly)}\n- **Price Mismatches**: {len(price_mismatches)}\n- **Missing in DB (or Name Mismatch)**: {len(missing_in_db)}\n\n")

if price_mismatches:
    report_lines.append("## ⚠️ Price Mismatches\n")
    for m in price_mismatches:
        report_lines.append(f"- **{m['excel_name']}** (Matched to DB: `{m['db_name']}`)\n")
        for i in m['issues']:
            report_lines.append(f"  - {i}\n")
    report_lines.append("\n")

if missing_in_db:
    report_lines.append("## ❌ Missing Products (Or Name Mismatch)\n")
    report_lines.append("These products from the Excel file could not be found in the live database (they might be missing or named differently).\n\n")
    for m in missing_in_db:
        report_lines.append(f"- [{m['sheet']}] **{m['name']}** (MRP: ₹{m['mrp']}, SP: ₹{m['sp']})\n")

with open('/home/niteshsp189/.gemini/antigravity-ide/brain/3e2b5f48-9910-4683-99e7-b4b223fa1fb7/report.md', 'w') as f:
    f.writelines(report_lines)

print("Report generated successfully.")
