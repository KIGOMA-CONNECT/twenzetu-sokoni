#!/bin/bash
set -e

echo "=== Initializing ABMS database ==="

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  CREATE USER ${DB_OWNER_USER:-abms_owner} WITH SUPERUSER PASSWORD '${DB_OWNER_PASSWORD:-abms_owner_dev_password}';
EOSQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  CREATE USER ${DB_RUNTIME_USER:-abms_runtime} WITH PASSWORD '${DB_RUNTIME_PASSWORD:-abms_runtime_dev_password}';
  GRANT CONNECT ON DATABASE ${DB_NAME:-abms} TO ${DB_RUNTIME_USER:-abms_runtime};
  GRANT USAGE ON SCHEMA public TO ${DB_RUNTIME_USER:-abms_runtime};
  GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${DB_RUNTIME_USER:-abms_runtime};
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${DB_RUNTIME_USER:-abms_runtime};
EOSQL

echo "=== ABMS Database initialization complete ==="
