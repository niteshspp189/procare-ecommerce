import { ExecArgs } from "@medusajs/framework/types";
import {
    ContainerRegistrationKeys,
} from "@medusajs/framework/utils";
import {
    createCollectionsWorkflow,
    updateProductsWorkflow,
} from "@medusajs/medusa/core-flows";

export default async function seedCollections({ container }: ExecArgs) {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    logger.info("Seeding product collections...");

    let { data: existingCollections } = await query.graph({
        entity: "product_collection",
        fields: ["id", "handle"],
        filters: {
            handle: ["featured", "new-arrivals"]
        }
    });

    let collections = existingCollections;

    if (collections.length === 0) {
        const { result } = await createCollectionsWorkflow(container).run({
            input: {
                collections: [
                    {
                        title: "New Arrivals",
                        handle: "new-arrivals",
                    },
                    {
                        title: "Featured",
                        handle: "featured",
                    }
                ],
            },
        });
        collections = result;
    }

    const featuredCollection = collections.find(c => c.handle === "featured");

    if (featuredCollection) {
        const { data: products } = await query.graph({
            entity: "product",
            fields: ["id"],
            filters: {
                status: "published"
            }
        });

        logger.info(`Updating ${products.length} products with collection ${featuredCollection.id}...`);

        await updateProductsWorkflow(container).run({
            input: {
                selector: {
                    id: products.map(p => p.id),
                },
                update: {
                    collection_id: featuredCollection.id,
                },
            },
        });
    }

    logger.info("Finished seeding collections.");
}
