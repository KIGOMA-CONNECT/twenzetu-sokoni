import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueueService } from './queue.service';
import { OrderProcessor } from './processors/order.processor';
import { PaymentProcessor } from './processors/payment.processor';
import { NotificationProcessor } from './processors/notification.processor';
import { AuditProcessor } from './processors/audit.processor';
import { AuditLogEntity } from './entities/audit-log.entity';

const REDIS_URL = process.env['REDIS_URL'] || 'redis://localhost:6379';

@Global()
@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        url: REDIS_URL,
        maxRetriesPerRequest: 3,
      },
    }),
    BullModule.registerQueue(
      { name: 'orders' },
      { name: 'payments' },
      { name: 'notifications' },
      { name: 'audit' },
    ),
    TypeOrmModule.forFeature([AuditLogEntity]),
  ],
  providers: [
    QueueService,
    OrderProcessor,
    PaymentProcessor,
    NotificationProcessor,
    AuditProcessor,
  ],
  exports: [BullModule, QueueService],
})
export class QueueModule {}
