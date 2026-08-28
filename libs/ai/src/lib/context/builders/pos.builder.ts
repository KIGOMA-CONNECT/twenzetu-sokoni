/**
 * POS — Point of Sale builder for vendor in-store sales.
 *
 * Grounds the model in the active POS shift, cart, and inventory
 * so the AI can assist as a POS operator.
 */

import { registerAiContext } from '../ai-context-registry';
import type { AiContextBuilder, AiFeature, AiPromptBundle } from '../ai-context.types';
import { composeModuleSystemPrompt } from '../../prompts/prompt-templates';

export const POS_MODULE_ID = 'pos';
export const POS_ALIASES = ['vendor-pos', 'point-of-sale', 'shift'] as const;

const POS_CONSTRAINTS = [
  'Never invent shift ids, cart totals, or stock not in facts/rows.',
  'When rows contain posShift/cart/inventory, compute totals from those rows.',
  'Call out insufficient data when no active shift.',
];

function posIntent(feature: AiFeature): string {
  switch (feature) {
    case 'recommend':
      return 'Recommend 3-5 POS actions (what to restock, how to close shift) grounded in shift/cart rows.';
    case 'summarize':
      return 'Summarize POS shift in bullets and small tables. Lead with totals, then items, then actions.';
    case 'analyze':
      return 'Analyze POS shift: sales vs stock, top items, discrepancies. Surface concrete numbers.';
    default:
      return 'Help the vendor operate POS. Answer concisely, grounded in facts, offer next steps.';
  }
}

export const posContextBuilder: AiContextBuilder = (request): AiPromptBundle => {
  const raw = (request.feature ?? 'assistant') as AiFeature;
  const feature: AiFeature = ['assistant', 'summarize', 'analyze', 'draft', 'recommend', 'review', 'extract'].includes(raw) ? raw : 'assistant';
  const facts = request.context?.facts ?? {};
  const rows = request.context?.rows ?? [];
  const constraints = [...POS_CONSTRAINTS, ...(request.context?.constraints ?? [])];
  const base = composeModuleSystemPrompt({ moduleLabel: 'POS', feature, facts, rows, constraints });
  const extra = [posIntent(feature), 'Facts: may hold { shiftId, status, cartTotal, itemCount }. Rows may hold cartItems/inventory with kind field.'].join('\n\n');
  return { system: `${base}\n\n${extra}`, userMessage: request.message };
};

export function registerPosContext(): void {
  registerAiContext(POS_MODULE_ID, posContextBuilder);
  for (const a of POS_ALIASES) registerAiContext(a, posContextBuilder);
}
