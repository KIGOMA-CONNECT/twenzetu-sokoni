import { INestApplication } from '@nestjs/common';
import helmet from 'helmet';
import { AppConfigService } from '@afri-market/core-config';

export function applySecurityHardening(app: INestApplication, config: AppConfigService): void {
  app.use(helmet());
  app.enableCors({
    origin: config.cors.origins,
    credentials: true,
  });
}
