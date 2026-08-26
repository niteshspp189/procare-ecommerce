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

## 🤖 Agent Workflow & Rules
All autonomous agents must adhere to the rules defined in **[.agents/rules/AGENTS.md](./.agents/rules/AGENTS.md)**.
- **Root Cleanliness**: The root directory is strictly for core application code. 
- **Untracked Environment**: All scratch scripts, database backups, and legacy files are stored in `untracked/`. 
- **Backups**: Database backups must be executed using the `untracked/backup-database.sh` script and saved to `untracked/db_backups/`.
- **Deployments**: The deploy script is located at `untracked/deployment/deploy.sh`.
- **Maintenance Mode**: Instructions for enabling maintenance mode with IP whitelisting via Nginx are fully documented in section 5 of the agent rules.

## 🔍 Post-Production Verification & Health Audit
Whenever maintenance mode is enabled/disabled or following any production deployment, execute the automated verification audit:

```bash
ssh procare "docker exec -i procare_backend node -" < untracked/deployment/verify_production.js
```

This validates all 6 critical production checkpoints:
1. **NODE_ENV**: Verified as `production`.
2. **Razorpay**: Verified live API credentials (`rzp_live_...`).
3. **Shiprocket**: Verified `production` environment and auth token (HTTP 200).
4. **AWS RDS**: Verified connection to AWS RDS Postgres (never local VPS Postgres).
5. **Nightly Cron & Fulfillment**: Verified scheduled job is active and 100% of recent orders are fulfilled.
6. **GTM & Meta Pixel**: Verified `Purchase` tracking on `/order/<id>/confirmed`.

For detailed troubleshooting and instructions, see **[.agents/rules/AGENTS.md](./.agents/rules/AGENTS.md)**.
