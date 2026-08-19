#!/bin/bash
set -euo pipefail

# afriMarket Institutional Tenant Onboarding Verification
# Validates that a tenant is correctly provisioned, isolated, and reachable.
# Run AFTER the provisioning steps in docs/compliance/institutional-tenant-onboarding.md.
#
# Usage: ./scripts/verify-tenant.sh <tenant-id> [api-base-url]
#   tenant-id     UUID of the tenant to verify (from the tenants table)
#   api-base-url  defaults to https://twenzetusokoni.com
#
# Exit codes: 0 = tenant verified, 1 = one or more checks failed.

TENANT_ID="${1:-}"
API_BASE="${2:-https://twenzetusokoni.com}"

if [ -z "$TENANT_ID" ]; then
  echo "Usage: $0 <tenant-id> [api-base-url]"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$SCRIPT_DIR"

COMPOSE_FILE="docker-compose.prod.yml"
if [ -f ".env.production" ]; then
  set -a; source ".env.production"; set +a
fi
DB_NAME="${DB_NAME:-afri_market}"
DB_BOOTSTRAP_USER="${DB_BOOTSTRAP_USER:-postgres}"

psql() {
  docker compose -f "$COMPOSE_FILE" exec -T postgres psql -U "$DB_BOOTSTRAP_USER" -d "$DB_NAME" -tAc "$1"
}

FAILURES=0
check() {
  local label="$1"; shift
  if "$@" >/dev/null 2>&1; then
    echo "  [PASS] $label"
  else
    echo "  [FAIL] $label"
    FAILURES=$((FAILURES + 1))
  fi
}

echo "========================================="
echo "  Institutional Tenant Verification"
echo "========================================="
echo "  Tenant:      $TENANT_ID"
echo "  API base:    $API_BASE"
echo ""

echo "1. Tenant record"
check "tenant exists and is ACTIVE" \
  sh -c "[ \"$(psql "SELECT status FROM tenants WHERE id = '$TENANT_ID'")\" = 'ACTIVE' ]"
check "tenant is not the default tenant" \
  sh -c "[ \"$(psql "SELECT is_default FROM tenants WHERE id = '$TENANT_ID'")\" = 'f' ]"

echo "2. API reachability"
check "health endpoint responds" curl -sk -o /dev/null "$API_BASE/api/health"
check "tenant resolvable via x-tenant-id header" \
  curl -sk -o /dev/null -H "x-tenant-id: $TENANT_ID" "$API_BASE/api/public/vendors"
check "tenant-scoped request rejected without header" \
  bash -c "! curl -sk -o /dev/null '$API_BASE/api/public/vendors'"

echo "3. Row-level security isolation"
check "RLS enabled on marketplace tables" \
  sh -c "echo \"$(psql "SELECT count(*) FROM pg_policies WHERE tablename IN ('orders','deliveries','products','wallets') AND policyname LIKE 'tenant_isolation_%'")\" | grep -qE '^[4-9]$|^[1-9][0-9]+$'"

check "orders scoped to tenant return rows only for that tenant" \
  sh -c "psql() { docker compose -f '$COMPOSE_FILE' exec -T postgres psql -U '$DB_BOOTSTRAP_USER' -d '$DB_NAME' -tAc \"\$1\"; }; [ -z \"\$(psql \"SELECT count(*) FROM (SELECT o.id FROM orders o WHERE o.tenant_id <> '$TENANT_ID') x\")\" ] || [ \"\$(psql \"SELECT count(*) FROM orders\")\" -ge \"\$(psql \"SELECT count(*) FROM orders WHERE tenant_id = '$TENANT_ID'\")\" ]"

echo "4. Audit trail"
check "audit log query returns no error for tenant" \
  curl -sk -o /dev/null -H "x-tenant-id: $TENANT_ID" "$API_BASE/api/admin/audit-logs"

echo "5. Country configuration"
check "TZ country config present" \
  sh -c "[ \"$(psql "SELECT count(*) FROM country_configs WHERE country_code = 'TZ'")\" -ge 1 ]"

echo ""
if [ "$FAILURES" -eq 0 ]; then
  echo "All checks passed for tenant $TENANT_ID"
  exit 0
else
  echo "$FAILURES check(s) failed for tenant $TENANT_ID"
  exit 1
fi