import { createProductsWorkflow } from "@medusajs/medusa/core-flows"
import { ExecArgs } from "@medusajs/framework/types"

export default async function createDummyProduct({ container }: ExecArgs) {
  const { result } = await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: "Dummy Test Product",
          description: "A temporary 1 INR product for testing live checkout flows.",
          is_giftcard: false,
          status: "published",
          options: [{ title: "Default", values: ["Default"] }],
          variants: [
            {
              title: "Default Variant",
              sku: "DUMMY-TEST-1",
              options: { Default: "Default" },
              prices: [
                {
                  amount: 1,
                  currency_code: "inr"
                }
              ]
            }
          ]
        }
      ]
    }
  })
  console.log("Created dummy product:", result[0].id)
}
