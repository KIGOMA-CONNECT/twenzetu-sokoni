import axios from 'axios';

describe('GET /api/health', () => {
  it('reports liveness without requiring a tenant context', async () => {
    const res = await axios.get('/api/health');

    expect(res.status).toBe(200);
    expect(res.data).toEqual({
      success: true,
      data: { status: 'ok' },
      meta: { timestamp: expect.any(String) },
    });
  });
});

describe('GET /api/health/db', () => {
  it('confirms live database connectivity', async () => {
    const res = await axios.get('/api/health/db');

    expect(res.status).toBe(200);
    expect(res.data).toEqual({
      success: true,
      data: { status: 'ok', database: 'reachable' },
      meta: { timestamp: expect.any(String) },
    });
  });
});
