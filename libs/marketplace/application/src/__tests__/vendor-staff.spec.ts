import { EntityId, TenantId, PhoneNumber } from '@afri-market/kernel';
import {
  Vendor,
  VendorMember,
  VendorStaffRole,
  ALL_VENDOR_PERMISSIONS,
  defaultPermissionsForVendorRole,
} from '@afri-market/marketplace-domain';
import { User } from '@afri-market/identity-domain';
import { InviteVendorStaffUseCase } from '../lib/use-cases/vendor-staff/invite-vendor-staff.use-case';
import { ListVendorStaffUseCase } from '../lib/use-cases/vendor-staff/list-vendor-staff.use-case';
import { UpdateVendorStaffUseCase } from '../lib/use-cases/vendor-staff/update-vendor-staff.use-case';
import { RemoveVendorStaffUseCase } from '../lib/use-cases/vendor-staff/remove-vendor-staff.use-case';
import { VendorAccessService } from '../lib/vendor-access/vendor-access.service';

const TENANT_ID = 'test-tenant';
const VENDOR_ID = 'vendor-1';
const OWNER_USER_ID = 'owner-user';
const STAFF_USER_ID = 'staff-user';

function makeVendor(userId: string = OWNER_USER_ID): Vendor {
  return Vendor.reconstitute({
    id: EntityId.from(VENDOR_ID),
    tenantId: TenantId.create(TENANT_ID),
    userId: EntityId.from(userId),
    shopName: 'Mama Ntilie',
    description: 'Best food in town',
    category: 'food',
    commissionRate: 12,
    status: 'ACTIVE',
    averageRating: 4.5,
    totalOrders: 10,
    version: 1,
  });
}

function makeMember(role: VendorStaffRole, status: 'ACTIVE' | 'INACTIVE' = 'ACTIVE'): VendorMember {
  return VendorMember.reconstitute({
    id: EntityId.from('member-1'),
    tenantId: TenantId.create(TENANT_ID),
    vendorId: EntityId.from(VENDOR_ID),
    userId: EntityId.from(STAFF_USER_ID),
    role,
    permissions: defaultPermissionsForVendorRole(role),
    status,
    version: 1,
  });
}

function makeUser(userId: string = STAFF_USER_ID): User {
  return User.reconstitute({
    id: EntityId.from(userId),
    tenantId: TenantId.create(TENANT_ID),
    phoneNumber: PhoneNumber.create('+255712345678'),
    fullName: 'Jane Staff',
    role: 'customer',
    passwordHash: 'hash',
    status: 'ACTIVE',
    version: 1,
  });
}

function memberRepoMock() {
  return {
    findById: jest.fn(),
    findByVendorId: jest.fn(),
    findByUserId: jest.fn(),
    findActiveByUserId: jest.fn(),
    findOneByVendorAndUser: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    exists: jest.fn(),
  };
}

function vendorRepoMock() {
  return {
    findById: jest.fn(),
    findByUserId: jest.fn(),
    save: jest.fn(),
    findActiveByTenant: jest.fn(),
    findByCategory: jest.fn(),
    delete: jest.fn(),
    exists: jest.fn(),
  };
}

function userRepoMock() {
  return {
    findById: jest.fn(),
    findByPhoneNumber: jest.fn(),
    findByEmail: jest.fn(),
    countByTenant: jest.fn(),
    findPendingVerifications: jest.fn(),
    save: jest.fn(),
  };
}

describe('VendorMember aggregate', () => {
  it('should default permissions to the role defaults on create', () => {
    const member = VendorMember.create({
      tenantId: TenantId.create(TENANT_ID),
      vendorId: EntityId.from(VENDOR_ID),
      userId: EntityId.from(STAFF_USER_ID),
      role: 'cashier',
    });
    expect(member.status).toBe('ACTIVE');
    expect(member.permissions).toEqual(defaultPermissionsForVendorRole('cashier'));
    expect(member.permissions).toContain('use_pos');
    expect(member.permissions).not.toContain('manage_products');
  });

  it('should reject invalid roles', () => {
    expect(() =>
      VendorMember.create({
        tenantId: TenantId.create(TENANT_ID),
        vendorId: EntityId.from(VENDOR_ID),
        userId: EntityId.from(STAFF_USER_ID),
        role: 'admin' as VendorStaffRole,
      }),
    ).toThrow();
  });

  it('should reset permissions when role changes', () => {
    const member = makeMember('cashier');
    member.changeRole('manager');
    expect(member.role).toBe('manager');
    expect(member.permissions).toContain('manage_products');
  });

  it('should activate and deactivate', () => {
    const member = makeMember('manager');
    member.deactivate();
    expect(member.isActive).toBe(false);
    member.activate();
    expect(member.isActive).toBe(true);
  });

  it('should expose a dto', () => {
    const dto = makeMember('manager').toDto();
    expect(dto.vendorId).toBe(VENDOR_ID);
    expect(dto.role).toBe('manager');
    expect(dto.status).toBe('ACTIVE');
  });
});

