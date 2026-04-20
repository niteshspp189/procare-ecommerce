import { ExecArgs } from "@medusajs/framework/types";
import {
    ContainerRegistrationKeys,
    Modules,
    ProductStatus,
} from "@medusajs/framework/utils";
import {
    createProductsWorkflow,
} from "@medusajs/medusa/core-flows";

export default async function seedMoreProducts({ container }: ExecArgs) {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);
    const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);

    logger.info("Seeding more dummy products...");

    const { data: categories } = await query.graph({
        entity: "product_category",
        fields: ["id", "name"],
    });

    const [salesChannel] = await salesChannelModuleService.listSalesChannels({
        name: "Default Sales Channel",
    });

    const shippingProfiles = await fulfillmentModuleService.listShippingProfiles({
        type: "default",
    });
    const shippingProfile = shippingProfiles[0];

    const productsToCreate: any[] = [];

    const types = ["Pro", "Elite", "Classic", "Premium", "Limited Edition"];
    const categoriesList = ["Shoe Care", "Foot Care", "Insoles"];

    for (let i = 1; i <= 16; i++) {
        const type = types[i % types.length];
        const categoryName = categoriesList[i % categoriesList.length];
        const category = categories.find(c => c.name === categoryName);

        productsToCreate.push({
            title: `${type} Product ${i}`,
            category_ids: category ? [category.id] : [],
            description: `A high-quality ${type.toLowerCase()} leather care product. Experience the best of ProCare professional shoe maintenance.`,
            handle: `product-${i}`,
            weight: 500,
            status: ProductStatus.PUBLISHED,
            shipping_profile_id: shippingProfile.id,
            images: [
                { url: `http://shop.mvshoecare.com/products/Routine2.png` }
            ],
            options: [
                { title: "Color", values: ["Default"] }
            ],
            variants: [
                {
                    title: "Default",
                    sku: `SKU-${i}`,
                    options: { Color: "Default" },
                    prices: [
                        { amount: 20 + i, currency_code: "usd" },
                        { amount: 18 + i, currency_code: "eur" }
                    ]
                }
            ],
            sales_channels: [{ id: salesChannel.id }]
        });
    }

    await createProductsWorkflow(container).run({
        input: {
            products: productsToCreate,
        },
    });

    logger.info(`Successfully seeded ${productsToCreate.length} more products.`);
}
