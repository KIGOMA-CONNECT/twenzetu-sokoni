/**
 * Registry of per-module context builders. Modules register a builder under
 * their module id at bootstrap; the AiService resolves it to assemble a
 * tailored prompt. The registry is additive — modules opt in — and always
 * falls back to a generic (but still safe) prompt when a module is unknown.
 */

import type {
  AiContextBuilder,
  AiContextRequest,
  AiPromptBundle,
} from './ai-context.types';

const builders = new Map<string, AiContextBuilder>();

/** Register (or replace) a context builder for a module id. */
export function registerAiContext(
  module: string,
  builder: AiContextBuilder,
): void {
  builders.set(module.toLowerCase(), builder);
}

/** True when a module has a dedicated context builder. */
export function hasAiContext(module: string): boolean {
  return builders.has(module.toLowerCase());
}

/** Resolve a builder for a module id, falling back to the generic builder. */
export function resolveAiContextBuilder(module: string): AiContextBuilder {
  return builders.get(module.toLowerCase()) ?? genericContextBuilder;
}

/** Remove a builder (used mainly by tests). */
export function unregisterAiContext(module: string): void {
  builders.delete(module.toLowerCase());
}

/**
 * Safe generic fallback so the AI is never unusable for an unregistered
 * module. It grounds the answer in the facts the module supplied and injects
 * minimal safety rails.
 */
export const genericContextBuilder: AiContextBuilder = (
  request: AiContextRequest,
): AiPromptBundle => {
  const facts = request.context?.facts ?? {};
  const rows = request.context?.rows ?? [];
  const constraints = request.context?.constraints ?? [];
  const systemParts = [
    `You are a helpful AI assistant for the "${request.module}" area of the afriMarket platform.`,
    'Answer clearly and concisely. Use the provided facts and data to ground your answer; if the data is insufficient, say so rather than guessing.',
    'Do not invent transaction ids, amounts, people, or system facts that are not present in the context.',
  ];
  if (constraints.length) {
    systemParts.push('Constraints:');
    systemParts.push(constraints.map((c) => `- ${c}`).join('\n'));
  }
  if (request.feature) {
    systemParts.push(`The user is requesting the "${request.feature}" capability.`);
  }
  if (Object.keys(facts).length) {
    systemParts.push('Facts:\n' + JSON.stringify(facts, null, 2));
  }
  if (rows.length) {
    systemParts.push(
      `Data (${rows.length} rows):\n` + JSON.stringify(rows.slice(0, 50), null, 2),
    );
  }
  return {
    system: systemParts.join('\n\n'),
    userMessage: request.message,
  };
};
