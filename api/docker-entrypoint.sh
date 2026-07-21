#!/bin/sh
set -e

echo "🔄 Starting application initialization..."

# Aguardar o banco estar disponível
echo "⏳ Waiting for database to be ready..."
max_attempts=30
attempt=0

# Extrair host e porta da DATABASE_URL real do ambiente
echo "🧪 [debug:entrypoint] NODE_ENV=${NODE_ENV:-undefined} PORT=${PORT:-undefined}"
if [ -z "${DATABASE_URL:-}" ]; then
  echo "❌ DATABASE_URL is missing"
  exit 1
fi

if [ -z "${DIRECT_URL:-}" ]; then
  echo "❌ DIRECT_URL is missing"
  exit 1
fi

echo "🧪 [debug:entrypoint] DATABASE_URL is set"

DB_HOST=$(node -e "const url = new URL(process.env.DATABASE_URL); process.stdout.write(url.hostname || '')")
DB_PORT=$(node -e "const url = new URL(process.env.DATABASE_URL); process.stdout.write(url.port || '5432')")

if [ -z "$DB_HOST" ]; then
  echo "❌ Could not parse database host from DATABASE_URL"
  exit 1
fi

echo "🧪 [debug:entrypoint] waiting for database at ${DB_HOST}:${DB_PORT}"

# Aguardar conexão TCP ao PostgreSQL
until nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null || [ $attempt -eq $max_attempts ]; do
  attempt=$((attempt + 1))
  echo "   Waiting for PostgreSQL at $DB_HOST:$DB_PORT (attempt $attempt/$max_attempts)..."
  sleep 2
done

if [ $attempt -eq $max_attempts ]; then
  echo "❌ PostgreSQL connection timeout after $max_attempts attempts"
  exit 1
fi

echo "✅ PostgreSQL is accepting connections!"

# Aguardar mais um pouco para o banco estar completamente pronto
echo "⏳ Waiting for PostgreSQL to be fully ready..."
sleep 5

# Ensure Prisma schema exists when using Supabase (database is never empty).
HAS_SCHEMA_PARAM=$(node -e "const u=new URL(process.env.DATABASE_URL); process.stdout.write(u.searchParams.has('schema') ? '1' : '0')")
if [ "$HAS_SCHEMA_PARAM" -eq 0 ]; then
  export APP_DB_SCHEMA="grafos"
  export DATABASE_URL=$(node -e "const u=new URL(process.env.DATABASE_URL); u.searchParams.set('schema', process.env.APP_DB_SCHEMA); process.stdout.write(u.toString())")
  export DIRECT_URL=$(node -e "const u=new URL(process.env.DIRECT_URL); u.searchParams.set('schema', process.env.APP_DB_SCHEMA); process.stdout.write(u.toString())")
  echo "🧪 [debug:entrypoint] schema param not set; defaulting to schema=${APP_DB_SCHEMA}"
fi

DB_SCHEMA=$(node -e "const u=new URL(process.env.DATABASE_URL); process.stdout.write(u.searchParams.get('schema') || 'public')")
ADMIN_DIRECT_URL=$(node -e "const u=new URL(process.env.DIRECT_URL); u.searchParams.delete('schema'); u.searchParams.delete('pgbouncer'); process.stdout.write(u.toString())")

if [ "$DB_SCHEMA" != "public" ]; then
  echo "🔄 Ensuring schema exists: ${DB_SCHEMA}"
  echo "CREATE SCHEMA IF NOT EXISTS \"${DB_SCHEMA}\";" | npx prisma db execute --stdin --url="$ADMIN_DIRECT_URL"
fi

# Rodar migrations
echo "🔄 Running database migrations..."
set +e
MIGRATE_OUTPUT=$(npx prisma migrate deploy 2>&1)
MIGRATE_EXIT_CODE=$?
set -e

if [ $MIGRATE_EXIT_CODE -ne 0 ]; then
  echo "$MIGRATE_OUTPUT"
  echo "❌ prisma migrate deploy failed (exit=$MIGRATE_EXIT_CODE)"
  exit $MIGRATE_EXIT_CODE
fi

echo "$MIGRATE_OUTPUT"

# Rodar seed (com tratamento de erro)
echo "🌱 Running database seed..."
if npx prisma db seed 2>&1 | tee /tmp/seed.log; then
  echo "✅ Seed completed successfully"
else
  echo "⚠️  Seed failed or data already exists (this is normal on restart)"
  cat /tmp/seed.log
fi

echo "✨ Initialization complete!"
echo "🚀 Starting application..."

# Iniciar a aplicação
exec npm run start:prod
