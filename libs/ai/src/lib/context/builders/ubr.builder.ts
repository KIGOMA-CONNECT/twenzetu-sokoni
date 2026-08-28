/**
 * UBR — Universal Business Registry / Business Graph builder.
 *
 * UBR is the enterprise business operating platform: registered entities
 * and their relationships. The builder makes the AI act as a business
 * architect that explains the graph, validates new entity types, and
 * recommends relationships, fully grounded in the ontology snapshot.
 */

import { registerAiContext } from '../ai-context-registry';
import type { AiContextBuilder, AiFeature, AiPromptBundle } from '../ai-context.types';
import { composeModuleSystemPrompt } from '../../prompts/prompt-templates';

export const UBR_MODULE_ID = 'ubr';
export const UBR_ALIASES = ['ontology', 'business-graph', 'registry', 'entity-registry'] as const;

const UBR_CONSTRAINTS = [
  'Never invent entity types, relationships, or cardinalities not in facts/rows.',
  'When rows contain registeredEntities/entityRelationships, compute counts and graph metrics from those rows.',
  'Call out insufficient data when ontology is empty or a relationship is missing required fields.',
  'Keep to the ABMS constitution: everything is entity, everything is metadata, no hard-coded business logic.',
];

function ubrIntent(feature: AiFeature): string {
  switch (feature) {
    case 'analyze':
      return 'Analyze the business graph: entity type distribution, relationship coverage, orphan entities, cardinality mismatches. Surface concrete counts and graph gaps.';
    case 'recommend':
      return 'Recommend 3-5 concrete ontology improvements (which entity types to add, which relationships to create, what metadata to attach) grounded strictly in supplied graph. Each must cite the figure that justifies it.';
    case 'summarize':
      return 'Summarize the business graph in scannable bullets and small tables. Lead with entity counts, then relationships, then gaps.';
    case 'review':
      return 'Review proposed ontology changes against ABMS standards (entity-permission, field-metadata). Report pass/fail and exact fixes.';
    case 'draft':
      return 'Draft a new registered-entity or relationship definition with required fields, grounded in supplied facts.';
    default:
      return 'Help the user understand and evolve the business graph. Answer concisely, grounded in supplied ontology facts, offer clear next steps.';
  }
}

export const ubrContextBuilder: AiContextBuilder = (request): AiPromptBundle => {
  const raw = (request.feature ?? 'assistant') as AiFeature;
  const feature: AiFeature = ['assistant', 'summarize', 'analyze', 'draft', 'recommend', 'review', 'extract'].includes(raw) ? raw : 'assistant';
  const facts = request.context?.facts ?? {};
  const rows = request.context?.rows ?? [];
  const constraints = [...UBR_CONSTRAINTS, ...(request.context?.constraints ?? [])];
  const base = composeModuleSystemPrompt({ moduleLabel: 'Universal Business Registry', feature, facts, rows, constraints });
  const extra = [ubrIntent(feature), 'Facts: ontology snapshot may hold { totalEntities, byCategory, totalRelationships }. Rows may hold registeredEntities/entityRelationships/fieldMetadata with kind field.'].join('\n\n');
  return { system: `${base}\n\n${extra}`, userMessage: request.message };
};

export function registerUbrContext(): void {
  registerAiContext(UBR_MODULE_ID, ubrContextBuilder);
  for (const a of UBR_ALIASES) registerAiContext(a, ubrContextBuilder);
}
