import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DataSource } from 'typeorm';

@Injectable()
export class PosShiftAutoCloseService {
  private readonly logger = new Logger(PosShiftAutoCloseService.name);

  constructor(private readonly dataSource: DataSource) {}

  @Cron('59 20 * * *', { waitForCompletion: true })
  async handleAutoCloseShifts(): Promise<void> {
    const result = await this.dataSource.query(
      `UPDATE pos_shifts
       SET status = 'CLOSED',
           closed_at = NOW(),
           closing_cash = total_sales,
           expected_cash = opening_float + total_sales,
           cash_variance = 0,
           notes = COALESCE(notes || E'\n', '') || 'Auto-closed at end of day (' || NOW()::text || ')',
           version = version + 1,
           updated_at = NOW()
       WHERE status = 'OPEN'
       RETURNING id, shift_number, vendor_id, total_sales`,
    );

    const affected = Array.isArray(result) ? result.length : 0;
    if (affected > 0) {
      this.logger.log(
        `Auto-closed ${affected} open POS shift(s): ${result.map((r: any) => r.shift_number).join(', ')}`,
      );
    }
  }
}
