/**
 * Suppliers — builder for vendor supplier directory.
 */

import { registerAiContext } from '../ai-context-registry';
import type { AiContextBuilder, AiFeature, AiPromptBundle } from '../ai-context.types';
import { composeModuleSystemPrompt } from '../../prompts/prompt-templates';

export const SUPPLIERS_MODULE_ID = 'suppliers';
export const SUPPLIERS_ALIASES = ['vendor-suppliers', 'supplier-directory'] as const;

const CONSTRAINTS = [
  'Never invent supplier names, contacts, or performance not in facts/rows.',
  'When rows contain suppliers, compute counts from those rows.',
  'Call out insufficient data when no suppliers.',
];

function intent(feature: AiFeature): string {
  switch (feature) {
    case 'analyze': return 'Analyze suppliers: count, performance, spend, reliability. Surface concrete numbers.';
    case 'recommend': return 'Recommend 3-5 supplier actions (which to prefer, which to review) grounded in supplier rows.';
    case 'summarize': return 'Summarize suppliers in bullets and small tables. Lead with totals, then top, then risks.';
    default: return 'Help the vendor manage suppliers. Answer concisely, grounded in facts, offer next steps.';
  }
}

export const suppliersContextBuilder: AiContextBuilder = (request): AiPromptBundle => {
  const raw = (request.feature ?? 'assistant') as AiFeature;
  const feature: AiFeature = ['assistant', 'summarize', 'analyze', 'draft', 'recommend', 'review', 'extract'].includes(raw) ? raw : 'assistant';
  const facts = request.context?.facts ?? {};
  const rows = request.context?.rows ?? [];
  const constraints = [...CONSTRAINTS, ...(request.context?.constraints ?? [])];
  const base = composeModuleSystemPrompt({ moduleLabel: 'Suppliers', feature, facts, rows, constraints });
  const extra = [intent(feature), 'Facts: may hold { totalSuppliers, activeCount }. Rows may hold suppliers with kind field.'].join('\n\n');
  return { system: `${base}\n\n${extra}`, userMessage: request.message };
};

export function registerSuppliersContext(): void {
  registerAiContext(SUPPLIERS_MODULE_ID, suppliersContextBuilder);
  for (const a of SUPPLIERS_ALIASES) registerAiContext(a, suppliersContextBuilder);
}
