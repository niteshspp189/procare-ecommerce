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

    logger.info("🚀 Starting Advanced PRO GOLD Seeding from Markdown...");

    // 1. Setup Environment
    const [salesChannel] = await salesChannelModuleService.listSalesChannels({ name: "Default Sales Channel" });
    const shippingProfiles = await fulfillmentModuleService.listShippingProfiles({ type: "default" });
    const shippingProfile = shippingProfiles[0];

    // 2. Wipe Previous Products for a Clean Start
    logger.info("🧹 Clearing existing product catalog...");
    const existingProducts = await productModuleService.listProducts({}, { select: ["id"] });
    if (existingProducts.length > 0) {
        await productModuleService.deleteProducts(existingProducts.map(p => p.id));
    }

    // 3. Read and Parse Markdown
    const catalogPath = path.join(process.cwd(), "..", "PRO_GOLD_Product_Catalog.md");
    const content = fs.readFileSync(catalogPath, "utf-8");

    const sections = content.split(/## /);
    const productsToCreate: any[] = [];

    // Default image
    const placeholderImage = "/images/polish.jpeg";

    for (const section of sections) {
        if (!section.includes("### ")) continue;

        const categoryName = section.split("\n")[0].trim().replace("Shoe Care – ", "");
        const categoryResult = await createProductCategoriesWorkflow(container).run({
            input: { product_categories: [{ name: categoryName, is_active: true }] }
        });
        const categoryId = categoryResult.result[0].id;

        const items = section.split(/### /).slice(1);
        for (const item of items) {
            const lines = item.split("\n");
            const title = lines[0].replace(/\d+\./, "").trim();
            const handle = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

            // Extract Metadata using RegEx
            const extract = (key: string) => {
                const match = item.match(new RegExp(`\\*\\*${key}:\\*\\*\\s*(.*)`));
                return match ? match[1].trim() : "";
            };

            const type = extract("Product Type");
            const volume = extract("Net Volume") || extract("Net Content");
            const suitable = extract("Suitable For");
            const ingredients = extract("Key Ingredients");
            const formula = extract("Formula");
            const safety = extract("Safety");
            const includes = extract("Includes");

            // Extract Multi-line sections (Benefits and Usage)
            const extractList = (header: string) => {
                const parts = item.split(new RegExp(`#### ${header}`, 'i'));
                if (parts.length < 2) return "";
                const listPart = parts[1].split(/---|#### /)[0].trim();
                return listPart;
            };

            const benefits = extractList("Key Benefits");
            const usage = extractList("How to Use");

            productsToCreate.push({
                title,
                handle,
                description: type || `Premium ${title}`,
                subtitle: volume,
                status: ProductStatus.PUBLISHED,
                images: [{ url: placeholderImage }],
                thumbnail: placeholderImage,
                sales_channels: [{ id: salesChannel.id }],
                shipping_profile_id: shippingProfile.id,
                category_ids: [categoryId],
                metadata: {
                    suitable_for: suitable,
                    ingredients: ingredients,
                    formula: formula,
                    safety: safety,
                    includes: includes,
                    how_to_use: usage,
                    key_benefits: benefits,
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

    logger.info(`✅ Successfully seeded ${productsToCreate.length} PRO GOLD products with full metadata!`);
}
