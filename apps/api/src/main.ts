import { AppConfigService } from '@abms/core-config';
import { GlobalExceptionFilter } from '@abms/core-exceptions';
import { ResponseInterceptor } from '@abms/core-http';
import { AppLoggerService } from '@abms/core-logger';
import { applySecurityHardening } from '@abms/core-security';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const config = app.get(AppConfigService);
  const logger = app.get(AppLoggerService);
  app.useLogger(logger);

  applySecurityHardening(app, config);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter(logger));
  app.useGlobalInterceptors(new ResponseInterceptor());

  await app.listen(config.app.port);
  logger.log(`Application listening on port ${config.app.port}`, 'Bootstrap');
}

bootstrap();
