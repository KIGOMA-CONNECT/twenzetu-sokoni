import { GetMyKycStatusUseCase, ListPendingKycUseCase } from '../lib/use-cases/kyc/get-kyc-status.use-case';
import { EntityId, TenantId } from '@afri-market/kernel';
import { PartnerKyc } from '@afri-market/marketplace-domain';

describe('GetMyKycStatusUseCase', () => {
  let useCase: GetMyKycStatusUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo = {
      findByPartnerId: jest.fn(),
    };
    useCase = new GetMyKycStatusUseCase(mockRepo);
  });

  it('should return NOT_SUBMITTED when no kyc found', async () => {
    mockRepo.findByPartnerId.mockResolvedValue(null);
    const result = await useCase.execute('t-1', 'partner-1');
    expect(result.status).toBe('NOT_SUBMITTED');
  });

  it('should return kyc status', async () => {
    const kyc = PartnerKyc.reconstitute({
      id: EntityId.from('kyc-1'),
      tenantId: TenantId.create('t-1'),
      partnerId: EntityId.from('partner-1'),
      partnerType: 'vendor',
      phoneNumber: '+250788123456',
      nidaNumber: '1234567890123456',
      status: 'PENDING',
      version: 1,
    });
    mockRepo.findByPartnerId.mockResolvedValue(kyc);
    const result = await useCase.execute('t-1', 'partner-1');
    expect(result.status).toBe('PENDING');
  });
});

describe('ListPendingKycUseCase', () => {
  let useCase: ListPendingKycUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo = {
      findPending: jest.fn(),
    };
    useCase = new ListPendingKycUseCase(mockRepo);
  });

  it('should return empty when no pending', async () => {
    mockRepo.findPending.mockResolvedValue([]);
    const result = await useCase.execute();
    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('should return pending kyc list', async () => {
    const kyc = PartnerKyc.reconstitute({
      id: EntityId.from('kyc-1'),
      tenantId: TenantId.create('t-1'),
      partnerId: EntityId.from('partner-1'),
      partnerType: 'vendor',
      phoneNumber: '+250788123456',
      nidaNumber: '1234567890123456',
      status: 'PENDING',
      version: 1,
    });
    mockRepo.findPending.mockResolvedValue([kyc]);
    const result = await useCase.execute();
    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
  });
});
