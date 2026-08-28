import { httpRequest } from '@afri-market/integrations';
import { GeminiProvider } from './provider/gemini.provider';
import { createAiProvider, availableAiProviders } from './provider/ai-provider.factory';
import { registerAiContext, resolveAiContextBuilder, unregisterAiContext } from './context/ai-context-registry';
import { registerAiTool, callAiTool, hasAiTool, unregisterAiTool } from './tools/ai-tools.registry';
import { composeModuleSystemPrompt } from './prompts/prompt-templates';
import type { AiConfig } from './ai-config';

jest.mock('@afri-market/integrations', () => ({
  httpRequest: jest.fn(),
}));

const mockHttpRequest = httpRequest as jest.MockedFunction<typeof httpRequest>;

function cfg(overrides: Partial<AiConfig> = {}): AiConfig {
  return {
    provider: 'gemini',
    apiKeys: { gemini: 'test-key' },
    models: { gemini: 'gemini-1.5-flash' },
    ...overrides,
  };
}

describe('GeminiProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.GEMINI_BASE_URL;
  });

  it('reports not configured when no API key is provided', () => {
    const p = new GeminiProvider({ ...cfg(), apiKeys: { gemini: '' } });
    expect(p.isConfigured).toBe(false);
  });

  it('reports configured when a key is present', () => {
    const p = new GeminiProvider(cfg());
    expect(p.isConfigured).toBe(true);
    expect(p.id).toBe('gemini');
    expect(p.defaultModel).toBe('gemini-1.5-flash');
  });

  it('throws when generating but not configured', async () => {
    const p = new GeminiProvider({ ...cfg(), apiKeys: { gemini: '' } });
    await expect(p.generate('sys', [{ role: 'user', content: 'hi' }])).rejects.toThrow(
      'Gemini API key is not configured',
    );
  });

  it('maps roles and system instruction into the generate request', async () => {
    const p = new GeminiProvider(cfg());
    mockHttpRequest.mockResolvedValue({
      candidates: [{ content: { parts: [{ text: 'hello' }] }, finishReason: 'STOP' }],
      usageMetadata: { promptTokenCount: 5, candidatesTokenCount: 10, totalTokenCount: 15 },
    } as never);

    await p.generate('You are the marketplace AI.', [
      { role: 'user', content: 'List orders' },
      { role: 'assistant', content: 'Here they are.' },
      { role: 'user', content: 'Thanks' },
    ]);

    const [call] = mockHttpRequest.mock.calls[0];
    expect(call.method).toBe('POST');
    expect(call.url).toContain('gemini-1.5-flash:generateContent');
    expect(call.url).toContain('key=test-key');
    const body = call.body as any;
    expect(body.systemInstruction.parts[0].text).toContain('marketplace AI');
    expect(body.contents.map((c: any) => c.role)).toEqual(['user', 'model', 'user']);
    expect(body.contents[1].parts[0].text).toBe('Here they are.');
    expect(body.generationConfig.temperature).toBeGreaterThanOrEqual(0);
  });

  it('returns the extracted text and usage from a generate response', async () => {
    const p = new GeminiProvider(cfg());
    mockHttpRequest.mockResolvedValue({
      candidates: [{ content: { parts: [{ text: 'A' }, { text: 'B' }] }, finishReason: 'STOP' }],
      usageMetadata: { promptTokenCount: 3, candidatesTokenCount: 8, totalTokenCount: 11 },
    } as never);

    const res = await p.generate('sys', [{ role: 'user', content: 'x' }]);
    expect(res.text).toBe('AB');
    expect(res.finishReason).toBe('STOP');
    expect(res.usage?.totalTokens).toBe(11);
  });
});

describe('AiProviderFactory', () => {
  it('lists registered providers', () => {
    expect(availableAiProviders()).toContain('gemini');
  });

  it('creates the gemini provider for the configured id', () => {
    const p = createAiProvider(cfg());
    expect(p).toBeInstanceOf(GeminiProvider);
    expect(p?.isConfigured).toBe(true);
  });

  it('returns null for an unknown provider id', () => {
    expect(createAiProvider({ ...cfg(), provider: 'aliens' })).toBeNull();
  });
});

describe('AiContextRegistry', () => {
  afterEach(() => unregisterAiContext('units'));

  it('falls back to the generic builder for unregistered modules', async () => {
    const bundle = await resolveAiContextBuilder('ghost-module')({
      module: 'ghost-module',
      message: 'hello',
    });
    expect(bundle.system).toContain('ghost-module');
    expect(bundle.userMessage).toBe('hello');
  });

  it('uses a registered module builder', async () => {
    registerAiContext('units', ({ message }) => ({
      system: 'You are the AI for Org Units. Be precise.',
      userMessage: `Q: ${message}`,
    }));
    const bundle = await resolveAiContextBuilder('units')({ module: 'units', message: 'best unit?' });
    expect(bundle.system).toContain('Org Units');
    expect(bundle.userMessage).toBe('Q: best unit?');
  });

  it('grounds facts and constraints into the generic system prompt', async () => {
    const bundle = await resolveAiContextBuilder('x')({
      module: 'x',
      feature: 'summarize',
      message: 'sum up',
      context: {
        summary: 'Q sales',
        facts: { revenue: 5000 },
        constraints: ['Only report supplied figures.'],
      },
    });
    expect(bundle.system).toContain('"summarize"');
    expect(bundle.system).toContain('revenue');
    expect(bundle.system).toContain('Only report supplied figures.');
  });
});

describe('composeModuleSystemPrompt', () => {
  it('builds a safe, feature-aware prompt with data', () => {
    const sys = composeModuleSystemPrompt({
      moduleLabel: 'Payroll',
      feature: 'analyze',
      facts: { totalPayroll: 1200000 },
    });
    expect(sys).toContain('Payroll');
    expect(sys).toContain('1200000');
    expect(sys).toContain('totalPayroll');
    const base = composeModuleSystemPrompt({ moduleLabel: 'X', feature: 'assistant' });
    expect(base).toContain('Do not invent');
  });
});

describe('AiToolRegistry', () => {
  afterEach(() => {
    unregisterAiTool('echo');
    unregisterAiTool('sum');
  });

  it('registers, validates and calls a tool', async () => {
    registerAiTool('echo', {
      schema: {
        name: 'echo',
        description: 'echo',
        usage: 'returns input',
        parameters: { text: { type: 'string', required: true } },
      },
      handler: (args) => args.text,
    });
    expect(hasAiTool('echo')).toBe(true);
    await expect(callAiTool('echo', { text: 'hi' })).resolves.toBe('hi');
  });

  it('throws on a required parameter missing', async () => {
    registerAiTool('sum', {
      schema: {
        name: 'sum',
        description: 'adds numbers',
        usage: 'sum',
        parameters: { a: { type: 'number', required: true }, b: { type: 'number', required: true } },
      },
      handler: (args) => (args.a as number) + (args.b as number),
    });
    await expect(callAiTool('sum', { a: 1 })).rejects.toThrow('requires parameter "b"');
  });

  it('throws for unknown tools', async () => {
    await expect(callAiTool('nope', {})).rejects.toThrow('Unknown AI tool');
  });
});
