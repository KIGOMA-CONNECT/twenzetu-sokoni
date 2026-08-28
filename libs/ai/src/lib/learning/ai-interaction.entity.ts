import { Column, Entity, Index } from 'typeorm';
import { TenantAwareEntity } from '@afri-market/database';

@Entity({ name: 'ai_interactions' })
@Index(['tenantId', 'module'])
@Index(['tenantId', 'feature'])
@Index(['tenantId', 'createdAt'])
export class AiInteractionOrmEntity extends TenantAwareEntity {
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  public userId!: string | null;

  @Column({ type: 'varchar', length: 50 })
  public module!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  public feature!: string | null;

  @Column({ type: 'text' })
  public message!: string;

  @Column({ type: 'text', nullable: true })
  public response!: string | null;

  @Column({ name: 'context_summary', type: 'varchar', length: 255, nullable: true })
  public contextSummary!: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  public feedback!: string | null;

  @Column({ name: 'latency_ms', type: 'integer', nullable: true })
  public latencyMs!: number | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  public provider!: string | null;
}
