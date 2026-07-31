import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EntityManager } from 'typeorm';
import * as request from 'supertest';
import { CatalogController } from '@afri-market/marketplace-api';
import { MOCK_JWT_PAYLOAD } from './test-helper';

describe('Catalog E2E', () => {
  let app: INestApplication;
  const queryMock = jest.fn();

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CatalogController],
      providers: [
        { provide: EntityManager, useValue: { query: queryMock } },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = MOCK_JWT_PAYLOAD;
          return true;
        },
      })
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => queryMock.mockReset());

  function withHeaders() {
    return {
      Authorization: 'Bearer test',
      'x-tenant-id': MOCK_JWT_PAYLOAD.tenantId,
    };
  }

  it('should return matches, total/matched counts and unmatched items', async () => {
    queryMock.mockResolvedValue([
      {
        id: 'p1',
        name: 'Nyanya (Tomatoes 1kg)',
        description: 'Fresh tomatoes',
        price: '1500.00',
        currency: 'TZS',
        unit: 'pcs',
        imageUrl: null,
        categoryId: 'd1',
        vendorId: 'v1',
        vendorName: 'Dar Fresh Market',
        vendorRating: '4.8',
      },
    ]);

    const res = await request(app.getHttpServer())
      .post('/api/catalog/match')
      .set(withHeaders())
      .send({ items: ['nyanya'] })
      .expect(201);

    expect(res.body.totalItems).toBe(1);
    expect(res.body.matchedItems).toBe(1);
    expect(res.body.unmatched).toEqual([]);
    expect(res.body.results).toHaveLength(1);
    expect(res.body.results[0].query).toBe('nyanya');
    expect(res.body.results[0].matches).toHaveLength(1);
    expect(res.body.results[0].matches[0]).toMatchObject({
      id: 'p1',
      name: 'Nyanya (Tomatoes 1kg)',
      vendorName: 'Dar Fresh Market',
    });
  });

  it('should expand Swahili aliases (nyanya -> tomato) in the query params', async () => {
    queryMock.mockResolvedValue([]);

    await request(app.getHttpServer())
      .post('/api/catalog/match')
      .set(withHeaders())
      .send({ items: ['nyanya'] })
      .expect(201);

    expect(queryMock).toHaveBeenCalledTimes(1);
    const params = queryMock.mock.calls[0][1] as string[];
    expect(params).toContain('%nyanya%');
    expect(params).toContain('%tomato%');
  });

  it('should list items with no matches under unmatched and count them out of matchedItems', async () => {
    queryMock.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    const res = await request(app.getHttpServer())
      .post('/api/catalog/match')
      .set(withHeaders())
      .send({ items: ['nyanya', 'sabuni'] })
      .expect(201);

    expect(res.body.totalItems).toBe(2);
    expect(res.body.matchedItems).toBe(0);
    expect(res.body.unmatched).toEqual(['nyanya', 'sabuni']);
  });

  it('should reject an empty items list', async () => {
    await request(app.getHttpServer())
      .post('/api/catalog/match')
      .set(withHeaders())
      .send({ items: [] })
      .expect(400);
  });
});
