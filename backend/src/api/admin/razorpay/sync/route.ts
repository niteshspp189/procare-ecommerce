import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { completeCartWorkflow } from "@medusajs/core-flows"

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { cart_id } = req.body as { cart_id: string };
    
    if (!cart_id) {
      return res.status(400).json({ message: "cart_id is required" });
    }

    // Call completeCartWorkflow
    const { result } = await completeCartWorkflow(req.scope).run({
      input: { id: cart_id }
    });

    res.json({ message: "Order synchronized successfully", order: result });
  } catch (err: any) {
    console.error("Sync error:", err);
    res.status(500).json({ message: err.message });
  }
}
