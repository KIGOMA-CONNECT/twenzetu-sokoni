import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VendorSubscriptionEntity } from './entities/vendor-subscription.entity';
import { VendorSubscriptionTierEntity } from './entities/vendor-subscription-tier.entity';

@Injectable()
export class VendorSubscriptionService {
  private readonly logger = new Logger(VendorSubscriptionService.name);

  constructor(
    @InjectRepository(VendorSubscriptionEntity)
    private readonly subRepo: Repository<VendorSubscriptionEntity>,
    @InjectRepository(VendorSubscriptionTierEntity)
    private readonly tierRepo: Repository<VendorSubscriptionTierEntity>,
  ) {}

  async seedDefaultTiers(): Promise<void> {
    const count = await this.tierRepo.count();
    if (count > 0) return;

    const tiers = [
      {
        name: 'Basic (Bure)',
        monthlyPrice: 0,
        maxProducts: 10,
        maxImagesPerProduct: 3,
        features: ['Oda chini ya bidhaa', 'Msaada wa msingi', 'Ujumbe kwa wateja'],
      },
      {
        name: 'Standard',
        monthlyPrice: 25000,
        maxProducts: 100,
        maxImagesPerProduct: 5,
        commissionRateOverride: 0.08,
        features: ['Bidhaa nyingi', 'Picha nyingi', 'Analytics', 'Priority support', 'Commission rate: 8%'],
      },
      {
        name: 'Premium',
        monthlyPrice: 75000,
        maxProducts: 999,
        maxImagesPerProduct: 10,
        commissionRateOverride: 0.05,
        features: ['Bidhaa zisizo na kikomo', 'Picha nyingi', 'Analytics advanced', 'Dedicated support', 'Featured listing', 'Commission rate: 5%'],
      },
    ];

    for (const t of tiers) {
      await this.tierRepo.save(this.tierRepo.create(t));
    }
    this.logger.log('Default subscription tiers seeded');
  }

  async getTiers(): Promise<VendorSubscriptionTierEntity[]> {
    return this.tierRepo.find({ where: { isActive: true }, order: { monthlyPrice: 'ASC' } });
  }

  async subscribe(vendorId: string, tenantId: string, tierId: string): Promise<VendorSubscriptionEntity> {
    const tier = await this.tierRepo.findOne({ where: { id: tierId } });
    if (!tier) throw new NotFoundException('Subscription tier not found');

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const sub = this.subRepo.create({
      vendorId,
      tenantId,
      tierId,
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    });

    return this.subRepo.save(sub);
  }

  async getVendorSubscription(vendorId: string): Promise<VendorSubscriptionEntity | null> {
    return this.subRepo.findOne({
      where: { vendorId, status: 'active' },
      relations: { tier: true },
    });
  }
}
