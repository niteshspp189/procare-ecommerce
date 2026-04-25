import { ExecArgs } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils";

export default async function updateProductCategories({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const productModuleService = container.resolve(Modules.PRODUCT);

  logger.info("Starting product category re-assignment...");

  // 1. Get all categories (top-level only to avoid sub-categories)
  const categories = await productModuleService.listProductCategories();
  const catMap: Record<string, string> = {};
  logger.info(`Raw categories count: ${categories.length}`);
  for (const c of categories) {
    logger.info(`  - id=${c.id}, name=${c.name}, handle=${c.handle}`);
    if (c.handle) {
      catMap[c.handle.toLowerCase()] = c.id;
    }
  }

  const mainCategories = ["shoe-care", "insoles", "foot-care", "accessories"];
  for (const handle of mainCategories) {
    if (!catMap[handle]) {
      logger.error(`Missing category with handle: ${handle}`);
    } else {
      logger.info(`Category ${handle}: ${catMap[handle]}`);
    }
  }

  // 2. Get all products
  const products = await productModuleService.listProducts();
  logger.info(`Found ${products.length} products`);

  // 3. Define mapping: product title keyword -> category handle
  const categoryMappings: { keywords: string[]; category: string }[] = [
    // Insoles (check first)
    {
      keywords: ["insoles ease memory foam", "comfort air walk gel", "comfort gel insoles", "insoles ease soft"],
      category: "insoles",
    },
    // Accessories (brushes, shoe tree)
    {
      keywords: ["horse hair brush", "application brush", "gloss brush", "suede brush", "suede 2in1", "shoe tree"],
      category: "accessories",
    },
    // Foot Care (protectors, deodorizer, foam cleaner)
    {
      keywords: ["hydroshield", "suede and nubuck renovator", "shoe deo", "foam cleaner"],
      category: "foot-care",
    },
    // Shoe Care (creams, polishes, cleaners, shine, wipes, kits)
    {
      keywords: ["shoe cream", "leather moisturizer", "instant shine", "self shine", "cleaning shampoo", "sneaker cleaning kit", "sneaker wipes"],
      category: "shoe-care",
    },
  ];

  const getCategoryForProduct = (title: string): string | null => {
    const t = title.toLowerCase();
    for (const mapping of categoryMappings) {
      for (const keyword of mapping.keywords) {
        if (t.includes(keyword.toLowerCase())) {
          return catMap[mapping.category];
        }
      }
    }
    return null;
  };

  // 4. Update products - assign to exactly ONE main category
  let updated = 0;
  let skipped = 0;

  for (const product of products) {
    const categoryId = getCategoryForProduct(product.title);
    if (categoryId) {
      await productModuleService.updateProducts([
        {
          id: product.id,
          category_ids: [categoryId],
        },
      ]);
      const catName = Object.keys(catMap).find((k) => catMap[k] === categoryId);
      logger.info(`Assigned [${product.title}] -> ${catName}`);
      updated++;
    } else {
      logger.warn(`No category match for: ${product.title}`);
      skipped++;
    }
  }

  logger.info(`Done! Updated: ${updated}, Skipped: ${skipped}`);
}
