#!/bin/sh
corepack enable && corepack prepare yarn@4.12.0 --activate
yarn install
yarn medusa db:migrate
yarn medusa develop --host 0.0.0.0
