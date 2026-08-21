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
