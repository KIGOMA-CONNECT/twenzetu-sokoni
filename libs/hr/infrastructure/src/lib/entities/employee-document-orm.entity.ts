import { TenantAwareEntity } from '@abms/database';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'employee_document' })
@Index(['tenantId', 'employeeId'])
export class EmployeeDocumentOrmEntity extends TenantAwareEntity {
  @Column({ name: 'employee_id', type: 'uuid' })
  public employeeId!: string;

  @Column({ name: 'document_type', type: 'varchar', length: 32 })
  public documentType!: string;

  @Column({ name: 'file_name', type: 'varchar', length: 255 })
  public fileName!: string;

  @Column({ name: 'file_url', type: 'text' })
  public fileUrl!: string;

  @Column({ name: 'uploaded_by_user_id', type: 'uuid' })
  public uploadedByUserId!: string;

  @Column({ name: 'uploaded_at', type: 'timestamptz' })
  public uploadedAt!: Date;
}
