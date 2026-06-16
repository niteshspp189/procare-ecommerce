import { ExecArgs } from "@medusajs/framework/types";
import {
    ContainerRegistrationKeys,
    Modules,
    ProductStatus,
} from "@medusajs/framework/utils";
import {
    createProductsWorkflow,
    createCollectionsWorkflow,
} from "@medusajs/medusa/core-flows";
import * as fs from "fs";
import * as path from "path";
import { Client } from "pg";

export default async function seedCsvMrp({ container }: ExecArgs) {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const productModuleService = container.resolve(Modules.PRODUCT);
    const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);
    const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);

    logger.info("🚀 Starting Complete CSV-based Catalog Seeding...");

    // 1. Setup Environment
    const [salesChannel] = await salesChannelModuleService.listSalesChannels({ name: "Default Sales Channel" });
    const shippingProfiles = await fulfillmentModuleService.listShippingProfiles({ type: "default" });
    const shippingProfile = shippingProfiles[0];

    // 2. Resolve Category IDs dynamically by handle
    const catSearch = await query.graph({
        entity: "product_category",
        fields: ["id", "name", "handle"],
    });
    const categoriesMap: Record<string, string> = {};
    for (const cat of catSearch.data) {
        categoriesMap[cat.handle] = cat.id;
    }
    logger.info(`Mapped categories: ${JSON.stringify(categoriesMap)}`);

    // Ensure main categories exist in the map
    const requiredCats = ["shoe-care", "insoles", "foot-care", "accessories"];
    for (const cat of requiredCats) {
        if (!categoriesMap[cat]) {
            logger.error(`Missing required category handle: ${cat}`);
            throw new Error(`Database is missing category: ${cat}`);
        }
    }

    // 3. Ensure Collections Exist
    const collectionNames = ["Featured", "New Arrivals"];
    const collections: any = {};
    const { data: existingCols } = await query.graph({
        entity: "product_collection",
        fields: ["id", "title", "handle"],
        filters: { title: collectionNames }
    });

    for (const title of collectionNames) {
        let col = existingCols.find(c => c.title === title);
        if (!col) {
            const { result } = await createCollectionsWorkflow(container).run({
                input: { collections: [{ title }] }
            });
            col = result[0] as any;
        }
        collections[title] = col;
    }

    // 4. Parse client's CSV file
    const csvPath = path.join(process.cwd(), "src", "scripts", "MRP_Online_Product_wise.csv");
    logger.info(`Parsing CSV from: ${csvPath}`);
    const csvContent = fs.readFileSync(csvPath, "utf-8");
    const csvLines = csvContent.split(/\r?\n/);
    const csvProducts: any[] = [];

    for (let i = 2; i < csvLines.length; i++) {
        const line = csvLines[i].trim();
        if (!line) continue;
        const parts = line.split(",");
        if (parts.length < 12) continue;

        csvProducts.push({
            srNo: parts[0].trim(),
            brand: parts[1].trim(),
            name: parts[2].trim(),
            mrp: parseFloat(parts[3].trim()) || 0,
            sellingPrice: parseFloat(parts[8].trim()) || 0,
            category: parts[9].trim(),
            gst: parts[10].trim(),
            size: parts[11].trim(),
            description: parts[12].trim(),
            howToUse: parts[13].trim(),
            image1: parts[15] ? parts[15].trim() : "",
            image2: parts[16] ? parts[16].trim() : "",
            image3: parts[17] ? parts[17].trim() : "",
            image4: parts[18] ? parts[18].trim() : ""
        });
    }
    logger.info(`Loaded ${csvProducts.length} entries from CSV.`);

    // Helper to extract base product name and variant name
    function getProductAndVariantName(fullName: string) {
        const cleanName = fullName.replace(/\s+/g, " ").trim();
        if (cleanName.includes(" -")) {
            const parts = cleanName.split(" -");
            const base = parts[0].trim();
            let variant = parts[1].replace(/\s*\d+g(m)?$/i, "").trim();
            if (!variant) variant = "Default";
            return { base, variant };
        }
        return { base: cleanName, variant: "Default" };
    }

    // Group CSV rows by base product name
    const groupedCsvProducts: Record<string, typeof csvProducts> = {};
    for (const item of csvProducts) {
        const { base } = getProductAndVariantName(item.name);
        if (!groupedCsvProducts[base]) {
            groupedCsvProducts[base] = [];
        }
        groupedCsvProducts[base].push(item);
    }

    // Load actual descriptions and metadata from the catalog to preserve rich information
    const catalogPath = path.join(process.cwd(), "src", "scripts", "PRO_GOLD_Product_Catalog.md");
    logger.info(`Reading rich descriptions/how-to-use from: ${catalogPath}`);
    const catalogContent = fs.readFileSync(catalogPath, "utf-8");
    const catalogSections = catalogContent.split(/\n## /).slice(1);
    
    const catalogData: Record<string, { description: string; how_to_use: string; metadata: any }> = {};
    for (const section of catalogSections) {
        const items = section.split(/\n### /).slice(1);
        for (const item of items) {
            const itemLines = item.split("\n");
            const title = itemLines[0].replace(/^\d+\.\s*/, "").trim();
            
            const extract = (key: string) => {
                const match = item.match(new RegExp(`\\*\\*${key}:\\*\\*\\s*(.*)`));
                return match ? match[1].trim() : "";
            };

            const extractList = (header: string) => {
                const parts = item.split(new RegExp(`#### ${header}`, 'i'));
                if (parts.length < 2) return "";
                const listPart = parts[1].split(/\n#{2,4}|---|#### /)[0].trim();
                return listPart;
            };

            catalogData[title.toLowerCase()] = {
                description: extract("Product Type") || `Premium ${title}`,
                how_to_use: extractList("How to Use"),
                metadata: {
                    suitable_for: extract("Suitable For"),
                    ingredients: extract("Key Ingredients"),
                    formula: extract("Formula"),
                    safety: extract("Safety"),
                    includes: extract("Includes"),
                    key_benefits: extractList("Key Benefits"),
                }
            };
        }
    }

    // Mapping CSV base names to catalog titles to resolve descriptions/metadata
    const csvBaseToCatalogTitle: Record<string, string> = {
        "PRO GOLD Shoe Cream": "Pro Gold Color Shoe Cream",
        "PRO GOLD Shoe Cream With Applicator": "Pro Gold Color Shoe Cream with Applicator",
        "PRO GOLD Self Shine": "Pro Gold Shine Self Shine",
        "PRO GOLD Instant Shiner": "Pro Gold Shine Instant Shine",
        "PRO GOLD Leather Moisturize": "Pro Gold Care Leather Moisturizer",
        "PRO GOLD Power Sneaker Cleaner": "Pro Gold Clean Power Cleaning Shampoo",
        "PRO GOLD Clean Power Cleaner(Cleaning Shampoo & Mini Brush)": "PRO GOLD Sneaker Cleaning Kit (Shampoo + Mini Brush)",
        "PRO GOLD Clean Sneaker Wipes-Pack of 30": "PRO GOLD Sneaker Wipes – Pack of 30",
        "PRO GOLD SPORTS & SNEAKER CLEANING KIT": "PRO GOLD SPORTS & SNEAKER CLEANING KIT", // New
        "PRO GOLD Foam Cleaner": "PRO GOLD Foam Cleaner",
        "PRO GOLD Shoe Deo": "PRO GOLD Shoe Deo"
    };

    // 5. Construct creation inputs for Pro Gold products from CSV groups
    const productsToCreate: any[] = [];
    const csvVariantsMap: Record<string, { name: string; mrp: number; sellingPrice: number }[]> = {};

    for (const [csvBaseName, rows] of Object.entries(groupedCsvProducts)) {
        const catalogTitle = csvBaseToCatalogTitle[csvBaseName] || csvBaseName;
        const catalogInfo = catalogData[catalogTitle.toLowerCase()] || { description: `Premium ${csvBaseName}`, how_to_use: "", metadata: {} };
        
        const handle = catalogTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
        const categoryId = categoriesMap["shoe-care"]; // All Pro Gold in CSV are under Shoe Care / Shoecare

        // Use a single existing fallback image to prevent broken images on storefront
        const imagesList = [{ url: "/images/polish.jpeg" }];
        const thumbnail = "/images/polish.jpeg";

        // Determine options
        const hasColors = rows.some(r => getProductAndVariantName(r.name).variant !== "Default");
        const options = hasColors ? [{ title: "Color", values: rows.map(r => getProductAndVariantName(r.name).variant) }] : [{ title: "Variant", values: ["Default"] }];

        // Define variants
        const variants = rows.map((r, index) => {
            const { variant } = getProductAndVariantName(r.name);
            const variantSku = `PG-${handle}-${variant.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
            const variantOptions = hasColors ? { Color: variant } : { Variant: "Default" };

            return {
                title: variant,
                sku: variantSku,
                options: variantOptions,
                manage_inventory: false,
                metadata: {
                    size: r.size,
                    gst: r.gst,
                    image_1: r.image1,
                    image_2: r.image2,
                    image_3: r.image3,
                    image_4: r.image4
                },
                prices: [
                    { amount: r.mrp, currency_code: "inr" },
                    { amount: Math.floor(r.mrp / 80), currency_code: "usd" }
                ]
            };
        });

        // Store prices for the later SQL price list step
        csvVariantsMap[catalogTitle.toLowerCase()] = rows.map(r => ({
            name: r.name,
            mrp: r.mrp,
            sellingPrice: r.sellingPrice
        }));

        const firstRow = rows[0];
        const productSize = firstRow?.size || "";

        const productMetadata: Record<string, any> = {
            ...catalogInfo.metadata,
            how_to_use: catalogInfo.how_to_use
        };

        if (hasColors) {
            productMetadata.color_hex_map = {
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

        productsToCreate.push({
            title: catalogTitle,
            handle,
            subtitle: productSize, // Map size to subtitle so it displays correctly in storefront size badges / details
            description: catalogInfo.description,
            status: ProductStatus.PUBLISHED,
            images: imagesList,
            thumbnail,
            shipping_profile_id: shippingProfile.id,
            category_ids: [categoryId],
            collection_id: collections["Featured"]?.id,
            metadata: productMetadata,
            options,
            variants
        });
    }

    // 6. Parse and add the 12 non-Pro-Gold products from catalog markdown
    logger.info("Parsing 12 non-Pro-Gold products from markdown...");
    const nonProGoldTitles = [
        "Pro Horse Hair Brush", "Pro Application Brush", "Pro Gloss Brush", "Pro Suede Brush", "Pro Suede 2in1",
        "PRO Insoles Ease Memory Foam", "PRO Comfort Air Walk Gel Insoles", "PRO Comfort Gel Insoles", "PRO Insoles Ease Soft",
        "PRO Hydroshield", "PRO Suede and Nubuck Renovator Spray", "PRO Premium Shoe Tree"
    ];

    for (const section of catalogSections) {
        const sectionLines = section.split("\n");
        const categoryHeader = sectionLines[0].trim().replace("Shoe Care – ", "");
        
        let targetCategorySlug = "shoe-care";
        if (categoryHeader.toLowerCase().includes("insoles")) targetCategorySlug = "insoles";
        if (categoryHeader.toLowerCase().includes("protectors")) targetCategorySlug = "foot-care";
        if (categoryHeader.toLowerCase().includes("accessories")) targetCategorySlug = "accessories";
        if (categoryHeader.toLowerCase().includes("brushes")) targetCategorySlug = "accessories";

        const categoryId = categoriesMap[targetCategorySlug];

        const items = section.split(/\n### /).slice(1);
        for (const item of items) {
            const itemLines = item.split("\n");
            const title = itemLines[0].replace(/^\d+\.\s*/, "").trim();

            if (!nonProGoldTitles.includes(title)) {
                // Skip Pro Gold items since they were handled via the CSV
                continue;
            }

            const extract = (key: string) => {
                const match = item.match(new RegExp(`\\*\\*${key}:\\*\\*\\s*(.*)`));
                return match ? match[1].trim() : "";
            };

            const extractList = (header: string) => {
                const parts = item.split(new RegExp(`#### ${header}`, 'i'));
                if (parts.length < 2) return "";
                const listPart = parts[1].split(/\n#{2,4}|---|#### /)[0].trim();
                return listPart;
            };

            const handle = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
            
            let price = 500;
            if (title.toLowerCase().includes("insoles")) price = 999;
            if (title.toLowerCase().includes("hydroshield") || title.toLowerCase().includes("renovator")) price = 850;

            productsToCreate.push({
                title,
                handle,
                description: extract("Product Type") || `Premium ${title}`,
                status: ProductStatus.PUBLISHED,
                images: [{ url: "/images/polish.jpeg" }],
                thumbnail: "/images/polish.jpeg",
                shipping_profile_id: shippingProfile.id,
                category_ids: [categoryId],
                collection_id: collections["Featured"]?.id,
                metadata: {
                    suitable_for: extract("Suitable For"),
                    ingredients: extract("Key Ingredients"),
                    formula: extract("Formula"),
                    safety: extract("Safety"),
                    includes: extract("Includes"),
                    how_to_use: extractList("How to Use"),
                    key_benefits: extractList("Key Benefits"),
                },
                options: [{ title: "Variant", values: ["Default"] }],
                variants: [{
                    title: "Default",
                    sku: `PG-${handle}`,
                    manage_inventory: false,
                    prices: [
                        { amount: price, currency_code: "inr" },
                        { amount: Math.floor(price / 80), currency_code: "usd" }
                    ]
                }]
            });
        }
    }

    // 7. Clear database products before seeding using SQL client to avoid orphans
    logger.info("🧹 Clearing existing database products and all related tables...");
    const cleanDbClient = new Client({ connectionString: process.env.DATABASE_URL });
    await cleanDbClient.connect();
    try {
        await cleanDbClient.query(`
            BEGIN;
            DELETE FROM price WHERE price_set_id IN (SELECT price_set_id FROM product_variant_price_set);
            DELETE FROM price_set WHERE id IN (SELECT price_set_id FROM product_variant_price_set);
            DELETE FROM product_variant_price_set;
            DELETE FROM product_variant_option;
            DELETE FROM product_variant_product_image;
            DELETE FROM product_option_value;
            DELETE FROM product_option;
            DELETE FROM product_variant;
            DELETE FROM product_category_product;
            DELETE FROM product_sales_channel;
            DELETE FROM product_shipping_profile;
            DELETE FROM product;
            COMMIT;
        `);
        logger.info("Cleared all product-related database records successfully.");
    } catch (err) {
        logger.error("Error clearing database: " + err);
        throw err;
    } finally {
        await cleanDbClient.end();
    }

    // 8. Create all products using workflows
    logger.info(`Creating ${productsToCreate.length} products (11 Pro Gold + 12 Accessories/Insoles)...`);
    const { result: createdProducts } = await createProductsWorkflow(container).run({
        input: { products: productsToCreate }
    });

    // 9. Link all created products to sales channel
    const linkService = container.resolve(ContainerRegistrationKeys.LINK);
    const links = createdProducts.map(p => ({
        [Modules.PRODUCT]: { product_id: p.id },
        [Modules.SALES_CHANNEL]: { sales_channel_id: salesChannel.id }
    }));
    await linkService.create(links);
    logger.info("Linked products to Sales Channel.");

    // 10. Update Selling Prices using SQL and a sale price list
    logger.info("💰 Creating Online Sale price list and setting up selling prices...");
    const dbClient = new Client({ connectionString: process.env.DATABASE_URL });
    await dbClient.connect();

    try {
        // Create "Online Sale" Price List if not exists
        await dbClient.query(`
            INSERT INTO price_list (id, status, type, title, description, created_at, updated_at)
            VALUES ('pl_online_sale', 'active', 'sale', 'Online Sale', 'Online Selling Prices', NOW(), NOW())
            ON CONFLICT (id) DO NOTHING;
        `);

        // Clean up any old prices in the "Online Sale" price list
        await dbClient.query("DELETE FROM price WHERE price_list_id = 'pl_online_sale';");

        // Link prices to variants
        for (const prod of createdProducts) {
            const catalogTitle = prod.title.toLowerCase();
            const csvPriceList = csvVariantsMap[catalogTitle];
            if (!csvPriceList) {
                // This is one of the 12 non-Pro-Gold products, skip price list assignment
                continue;
            }

            // Get variants of this product in database order
            const dbVariants = await productModuleService.listProductVariants({ product_id: prod.id }, { select: ["id", "title"] });
            
            for (let idx = 0; idx < dbVariants.length; idx++) {
                const dbVariant = dbVariants[idx];
                
                // Find matching CSV variant row based on title/color
                const csvRow = csvPriceList.find(c => {
                    const csvColor = getProductAndVariantName(c.name).variant;
                    const dbColor = dbVariant.title;
                    return csvColor.toLowerCase() === dbColor.toLowerCase() || dbVariant.title === "Default";
                }) || csvPriceList[idx];

                if (!csvRow) continue;

                // Query price set ID of this variant
                const priceSetRes = await dbClient.query(
                    "SELECT price_set_id FROM product_variant_price_set WHERE variant_id = $1;",
                    [dbVariant.id]
                );

                if (priceSetRes.rows.length > 0) {
                    const priceSetId = priceSetRes.rows[0].price_set_id;
                    const priceId = "price_" + Math.random().toString(36).substring(2, 15);
                    const rawAmount = JSON.stringify({ value: csvRow.sellingPrice.toString(), precision: 20 });

                    // Insert Selling Price linked to "Online Sale" price list
                    await dbClient.query(
                        `INSERT INTO price (id, amount, currency_code, raw_amount, rules_count, price_set_id, price_list_id, created_at, updated_at)
                         VALUES ($1, $2, 'inr', $3, 0, $4, 'pl_online_sale', NOW(), NOW());`,
                        [priceId, csvRow.sellingPrice, rawAmount, priceSetId]
                    );

                    logger.info(`💰 Added Selling Price ${csvRow.sellingPrice} INR for ${prod.title} (${dbVariant.title})`);
                }
            }
        }
    } catch (err) {
        logger.error("❌ Error setting up price lists in database: " + err);
        throw err;
    } finally {
        await dbClient.end();
    }

    logger.info(`✅ Successfully seeded ${createdProducts.length} products and set up custom selling prices!`);
}
