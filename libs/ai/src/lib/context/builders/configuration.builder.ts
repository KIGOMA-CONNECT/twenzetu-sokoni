/**
 * Configuration — builder for system/tenant config and feature flags.
 *
 * Grounds the model in config state so the AI can explain, validate, and
 * recommend config changes as a platform operator.
 */

import { registerAiContext } from '../ai-context-registry';
import type { AiContextBuilder, AiFeature, AiPromptBundle } from '../ai-context.types';
import { composeModuleSystemPrompt } from '../../prompts/prompt-templates';

export const CONFIGURATION_MODULE_ID = 'configuration';
export const CONFIGURATION_ALIASES = ['config', 'feature-flags', 'tenant-config', 'system-config'] as const;

const CONFIG_CONSTRAINTS = [
  'Never invent config keys, values, or flag states not in facts/rows.',
  'When rows contain configSystem/configTenant/featureFlags, compute counts from those rows.',
  'Call out insufficient data when config is empty.',
  'Do not suggest leaking secrets or bypassing encryption.',
];

function configIntent(feature: AiFeature): string {
  switch (feature) {
    case 'analyze':
      return 'Analyze configuration: system vs tenant overrides, feature flag states, stale keys. Surface concrete counts.';
    case 'recommend':
      return 'Recommend 3-5 config actions (which flags to enable, which tenant overrides to clean) grounded in config rows.';
    case 'summarize':
      return 'Summarize config state in bullets and small tables. Lead with totals, then flags, then overrides.';
    case 'review':
      return 'Review config against healthy thresholds (flags have description, values typed correctly). Report pass/fail.';
    default:
      return 'Help the user understand configuration. Answer concisely, grounded in facts, offer next steps.';
  }
}

export const configurationContextBuilder: AiContextBuilder = (request): AiPromptBundle => {
  const raw = (request.feature ?? 'assistant') as AiFeature;
  const feature: AiFeature = ['assistant', 'summarize', 'analyze', 'draft', 'recommend', 'review', 'extract'].includes(raw) ? raw : 'assistant';
  const facts = request.context?.facts ?? {};
  const rows = request.context?.rows ?? [];
  const constraints = [...CONFIG_CONSTRAINTS, ...(request.context?.constraints ?? [])];
  const base = composeModuleSystemPrompt({ moduleLabel: 'Configuration', feature, facts, rows, constraints });
  const extra = [configIntent(feature), 'Facts: may hold { totalSystem, totalTenant, totalFlags, byState }. Rows may hold configSystem/configTenant/featureFlags with kind field.'].join('\n\n');
  return { system: `${base}\n\n${extra}`, userMessage: request.message };
};

export function registerConfigurationContext(): void {
  registerAiContext(CONFIGURATION_MODULE_ID, configurationContextBuilder);
  for (const a of CONFIGURATION_ALIASES) registerAiContext(a, configurationContextBuilder);
}
