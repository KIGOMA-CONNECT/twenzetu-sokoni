/**
 * Central registration for all first-party per-module AI context builders.
 *
 * Importing this module has the side effect of registering builders — AiModule
 * imports it so every runtime (API and tests that import AiModule) gets the
 * grounded prompts. Call registerCoreAiContexts() explicitly from tests or
 * from composition layers when auto-import is not desired.
 */

import { registerVendorAnalyticsContext } from './vendor-analytics.builder';
import { registerVendorCatalogContext } from './vendor-catalog.builder';
import { registerAdminAnalyticsContext } from './admin-analytics.builder';
import { registerFinanceContext } from './finance-wallet.builder';
import { registerHrContext } from './hr.builder';
import { registerUbrContext } from './ubr.builder';
import { registerFinanceTools } from '../../tools/finance-tools';

let registered = false;

export function registerCoreAiContexts(): void {
  if (registered) return;
  registerVendorAnalyticsContext();
  registerVendorCatalogContext();
  registerAdminAnalyticsContext();
  registerFinanceContext();
  registerHrContext();
  registerUbrContext();
  registerFinanceTools();
  registered = true;
}

export function resetCoreAiContextsForTests(): void {
  registered = false;
}

// Auto-register on import so plain `import '@afri-market/ai'` is not enough
// but `import '@afri-market/ai'` + `import '@afri-market/ai/builders'` is,
// and AiModule's side-effect import guarantees registration in the API.
registerCoreAiContexts();

export { VENDOR_ANALYTICS_MODULE_ID, VENDOR_ANALYTICS_ALIASES } from './vendor-analytics.builder';
export { VENDOR_CATALOG_MODULE_ID, VENDOR_CATALOG_ALIASES } from './vendor-catalog.builder';
export { ADMIN_ANALYTICS_MODULE_ID, ADMIN_ANALYTICS_ALIASES } from './admin-analytics.builder';
export { FINANCE_MODULE_ID, FINANCE_ALIASES } from './finance-wallet.builder';
export { HR_MODULE_ID, HR_ALIASES } from './hr.builder';
export { UBR_MODULE_ID, UBR_ALIASES } from './ubr.builder';
export { vendorAnalyticsContextBuilder } from './vendor-analytics.builder';
export { vendorCatalogContextBuilder } from './vendor-catalog.builder';
export { adminAnalyticsContextBuilder } from './admin-analytics.builder';
export { financeContextBuilder } from './finance-wallet.builder';
export { hrContextBuilder } from './hr.builder';
export { ubrContextBuilder } from './ubr.builder';
