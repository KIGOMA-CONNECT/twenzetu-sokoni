/**
 * Platform / Admin Analytics — second high-leverage admin builder.
 *
 * Grounds the model in the same data AdminAnalytics fetches: overview,
 * top products, inventory, delivery SLA, driver SLA, disputes, catalog.
 * Tailors prompts per feature so platform ops get real insight, not generic
 * chatbot filler.
 */

import { registerAiContext } from '../ai-context-registry';
import type { AiContextBuilder, AiFeature, AiPromptBundle } from '../ai-context.types';
import { composeModuleSystemPrompt } from '../../prompts/prompt-templates';

export const ADMIN_ANALYTICS_MODULE_ID = 'admin-analytics';
export const ADMIN_ANALYTICS_ALIASES = ['admin', 'platform-analytics', 'operations'] as const;

const ADMIN_CONSTRAINTS = [
  'Never invent revenue, order counts, product names, SKUs, stock figures, customer or driver counts not in facts/rows.',
  'When daily/funnel/SLA rows are present, compute totals/rates from those rows.',
  'Call out insufficient data explicitly when period has no orders or inventory empty.',
  'Keep currency in TZS, percentages one decimal, preserve shopName when given.',
  'Do not leak tenant-internal driver phone numbers beyond what is already in rows; summarize rather than enumerate PII.',
];

function adminIntent(feature: AiFeature): string {
  switch (feature) {
    case 'analyze':
      return 'Deeply analyze platform health: revenue/commission trends, funnel drop-off, inventory risk, delivery SLA, driver performance, disputes. Surface anomalies, strongest/weakest products, worst SLA drivers with concrete numbers. Explain causes where data hints.';
    case 'recommend':
      return 'Produce 3-7 prioritized platform actions (which products to promote, where to restock, which drivers to coach, how to reduce disputes) grounded strictly in overview/products/inventory/SLA/disputes. Each must cite the figure that justifies it.';
    case 'summarize':
      return 'Summarize platform performance for the selected period in scannable bullets and small tables. Lead with totals, then highlights, then risks.';
    case 'review':
      return 'Review platform metrics against healthy thresholds (cancellation <5%, onTimeRate >=80%, disputes low, out-of-stock ~0). Report pass/fail per area and concrete fixes.';
    default:
      return 'Help platform ops understand their analytics. Answer concisely, grounded in provided facts/rows, offer clear next steps.';
  }
}

export const adminAnalyticsContextBuilder: AiContextBuilder = (request): AiPromptBundle => {
  const raw = (request.feature ?? 'assistant') as AiFeature;
  const feature: AiFeature = ['assistant', 'summarize', 'analyze', 'draft', 'recommend', 'review', 'extract'].includes(raw) ? raw : 'assistant';
  const facts = request.context?.facts ?? {};
  const rows = request.context?.rows ?? [];
  const constraints = [...ADMIN_CONSTRAINTS, ...(request.context?.constraints ?? [])];
  const base = composeModuleSystemPrompt({ moduleLabel: 'Platform Admin Analytics', feature, facts, rows, constraints });
  const extra = [adminIntent(feature), 'Facts: overview.summary holds revenue/commission/orders/cancellation; customers/deliveries; inventory has threshold/inventoryValue/lowStockCount; disputes has total/open/resolved/byReason/bySeverity; sla has onTimeRate/lateRate/average distances. Rows may hold funnel/daily/topProduct/inventory/driverSla rows with kind field.'].join('\n\n');
  return { system: `${base}\n\n${extra}`, userMessage: request.message };
};

export function registerAdminAnalyticsContext(): void {
  registerAiContext(ADMIN_ANALYTICS_MODULE_ID, adminAnalyticsContextBuilder);
  for (const a of ADMIN_ANALYTICS_ALIASES) registerAiContext(a, adminAnalyticsContextBuilder);
}
