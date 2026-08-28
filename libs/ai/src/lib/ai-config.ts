/**
 * Configuration options for the AI layer. These are provider-agnostic so the
 * rest of the system never depends on a specific vendor. The provider that is
 * actually used is selected at bootstrap from the environment (AI_PROVIDER)
 * via the provider factory, mirroring how other integrations (SMS, payments,
 * maps) are configured.
 */
export interface AiConfig {
  /** Selected provider id, e.g. 'gemini' | 'openai' | 'anthropic'. */
  provider: string;
  /**
   * Collection of API keys keyed by provider id. An empty string disables
   * that provider, and the AiService degrades gracefully when none are set.
   */
  apiKeys: Record<string, string>;
  /** Default model to use per provider id. */
  models: Record<string, string>;
  /** Default generation temperature (0..1). */
  temperature?: number;
  /** Default maximum output tokens. */
  maxOutputTokens?: number;
  /** Request timeout in milliseconds. */
  timeoutMs?: number;
}

/** Providers that have a built-in client implementation. */
export type AiProviderId = 'gemini' | 'openai' | 'anthropic';
