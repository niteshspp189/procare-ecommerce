#!/bin/sh
# corepack enable && corepack prepare yarn@4.12.0 --activate
# yarn install
yarn medusa db:migrate

if [ "$NODE_ENV" = "production" ]; then
  # Increased memory limit to 4GB for production startup with RDS
  node --max-old-space-size=4096 ./node_modules/.bin/medusa start
else
  yarn medusa develop --host 0.0.0.0
fi
