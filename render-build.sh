#!/usr/bin/env bash
set -e

# Copy over the template package.json on first install (NodeBB keeps it under install/)
if [ ! -f package.json ]; then
	cp install/package.json package.json
fi

npm install --omit=dev --no-audit --no-fund

# Only run first-time setup if no config.json exists yet in this deploy.
if [ ! -f config.json ]; then
	node scripts/render-bootstrap.js
	node scripts/configure-meta.js
	node scripts/seed-categories.js
fi

node nodebb build
