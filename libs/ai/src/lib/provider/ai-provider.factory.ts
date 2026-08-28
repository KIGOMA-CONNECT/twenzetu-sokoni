/**
 * Provider factory + registry. Concrete providers register themselves by id;
 * a shared factory resolves the provider selected in AiConfig. New providers
 * (e.g. openai, anthropic) simply register a constructor — no call site changes.
 */

import type { AiConfig } from '../ai-config';
import { GeminiProvider } from './gemini.provider';
import type {
  AiProvider,
  AiProviderConstructor,
} from './ai-provider.interface';

/** Providers available out of the box (keyed by AiProviderId). */
const REGISTRY: Record<string, AiProviderConstructor> = {
  gemini: GeminiProvider,
};

export function registerAiProvider(
  id: string,
  ctor: AiProviderConstructor,
): void {
  REGISTRY[id.toLowerCase()] = ctor;
}

/**
 * Build the provider selected by `config.provider`. Returns `null` when the
 * provider id is unknown or the chosen provider is not configured, so callers
 * can degrade gracefully.
 */
export function createAiProvider(config: AiConfig): AiProvider | null {
  const id = (config.provider || '').toLowerCase();
  const ctor = REGISTRY[id];
  if (!ctor) return null;
  return new ctor(config);
}

/** List of provider ids that can be resolved. */
export function availableAiProviders(): string[] {
  return Object.keys(REGISTRY);
}
