#!/bin/bash
set -e

echo "=== Initializing afriMarket database ==="

# Create owner user (superuser for DDL/migrations)
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  CREATE USER ${DB_OWNER_USER:-afri_owner} WITH SUPERUSER PASSWORD '${DB_OWNER_PASSWORD:-afri_owner_dev_password}';
EOSQL

# Create runtime user (limited permissions for app queries)
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  CREATE USER ${DB_RUNTIME_USER:-afri_runtime} WITH PASSWORD '${DB_RUNTIME_PASSWORD:-afri_runtime_dev_password}';
  GRANT CONNECT ON DATABASE ${DB_NAME:-afri_market} TO ${DB_RUNTIME_USER:-afri_runtime};
  GRANT USAGE ON SCHEMA public TO ${DB_RUNTIME_USER:-afri_runtime};
  GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${DB_RUNTIME_USER:-afri_runtime};
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${DB_RUNTIME_USER:-afri_runtime};
EOSQL

echo "=== Database initialization complete ==="
