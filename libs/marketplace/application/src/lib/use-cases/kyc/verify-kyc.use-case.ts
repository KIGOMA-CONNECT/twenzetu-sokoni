import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { EntityId } from '@afri-market/kernel';
import { IPartnerKycRepository } from '@afri-market/marketplace-domain';
import { PARTNER_KYC_REPOSITORY } from '../../tokens';

@Injectable()
export class VerifyKycUseCase {
  constructor(
    @Inject(PARTNER_KYC_REPOSITORY) private readonly kycRepo: IPartnerKycRepository,
  ) {}

  public async execute(params: {
    kycId: string;
    decision: 'APPROVED' | 'REJECTED';
    rejectionReason?: string;
  }): Promise<{ kycId: string; status: string; verifiedAt: Date | undefined }> {
    const kyc = await this.kycRepo.findById(EntityId.from(params.kycId));
    if (!kyc) throw new NotFoundException('KYC record not found');

    if (params.decision === 'APPROVED') {
      kyc.approve();
    } else if (params.decision === 'REJECTED') {
      if (!params.rejectionReason) {
        throw new BadRequestException('Rejection reason is required');
      }
      kyc.reject(params.rejectionReason);
    }

    await this.kycRepo.save(kyc);

    return { kycId: kyc.id.value, status: kyc.status, verifiedAt: kyc.verifiedAt };
  }
}
