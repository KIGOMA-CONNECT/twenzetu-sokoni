// No Tenant module exists yet (Sprint 2 is the generic org tree engine only), so
// there is no registry of real tenants to enumerate and seed for. This mirrors the
// hardcoded TENANT_A/TENANT_B pattern already used by the RLS isolation integration
// test in libs/database — a known, documented stopgap, not the intended long-term
// shape, to be revisited once a Tenant module exists.
export const DEFAULT_TENANT_ID =
  process.env['DEFAULT_TENANT_ID'] ?? '00000000-0000-4000-8000-000000000001';
