import { TenantAwareEntity } from '@afri-market/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'partner_kycs' })
@Index(['partnerId'])
export class PartnerKycOrmEntity extends TenantAwareEntity {
  @Column({ name: 'partner_id', type: 'uuid' }) public partnerId!: string;
  @Column({ name: 'partner_type', type: 'varchar', length: 20 }) public partnerType!: string;
  @Column({ name: 'phone_number', type: 'varchar', length: 15 }) public phoneNumber!: string;
  @Column({ type: 'varchar', length: 20, default: 'PENDING' }) public status!: string;
  @Column({ name: 'nida_number', type: 'varchar', length: 20, nullable: true }) public nidaNumber!: string | null;
  @Column({ name: 'tin_number', type: 'varchar', length: 20, nullable: true }) public tinNumber!: string | null;
  @Column({ name: 'license_number', type: 'varchar', length: 30, nullable: true }) public licenseNumber!: string | null;
  @Column({ name: 'nida_photo_url', type: 'text', nullable: true }) public nidaPhotoUrl!: string | null;
  @Column({ name: 'selfie_photo_url', type: 'text', nullable: true }) public selfiePhotoUrl!: string | null;
  @Column({ name: 'face_match_score', type: 'decimal', precision: 5, scale: 2, nullable: true }) public faceMatchScore!: number | null;
  @Column({ name: 'ocr_extracted_data', type: 'jsonb', nullable: true }) public ocrExtractedData!: Record<string, unknown> | null;
  @Column({ name: 'gps_latitude', type: 'decimal', precision: 10, scale: 7, nullable: true }) public gpsLatitude!: number | null;
  @Column({ name: 'gps_longitude', type: 'decimal', precision: 10, scale: 7, nullable: true }) public gpsLongitude!: number | null;
  @Column({ name: 'rejection_reason', type: 'text', nullable: true }) public rejectionReason!: string | null;
  @Column({ name: 'verified_at', type: 'timestamptz', nullable: true }) public verifiedAt!: Date | null;
  @Column({ type: 'integer', default: 1 }) public version!: number;
}
