export type AuditOutcome = 'SUCCESS' | 'FAILURE';

export interface AuditLogEntryInput {
  readonly commandName: string;
  readonly tenantId: string | null;
  readonly userId: string | null;
  readonly correlationId: string;
  readonly outcome: AuditOutcome;
  readonly errorMessage?: string | null;
}

export interface IAuditLogger {
  log(entry: AuditLogEntryInput): Promise<void>;
}

export const AUDIT_LOGGER = Symbol('AUDIT_LOGGER');
