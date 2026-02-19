#!/bin/bash
set -e

echo "🚂 Railway Deployment Script"
echo "=============================="

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set"
  exit 1
fi

echo "✅ DATABASE_URL is configured"

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

# Generate PostgreSQL migrations
echo "🗄️ Generating PostgreSQL migrations..."
pnpm drizzle-kit generate --config=drizzle.config.ts

# Run migrations
echo "🚀 Running database migrations..."
pnpm drizzle-kit migrate --config=drizzle.config.ts

# Build application
echo "🏗️ Building application..."
pnpm build

echo "✅ Deployment preparation complete!"
