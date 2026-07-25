import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { MarketplaceModule } from '../lib/marketplace.module';
import { MarketplaceApplicationModule } from '@afri-market/marketplace-application';

describe('Marketplace API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [MarketplaceModule],
    })
      .overrideProvider(MarketplaceApplicationModule)
      .useValue({})
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  }, 30000);

  afterAll(async () => {
    await app?.close();
  });

  it('/api/surge/calculate should return surge calculation', () => {
    return request(app.getHttpServer())
      .get('/api/surge/calculate?baseFare=1000&distanceKm=5&perKmRate=200&durationMinutes=15&perMinuteRate=50')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('totalFare');
        expect(res.body).toHaveProperty('surgeMultiplier');
        expect(res.body).toHaveProperty('breakdown');
      });
  });

  it('/api/poi/nearby should return nearby POIs', () => {
    return request(app.getHttpServer())
      .get('/api/poi/nearby?lat=-1.9403&lng=29.8739&radiusKm=5')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('data');
        expect(Array.isArray(res.body.data)).toBe(true);
      });
  });

  it('/api/reviews/vendor/fake-id should return reviews array', () => {
    return request(app.getHttpServer())
      .get('/api/reviews/vendor/fake-id')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('data');
      });
  });
});
