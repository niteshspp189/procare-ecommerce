# Project Agent Rules

These rules are strictly enforced for all AI agents working on the Procare E-commerce repository.

## 1. Database Updates & Backups
- **Mandatory Backup First:** Before performing *any* database updates on the production RDS database, or prior to any major deployment, you **must** take a backup first using the provided backup script: `untracked/backup-database.sh` (select Option 2 for Production RDS backup).
- **Backup Location:** The script will automatically save the backups in `untracked/db_backups/`.
- **Targeted Updates:** Updates should strictly target only what needs to be changed.
- **Verification:** After the update, match the updated data against the backup to ensure *only* the intended target was updated.

## 2. Infrastructure Knowledge
- **Production Database:** The production database is an AWS RDS Postgres instance (`database-1.c5wkcis2qg...rds.amazonaws.com`). 
- **VPS Postgres:** Do NOT use or run the local `postgres` container on the VPS. It is not needed and should remain turned off.
- **Local Development:** The local development environment is on Fedora.

## 3. Codebase Organization & Git Hygiene
- **Root Directory:** Keep the root directory completely clean.
- **Git Status:** Both the local and production Git repositories must always be clean. Do not commit scratch files.
- **Docker Restart Safety:** Before running any Docker commands or restarting containers on the VPS, you **must** use the `untracked/deployment/vps-manager.sh` script. This script automatically checks `git status` on the VPS and will abort if uncommitted changes (especially in mounted volumes like `backend-static` containing uploaded images) are found, preventing accidental data loss when containers reset.
- **Process Safety & No Intrusive Process Killing:** NEVER execute `pkill node`, `killall node`, or indiscriminate `kill` commands inside `procare_backend`. The main process (`node medusa start`) hosts both the live API server AND the background cron/scheduled jobs worker. Killing it terminates the background scheduler. For container restarts, always route through `untracked/deployment/vps-manager.sh "docker compose restart backend"`.
- **Untracked Directory:** All old scripts, unused files, and agent experiments are stored in the `untracked/` directory, which is ignored by git.
- **Agent Environment:** Any test scripts, one-off node/python scripts, or experimental code created by agents *must* be placed in `untracked/agent_environment/`.

## 4. Deployment
- **NODE_ENV:** When building and running in production, *always* ensure `NODE_ENV=production`.
- **VPS Execution Wrapper:** For **any** custom commands, Docker restarts, or deployment actions executed on the VPS, you must route them through `untracked/deployment/vps-manager.sh "<command>"`.
- **Deployment Script:** The script used to deploy to the VPS is located at `untracked/deployment/deploy.sh` (which safely wraps `vps-manager.sh`). 
- **Workflow:** Make your changes, push to GitHub on `main`, then run `untracked/deployment/deploy.sh` to trigger the VPS to safely pull and rebuild.

## 5. Maintenance Mode
To enable maintenance mode while whitelisting your local Fedora IP, you must **SSH into the AWS VPS** and modify the host's Nginx configuration located at `/etc/nginx/` (e.g., `/etc/nginx/nginx.conf` or a specific file like `/etc/nginx/conf.d/procare.conf` / `whitelist.conf`).

1. Set the `$maintenance` variable using the `geo` block in `/etc/nginx/conf.d/whitelist.conf`:
   ```nginx
   geo $maintenance {
       default 1;              # 1 = maintenance on, 0 = maintenance off
       <YOUR_FEDORA_IP> 0;     # Your local IP bypasses maintenance
   }
   ```
2. The 503 error page is configured in `/etc/nginx/sites-available/propremiumcare.conf` inside the `server` block using a named location:
   ```nginx
   location @maintenance {
       root /var/www/procare-ecommerce;
       try_files /maintenance.html =503;
   }
   ```
3. The maintenance trigger is in the `location /` block:
   ```nginx
   error_page 503 @maintenance;
   if ($maintenance = 1) {
       return 503;
   }
   ```
4. Reload Nginx on the VPS: `sudo systemctl reload nginx`

---

## 6. Post-Production Verification Checklist & Diagnostics
Whenever maintenance mode is turned ON/OFF, or immediately following any production deployment, you **must** execute the automated verification audit or manually verify the following critical checkpoints:

