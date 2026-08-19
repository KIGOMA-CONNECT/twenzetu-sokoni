import { DeliveryRouteEstimator } from '../lib/services/delivery-route-estimator';
import { GoogleMapsService } from '@afri-market/integrations';

describe('DeliveryRouteEstimator', () => {
  let estimator: DeliveryRouteEstimator;
  let mockDataSource: { query: jest.Mock };
  let mockMaps: { routeDistanceKm: jest.Mock };

  const DELIVERY_ID = 'delivery-1';
  const ORIGIN = { latitude: -6.7924, longitude: 39.2083 };
  const DESTINATION = { latitude: -6.8229, longitude: 39.2703 };

  beforeEach(() => {
    mockDataSource = { query: jest.fn().mockResolvedValue([]) };
    mockMaps = { routeDistanceKm: jest.fn() };
    estimator = new DeliveryRouteEstimator(
      mockDataSource as unknown as import('typeorm').DataSource,
      mockMaps as unknown as GoogleMapsService,
    );
  });

  it('persists the Google Distance Matrix estimate when available', async () => {
    mockMaps.routeDistanceKm.mockResolvedValue({ distanceKm: 8.4, durationMinutes: 25 });

    await estimator.estimateAndPersist(DELIVERY_ID, ORIGIN, DESTINATION);

    expect(mockMaps.routeDistanceKm).toHaveBeenCalledWith(ORIGIN, DESTINATION);
    expect(mockDataSource.query).toHaveBeenCalledWith(
      'UPDATE deliveries SET distance_km = $1, estimated_time_minutes = $2, updated_at = NOW() WHERE id = $3',
      [8.4, 25, DELIVERY_ID],
    );
  });

  it('falls back to haversine when Maps is unavailable or fails', async () => {
    mockMaps.routeDistanceKm.mockResolvedValue(null);

    await estimator.estimateAndPersist(DELIVERY_ID, ORIGIN, DESTINATION);

    const [, params] = mockDataSource.query.mock.calls[0] as [string, unknown[]];
    const [distanceKm, durationMinutes] = params as [number, number];
    expect(distanceKm).toBeGreaterThan(0);
    expect(distanceKm).toBeLessThan(20);
    expect(durationMinutes).toBeGreaterThanOrEqual(1);
    expect(mockDataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE deliveries SET distance_km'),
      expect.arrayContaining([DELIVERY_ID]),
    );
  });

  it('does nothing when coordinates are missing', async () => {
    await estimator.estimateAndPersist(
      DELIVERY_ID,
      { latitude: 0, longitude: 0 },
      { latitude: Number.NaN, longitude: 39.2703 },
    );

    expect(mockMaps.routeDistanceKm).not.toHaveBeenCalled();
    expect(mockDataSource.query).not.toHaveBeenCalled();
  });

  it('never throws when the Maps request rejects', async () => {
    mockMaps.routeDistanceKm.mockRejectedValue(new Error('network down'));

    await expect(estimator.estimateAndPersist(DELIVERY_ID, ORIGIN, DESTINATION)).resolves.toBeUndefined();
    expect(mockDataSource.query).toHaveBeenCalledTimes(1);
  });
});
