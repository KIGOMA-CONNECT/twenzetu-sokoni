import { AppConfigService } from '@abms/core-config';
import { INestApplication } from '@nestjs/common';
import helmet from 'helmet';

export function applySecurityHardening(app: INestApplication, config: AppConfigService): void {
  app.use(helmet());
  app.enableCors({
    // No origin allow-list configured yet (arrives with the API-gateway sprint), so production fails closed.
    origin: config.app.isProduction ? false : true,
    credentials: true,
  });
}
