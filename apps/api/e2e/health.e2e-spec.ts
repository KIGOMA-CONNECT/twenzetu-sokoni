import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { HealthController } from '../src/app/health/health.controller';
import { DataSource } from 'typeorm';

describe('Health E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const mockDataSource = {
      query: jest.fn().mockResolvedValue([{ '?column?:': 1 }]),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/health should return ok', async () => {
    const res = await request(app.getHttpServer()).get('/api/health').expect(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('afriMarket API');
    expect(res.body.database.status).toBe('ok');
    expect(res.body.database.latencyMs).toBeGreaterThanOrEqual(0);
    expect(res.body.timestamp).toBeDefined();
  });

  it('GET /api/health should return degraded when DB fails', async () => {
    const mockFailingDataSource = {
      query: jest.fn().mockRejectedValue(new Error('Connection refused')),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: DataSource, useValue: mockFailingDataSource },
      ],
    }).compile();

    const failingApp = module.createNestApplication();
    failingApp.setGlobalPrefix('api');
    await failingApp.init();

    const res = await request(failingApp.getHttpServer()).get('/api/health').expect(200);
    expect(res.body.status).toBe('degraded');
    expect(res.body.database.status).toBe('error');

    await failingApp.close();
  });
});
