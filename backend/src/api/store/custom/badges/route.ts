import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const BADGE_REGISTRY = [
  // PRO Line
  { id: "pro-clean", label: "PRO CLEAN", imgFile: "pro-clean.png", category: "Brand" },
  { id: "pro-fresh", label: "PRO FRESH", imgFile: "pro-fresh.png", category: "Brand" },
  { id: "pro-care", label: "PRO CARE", imgFile: "pro-care.png", category: "Brand" },
  { id: "pro-shine", label: "PRO SHINE", imgFile: "pro-shine.png", category: "Brand" },
  { id: "pro-active", label: "PRO Active", imgFile: "pro-active.png", category: "Brand" },
  { id: "pro-accessories", label: "PRO Accessories", imgFile: "pro-accessories.png", category: "Brand" },
  { id: "pro-color-green", label: "PRO Color", imgFile: "pro-color-green.png", category: "Brand" },
  
  // Benefits
  { id: "ease", label: "Ease", imgFile: "ease.png", category: "Benefit" },
  { id: "essentials", label: "Essentials", imgFile: "essentials.png", category: "Benefit" },
  { id: "comfort", label: "Comfort", imgFile: "comfort.png", category: "Benefit" },
  { id: "cushioning", label: "Cushioning", imgFile: "cushioning.png", category: "Benefit" },
  { id: "stability", label: "Stability", imgFile: "stability.png", category: "Benefit" },
  { id: "skin-friendly", label: "Skin Friendly", imgFile: "skin-friendly.png", category: "Benefit" },
  { id: "eco-friendly", label: "Eco Friendly", imgFile: "eco-friendly.png", category: "Benefit" },
  { id: "light-weight", label: "Lightweight", imgFile: "light-weight.png", category: "Benefit" },
  { id: "made-in-europe", label: "Made in Europe", imgFile: "made-in-europe.png", category: "Origin" },
  { id: "europian-experts", label: "European Expertise", imgFile: "europian-experts.png", category: "Origin" },
  { id: "fragnance", label: "Fragrance", imgFile: "fragnance.png", category: "Benefit" },
  { id: "shine", label: "Shine", imgFile: "shine.png", category: "Benefit" },
  { id: "create-natural-shine", label: "Create Natural Shine", imgFile: "create-natural-shine.png", category: "Benefit" },
  { id: "cleaning", label: "Cleaning", imgFile: "cleaning.png", category: "Benefit" },
  { id: "effective-cleaning-agent", label: "Effective Cleaning Agent", imgFile: "effective-cleaning-agent.png", category: "Benefit" },
  { id: "color-refreshing", label: "Color Refreshing", imgFile: "color-refreshing.png", category: "Benefit" },
  { id: "long-lasting-freshness", label: "Long Lasting Freshness", imgFile: "long-lasting-freshness.png", category: "Benefit" },
  { id: "helps-fight-fungi-and-bacteria", label: "Helps Fight Fungi & Bacteria", imgFile: "helps-fight-fungi-and-bacteria.png", category: "Benefit" },
  { id: "absorb-mositure", label: "Absorb Moisture", imgFile: "absorb-mositure.png", category: "Benefit" },
  { id: "odour-control", label: "Odour Control", imgFile: "odour-control.png", category: "Benefit" },
  { id: "hand-washable", label: "Hand Washable", imgFile: "hand-washable.png", category: "Care" },
  { id: "help-remove-trapped-dust", label: "Help Remove Trapped Dust", imgFile: "help-remove-trapped-dust.png", category: "Benefit" },
  { id: "help-to-slidethe-feet-into-shoes", label: "Help Slide Feet Into Shoes", imgFile: "help-to-slidethe-feet-into-shoes.png", category: "Benefit" },
  
  // Features / Materials
  { id: "complete-kit", label: "Complete Kit", imgFile: "complete-kit.png", category: "Feature" },
  { id: "with-cleaning-brush", label: "With Cleaning Brush", imgFile: "with-cleaning-brush.png", category: "Feature" },
  { id: "brush-and-pumice-combo", label: "Brush & Pumice Combo", imgFile: "brush-and-pumice-combo.png", category: "Feature" },
  { id: "gel-comfort", label: "Gel Comfort", imgFile: "gel-comfort.png", category: "Feature" },
  { id: "high-density-sponge", label: "High Density Sponge", imgFile: "high-density-sponge.png", category: "Material" },
  { id: "high-quality-wood", label: "High Quality Wood", imgFile: "high-quality-wood.png", category: "Material" },
  { id: "high-quality-bristles", label: "High Quality Bristles", imgFile: "high-quality-bristles.png", category: "Material" },
  { id: "genuine-hair-horse-brush", label: "Genuine Horse Hair Bristles", imgFile: "genuine-hair-horse-brush.png", category: "Material" },
  { id: "high-grade-steel", label: "High Grade Steel", imgFile: "high-grade-steel.png", category: "Material" },
  { id: "leather-grip-handle", label: "Leather Grip Handle", imgFile: "leather-grip-handle.png", category: "Material" },
  { id: "anti-slip-handle", label: "Anti Slip Handle", imgFile: "anti-slip-handle.png", category: "Material" },
  { id: "replacable-rollers", label: "Replaceable Rollers", imgFile: "replacable-rollers.png", category: "Feature" },
  { id: "for-coarse-and-fine-filing", label: "For Coarse & Fine Filing", imgFile: "for-coarse-and-fine-filing.png", category: "Feature" },
  { id: "remove-callus-and-dead-skin", label: "Remove Callus & Dead Skin", imgFile: "remove-callus-and-dead-skin.png", category: "Feature" },
  { id: "maintains-the-originals-shape", label: "Maintains Original Shape", imgFile: "maintains-the-originals-shape.png", category: "Feature" },
  { id: "contain-high-quality", label: "Contain High Quality", imgFile: "contain-high-quality.png", category: "Material" },
  { id: "protect", label: "Protect", imgFile: "protect.png", category: "Feature" },
  { id: "water-protection", label: "Water Protection", imgFile: "water-protection.png", category: "Feature" },
  { id: "water-protect", label: "Water Protect", imgFile: "water-protect.png", category: "Feature" },
  { id: "multi-purpose-design", label: "Multi-Purpose Design", imgFile: "multi-purpose-design.png", category: "Feature" },
  { id: "chromium-plated-finish", label: "Chromium Plated Finish", imgFile: "chromium-plated-finish.png", category: "Material" },
  { id: "pack-of-2-roller", label: "Pack of 2 Rollers", imgFile: "pack-of-2-roller.png", category: "Feature" },
  { id: "multi-step-nail-buffer", label: "Multi Step Nail Buffer", imgFile: "multi-step-nail-buffer.png", category: "Feature" },
  { id: "premium-stainless-steel", label: "Premium Stainless Steel", imgFile: "premium-stainless-steel.png", category: "Material" },
  { id: "natural-lotus-wood", label: "Natural Lotus Wood", imgFile: "natural-lotus-wood.png", category: "Material" },
  { id: "prevents-creasing", label: "Prevents Creasing", imgFile: "prevents-creasing.png", category: "Feature" },
  { id: "natural-cedar-wood", label: "Natural Cedar Wood", imgFile: "natural-cedar-wood.png", category: "Material" },
  { id: "beech-wood-handle", label: "Beech Wood Handle", imgFile: "beech-wood-handle.png", category: "Material" },
  
  // Logistics
  { id: "free-shipping", label: "Free Shipping", imgFile: "free-shipping.png", category: "Logistics" },
  { id: "15-day-return", label: "15 Day Return", imgFile: "15-day-return.png", category: "Logistics" },
  { id: "travel-freindly", label: "Travel Friendly", imgFile: "travel-freindly.png", category: "Logistics" },
]

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")

  return res.json({ badges: BADGE_REGISTRY })
}
