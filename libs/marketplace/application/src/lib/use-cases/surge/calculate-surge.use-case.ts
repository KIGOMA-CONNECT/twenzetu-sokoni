import { Inject, Injectable } from '@nestjs/common';
import { ISurgeRuleRepository } from '@afri-market/marketplace-domain';
import { SURGE_RULE_REPOSITORY } from '../../tokens';

@Injectable()
export class CalculateSurgeUseCase {
  constructor(
    @Inject(SURGE_RULE_REPOSITORY) private readonly surgeRepo: ISurgeRuleRepository,
  ) {}

  public async execute(tenantId: string, params: {
    baseFare: number; distanceKm: number; perKmRate: number;
    durationMinutes: number; perMinuteRate: number;
  }): Promise<{ totalFare: number; surgeMultiplier: number; breakdown: Record<string, number> }> {
    const activeRules = await this.surgeRepo.findActiveByTenant(tenantId);
    const now = new Date();
    const currentHour = now.getHours();

    let multiplier = 1.0;
    for (const rule of activeRules) {
      if (!rule.isActive) continue;
      if (rule.startHour != null && rule.endHour != null) {
        if (currentHour >= rule.startHour && currentHour <= rule.endHour) {
          multiplier = Math.max(multiplier, rule.multiplier);
        }
      } else {
        multiplier = Math.max(multiplier, rule.multiplier);
      }
    }

    const distanceFare = params.distanceKm * params.perKmRate;
    const timeFare = params.durationMinutes * params.perMinuteRate;
    const subtotal = params.baseFare + distanceFare + timeFare;
    const totalFare = subtotal * multiplier;

    return {
      totalFare: Math.round(totalFare * 100) / 100,
      surgeMultiplier: multiplier,
      breakdown: {
        baseFare: params.baseFare,
        distanceFare,
        timeFare,
        subtotal,
        surge: totalFare - subtotal,
      },
    };
  }
}
