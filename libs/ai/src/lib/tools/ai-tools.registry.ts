/**
 * Deterministic function registry ("tools") for the AI layer.
 *
 * This is the safe, checked way for AI to *do* something in the system rather
 * than just talk about it — the foundation for heavier tasks (agents, actions,
 * workflows) later. A tool is a named function with a declared JSON parameter
 * schema. Callers validate arguments and execute the registered handler; the
 * AI never has raw code execution ability.
 */

export interface AiToolParameterSchema {
  type: 'string' | 'number' | 'boolean';
  description?: string;
  enum?: string[];
  required?: boolean;
}

export interface AiToolSchema {
  name: string;
  description: string;
  parameters?: Record<string, AiToolParameterSchema>;
  /** One-liner the model can use to decide when to call this tool. */
  usage: string;
}

export type AiToolHandler = (args: Record<string, unknown>) => unknown | Promise<unknown>;

export interface AiTool {
  schema: AiToolSchema;
  handler: AiToolHandler;
}

const tools = new Map<string, AiTool>();

/** Register (or replace) a tool by name. */
export function registerAiTool(name: string, tool: AiTool): void {
  tools.set(name, tool);
}

/** True when a tool with this name is registered. */
export function hasAiTool(name: string): boolean {
  return tools.has(name);
}

/** Get a tool by name, or undefined. */
export function getAiTool(name: string): AiTool | undefined {
  return tools.get(name);
}

/** All registered tool schemas (for model tool declarations). */
export function listAiTools(): AiToolSchema[] {
  return [...tools.values()].map((t) => t.schema);
}

/**
 * Validate args against a tool's declared schema and invoke its handler.
 * Throws on unknown tool, missing required params, or handler failure.
 */
export async function callAiTool(
  name: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  const tool = tools.get(name);
  if (!tool) {
    throw new Error(`Unknown AI tool "${name}"`);
  }
  const schema = tool.schema;
  const params = schema.parameters ?? {};
  for (const [key, param] of Object.entries(params)) {
    if (param.required) {
      const has = args[key] !== undefined && args[key] !== null && args[key] !== '';
      if (!has) {
        throw new Error(`Tool "${name}" requires parameter "${key}"`);
      }
    }
    if (args[key] !== undefined && param.type === 'number' && typeof args[key] !== 'number') {
      throw new Error(`Parameter "${key}" of tool "${name}" must be a number`);
    }
    if (param.enum && args[key] !== undefined && !param.enum.includes(String(args[key]))) {
      throw new Error(`Parameter "${key}" of tool "${name}" must be one of ${param.enum.join(', ')}`);
    }
  }
  return tool.handler(args);
}

/** Remove a tool (mostly for tests). */
export function unregisterAiTool(name: string): void {
  tools.delete(name);
}
