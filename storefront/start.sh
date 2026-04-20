#!/bin/sh
# corepack enable && corepack prepare yarn@4.12.0 --activate
# yarn install

if [ "$NODE_ENV" = "production" ]; then
  echo "Waiting for backend to be fully ready (HTTP 200)..."
  # Wait for a successful response from the products API
  until wget -q --spider http://procare_backend:9000/store/products; do
    echo "Backend is still starting - sleeping"
    sleep 5
  done
  echo "Backend is up - starting production build"
  yarn build
  yarn start -p 8000
else
  yarn dev -p 8000
fi
