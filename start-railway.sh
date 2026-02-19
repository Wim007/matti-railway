#!/bin/bash
set -e

echo "🚂 Starting Matti on Railway..."

# Check if we're using PostgreSQL (Railway) or MySQL (Manus)
if [[ $DATABASE_URL == postgres* ]]; then
  echo "✅ PostgreSQL detected - running migrations..."
  
  # Generate and run PostgreSQL migrations
  pnpm drizzle-kit generate --config=drizzle.config.railway.ts || echo "⚠️  Migration generation skipped (may already exist)"
  pnpm drizzle-kit migrate --config=drizzle.config.railway.ts || echo "⚠️  Migration skipped (may already be applied)"
else
  echo "✅ MySQL/TiDB detected - skipping PostgreSQL migrations"
fi

# Start the application
echo "🚀 Starting server..."
NODE_ENV=production node dist/index.js
