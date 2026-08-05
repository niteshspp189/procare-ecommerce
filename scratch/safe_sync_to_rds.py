import os
import subprocess
import psycopg2 # If not installed, we can just use subprocess with psql
import sys
import time

RDS_HOST="database-1.c5wkcis2qg1p.ap-south-1.rds.amazonaws.com"
RDS_PORT="5432"
RDS_DB="prepreimiumcare_ecommerce"
RDS_USER="propremiumcare"
RDS_PASSWORD="Mvsc2026##56"

LOCAL_CONTAINER="procare_postgres"
LOCAL_DB="procare_ecommerce"
LOCAL_USER="procare_ecommerce"

DUMP_FILE="/tmp/procare_rds_sync_full.sql"

def run_psql(host, port, user, password, db, query):
    cmd = ["docker", "run", "--rm", "-e", f"PGPASSWORD={password}", "postgres:15-alpine", "psql", "-h", host, "-p", port, "-U", user, "-d", db, "-t", "-A", "-c", query]
    res = subprocess.run(cmd, capture_output=True)
    if res.returncode != 0:
        raise Exception(f"SQL Error: {res.stderr.decode('utf-8')}")
    return res.stdout.decode("utf-8").strip()

def run_psql_file(host, port, user, password, db, file_path):
    cmd = ["docker", "run", "--rm", "-e", f"PGPASSWORD={password}", "-v", f"{file_path}:/tmp/import.sql:ro", "postgres:15-alpine", "psql", "-h", host, "-p", port, "-U", user, "-d", db, "-f", "/tmp/import.sql"]
    res = subprocess.run(cmd, capture_output=True)
    if res.returncode != 0:
        raise Exception(f"SQL Error: {res.stderr.decode('utf-8')}")
    return res.stdout.decode("utf-8").strip()

def main():
    print("=== Safe Sync Local DB to RDS ===")
    
    print("1. Extracting production api_key and publishable_api_key_sales_channel...")
    
    cmd = ["docker", "run", "--rm", "-e", f"PGPASSWORD={RDS_PASSWORD}", "postgres:15-alpine", "pg_dump", "-h", RDS_HOST, "-p", RDS_PORT, "-U", RDS_USER, "-d", RDS_DB, 
           "--table=api_key", "--table=publishable_api_key_sales_channel", "--data-only", "--inserts"]
    res = subprocess.run(cmd, capture_output=True)
    if res.returncode != 0:
        print("Failed to backup production API keys!")
        print(res.stderr.decode('utf-8'))
        sys.exit(1)
        
    api_key_inserts = res.stdout.decode("utf-8")
    with open("/tmp/production_api_keys.sql", "w") as f:
        f.write(api_key_inserts)
    print(f"Backed up {len(api_key_inserts.splitlines())} lines of key data.")
    
    print("2. Dumping local database...")
    cmd = ["docker", "exec", LOCAL_CONTAINER, "pg_dump", "-U", LOCAL_USER, 
           "--no-owner", "--no-privileges", "--clean", "--if-exists", LOCAL_DB]
    with open(DUMP_FILE, "w") as f:
        res = subprocess.run(cmd, stdout=f)
    if res.returncode != 0:
        print("Failed to dump local DB!")
        sys.exit(1)
    print(f"Dumped local DB to {DUMP_FILE}")

    print("3. Dropping and recreating RDS public schema...")
    schema_sql = "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO propremiumcare; GRANT ALL ON SCHEMA public TO public; CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
    run_psql(RDS_HOST, RDS_PORT, RDS_USER, RDS_PASSWORD, RDS_DB, schema_sql)
    print("Schema cleared.")

    print("4. Importing local DB to RDS...")
    run_psql_file(RDS_HOST, RDS_PORT, RDS_USER, RDS_PASSWORD, RDS_DB, DUMP_FILE)
    print("Local DB imported successfully.")

    print("5. Restoring production API keys...")
    # First, clear the local keys that were just imported
    run_psql(RDS_HOST, RDS_PORT, RDS_USER, RDS_PASSWORD, RDS_DB, "DELETE FROM publishable_api_key_sales_channel; DELETE FROM api_key;")
    
    # Run the backup file
    run_psql_file(RDS_HOST, RDS_PORT, RDS_USER, RDS_PASSWORD, RDS_DB, "/tmp/production_api_keys.sql")
    print("Production API keys restored successfully.")

    print("=== Migration Complete! ===")

if __name__ == "__main__":
    main()
