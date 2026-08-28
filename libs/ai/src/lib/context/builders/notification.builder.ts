/**
 * Notification — builder for in-app / template notifications.
 *
 * Grounds the model in notification state so the AI can summarize,
 * prioritize, and draft notification copy.
 */

import { registerAiContext } from '../ai-context-registry';
import type { AiContextBuilder, AiFeature, AiPromptBundle } from '../ai-context.types';
import { composeModuleSystemPrompt } from '../../prompts/prompt-templates';

export const NOTIFICATION_MODULE_ID = 'notification';
export const NOTIFICATION_ALIASES = ['notifications', 'templates', 'inbox'] as const;

const NOTIFICATION_CONSTRAINTS = [
  'Never invent notification titles, bodies, or recipient counts not in facts/rows.',
  'When rows contain notifications/templates, compute counts from those rows.',
  'Call out insufficient data when inbox is empty.',
];

function notificationIntent(feature: AiFeature): string {
  switch (feature) {
    case 'draft':
      return 'Draft a notification title and body with variables, grounded in supplied facts, ready to send.';
    case 'summarize':
      return 'Summarize inbox in bullets and small tables. Lead with totals, then unread, then templates.';
    case 'analyze':
      return 'Analyze notifications: unread rate, channel mix, template coverage. Surface concrete numbers.';
    default:
      return 'Help the user understand notifications. Answer concisely, grounded in facts, offer next steps.';
  }
}

export const notificationContextBuilder: AiContextBuilder = (request): AiPromptBundle => {
  const raw = (request.feature ?? 'assistant') as AiFeature;
  const feature: AiFeature = ['assistant', 'summarize', 'analyze', 'draft', 'recommend', 'review', 'extract'].includes(raw) ? raw : 'assistant';
  const facts = request.context?.facts ?? {};
  const rows = request.context?.rows ?? [];
  const constraints = [...NOTIFICATION_CONSTRAINTS, ...(request.context?.constraints ?? [])];
  const base = composeModuleSystemPrompt({ moduleLabel: 'Notifications', feature, facts, rows, constraints });
  const extra = [notificationIntent(feature), 'Facts: may hold { total, unread, byChannel }. Rows may hold notifications/notificationTemplates with kind field.'].join('\n\n');
  return { system: `${base}\n\n${extra}`, userMessage: request.message };
};

export function registerNotificationContext(): void {
  registerAiContext(NOTIFICATION_MODULE_ID, notificationContextBuilder);
  for (const a of NOTIFICATION_ALIASES) registerAiContext(a, notificationContextBuilder);
}
