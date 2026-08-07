import { GlobalEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'users' })
@Index(['phoneNumber'], { unique: true })
export class UserOrmEntity extends GlobalEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  public tenantId!: string;

  @Column({ name: 'phone_number', type: 'varchar', length: 15 })
  public phoneNumber!: string;

  @Column({ name: 'full_name', type: 'varchar', length: 100 })
  public fullName!: string;

  @Column({ type: 'varchar', length: 20 })
  public role!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  public passwordHash!: string;

  @Column({ type: 'varchar', length: 254, nullable: true })
  public email!: string | null;

  @Column({ type: 'varchar', length: 30, default: 'PENDING_VERIFICATION' })
  public status!: string;

  @Column({ type: 'integer', default: 1 })
  public version!: number;

  @Column({ type: 'text', nullable: true })
  public permissions!: string | null;

  @Column({ name: 'business_name', type: 'varchar', length: 150, nullable: true })
  public businessName!: string | null;

  @Column({ name: 'nin_or_reg_no', type: 'varchar', length: 64, nullable: true })
  public ninOrRegNo!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  public city!: string | null;

  @Column({ name: 'verification_risk_score', type: 'smallint', nullable: true })
  public verificationRiskScore!: number | null;

  @Column({ name: 'verification_document_status', type: 'varchar', length: 20, nullable: true })
  public verificationDocumentStatus!: string | null;

  @Column({ name: 'rejection_reason', type: 'varchar', length: 500, nullable: true })
  public rejectionReason!: string | null;

  @Column({ name: 'verified_at', type: 'timestamp', nullable: true })
  public verifiedAt!: Date | null;
}
