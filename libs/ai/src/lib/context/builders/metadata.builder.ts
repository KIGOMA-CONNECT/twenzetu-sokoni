/**
 * Metadata Engine — builder for field/form metadata and entity permissions.
 *
 * Grounds the model in tenant-specific metadata so the AI can explain,
 * draft, and review metadata as a platform configurator.
 */

import { registerAiContext } from '../ai-context-registry';
import type { AiContextBuilder, AiFeature, AiPromptBundle } from '../ai-context.types';
import { composeModuleSystemPrompt } from '../../prompts/prompt-templates';

export const METADATA_MODULE_ID = 'metadata';
export const METADATA_ALIASES = ['metadata-engine', 'field-metadata', 'form-metadata'] as const;

const METADATA_CONSTRAINTS = [
  'Never invent field names, types, or validation rules not in facts/rows.',
  'When rows contain fieldMetadata/formMetadata/entityPermissions, compute counts from those rows.',
  'Call out insufficient data when metadata is empty.',
];

function metadataIntent(feature: AiFeature): string {
  switch (feature) {
    case 'draft':
      return 'Draft a new field/form metadata entry with required fields, grounded in supplied entity facts.';
    case 'review':
      return 'Review metadata against ABMS standards (field naming, validation, permissions). Report pass/fail and fixes.';
    case 'analyze':
      return 'Analyze metadata coverage: missing fields, orphan forms, permission gaps. Surface concrete counts.';
    default:
      return 'Help the user configure metadata. Answer concisely, grounded in supplied metadata facts, offer next steps.';
  }
}

export const metadataContextBuilder: AiContextBuilder = (request): AiPromptBundle => {
  const raw = (request.feature ?? 'assistant') as AiFeature;
  const feature: AiFeature = ['assistant', 'summarize', 'analyze', 'draft', 'recommend', 'review', 'extract'].includes(raw) ? raw : 'assistant';
  const facts = request.context?.facts ?? {};
  const rows = request.context?.rows ?? [];
  const constraints = [...METADATA_CONSTRAINTS, ...(request.context?.constraints ?? [])];
  const base = composeModuleSystemPrompt({ moduleLabel: 'Metadata Engine', feature, facts, rows, constraints });
  const extra = [metadataIntent(feature), 'Facts: may hold { totalFields, totalForms, totalPermissions }. Rows may hold fieldMetadata/formMetadata/entityPermissions with kind field.'].join('\n\n');
  return { system: `${base}\n\n${extra}`, userMessage: request.message };
};

export function registerMetadataContext(): void {
  registerAiContext(METADATA_MODULE_ID, metadataContextBuilder);
  for (const a of METADATA_ALIASES) registerAiContext(a, metadataContextBuilder);
}
