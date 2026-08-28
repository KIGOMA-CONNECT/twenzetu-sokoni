/**
 * Marketplace / Orders — builder for buyer and vendor order flows.
 *
 * Grounds the model in order, cart, and product data so the AI can act as a
 * marketplace analyst: order status, revenue, product performance, cart health.
 */

import { registerAiContext } from '../ai-context-registry';
import type { AiContextBuilder, AiFeature, AiPromptBundle } from '../ai-context.types';
import { composeModuleSystemPrompt } from '../../prompts/prompt-templates';

export const MARKETPLACE_MODULE_ID = 'marketplace';
export const MARKETPLACE_ALIASES = ['orders', 'cart', 'products-marketplace', 'vendor-orders'] as const;

const MARKETPLACE_CONSTRAINTS = [
  'Never invent order ids, amounts, product names, or stock not in facts/rows.',
  'When rows contain orders/products, compute totals from those rows.',
  'Call out insufficient data when no orders/products in period.',
  'Keep currency in TZS, percentages one decimal.',
];

function marketplaceIntent(feature: AiFeature): string {
  switch (feature) {
    case 'analyze':
      return 'Analyze marketplace orders: funnel, revenue, top products, cart abandonment. Surface anomalies with concrete numbers.';
    case 'recommend':
      return 'Recommend 3-5 marketplace actions (which products to promote, how to reduce cancellations, when to restock) grounded in order/product rows.';
    case 'summarize':
      return 'Summarize marketplace performance in bullets and small tables. Lead with totals, then highlights, then risks.';
    case 'review':
      return 'Review order records against healthy thresholds (cancellation <5%, stock >0). Report pass/fail and fixes.';
    default:
      return 'Help the user understand marketplace orders. Answer concisely, grounded in facts, offer next steps.';
  }
}

export const marketplaceContextBuilder: AiContextBuilder = (request): AiPromptBundle => {
  const raw = (request.feature ?? 'assistant') as AiFeature;
  const feature: AiFeature = ['assistant', 'summarize', 'analyze', 'draft', 'recommend', 'review', 'extract'].includes(raw) ? raw : 'assistant';
  const facts = request.context?.facts ?? {};
  const rows = request.context?.rows ?? [];
  const constraints = [...MARKETPLACE_CONSTRAINTS, ...(request.context?.constraints ?? [])];
  const base = composeModuleSystemPrompt({ moduleLabel: 'Marketplace Orders', feature, facts, rows, constraints });
  const extra = [marketplaceIntent(feature), 'Facts: overview may hold orderCount/revenue/cancellationRate. Rows may hold orders/products/cart rows with kind field.'].join('\n\n');
  return { system: `${base}\n\n${extra}`, userMessage: request.message };
};

export function registerMarketplaceContext(): void {
  registerAiContext(MARKETPLACE_MODULE_ID, marketplaceContextBuilder);
  for (const a of MARKETPLACE_ALIASES) registerAiContext(a, marketplaceContextBuilder);
}
