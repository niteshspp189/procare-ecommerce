import { sdk } from "./storefront/src/lib/config"

async function run() {
  const { collections } = await sdk.client.fetch("/store/collections", { query: { handle: "new-arrivals" }})
  const col = collections[0]
  console.log("Collection:", col.id, col.handle)

  const { products } = await sdk.client.fetch("/store/products", { query: { collection_id: [col.id] }})
  console.log("Products:", products.length)
}
run()
