import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const pgConnection = req.scope.resolve("__pg_connection__");
  try {
    const dbRes = await pgConnection.raw(`
      SELECT 
        (SELECT value FROM price_rule WHERE attribute = 'item_total' AND operator = 'gte' LIMIT 1) as threshold,
        (SELECT amount FROM price WHERE price_set_id = 'pset_01KPE40HVXY7B7NDCT5X1JRR7C' AND amount > 0 LIMIT 1) as shipping_fee
    `);
    const row = dbRes?.rows?.[0];
    const threshold = row?.threshold ? parseInt(row.threshold, 10) : 499;
    const shipping_fee = row?.shipping_fee ? parseFloat(row.shipping_fee) : 1;
    
    // Set CORS headers for storefront queries
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    
    res.json({ threshold, shipping_fee });
  } catch (error: any) {
    res.json({ threshold: 499, shipping_fee: 1 });
  }
}
