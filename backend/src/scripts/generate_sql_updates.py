import pandas as pd

csv_path = "/tmp/db_single_variants.csv"

try:
    db_df = pd.read_csv(csv_path)
    print(f"Loaded {len(db_df)} single-variant products from DB export.")
    
    updates = []
    
    for idx, row in db_df.iterrows():
        p_id = row['product_id']
        p_title = row['product_title']
        pv_id = row['variant_id']
        pv_title = row['variant_title']
        opt_id = row['option_id']
        opt_title = row['option_title']
        val_id = row['option_value_id']
        val_val = row['option_value']
        
        # Decide if it's an insole (size-related) or other (variant-related)
        # We only match insole or heel to avoid false positives like 'Perfect Clean Gel'
        is_insole = any(word in p_title.lower() for word in ['insole', 'heel', 'active'])
        
        if is_insole:
            new_val = "Default Size"
            new_opt_title = "Size"
        else:
            new_val = "Default Variant"
            new_opt_title = "Variant"
            
        updates.append({
            'product_title': p_title,
            'is_insole': is_insole,
            'sql_variant': f"UPDATE product_variant SET title = '{new_val}' WHERE id = '{pv_id}';",
            'sql_option': f"UPDATE product_option SET title = '{new_opt_title}' WHERE id = '{opt_id}';",
            'sql_value': f"UPDATE product_option_value SET value = '{new_val}' WHERE id = '{val_id}';",
            'new_val': new_val,
            'new_opt_title': new_opt_title
        })
        
    df_updates = pd.DataFrame(updates)
    print("\nProposed updates:")
    print(df_updates[['product_title', 'is_insole', 'new_val', 'new_opt_title']].to_string())
    
    # Save the SQL to a file
    with open('/tmp/update_single_variants.sql', 'w') as f:
        f.write("-- SQL updates for single-variant products to fix frontend description layout bug\n\n")
        for u in updates:
            f.write(f"-- Product: {u['product_title']}\n")
            f.write(u['sql_variant'] + "\n")
            f.write(u['sql_option'] + "\n")
            f.write(u['sql_value'] + "\n\n")
            
    print("\nSQL statements generated in /tmp/update_single_variants.sql")
except Exception as e:
    print("Error:", e)
