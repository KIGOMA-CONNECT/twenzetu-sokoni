import { Inject, Injectable } from '@nestjs/common';
import { EntityId, TenantId } from '@afri-market/kernel';
import { FieldAgent, IFieldAgentRepository, AgentType } from '@afri-market/marketplace-domain';
import { FIELD_AGENT_REPOSITORY } from '../../tokens';

@Injectable()
export class RegisterAgentUseCase {
  constructor(
    @Inject(FIELD_AGENT_REPOSITORY) private readonly agentRepo: IFieldAgentRepository,
  ) {}

  public async execute(tenantId: string, params: {
    userId: string;
    agentType: string;
    coverageArea: string;
    commissionRate?: number;
  }): Promise<{ agentId: string; agentCode: string; status: string }> {
    const agentCode = `AG-${tenantId.substring(0, 4).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    const agent = FieldAgent.create({
      tenantId: TenantId.create(tenantId),
      userId: EntityId.from(params.userId),
      agentType: params.agentType as AgentType,
      agentCode,
      coverageArea: params.coverageArea,
      commissionRate: params.commissionRate,
    });

    await this.agentRepo.save(agent);

    return { agentId: agent.id.value, agentCode: agent.agentCode, status: agent.status };
  }
}