describe('InviteVendorStaffUseCase', () => {
  let members: ReturnType<typeof memberRepoMock>;
  let users: ReturnType<typeof userRepoMock>;
  let useCase: InviteVendorStaffUseCase;

  beforeEach(() => {
    members = memberRepoMock();
    users = userRepoMock();
    useCase = new InviteVendorStaffUseCase(
      members as never,
      users as never,
      { hash: jest.fn().mockResolvedValue('hashed') } as never,
    );
  });

  it('should invite an existing user without creating a new one', async () => {
    users.findByPhoneNumber.mockResolvedValue(makeUser());
    members.findOneByVendorAndUser.mockResolvedValue(null);

    const result = await useCase.execute({
      tenantId: TENANT_ID,
      vendorId: VENDOR_ID,
      phoneNumber: '+255712345678',
      fullName: 'Jane Staff',
      role: 'manager',
    });

    expect(users.save).not.toHaveBeenCalled();
    expect(members.save).toHaveBeenCalledTimes(1);
    expect(result.role).toBe('manager');
    expect(result.phoneNumber).toBe('+255712345678');
  });

  it('should auto-create a customer user when the phone does not exist', async () => {
    users.findByPhoneNumber.mockResolvedValue(null);
    members.findOneByVendorAndUser.mockResolvedValue(null);

    const result = await useCase.execute({
      tenantId: TENANT_ID,
      vendorId: VENDOR_ID,
      phoneNumber: '+255711111111',
      fullName: 'New Hire',
      role: 'cashier',
    });

    expect(users.save).toHaveBeenCalledTimes(1);
    const created = users.save.mock.calls[0][0] as User;
    expect(created.role).toBe('customer');
    expect(created.status).toBe('ACTIVE');
    expect(members.save).toHaveBeenCalledTimes(1);
    expect(result.role).toBe('cashier');
  });

  it('should throw when the person is already part of the vendor', async () => {
    users.findByPhoneNumber.mockResolvedValue(makeUser());
    members.findOneByVendorAndUser.mockResolvedValue(makeMember('manager'));

    await expect(
      useCase.execute({
        tenantId: TENANT_ID,
        vendorId: VENDOR_ID,
        phoneNumber: '+255712345678',
        fullName: 'Jane Staff',
        role: 'manager',
      }),
    ).rejects.toThrow('already part of your vendor');
    expect(members.save).not.toHaveBeenCalled();
  });
});

describe('ListVendorStaffUseCase', () => {
  it('should list staff enriched with user info', async () => {
    const vendors = vendorRepoMock();
    const members = memberRepoMock();
    const users = userRepoMock();
    const useCase = new ListVendorStaffUseCase(vendors as never, members as never, users as never);

    vendors.findById.mockResolvedValue(makeVendor());
    members.findByVendorId.mockResolvedValue([makeMember('cashier')]);
    users.findById.mockResolvedValue(makeUser());

    const result = await useCase.execute(VENDOR_ID);
    expect(result.shopName).toBe('Mama Ntilie');
    expect(result.staff).toHaveLength(1);
    expect(result.staff[0]).toMatchObject({
      role: 'cashier',
      fullName: 'Jane Staff',
      phoneNumber: '+255712345678',
    });
  });

  it('should throw when the vendor does not exist', async () => {
    const vendors = vendorRepoMock();
    const useCase = new ListVendorStaffUseCase(vendors as never, memberRepoMock() as never, userRepoMock() as never);
    vendors.findById.mockResolvedValue(null);
    await expect(useCase.execute(VENDOR_ID)).rejects.toThrow('Vendor profile not found');
  });
});

