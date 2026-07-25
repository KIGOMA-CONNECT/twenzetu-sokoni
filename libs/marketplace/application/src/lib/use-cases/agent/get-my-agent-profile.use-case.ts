import { Injectable, Inject } from '@nestjs/common';
import { IFieldAgentRepository } from '@afri-market/marketplace-domain';
import { FIELD_AGENT_REPOSITORY } from '../../tokens';

@Injectable()
export class GetMyAgentProfileUseCase {
  constructor(
    @Inject(FIELD_AGENT_REPOSITORY) private readonly agentRepo: IFieldAgentRepository,
  ) {}

  public async execute(userId: string): Promise<{ data: Record<string, unknown> } | { data: null }> {
    const agent = await this.agentRepo.findByUserId(userId);
    if (!agent) {
      return { data: null };
    }
    return {
      data: {
        id: agent.id.value,
        agentType: agent.agentType,
        agentCode: agent.agentCode,
        coverageArea: agent.coverageArea,
        totalOnboarded: agent.totalOnboarded,
        totalEarnings: agent.totalEarnings.amount,
        status: agent.status,
      },
    };
  }

  public async getEarnings(userId: string): Promise<{ data: Record<string, unknown>[] }> {
    const agent = await this.agentRepo.findByUserId(userId);
    if (!agent) {
      return { data: [] };
    }
    return { data: [{ agentId: agent.id.value, totalEarnings: agent.totalEarnings.amount, commissionRate: agent.commissionRate }] };
  }
}
