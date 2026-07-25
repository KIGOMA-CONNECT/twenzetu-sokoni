import { AggregateRoot, EntityId, Guard, Money, TenantId } from '@afri-market/kernel';
import { AgentStatus, AgentType } from './agent-status';

export interface FieldAgentProps {
  tenantId: TenantId;
  userId: EntityId;
  agentType: AgentType;
  agentCode: string;
  coverageArea: string;
  totalOnboarded: number;
  totalEarnings: Money;
  commissionRate: number;
  status: AgentStatus;
  version: number;
}

export class FieldAgent extends AggregateRoot<EntityId> {
  private constructor(id: EntityId, private readonly props: FieldAgentProps) {
    super(id);
  }

  public get tenantId(): TenantId {
    return this.props.tenantId;
  }

  public get userId(): EntityId {
    return this.props.userId;
  }

  public get agentType(): AgentType {
    return this.props.agentType;
  }

  public get agentCode(): string {
    return this.props.agentCode;
  }

  public get coverageArea(): string {
    return this.props.coverageArea;
  }

  public get totalOnboarded(): number {
    return this.props.totalOnboarded;
  }

  public get totalEarnings(): Money {
    return this.props.totalEarnings;
  }

  public get commissionRate(): number {
    return this.props.commissionRate;
  }

  public get status(): AgentStatus {
    return this.props.status;
  }

  public get version(): number {
    return this.props.version;
  }

  public activate(): void {
    Guard.assert(this.props.status === 'PENDING', 'Can only activate pending agents');
    this.props.status = 'ACTIVE';
    this.props.version++;
  }

  public deactivate(): void {
    Guard.assert(this.props.status !== 'SUSPENDED', 'Agent already suspended');
    this.props.status = 'SUSPENDED';
    this.props.version++;
  }

  public creditCommission(amount: Money): void {
    Guard.assert(this.props.status === 'ACTIVE', 'Only active agents can earn');
    this.props.totalEarnings = this.props.totalEarnings.add(amount);
    this.props.version++;
  }

  public incrementOnboardedCount(): void {
    this.props.totalOnboarded++;
    this.props.version++;
  }

  public static create(props: {
    id?: EntityId;
    tenantId: TenantId;
    userId: EntityId;
    agentType: AgentType;
    agentCode: string;
    coverageArea: string;
    commissionRate?: number;
  }): FieldAgent {
    const id = props.id ?? EntityId.create();
    const currency = 'TZS';
    return new FieldAgent(id, {
      tenantId: props.tenantId,
      userId: props.userId,
      agentType: props.agentType,
      agentCode: props.agentCode,
      coverageArea: props.coverageArea,
      totalOnboarded: 0,
      totalEarnings: Money.create(0, currency),
      commissionRate: props.commissionRate ?? 1.0,
      status: 'PENDING',
      version: 1,
    });
  }

  public static reconstitute(id: EntityId, props: FieldAgentProps): FieldAgent {
    return new FieldAgent(id, { ...props });
  }
}
