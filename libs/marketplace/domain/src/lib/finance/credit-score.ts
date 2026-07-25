import { AggregateRoot, EntityId } from '@afri-market/kernel';
import { Money, TenantId } from '@afri-market/kernel';

export interface CreditScoreProps {
  tenantId: TenantId;
  userId: EntityId;
  score: number;
  totalTransactions: number;
  totalRevenue: Money;
  averageDailySales: Money;
  accountAgeDays: number;
  missedDeliveries: number;
  disputeCount: number;
  lastCalculatedAt: Date;
  version: number;
}

export class CreditScore extends AggregateRoot<EntityId> {
  private constructor(id: EntityId, private readonly props: CreditScoreProps) {
    super(id);
  }

  public get tenantId(): TenantId {
    return this.props.tenantId;
  }

  public get userId(): EntityId {
    return this.props.userId;
  }

  public get score(): number {
    return this.props.score;
  }

  public get totalTransactions(): number {
    return this.props.totalTransactions;
  }

  public get totalRevenue(): Money {
    return this.props.totalRevenue;
  }

  public get lastCalculatedAt(): Date {
    return this.props.lastCalculatedAt;
  }

  public get version(): number {
    return this.props.version;
  }

  public calculateScore(): number {
    const transactionScore = Math.min(100, this.props.totalTransactions * 2);
    const revenueScore = Math.min(100, this.props.totalRevenue.amount / 100);
    const ageScore = Math.min(100, this.props.accountAgeDays / 3);
    const deliveryScore = Math.max(0, 100 - this.props.missedDeliveries * 10);
    const disputeScore = Math.max(0, 100 - this.props.disputeCount * 20);

    this.props.score = Math.min(
      100,
      transactionScore * 0.3 +
      revenueScore * 0.25 +
      ageScore * 0.2 +
      deliveryScore * 0.15 +
      disputeScore * 0.1,
    );
    this.props.lastCalculatedAt = new Date();
    this.props.version++;
    return this.props.score;
  }

  public static create(props: {
    id?: EntityId;
    tenantId: TenantId;
    userId: EntityId;
    totalTransactions?: number;
    totalRevenue?: Money;
    averageDailySales?: Money;
    accountAgeDays?: number;
    missedDeliveries?: number;
    disputeCount?: number;
  }): CreditScore {
    const id = props.id ?? EntityId.create();
    const currency = props.totalRevenue?.currency ?? 'TZS';
    return new CreditScore(id, {
      tenantId: props.tenantId,
      userId: props.userId,
      score: 0,
      totalTransactions: props.totalTransactions ?? 0,
      totalRevenue: props.totalRevenue ?? Money.create(0, currency),
      averageDailySales: props.averageDailySales ?? Money.create(0, currency),
      accountAgeDays: props.accountAgeDays ?? 0,
      missedDeliveries: props.missedDeliveries ?? 0,
      disputeCount: props.disputeCount ?? 0,
      lastCalculatedAt: new Date(),
      version: 1,
    });
  }

  public static reconstitute(id: EntityId, props: CreditScoreProps): CreditScore {
    return new CreditScore(id, { ...props });
  }
}