### 🚀 Automated Verification Command
Run the built-in health audit on the VPS:
```bash
ssh procare "docker exec -i procare_backend node -" < untracked/deployment/verify_production.js
```

### 📋 9-Point Manual Verification Checklist

| Checkpoint | Target State | How to Verify |
| :--- | :--- | :--- |
| **1. NODE_ENV** | Must be `production` | `docker exec procare_backend node -e "console.log(process.env.NODE_ENV)"`<br>Output must be `production`. |
| **2. Payment Gateway** | Live Razorpay credentials | `docker exec procare_backend node -e "console.log(process.env.RAZORPAY_KEY_ID?.startsWith('rzp_live_'))"`<br>Must start with `rzp_live_` (NOT `rzp_test_`). |
| **3. Shiprocket Logistics** | `production` mode & Auth HTTP 200 | `docker exec procare_backend node -e "console.log(process.env.SHIPROCKET_ENV)"`<br>Output must be `production`, and token auth must return HTTP 200. |
| **4. Database Target** | AWS RDS Postgres | `docker exec procare_backend node -e "console.log(process.env.DATABASE_URL.includes('rds.amazonaws.com'))"`<br>Must connect to AWS RDS (`database-1...rds.amazonaws.com`), NEVER local VPS Postgres (`localhost` / `127.0.0.1`). |
| **5. Process Liveness & Cron Worker** | `medusa start` running & worker active | `docker exec procare_backend ps aux`<br>Must show `node ... medusa start` running as the main process. Do NOT kill this process. |
| **6. Nightly Cron & Fulfillment** | Scheduled job active & 100% orders fulfilled | Query unfulfilled orders from last 7 days. Ensure Medusa scheduled job (`nightly-shiprocket-fulfill` in `src/jobs/auto-fulfill-nightly.ts`) is present, and recent orders have valid Shiprocket order & shipment IDs. |
| **7. GTM & Meta Pixel (`/confirm`)** | `Purchase` event triggered on thank-you page | Inspect browser console on `/order/<id>/confirmed`:<br>1. **GTM dataLayer**: `window.dataLayer.find(e => e.event === 'purchase')` returns `{ transaction_id, value, currency: 'INR' }`.<br>2. **Meta Pixel**: `fbq` function exists and Meta Pixel Helper shows `Purchase` event with exact order value and currency. |
| **8. Shiprocket Redis Token Cache** | Token cached in Redis (`shiprocket:auth_token`) with 7-day TTL | `docker exec procare_redis redis-cli ttl shiprocket:auth_token`<br>Must return positive TTL (> 0), verifying auth token reuse without hitting `/auth/login`. |
| **9. Dual Host & Container Token Sharing** | RDS fallback table has valid token | `docker exec procare_backend node -e "const { Client } = require('pg'); const c = new Client({ connectionString: process.env.DATABASE_URL }); c.connect().then(() => c.query('SELECT expires_at FROM shiprocket_token_cache WHERE id = 1')).then(r => { console.log(r.rows); c.end(); });"`<br>Must show valid `expires_at` in the future. |
| **10. Cron Execution History Audit** | Latest jobs in `cron_job_log` reported `success` | `docker exec procare_backend node -e "const { Client } = require('pg'); const c = new Client({ connectionString: process.env.DATABASE_URL }); c.connect().then(() => c.query('SELECT job_name, status, duration_ms, started_at, summary FROM cron_job_log ORDER BY id DESC LIMIT 3')).then(r => { console.log(r.rows); c.end(); });"`<br>Must show `status: 'success'` and 0 failed runs. |
| **11. Razorpay Webhook Safety Net** | Webhook endpoint active & sync wired | Webhook listener at `/api/hooks/payment/razorpay` automatically triggers `syncOrderToShiprocket` whenever an order payment is captured. |

### 🛠️ In Case of Fulfillment Anomaly:
- Use the **1-Click "⚡ Fulfill & Sync to Shiprocket"** button in Admin Order Details or the **"⚡ Sync"** button in All Orders table (`/admin/all-orders`).
- Alternatively, run `untracked/agent_environment/test_nightly_job.js` via `docker exec -i procare_backend node - < untracked/agent_environment/test_nightly_job.js` to immediately batch-fulfill any missing orders.

