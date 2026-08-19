#!/bin/sh
set -eu

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required" >&2
  exit 1
fi

echo "Starting Grafos API (database migrations are managed by GitHub Actions)"
exec "$@"
