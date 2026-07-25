import { EntityId, Money } from '@afri-market/kernel';

export interface AgentEarningProps {
  id: EntityId;
  agentId: EntityId;
  transactionId?: EntityId;
  amount: Money;
  type: 'onboarding' | 'transaction_commission';
  description: string;
  createdAt: Date;
}

export class AgentEarning {
  private constructor(private readonly props: AgentEarningProps) {}

  public get id(): EntityId {
    return this.props.id;
  }

  public get agentId(): EntityId {
    return this.props.agentId;
  }

  public get amount(): Money {
    return this.props.amount;
  }

  public get type(): string {
    return this.props.type;
  }

  public get description(): string {
    return this.props.description;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public static create(props: {
    agentId: EntityId;
    transactionId?: EntityId;
    amount: Money;
    type: 'onboarding' | 'transaction_commission';
    description: string;
  }): AgentEarning {
    return new AgentEarning({
      id: EntityId.create(),
      ...props,
      createdAt: new Date(),
    });
  }
}
