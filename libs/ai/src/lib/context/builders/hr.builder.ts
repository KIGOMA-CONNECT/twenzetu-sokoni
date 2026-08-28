/**
 * HR — enterprise human resources suite builder.
 *
 * The HR suite is 13 modules (org, positions, employees, leave, payroll,
 * recruitment, performance, compensation, learning, succession, offboarding,
 * compliance, workflows). The builder grounds the model in the current org
 * snapshot so the AI can answer as an HR analyst, not a generic chatbot.
 */

import { registerAiContext } from '../ai-context-registry';
import type { AiContextBuilder, AiFeature, AiPromptBundle } from '../ai-context.types';
import { composeModuleSystemPrompt } from '../../prompts/prompt-templates';

export const HR_MODULE_ID = 'hr';
export const HR_ALIASES = ['human-resources', 'org', 'hr-suite', 'employees', 'payroll'] as const;

const HR_CONSTRAINTS = [
  'Never invent employee names, IDs, salaries, or org structure not in facts/rows.',
  'When rows contain employees/positions/orgUnits, compute counts/sums from those rows.',
  'Call out insufficient data when HR snapshot is empty or a module has no records.',
  'Do not provide disallowed HR advice (e.g., discriminatory hiring, unlawful termination); keep to general best practice and cite supplied facts.',
];

function hrIntent(feature: AiFeature): string {
  switch (feature) {
    case 'analyze':
      return 'Analyze HR data for patterns, risks, and gaps: headcount mix, leave utilisation, payroll distribution, pipeline health, compliance coverage. Surface anomalies with concrete numbers.';
    case 'recommend':
      return 'Recommend 3-5 prioritized HR actions (what to hire, train, review, or remediate) grounded strictly in supplied HR facts/rows. Each must cite the figure that justifies it.';
    case 'summarize':
      return 'Summarize HR suite state in scannable bullets and small tables. Lead with headcount, then org, then risks.';
    case 'review':
      return 'Review HR records against healthy thresholds (leave balance, payroll variance, compliance coverage). Report pass/fail and exact fixes.';
    default:
      return 'Help the user navigate the HR suite. Answer concisely, grounded in supplied org/employee facts, offer clear next steps.';
  }
}

export const hrContextBuilder: AiContextBuilder = (request): AiPromptBundle => {
  const raw = (request.feature ?? 'assistant') as AiFeature;
  const feature: AiFeature = ['assistant', 'summarize', 'analyze', 'draft', 'recommend', 'review', 'extract'].includes(raw) ? raw : 'assistant';
  const facts = request.context?.facts ?? {};
  const rows = request.context?.rows ?? [];
  const constraints = [...HR_CONSTRAINTS, ...(request.context?.constraints ?? [])];
  const base = composeModuleSystemPrompt({ moduleLabel: 'HR Suite', feature, facts, rows, constraints });
  const extra = [hrIntent(feature), 'Facts: org snapshot may hold { totalEmployees, activePositions, onLeave, payrollTotal, openRoles, complianceRate }. Rows may hold employees/positions/leaveRequests with kind field.'].join('\n\n');
  return { system: `${base}\n\n${extra}`, userMessage: request.message };
};

export function registerHrContext(): void {
  registerAiContext(HR_MODULE_ID, hrContextBuilder);
  for (const a of HR_ALIASES) registerAiContext(a, hrContextBuilder);
}
