import { ExecArgs } from "@medusajs/framework/types";
import {
    ContainerRegistrationKeys,
    Modules,
    ProductStatus,
} from "@medusajs/framework/utils";
import {
    createProductsWorkflow,
    createProductCategoriesWorkflow,
} from "@medusajs/medusa/core-flows";
import * as fs from "fs";
import * as path from "path";

export default async function seedProGoldCatalog({ container }: ExecArgs) {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const productModuleService = container.resolve(Modules.PRODUCT);
    const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);
    const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);

    logger.info("🚀 Starting Robust PRO GOLD Seeder...");

    // 1. Setup Environment
    const [salesChannel] = await salesChannelModuleService.listSalesChannels({ name: "Default Sales Channel" });
    const shippingProfiles = await fulfillmentModuleService.listShippingProfiles({ type: "default" });
    const shippingProfile = shippingProfiles[0];

    // 2. Wipe Previous Products
    logger.info("🧹 Wiping catalog for clean seed...");
    const existingProducts = await productModuleService.listProducts({}, { select: ["id"] });
    if (existingProducts.length > 0) {
        await productModuleService.deleteProducts(existingProducts.map(p => p.id));
    }

    // 3. Read and Parse Markdown
    const catalogPath = path.join(process.cwd(), "PRO_GOLD_Product_Catalog.md");
    const content = fs.readFileSync(catalogPath, "utf-8");

    // Split by Categories
    const sections = content.split(/\n## /).slice(1);
    const productsToCreate: any[] = [];
    const placeholderImage = "/images/polish.jpeg";

    for (const section of sections) {
        const lines = section.split("\n");
        const categoryHeader = lines[0].trim();
        const categoryName = categoryHeader.replace("Shoe Care – ", "");

        logger.info(`📂 Found Category: ${categoryName}`);

        // Ensure category exists or create it
        const catSearch = await query.graph({
            entity: "product_category",
            fields: ["id"],
            filters: { name: categoryName }
        });

        let categoryId;
        if (catSearch.data.length > 0) {
            categoryId = catSearch.data[0].id;
        } else {
            const categoryResult = await createProductCategoriesWorkflow(container).run({
                input: { product_categories: [{ name: categoryName, is_active: true }] }
            });
            categoryId = categoryResult.result[0].id;
        }

        // Split by Products
        const items = section.split(/\n### /).slice(1);
        for (const item of items) {
            const itemLines = item.split("\n");
            const title = itemLines[0].replace(/^\d+\.\s*/, "").trim();
            const handle = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

            logger.info(`   ✨ Processing Product: ${title}`);

            const extract = (key: string) => {
                const match = item.match(new RegExp(`\\*\\*${key}:\\*\\*\\s*(.*)`));
                return match ? match[1].trim() : "";
            };

            const extractList = (header: string) => {
                const parts = item.split(new RegExp(`#### ${header}`, 'i'));
                if (parts.length < 2) return "";
                const listPart = parts[1].split(/\n###|\n##|---/)[0].trim();
                return listPart;
            };

            productsToCreate.push({
                title,
                handle,
                description: extract("Product Type") || `Premium ${title}`,
                subtitle: extract("Net Volume") || extract("Net Content"),
                status: ProductStatus.PUBLISHED,
                images: [{ url: placeholderImage }],
                thumbnail: placeholderImage,
                sales_channels: [{ id: salesChannel.id }],
                shipping_profile_id: shippingProfile.id,
                category_ids: [categoryId],
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
                        { amount: 1500 * 100, currency_code: "inr" },
                        { amount: 20 * 100, currency_code: "usd" }
                    ]
                }]
            });
        }
    }

    await createProductsWorkflow(container).run({
        input: { products: productsToCreate }
    });

    logger.info(`✅ Successfully seeded ${productsToCreate.length} products!`);
}
