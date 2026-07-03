import pandas as pd
import json

file_path = "/mnt/ExtraStorage/Project-Files/session-2026/procare/ecomm/procare-mail/june30/MRP Online _Product wise (4).xlsx"

# Read all sheets
xls = pd.ExcelFile(file_path)
data = {}
for sheet_name in xls.sheet_names:
    df = pd.read_excel(xls, sheet_name=sheet_name)
    # Convert to list of dicts, handle nan
    data[sheet_name] = df.fillna("").to_dict(orient="records")

with open("excel_dump.json", "w") as f:
    json.dump(data, f, indent=2)

print("Parsed sheets:", xls.sheet_names)
