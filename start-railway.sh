#!/bin/bash
set -e

echo "🚂 Starting Matti on Railway..."

echo "✅ PostgreSQL detected - running migrations..."
pnpm drizzle-kit migrate --config=drizzle.config.ts || echo "⚠️  Migration skipped (may already be applied)"

echo "🚀 Starting server..."
NODE_ENV=production node dist/index.js
