import { ExecArgs } from "@medusajs/framework/types";
import {
    ContainerRegistrationKeys,
    Modules,
    ProductStatus,
} from "@medusajs/framework/utils";
import {
    createProductsWorkflow,
} from "@medusajs/medusa/core-flows";
import * as fs from "fs";
import * as path from "path";
import { Client } from "pg";

export default async function updateCatalog({ container }: ExecArgs) {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);
    const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);

    logger.info("🚀 Starting Catalog Updates and Price Alignment script...");

    // 1. Setup Medusa Context
    const [salesChannel] = await salesChannelModuleService.listSalesChannels({ name: "Default Sales Channel" });
    const shippingProfiles = await fulfillmentModuleService.listShippingProfiles({ type: "default" });
    const shippingProfile = shippingProfiles[0];

    // Load category ids
    const catSearch = await query.graph({
        entity: "product_category",
        fields: ["id", "name", "handle"],
    });
    const categoriesMap: Record<string, string> = {};
    for (const cat of catSearch.data) {
        categoriesMap[cat.handle] = cat.id;
    }

    // Load Excel parsed data
    const jsonPath = path.join(__dirname, "excel_mrp_products.json");
    if (!fs.existsSync(jsonPath)) {
        logger.error(`excel_mrp_products.json not found at ${jsonPath}`);
        throw new Error("Missing excel_mrp_products.json");
    }
    const excelProducts = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    logger.info(`Loaded ${excelProducts.length} items from JSON file.`);

    // 2. Map item name to database handle & variant
    function mapNameDetails(name: string) {
        const lower = name.toLowerCase().replace("  ", " ").trim();

        // 1. Shoe Creams & Applicators
        if (lower.includes("shoe cream with applicator")) {
            const color = name.replace("PRO GOLD  Shoe Cream With Applicator -", "").replace("Premium Shoe Care Kit -", "").trim();
            const parts = color.split("-");
            const cleanColor = parts[parts.length - 1].trim();
            return { handle: "pro-gold-color-shoe-cream-with-applicator", variant: cleanColor };
        }
        if (lower.includes("shoe cream")) {
            const match = name.match(/shoe cream\s*-\s*([a-zA-Z\s]+)/i);
            const color = match ? match[1].replace("45gm", "").replace("45g", "").trim() : "Neutral";
            return { handle: "pro-gold-color-shoe-cream", variant: color };
        }
        if (lower.includes("self shine") || lower.includes("self-shine")) {
            const match = name.match(/self\s*shine\s*-\s*([a-zA-Z\s]+)/i);
            const color = match ? match[1].trim() : "Neutral";
            return { handle: "pro-gold-shine-self-shine", variant: color };
        }
        if (lower.includes("instant shiner") || lower.includes("instant shine")) {
            const match = name.match(/instant\s*shiner?\s*-\s*([a-zA-Z\s]+)/i);
            const color = match ? match[1].trim() : "Neutral";
            return { handle: "pro-gold-shine-instant-shine", variant: color };
        }

        // 2. Brushes
        if (lower.includes("application brush")) {
            const variant = lower.includes("dark") ? "Dark" : "Light";
            return { handle: "pro-application-brush", variant };
        }
        if (lower.includes("gloss brush")) {
            const variant = lower.includes("dark") ? "Dark" : "Light";
            return { handle: "pro-gloss-brush", variant };
        }
        if (lower.includes("horse hair brush")) {
            const variant = lower.includes("dark") ? "Dark" : "Light";
            return { handle: "pro-horse-hair-brush", variant };
        }
        if (lower.includes("suede brush rubber black")) {
            return { handle: "pro-suede-brush", variant: "Default" };
        }

        // 3. Shoe Trees
        if (lower.includes("premium shoe tree")) {
            const match = name.match(/(\d+\/\d+)/);
            const size = match ? match[1] : "Default";
            return { handle: "pro-premium-shoe-tree", variant: size };
        }
        if (lower.includes("shoe tree with spiral") || lower.includes("men shoe tree with spiral")) {
            const match = name.match(/(\d+\/\d+)/);
            const size = match ? match[1] : "Default";
            return { handle: "pro-accessories-men-shoe-tree-with-spiral", variant: size };
        }

        // 4. Insoles
        if (lower.includes("ease memory foam")) {
            const match = name.match(/size\s*(\d+)/i);
            const size = match ? `Size ${match[1]}` : "Default";
            return { handle: "pro-insoles-ease-memory-foam", variant: size };
        }
        if (lower.includes("ease soft comfort")) {
            return { handle: "pro-insoles-ease-soft", variant: "Default" };
        }
        if (lower.includes("active cricket")) {
            const match = name.match(/size\s*(\d+-\d+)/i);
            const size = match ? match[1] : "Default";
            return { handle: "pro-insoles-active-cricket", variant: size };
        }
        if (lower.includes("active cycling")) {
            const match = name.match(/size\s*(\d+-\s*\d+)/i);
            const size = match ? match[1].replace(" ", "") : "Default";
            return { handle: "pro-insoles-active-cycling", variant: size };
        }
        if (lower.includes("active running")) {
            const match = name.match(/size\s*(\d+-\s*\d+)/i);
            const size = match ? match[1].replace(" ", "") : "Default";
            return { handle: "pro-insoles-active-running", variant: size };
        }
        if (lower.includes("ease aloe vera")) {
            return { handle: "pro-insoles-ease-aloe-vera", variant: "Default" };
        }
        if (lower.includes("ease pacific blue")) {
            return { handle: "pro-insoles-ease-pacific-blue", variant: "Default" };
        }
        if (lower.includes("gel comfort air walk")) {
            const variant = lower.includes("large") ? "Large" : "Small";
            return { handle: "pro-comfort-air-walk-gel-insoles", variant };
        }
        if (lower.includes("gel comfort foot bed")) {
            const variant = lower.includes("large") ? "Large" : "Small";
            return { handle: "pro-comfort-gel-insoles", variant };
        }
        if (lower.includes("gel comfort heel lovers")) {
            return { handle: "pro-insoles-gel-comfort-heel-lovers", variant: "Universal" };
        }
        if (lower.includes("gel comfort heel pad")) {
            const variant = lower.includes("large") ? "Large" : "Small";
            return { handle: "pro-insoles-gel-comfort-heel-pad", variant };
        }
        if (lower.includes("ease heel liner")) {
            return { handle: "pro-insole-ease-heel-liner", variant: "Default" };
        }

        // 5. Essentials
        if (lower.includes("brush & pumice combo")) {
            return { handle: "pro-essentials-brush-pumice-combo-turqouise", variant: "Default" };
        }
        if (lower.includes("double sided foot file pink")) {
            return { handle: "pro-essentials-double-sided-foot-file-pink", variant: "Default" };
        }
        if (lower.includes("double sided foot file purple")) {
            return { handle: "pro-essentials-double-sided-foot-file-purple", variant: "Default" };
        }
        if (lower.includes("dual action foot file")) {
            return { handle: "pro-essentials-dual-action-foot-file-turqouise", variant: "Default" };
        }
        if (lower.includes("magic pedi roller pack black")) {
            return { handle: "pro-essentials-magic-pedi-roller-pack-black", variant: "Default" };
        }
        if (lower.includes("magic pedi")) {
            return { handle: "pro-essentials-magic-pedi-roller", variant: "Default" };
        }
        if (lower.includes("nail file")) {
            return { handle: "pro-essentials-nail-file-turqouise", variant: "Default" };
        }
        if (lower.includes("nail buffer")) {
            return { handle: "pro-essentials-nail-buffer-turqouise", variant: "Default" };
        }
        if (lower.includes("nail clipper")) {
            return { handle: "pro-essentials-nail-clipper-turqouise", variant: "Default" };
        }
        if (lower.includes("smooth feet pumice")) {
            return { handle: "pro-essentials-smooth-feet-pumice-turqouise", variant: "Default" };
        }

        // 6. Others
        if (lower.includes("naivy white")) {
            return { handle: "pro-color-naivy-white-75ml-white", variant: "Default" };
        }
        if (lower.includes("leather moisturize") || lower.includes("leather moisturizer")) {
            return { handle: "pro-gold-care-leather-moisturizer", variant: "Neutral" };
        }
        if (lower.includes("power sneaker cleaner") || lower.includes("sneaker cleaner")) {
            return { handle: "pro-gold-clean-power-cleaning-shampoo", variant: "Neutral" };
        }
        if (lower.includes("clean power cleaner")) {
            return { handle: "pro-gold-sneaker-cleaning-kit-shampoo-mini-brush", variant: "Neutral" };
        }
        if (lower.includes("sneaker wipes")) {
            return { handle: "pro-gold-sneaker-wipes-pack-of-30", variant: "Neutral" };
        }
        if (lower.includes("foam cleaner")) {
            return { handle: "pro-gold-foam-cleaner", variant: "Neutral" };
        }
        if (lower.includes("shoe deo")) {
            return { handle: "pro-gold-shoe-deo", variant: "Default" };
        }
        if (lower.includes("suede n nubuck spray") || lower.includes("renovator spray")) {
            return { handle: "pro-suede-and-nubuck-renovator-spray", variant: "Default" };
        }
        if (lower.includes("hydroshield")) {
            return { handle: "pro-hydroshield", variant: "Default" };
        }
        if (lower.includes("premium sneaker care kit")) {
            return { handle: "pro-premium-sneaker-care-kit", variant: "Default" };
        }
        if (lower.includes("shoe horn metal 52 cm")) {
            return { handle: "shoe-horn-metal-52-cm", variant: "Default" };
        }
        if (lower.includes("nubuck 2 in 1") || lower.includes("nubuck 2in1")) {
            return { handle: "pro-suede-2in1", variant: "Default" };
        }
        if (lower.includes("perfect clean gel")) {
            return { handle: "pro-clean-perfect-clean-gel-50ml-neutral", variant: "Default" };
        }
        if (lower.includes("easy care combo")) {
            return { handle: "pro-clean-easy-care-combo-pack-neutral", variant: "Default" };
        }

        // Fallbacks
        if (lower.includes("loving my bag")) {
            return { handle: "loving-my-bag-kit", variant: "Default" };
        }
        if (lower.includes("suede n nubuck shoe care kit")) {
            return { handle: "suede-n-nubuck-shoe-care-kit", variant: "Default" };
        }
        if (lower.includes("premium shoe care kit")) {
            return { handle: "premium-shoe-care-kit", variant: "Default" };
        }
        if (lower.includes("sneaker wipes kit pack")) {
            return { handle: "sneaker-wipes-kit-pack", variant: "Default" };
        }
        if (lower.includes("sports & sneaker cleaning kit")) {
            return { handle: "pro-gold-sports-sneaker-cleaning-kit", variant: "Default" };
        }

        return { handle: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), variant: "Default" };
    }

    // 3. Ensure the 5 missing products are seeded
    const missingProducts = [
        {
            title: "Loving My Bag Kit",
            handle: "loving-my-bag-kit",
            description: "Premium Leather Bag Care Kit. Formulated to clean, condition, and protect all types of leather bags.",
            categorySlug: "shoe-care",
            thumbnail: "/images/products/Loving My Bag Kit -Neutral/1.webp",
            variantTitle: "Default"
        },
        {
            title: "Suede N Nubuck Shoe Care Kit",
            handle: "suede-n-nubuck-shoe-care-kit",
            description: "Professional Suede and Nubuck Shoe Care Kit. Includes specialized tools and cleaner to restore and protect suede shoes.",
            categorySlug: "shoe-care",
            thumbnail: "/images/products/Suede N Nubuck Shoe Care Kit -Neutral/1.webp",
            variantTitle: "Default"
        },
        {
            title: "Premium Shoe Care Kit",
            handle: "premium-shoe-care-kit",
            description: "Premium Shoe Care Kit. The ultimate collection of premium creams, wax polishes, and horsehair brushes for complete shoe care.",
            categorySlug: "shoe-care",
            thumbnail: "/images/products/Premium Shoe Care Kit -Neutral/1.webp",
            variantTitle: "Default"
        },
        {
            title: "PRO Insoles Ease Pacific Blue",
            handle: "pro-insoles-ease-pacific-blue",
            description: "PRO Insoles Ease Pacific Blue. Designed for maximum arch support, comfort, and shock absorption.",
            categorySlug: "insoles",
            thumbnail: "/images/products/PRO Insoles Ease Pacific Blue/1.webp",
            variantTitle: "Default"
        },
        {
            title: "PRO Insoles Gel Comfort Heel Lovers",
            handle: "pro-insoles-gel-comfort-heel-lovers",
            description: "PRO Insoles Gel Comfort Heel Lovers. Premium gel heel cups offering superior comfort and pressure relief for heel pain.",
            categorySlug: "insoles",
            thumbnail: "/images/products/PRO Insoles Gel Comfort Heel Lovers/1.webp",
            variantTitle: "Universal"
        }
    ];

    for (const item of missingProducts) {
        // Check if product already exists by handle
        const { data: existingProds } = await query.graph({
            entity: "product",
            fields: ["id", "handle"],
            filters: { handle: item.handle }
        });

        if (existingProds.length === 0) {
            logger.info(`Creating missing product: ${item.title}`);
            const categoryId = categoriesMap[item.categorySlug] || categoriesMap["accessories"];
            
            const { result: newProds } = await createProductsWorkflow(container).run({
                input: {
                    products: [{
                        title: item.title,
                        handle: item.handle,
                        description: item.description,
                        status: ProductStatus.PUBLISHED,
                        thumbnail: item.thumbnail,
                        images: [{ url: item.thumbnail }],
                        shipping_profile_id: shippingProfile.id,
                        category_ids: [categoryId],
                        options: [{ title: "Variant", values: [item.variantTitle] }],
                        variants: [{
                            title: item.variantTitle,
                            sku: `PG-${item.handle}-${item.variantTitle.toLowerCase()}`,
                            options: { Variant: item.variantTitle },
                            manage_inventory: false,
                            prices: [
                                { amount: 100, currency_code: "inr" },
                                { amount: 1, currency_code: "usd" }
                            ]
                        }]
                    }]
                }
            });

            // Link to sales channel
            const linkService = container.resolve(ContainerRegistrationKeys.LINK);
            await linkService.create([{
                [Modules.PRODUCT]: { product_id: newProds[0].id },
                [Modules.SALES_CHANNEL]: { sales_channel_id: salesChannel.id }
            }]);
            logger.info(`Successfully created and linked missing product ${item.title}.`);
        } else {
            logger.info(`Product already exists: ${item.title}`);
        }
    }

    // 4. Update prices using raw PG client
    logger.info("💰 Connecting to database for raw SQL price updates...");
    const dbClient = new Client({ connectionString: process.env.DATABASE_URL });
    await dbClient.connect();

    try {
        // Ensure Price List exists
        await dbClient.query(`
            INSERT INTO price_list (id, status, type, title, description, created_at, updated_at)
            VALUES ('pl_online_sale', 'active', 'sale', 'Online Sale', 'Online Selling Prices', NOW(), NOW())
            ON CONFLICT (id) DO NOTHING;
        `);

        let updatedCount = 0;
        let missedCount = 0;

        for (const item of excelProducts) {
            const mapping = mapNameDetails(item.name);
            if (!mapping) continue;

            const { handle, variant } = mapping;

            // Query variant ID and price set ID from DB
            const res = await dbClient.query(`
                SELECT pv.id as variant_id, pvps.price_set_id
                FROM product_variant pv
                JOIN product_variant_price_set pvps ON pv.id = pvps.variant_id
                JOIN product p ON pv.product_id = p.id
                WHERE p.handle = $1 AND (LOWER(pv.title) = LOWER($2) OR pv.title = 'Default');
            `, [handle, variant]);

            if (res.rows.length > 0) {
                const { variant_id, price_set_id } = res.rows[0];

                const mrp = item.mrp;
                const selling = item.selling;
                const usdMrp = Math.floor(mrp / 80) || 1;

                // 1. Set Default INR Price (MRP)
                await dbClient.query(`
                    DELETE FROM price WHERE price_set_id = $1 AND price_list_id IS NULL AND currency_code = 'inr';
                `, [price_set_id]);
                
                const mrpPriceId = "price_" + Math.random().toString(36).substring(2, 15);
                const mrpRawAmount = JSON.stringify({ value: mrp.toString(), precision: 20 });
                await dbClient.query(`
                    INSERT INTO price (id, amount, currency_code, raw_amount, rules_count, price_set_id, price_list_id, created_at, updated_at)
                    VALUES ($1, $2, 'inr', $3, 0, $4, NULL, NOW(), NOW());
                `, [mrpPriceId, mrp, mrpRawAmount, price_set_id]);

                // 2. Set Default USD Price
                await dbClient.query(`
                    DELETE FROM price WHERE price_set_id = $1 AND price_list_id IS NULL AND currency_code = 'usd';
                `, [price_set_id]);

                const usdPriceId = "price_" + Math.random().toString(36).substring(2, 15);
                const usdRawAmount = JSON.stringify({ value: usdMrp.toString(), precision: 20 });
                await dbClient.query(`
                    INSERT INTO price (id, amount, currency_code, raw_amount, rules_count, price_set_id, price_list_id, created_at, updated_at)
                    VALUES ($1, $2, 'usd', $3, 0, $4, NULL, NOW(), NOW());
                `, [usdPriceId, usdMrp, usdRawAmount, price_set_id]);

                // 3. Set Selling Price (pl_online_sale List)
                await dbClient.query(`
                    DELETE FROM price WHERE price_set_id = $1 AND price_list_id = 'pl_online_sale' AND currency_code = 'inr';
                `, [price_set_id]);

                const sellPriceId = "price_" + Math.random().toString(36).substring(2, 15);
                const sellRawAmount = JSON.stringify({ value: selling.toString(), precision: 20 });
                await dbClient.query(`
                    INSERT INTO price (id, amount, currency_code, raw_amount, rules_count, price_set_id, price_list_id, created_at, updated_at)
                    VALUES ($1, $2, 'inr', $3, 0, $4, 'pl_online_sale', NOW(), NOW());
                `, [sellPriceId, selling, sellRawAmount, price_set_id]);

                updatedCount++;
            } else {
                missedCount++;
                logger.warn(`⚠️ Variant not found: Product handle='${handle}', Variant='${variant}' (Item: '${item.name}')`);
            }
        }

        logger.info(`✅ Price updates completed: ${updatedCount} successfully updated, ${missedCount} variants not found.`);
    } catch (err) {
        logger.error("❌ SQL execution error: " + err);
        throw err;
    } finally {
        await dbClient.end();
    }

    logger.info("🎉 Seeding / Update script finished successfully!");
}
