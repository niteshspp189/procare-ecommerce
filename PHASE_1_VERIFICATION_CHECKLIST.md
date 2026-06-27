# ProCare eCommerce — Phase 1 Manual Verification Checklist

This document details all implemented features, optimizations, and database syncs completed for Phase 1 of the ProCare eCommerce platform. Use this step-by-step checklist to test and verify both Frontend Storefront and Admin Backend workflows before staging handover to the client.

---

## 🌐 Part 1: Frontend Storefront (`shop.mvshoecare.com`)

### 1. Homepage & Bestsellers Priority
- [ ] **URL**: [https://shop.mvshoecare.com/](https://shop.mvshoecare.com/)
- [ ] **Shoe Care Tab**: Verify that **Shoe Cream with Applicator** is displayed as the very first card (index 0).
- [ ] **Insoles Tab**: Click the Insoles tab and verify that **Air Walk Gel Insoles** is displayed as the first card.
- [ ] **Promotional Banners**: Confirm the homepage promo banners highlight **Free Delivery on orders above ₹499** and **15-Day Guarantee**.

### 2. Shop Page Category Order & Sorting
- [ ] **URL**: [https://shop.mvshoecare.com/shop](https://shop.mvshoecare.com/shop)
- [ ] **Default Order**: Open the shop grid without filters. Confirm that products belonging to the **Shoe Care** category are listed first by default.

### 3. Mobile Responsive Shop Page & Expandable Filters
- [ ] **URL**: [https://shop.mvshoecare.com/shop](https://shop.mvshoecare.com/shop) *(Test on smartphone or DevTools responsive view e.g., iPhone SE / 375px)*
- [ ] **Toggle Button**: Verify that the horizontal squished filter bar is replaced by a clean, full-width button: **`[ Filters & Sort (Expand ▼) ]`**.
- [ ] **Drawer Expansion**: Tap the toggle button. Verify it expands into a neat vertical drawer showing Sort, Category, Collection, Size, and Color groups without clipped text.
- [ ] **Active Badges**: Select any filter option. Verify a dynamic badge counter `(1)` updates on the button bar and inside the drawer.
- [ ] **Apply / Close**: Tap **"Apply Filters"** or the top toggle to close the drawer and view the filtered product grid.

### 4. Mobile Product Card Optimization
- [ ] **URL**: [https://shop.mvshoecare.com/shop](https://shop.mvshoecare.com/shop) *(Mobile view)*
- [ ] **Image Proportions**: Confirm product thumbnails scale nicely in square proportions (`180px sm:240px md:320px`) rather than looking tall and squeezed.
- [ ] **Button Typography**: Verify buttons (**`SELECT OPTIONS`** / **`ADD TO CART`**) fit cleanly inside the rounded pill container without text overflow.

### 5. Desktop Sidebar Filters & Custom Scrollbar
- [ ] **URL**: [https://shop.mvshoecare.com/shop](https://shop.mvshoecare.com/shop) *(Desktop view `>= 768px`)*
- [ ] **Default Accordions**: Confirm **Category** and **Collection** filters are open by default.
- [ ] **Collapsed Accordions**: Confirm bulky sections like **Size** and **Color** are collapsed by default (`+`).
- [ ] **Scrollbar Check**: Expand **Size**. Confirm long filter lists scroll smoothly inside a custom container (`max-h-[220px]`) without pushing the page footer down.

### 6. Sports & Sneaker Cleaning Kit Detail Page
- [ ] **URL**: [https://shop.mvshoecare.com/products/pro-gold-sports-sneaker-cleaning-kit](https://shop.mvshoecare.com/products/pro-gold-sports-sneaker-cleaning-kit)
- [ ] **Product Title**: Verify title reads exactly: **`PRO GOLD SPORTS & SNEAKER CLEANING KIT`**.
- [ ] **Image Gallery**: Confirm all **4 high-resolution extraction images** load clearly in the product gallery.
- [ ] **Dynamic FAQ Accordion**: Scroll down to FAQs. Verify the **"Suitable For"** accordion expands to reveal detailed product suitability guidelines.
- [ ] **Return Policy**: Verify the return section explicitly states the **15-Day Return Policy** (no 30-day references).

### 7. MRP Discounts & GST Inclusive Pricing
- [ ] **URL**: Product detail pages & Cart summary ([https://shop.mvshoecare.com/cart](https://shop.mvshoecare.com/cart))
- [ ] **Strikethrough MRP**: Verify discounted items display original MRP crossed out next to the sale price.
- [ ] **Tax Breakdown**: Open cart / checkout. Confirm line items and summaries explicitly display: **`Taxes (18% GST inclusive)`**.

### 8. Free Shipping Threshold Calculation
- [ ] **URL**: [https://shop.mvshoecare.com/cart](https://shop.mvshoecare.com/cart)
- [ ] **Under ₹499**: Add items under ₹499. Confirm notice calculates exact remaining amount needed for free delivery.
- [ ] **Over ₹499**: Add items exceeding ₹499. Confirm banner unlocks indicating **Free Shipping Unlocked**.

### 9. Customer Support Email
- [ ] **URL**: [https://shop.mvshoecare.com/contact](https://shop.mvshoecare.com/contact)
- [ ] **Email Check**: Verify the direct support contact email is updated to **`customercare@mvscindia.com`**.

---

## 🛠️ Part 2: Admin & Database Verification Flow

### 10. Medusa Admin Catalog Check
- [ ] **URL**: `https://shop.mvshoecare.com/store-backend/` *(or staging admin route)*
- [ ] **Product Count**: Log into admin panel and navigate to **Products**. Confirm exactly **45 active products** exist.
- [ ] **Kit Verification**: Search `Sports & Sneaker`. Open **PRO GOLD SPORTS & SNEAKER CLEANING KIT** (`prod_01KVDDTMWAMEWC4P8CMJW182WS`). Verify status is **Published** and assigned to the **Default Sales Channel**.

### 11. Sales Channel & Publishable API Key Linkage
- [ ] **Settings Check**: Go to **Settings** $\rightarrow$ **Publishable API Keys**.
- [ ] **Key Status**: Confirm active key (`pk_b0890f83...`) is enabled and linked to the **Default Sales Channel** (`sc_01KPE3...`). *(Ensures SSG static page compilation succeeds without 400 Bad Request errors).*

### 12. Cash on Delivery (COD) Staging Access
- [ ] **Payment Providers**: Confirm COD remains active for dry-run checkout testing until Razorpay production migration to `propremiumcare.com`.

---

## 📋 Summary of Codebase & DevOps Health
- **TypeScript Compilation**: `npx tsc --noEmit` resolved across all modules (**0 errors**).
- **Production RDS Sync**: Live AWS PostgreSQL database fully synchronized with local 45-product catalog.
- **Docker Containers**: Staging nginx, backend API, and static storefront SSR containers running cleanly on VPS.
