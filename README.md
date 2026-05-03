# ProCare E-commerce Platform

A premium e-commerce platform built with MedusaJS, Next.js, and TailwindCSS.

## 🚀 Quick Links
- **[Design System & Strict Rules](./DESIGN_SYSTEM.md)**: Must-read for all developers before creating components.
- **[Storefront](./storefront)**: Next.js frontend.
- **[Backend](./backend)**: MedusaJS core.

## 🎨 Strict Design Rules Summary
To maintain a premium experience, all components must follow the **ProCare Design System**:
1. **Consistency**: Use the unified `ProductCard` for all product listings.
2. **Vertical Rhythm**: All cards must have a fixed height (580px) and perfectly aligned buttons.
3. **Efficiency**: Admin actions should be direct (Single Click Rule).

Refer to [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) for detailed technical specifications.

## 🛠 Development
- Run `docker-compose up` to start the entire stack.
- Storefront runs on `http://localhost:8000` (proxied via Nginx on `9000`).
- Admin UI runs on `http://localhost:9000/admin`.
