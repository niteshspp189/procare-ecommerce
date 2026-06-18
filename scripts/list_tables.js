const { Client } = require("pg");

async function run() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    try {
        // List all tables
        const tablesRes = await client.query(
            "SELECT table_name FROM information_schema.tables WHERE table_schema='public';"
        );
        const tables = tablesRes.rows.map(r => r.table_name);
        console.log("=== Tables ===");
        console.log(tables.sort());

        // Check if api_key table exists
        if (tables.includes("api_key")) {
            const keys = await client.query("SELECT * FROM api_key;");
            console.log("\n=== api_key table ===");
            console.log(keys.rows);
        }
        
        // Check if sales_channel exists
        if (tables.includes("sales_channel")) {
            const channels = await client.query("SELECT * FROM sales_channel;");
            console.log("\n=== sales_channel table ===");
            console.log(channels.rows);
        }

        // Check relationship tables
        const keySalesChannelTables = tables.filter(t => t.includes("api_key") && t.includes("sales_channel") || t.includes("publishable"));
        console.log("\n=== Relation Tables ===");
        console.log(keySalesChannelTables);

        for (const t of keySalesChannelTables) {
            try {
                const res = await client.query(`SELECT * FROM ${t};`);
                console.log(`\n=== Table: ${t} ===`);
                console.log(res.rows);
            } catch (err) {
                console.error(`Error reading ${t}:`, err.message);
            }
        }

    } catch (err) {
        console.error("Error running script:", err);
    } finally {
        await client.end();
    }
}

run();
