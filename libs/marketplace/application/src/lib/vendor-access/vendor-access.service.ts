import { Injectable, Inject } from '@nestjs/common';
import { isAdminRole } from '@afri-market/identity-domain';
import {
  ALL_VENDOR_PERMISSIONS,
  IVendorMemberRepository,
  IVendorRepository,
  VendorPermission,
  VendorStaffRole,
} from '@afri-market/marketplace-domain';
import {
  VENDOR_REPOSITORY,
  VENDOR_MEMBER_REPOSITORY,
} from '../tokens';

export interface VendorAccessContext {
  vendorId: string;
  shopName: string;
  staffRole: 'owner' | VendorStaffRole;
  permissions: VendorPermission[];
  isOwner: boolean;
}

@Injectable()
export class VendorAccessService {
  constructor(
    @Inject(VENDOR_REPOSITORY) private readonly vendorRepo: IVendorRepository,
    @Inject(VENDOR_MEMBER_REPOSITORY) private readonly memberRepo: IVendorMemberRepository,
  ) {}

  /**
   * Resolves the vendor context for the given authenticated user.
   * - Platform admins resolve to null (they bypass vendor gating).
   * - The vendor owner resolves to `staffRole: 'owner'` with all permissions.
   * - Active staff members resolve via their vendor_members row.
   * - Everyone else resolves to null.
   */
  public async resolve(user: { sub: string; role: string; tenantId: string }): Promise<VendorAccessContext | null> {
    if (isAdminRole(user.role)) {
      return null;
    }

    if (user.role === 'vendor') {
      const vendor = await this.vendorRepo.findByUserId(user.sub);
      if (!vendor) {
        return null;
      }
      return {
        vendorId: vendor.id.value,
        shopName: vendor.shopName,
        staffRole: 'owner',
        permissions: [...ALL_VENDOR_PERMISSIONS],
        isOwner: true,
      };
    }

    const member = await this.memberRepo.findActiveByUserId(user.sub);
    if (!member) {
      return null;
    }
    const vendor = await this.vendorRepo.findById(member.vendorId);
    return {
      vendorId: member.vendorId.value,
      shopName: vendor?.shopName ?? '',
      staffRole: member.role,
      permissions: member.permissions,
      isOwner: false,
    };
  }

  public async assertPermission(
    user: { sub: string; role: string; tenantId: string },
    permission: VendorPermission,
  ): Promise<VendorAccessContext | null> {
    const ctx = await this.resolve(user);
    if (!ctx) {
      return null;
    }
    if (ctx.isOwner || ctx.permissions.includes(permission)) {
      return ctx;
    }
    return null;
  }
}
