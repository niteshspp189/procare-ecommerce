import { ExecArgs } from "@medusajs/framework/types";
import {
    ContainerRegistrationKeys,
    Modules,
} from "@medusajs/framework/utils";
import {
    createInventoryLevelsWorkflow,
} from "@medusajs/medusa/core-flows";

export default async function seedInventory({ container }: ExecArgs) {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const stockLocationModuleService = container.resolve(Modules.STOCK_LOCATION);

    logger.info("Seeding inventory for new variants...");

    const { data: variants } = await query.graph({
        entity: "product_variant",
        fields: ["id", "sku", "inventory_items.inventory_item_id"],
    });

    const [location] = await stockLocationModuleService.listStockLocations({});

    if (!location) {
        logger.error("No stock location found.");
        return;
    }

    // Find variants without inventory levels at this location
    const inventoryLevelsToCreate: any[] = [];

    for (const variant of variants) {
        const inventoryItemId = variant.inventory_items?.[0]?.inventory_item_id;
        if (!inventoryItemId) continue;

        const { data: levels } = await query.graph({
            entity: "inventory_level",
            fields: ["id"],
            filters: {
                inventory_item_id: inventoryItemId,
                location_id: location.id,
            },
        });

        if (levels.length === 0) {
            inventoryLevelsToCreate.push({
                location_id: location.id,
                inventory_item_id: inventoryItemId,
                stocked_quantity: 100,
            });
        }
    }

    if (inventoryLevelsToCreate.length === 0) {
        logger.info("All variants already have inventory levels.");
        return;
    }

    await createInventoryLevelsWorkflow(container).run({
        input: {
            inventory_levels: inventoryLevelsToCreate,
        },
    });

    logger.info(`Successfully seeded inventory for ${inventoryLevelsToCreate.length} new variants.`);
}
