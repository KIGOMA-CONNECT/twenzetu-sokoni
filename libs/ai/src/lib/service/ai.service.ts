/**
 * AiService — the single facade every module feature uses for AI.
 *
 * Responsibilities:
 *  - Build an AiConfig from the environment at construction (provider, keys,
 *    models), mirroring how integrations read their config.
 *  - Resolve the configured provider through the factory.
 *  - Resolve the module-specific context builder for module-aware prompts.
 *  - Expose buffered (complete/chat) and streaming (stream) calls that degrade
 *    gracefully when no provider is configured.
 *
 * Upper layers depend only on this service; they never touch the provider or
 * the registry directly.
 */

import { Injectable, Logger, Optional } from '@nestjs/common';
import type { AiConfig } from '../ai-config';
import { resolveAiContextBuilder } from '../context/ai-context-registry';
import type {
  AiContextRequest,
  AiPromptBundle,
} from '../context/ai-context.types';
import { dataBoundary } from '../prompts/prompt-templates';
import { createAiProvider, availableAiProviders } from '../provider/ai-provider.factory';
import type {
  AiGenerateResult,
  AiGenerationOptions,
  AiMessage,
  AiProvider,
} from '../provider/ai-provider.interface';
import { AiLearningService } from '../learning/ai-learning.service';
import { AiMetricsService } from '../metrics/ai-metrics.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly config: AiConfig;
  private readonly provider: AiProvider | null;

  constructor(
    @Optional() private readonly learningService?: AiLearningService,
    @Optional() private readonly metricsService?: AiMetricsService,
  ) {
    const rawTemp = process.env.AI_TEMPERATURE ? Number(process.env.AI_TEMPERATURE) : undefined;
    const rawMax = process.env.AI_MAX_TOKENS ? Number(process.env.AI_MAX_TOKENS) : undefined;
    const rawTimeout = process.env.AI_TIMEOUT_MS ? Number(process.env.AI_TIMEOUT_MS) : undefined;
    this.config = {
      provider: process.env.AI_PROVIDER || 'gemini',
      apiKeys: {
        gemini: process.env.GEMINI_API_KEY || '',
        openai: process.env.OPENAI_API_KEY || '',
        anthropic: process.env.ANTHROPIC_API_KEY || '',
      },
      models: {
        gemini: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
        openai: process.env.OPENAI_MODEL || '',
        anthropic: process.env.ANTHROPIC_MODEL || '',
      },
      temperature: typeof rawTemp === 'number' && !isNaN(rawTemp) ? Math.min(1, Math.max(0, rawTemp)) : undefined,
      maxOutputTokens: typeof rawMax === 'number' && !isNaN(rawMax) ? Math.min(4096, Math.max(1, Math.floor(rawMax))) : undefined,
      timeoutMs: typeof rawTimeout === 'number' && !isNaN(rawTimeout) ? Math.min(30000, Math.max(1000, Math.floor(rawTimeout))) : undefined,
    };
    this.provider = createAiProvider(this.config);
    if (!this.provider) {
      this.logger.warn(
        `AI provider "${this.config.provider}" not available. Available: ${availableAiProviders().join(', ')}`,
      );
    }
  }

  /** True when a configured provider is ready to serve requests. */
  get isConfigured(): boolean {
    return !!this.provider?.isConfigured;
  }

  /** Provider id currently in use, or null. */
  get providerId(): string | null {
    return this.provider?.id ?? null;
  }

  /** List of provider ids resolvable by the factory. */
  get providers(): string[] {
    return availableAiProviders();
  }

  /**
   * Build the prompt bundle for a module request, grounding it in the module's
   * registered context builder.
   */
  async bundle(request: AiContextRequest): Promise<AiPromptBundle> {
    const builder = resolveAiContextBuilder(request.module);
    return builder(request);
  }

  /**
   * Buffered, module-aware completion. Resolves the module context builder,
   * composes system + history + question and returns the full text.
   */
  async complete(
    request: AiContextRequest,
    options?: AiGenerationOptions,
  ): Promise<AiGenerateResult & { id?: string }> {
    const provider = this.assertProvider();
    const builder = resolveAiContextBuilder(request.module);
    const bundle = await builder(request);
    const messages = this.toMessages(request, bundle);
    const start = Date.now();
    const result = await provider.generate(bundle.system, messages, options);
    const id = await this.logAndGetId(request, result.text, Date.now() - start);
    return { ...result, id };
  }

  /**
   * Buffered chat where the caller passes prebuilt messages plus an optional
   * system prompt (module context still applied via `request.module`).
   */
  async chat(
    request: AiContextRequest & { history: readonly AiMessage[] },
    options?: AiGenerationOptions,
  ): Promise<AiGenerateResult & { id?: string }> {
    const provider = this.assertProvider();
    const builder = resolveAiContextBuilder(request.module);
    const bundle = await builder(request);
    const history = request.history
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role as AiMessage['role'], content: m.content }));
    const start = Date.now();
    const result = await provider.generate(bundle.system, history, options);
    const id = await this.logAndGetId(request, result.text, Date.now() - start);
    return { ...result, id };
  }

  /**
   * Streaming, module-aware completion. Yields incremental text deltas. This
   * is the preferred path for the UI so tokens appear as they are generated.
   */
  async *stream(
    request: AiContextRequest,
    options?: AiGenerationOptions,
  ): AsyncIterable<string> {
    const provider = this.assertProvider();
    const builder = resolveAiContextBuilder(request.module);
    const bundle = await builder(request);
    const messages = this.toMessages(request, bundle);
    const start = Date.now();
    let full = '';
    for await (const chunk of provider.stream(bundle.system, messages, options)) {
      full += chunk;
      yield chunk;
    }
    this.logInteraction(request, full, Date.now() - start);
  }

  /** Convenience: is the provider configurable and ready? */
  get isEnabled(): boolean {
    return this.isConfigured;
  }

  private assertProvider(): AiProvider {
    if (!this.provider) {
      throw new Error('No AI provider is configured. Set AI_PROVIDER and the matching API key.');
    }
    if (!this.provider.isConfigured) {
      throw new Error(`AI provider "${this.provider.id}" is not configured (missing API key).`);
    }
    return this.provider;
  }

  private async logAndGetId(request: AiContextRequest, response: string, latencyMs: number): Promise<string | undefined> {
    if (this.metricsService) {
      this.metricsService.observe(latencyMs / 1000, request.module, request.feature ?? null, null);
    }
    if (!this.learningService || !request.tenantId) return undefined;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(request.tenantId)) return undefined;
    try {
      const entity = await this.learningService.logInteraction({
        tenantId: request.tenantId,
        userId: request.userId ?? null,
        module: request.module,
        feature: request.feature ?? null,
        message: request.message,
        response,
        contextSummary: request.context?.summary ?? null,
        latencyMs,
        provider: this.providerId,
      });
      return (entity as { id?: string })?.id;
    } catch (e) {
      this.logger.warn(`self-learner log failed: ${(e as Error).message}`);
      return undefined;
    }
  }

  private logInteraction(request: AiContextRequest, response: string, latencyMs: number): void {
    if (!this.learningService || !request.tenantId) return;
    void this.logAndGetId(request, response, latencyMs);
  }

  /** Compose the conversation messages from request history + user question. */
  private toMessages(
    request: AiContextRequest,
    bundle: AiPromptBundle,
  ): AiMessage[] {
    const base: AiMessage[] = (request.history ?? [])
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role as AiMessage['role'], content: m.content }));
    const raw = bundle.userMessage || request.message;
    const content = raw.includes('<user_message>') ? raw : dataBoundary('user_message', raw);
    base.push({ role: 'user', content });
    return base;
  }
}
