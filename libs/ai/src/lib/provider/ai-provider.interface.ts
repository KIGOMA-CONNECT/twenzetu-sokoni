/**
 * Provider-agnostic AI interface. Every concrete provider (Gemini, OpenAI,
 * Anthropic, ...) implements this contract so upper layers (context builders,
 * prompt templates, tool execution, the UI) stay independent of the vendor.
 */

import type { AiConfig } from '../ai-config';

/** Chat roles normalized across providers. */
export type AiRole = 'system' | 'user' | 'assistant';

/** A single chat message in provider-neutral form. */
export interface AiMessage {
  role: AiRole;
  content: string;
}

/** Per-request override of the generation defaults. */
export interface AiGenerationOptions {
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  /** A JSON schema object the model should conform to (when supported). */
  responseSchema?: Record<string, unknown>;
  /** Stop sequences. */
  stop?: string[];
}

/** A completed, buffered generation result. */
export interface AiGenerateResult {
  text: string;
  finishReason?: string;
  /** Output token usage if the provider reports it. */
  usage?: AiUsage;
}

/** Token-level usage summary (provider dependent). */
export interface AiUsage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

/**
 * The contract every AI provider client implements. Streaming returns an
 * async iterable of incremental text deltas so the UI can show tokens as they
 * arrive; callers aggregate deltas when a full answer is required.
 */
export interface AiProvider {
  /** Stable provider id (matches AiProviderId). */
  readonly id: string;
  /**
   * True when this provider has an API key configured and can be called.
   * Providers that are not configured should never be selected for calls.
   */
  readonly isConfigured: boolean;
  /** The model that would be used when no explicit model is requested. */
  readonly defaultModel: string;

  /**
   * Perform a complete (non-streaming) generation.
   * `system` is the metaprompt / system instructions; `messages` are the
   * conversational turns that follow it.
   */
  generate(
    system: string,
    messages: AiMessage[],
    options?: AiGenerationOptions,
  ): Promise<AiGenerateResult>;

  /**
   * Stream a generation. Yields text deltas as they arrive. Throws if the
   * provider is not configured or the request fails.
   */
  stream(
    system: string,
    messages: AiMessage[],
    options?: AiGenerationOptions,
  ): AsyncIterable<string>;
}

/** Static constructor signature used by the provider factory. */
export interface AiProviderConstructor {
  new (config: AiConfig): AiProvider;
}
