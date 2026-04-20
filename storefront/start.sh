#!/bin/sh
corepack enable && corepack prepare yarn@4.12.0 --activate
yarn install
if [ "$NODE_ENV" = "production" ]; then
  echo "Waiting for backend to be ready..."
  until wget -q --spider http://procare_backend:9000/health; do
    echo "Backend is unavailable - sleeping"
    sleep 3
  done
  echo "Backend is up - starting build"
  yarn build
  yarn start -p 8000
else
  yarn dev -p 8000
fi
