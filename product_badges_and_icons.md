# Product Badges & Icons Directory

This document lists all active product badges, custom storefront PNG icons, predefined SVG fallback icons, and their mapping rules.

---

## 1. Custom Storefront PNG Icons (13 Icons)
These icons are stored as high-resolution PNGs in `storefront/public/images/icons/` and are mapped to matching badge text or icon IDs automatically.

| Icon Filename | Sample Match Text (Case-Insensitive) / Icon IDs | Intended Usage |
| :--- | :--- | :--- |
| **`pro-clean.png`** | `"pro clean"`, `"proclean"`, `pro-clean` | PRO series deep cleaners |
| **`pro-fresh.png`** | `"pro fresh"`, `"profresh"`, `pro-fresh` | PRO series deodorizers/freshers |
| **`pro-care.png`** | `"pro care"`, `"procare"`, `pro-care` | PRO series protectors/conditioners |
| **`pro-shine.png`** | `"pro shine"`, `"proshine"`, `pro-shine` | PRO series self-shine liquids |
| **`pro-color-green.png`** | `"pro color"`, `"procolor"`, `pro-color`, `pro-color-green` | PRO series color refreshers |
| **`europian-experts.png`** | `"european expertise"`, `"made in europe"`, `"europe"`, `europian-experts` | European quality certifications |
| **`color-refreshing.png`** | `"color refreshing"`, `"color refresh"`, `"colour"`, `"color restore"` | Premium shoe cream color enhancers |
| **`helps-fight-fungi-and-bacteria.png`** | `"fight fungi"`, `helps-fight-fungi-and-bacteria` | Anti-fungal sanitizers/sprays |
| **`long-lasting-freshness.png`** | `"freshness"`, `long-lasting-freshness` | Long-lasting shoe fresheners |
| **`effective-cleaning-agent.png`** | `"effective clean"`, `"effective cleaning agent"` | Deep foam shampoos/wipes |
| **`cleaning.png`** | `"cleaning"`, `cleaning` | General cleaning accessories |
| **`shine.png`** | `"shine"`, `"natural shine"`, `shine` | High gloss shine creams/sprays |
| **`contain-high-quality.png`** | `"carnauba"`, `"bristles"`, `"steel"`, `contain-high-quality` | High-quality wax, horse-hair/boar bristles, or steel files |

> [!NOTE]
> `"wood"` was recently removed from `contain-high-quality.png` mapping. It now falls back to its database-configured SVG icon ID (`leaf`), ensuring unique icons for products that contain both bristles/wax and wood elements (like brushes and shoe trees).

---

## 2. Predefined SVG Fallbacks (13 Icons)
If a badge label does not match any of the custom PNG rules above, the storefront renders the SVG icon defined by its `iconId` in the database.

| Icon ID | Icon Description | Visual Representation | Matches & Usage |
| :--- | :--- | :--- | :--- |
| **`leaf`** | Leaf Outline | 🍃 Sustainable / Nature | Wood handles, sustainable materials (Cedar Wood, Lotus Wood, Beech Wood Handle). |
| **`eco`** | Checkmark | Checkmark | Eco friendly, basic confirmation, accessories (`PRO Accessories`). |
| **`natural`** | Globe | 🌐 Earth/World | Skin friendly ingredients, travel friendly. |
| **`award`** | Trophy Cup | 🏆 Award / Trophy | Quality standards, premium series. |
| **`star`** | Star | ⭐ Star | Gel comfort, ease, customer top-rated. |
| **`thumb`** | Thumbs Up | Thumbs Up | Quality guarantees, durability. |
| **`shipping`** | Delivery Truck | 🚚 Delivery Truck | Shipping policies, quick transit times. |
| **`return`** | Shield with Check | 🛡️ Return Policy | Return guarantees (15 Day Return, 30 Day Return). |
| **`refillable`** | Recycle Loop | Recycle | Replaceable rollers, eco refills. |
| **`organic`** | Starburst / Sun | ☀️ Solar / Natural | Organic raw ingredients, botanical oils. |
| **`kit`** | Open Package Box | 📦 Package Box | Complete shoe care kits. |
| **`lock`** | Padlock | 🔒 Security | Secure shopping, steel strength. |
| **`gift`** | Gift Box | 🎁 Gift Wrap | Gift ready, multi-packs. |
