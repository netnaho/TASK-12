#!/bin/sh
set -e

echo "=================================================="
echo "  LeaseOps Backend Startup"
echo "=================================================="

# ── 0. Pre-flight: validate critical environment variables ──────────────────
# Catches missing or obviously-wrong values before the app attempts to connect
# to the database. The Node.js process performs a more thorough Zod validation
# on startup; this shell check surfaces issues earlier in container logs.
echo "Step 0/3: Checking required environment variables..."
PREFLIGHT_OK=1

_require() {
  VAR="$1"; MIN_LEN="${2:-1}"
  VAL=$(eval "echo \"\$$VAR\"")
  if [ -z "$VAL" ]; then
    echo "  ERROR: $VAR is not set"
    PREFLIGHT_OK=0
  elif [ "${#VAL}" -lt "$MIN_LEN" ]; then
    echo "  ERROR: $VAR is set but too short (got ${#VAL} chars, need at least $MIN_LEN)"
    PREFLIGHT_OK=0
  fi
}

_require DATABASE_URL        10
_require SESSION_SECRET      32
_require AES_ENCRYPTION_KEY  64

if [ "$PREFLIGHT_OK" -eq 0 ]; then
  echo ""
  echo "  Pre-flight failed. Copy .env.example to .env, fill in real values, and restart."
  exit 1
fi
echo "  All required variables present."
echo ""

# ── 1. Wait for MySQL to accept connections ─────────────────────────────────
# The DB healthcheck only confirms mysqladmin ping; DDL connections can still
# be rejected for a few extra seconds while InnoDB initialises.
MAX_TRIES=40
TRIES=0
echo "Step 1/3: Waiting for database to accept connections..."
until node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.\$queryRaw\`SELECT 1\`.then(() => { p.\$disconnect(); process.exit(0); }).catch(() => { p.\$disconnect(); process.exit(1); });
" 2>/dev/null; do
  TRIES=$((TRIES + 1))
  if [ $TRIES -ge $MAX_TRIES ]; then
    echo "ERROR: Database did not become ready after $MAX_TRIES attempts. Aborting."
    exit 1
  fi
  echo "  Not ready yet (attempt $TRIES/$MAX_TRIES). Retrying in 3s..."
  sleep 3
done
echo "  Database is ready."

# ── 2. Run migrations ────────────────────────────────────────────────────────
echo ""
echo "Step 2/3: Applying database migrations..."
npx prisma migrate deploy
echo "  Migrations applied."

# ── 3. Seed the database (idempotent – uses upsert throughout) ───────────────
echo ""
echo "Step 3/3: Seeding database (idempotent)..."
npx prisma db seed && echo "  Seeding complete." || echo "  Seeding skipped (data may already exist)."

# ── 4. Start the application ─────────────────────────────────────────────────
echo ""
echo "Starting server on port ${PORT:-3000}..."
exec node dist/index.js
