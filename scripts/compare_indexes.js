const { Client } = require("pg");

const LOCAL_URL = "postgres://procare_ecommerce:procare_ecommerce@postgres:5432/procare_ecommerce";

async function run() {
    const localClient = new Client({ connectionString: LOCAL_URL });
    const rdsClient = new Client({ connectionString: process.env.DATABASE_URL });
    
    await localClient.connect();
    await rdsClient.connect();
    
    try {
        console.log("Fetching local indexes...");
        const localRes = await localClient.query(
            "SELECT tablename, indexname, indexdef FROM pg_indexes WHERE schemaname = 'public';"
        );
        const localIndexes = localRes.rows;

        console.log("Fetching RDS indexes...");
        const rdsRes = await rdsClient.query(
            "SELECT tablename, indexname, indexdef FROM pg_indexes WHERE schemaname = 'public';"
        );
        const rdsIndexes = rdsRes.rows;

        const rdsIndexNames = new Set(rdsIndexes.map(i => i.indexname));
        
        console.log("\n=== Missing Indexes in RDS ===");
        let missingCount = 0;
        const missingDefs = [];
        
        for (const idx of localIndexes) {
            if (!rdsIndexNames.has(idx.indexname)) {
                console.log(`Table: ${idx.tablename} | Index: ${idx.indexname}`);
                console.log(`Def:   ${idx.indexdef}`);
                console.log("-----------------------------------------");
                missingCount++;
                missingDefs.push(idx.indexdef);
            }
        }
        
        console.log(`\nFound ${missingCount} indexes missing in RDS.`);
        
        if (missingCount > 0) {
            console.log("\nCreating missing indexes on RDS...");
            for (const def of missingDefs) {
                try {
                    await rdsClient.query(def);
                    console.log(`✅ Created: ${def}`);
                } catch (err) {
                    console.error(`❌ Failed to create: ${def} | Error:`, err.message);
                }
            }
            console.log("\n✅ All missing indexes created successfully on RDS!");
        }

    } catch (err) {
        console.error("Error comparing indexes:", err);
    } finally {
        await localClient.end();
        await rdsClient.end();
    }
}

run();
