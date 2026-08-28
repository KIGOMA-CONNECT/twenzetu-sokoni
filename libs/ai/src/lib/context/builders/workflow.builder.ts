/**
 * Workflow — builder for approval and business process workflows.
 *
 * Grounds the model in workflow definitions and instances so the AI can act
 * as a process analyst: explain flows, detect bottlenecks, recommend
 * optimizations.
 */

import { registerAiContext } from '../ai-context-registry';
import type { AiContextBuilder, AiFeature, AiPromptBundle } from '../ai-context.types';
import { composeModuleSystemPrompt } from '../../prompts/prompt-templates';

export const WORKFLOW_MODULE_ID = 'workflow';
export const WORKFLOW_ALIASES = ['workflows', 'approval', 'business-process'] as const;

const WORKFLOW_CONSTRAINTS = [
  'Never invent workflow names, steps, or instance states not in facts/rows.',
  'When rows contain workflows/workflowInstances, compute counts from those rows.',
  'Call out insufficient data when no workflows/instances in period.',
];

function workflowIntent(feature: AiFeature): string {
  switch (feature) {
    case 'analyze':
      return 'Analyze workflows: step counts, instance states, bottlenecks, avg duration. Surface concrete numbers.';
    case 'recommend':
      return 'Recommend 3-5 workflow improvements (which steps to add/remove, how to reduce bottlenecks) grounded in instance rows.';
    case 'summarize':
      return 'Summarize workflows in bullets and small tables. Lead with totals, then states, then bottlenecks.';
    case 'review':
      return 'Review workflow definitions against healthy thresholds (steps 2-8, no orphan instances). Report pass/fail.';
    default:
      return 'Help the user understand workflows. Answer concisely, grounded in facts, offer next steps.';
  }
}

export const workflowContextBuilder: AiContextBuilder = (request): AiPromptBundle => {
  const raw = (request.feature ?? 'assistant') as AiFeature;
  const feature: AiFeature = ['assistant', 'summarize', 'analyze', 'draft', 'recommend', 'review', 'extract'].includes(raw) ? raw : 'assistant';
  const facts = request.context?.facts ?? {};
  const rows = request.context?.rows ?? [];
  const constraints = [...WORKFLOW_CONSTRAINTS, ...(request.context?.constraints ?? [])];
  const base = composeModuleSystemPrompt({ moduleLabel: 'Workflow Engine', feature, facts, rows, constraints });
  const extra = [workflowIntent(feature), 'Facts: may hold { totalWorkflows, totalInstances, byStatus }. Rows may hold workflows/workflowInstances with kind field.'].join('\n\n');
  return { system: `${base}\n\n${extra}`, userMessage: request.message };
};

export function registerWorkflowContext(): void {
  registerAiContext(WORKFLOW_MODULE_ID, workflowContextBuilder);
  for (const a of WORKFLOW_ALIASES) registerAiContext(a, workflowContextBuilder);
}
