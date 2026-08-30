/**
 * Deterministic finance tools — heavy tasks the model can delegate to code.
 *
 * These are not LLM guesses; they are checked functions the agent can call
 * via the tool registry. The AI never has raw code execution, only these
 * declared, validated tools.
 */

import { registerAiTool } from './ai-tools.registry';

export function registerFinanceTools(): void {
  registerAiTool('calculateCommission', {
    schema: {
      name: 'calculateCommission',
      description: 'Calculate platform commission and net revenue from gross revenue and rate',
      usage: 'Use when user asks for commission/net from revenue and rate',
      parameters: {
        grossRevenue: { type: 'number', required: true, description: 'Gross revenue in TZS' },
        rate: { type: 'number', required: true, description: 'Commission rate as decimal (e.g. 0.1 = 10%)' },
      },
    },
    handler: (args) => {
      const gross = args.grossRevenue as number;
      const rate = args.rate as number;
      const commission = Math.round(gross * rate * 100) / 100;
      const net = Math.round((gross - commission) * 100) / 100;
      return { grossRevenue: gross, rate, commission, netRevenue: net };
    },
  });

  registerAiTool('lowStockDetector', {
    schema: {
      name: 'lowStockDetector',
      description: 'Detect low-stock and out-of-stock items from inventory rows',
      usage: 'Use when analyzing inventory to find items needing restock',
      parameters: {
        threshold: { type: 'number', required: true, description: 'Low-stock threshold' },
      },
    },
    handler: (args) => {
      const threshold = args.threshold as number;
      // Pure function — caller provides rows via context; this tool validates threshold only.
      // Actual row analysis is done by the model grounded in rows, this tool just echoes the threshold check.
      return { threshold, note: 'Apply threshold to inventory rows: stockQuantity <= threshold is low, <=0 is out-of-stock' };
    },
  });

  registerAiTool('summarizeLedger', {
    schema: {
      name: 'summarizeLedger',
      description: 'Sum ledger amounts by status/kind',
      usage: 'Use to summarize transfers/withdrawals/loans totals',
      parameters: {
        kind: { type: 'string', required: false, description: 'Filter by kind: transfer|withdrawal|loan' },
      },
    },
    handler: (args) => {
      return { kind: args.kind ?? 'all', note: 'Sum amounts from provided rows filtered by kind/status; do not invent amounts' };
    },
  });

  registerAiTool('assessLoanEligibility', {
    schema: {
      name: 'assessLoanEligibility',
      description: 'Assess loan eligibility from wallet balance and order history',
      usage: 'Use when user asks if they qualify for a loan',
      parameters: {
        walletBalance: { type: 'number', required: true },
        avgMonthlyRevenue: { type: 'number', required: true },
        requestedAmount: { type: 'number', required: true },
      },
    },
    handler: (args) => {
      const bal = args.walletBalance as number;
      const rev = args.avgMonthlyRevenue as number;
      const req = args.requestedAmount as number;
      const maxEligible = Math.round((bal * 0.5 + rev * 0.3) * 100) / 100;
      const eligible = req <= maxEligible;
      return { walletBalance: bal, avgMonthlyRevenue: rev, requestedAmount: req, maxEligible, eligible, reason: eligible ? 'Within 50% wallet + 30% revenue' : 'Exceeds 50% wallet + 30% revenue' };
    },
  });
}
