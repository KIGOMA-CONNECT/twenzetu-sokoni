import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CountrySmsRouterService } from '@afri-market/integrations';

@Injectable()
export class SmsCreditsService {
  private readonly logger = new Logger(SmsCreditsService.name);

  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly smsRouter: CountrySmsRouterService,
  ) {}

  async getCredits(tenantId: string, vendorId: string) {
    const rows = await this.ds.query(
      `SELECT * FROM sms_credits WHERE tenant_id = $1 AND vendor_id = $2 LIMIT 1`,
      [tenantId, vendorId],
    );
    if (rows.length === 0) {
      await this.ds.query(
        `INSERT INTO sms_credits (id, tenant_id, vendor_id, total_credits, used_credits, available_credits, total_spent, currency, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, 0, 0, 0, 0, 'TZS', NOW(), NOW())`,
        [tenantId, vendorId],
      );
      return { totalCredits: 0, usedCredits: 0, availableCredits: 0, totalSpent: 0, currency: 'TZS' };
    }
    return rows[0];
  }

  async purchaseCredits(tenantId: string, vendorId: string, credits: number, amount: number) {
    if (!credits || credits <= 0) {
      throw new BadRequestException('Credits must be a positive number');
    }
    if (!amount || amount <= 0) {
      throw new BadRequestException('Amount must be a positive number');
    }

    await this.getCredits(tenantId, vendorId);

    await this.ds.query(
      `UPDATE sms_credits
       SET total_credits = total_credits + $1,
           available_credits = available_credits + $1,
           total_spent = total_spent + $2,
           updated_at = NOW()
       WHERE tenant_id = $3 AND vendor_id = $4`,
      [credits, amount, tenantId, vendorId],
    );

    this.logger.log(`Vendor ${vendorId} purchased ${credits} SMS credits for ${amount} TZS`);
    return { credits, amount, totalAvailable: (await this.getCredits(tenantId, vendorId)).availableCredits };
  }

  async sendSms(tenantId: string, vendorId: string, recipientPhone: string, message: string, recipientType: string = 'other') {
    const credits = await this.getCredits(tenantId, vendorId);
    const smsCount = Math.ceil(message.length / 160);

    if (credits.availableCredits < smsCount) {
      throw new BadRequestException(
        `SMS credits insufficient. You have ${credits.availableCredits} credits, need ${smsCount}. Buy more credits or use phone SMS.`,
      );
    }

    await this.ds.query(
      `UPDATE sms_credits
       SET used_credits = used_credits + $1,
           available_credits = available_credits - $1,
           updated_at = NOW()
       WHERE tenant_id = $2 AND vendor_id = $3`,
      [smsCount, tenantId, vendorId],
    );

    const result = await this.smsRouter.send({
      to: recipientPhone,
      message,
      tenantId,
    });

    await this.ds.query(
      `INSERT INTO sms_logs (id, tenant_id, vendor_id, recipient_phone, recipient_type, message, message_length, credits_used, source, status, provider, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, 'credits', $8, $9, NOW(), NOW())`,
      [tenantId, vendorId, recipientPhone, recipientType, message, message.length, smsCount, result.success ? 'sent' : 'failed', result.provider],
    );

    if (!result.success) {
      await this.ds.query(
        `UPDATE sms_credits
         SET used_credits = used_credits - $1,
             available_credits = available_credits + $1,
             updated_at = NOW()
         WHERE tenant_id = $2 AND vendor_id = $3`,
        [smsCount, tenantId, vendorId],
      );
      throw new BadRequestException(`SMS delivery failed: ${result.provider}`);
    }

    return { success: true, creditsUsed: smsCount, remainingCredits: credits.availableCredits - smsCount, messageId: result.messageId };
  }

  async getLogs(tenantId: string, vendorId: string, limit: number = 50, offset: number = 0) {
    const [data, total] = await Promise.all([
      this.ds.query(
        `SELECT * FROM sms_logs WHERE tenant_id = $1 AND vendor_id = $2 ORDER BY created_at DESC LIMIT $3 OFFSET $4`,
        [tenantId, vendorId, limit, offset],
      ),
      this.ds.query(
        `SELECT COUNT(*) as total FROM sms_logs WHERE tenant_id = $1 AND vendor_id = $2`,
        [tenantId, vendorId],
      ),
    ]);
    return { data, total: parseInt(total[0]?.total ?? '0') };
  }
}
