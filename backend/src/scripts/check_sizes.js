const { Client } = require('pg');

const DATABASE_URL = "postgres://propremiumcare:Mvsc2026%23%2356@database-1.c5wkcis2qg1p.ap-south-1.rds.amazonaws.com:5432/prepreimiumcare_ecommerce?ssl=true&sslmode=require";

async function main() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
  await client.connect();

  console.log("Connected to RDS. Querying option values...");

  const query = `
    SELECT 
      p.id as product_id,
      p.title as product_title,
      p.handle as product_handle,
      po.id as option_id,
      po.title as option_title,
      pov.id as value_id,
      pov.value as option_value
    FROM product_option_value pov
    JOIN product_option po ON pov.option_id = po.id
    JOIN product p ON po.product_id = p.id
    ORDER BY p.title, po.title, pov.value;
  `;

  const res = await client.query(query);
  await client.end();

  const rows = res.rows;
  console.log(`Found ${rows.length} total option values.`);

  const longOptions = rows.filter(row => {
    // We want to identify options where the value is longer than usual, or contains multiple words/sentences
    // like size option having a whole description.
    return row.option_value.length > 25 || row.option_value.split(' ').length > 4;
  });

  console.log("\n--- LONG OPTION VALUES FOUND ---");
  longOptions.forEach((row, i) => {
    console.log(`${i+1}. Product: "${row.product_title}" (Handle: ${row.product_handle})`);
    console.log(`   Option Name: "${row.option_title}"`);
    console.log(`   Option Value: "${row.option_value}"`);
    console.log(`   Length: ${row.option_value.length} chars, ${row.option_value.split(' ').length} words`);
    console.log("-----------------------------------------");
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
