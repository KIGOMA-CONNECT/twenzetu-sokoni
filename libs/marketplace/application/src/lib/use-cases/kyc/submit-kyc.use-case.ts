import { Inject, Injectable } from '@nestjs/common';
import { EntityId, Guard, TenantId } from '@afri-market/kernel';
import { PartnerKyc, IPartnerKycRepository, PartnerType } from '@afri-market/marketplace-domain';
import { PARTNER_KYC_REPOSITORY } from '../../tokens';

@Injectable()
export class SubmitKycUseCase {
  constructor(
    @Inject(PARTNER_KYC_REPOSITORY) private readonly kycRepo: IPartnerKycRepository,
  ) {}

  public async execute(tenantId: string, params: {
    partnerId: string;
    partnerType: string;
    phoneNumber: string;
    nidaNumber?: string;
    tinNumber?: string;
    licenseNumber?: string;
    gpsLatitude?: number;
    gpsLongitude?: number;
  }): Promise<{ kycId: string; status: string }> {
    Guard.assert(params.phoneNumber, 'Phone number is required');

    const kyc = PartnerKyc.create({
      tenantId: TenantId.create(tenantId),
      partnerId: EntityId.from(params.partnerId),
      partnerType: params.partnerType as PartnerType,
      phoneNumber: params.phoneNumber,
      nidaNumber: params.nidaNumber,
      tinNumber: params.tinNumber,
      licenseNumber: params.licenseNumber,
    });

    if (params.gpsLatitude != null && params.gpsLongitude != null) {
      kyc.completeGpsVerification(params.gpsLatitude, params.gpsLongitude);
    }

    await this.kycRepo.save(kyc);

    return { kycId: kyc.id.value, status: kyc.status };
  }
}
