const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();

  // Query products with their categories
  const productsQuery = `
    SELECT p.id, p.title, p.handle, p.metadata, p.thumbnail,
           array_agg(pc.name) as categories
    FROM product p
    LEFT JOIN product_category_product pcp ON p.id = pcp.product_id
    LEFT JOIN product_category pc ON pcp.product_category_id = pc.id
    GROUP BY p.id
    ORDER BY p.title;
  `;

  // Query variants to check variant level images
  const variantsQuery = `
    SELECT product_id, id, title, sku, metadata
    FROM product_variant;
  `;

  const productsRes = await client.query(productsQuery);
  const variantsRes = await client.query(variantsQuery);

  await client.end();

  const products = productsRes.rows;
  const variants = variantsRes.rows;

  // Group variants by product
  const variantsByProduct = {};
  variants.forEach(v => {
    if (!variantsByProduct[v.product_id]) {
      variantsByProduct[v.product_id] = [];
    }
    variantsByProduct[v.product_id].push(v);
  });

  const report = [];

  for (const product of products) {
    const pVariants = variantsByProduct[product.id] || [];
    
    // Check if any variant has a custom WebP image (e.g. starting with /images/products/)
    let hasDriveImages = false;
    const resolvedImages = new Set();

    pVariants.forEach(v => {
      if (v.metadata) {
        ['image_1', 'image_2', 'image_3', 'image_4'].forEach(key => {
          const imgPath = v.metadata[key];
          if (imgPath && imgPath.startsWith('/images/products/')) {
            hasDriveImages = true;
            resolvedImages.add(imgPath.split('/').pop()); // just keep the filename
          }
        });
      }
    });

    // Also check product thumbnail
    if (product.thumbnail && product.thumbnail.startsWith('/images/products/')) {
      hasDriveImages = true;
      resolvedImages.add(product.thumbnail.split('/').pop());
    }

    // Extract badges (feature icons)
    let badges = [];
    if (product.metadata && product.metadata.product_badges) {
      let bList = product.metadata.product_badges;
      if (typeof bList === 'string') {
        try {
          bList = JSON.parse(bList);
        } catch (e) {}
      }
      if (Array.isArray(bList)) {
        badges = bList.map(b => `${b.label} (${b.iconId.split('/').pop()})`);
      }
    }

    report.push({
      title: product.title,
      handle: product.handle,
      url: `https://shop.mvshoecare.com/products/${product.handle}`,
      categories: product.categories.filter(Boolean).join(', '),
      status: hasDriveImages ? 'Drive Images' : 'Default Fallback',
      images: Array.from(resolvedImages),
      badges: badges
    });
  }

  console.log(JSON.stringify(report, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
