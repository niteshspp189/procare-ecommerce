const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function run() {
    console.log("🚀 Starting database catalog audit and alignment...");
    
    // Load parsed CSV JSON
    const dataPath = path.join(__dirname, 'parsed_csv_data.json');
    if (!fs.existsSync(dataPath)) {
        console.error(`Parsed CSV JSON not found at ${dataPath}`);
        process.exit(1);
    }
    
    const variants = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    console.log(`Loaded ${variants.length} variant records from parsed JSON.`);

    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    console.log("Connected to PostgreSQL database.");

    try {
        // Ensure Price List pl_online_sale exists
        await client.query(`
            INSERT INTO price_list (id, status, type, title, description, created_at, updated_at)
            VALUES ('pl_online_sale', 'active', 'sale', 'Online Sale', 'Online Selling Prices', NOW(), NOW())
            ON CONFLICT (id) DO NOTHING;
        `);

        let updatedCount = 0;
        let missedCount = 0;

        for (const item of variants) {
            const {
                sku,
                product_title,
                variant_title,
                mrp,
                price: sellingPrice,
                how_to_use,
                key_benefits,
                suitable_for,
                specifications,
                badges,
                thumbnail,
                images
            } = item;

            // 1. Query variant
            const varRes = await client.query(
                "SELECT id, product_id FROM product_variant WHERE sku = $1;",
                [sku]
            );

            if (varRes.rows.length === 0) {
                console.warn(`⚠️ Variant not found for SKU: ${sku} (${product_title})`);
                missedCount++;
                continue;
            }

            const { id: variantId, product_id: productId } = varRes.rows[0];
            console.log(`Aligning SKU: ${sku} | Variant ID: ${variantId} | Product ID: ${productId}`);

            // 2. Parse Specifications
            const specObj = {};
            if (specifications) {
                const parts = specifications.split(/,\s*/);
                for (const p of parts) {
                    const colonIdx = p.indexOf(':');
                    if (colonIdx > 0) {
                        const key = p.substring(0, colonIdx).trim();
                        const val = p.substring(colonIdx + 1).trim();
                        if (key && val) {
                            specObj[key] = val;
                        }
                    }
                }
            }

            // Parse Badges
            let badgeList = [];
            if (badges) {
                badgeList = badges.split(/,\s*/).map(b => b.trim()).filter(Boolean);
            }

            // 3. Build product metadata
            const metadataObj = {
                how_to_use: how_to_use || null,
                key_benefits: key_benefits || null,
                suitable_for: suitable_for || null,
                product_specifications: Object.keys(specObj).length > 0 ? specObj : null,
                product_badges: badgeList.length > 0 ? badgeList.map(b => ({ label: b, iconId: b.toLowerCase().replace(/\s+/g, '-') })) : null
            };

            // Maintain color_hex_map for shoe creams
            if (product_title.toLowerCase().includes("shoe cream") || product_title.toLowerCase().includes("shine")) {
                metadataObj.color_hex_map = {
                    "Neutral": "#e1d4c0", "neutral": "#e1d4c0",
                    "Black": "#000000", "black": "#000000",
                    "Light Brown": "#b58a5c", "light brown": "#b58a5c",
                    "Medium Brown": "#8b5a2b", "medium brown": "#8b5a2b",
                    "Dark Brown": "#3d2314", "dark brown": "#3d2314",
                    "Tan": "#b67b3e", "tan": "#b67b3e",
                    "Cognac": "#9f381d", "cognac": "#9f381d",
                    "Mahogany": "#4a150b", "mahogany": "#4a150b",
                    "Blue": "#1e3a8a", "blue": "#1e3a8a",
                    "White": "#ffffff", "white": "#ffffff",
                    "Brown": "#654321", "brown": "#654321"
                };
            }

            // 4. Update Product
            await client.query(
                `UPDATE product 
                 SET thumbnail = $1, metadata = metadata || $2, updated_at = NOW() 
                 WHERE id = $3;`,
                [thumbnail, JSON.stringify(metadataObj), productId]
            );

            // 5. Update Variant Prices
            // Get price set ID
            const psRes = await client.query(
                "SELECT price_set_id FROM product_variant_price_set WHERE variant_id = $1;",
                [variantId]
            );

            if (psRes.rows.length > 0) {
                const priceSetId = psRes.rows[0].price_set_id;

                // 5.1 MRP (INR Default Price)
                await client.query(
                    "DELETE FROM price WHERE price_set_id = $1 AND price_list_id IS NULL AND currency_code = 'inr';",
                    [priceSetId]
                );
                const mrpId = "price_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                const mrpRaw = JSON.stringify({ value: mrp.toString(), precision: 20 });
                await client.query(
                    `INSERT INTO price (id, amount, currency_code, raw_amount, rules_count, price_set_id, price_list_id, created_at, updated_at)
                     VALUES ($1, $2, 'inr', $3, 0, $4, NULL, NOW(), NOW());`,
                    [mrpId, mrp, mrpRaw, priceSetId]
                );

                // 5.2 USD Default Price
                const usdMrp = Math.floor(mrp / 80) || 1;
                await client.query(
                    "DELETE FROM price WHERE price_set_id = $1 AND price_list_id IS NULL AND currency_code = 'usd';",
                    [priceSetId]
                );
                const usdId = "price_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                const usdRaw = JSON.stringify({ value: usdMrp.toString(), precision: 20 });
                await client.query(
                    `INSERT INTO price (id, amount, currency_code, raw_amount, rules_count, price_set_id, price_list_id, created_at, updated_at)
                     VALUES ($1, $2, 'usd', $3, 0, $4, NULL, NOW(), NOW());`,
                    [usdId, usdMrp, usdRaw, priceSetId]
                );

                // 5.3 Selling Price (pl_online_sale Price List)
                await client.query(
                    "DELETE FROM price WHERE price_set_id = $1 AND price_list_id = 'pl_online_sale' AND currency_code = 'inr';",
                    [priceSetId]
                );
                const sellId = "price_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                const sellRaw = JSON.stringify({ value: sellingPrice.toString(), precision: 20 });
                await client.query(
                    `INSERT INTO price (id, amount, currency_code, raw_amount, rules_count, price_set_id, price_list_id, created_at, updated_at)
                     VALUES ($1, $2, 'inr', $3, 0, $4, 'pl_online_sale', NOW(), NOW());`,
                    [sellId, sellingPrice, sellRaw, priceSetId]
                );
            }

            // 6. Aligned Image Seeding and Variant Linkage
            // To be safe, clear any images of this variant first, and clear product images if they exist
            // Wait, to keep shared product images but make sure the variant has EXACTLY the images from CSV linked to it:
            // For each image in `images` list:
            //   - Check if this image URL already exists for the product. If not, insert it.
            //   - Link this image to the variant.
            
            // Delete old variant links
            await client.query(
                "DELETE FROM product_variant_product_image WHERE variant_id = $1;",
                [variantId]
            );

            for (let idx = 0; idx < images.length; idx++) {
                const imgUrl = images[idx];

                // Check if image exists for product
                let imgId;
                const imgCheck = await client.query(
                    "SELECT id FROM image WHERE product_id = $1 AND url = $2;",
                    [productId, imgUrl]
                );

                if (imgCheck.rows.length > 0) {
                    imgId = imgCheck.rows[0].id;
                    // Update rank
                    await client.query(
                        "UPDATE image SET rank = $1 WHERE id = $2;",
                        [idx, imgId]
                    );
                } else {
                    imgId = "img_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                    await client.query(
                        `INSERT INTO image (id, url, product_id, rank, created_at, updated_at)
                         VALUES ($1, $2, $3, $4, NOW(), NOW());`,
                        [imgId, imgUrl, productId, idx]
                    );
                }

                // Link image to variant
                const pvpiId = "pvpi_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                await client.query(
                    `INSERT INTO product_variant_product_image (id, variant_id, image_id, created_at, updated_at)
                     VALUES ($1, $2, $3, NOW(), NOW());`,
                    [pvpiId, variantId, imgId]
                );
            }

            updatedCount++;
        }

        console.log(`✅ Alignment finished successfully! ${updatedCount} variants aligned, ${missedCount} variants missed.`);
    } catch (err) {
        console.error("❌ SQL execution error: ", err);
        throw err;
    } finally {
        await client.end();
    }
}

run().catch(e => {
    console.error("Error executing script:", e);
    process.exit(1);
});