---

## 7. Shiprocket Logistics & Token Architecture (Learned Lessons)

To prevent API lockouts and cascading fulfillment failures, all agents must strictly adhere to the following rules:

### 1. Persistent Token Caching (Redis + PostgreSQL Dual Layer)
- **Requirement:** Shiprocket JWT tokens are valid for **10 days (240 hours)**.
- **Strict Rule:** NEVER store tokens exclusively in JavaScript RAM. Tokens MUST be persisted in Redis (`shiprocket:auth_token` with 7-day TTL = 604,800s) and backed up in PostgreSQL (`shiprocket_token_cache`).
- **Why:** Every container restart or cron process that starts with an empty token calls `/auth/login`. Shiprocket's auth cluster (`sr-auth.shiprocket.in`) throttles login calls and returns misleading `403 {"message":"Invalid email and password combination","status_code":403}` errors when hit repeatedly.

### 2. Dual-Environment Traffic (Direct VPS Host vs Container)
- **Requirement:** Both the Docker container and commands executed on the direct VPS host exit through the identical AWS public IP (`3.7.7.67`).
- **Safety Rule:** Always route diagnostic scripts through `docker exec -i procare_backend node -` so they reuse the shared Redis cache and environment variables. Independent scripts hitting `/auth/login` directly from the host consume the same IP-level rate-limit bucket and can lock out the main server.

### 3. Anti-Hammering & No Tight-Loop Login Retries
- **Strict Rule:** NEVER loop-retry `/auth/login` on 403 or 400 errors.
- **Why:** When Shiprocket returns 403 (throttled), firing 3 to 9 retries within seconds causes Shiprocket's firewall to escalate to `400/403 {"message":"User blocked due to too many failed login attempts."}`. Always fail fast and let the temporary (30-60 min) rate limit cool down.

### 4. Mandatory HTTP Request Headers
- **Requirement:** All HTTP POST requests to `apiv2.shiprocket.in` MUST include:
  - `User-Agent: ProCare-Ecommerce/1.0`
  - `Content-Length: Buffer.byteLength(body)`
  - `Content-Type: application/json`
- **Why:** Requests without `User-Agent` and `Content-Length` are frequently challenged or dropped by Shiprocket's Cloudflare / AWS WAF.

### 5. Medusa v2 Fulfillment Service Query Safety
- **Requirement:** In Medusa v2, fulfillment providers run in an isolated module container where `this.container.resolve("query")` is unavailable.
- **Strict Rule:** Direct SQL fallbacks must query the `order` and `order_address` tables cleanly. NEVER reference `os.current_order_total` from `order_summary` because that column does not exist in Medusa v2.

### 6. Razorpay Webhook Safety Net & Order Auto-Fulfillment
- **Requirement:** Checkout flow in Medusa consists of two asynchronous steps: payment authorization/capture and order creation.
- **Safety Rule:** The Razorpay webhook handler at `src/api/hooks/payment/razorpay/route.ts` MUST always trigger `syncOrderToShiprocket(orderRecord.order_id, req.scope)` upon confirming a captured payment.
- **Why:** If the customer's browser closes prematurely or client-side cart completion experiences network latency, the webhook guarantees the order is immediately fulfilled to Shiprocket without waiting for the nightly cron job.

### 7. Cron Job Observability & Developer Log Viewer
- **Requirement:** All cron jobs (e.g. `nightly-shiprocket-fulfill`, `shiprocket-status-sync`) must log start times, execution duration, status (`success`, `warning`, `failed`), and summaries to the `cron_job_log` PostgreSQL table.
- **Inspection Endpoints:**
  - Database table: `SELECT * FROM cron_job_log ORDER BY id DESC LIMIT 10;`
  - Admin API: `GET /admin/custom/cron-jobs`
  - Admin UI: `/admin/cron-jobs`

