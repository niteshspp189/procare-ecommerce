/**
 * seed-badges.ts
 * Updates product.metadata.product_badges for all products based on
 * client-provided data from procare_all_variants - procare_all_variants.csv (July 14)
 *
 * Run: cd backend && npx medusa exec src/scripts/seed-badges.ts
 */

import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

// ---------------------------------------------------------------------------
// ICON OPTIONS (must match product-intelligence.tsx ICON_OPTIONS)
// ---------------------------------------------------------------------------
// id          → icon shown on frontend
// "shipping"  Free Shipping
// "return"    30 Day Return
// "eco"       Eco Friendly
// "natural"   Natural
// "refillable"Refillable
// "organic"   Organic
// "kit"       Complete Kit
// "star"      Top Rated
// "award"     Award Winning
// "lock"      Secure
// "truck"     Fast Delivery
// "gift"      Gift Ready
// "leaf"      Sustainable
// "thumb"     Guaranteed

// ---------------------------------------------------------------------------
// BADGE DATA: product handle → [{ iconId, label }, ...]
// Derived from client CSV "Badges" column.
// Each product has exactly 4 badges.
// ---------------------------------------------------------------------------

const PRODUCT_BADGES: Record<string, Array<{ iconId: string; label: string }>> = {
  // Loving My Bag Kit → PRO Clean, PRO Fresh, PRO Care, European Expertise
  "loving-my-bag-kit": [
    { iconId: "eco",      label: "PRO Clean" },
    { iconId: "leaf",     label: "PRO Fresh" },
    { iconId: "thumb",    label: "PRO Care" },
    { iconId: "award",    label: "Euro Expertise" },
  ],

  // PRO GOLD Sneaker Wipes Pack of 30 Kit → PRO CLEAN, Travel friendly, Effective Clean, European expertise
  "pro-cold-sneaker-wipes-pack-of-30-kit": [
    { iconId: "eco",      label: "PRO CLEAN" },
    { iconId: "truck",    label: "Travel Friendly" },
    { iconId: "thumb",    label: "Effective Clean" },
    { iconId: "award",    label: "Euro Expertise" },
  ],

  // PRO Insoles Ease Pacific Blue → PRO Ease, Comfort, Skin friendly, Made in Europe
  "pro-insoles-ease-pacific-blue": [
    { iconId: "star",     label: "PRO Ease" },
    { iconId: "thumb",    label: "Comfort" },
    { iconId: "natural",  label: "Skin Friendly" },
    { iconId: "award",    label: "Made in Europe" },
  ],

  // PRO Insoles Ease Soft → PRO Ease, Comfort, Skin friendly, Made in Europe
  "pro-insoles-ease-soft": [
    { iconId: "star",     label: "PRO Ease" },
    { iconId: "thumb",    label: "Comfort" },
    { iconId: "natural",  label: "Skin Friendly" },
    { iconId: "award",    label: "Made in Europe" },
  ],

  // PRO Insoles Gel Comfort Heel Lovers → Gel Comfort, Cushioning, Skin friendly, Hand Washable
  "pro-insoles-gel-comfort-heel-lovers": [
    { iconId: "star",     label: "Gel Comfort" },
    { iconId: "thumb",    label: "Cushioning" },
    { iconId: "natural",  label: "Skin Friendly" },
    { iconId: "eco",      label: "Hand Washable" },
  ],

  // PRO Magic Pedi Roller Pack Black → Essentials, Callus & dead skin remover, Replaceable roller, Pack of 2 roller
  "pro-magic-pedi-roller-pack-black": [
    { iconId: "kit",      label: "Essentials" },
    { iconId: "leaf",     label: "Callus Remover" },
    { iconId: "refillable", label: "Replaceable Roller" },
    { iconId: "gift",     label: "Pack of 2 Roller" },
  ],

  // Premium Shoe Care Kit → PRO Clean, PRO Fresh, PRO Care, European Expertise
  "premium-shoe-care-kit": [
    { iconId: "eco",      label: "PRO Clean" },
    { iconId: "leaf",     label: "PRO Fresh" },
    { iconId: "thumb",    label: "PRO Care" },
    { iconId: "award",    label: "Euro Expertise" },
  ],

  // Pro Application Brush → PRO Accessories, High quality bristles, Beech wood handle, Made in Europe
  "pro-application-brush": [
    { iconId: "kit",      label: "PRO Accessories" },
    { iconId: "star",     label: "Quality Bristles" },
    { iconId: "natural",  label: "Beech Wood Handle" },
    { iconId: "award",    label: "Made in Europe" },
  ],

  // Pro Brush & Pumice Combo Turqouise → Essentials, Brush and pumice combo, Removes callus and dead skin, Made in Europe
  "pro-brush-pumice-combo-turqouise": [
    { iconId: "kit",      label: "Essentials" },
    { iconId: "thumb",    label: "Brush & Pumice" },
    { iconId: "leaf",     label: "Callus Remover" },
    { iconId: "award",    label: "Made in Europe" },
  ],

  // Pro Comfort Air Walk Gel Insoles → Gel Comfort, Cushioning, Skin friendly, Hand Washable
  "pro-comfort-air-walk-gel-insoles": [
    { iconId: "star",     label: "Gel Comfort" },
    { iconId: "thumb",    label: "Cushioning" },
    { iconId: "natural",  label: "Skin Friendly" },
    { iconId: "eco",      label: "Hand Washable" },
  ],

  // Pro Comfort Gel Foot Bed Insoles → Gel Comfort, Cushioning, Skin friendly, Hand Washable
  "pro-comfort-gel-foot-bed-insoles": [
    { iconId: "star",     label: "Gel Comfort" },
    { iconId: "thumb",    label: "Cushioning" },
    { iconId: "natural",  label: "Skin Friendly" },
    { iconId: "eco",      label: "Hand Washable" },
  ],

  // Pro Double sided Foot File Purple → Essentials, High grade steel, Removes callus and dead skin, Made in Europe
  "pro-double-sided-foot-file-purple": [
    { iconId: "kit",      label: "Essentials" },
    { iconId: "lock",     label: "High Grade Steel" },
    { iconId: "leaf",     label: "Callus Remover" },
    { iconId: "award",    label: "Made in Europe" },
  ],

  // Pro Dual Action Foot File Turqouise → Essentials, For coarse & fine filing, Removes callus and dead skin, Made in Europe
  "pro-dual-action-foot-file-turqouise": [
    { iconId: "kit",      label: "Essentials" },
    { iconId: "star",     label: "Dual Filing" },
    { iconId: "leaf",     label: "Callus Remover" },
    { iconId: "award",    label: "Made in Europe" },
  ],

  // Pro Easy Care Combo Pack Neutral → PRO CLEAN, High density sponge, Effective Cleaning agent, European expertise
  "pro-easy-care-combo-pack-neutral": [
    { iconId: "eco",      label: "PRO CLEAN" },
    { iconId: "thumb",    label: "Density Sponge" },
    { iconId: "leaf",     label: "Effective Clean" },
    { iconId: "award",    label: "Euro Expertise" },
  ],

  // Pro Gloss Brush → PRO Accessories, High quality bristles, High quality wood, Made in Europe
  "pro-gloss-brush": [
    { iconId: "kit",      label: "PRO Accessories" },
    { iconId: "star",     label: "Quality Bristles" },
    { iconId: "natural",  label: "Quality Wood" },
    { iconId: "award",    label: "Made in Europe" },
  ],

  // Pro Gold Instant Shine → PRO SHINE, Color Refreshing, Shine, European expertise
  "pro-gold-instant-shine": [
    { iconId: "star",     label: "PRO SHINE" },
    { iconId: "organic",  label: "Color Refresh" },
    { iconId: "leaf",     label: "Shine" },
    { iconId: "award",    label: "Euro Expertise" },
  ],

  // Pro Gold Leather Moisturizer → PRO CARE, Cleaning, Shine, European expertise
  "pro-gold-leather-moisturizer": [
    { iconId: "thumb",    label: "PRO CARE" },
    { iconId: "eco",      label: "Cleaning" },
    { iconId: "leaf",     label: "Shine" },
    { iconId: "award",    label: "Euro Expertise" },
  ],

  // Pro Gold Power Cleaning Shampoo → PRO CLEAN, Cleaning, Effective Clean, European expertise
  "pro-gold-power-cleaning-shampoo": [
    { iconId: "eco",      label: "PRO CLEAN" },
    { iconId: "thumb",    label: "Cleaning" },
    { iconId: "leaf",     label: "Effective Clean" },
    { iconId: "award",    label: "Euro Expertise" },
  ],

  // Pro Gold Self Shine → PRO SHINE, Color Refreshing, Shine, European expertise
  "pro-gold-self-shine": [
    { iconId: "star",     label: "PRO SHINE" },
    { iconId: "organic",  label: "Color Refresh" },
    { iconId: "leaf",     label: "Shine" },
    { iconId: "award",    label: "Euro Expertise" },
  ],

  // Pro Gold Shoe Cream → PRO COLOR, Color Refreshing, High Quality Carnauba Wax, European expertise
  "pro-gold-shoe-cream": [
    { iconId: "organic",  label: "PRO COLOR" },
    { iconId: "star",     label: "Color Refresh" },
    { iconId: "natural",  label: "Carnauba Wax" },
    { iconId: "award",    label: "Euro Expertise" },
  ],

  // Pro Gold Shoe Cream with Applicator → PRO COLOR, Color Refreshing, High Quality Carnauba Wax, European expertise
  "pro-gold-shoe-cream-with-applicator": [
    { iconId: "organic",  label: "PRO COLOR" },
    { iconId: "star",     label: "Color Refresh" },
    { iconId: "natural",  label: "Carnauba Wax" },
    { iconId: "award",    label: "Euro Expertise" },
  ],

  // Pro Gold Shoe Deo → PRO FRESH, Fight Fungi, Long lasting Freshness, European expertise
  "pro-gold-shoe-deo": [
    { iconId: "leaf",     label: "PRO FRESH" },
    { iconId: "eco",      label: "Fight Fungi" },
    { iconId: "thumb",    label: "Long Freshness" },
    { iconId: "award",    label: "Euro Expertise" },
  ],

  // Pro Gold Sneaker Cleaning Kit → PRO CLEAN, With cleaning brush, Effective Clean, European expertise
  "pro-gold-sneaker-cleaning-kit": [
    { iconId: "eco",      label: "PRO CLEAN" },
    { iconId: "kit",      label: "With Brush" },
    { iconId: "thumb",    label: "Effective Clean" },
    { iconId: "award",    label: "Euro Expertise" },
  ],

  // Pro Gold Sneaker Wipes – Pack of 30 → PRO CLEAN, Travel friendly, Effective Clean, European expertise
  "pro-gold-sneaker-wipes-pack-of-30": [
    { iconId: "eco",      label: "PRO CLEAN" },
    { iconId: "truck",    label: "Travel Friendly" },
    { iconId: "thumb",    label: "Effective Clean" },
    { iconId: "award",    label: "Euro Expertise" },
  ],

  // Pro Gold Sports & Sneaker Cleaning Kit → PRO CLEAN, PRO Fresh, Effective Clean, European expertise
  "pro-gold-sports-sneaker-cleaning-kit": [
    { iconId: "eco",      label: "PRO CLEAN" },
    { iconId: "leaf",     label: "PRO Fresh" },
    { iconId: "thumb",    label: "Effective Clean" },
    { iconId: "award",    label: "Euro Expertise" },
  ],

  // Pro Gold Suede n Nubuck Foam Cleaner → PRO CLEAN, Cleaning, Effective Clean, European expertise
  "pro-gold-suede-n-nubuck-foam-cleaner": [
    { iconId: "eco",      label: "PRO CLEAN" },
    { iconId: "thumb",    label: "Cleaning" },
    { iconId: "leaf",     label: "Effective Clean" },
    { iconId: "award",    label: "Euro Expertise" },
  ],

  // Pro Horse Hair Brush → PRO Accessories, Geniune horse hair bristles, High quality wood, Made in Europe
  "pro-horse-hair-brush": [
    { iconId: "kit",      label: "PRO Accessories" },
    { iconId: "star",     label: "Horse Hair" },
    { iconId: "natural",  label: "Quality Wood" },
    { iconId: "award",    label: "Made in Europe" },
  ],

  // Pro Hydroshield → PRO CARE, Cleaning, Shine, European expertise
  "pro-hydroshield": [
    { iconId: "thumb",    label: "PRO CARE" },
    { iconId: "eco",      label: "Cleaning" },
    { iconId: "leaf",     label: "Shine" },
    { iconId: "award",    label: "Euro Expertise" },
  ],

  // Pro Insole Heel Liner → Gel Comfort, Cushioning, Skin friendly, Hand Washable
  "pro-insole-heel-liner": [
    { iconId: "star",     label: "Gel Comfort" },
    { iconId: "thumb",    label: "Cushioning" },
    { iconId: "natural",  label: "Skin Friendly" },
    { iconId: "eco",      label: "Hand Washable" },
  ],

  // Pro Insoles Active Cricket → Gel Comfort, Cushioning, Skin friendly, Hand Washable
  "pro-insoles-active-cricket": [
    { iconId: "star",     label: "Gel Comfort" },
    { iconId: "thumb",    label: "Cushioning" },
    { iconId: "natural",  label: "Skin Friendly" },
    { iconId: "eco",      label: "Hand Washable" },
  ],

  // Pro Insoles Active Cycling → PRO Active, Comfort, Stablity, Made in Europe
  "pro-insoles-active-cycling": [
    { iconId: "star",     label: "PRO Active" },
    { iconId: "thumb",    label: "Comfort" },
    { iconId: "lock",     label: "Stability" },
    { iconId: "award",    label: "Made in Europe" },
  ],

  // Pro Insoles Active Running → PRO Active, Comfort, Stablity, Made in Europe
  "pro-insoles-active-running": [
    { iconId: "star",     label: "PRO Active" },
    { iconId: "thumb",    label: "Comfort" },
    { iconId: "lock",     label: "Stability" },
    { iconId: "award",    label: "Made in Europe" },
  ],

  // Pro Insoles Ease Aloe Vera → PRO Ease, Comfort, Fragnance, Made in Europe
  "pro-insoles-ease-aloe-vera": [
    { iconId: "star",     label: "PRO Ease" },
    { iconId: "thumb",    label: "Comfort" },
    { iconId: "leaf",     label: "Fragrance" },
    { iconId: "award",    label: "Made in Europe" },
  ],

  // Pro Insoles Memory Foam → PRO Ease, Comfort, Cushioning, Made in Europe
  "pro-insoles-memory-foam": [
    { iconId: "star",     label: "PRO Ease" },
    { iconId: "thumb",    label: "Comfort" },
    { iconId: "natural",  label: "Cushioning" },
    { iconId: "award",    label: "Made in Europe" },
  ],

  // Pro Nail Buffer Turqouise → Essentials, Multi Step nail buffer, Create Natural shine, Made in Europe
  "pro-nail-buffer-turqouise": [
    { iconId: "kit",      label: "Essentials" },
    { iconId: "star",     label: "Multi Step Buffer" },
    { iconId: "leaf",     label: "Natural Shine" },
    { iconId: "award",    label: "Made in Europe" },
  ],

  // Pro Nail Clipper Turqouise → Essentials, Chromium-plated finish, Anti-slip handle, Made in Europe
  "pro-nail-clipper-turqouise": [
    { iconId: "kit",      label: "Essentials" },
    { iconId: "lock",     label: "Chrome Finish" },
    { iconId: "thumb",    label: "Anti-Slip Handle" },
    { iconId: "award",    label: "Made in Europe" },
  ],

  // Pro Nail File Turqouise → Essentials, High-quality steel, Ergonomic anti-slip handle, Made in Europe
  "pro-nail-file-turqouise": [
    { iconId: "kit",      label: "Essentials" },
    { iconId: "lock",     label: "Quality Steel" },
    { iconId: "thumb",    label: "Ergonomic Handle" },
    { iconId: "award",    label: "Made in Europe" },
  ],

  // Pro Navy White → Shine, Colour, Cleaning, European expertise
  "pro-navy-white": [
    { iconId: "leaf",     label: "Shine" },
    { iconId: "organic",  label: "Color Restore" },
    { iconId: "eco",      label: "Cleaning" },
    { iconId: "award",    label: "Euro Expertise" },
  ],

  // Pro Perfect Clean Gel → PRO CLEAN, Cleaning, Effective Clean, European expertise
  "pro-perfect-clean-gel": [
    { iconId: "eco",      label: "PRO CLEAN" },
    { iconId: "thumb",    label: "Cleaning" },
    { iconId: "leaf",     label: "Effective Clean" },
    { iconId: "award",    label: "Euro Expertise" },
  ],

  // Pro Premium Shoe Tree → PRO Accessories, Natural Cedar wood, Absorbe moisture, Odour Control
  "pro-premium-shoe-tree": [
    { iconId: "kit",      label: "PRO Accessories" },
    { iconId: "natural",  label: "Cedar Wood" },
    { iconId: "leaf",     label: "Absorbs Moisture" },
    { iconId: "eco",      label: "Odour Control" },
  ],

  // Pro Premium Sneaker Care Kit → PRO CLEAN, PRO Fresh, Effective Clean, European expertise
  "pro-premium-sneaker-care-kit": [
    { iconId: "eco",      label: "PRO CLEAN" },
    { iconId: "leaf",     label: "PRO Fresh" },
    { iconId: "thumb",    label: "Effective Clean" },
    { iconId: "award",    label: "Euro Expertise" },
  ],

  // Pro Shoe Horn Metal 52 Cm → Premium stainless steel, Leather grip handle, help to slide feet into shoes, Maintains the original shape
  "pro-shoe-horn-metal-52-cm": [
    { iconId: "lock",     label: "Stainless Steel" },
    { iconId: "thumb",    label: "Leather Grip" },
    { iconId: "star",     label: "Easy Shoe Entry" },
    { iconId: "natural",  label: "Shape Keeper" },
  ],

  // Pro Shoe Tree With Spiral → PRO Accessories, Natural lotus wood, Absorbe moisture, Prevents creasing
  "pro-shoe-tree-with-spiral": [
    { iconId: "kit",      label: "PRO Accessories" },
    { iconId: "natural",  label: "Lotus Wood" },
    { iconId: "leaf",     label: "Absorbs Moisture" },
    { iconId: "thumb",    label: "No Creasing" },
  ],

  // Pro Smooth Feet Pumice Turqouise → Essentials, Lightweight, Removes callus and dead skin, Made in Europe
  "pro-smooth-feet-pumice-turqouise": [
    { iconId: "kit",      label: "Essentials" },
    { iconId: "truck",    label: "Lightweight" },
    { iconId: "leaf",     label: "Callus Remover" },
    { iconId: "award",    label: "Made in Europe" },
  ],

  // Pro Suede Brush → PRO Accessories, Multi-purpose design, Helps remove trapped dust, European technology
  "pro-suede-brush": [
    { iconId: "kit",      label: "PRO Accessories" },
    { iconId: "star",     label: "Multi-Purpose" },
    { iconId: "eco",      label: "Removes Dust" },
    { iconId: "award",    label: "Euro Technology" },
  ],

  // Pro Suede and Nubuck Renovator → PRO CARE, Cleaning, Shine, European expertise
  "pro-suede-and-nubuck-renovator": [
    { iconId: "thumb",    label: "PRO CARE" },
    { iconId: "eco",      label: "Cleaning" },
    { iconId: "leaf",     label: "Shine" },
    { iconId: "award",    label: "Euro Expertise" },
  ],

  // Pro Suede n Nubuck 2in1 → PRO CLEAN, Cleaning, Effective Clean, European expertise
  "pro-suede-n-nubuck-2in1": [
    { iconId: "eco",      label: "PRO CLEAN" },
    { iconId: "thumb",    label: "Cleaning" },
    { iconId: "leaf",     label: "Effective Clean" },
    { iconId: "award",    label: "Euro Expertise" },
  ],

  // Pro insoles Gel Comfort Heel Pad → Gel Comfort, Cushioning, Skin friendly, Hand Washable
  "pro-insoles-gel-comfort-heel-pad": [
    { iconId: "star",     label: "Gel Comfort" },
    { iconId: "thumb",    label: "Cushioning" },
    { iconId: "natural",  label: "Skin Friendly" },
    { iconId: "eco",      label: "Hand Washable" },
  ],

  // Suede N Nubuck Shoe Care Kit → PRO CARE, Cleaning, Shine, European expertise
  "suede-n-nubuck-shoe-care-kit": [
    { iconId: "thumb",    label: "PRO CARE" },
    { iconId: "eco",      label: "Cleaning" },
    { iconId: "leaf",     label: "Shine" },
    { iconId: "award",    label: "Euro Expertise" },
  ],

  // PRO Magic Pedi Roller (non-black variant)
  "pro-magic-pedi-roller": [
    { iconId: "kit",      label: "Essentials" },
    { iconId: "leaf",     label: "Callus Remover" },
    { iconId: "refillable", label: "Replaceable Roller" },
    { iconId: "eco",      label: "Smooth Feet" },
  ],
}

