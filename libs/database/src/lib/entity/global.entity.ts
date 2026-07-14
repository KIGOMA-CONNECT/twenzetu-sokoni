import { CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/**
 * Base for tables deliberately outside RLS/tenant scoping (e.g. Tenant/User —
 * login and tenant registration must work before any tenant is known). See
 * ADR-0005. Do NOT use this for ordinary business data; use TenantAwareEntity.
 */
export abstract class GlobalEntity {
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  public createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  public updatedAt!: Date;
}