### 8. Order Discrepancy & Duplicate Payment Resolution Protocol
- When customers place multiple orders in quick succession with varying totals:
  1. **Promotions & Coupons:** Check `order.metadata->'discount_code'` and promotion adjustment lines. (e.g., `RAKHI5` 5% discount).
  2. **Line Item Breakdown:** Query `order_line_item` to compare item counts, quantities, and newly added/removed variants between orders.
  3. **Payment State Audit:** Check `payment_collection`, `payment_session`, and live Razorpay status (`razorpayClient.payments.fetch`).
  4. **Duplicate Charge Protocol:** If multiple charges are captured in Razorpay for what appears to be a cart alteration, fulfill the active desired order, flag the redundant order in Medusa Admin, and alert the customer/support team with payment IDs (`pay_*`) to initiate a prompt refund for the duplicate transaction.

---

## 8. Frontend, Media & Nginx Safety Guidelines (Learned Lessons)

To avoid regressions across storefront routing, banner assets, media uploads, and catalog sorting, all agents must strictly adhere to the following rules:

### 1. Nginx Reverse Proxy Body Size (`client_max_body_size`)
- **Requirement:** Both the **VPS Host Nginx** (`/etc/nginx/sites-available/propremiumcare.conf` & `/etc/nginx/nginx.conf`) and the **Docker Nginx container** (`nginx.conf`) MUST have `client_max_body_size 50M;` configured.
- **Why:** Base64 JSON image uploads add ~33% payload overhead. Without `client_max_body_size 50M;`, Nginx defaults to `1M`, rejecting uploads with `413 Request Entity Too Large` before reaching Medusa.

### 2. Next.js Route Architecture & `countryCode` Parameter Guard
- **Requirement:** The storefront does NOT use a `[countryCode]` URL segment for routes like `/categories/*`, `/collections/*`, `/shop`, `/our-story`, etc.
- **Strict Rule:** NEVER write `if (!countryCode) notFound()` in templates or server components.
- **Safe Pattern:** ALWAYS provide a fallback to `"in"`:
  ```ts
  const country = countryCode || "in"
  ```
- **Why:** `notFound()` invokes `storefront/src/app/(main)/not-found.tsx`, which triggers `window.location.replace("/")`, incorrectly redirecting users back to the homepage.

### 3. Banner Image Alignment & Headroom (`object-position: top`)
- **Requirement:** Wide banners, category headers, and hero banners with text or high focal points must use `object-position: top` (`objectPosition: 'top'` in inline styles or `object-top` in Tailwind classes) combined with `object-cover`.
- **Target Slots:**
  - Category Headers (`/categories/*`): `heroBg: { objectFit: 'cover', objectPosition: 'top' }`
  - Our Story Top Hero (`/our-story`): `className="w-full h-full object-cover object-top"`
  - Dynamic Hero Banner (`/`): `className="w-full h-full object-cover object-top"`
- **Why:** Default `object-position: center` clips the top headroom and slices off category title text (e.g., `"SHOE CARE"`, `"CARE IS THE NEW FLEX"`).

### 4. Product Catalog Default Sorting (`created_at_asc`)
- **Requirement:** All storefront listing pages (Store `/shop`, Categories `/categories/*`, Collections `/collections/*`) MUST default to `created_at_asc` (Oldest Arrivals / Catalog Creation Order).
- **Strict Rule:** NEVER inject hardcoded descending timestamp overrides in `paginated-products.tsx`.
- **Why:** `created_at_asc` preserves the curated brand catalog presentation where flagship products (Pro Gold Shoe Cream, Cream with Applicator, Self Shine) appear first, rather than newer kits/accessories.

### 5. Media Upload Limits & Allowed Formats
- **Allowed Formats:** Strictly `.webp`, `.png`, `.jpg`, `.jpeg` (reject `.avif`, `.gif`, `.svg`, `.bmp`, `.tiff`).
- **File Size Limit:** Strictly `<= 1.0 MB` enforced on both the client (pre-upload) and backend API (`/admin/custom/banners/upload`) with clear user toast messages.

### 6. Docker Restart & VPS Media Persistence
- **Requirement:** Uploaded media on the VPS lives in `backend-static/` (mounted to container volume).
- **Safety Rule:** Always route VPS commands through `untracked/deployment/deploy.sh` or `vps-manager.sh`. If untracked images exist in `backend-static/` on the VPS, commit them before restarting containers to prevent accidental data loss.

