/**
 * Consumer — buyer journey builder.
 *
 * Grounds the model in the consumer's cart, orders, and nearby
 * marketplace so the AI can act as a shopping assistant.
 */

import { registerAiContext } from '../ai-context-registry';
import type { AiContextBuilder, AiFeature, AiPromptBundle } from '../ai-context.types';
import { composeModuleSystemPrompt } from '../../prompts/prompt-templates';

export const CONSUMER_MODULE_ID = 'consumer';
export const CONSUMER_ALIASES = ['buyer', 'cart', 'checkout', 'orders-consumer'] as const;

const CONSUMER_CONSTRAINTS = [
  'Never invent products, prices, or order ids not in facts/rows.',
  'When rows contain cart/orders/products, compute totals from those rows.',
  'Call out insufficient data when cart is empty.',
];

function consumerIntent(feature: AiFeature): string {
  switch (feature) {
    case 'recommend':
      return 'Recommend 3-5 products or next steps (what to add, how to save) grounded strictly in cart/order rows.';
    case 'summarize':
      return 'Summarize cart/orders in bullets and small tables. Lead with totals, then items, then next steps.';
    case 'analyze':
      return 'Analyze cart/orders for patterns: duplicates, price spikes, missing items. Surface concrete numbers.';
    default:
      return 'Help the buyer complete their journey. Answer concisely, grounded in facts, offer next steps.';
  }
}

export const consumerContextBuilder: AiContextBuilder = (request): AiPromptBundle => {
  const raw = (request.feature ?? 'assistant') as AiFeature;
  const feature: AiFeature = ['assistant', 'summarize', 'analyze', 'draft', 'recommend', 'review', 'extract'].includes(raw) ? raw : 'assistant';
  const facts = request.context?.facts ?? {};
  const rows = request.context?.rows ?? [];
  const constraints = [...CONSUMER_CONSTRAINTS, ...(request.context?.constraints ?? [])];
  const base = composeModuleSystemPrompt({ moduleLabel: 'Consumer Shopping', feature, facts, rows, constraints });
  const extra = [consumerIntent(feature), 'Facts: may hold { cartTotal, itemCount, orderCount }. Rows may hold cartItems/orders/products with kind field.'].join('\n\n');
  return { system: `${base}\n\n${extra}`, userMessage: request.message };
};

export function registerConsumerContext(): void {
  registerAiContext(CONSUMER_MODULE_ID, consumerContextBuilder);
  for (const a of CONSUMER_ALIASES) registerAiContext(a, consumerContextBuilder);
}
