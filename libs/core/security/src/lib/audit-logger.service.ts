import { Injectable, Logger } from '@nestjs/common';

export interface AuditLogEntry {
  action: string;
  actorId: string;
  actorRole: string;
  tenantId: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
  requestId?: string;
}

@Injectable()
export class AuditLoggerService {
  private readonly logger = new Logger('AuditTrail');

  log(entry: Omit<AuditLogEntry, 'timestamp'>): void {
    this.logger.log(JSON.stringify({ ...entry, timestamp: new Date().toISOString() }));
  }
}
