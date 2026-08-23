import { CreateVendorUseCase } from '../lib/use-cases/vendor/create-vendor.use-case';
import { CreateVendorCommand } from '../lib/commands/create-vendor.command';
import { EntityId, TenantId } from '@afri-market/kernel';
import { Vendor } from '@afri-market/marketplace-domain';

describe('CreateVendorUseCase', () => {
  let useCase: CreateVendorUseCase;
  let mockVendorRepo: {
    findById: jest.Mock;
    save: jest.Mock;
    findByUserId: jest.Mock;
    findActiveByTenant: jest.Mock;
    findByCategory: jest.Mock;
    delete: jest.Mock;
    exists: jest.Mock;
  };

  const TENANT_ID = 'test-tenant';
  const USER_ID = 'user-789';

  beforeEach(() => {
    jest.clearAllMocks();

    mockVendorRepo = {
      findById: jest.fn(),
      save: jest.fn(),
      findByUserId: jest.fn(),
      findActiveByTenant: jest.fn(),
      findByCategory: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
    };

    useCase = new CreateVendorUseCase(mockVendorRepo);
  });

  const createCommand = () =>
    new CreateVendorCommand(
      USER_ID,
      'Mama Ntilie',
      'Best food in town',
      'food',
      12,
    );

  it('should create a vendor and return vendorId', async () => {
    mockVendorRepo.findByUserId.mockResolvedValue(null);
    mockVendorRepo.save.mockResolvedValue(undefined);

    const command = createCommand();
    const result = await useCase.execute(TENANT_ID, command);

    expect(result.vendorId).toBeDefined();
    expect(typeof result.vendorId).toBe('string');
    expect(result.vendorId.length).toBeGreaterThan(0);
    expect(mockVendorRepo.save).toHaveBeenCalledTimes(1);
    expect(mockVendorRepo.findByUserId).toHaveBeenCalledWith(USER_ID);
  });

  it('should throw if user already has vendor profile', async () => {
    const existingVendor = Vendor.reconstitute({
      id: EntityId.from('existing-vendor'),
      tenantId: TenantId.create(TENANT_ID),
      userId: EntityId.from(USER_ID),
      shopName: 'Existing Shop',
      description: 'Already exists',
      category: 'food',
      commissionRate: 10,
      status: 'ACTIVE',
      averageRating: 4.0,
      totalOrders: 50,
      version: 1,
    });
    mockVendorRepo.findByUserId.mockResolvedValue(existingVendor);

    const command = createCommand();

    await expect(useCase.execute(TENANT_ID, command)).rejects.toThrow(
      'User already has a vendor profile',
    );
    expect(mockVendorRepo.save).not.toHaveBeenCalled();
  });

  it('should pass correct props to Vendor.create', async () => {
    mockVendorRepo.findByUserId.mockResolvedValue(null);
    mockVendorRepo.save.mockResolvedValue(undefined);

    const command = createCommand();
    const result = await useCase.execute(TENANT_ID, command);

    expect(result.vendorId).toBeDefined();
    expect(mockVendorRepo.save).toHaveBeenCalledTimes(1);

    const savedVendor = mockVendorRepo.save.mock.calls[0][0] as Vendor;
    expect(savedVendor.shopName).toBe('Mama Ntilie');
    expect(savedVendor.description).toBe('Best food in town');
    expect(savedVendor.category).toBe('food');
    expect(savedVendor.commissionRate).toBe(10); // Platform default for 'food' category
    expect(savedVendor.status).toBe('PENDING');
    expect(savedVendor.tenantId.value).toBe(TENANT_ID);
    expect(savedVendor.userId.value).toBe(USER_ID);
  });
});
