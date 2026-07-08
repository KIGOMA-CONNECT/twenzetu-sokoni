import { Controller, Get } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Controller('health')
export class HealthController {
  public constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Get()
  public checkLiveness(): { status: string } {
    return { status: 'ok' };
  }

  @Get('db')
  public async checkDatabase(): Promise<{ status: string; database: string }> {
    // Deliberate exception to "never query outside a tenant-scoped unit of work": a non-tenant-scoped diagnostic round trip only.
    await this.dataSource.query('SELECT 1');
    return { status: 'ok', database: 'reachable' };
  }
}
