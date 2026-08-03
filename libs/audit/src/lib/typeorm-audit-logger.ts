import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AuditLogEntryInput, IAuditLogger } from './audit-logger.interface';
import { AuditLogOrmEntity } from './audit-log-orm.entity';

@Injectable()
export class TypeOrmAuditLogger implements IAuditLogger {
  public constructor(private readonly dataSource: DataSource) {}

  public async log(entry: AuditLogEntryInput): Promise<void> {
    await this.dataSource.getRepository(AuditLogOrmEntity).insert({
      tenantId: entry.tenantId,
      userId: entry.userId,
      commandName: entry.commandName,
      correlationId: entry.correlationId,
      outcome: entry.outcome,
      errorMessage: entry.errorMessage ?? null,
    });
  }
}
