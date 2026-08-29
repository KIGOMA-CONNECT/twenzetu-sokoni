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
import { registerDeliveryContext } from './delivery.builder';
import { registerMarketplaceContext } from './marketplace.builder';
import { registerConsumerContext } from './consumer.builder';
import { registerPosContext } from './pos.builder';
import { registerPurchaseOrdersContext } from './purchase-orders.builder';
import { registerSuppliersContext } from './suppliers.builder';
import { registerFinanceTools } from '../../tools/finance-tools';
import { registerMarketingTools } from '../../tools/marketing-tools';
import { registerHrTools } from '../../tools/hr-tools';
import { registerLaundryTools } from '../../tools/laundry-tools';
import { registerDeliveryTools } from '../../tools/delivery-tools';
import { registerMarketplaceTools } from '../../tools/marketplace-tools';

let registered = false;

export function registerCoreAiContexts(): void {
  if (registered) return;
  registerVendorAnalyticsContext();
  registerVendorCatalogContext();
  registerAdminAnalyticsContext();
  registerFinanceContext();
  registerHrContext();
  registerDeliveryContext();
  registerMarketplaceContext();
  registerConsumerContext();
  registerPosContext();
  registerPurchaseOrdersContext();
  registerSuppliersContext();
  registerFinanceTools();
  registerMarketingTools();
  registerHrTools();
  registerLaundryTools();
  registerDeliveryTools();
  registerMarketplaceTools();
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
export { DELIVERY_MODULE_ID, DELIVERY_ALIASES } from './delivery.builder';
export { MARKETPLACE_MODULE_ID, MARKETPLACE_ALIASES } from './marketplace.builder';
export { CONSUMER_MODULE_ID, CONSUMER_ALIASES } from './consumer.builder';
export { POS_MODULE_ID, POS_ALIASES } from './pos.builder';
export { PURCHASE_ORDERS_MODULE_ID, PURCHASE_ORDERS_ALIASES } from './purchase-orders.builder';
export { SUPPLIERS_MODULE_ID, SUPPLIERS_ALIASES } from './suppliers.builder';
export { vendorAnalyticsContextBuilder } from './vendor-analytics.builder';
export { vendorCatalogContextBuilder } from './vendor-catalog.builder';
export { adminAnalyticsContextBuilder } from './admin-analytics.builder';
export { financeContextBuilder } from './finance-wallet.builder';
export { hrContextBuilder } from './hr.builder';
export { deliveryContextBuilder } from './delivery.builder';
export { marketplaceContextBuilder } from './marketplace.builder';
export { consumerContextBuilder } from './consumer.builder';
export { posContextBuilder } from './pos.builder';
export { purchaseOrdersContextBuilder } from './purchase-orders.builder';
export { suppliersContextBuilder } from './suppliers.builder';
