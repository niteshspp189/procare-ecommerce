import os
import sys
import json
import subprocess

REMOTE_DB_URL = "postgres://propremiumcare:Mvsc2026##56@database-1.c5wkcis2qg1p.ap-south-1.rds.amazonaws.com:5432/prepreimiumcare_ecommerce"

def main():
    is_remote = "--remote" in sys.argv
    print(f"Connecting to {'remote RDS' if is_remote else 'local'} DB...")

    sql = "SELECT id, title, metadata FROM product WHERE deleted_at IS NULL;"
    if is_remote:
        cmd = ["ssh", "procare", f'docker exec -i procare_postgres psql "{REMOTE_DB_URL}" -t -A']
    else:
        cmd = ["docker", "exec", "-i", "procare_postgres", "psql", "-U", "procare_ecommerce", "-d", "procare_ecommerce", "-t", "-A"]

    res = subprocess.run(cmd, input=sql, text=True, check=True, capture_output=True)
    
    updated = 0
    for line in res.stdout.strip().split("\n"):
        if not line.strip():
            continue
        parts = line.split("|")
        pid, title = parts[0], parts[1]
        meta_str = parts[2] if len(parts) > 2 else "{}"
        try:
            meta = json.loads(meta_str) if meta_str else {}
        except Exception as e:
            continue

        top_sf = meta.get("suitable_for") or meta.get("Suitable For")
        specs = meta.get("product_specifications") or {}
        if isinstance(specs, dict):
            spec_sf = specs.get("Suitable For") or specs.get("suitable_for")
            if top_sf and isinstance(top_sf, str):
                if not spec_sf or not isinstance(spec_sf, str) or len(top_sf) > len(spec_sf):
                    specs["Suitable For"] = top_sf
                    if "suitable_for" in specs:
                        del specs["suitable_for"]
                    meta["product_specifications"] = specs

                    json_str = json.dumps(meta).replace("'", "''")
                    update_sql = f"UPDATE product SET metadata = '{json_str}'::jsonb WHERE id = '{pid}';\n"
                    
                    if is_remote:
                        psql_args = ["ssh", "procare", f'docker exec -i procare_postgres psql "{REMOTE_DB_URL}" -t -A']
                    else:
                        psql_args = ["docker", "exec", "-i", "procare_postgres", "psql", "-U", "procare_ecommerce", "-d", "procare_ecommerce", "-t", "-A"]
                    
                    subprocess.run(psql_args, input=update_sql, text=True, check=True, capture_output=True)
                    updated += 1
                    print(f"✅ Updated Suitable For in DB for: {title}")

    print(f"\nTotal products updated: {updated}")

if __name__ == "__main__":
    main()
