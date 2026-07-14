import 'reflect-metadata';
import { AppConfigService } from '@abms/core-config';
import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import { AUDIT_ENTITIES } from './audit-entities';
import { AuditLogOrmEntity } from './audit-log-orm.entity';
import { TypeOrmAuditLogger } from './typeorm-audit-logger';

describe('audit_log table correctness (integration)', () => {
  let ownerDataSource: DataSource;
  let runtimeDataSource: DataSource;
  let auditLogger: TypeOrmAuditLogger;
  const createdCorrelationIds: string[] = [];

  beforeAll(async () => {
    const config = new AppConfigService(process.env);

    ownerDataSource = new DataSource({
      type: 'postgres',
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
      username: config.database.ownerUser,
      password: config.database.ownerPassword,
      ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
      logging: false,
    });
    await ownerDataSource.initialize();

    runtimeDataSource = new DataSource({
      type: 'postgres',
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
      username: config.database.runtimeUser,
      password: config.database.runtimePassword,
      ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
      logging: false,
      entities: AUDIT_ENTITIES,
    });
    await runtimeDataSource.initialize();

    auditLogger = new TypeOrmAuditLogger(runtimeDataSource);
  });

  afterAll(async () => {
    if (createdCorrelationIds.length > 0) {
      await ownerDataSource.query(`DELETE FROM "audit_log" WHERE "correlation_id" = ANY($1)`, [
        createdCorrelationIds,
      ]);
    }
    await ownerDataSource.destroy();
    await runtimeDataSource.destroy();
  });

  it('writes a SUCCESS entry with the expected fields', async () => {
    const correlationId = randomUUID();
    createdCorrelationIds.push(correlationId);
    const tenantId = randomUUID();
    const userId = randomUUID();

    await auditLogger.log({
      commandName: 'IntegrationTestCommand',
      tenantId,
      userId,
      correlationId,
      outcome: 'SUCCESS',
    });

    const row = await runtimeDataSource
      .getRepository(AuditLogOrmEntity)
      .findOneByOrFail({ correlationId });

    expect(row.commandName).toBe('IntegrationTestCommand');
    expect(row.tenantId).toBe(tenantId);
    expect(row.userId).toBe(userId);
    expect(row.outcome).toBe('SUCCESS');
    expect(row.errorMessage).toBeNull();
  });

  it('writes a FAILURE entry with the error message, and null tenant/user when unauthenticated', async () => {
    const correlationId = randomUUID();
    createdCorrelationIds.push(correlationId);

    await auditLogger.log({
      commandName: 'IntegrationTestCommand',
      tenantId: null,
      userId: null,
      correlationId,
      outcome: 'FAILURE',
      errorMessage: 'Invalid email or password.',
    });

    const row = await runtimeDataSource
      .getRepository(AuditLogOrmEntity)
      .findOneByOrFail({ correlationId });

    expect(row.outcome).toBe('FAILURE');
    expect(row.errorMessage).toBe('Invalid email or password.');
    expect(row.tenantId).toBeNull();
    expect(row.userId).toBeNull();
  });

  it('rejects UPDATE and DELETE from the runtime role — WORM immutability at the DB grant level', async () => {
    const correlationId = randomUUID();
    createdCorrelationIds.push(correlationId);

    await auditLogger.log({
      commandName: 'IntegrationTestCommand',
      tenantId: null,
      userId: null,
      correlationId,
      outcome: 'SUCCESS',
    });

    await expect(
      runtimeDataSource.query(`UPDATE "audit_log" SET "outcome" = 'FAILURE' WHERE "correlation_id" = $1`, [
        correlationId,
      ]),
    ).rejects.toThrow(/permission denied/i);

    await expect(
      runtimeDataSource.query(`DELETE FROM "audit_log" WHERE "correlation_id" = $1`, [correlationId]),
    ).rejects.toThrow(/permission denied/i);

    const row = await runtimeDataSource
      .getRepository(AuditLogOrmEntity)
      .findOneByOrFail({ correlationId });
    expect(row.outcome).toBe('SUCCESS');
  });

  it('has no RLS policy on the audit_log table (global, non-tenant-scoped by design)', async () => {
    const policies: { policyname: string }[] = await ownerDataSource.query(
      `SELECT policyname FROM pg_policies WHERE tablename = 'audit_log'`,
    );

    expect(policies).toHaveLength(0);
  });
});
