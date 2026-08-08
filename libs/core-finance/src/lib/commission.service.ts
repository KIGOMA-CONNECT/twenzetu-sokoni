import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommissionLogEntity } from './entities/commission-log.entity';

@Injectable()
export class CommissionService {
  private readonly logger = new Logger(CommissionService.name);
  private readonly DEFAULT_RATE = 0.10;

  constructor(
    @InjectRepository(CommissionLogEntity)
    private readonly commissionRepo: Repository<CommissionLogEntity>,
  ) {}

  async deductCommission(params: {
    tenantId: string;
    orderId: string;
    payerType: 'vendor' | 'driver';
    payerId: string;
    orderAmount: number;
    rate?: number;
  }): Promise<{ commissionAmount: number; netAmount: number }> {
    const rate = params.rate ?? this.DEFAULT_RATE;
    const commissionAmount = Math.round(params.orderAmount * rate * 100) / 100;
    const netAmount = params.orderAmount - commissionAmount;

    const log = this.commissionRepo.create({
      tenantId: params.tenantId,
      orderId: params.orderId,
      payerType: params.payerType,
      payerId: params.payerId,
      orderAmount: params.orderAmount,
      commissionRate: rate,
      commissionAmount,
      status: 'deducted',
      deductedAt: new Date(),
    });

    await this.commissionRepo.save(log);
    this.logger.log(`Commission deducted: ${params.payerType} ${params.payerId} - Tsh ${commissionAmount} from order ${params.orderId}`);

    return { commissionAmount, netAmount };
  }

  async getCommissionSummary(tenantId: string, from?: Date, to?: Date) {
    const qb = this.commissionRepo.createQueryBuilder('c')
      .where('c.tenant_id = :tenantId', { tenantId });

    if (from) qb.andWhere('c.created_at >= :from', { from });
    if (to) qb.andWhere('c.created_at <= :to', { to });

    const result = await qb
      .select('SUM(c.commission_amount)', 'totalCommission')
      .addSelect('COUNT(*)', 'totalTransactions')
      .addSelect('AVG(c.commission_amount)', 'averageCommission')
      .getRawOne();

    return {
      totalCommission: parseFloat(result?.totalCommission || '0'),
      totalTransactions: parseInt(result?.totalTransactions || '0'),
      averageCommission: parseFloat(result?.averageCommission || '0'),
    };
  }

  async getVendorCommissions(vendorId: string) {
    return this.commissionRepo.find({
      where: { payerId: vendorId, payerType: 'vendor' },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async getDriverCommissions(driverId: string) {
    return this.commissionRepo.find({
      where: { payerId: driverId, payerType: 'driver' },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }
}
