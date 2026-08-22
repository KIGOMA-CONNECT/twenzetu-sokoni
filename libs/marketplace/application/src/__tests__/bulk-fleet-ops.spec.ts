import { DataSource } from 'typeorm';
import { TenantId, EntityId } from '@afri-market/kernel';
import { BulkVerifyDriversUseCase } from '../lib/use-cases/fleet/bulk-verify-drivers.use-case';
import { BulkSetDriverStatusUseCase } from '../lib/use-cases/fleet/bulk-set-driver-status.use-case';
import { BulkAssignDeliveriesUseCase } from '../lib/use-cases/fleet/bulk-assign-deliveries.use-case';

const TENANT = 't-1';

const driverUser = (id: string) => ({
  id,
  role: 'driver',
  status: 'PENDING',
  tenantId: TenantId.create(TENANT),
});

describe('BulkVerifyDriversUseCase', () => {
  const build = () => {
    const dataSource = { query: jest.fn().mockResolvedValue([]) } as unknown as DataSource;
    const userRepo = {
      findById: jest.fn(async (id: EntityId) => driverUser(id.value)),
    };
    return { useCase: new BulkVerifyDriversUseCase(dataSource, userRepo as never), dataSource, userRepo };
  };

  it('activates drivers and stamps their vehicles as verified', async () => {
    const { useCase, dataSource } = build();
    const result = await useCase.execute(TENANT, ['d-1', 'd-2']);

    expect(result.verified).toBe(2);
    expect(result.failed).toBe(0);
    const usersUpdate = dataSource.query.mock.calls.find((c) => (c[0] as string).includes('UPDATE users'));
    expect(usersUpdate).toBeDefined();
    expect(usersUpdate![1]).toEqual(['d-1', TENANT]);
    const vehiclesUpdate = dataSource.query.mock.calls.filter((c) => (c[0] as string).includes('UPDATE vehicles'));
    expect(vehiclesUpdate).toHaveLength(2);
  });

  it('reports per-driver failures without aborting the batch', async () => {
    const { useCase, userRepo } = build();
    userRepo.findById.mockResolvedValueOnce(null);

    const result = await useCase.execute(TENANT, ['missing', 'd-2']);

    expect(result.verified).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.results[0].success).toBe(false);
    expect(result.results[0].error).toContain('not found');
    expect(result.results[1].success).toBe(true);
  });

  it('rejects ids that belong to another tenant or role', async () => {
    const { useCase, userRepo } = build();
    userRepo.findById.mockResolvedValueOnce({
      role: 'customer',
      tenantId: TenantId.create(TENANT),
    });

    const result = await useCase.execute(TENANT, ['not-a-driver']);
    expect(result.failed).toBe(1);
    expect(result.verified).toBe(0);
  });
});

describe('BulkSetDriverStatusUseCase', () => {
  const build = () => {
    const dataSource = { query: jest.fn().mockResolvedValue([]) } as unknown as DataSource;
    const userRepo = {
      findById: jest.fn(async (id: EntityId) => driverUser(id.value)),
    };
    return { useCase: new BulkSetDriverStatusUseCase(dataSource, userRepo as never), dataSource };
  };

  it('rejects unsupported statuses', async () => {
    const { useCase } = build();
    await expect(useCase.execute(TENANT, ['d-1'], 'BANNED')).rejects.toThrow('Status must be one of');
  });

  it('suspends drivers and takes their vehicles offline', async () => {
    const { useCase, dataSource } = build();
    const result = await useCase.execute(TENANT, ['d-1'], 'SUSPENDED');

    expect(result.updated).toBe(1);
    const vehiclesUpdate = dataSource.query.mock.calls.find((c) => (c[0] as string).includes('UPDATE vehicles'));
    expect(vehiclesUpdate).toBeDefined();
    expect((vehiclesUpdate![0] as string)).toContain('is_available = FALSE');
  });
});

describe('BulkAssignDeliveriesUseCase', () => {
  const build = (driverRows: Array<{ id: string }>, loadRows: Array<{ driver_id: string; active: string }> = []) => {
    const dataSource = {
      query: jest.fn(async (sql: string) => {
        if (sql.includes('FROM users')) return driverRows;
        if (sql.includes('FROM deliveries')) return loadRows;
        return [];
      }),
    } as unknown as DataSource;
    const assignDriver = { execute: jest.fn() };
    return { useCase: new BulkAssignDeliveriesUseCase(dataSource, assignDriver as never), assignDriver };
  };

  it('spreads orders across drivers least-loaded first', async () => {
    // d-1 has 1 active delivery, d-2 has none -> first order goes to d-2.
    const { useCase, assignDriver } = build(
      [{ id: 'd-1' }, { id: 'd-2' }],
      [{ driver_id: 'd-1', active: '1' }],
    );
    assignDriver.execute.mockImplementation(async (_t: string, _o: string, driverId: string) => ({
      deliveryId: `del-${driverId}`,
      orderId: _o,
      driverId,
      tenantId: _t,
      vendorName: 'V',
      deliveryAddress: 'A',
    }));

    const result = await useCase.execute(TENANT, ['o-1', 'o-2']);

    expect(result.assigned).toBe(2);
    expect(assignDriver.execute.mock.calls[0][2]).toBe('d-2'); // least loaded first
    expect(assignDriver.execute.mock.calls[1][2]).toBe('d-1'); // then re-ranked
  });

  it('isolates per-order failures and keeps assigning the rest', async () => {
    const { useCase, assignDriver } = build([{ id: 'd-1' }]);
    assignDriver.execute
      .mockRejectedValueOnce(new Error('A delivery already exists for this order'))
      .mockResolvedValue({ deliveryId: 'del-2', orderId: 'o-2', driverId: 'd-1', tenantId: TENANT, vendorName: 'V', deliveryAddress: 'A' });

    const result = await useCase.execute(TENANT, ['o-1', 'o-2']);

    expect(result.assigned).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.results[0].success).toBe(false);
    expect(result.results[0].error).toContain('already exists');
    expect(result.results[1].success).toBe(true);
  });

  it('fails fast when no drivers are available', async () => {
    const { useCase, assignDriver } = build([]);
    await expect(useCase.execute(TENANT, ['o-1'])).rejects.toThrow('No available drivers');
    expect(assignDriver.execute).not.toHaveBeenCalled();
  });
});
