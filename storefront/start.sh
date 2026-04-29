#!/bin/sh

if [ "$NODE_ENV" = "production" ]; then
  echo "Waiting for backend..."
  until wget -q --spider http://procare_backend:9000/health; do
    echo "Backend not ready - sleeping"
    sleep 5
  done
  echo "Backend is up - installing dependencies..."
  corepack enable && corepack prepare yarn@4.12.0 --activate
  yarn install
  echo "Building production..."
  yarn build
  yarn start -p 8000
else
  echo "Dev mode - installing dependencies..."
  corepack enable && corepack prepare yarn@4.12.0 --activate
  yarn install
  echo "Starting dev server..."
  yarn dev -p 8000
fi
