/**
 * Finance / Wallet — heavy-task builder for money movement.
 *
 * Wallets, transfers, withdrawals, loans live here. The builder makes the
 * model act as a precise finance assistant: never invent amounts, always
 * cite the supplied ledger, explain fees/balances, and refuse to facilitate
 * fraud or bypass. It also powers heavy tasks like reconciliation via tools.
 */

import { registerAiContext } from '../ai-context-registry';
import type { AiContextBuilder, AiFeature, AiPromptBundle } from '../ai-context.types';
import { composeModuleSystemPrompt } from '../../prompts/prompt-templates';

export const FINANCE_MODULE_ID = 'finance';
export const FINANCE_ALIASES = ['wallet', 'wallets', 'fintech', 'finance-wallet'] as const;

const FINANCE_CONSTRAINTS = [
  'Never invent balances, amounts, fees, transaction ids, or loan decisions not in facts/rows.',
  'When ledger rows are present, compute sums from those rows; do not estimate.',
  'Call out insufficient data when wallet/ledger is empty or a transfer is missing required fields.',
  'Refuse to help with fraud, bypassing verification, or moving money the user is not entitled to.',
  'Keep currency in TZS, percentages one decimal, preserve precision for money.',
];

function financeIntent(feature: AiFeature): string {
  switch (feature) {
    case 'analyze':
      return 'Analyze wallet/ledger/finance data for patterns, anomalies, and risk. Point out unusual transfers, fee spikes, or balance drift with concrete numbers. Explain causes where data hints.';
    case 'recommend':
      return 'Recommend 3-5 concrete finance actions (what to reconcile, which transfers to review, when to top up) grounded strictly in ledger facts. Each must cite the amount/balance that justifies it.';
    case 'summarize':
      return 'Summarize wallet/finance state in scannable bullets and small tables. Lead with balances, then recent movements, then risks.';
    case 'review':
      return 'Review supplied finance records against healthy thresholds (fees <5%, no duplicate transfers, balances non-negative). Report pass/fail and exact fixes.';
    case 'extract':
      return 'Extract structured fields from free-text finance input: amount, currency, recipient, reference, fees.';
    default:
      return 'Help the user understand their wallet/finance. Answer concisely, grounded in supplied facts/rows, offer clear next steps.';
  }
}

export const financeContextBuilder: AiContextBuilder = (request): AiPromptBundle => {
  const raw = (request.feature ?? 'assistant') as AiFeature;
  const feature: AiFeature = ['assistant', 'summarize', 'analyze', 'draft', 'recommend', 'review', 'extract'].includes(raw) ? raw : 'assistant';
  const facts = request.context?.facts ?? {};
  const rows = request.context?.rows ?? [];
  const constraints = [...FINANCE_CONSTRAINTS, ...(request.context?.constraints ?? [])];
  const base = composeModuleSystemPrompt({ moduleLabel: 'Finance & Wallet', feature, facts, rows, constraints });
  const extra = [financeIntent(feature), 'Facts: wallet may hold { balance, currency, pending, lastTransfer }; ledger rows may hold { kind: "transfer"|"withdrawal"|"loan", amount, fee, status, createdAt }. Rows are the source of truth for sums.'].join('\n\n');
  return { system: `${base}\n\n${extra}`, userMessage: request.message };
};

export function registerFinanceContext(): void {
  registerAiContext(FINANCE_MODULE_ID, financeContextBuilder);
  for (const a of FINANCE_ALIASES) registerAiContext(a, financeContextBuilder);
}
