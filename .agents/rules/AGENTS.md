# Project Agent Rules

These rules are strictly enforced for all AI agents working on the Procare E-commerce repository.

## 1. Database Updates & Backups
- **Mandatory Backup First:** Before performing *any* database updates on the production RDS database, you **must** take a backup first using `pg_dump`. 
- **Backup Location:** Save local backups in `untracked/db_backups/`.
- **Targeted Updates:** Updates should strictly target only what needs to be changed.
- **Verification:** After the update, match the updated data against the backup to ensure *only* the intended target was updated.

## 2. Infrastructure Knowledge
- **Production Database:** The production database is an AWS RDS Postgres instance. 
- **VPS Postgres:** Do NOT use or run the local `postgres` container on the VPS. It is not needed and should remain turned off.
- **Local Development:** The local development environment is on Fedora.

## 3. Codebase Organization & Git Hygiene
- **Root Directory:** Keep the root directory completely clean.
- **Git Status:** Both the local and production Git repositories must always be clean. Do not commit scratch files.
- **Untracked Directory:** All old scripts, unused files, and agent experiments are stored in the `untracked/` directory, which is ignored by git.
- **Agent Environment:** Any test scripts, one-off node/python scripts, or experimental code created by agents *must* be placed in `untracked/agent_environment/`.

## 4. Deployment
- **NODE_ENV:** When building and running in production, *always* ensure `NODE_ENV=production`.
- **Deployment Script:** The script used to deploy to the VPS is located at `untracked/deployment/deploy.sh`. 
- **Workflow:** Make your changes, push to GitHub on `main`, then run `untracked/deployment/deploy.sh` to trigger the VPS to pull and rebuild.

## 5. Maintenance Mode
To enable maintenance mode while whitelisting your local Fedora IP, modify `nginx.conf` (or `whitelist.conf` which is included):
1. Define the `$maintenance` variable using a `map` block before the `server` block:
   ```nginx
   map $remote_addr $maintenance {
       default 1;              # Enable maintenance for everyone
       <YOUR_FEDORA_IP> 0;     # Replace with your local IP to bypass
   }
   ```
2. Configure the 503 error page to serve `maintenance.html` inside the `server` block:
   ```nginx
   error_page 503 /maintenance.html;
   location = /maintenance.html {
       root /usr/share/nginx/html;
       internal;
   }
   ```
3. Trigger the 503 inside the `location /` block:
   ```nginx
   if ($maintenance = 1) {
       return 503;
   }
   ```
4. Push the changes and deploy.