// ---------------------------------------------------------------------------
// MAIN SEED FUNCTION
// ---------------------------------------------------------------------------
export default async function seedBadges(container: MedusaContainer) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  console.log("🏷️  Starting badge seed for all products...")

  // Fetch all products with handle + metadata
  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "title", "metadata"],
    pagination: { take: 500, skip: 0 },
  })

  console.log(`📦 Found ${products.length} products`)

  let updated = 0
  let skipped = 0
  let notFound = 0

  for (const product of products) {
    const handle = product.handle?.toLowerCase().trim()
    const badges = PRODUCT_BADGES[handle]

    if (!badges) {
      // Try partial match
      const partialKey = Object.keys(PRODUCT_BADGES).find(k => 
        handle?.includes(k) || k.includes(handle?.split("-").slice(0, 3).join("-") || "")
      )
      if (!partialKey) {
        console.log(`⚠️  No badge data for: "${product.title}" (handle: ${handle})`)
        notFound++
        continue
      }
      // use partial match
      const matchedBadges = PRODUCT_BADGES[partialKey]
      await updateProductBadges(container, product, matchedBadges)
      updated++
      console.log(`✅ [partial match] "${product.title}" → ${partialKey}`)
      continue
    }

    await updateProductBadges(container, product, badges)
    updated++
    console.log(`✅ "${product.title}"`)
  }

  console.log(`\n📊 Summary:`)
  console.log(`   Updated:   ${updated}`)
  console.log(`   Skipped:   ${skipped}`)
  console.log(`   Not found: ${notFound}`)
  console.log(`\n✅ Badge seed complete!`)
}

async function updateProductBadges(
  container: MedusaContainer,
  product: any,
  badges: Array<{ iconId: string; label: string }>
) {
  const remoteLink = container.resolve(ContainerRegistrationKeys.LINK)
  
  // Use Medusa's product module to update metadata
  const productModuleService = container.resolve("productModuleService" as any)
  
  const existingMeta = product.metadata || {}
  const newMeta = {
    ...existingMeta,
    product_badges: JSON.stringify(badges),
  }

  await productModuleService.updateProducts([
    { id: product.id, metadata: newMeta }
  ])
}
