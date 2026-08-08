import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogEntity } from '@afri-market/core-audit';
import { AuditJobData } from '../queue.service';

@Processor('audit')
export class AuditProcessor extends WorkerHost {
  private readonly logger = new Logger(AuditProcessor.name);

  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly auditRepo: Repository<AuditLogEntity>,
  ) {
    super();
  }

  async process(job: Job<AuditJobData>): Promise<void> {
    this.logger.debug(`Processing audit job ${job.id}: ${job.data.action} on ${job.data.entity}`);

    try {
      const record = this.auditRepo.create({
        tenantId: job.data.tenantId,
        userId: job.data.userId,
        action: job.data.action,
        entity: job.data.entity,
        entityId: job.data.entityId,
        oldData: job.data.oldData,
        newData: job.data.newData,
        ipAddress: job.data.ipAddress,
        userAgent: job.data.userAgent,
        status: 'success',
        immutable: true,
      });

      await this.auditRepo.save(record);
      this.logger.debug(`Audit job ${job.id} completed`);
    } catch (error) {
      this.logger.error(`Audit job ${job.id} failed: ${error}`);
      throw error;
    }
  }
}
