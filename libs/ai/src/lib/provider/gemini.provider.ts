/**
 * Google Gemini provider client.
 *
 * Talks to the Gemini REST API (models.generateContent / streamGenerateContent)
 * using the repo's shared node HTTP helper. Every method degrades gracefully
 * when no API key is configured, so callers never break without AI configured —
 * mirroring the GoogleMapsService convention elsewhere in the codebase.
 */

import { httpRequest } from '@afri-market/integrations';
import type { AiConfig } from '../ai-config';
import type {
  AiGenerateResult,
  AiGenerationOptions,
  AiMessage,
  AiProvider,
} from './ai-provider.interface';

const GENERATE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-1.5-flash';

/** Map our normalized chat role to Gemini's role label. */
function geminiRole(role: AiMessage['role']): string {
  return role === 'assistant' ? 'model' : role;
}

/** Extract the response text from a parsed Gemini generateContent payload. */
function extractText(payload: any): string {
  const candidates = payload?.candidates;
  const parts = candidates?.[0]?.content?.parts;
  if (Array.isArray(parts)) {
    return parts
      .map((p: any) => (typeof p?.text === 'string' ? p.text : ''))
      .join('');
  }
  return '';
}

export class GeminiProvider implements AiProvider {
  readonly id = 'gemini';

  private readonly apiKey: string;
  readonly defaultModel: string;
  private readonly temperature?: number;
  private readonly maxOutputTokens?: number;
  private readonly timeoutMs: number;
  private readonly baseUrl: string;
  readonly isConfigured: boolean;

  constructor(config: AiConfig) {
    this.apiKey = config.apiKeys['gemini'] ?? '';
    this.defaultModel = config.models['gemini'] ?? DEFAULT_MODEL;
    this.temperature = config.temperature;
    this.maxOutputTokens = config.maxOutputTokens;
    this.timeoutMs = config.timeoutMs ?? 30000;
    this.baseUrl = process.env.GEMINI_BASE_URL || GENERATE_URL;
    this.isConfigured = this.apiKey.length > 0;
  }

  /** Build the request body shared by buffered and streaming calls. */
  private buildBody(
    system: string,
    messages: AiMessage[],
    options?: AiGenerationOptions,
  ): Record<string, unknown> {
    const generationConfig: Record<string, unknown> = {
      temperature: options?.temperature ?? this.temperature ?? 0.4,
      maxOutputTokens: options?.maxOutputTokens ?? this.maxOutputTokens ?? 2048,
    };
    if (options?.stop?.length) {
      generationConfig.stopSequences = options.stop;
    }
    const contents = messages.filter((m) => m.role !== 'system').map((m) => ({
      role: geminiRole(m.role),
      parts: [{ text: m.content }],
    }));
    const body: Record<string, unknown> = {
      contents,
      generationConfig,
    };
    const systemText = [system, messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n')]
      .filter(Boolean)
      .join('\n\n');
    if (systemText.trim()) {
      body.systemInstruction = { parts: [{ text: systemText }] };
    }
    if (options?.responseSchema) {
      body.generationConfig = {
        ...(body.generationConfig as Record<string, unknown>),
        responseMimeType: 'application/json',
        responseSchema: options.responseSchema,
      };
    }
    return body;
  }

  async generate(
    system: string,
    messages: AiMessage[],
    options?: AiGenerationOptions,
  ): Promise<AiGenerateResult> {
    if (!this.isConfigured) {
      throw new Error('Gemini API key is not configured');
    }
    const model = options?.model ?? this.defaultModel;
    const url = `${this.baseUrl}/${model}:generateContent?key=${encodeURIComponent(this.apiKey)}`;
    const payload = await httpRequest<any>({
      method: 'POST',
      url,
      body: this.buildBody(system, messages, options),
      timeoutMs: this.timeoutMs,
    });
    const text = extractText(payload);
    const usage = payload?.usageMetadata;
    return {
      text,
      finishReason: payload?.candidates?.[0]?.finishReason,
      usage: {
        inputTokens: usage?.promptTokenCount,
        outputTokens: usage?.candidatesTokenCount,
        totalTokens: usage?.totalTokenCount,
      },
    };
  }

  async *stream(
    system: string,
    messages: AiMessage[],
    options?: AiGenerationOptions,
  ): AsyncIterable<string> {
    if (!this.isConfigured) {
      throw new Error('Gemini API key is not configured');
    }
    const model = options?.model ?? this.defaultModel;
    const url = `${this.baseUrl}/${model}:streamGenerateContent?alt=sse&key=${encodeURIComponent(this.apiKey)}`;
    const body = this.buildBody(system, messages, options);

    // Read the SSE response line-by-line. Each `data:` JSON chunk is a
    // GenerateContentResponse candidate partial; we yield its incremental
    // text. Chunks may be split arbitrarily across lines, so JSON is parsed
    // per line (Gemini emits one JSON object per SSE event).
    for await (const line of this.sseLines(url, body)) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const data = trimmed.slice(5).trim();
      if (!data || data === '[DONE]') continue;
      try {
        const chunk = JSON.parse(data);
        yield extractText(chunk);
      } catch {
        // Ignore malformed keep-alive / partial lines.
      }
    }
  }

  /** Minimal SSE reader over the raw node https stream. */
  private async *sseLines(url: string, body: Record<string, unknown>): AsyncIterable<string> {
    const nodeHttps = await import('https');
    const nodeHttp = await import('http');
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? nodeHttps : nodeHttp;

    const stream = await new Promise<any>((resolve, reject) => {
      const req = client.request(
        {
          hostname: urlObj.hostname,
          port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
          path: urlObj.pathname + urlObj.search,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
          },
        },
        (res) => {
          if (res.statusCode && res.statusCode >= 400) {
            let data = '';
            res.on('data', (c: Buffer) => (data += c.toString()));
            res.on('end', () =>
              reject(new Error(`Gemini stream HTTP ${res.statusCode}: ${data.substring(0, 300)}`)),
            );
            return;
          }
          resolve(res);
        },
      );
      req.on('error', reject);
      req.setTimeout(this.timeoutMs, () => req.destroy(new Error('Gemini stream timeout')));
      req.write(JSON.stringify(body));
      req.end();
    });

    stream.setEncoding('utf8');
    let buffer = '';
    for await (const chunk of stream) {
      buffer += chunk;
      let nl: number;
      while ((nl = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, nl);
        buffer = buffer.slice(nl + 1);
        yield line;
      }
    }
    if (buffer.trim()) yield buffer;
  }
}
