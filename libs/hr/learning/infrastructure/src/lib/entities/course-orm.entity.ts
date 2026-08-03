import { TenantAwareEntity } from '@abms/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'course' })
@Index(['tenantId'])
export class CourseOrmEntity extends TenantAwareEntity {
  @Column({ type: 'varchar', length: 200 })
  public title!: string;

  @Column({ type: 'text', nullable: true })
  public description!: string | null;

  @Column({ name: 'duration_hours', type: 'integer' })
  public durationHours!: number;

  @Column({ type: 'varchar', length: 24 })
  public category!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  public isActive!: boolean;
}
