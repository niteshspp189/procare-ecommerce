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

    logger.info("🚀 Starting Final Optimized PRO GOLD Seeder...");

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

    // 3. Ensure Master Categories Exist (Mapping to Homepage)
    const masterCategoryMap: Record<string, string> = {
        "Creams & Polish": "shoe-care",
        "Cleaners": "shoe-care",
        "Brushes": "shoe-care",
        "Insoles": "insoles",
        "Protectors": "shoe-care",
        "Accessories": "shoe-care",
        "Foot Care": "foot-care"
    };

    const categories: Record<string, any> = {};
    for (const slug of ["shoe-care", "insoles", "foot-care"]) {
        const catSearch = await query.graph({
            entity: "product_category",
            fields: ["id", "name"],
            filters: { handle: slug }
        });

        if (catSearch.data.length > 0) {
            categories[slug] = catSearch.data[0];
        } else {
            const name = slug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
            const { result } = await createProductCategoriesWorkflow(container).run({
                input: { product_categories: [{ name, handle: slug, is_active: true }] }
            });
            categories[slug] = result[0];
        }
    }

    // 4. Read and Parse Markdown
    const catalogPath = path.join(process.cwd(), "PRO_GOLD_Product_Catalog.md");
    const content = fs.readFileSync(catalogPath, "utf-8");

    // Split by Categories (## sections)
    const sections = content.split(/\n## /).slice(1);
    const productsToCreate: any[] = [];
    const placeholderImage = "/images/polish.jpeg";

    for (const section of sections) {
        const lines = section.split("\n");
        const categoryHeader = lines[0].trim().replace("Shoe Care – ", "");
        const masterSlug = masterCategoryMap[categoryHeader] || "shoe-care";
        const categoryId = categories[masterSlug].id;

        logger.info(`📂 Mapping Category [${categoryHeader}] to Master [${masterSlug}]`);

        const items = section.split(/\n### /).slice(1);
        for (const item of items) {
            const itemLines = item.split("\n");
            const title = itemLines[0].replace(/^\d+\.\s*/, "").trim();
            const handle = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

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

            // Set dynamic pricing based on category
            let price = 500;
            if (categoryHeader.toLowerCase().includes("kit")) price = 1499;
            if (categoryHeader.toLowerCase().includes("insoles")) price = 999;
            if (categoryHeader.toLowerCase().includes("protectors")) price = 850;
            if (categoryHeader.toLowerCase().includes("shampoo")) price = 450;

            productsToCreate.push({
                title,
                handle,
                description: extract("Product Type") || `Premium ${title}`,
                subtitle: extract("Net Volume") || extract("Net Content"),
                status: ProductStatus.PUBLISHED,
                images: [{ url: placeholderImage }],
                thumbnail: placeholderImage,
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
                        { amount: price, currency_code: "inr" }, // No * 100, server scale is 1:1
                        { amount: Math.floor(price / 80), currency_code: "usd" }
                    ]
                }]
            });
        }
    }

    const { result: createdProducts } = await createProductsWorkflow(container).run({
        input: { products: productsToCreate }
    });

    // Final Link to Sales Channel
    const linkService = container.resolve(ContainerRegistrationKeys.LINK);
    const links = createdProducts.map(p => ({
        [Modules.PRODUCT]: { product_id: p.id },
        [Modules.SALES_CHANNEL]: { sales_channel_id: salesChannel.id }
    }));
    await linkService.create(links);

    logger.info(`✅ Successfully seeded ${createdProducts.length} products with corrected scale and master categories.`);
}
