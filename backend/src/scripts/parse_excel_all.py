import pandas as pd

excel_path = "/home/niteshsp189/Downloads/procare_all_variants_updated Title by raina (1).xlsx"
csv_path = "/tmp/db_single_variants.csv"

try:
    df = pd.read_excel(excel_path)
    db_df = pd.read_csv(csv_path)
    
    print(f"Excel rows: {len(df)}")
    print(f"DB single-variant products: {len(db_df)}")
    
    matched = []
    unmatched = []
    
    for idx, row in db_df.iterrows():
        p_title = row['product_title']
        pv_title = row['variant_title']
        val_val = row['option_value']
        
        # Match by product title in DB with either 'Product Title' or 'Updated Title' in Excel
        match_df = df[
            (df['Product Title'].str.lower() == p_title.lower()) |
            (df['Updated Title'].str.lower() == p_title.lower())
        ]
        
        if len(match_df) > 0:
            excel_var = match_df.iloc[0]['Variant Title']
            matched.append({
                'product_title': p_title,
                'db_variant_title': pv_title,
                'db_option_value': val_val,
                'excel_variant_title': excel_var
            })
        else:
            unmatched.append({
                'product_title': p_title,
                'db_variant_title': pv_title,
                'db_option_value': val_val
            })
            
    print("\n--- MATCHED ---")
    print(pd.DataFrame(matched).to_string())
    
    print("\n--- UNMATCHED ---")
    print(pd.DataFrame(unmatched).to_string())
    
except Exception as e:
    print("Error:", e)
