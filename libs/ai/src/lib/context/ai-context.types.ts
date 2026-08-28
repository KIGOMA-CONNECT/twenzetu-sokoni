/**
 * Module-aware AI context.
 *
 * The whole point of "AI that is helpful, not just a chatbot" is that the AI
 * knows what the user is looking at and what the system knows about it. Each
 * feature module registers a context builder that turns its current state into
 * (a) tailored system instructions and (b) concrete facts the model can reason
 * over. Registered under a stable module id so the UI and the service both
 * address AI by module.
 */

/** Stable identifier of the domain module the AI is assisting. */
export type AiModule = string;

/** The role an AI assistant plays in a module. */
export type AiAssistantRole = 'assistant' | 'analyst' | 'reviewer' | 'writer' | 'coach';

/** Supported output modes for a module's AI feature. */
export type AiFeature =
  | 'assistant' // conversational help grounded in module context
  | 'summarize' // summarize a dataset / action
  | 'analyze' // deep insight / anomaly / explanation
  | 'draft' // generate draft content (ads, descriptions, policies)
  | 'recommend' // suggestions paired with structured data
  | 'review' // review / critique against rules
  | 'extract'; // pull structured fields from free text

/**
 * Input a module provides to assemble AI context. Holds the pieces the model
 * needs without the module knowing anything about prompting.
 */
export interface AiModuleContext {
  /** Human readable context such as "Vendor analytics — current quarter". */
  readonly summary: string;
  /** Key/value facts to ground the answer (numbers, statuses, config). */
  readonly facts: Readonly<Record<string, unknown>>;
  /** Optional structured rows / tables the model can analyze. */
  readonly rows?: readonly Readonly<Record<string, unknown>>[];
  /** Explicit constraints / guardrails for this module's answers. */
  readonly constraints?: readonly string[];
  /** The exact questions the caller wants answered (may be empty for chat). */
  readonly questions?: readonly string[];
  /** Extended raw payload the model may use for analysis when present. */
  readonly payload?: unknown;
}

/** The assembled output used to call the provider. */
export interface AiPromptBundle {
  /** Full system instructions (module-specific). */
  readonly system: string;
  /** User-facing question / instruction history. */
  readonly userMessage: string;
}

/**
 * Context builder signature. Given the module's request (which may include the
 * module's own context and the user's message), return the prompt bundle. The
 * builder is free to fetch extra data or call deterministic helpers.
 */
export type AiContextBuilder = (
  request: AiContextRequest,
) => AiPromptBundle | Promise<AiPromptBundle>;

export interface AiContextRequest {
  /** Module id that this builder serves. */
  readonly module: AiModule;
  /** The user's raw message / question (or command). */
  readonly message: string;
  /** Optional feature hint. */
  readonly feature?: AiFeature;
  /** Optional module-provided context. */
  readonly context?: AiModuleContext;
  /** Optional prior conversation turns. */
  readonly history?: readonly AiMessageLike[];
  /** Any extra parameters the module wants included (ids, filters...). */
  readonly params?: Readonly<Record<string, unknown>>;
}

/** Minimal message shape accepted on the wire (full AiMessage used internally). */
export interface AiMessageLike {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
