/**
 * Delivery / Logistics — builder for driver and delivery SLA.
 *
 * Grounds the model in delivery metrics so the AI can act as a logistics
 * analyst: on-time rates, driver performance, route estimates, failures.
 */

import { registerAiContext } from '../ai-context-registry';
import type { AiContextBuilder, AiFeature, AiPromptBundle } from '../ai-context.types';
import { composeModuleSystemPrompt } from '../../prompts/prompt-templates';

export const DELIVERY_MODULE_ID = 'delivery';
export const DELIVERY_ALIASES = ['driver', 'logistics', 'delivery-sla', 'drivers'] as const;

const DELIVERY_CONSTRAINTS = [
  'Never invent delivery counts, on-time rates, driver names, or ETAs not in facts/rows.',
  'When SLA rows are present, compute rates from those rows.',
  'Call out insufficient data when no deliveries in period.',
  'Do not expose driver PII beyond what is in rows; summarize.',
];

function deliveryIntent(feature: AiFeature): string {
  switch (feature) {
    case 'analyze':
      return 'Analyze delivery SLA: on-time vs late, driver variance, distance vs ETA, failure reasons. Surface worst drivers/routes with concrete numbers.';
    case 'recommend':
      return 'Recommend 3-5 logistics actions (which drivers to coach, where to adjust ETAs, how to reduce failures) grounded in SLA facts.';
    case 'summarize':
      return 'Summarize delivery performance in bullets and small tables. Lead with totals, then SLA, then driver highlights.';
    case 'review':
      return 'Review delivery SLA against 80% on-time threshold. Report pass/fail and exact fixes.';
    default:
      return 'Help ops understand delivery performance. Answer concisely, grounded in SLA facts, offer next steps.';
  }
}

export const deliveryContextBuilder: AiContextBuilder = (request): AiPromptBundle => {
  const raw = (request.feature ?? 'assistant') as AiFeature;
  const feature: AiFeature = ['assistant', 'summarize', 'analyze', 'draft', 'recommend', 'review', 'extract'].includes(raw) ? raw : 'assistant';
  const facts = request.context?.facts ?? {};
  const rows = request.context?.rows ?? [];
  const constraints = [...DELIVERY_CONSTRAINTS, ...(request.context?.constraints ?? [])];
  const base = composeModuleSystemPrompt({ moduleLabel: 'Delivery & Logistics', feature, facts, rows, constraints });
  const extra = [deliveryIntent(feature), 'Facts: sla may hold { total, completed, onTime, onTimeRate, lateRate, averageDistanceKm }. Rows may hold driverSla/delivery rows with kind field.'].join('\n\n');
  return { system: `${base}\n\n${extra}`, userMessage: request.message };
};

export function registerDeliveryContext(): void {
  registerAiContext(DELIVERY_MODULE_ID, deliveryContextBuilder);
  for (const a of DELIVERY_ALIASES) registerAiContext(a, deliveryContextBuilder);
}
