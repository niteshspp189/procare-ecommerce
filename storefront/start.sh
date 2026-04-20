#!/bin/sh
corepack enable && corepack prepare yarn@4.12.0 --activate
yarn install
if [ "$NODE_ENV" = "production" ]; then
  yarn build
  yarn start -p 8000
else
  yarn dev -p 8000
fi
