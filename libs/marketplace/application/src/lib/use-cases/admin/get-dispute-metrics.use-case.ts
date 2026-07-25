import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class GetDisputeMetricsUseCase {
  constructor(private readonly dataSource: DataSource) {}

  public async execute(tenantId: string) {
    const repo = this.dataSource.getRepository('DisputeOrmEntity');

    const totals = await repo
      .createQueryBuilder('d')
      .select([
        'COUNT(*) AS "total"',
        "COUNT(*) FILTER (WHERE d.status = 'OPEN') AS \"open\"",
        "COUNT(*) FILTER (WHERE d.status = 'RESOLVED') AS \"resolved\"",
      ])
      .where('d."tenant_id" = :tenantId', { tenantId })
      .getRawOne();

    const resolvedDisputes = await repo
      .createQueryBuilder('d')
      .select([
        'AVG(EXTRACT(EPOCH FROM (d."updated_at" - d."created_at")) / 3600) AS "avgResolutionHours"',
      ])
      .where('d."tenant_id" = :tenantId', { tenantId })
      .andWhere("d.status = 'RESOLVED'")
      .getRawOne();

    const byReason = await repo
      .createQueryBuilder('d')
      .select(['d.reason AS "reason"', 'COUNT(*) AS "count"'])
      .where('d."tenant_id" = :tenantId', { tenantId })
      .groupBy('d.reason')
      .getRawMany();

    const bySeverity = await repo
      .createQueryBuilder('d')
      .select(['d.severity AS "severity"', 'COUNT(*) AS "count"'])
      .where('d."tenant_id" = :tenantId', { tenantId })
      .groupBy('d.severity')
      .getRawMany();

    const reasonMap: Record<string, number> = {};
    for (const row of byReason) {
      reasonMap[row.reason] = Number(row.count);
    }

    const severityMap: Record<string, number> = {};
    for (const row of bySeverity) {
      severityMap[row.severity] = Number(row.count);
    }

    return {
      data: {
        total: Number(totals.total),
        open: Number(totals.open),
        resolved: Number(totals.resolved),
        averageResolutionTimeHours: Number(resolvedDisputes?.avgResolutionHours ?? 0),
        byReason: reasonMap,
        bySeverity: severityMap,
      },
    };
  }
}
