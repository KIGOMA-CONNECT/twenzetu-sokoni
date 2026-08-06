import { config as loadEnv } from 'dotenv';
loadEnv();
import { AppConfigService } from '@afri-market/core-config';
import { GlobalExceptionFilter } from '@afri-market/core-exceptions';
import { ResponseInterceptor, RequestLoggingInterceptor } from '@afri-market/core-http';
import { AppLoggerService } from '@afri-market/core-logger';
import { applySecurityHardening, RequestIdInterceptor } from '@afri-market/core-security';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Request, Response, NextFunction } from 'express';
import { join, resolve } from 'path';
import { readFileSync, existsSync, statSync } from 'fs';
import { AppModule } from './app/app.module';

const webDir = join(__dirname, '..', '..', '..', '..', 'apps', 'web');
let webIndex: string | null = null;
try {
  webIndex = readFileSync(join(webDir, 'index.html'), 'utf-8');
} catch {
  webIndex = null;
}

async function bootstrap(): Promise<void> {
  console.log('[Bootstrap] Creating Nest application...');
  const app = await NestFactory.create(AppModule);
  console.log('[Bootstrap] Nest application created');

  const config = app.get(AppConfigService);
  console.log('[Bootstrap] AppConfigService retrieved');
  const logger = app.get(AppLoggerService);
  console.log('[Bootstrap] AppLoggerService retrieved');
  app.useLogger(logger);
  console.log('[Bootstrap] Logger set');

  applySecurityHardening(app, config);
  console.log('[Bootstrap] Security hardening applied');

  const isProduction = (config.app.env ?? process.env.NODE_ENV ?? 'development') === 'production';
  if (isProduction) {
    const requiredEnvs: Record<string, string | undefined> = {
      JWT_SECRET: process.env.JWT_SECRET,
      PAYMENT_CONFIRM_SECRET: process.env.PAYMENT_CONFIRM_SECRET,
      WEBHOOK_INTERNAL_SECRET: process.env.WEBHOOK_INTERNAL_SECRET,
      METRICS_SECRET: process.env.METRICS_SECRET,
    };
    const missing = Object.entries(requiredEnvs)
      .filter(([, v]) => !v)
      .map(([k]) => k);
    if (missing.length) {
      const msg = `[Bootstrap FATAL] Missing critical production secrets: ${missing.join(', ')}`;
      console.error(msg);
      await app.close();
      process.exit(1);
    }
    console.log('[Bootstrap] Production secret validation passed');
  }

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/health') || req.path.startsWith('/metrics') || req.path.startsWith('/docs') || req.path.startsWith('/swagger')) {
      return next();
    }
    if (webIndex === null) {
      return res.status(404).send('Not found');
    }
    const assetPath = join(webDir, req.path === '/' ? 'index.html' : req.path);
    const resolvedAssetPath = resolve(assetPath);
    if (!resolvedAssetPath.startsWith(resolve(webDir)) && resolvedAssetPath !== resolve(join(webDir, 'index.html'))) {
      return res.status(403).send('Forbidden');
    }
    if (existsSync(resolvedAssetPath) && statSync(resolvedAssetPath).isFile()) {
      const ext = resolvedAssetPath.split('.').pop()?.toLowerCase() || '';
      const mime: Record<string, string> = {
        js: 'application/javascript', css: 'text/css', html: 'text/html',
        svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg',
        jpeg: 'image/jpeg', gif: 'image/gif', ico: 'image/x-icon',
        json: 'application/json', webp: 'image/webp', txt: 'text/plain',
        wasm: 'application/wasm', map: 'application/json',
      };
      res.type(mime[ext] || 'application/octet-stream').send(readFileSync(resolvedAssetPath));
      return;
    }
    res.type('html').send(webIndex);
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter(logger));
  app.useGlobalInterceptors(new RequestIdInterceptor(), new ResponseInterceptor(), new RequestLoggingInterceptor(logger));
  app.enableShutdownHooks();
  console.log('[Bootstrap] Pipes, filters, interceptors configured');

  const nodeEnv = config.app.env ?? process.env.NODE_ENV ?? 'development';
  const swaggerEnabled =
    nodeEnv !== 'production' && (process.env.SWAGGER_ENABLED === undefined || process.env.SWAGGER_ENABLED === 'true');
  if (swaggerEnabled) {
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
    console.log(`[Bootstrap] Swagger UI available at /docs (disabled in production)`);
  } else {
    console.log('[Bootstrap] Swagger disabled');
  }

  console.log('[Bootstrap] Starting to listen on port', config.app.port);
  await app.listen(config.app.port);
  console.log(`[Bootstrap] Application listening on port ${config.app.port}`);
}

bootstrap().catch((err) => {
  console.error('[Bootstrap FATAL]', err);
  process.exit(1);
});
