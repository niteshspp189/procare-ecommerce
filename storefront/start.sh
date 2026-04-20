#!/bin/sh
corepack enable && corepack prepare yarn@4.12.0 --activate
yarn install
yarn dev -p 8000
