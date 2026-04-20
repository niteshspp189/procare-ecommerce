#!/bin/sh
corepack enable && corepack prepare yarn@4.12.0 --activate
yarn install
yarn medusa db:migrate

if [ "$NODE_ENV" = "production" ]; then
  yarn build
  yarn medusa start
else
  yarn medusa develop --host 0.0.0.0
fi
