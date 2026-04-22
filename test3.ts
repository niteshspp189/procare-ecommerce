const { getCollectionByHandle } = require("./storefront/src/lib/data/collections");
const { listProducts } = require("./storefront/src/lib/data/products");

async function check() {
  const collection = await getCollectionByHandle("new-arrivals");
  console.log("Collection ID:", collection.id);
  const res = await listProducts({ queryParams: { collection_id: [collection.id], limit: 100 } });
  console.log("Product count via listProducts:", res.response.products.length);
}
check().catch(console.error);
