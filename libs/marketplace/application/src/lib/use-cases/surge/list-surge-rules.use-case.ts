import { Injectable, Inject } from '@nestjs/common';
import { SurgeRule, ISurgeRuleRepository, SurgeTrigger } from '@afri-market/marketplace-domain';
import { TenantId } from '@afri-market/kernel';
import { SURGE_RULE_REPOSITORY } from '../../tokens';

@Injectable()
export class CreateSurgeRuleUseCase {
  constructor(
    @Inject(SURGE_RULE_REPOSITORY) private readonly surgeRepo: ISurgeRuleRepository,
  ) {}

  public async execute(tenantId: string, data: {
    name: string;
    trigger: string;
    multiplier: number;
    minOrders?: number;
    maxDrivers?: number;
    startHour?: number;
    endHour?: number;
  }): Promise<{ surgeRuleId: string }> {
    const rule = SurgeRule.create({
      tenantId: TenantId.create(tenantId),
      name: data.name,
      trigger: data.trigger as SurgeTrigger,
      multiplier: data.multiplier,
      minOrders: data.minOrders ?? 5,
      maxDrivers: data.maxDrivers ?? 10,
      startHour: data.startHour,
      endHour: data.endHour,
      isActive: true,
    });
    await this.surgeRepo.save(rule);
    return { surgeRuleId: rule.id.value };
  }
}

@Injectable()
export class ListSurgeRulesUseCase {
  constructor(
    @Inject(SURGE_RULE_REPOSITORY) private readonly surgeRepo: ISurgeRuleRepository,
  ) {}

  public async execute(tenantId: string): Promise<{ data: Record<string, unknown>[] }> {
    const rules = await this.surgeRepo.findActiveByTenant(tenantId);
    return {
      data: rules.map(r => ({
        id: r.id.value,
        name: r.name,
        trigger: r.trigger,
        multiplier: r.multiplier,
        isActive: r.isActive,
      })),
    };
  }
}
