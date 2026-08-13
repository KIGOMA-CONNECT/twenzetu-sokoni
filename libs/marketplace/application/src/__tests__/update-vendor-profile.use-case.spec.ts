import { UpdateVendorProfileUseCase } from '../lib/use-cases/vendor/update-vendor-profile.use-case';
import { UpdateVendorProfileCommand } from '../lib/commands/update-vendor-profile.command';
import { EntityId, TenantId } from '@afri-market/kernel';
import { Vendor } from '@afri-market/marketplace-domain';

describe('UpdateVendorProfileUseCase', () => {
  let useCase: UpdateVendorProfileUseCase;
  let mockVendorRepo: {
    findById: jest.Mock;
    save: jest.Mock;
  };

  const TENANT_ID = 'test-tenant';
  const VENDOR_ID = 'vendor-123';

  const makeVendor = (overrides: Partial<Parameters<typeof Vendor.reconstitute>[0]> = {}) =>
    Vendor.reconstitute({
      id: EntityId.from(VENDOR_ID),
      tenantId: TenantId.create(TENANT_ID),
      userId: EntityId.from('user-789'),
      shopName: 'Mama Ntilie',
      description: 'Best food in town',
      category: 'food',
      commissionRate: 12,
      status: 'ACTIVE',
      averageRating: 4.2,
      totalOrders: 10,
      version: 1,
      ...overrides,
    });

  beforeEach(() => {
    jest.clearAllMocks();

    mockVendorRepo = {
      findById: jest.fn(),
      save: jest.fn(),
    };

    useCase = new UpdateVendorProfileUseCase(mockVendorRepo);
  });

  it('should update fields and save the vendor', async () => {
    mockVendorRepo.findById.mockResolvedValue(makeVendor());
    mockVendorRepo.save.mockResolvedValue(undefined);

    const command = new UpdateVendorProfileCommand(
      'New Shop Name',
      'New description',
      'grocery',
      6.5,
      39.2,
    );

    const result = await useCase.execute(VENDOR_ID, command);

    expect(result.vendorId).toBe(VENDOR_ID);
    expect(mockVendorRepo.findById).toHaveBeenCalledWith(EntityId.from(VENDOR_ID));
    expect(mockVendorRepo.save).toHaveBeenCalledTimes(1);

    const saved = mockVendorRepo.save.mock.calls[0][0] as Vendor;
    expect(saved.shopName).toBe('New Shop Name');
    expect(saved.description).toBe('New description');
    expect(saved.category).toBe('grocery');
    expect(saved.latitude).toBe(6.5);
    expect(saved.longitude).toBe(39.2);
  });

  it('should leave fields unchanged when not provided', async () => {
    mockVendorRepo.findById.mockResolvedValue(makeVendor());
    mockVendorRepo.save.mockResolvedValue(undefined);

    const command = new UpdateVendorProfileCommand('Only Name');

    await useCase.execute(VENDOR_ID, command);

    const saved = mockVendorRepo.save.mock.calls[0][0] as Vendor;
    expect(saved.shopName).toBe('Only Name');
    expect(saved.description).toBe('Best food in town');
    expect(saved.category).toBe('food');
    expect(saved.commissionRate).toBe(12);
  });

  it('should throw NotFoundException when vendor does not exist', async () => {
    mockVendorRepo.findById.mockResolvedValue(null);

    const command = new UpdateVendorProfileCommand('Anything');

    await expect(useCase.execute(VENDOR_ID, command)).rejects.toThrow('Vendor profile not found');
    expect(mockVendorRepo.save).not.toHaveBeenCalled();
  });

  it('should reject an invalid category', async () => {
    mockVendorRepo.findById.mockResolvedValue(makeVendor());

    const command = new UpdateVendorProfileCommand(undefined, undefined, 'not-a-real-category');

    await expect(useCase.execute(VENDOR_ID, command)).rejects.toThrow('Invalid vendor category');
    expect(mockVendorRepo.save).not.toHaveBeenCalled();
  });
});
