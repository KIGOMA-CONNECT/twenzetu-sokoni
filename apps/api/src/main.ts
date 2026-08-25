import { config as loadEnv } from 'dotenv';
loadEnv();
import './sentry';
import { AppConfigService } from '@afri-market/core-config';
import { GlobalExceptionFilter } from '@afri-market/core-exceptions';
import { ResponseInterceptor, RequestLoggingInterceptor, RequestTimeoutInterceptor } from '@afri-market/core-http';
import { AppLoggerService } from '@afri-market/core-logger';
import { applySecurityHardening, RequestIdInterceptor } from '@afri-market/core-security';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Request, Response, NextFunction } from 'express';
import { join, resolve } from 'path';
import { readFileSync, existsSync, statSync } from 'fs';
import compression from 'compression';
import { FileUploadService } from '@afri-market/integrations';
import { AppModule } from './app/app.module';
import { QueryPerformanceInterceptor } from '@afri-market/database';

const webDir = join(__dirname, '..', '..', '..', '..', 'apps', 'web');
let webIndex: string | null = null;
try {
  webIndex = readFileSync(join(webDir, 'index.html'), 'utf-8');
} catch {
  webIndex = null;
}

async function bootstrap(): Promise<void> {
  new Logger('Bootstrap').log('Creating Nest application...');
  const app = await NestFactory.create(AppModule);
  new Logger('Bootstrap').log('Nest application created');

  app.use(compression({ threshold: 1024 }));

  const config = app.get(AppConfigService);
  const logger = app.get(AppLoggerService);
  app.useLogger(logger);

  applySecurityHardening(app, config);
  logger.log('Security hardening applied');

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
      logger.error(msg);
      await app.close();
      process.exit(1);
    }
    logger.log('Production secret validation passed');
  }

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api/uploads/') && req.method === 'GET') {
      try {
        const uploads = app.get(FileUploadService);
        const key = decodeURIComponent(req.path.replace(/^\/api\/uploads\//, ''));
        const fullPath = uploads.resolvePath(key);
        if (uploads.pathExists(key)) {
          const ext = fullPath.split('.').pop()?.toLowerCase() || '';
          const mime: Record<string, string> = {
            js: 'application/javascript', css: 'text/css', html: 'text/html',
            svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg',
            jpeg: 'image/jpeg', gif: 'image/gif', ico: 'image/x-icon',
            json: 'application/json', webp: 'image/webp', txt: 'text/plain',
            pdf: 'application/pdf',
          };
          res.type(mime[ext] || 'application/octet-stream');
          // Upload keys are content-addressed by unique folder/name — safe to
          // cache hard at the edge/browser and skip repeat bandwidth.
          res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
          res.send(readFileSync(fullPath));
          return;
        }
        return res.status(404).send('Not found');
      } catch {
        return res.status(400).send('Bad request');
      }
    }
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
      res.type(mime[ext] || 'application/octet-stream');
      if (ext === 'html') {
        // Never cache the SPA shell — deployments must be picked up instantly.
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      } else {
        // Vite emits content-hashed asset filenames — immutable caching is safe.
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
      res.send(readFileSync(resolvedAssetPath));
      return;
    }
    res.type('html');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(webIndex);
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter(logger));
  app.useGlobalInterceptors(new QueryPerformanceInterceptor(), new RequestIdInterceptor(), new ResponseInterceptor(), new RequestTimeoutInterceptor(), new RequestLoggingInterceptor(logger));
  app.enableShutdownHooks();
  logger.log('Pipes, filters, interceptors configured');

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
    logger.log('Swagger UI available at /docs (disabled in production)');
  } else {
    logger.log('Swagger disabled');
  }

  logger.log('Starting to listen on port ' + config.app.port);
  await app.listen(config.app.port);
  logger.log(`Application listening on port ${config.app.port}`);
}

bootstrap().catch((err) => {
  new Logger('Bootstrap').error('[Bootstrap FATAL] ' + (err?.message ?? err), err?.stack);
  process.exit(1);
});
