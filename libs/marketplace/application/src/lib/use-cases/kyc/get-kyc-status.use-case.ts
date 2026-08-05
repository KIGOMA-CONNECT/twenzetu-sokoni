import { Injectable, Inject } from '@nestjs/common';
import { IPartnerKycRepository } from '@afri-market/marketplace-domain';
import { PARTNER_KYC_REPOSITORY } from '../../tokens';

@Injectable()
export class GetMyKycStatusUseCase {
  constructor(
    @Inject(PARTNER_KYC_REPOSITORY) private readonly kycRepo: IPartnerKycRepository,
  ) {}

  public async execute(tenantId: string, partnerId: string): Promise<{ status: string; verifiedAt?: Date }> {
    const kyc = await this.kycRepo.findByPartnerId(partnerId);
    if (!kyc) {
      return { status: 'NOT_SUBMITTED' };
    }
    return { status: kyc.status, verifiedAt: kyc.verifiedAt };
  }
}

@Injectable()
export class ListPendingKycUseCase {
  constructor(
    @Inject(PARTNER_KYC_REPOSITORY) private readonly kycRepo: IPartnerKycRepository,
  ) {}

  public async execute(tenantId: string): Promise<{ data: Record<string, unknown>[]; total: number }> {
    const pending = await this.kycRepo.findPendingByTenant(tenantId);
    return {
      data: pending.map(k => ({ id: k.id.value, partnerId: k.partnerId.value, partnerType: k.partnerType, status: k.status })),
      total: pending.length,
    };
  }
}