describe('UpdateVendorStaffUseCase', () => {
  it('should change the role', async () => {
    const members = memberRepoMock();
    const useCase = new UpdateVendorStaffUseCase(members as never);
    members.findById.mockResolvedValue(makeMember('cashier'));

    const result = await useCase.execute(VENDOR_ID, 'member-1', 'manager');
    expect(result.role).toBe('manager');
    expect(result.permissions).toContain('manage_products');
    expect(members.save).toHaveBeenCalledTimes(1);
  });

  it('should throw when member belongs to another vendor', async () => {
    const members = memberRepoMock();
    const useCase = new UpdateVendorStaffUseCase(members as never);
    const other = makeMember('cashier');
    const outOfScope = VendorMember.reconstitute({
      id: other.id,
      tenantId: other.tenantId,
      vendorId: EntityId.from('vendor-other'),
      userId: other.userId,
      role: other.role,
      permissions: other.permissions,
      status: other.status,
      version: other.version,
    });
    members.findById.mockResolvedValue(outOfScope);

    await expect(useCase.execute(VENDOR_ID, 'member-1', 'manager')).rejects.toThrow('Staff member not found');
  });
});

describe('RemoveVendorStaffUseCase', () => {
  it('should deactivate the member', async () => {
    const members = memberRepoMock();
    const useCase = new RemoveVendorStaffUseCase(members as never);
    members.findById.mockResolvedValue(makeMember('cashier'));

    const result = await useCase.execute(VENDOR_ID, 'member-1');
    expect(result.success).toBe(true);
    expect(members.save).toHaveBeenCalledTimes(1);
    const saved = members.save.mock.calls[0][0] as VendorMember;
    expect(saved.isActive).toBe(false);
  });
});

describe('VendorAccessService', () => {
  let vendors: ReturnType<typeof vendorRepoMock>;
  let members: ReturnType<typeof memberRepoMock>;
  let service: VendorAccessService;

  beforeEach(() => {
    vendors = vendorRepoMock();
    members = memberRepoMock();
    service = new VendorAccessService(vendors as never, members as never);
  });

  it('should resolve null for platform admins', async () => {
    expect(await service.resolve({ sub: 'a', role: 'admin', tenantId: TENANT_ID })).toBeNull();
    expect(await service.resolve({ sub: 'a', role: 'super_admin', tenantId: TENANT_ID })).toBeNull();
  });

  it('should resolve the owner with all permissions', async () => {
    vendors.findByUserId.mockResolvedValue(makeVendor());
    const ctx = await service.resolve({ sub: OWNER_USER_ID, role: 'vendor', tenantId: TENANT_ID });
    expect(ctx).not.toBeNull();
    expect(ctx?.isOwner).toBe(true);
    expect(ctx?.staffRole).toBe('owner');
    expect(ctx?.permissions).toEqual(ALL_VENDOR_PERMISSIONS);
  });

  it('should resolve null for a vendor role user without a profile', async () => {
    vendors.findByUserId.mockResolvedValue(null);
    expect(await service.resolve({ sub: OWNER_USER_ID, role: 'vendor', tenantId: TENANT_ID })).toBeNull();
  });

  it('should resolve staff via their membership', async () => {
    members.findActiveByUserId.mockResolvedValue(makeMember('manager'));
    vendors.findById.mockResolvedValue(makeVendor());
    const ctx = await service.resolve({ sub: STAFF_USER_ID, role: 'customer', tenantId: TENANT_ID });
    expect(ctx).not.toBeNull();
    expect(ctx?.isOwner).toBe(false);
    expect(ctx?.vendorId).toBe(VENDOR_ID);
    expect(ctx?.permissions).toContain('manage_products');
  });

  it('should resolve null for customers without a membership', async () => {
    members.findActiveByUserId.mockResolvedValue(null);
    expect(await service.resolve({ sub: STAFF_USER_ID, role: 'customer', tenantId: TENANT_ID })).toBeNull();
  });

  it('assertPermission should allow an owner any permission', async () => {
    vendors.findByUserId.mockResolvedValue(makeVendor());
    const ctx = await service.assertPermission({ sub: OWNER_USER_ID, role: 'vendor', tenantId: TENANT_ID }, 'use_pos');
    expect(ctx?.isOwner).toBe(true);
  });

  it('assertPermission should allow staff with the permission', async () => {
    members.findActiveByUserId.mockResolvedValue(makeMember('manager'));
    vendors.findById.mockResolvedValue(makeVendor());
    const ctx = await service.assertPermission({ sub: STAFF_USER_ID, role: 'customer', tenantId: TENANT_ID }, 'manage_products');
    expect(ctx).not.toBeNull();
  });

  it('assertPermission should deny staff without the permission', async () => {
    members.findActiveByUserId.mockResolvedValue(makeMember('cashier'));
    vendors.findById.mockResolvedValue(makeVendor());
    const ctx = await service.assertPermission({ sub: STAFF_USER_ID, role: 'customer', tenantId: TENANT_ID }, 'manage_products');
    expect(ctx).toBeNull();
  });
});
