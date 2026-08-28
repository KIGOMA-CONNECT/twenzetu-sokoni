/**
 * Vendor Business Analytics — high-value per-module AI context builder.
 *
 * Grounds the model in the concrete data VendorAnalytics already fetches:
 * overview.summary, customers, deliveries, funnel, daily, top products and
 * inventory. The builder tailors the system prompt per feature so that
 * "analyze" does real pattern/anomaly work, "recommend" yields priorizated
 * actions, "summarize" is scannable, and "assistant" stays conversational
 * without hallucinating figures.
 */

import { registerAiContext } from '../ai-context-registry';
import type { AiContextBuilder, AiFeature, AiPromptBundle } from '../ai-context.types';
import { composeModuleSystemPrompt } from '../../prompts/prompt-templates';

export const VENDOR_ANALYTICS_MODULE_ID = 'vendor-analytics';
export const VENDOR_ANALYTICS_ALIASES = ['vendor', 'analytics', 'vendor-insights'] as const;

const VENDOR_ANALYTICS_CONSTRAINTS = [
  'Never invent revenue, order counts, product names, SKUs, stock figures, or customer counts that are not present in the provided facts/rows.',
  'When daily or funnel rows are present, compute totals and rates from those rows — do not estimate.',
  'Call out "insufficient data" explicitly when the supplied period has no orders or the inventory list is empty.',
  'Keep currency in TZS and percentages with one decimal. Preserve the exact shopName when given.',
];

function featureIntent(feature: AiFeature): string {
  switch (feature) {
    case 'analyze':
      return 'Deeply analyze sales trends, funnel health, customer mix and inventory risk. Surface anomalies, strongest/weakest products and stock risks with concrete numbers. Explain causes where data hints at them.';
    case 'recommend':
      return 'Produce 3-7 prioritized, actionable recommendations (what to restock, promote, discount or fix) grounded strictly in the supplied overview, products and inventory. Each recommendation must cite the figure that justifies it.';
    case 'summarize':
      return 'Summarize vendor performance for the selected period in scannable bullets and small tables. Lead with totals, then highlights, then risks.';
    case 'review':
      return 'Review the vendor metrics against healthy thresholds (cancellation <5%, out-of-stock ~0, low-stock minimal). Report pass/fail per area and concrete fixes.';
    default:
      return 'Help the vendor understand their business analytics. Answer concisely, grounded in the provided facts and data. Offer clear next steps.';
  }
}

export const vendorAnalyticsContextBuilder: AiContextBuilder = (request): AiPromptBundle => {
  const rawFeature = (request.feature ?? 'assistant') as AiFeature;
  const feature: AiFeature = [
    'assistant',
    'summarize',
    'analyze',
    'draft',
    'recommend',
    'review',
    'extract',
  ].includes(rawFeature)
    ? rawFeature
    : 'assistant';
  const facts = request.context?.facts ?? {};
  const rows = request.context?.rows ?? [];
  const constraints = [
    ...VENDOR_ANALYTICS_CONSTRAINTS,
    ...(request.context?.constraints ?? []),
  ];

  const baseSystem = composeModuleSystemPrompt({
    moduleLabel: 'Vendor Business Analytics',
    feature,
    facts,
    rows,
    constraints,
  });

  const extra = [
    featureIntent(feature),
    'Context meaning: facts.overview.summary holds revenue/commission/net/order/cancellation metrics; facts.customers holds new/returning; facts.deliveries holds fulfillment; rows may hold daily[] (date/revenue/commission), funnel[] (status/count/value), topProducts[] (productName/quantity/revenue/share), inventoryItems[] (name/sku/stockQuantity/price/stockValue/status).',
    'If rows contain inventoryItems, highlight low-stock (≤ threshold) and out-of-stock items explicitly and suggest restock quantities.',
    'For funnel data, compute conversion from total to delivered and flag high cancel/refund shares.',
  ].join('\n\n');

  return {
    system: `${baseSystem}\n\n${extra}`,
    userMessage: request.message,
  };
};

export function registerVendorAnalyticsContext(): void {
  registerAiContext(VENDOR_ANALYTICS_MODULE_ID, vendorAnalyticsContextBuilder);
  for (const alias of VENDOR_ANALYTICS_ALIASES) {
    registerAiContext(alias, vendorAnalyticsContextBuilder);
  }
}
