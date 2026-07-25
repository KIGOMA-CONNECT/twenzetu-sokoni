import { AppConfigService } from '@afri-market/core-config';
import { GlobalExceptionFilter } from '@afri-market/core-exceptions';
import { ResponseInterceptor, RequestLoggingInterceptor } from '@afri-market/core-http';
import { AppLoggerService } from '@afri-market/core-logger';
import { applySecurityHardening, RequestIdInterceptor } from '@afri-market/core-security';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
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
  app.useGlobalInterceptors(new RequestIdInterceptor(), new ResponseInterceptor(), new RequestLoggingInterceptor(logger));
  app.enableShutdownHooks();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('afriMarket API')
    .setDescription('Pan-African Hyperlocal Multi-Service Aggregator & Universal Procurement Platform')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Enter JWT token' },
      'jwt-auth',
    )
    .addSecurityRequirements('jwt-auth')
    .addTag('Vendors', 'Vendor onboarding, profiles, and management')
    .addTag('Products', 'Product catalog and inventory')
    .addTag('Orders', 'Order placement, tracking, and management')
    .addTag('Deliveries', 'Delivery assignment, tracking, and completion')
    .addTag('Reviews', 'Customer reviews and ratings')
    .addTag('Procurement', 'Universal procurement and vendor quotes')
    .addTag('Disputes', 'Dispute filing and resolution')
    .addTag('Surge Pricing', 'Dynamic surge pricing rules and calculation')
    .addTag('Loyalty', 'Loyalty points, tiers, and redemption')
    .addTag('KYC', 'Partner KYC submission and verification')
    .addTag('Points of Interest', 'Hyperlocal POI indexing')
    .addTag('Finance', 'Micro-loans and credit scoring')
    .addTag('B2B', 'Bulk orders and B2B sourcing')
    .addTag('Agents', 'Field agent registration and earnings')
    .addTag('Wallets', 'Vendor/driver wallet balances')
    .addTag('Payments', 'Payment escrow, release, and history')
    .addTag('Used Goods', 'Second-hand goods marketplace')
    .addTag('Auth', 'Authentication, OTP, and JWT')
    .addTag('Admin', 'Platform administration and moderation')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  await app.listen(config.app.port);
  logger.log(`Application listening on port ${config.app.port}`, 'Bootstrap');
  logger.log(`Swagger docs at http://localhost:${config.app.port}/docs`, 'Bootstrap');
}

bootstrap();
