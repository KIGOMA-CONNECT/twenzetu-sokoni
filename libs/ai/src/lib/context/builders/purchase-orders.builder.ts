/**
 * Vendor Purchase Orders — builder for supplier procurement.
 */

import { registerAiContext } from '../ai-context-registry';
import type { AiContextBuilder, AiFeature, AiPromptBundle } from '../ai-context.types';
import { composeModuleSystemPrompt } from '../../prompts/prompt-templates';

export const PURCHASE_ORDERS_MODULE_ID = 'purchase-orders';
export const PURCHASE_ORDERS_ALIASES = ['vendor-purchase-orders', 'procurement', 'purchase'] as const;

const CONSTRAINTS = [
  'Never invent PO ids, amounts, supplier names, or stock not in facts/rows.',
  'When rows contain purchaseOrders/suppliers, compute totals from those rows.',
  'Call out insufficient data when no POs.',
];

function intent(feature: AiFeature): string {
  switch (feature) {
    case 'analyze': return 'Analyze purchase orders: status mix, spend, supplier variance, late receipts. Surface concrete numbers.';
    case 'recommend': return 'Recommend 3-5 procurement actions (which POs to confirm, which suppliers to prefer) grounded in PO rows.';
    case 'summarize': return 'Summarize POs in bullets and small tables. Lead with totals, then status, then suppliers.';
    default: return 'Help the vendor manage purchase orders. Answer concisely, grounded in facts, offer next steps.';
  }
}

export const purchaseOrdersContextBuilder: AiContextBuilder = (request): AiPromptBundle => {
  const raw = (request.feature ?? 'assistant') as AiFeature;
  const feature: AiFeature = ['assistant', 'summarize', 'analyze', 'draft', 'recommend', 'review', 'extract'].includes(raw) ? raw : 'assistant';
  const facts = request.context?.facts ?? {};
  const rows = request.context?.rows ?? [];
  const constraints = [...CONSTRAINTS, ...(request.context?.constraints ?? [])];
  const base = composeModuleSystemPrompt({ moduleLabel: 'Purchase Orders', feature, facts, rows, constraints });
  const extra = [intent(feature), 'Facts: may hold { totalOrders, totalSpend, byStatus }. Rows may hold purchaseOrders with kind field.'].join('\n\n');
  return { system: `${base}\n\n${extra}`, userMessage: request.message };
};

export function registerPurchaseOrdersContext(): void {
  registerAiContext(PURCHASE_ORDERS_MODULE_ID, purchaseOrdersContextBuilder);
  for (const a of PURCHASE_ORDERS_ALIASES) registerAiContext(a, purchaseOrdersContextBuilder);
}
