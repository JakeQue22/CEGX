#!/bin/sh
set -e

echo "🚀 CEGX Backend starting..."

# ---------------------------------------------------------------------------
# Migration strategy:
# 1. Fresh database          → migrate deploy creates all tables
# 2. Existing (db push) DB   → baseline the init migration, then deploy
# 3. Already-migrated DB     → deploy any new pending migrations
# ---------------------------------------------------------------------------

# Check if the database already has tables but no _prisma_migrations table
# (i.e. it was previously managed with "prisma db push")
HAS_TABLES=$(node -e "
  const { PrismaClient } = require('@prisma/client');
  const p = new PrismaClient();
  p.\$queryRawUnsafe('SELECT 1 FROM company_settings LIMIT 1')
    .then(() => { console.log('yes'); process.exit(0); })
    .catch(() => { console.log('no'); process.exit(0); });
" 2>/dev/null || echo "no")

HAS_MIGRATIONS=$(node -e "
  const { PrismaClient } = require('@prisma/client');
  const p = new PrismaClient();
  p.\$queryRawUnsafe('SELECT 1 FROM _prisma_migrations LIMIT 1')
    .then(() => { console.log('yes'); process.exit(0); })
    .catch(() => { console.log('no'); process.exit(0); });
" 2>/dev/null || echo "no")

if [ "$HAS_TABLES" = "yes" ] && [ "$HAS_MIGRATIONS" = "no" ]; then
  echo "📦 Existing database detected (previously managed with db push)"
  echo "   Baselining initial migration..."
  node node_modules/prisma/build/index.js migrate resolve --applied 20250101000000_init
  echo "✅ Baseline complete"
fi

# Apply any pending migrations
echo "🔄 Running database migrations..."
node node_modules/prisma/build/index.js migrate deploy
echo "✅ Migrations complete"

# Seed default data (idempotent — only creates records that don't exist)
echo "🌱 Running seed..."
node prisma/seed.js
echo "✅ Seed complete"

# Start the application
echo "🚀 Starting NestJS application..."
exec node dist/main
