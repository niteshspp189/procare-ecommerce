# ProCare Design System & UX Standards

This document outlines the strict design rules and architectural patterns that must be followed when creating or modifying components in the ProCare e-commerce ecosystem.

---

## 🎨 Storefront Design Standards (Premium Experience)

### 1. Vertical Rhythm & Grid Consistency
To maintain a high-end, premium aesthetic, all product displays must adhere to strict spatial constraints.

- **Product Cards (Standard)**:
  - **Total Height**: Must be exactly `580px`.
  - **Image Container**: Fixed `320px` height with `object-cover`.
  - **Product Title**: Fixed `44px` height, line-clamped to exactly `2 lines`.
  - **Category Label**: Fixed `20px` height, uppercase, `tracking-widest`.
  - **Price Container**: Fixed `30px` height.
  - **Horizontal Alignment**: "Add to Cart" buttons must form a perfectly straight line across any row.

- **Product Cards (Featured)**:
  - Used in split-sections or full-page rails.
  - Should scale proportionally but maintain the same internal spacing tokens.

### 2. Branding & Colors
- **Primary Action Color**: `#00bda5` (Teal).
- **Hover/Active State**: `#00a38f` (Darker Teal).
- **Borders**: Subtle `slate-100` or `gray-100/50`.
- **Shadows**: Use `shadow-xl` with `shadow-slate-200/50` for hover lifts.

### 3. Layout Patterns
- **Full-Width Sections**: Use the `Section` component with `fullWidth={true}` for immersive content blocks.
- **Carousel Wrappers**: All product carousels must use the unified `CarouselWrapper` to handle navigation and snap-scrolling consistency.

---

## 🛠️ Admin & Backend UX Standards (Efficiency First)

### 1. The "Single Click" Rule
Avoid deep click-paths. If an admin needs to edit a common field (e.g., variant price or stock), the action should be available directly from the list or a primary dashboard widget.

- **Widget Pattern**: Use the `QuickEditVariantWidget` and `OrderStatsWidget` patterns to surface critical actions on the main view page.
- **Action Placement**: Common tasks like "Edit Price" should not be hidden behind more than 2 levels of menus.

### 2. Dashboard Architecture
- Mirror Shopify-style efficiency: Quick access to orders, products, and analytics from the top level.
- Use clear, descriptive icons and consistent button placement (Primary actions always top-right or bottom-right).

---

## 📝 Implementation Guidelines

1. **Don't Repeat Logic**: If a component looks like a product card, it MUST use the unified `ProductCard` component from `@modules/common/components/product-card`.
2. **Tailwind First**: Use standard Tailwind tokens. Avoid ad-hoc hex codes unless they are part of the core brand palette defined in `globals.css`.
3. **Animations**: All interactive elements (cards, buttons, tabs) must have smooth transitions (minimum `duration-400`).
4. **Mobile Responsiveness**: Always verify that vertical rhythm is preserved on mobile (minimum touch targets of `44px`).
