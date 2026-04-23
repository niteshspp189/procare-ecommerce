import { ExecArgs } from "@medusajs/framework/types";
import {
    ContainerRegistrationKeys,
    Modules,
    ProductStatus,
} from "@medusajs/framework/utils";
import {
    createProductsWorkflow,
    createCollectionsWorkflow,
    createProductCategoriesWorkflow,
} from "@medusajs/medusa/core-flows";

export default async function seedProCareCatalog({ container }: ExecArgs) {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const productModuleService = container.resolve(Modules.PRODUCT);
    const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);
    const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);

    logger.info("Starting ProCare Catalog Seeding (Final Update for Categories)...");

    // 1. Get necessary dependencies
    const [salesChannel] = await salesChannelModuleService.listSalesChannels({
        name: "Default Sales Channel",
    });

    const shippingProfiles = await fulfillmentModuleService.listShippingProfiles({
        type: "default",
    });
    const shippingProfile = shippingProfiles[0];

    // 2. Clear existing products
    logger.info("Clearing existing products...");
    const existingProducts = await productModuleService.listProducts({}, { select: ["id"] });
    if (existingProducts.length > 0) {
        await productModuleService.deleteProducts(existingProducts.map(p => p.id));
        logger.info(`Deleted ${existingProducts.length} products.`);
    }

    // 3. Ensure Categories Exist
    const categoryNames = ["Foot Care", "Insoles", "Shoe Care"];
    const categories: any = {};
    const { data: existingCats } = await query.graph({
        entity: "product_category",
        fields: ["id", "name", "handle"],
        filters: { name: categoryNames }
    });

    for (const name of categoryNames) {
        let cat = existingCats.find(c => c.name === name);
        if (!cat) {
            const { result } = await createProductCategoriesWorkflow(container).run({
                input: { product_categories: [{ name, is_active: true }] }
            });
            cat = result[0] as any;
        }
        categories[name] = cat;
    }

    // 4. Ensure Collections Exist
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

    // 5. Define products
    const relativeImageUrl = "/images/polish.jpeg";
    const images = [{ url: relativeImageUrl }, { url: relativeImageUrl }, { url: relativeImageUrl }, { url: relativeImageUrl }];

    const productData = [
        { title: "Pro Gold Color Shoe Cream", handle: "shoe-cream", category: "Shoe Care", collection: "Featured", description: "Premium color restoring shoe cream." },
        { title: "Pro Gold Care Leather Moisturizer", handle: "leather-moisturizer", category: "Shoe Care", collection: "New Arrivals", description: "Deeply moisturizes leather." },
        { title: "Pro Gold Color Shoe Cream Applicator", handle: "shoe-cream-applicator", category: "Shoe Care", collection: "Featured", description: "Easy application shoe cream." },
        { title: "Pro Gold Clean Power Cleaning Shampoo", handle: "cleaning-shampoo", category: "Shoe Care", collection: "New Arrivals", description: "Quick clean shampoo." },
        { title: "Pro Gold Shine Instant Shine", handle: "instant-shine", category: "Shoe Care", collection: "Featured", description: "Immediate glossy finish." },
        { title: "Pro Gold Shine Self Shine", handle: "self-shine", category: "Shoe Care", collection: "Featured", description: "Polished finish without buffing." },
        { title: "PRO GOLD Sneaker Cleaning Kit", handle: "sneaker-cleaning-kit", category: "Shoe Care", collection: "Featured", description: "Complete sneaker care pack." },

        // Foot Care Expanded
        { title: "PRO GOLD Shoe Deo", handle: "shoe-deo", category: "Foot Care", collection: "Featured", description: "Fights fungi & bacteria. Keeps shoes fresh." },
        { title: "PRO GOLD Sneaker Wipes – Pack of 30", handle: "sneaker-wipes", category: "Foot Care", collection: "New Arrivals", description: "On-the-go quick-clean solution." },
        { title: "PRO GOLD Foam Cleaner", handle: "foam-cleaner", category: "Foot Care", collection: "New Arrivals", description: "Deep cleaning foam for all materials." },
        { title: "PRO GOLD Hydroshield", handle: "hydroshield-spray", category: "Foot Care", collection: "Featured", description: "Ultimate shoe protection spray." },

        { title: "Pro Horse Hair Brush", handle: "horse-hair-brush", category: "Shoe Care", collection: "Featured", description: "Premium horse hair bristles." },
        { title: "Pro Application Brush", handle: "application-brush", category: "Shoe Care", collection: "New Arrivals", description: "Smooth application of creams." },
        { title: "Pro Gloss Brush", handle: "gloss-brush", category: "Shoe Care", collection: "Featured", description: "Dense bristles for glossy shine." },
        { title: "Pro Suede Brush", handle: "suede-brush", category: "Shoe Care", collection: "New Arrivals", description: "Designed for delicate suede." },
        { title: "Pro Suede 2in1", handle: "suede-2in1", category: "Shoe Care", collection: "New Arrivals", description: "Cleaning sponge and gum eraser." },

        { title: "PRO Premium Shoe Tree", handle: "shoe-tree", category: "Insoles", collection: "Featured", description: "Natural cedar wood shoe tree." },
        { title: "PRO Insoles Ease Memory Foam", handle: "memory-foam-insoles", category: "Insoles", collection: "New Arrivals", description: "Memory foam comfort." },
        { title: "PRO Comfort Air Walk Gel Insoles", handle: "air-walk-gel-insoles", category: "Insoles", collection: "Featured", description: "Gel cushioning for shock absorption." },
        { title: "PRO Comfort Gel Insoles", handle: "comfort-gel-insoles", category: "Insoles", collection: "Featured", description: "Moisture-wicking gel insoles." },
        { title: "PRO INSOLES EASE SOFT", handle: "ease-soft-insoles", category: "Insoles", collection: "New Arrivals", description: "3-layer comfort design." },
        { title: "PRO GOLD Suede and Nubuck", handle: "suede-nubuck-spray", category: "Shoe Care", collection: "New Arrivals", description: "Revives colors and conditions." }
    ];

    const productsToCreate = productData.map((p, index) => {
        const isShoeCream = p.handle === "shoe-cream";
        const colorValues = isShoeCream ? ["Neutral", "Black", "Brown"] : ["Neutral"];

        return {
            title: p.title,
            handle: p.handle,
            description: p.description,
            collection_id: collections[p.collection]?.id,
            category_ids: [categories[p.category]?.id].filter(Boolean),
            images,
            thumbnail: relativeImageUrl,
            status: ProductStatus.PUBLISHED,
            shipping_profile_id: shippingProfile.id,
            sales_channels: [{ id: salesChannel.id }],
            options: [{ title: "Color", values: colorValues }],
            variants: colorValues.map((color, vIndex) => {
                let inrPrice = Math.floor(Math.random() * 2000) + 500; // Default: 500 to 2500
                if (isShoeCream) {
                    inrPrice = Math.floor(Math.random() * 400) + 400; // Shoe Cream: 400 to 800
                }

                return {
                    title: color,
                    sku: `NEW-PRO-${index + 1}${isShoeCream ? '-' + (vIndex + 1) : ''}`,
                    options: { Color: color },
                    manage_inventory: false,
                    prices: [
                        { amount: 1500 * 100, currency_code: "inr" },
                        { amount: 20 * 100, currency_code: "usd" }
                    ]
                }
            })
        }
    });

    await createProductsWorkflow(container).run({
        input: {
            products: productsToCreate,
        },
    });

    logger.info(`Successfully seeded ${productsToCreate.length} ProCare products with refined categories.`);
}
