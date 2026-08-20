import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LoanService } from './loan.service';
import { LoanEntity } from './entities/loan.entity';
import { LoanRepaymentEntity } from './entities/loan-repayment.entity';
import { LoanProductEntity } from './entities/loan-product.entity';
import { LoanDocumentEntity } from './entities/loan-document.entity';
import { LoanWorkflowEventEntity } from './entities/loan-workflow-event.entity';

const TENANT = 'a0000000-0000-0000-0000-000000000002';
const BORROWER = 'b0000000-0000-0000-0000-000000000011';

function makeProduct(overrides: Partial<LoanProductEntity> = {}): LoanProductEntity {
  return {
    id: 'p1',
    tenantId: TENANT,
    code: 'STOCK_FLOAT',
    name: 'Stock Float',
    description: 'Stock float loan',
    borrowerType: 'vendor',
    loanType: 'STOCK_FLOAT',
    minAmount: 200000,
    maxAmount: 10000000,
    minTermMonths: 3,
    maxTermMonths: 24,
    annualInterestRate: 0.15,
    processingFeeRate: 0.03,
    insuranceRate: 0.015,
    liquidationAmount: 10000,
    requiredAttachments: [
      { type: 'NATIONAL_ID', label: 'National ID', required: true },
      { type: 'BUSINESS_REG', label: 'Business Reg', required: true },
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as LoanProductEntity;
}

describe('LoanService', () => {
  let service: LoanService;
  let loanRepo: jest.Mocked<Pick<Repository<LoanEntity>, 'findOne' | 'create' | 'save' | 'find' | 'count'>>;
  let productRepo: jest.Mocked<Pick<Repository<LoanProductEntity>, 'findOne' | 'create' | 'save' | 'count' | 'find'>>;
  let workflowRepo: jest.Mocked<Pick<Repository<LoanWorkflowEventEntity>, 'create' | 'save' | 'find'>>;
  let documentRepo: jest.Mocked<Pick<Repository<LoanDocumentEntity>, 'create' | 'save' | 'find'>>;

  beforeEach(async () => {
    loanRepo = {
      findOne: jest.fn(),
      create: jest.fn((e) => e as LoanEntity),
      save: jest.fn((e) => Promise.resolve(e as LoanEntity)),
      find: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    } as any;
    productRepo = {
      findOne: jest.fn().mockResolvedValue(makeProduct()),
      create: jest.fn((e) => e as LoanProductEntity),
      save: jest.fn((e) => Promise.resolve(e as LoanProductEntity)),
      count: jest.fn().mockResolvedValue(1),
      find: jest.fn().mockResolvedValue([makeProduct()]),
    } as any;
    workflowRepo = {
      create: jest.fn((e) => e as LoanWorkflowEventEntity),
      save: jest.fn((e) => Promise.resolve(e as LoanWorkflowEventEntity)),
      find: jest.fn().mockResolvedValue([]),
    } as any;
    documentRepo = {
      create: jest.fn((e) => e as LoanDocumentEntity),
      save: jest.fn((e) => Promise.resolve(e as LoanDocumentEntity)),
      find: jest.fn().mockResolvedValue([]),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoanService,
        { provide: getRepositoryToken(LoanEntity), useValue: loanRepo },
        { provide: getRepositoryToken(LoanRepaymentEntity), useValue: { create: jest.fn(), save: jest.fn(), find: jest.fn().mockResolvedValue([]) } },
        { provide: getRepositoryToken(LoanProductEntity), useValue: productRepo },
        { provide: getRepositoryToken(LoanDocumentEntity), useValue: documentRepo },
        { provide: getRepositoryToken(LoanWorkflowEventEntity), useValue: workflowRepo },
      ],
    }).compile();

    service = module.get<LoanService>(LoanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('applyLoan', () => {
    it('rejects when a required attachment is missing', async () => {
      await expect(
        service.applyLoan({
          tenantId: TENANT,
          borrowerId: BORROWER,
          borrowerType: 'vendor',
          principal: 500000,
          termMonths: 12,
          productId: 'p1',
          documents: [{ type: 'NATIONAL_ID', fileUrl: '/api/uploads/a.pdf' }],
        }),
      ).rejects.toThrow('Missing required attachment: Business Reg');
    });

    it('computes full cost breakdown and generates an application number', async () => {
      loanRepo.findOne.mockResolvedValue(null); // no existing application number collision
      const result = await service.applyLoan({
        tenantId: TENANT,
        borrowerId: BORROWER,
        borrowerType: 'vendor',
        principal: 1000000,
        termMonths: 12,
        productId: 'p1',
        documents: [
          { type: 'NATIONAL_ID', fileUrl: '/api/uploads/a.pdf' },
          { type: 'BUSINESS_REG', fileUrl: '/api/uploads/b.pdf' },
        ],
      });

      expect(result.applicationNumber).toMatch(/^AMF-\d{4}-/);
      expect(result.workflowState).toBe('SUBMITTED_TO_FSP');
      expect(result.interestRate).toBe(0.15);
      expect(result.insuranceAmount).toBe(15000);
      expect(result.processingFeeAmount).toBe(30000);
      expect(result.liquidationAmount).toBe(10000);
      expect(result.totalAmountToPay).toBeGreaterThan(1000000);
      expect(result.deductibleAmount).toBeGreaterThan(0);
      expect(result.fspName).toBeTruthy();
      expect(result.deductionCode).toBeTruthy();
      expect(documentRepo.save).toHaveBeenCalledTimes(2);
      expect(workflowRepo.save).toHaveBeenCalledTimes(1);
    });

    it('rejects amount outside product bounds', async () => {
      await expect(
        service.applyLoan({
          tenantId: TENANT,
          borrowerId: BORROWER,
          borrowerType: 'vendor',
          principal: 5000,
          termMonths: 12,
          productId: 'p1',
          documents: [],
        }),
      ).rejects.toThrow('Amount must be between');
    });
  });

  describe('workflow', () => {
    it('advances through the five steps in order', async () => {
      const loan = { ...makeProduct(), id: 'l1', status: 'pending', workflowState: 'SUBMITTED_TO_FSP', termMonths: 12 } as unknown as LoanEntity;
      loanRepo.findOne.mockResolvedValue(loan);
      loanRepo.save.mockImplementation(async (e) => e as LoanEntity);

      const next = await service.advanceWorkflow('l1', { actorRole: 'fsp' });
      expect(next.workflowState).toBe('FSP_ACCEPTED');

      const next2 = await service.advanceWorkflow('l1', { actorRole: 'fsp' });
      expect(next2.workflowState).toBe('SUBMITTED_TO_EMPLOYER');

      const next3 = await service.advanceWorkflow('l1', { actorRole: 'employer' });
      expect(next3.workflowState).toBe('EMPLOYER_APPROVED');
      expect(next3.status).toBe('approved');
      expect(next3.approvedAt).toBeTruthy();

      const next4 = await service.advanceWorkflow('l1', { actorRole: 'fsp' });
      expect(next4.workflowState).toBe('FSP_DISBURSED');
      expect(next4.status).toBe('active');
      expect(next4.disbursedAt).toBeTruthy();
      expect(workflowRepo.save).toHaveBeenCalledTimes(4);
    });

    it('rejects advancing a fully disbursed loan', async () => {
      const loan = { id: 'l1', status: 'active', workflowState: 'FSP_DISBURSED' } as unknown as LoanEntity;
      loanRepo.findOne.mockResolvedValue(loan);
      await expect(service.advanceWorkflow('l1', { actorRole: 'fsp' })).rejects.toThrow(
        'already in the final workflow state',
      );
    });
  });

  describe('topUp / restructure / takeover', () => {
    it('tops up an active loan and recomputes the schedule', async () => {
      const loan = {
        id: 'l1', status: 'active', borrowerId: BORROWER,
        principal: 1000000, remainingBalance: 900000, termMonths: 12,
        interestRate: 0.15, monthlyPayment: 90000,
        processingFeeAmount: 30000, insuranceAmount: 15000, liquidationAmount: 10000,
        workflowState: 'FSP_DISBURSED', productId: 'p1',
      } as unknown as LoanEntity;
      loanRepo.findOne.mockResolvedValue(loan);
      productRepo.findOne.mockResolvedValue(makeProduct());

      const result = await service.topUpLoan('l1', 100000, { actorRole: 'borrower' });
      expect(result.principal).toBe(1000000);
      expect(result.deductibleAmount).toBeGreaterThan(0);
      expect(result.totalAmountToPay).toBeGreaterThan(result.principal);
    });

    it('restructures an active loan', async () => {
      const loan = {
        id: 'l1', status: 'active', borrowerId: BORROWER,
        principal: 1000000, remainingBalance: 900000, termMonths: 12,
        interestRate: 0.15, monthlyPayment: 90000,
        processingFeeAmount: 30000, insuranceAmount: 15000, liquidationAmount: 10000,
        workflowState: 'FSP_DISBURSED',
      } as unknown as LoanEntity;
      loanRepo.findOne.mockResolvedValue(loan);

      const result = await service.restructureLoan('l1', { newTermMonths: 24 }, { actorRole: 'borrower' });
      expect(result.termMonths).toBe(24);
      expect(result.deductibleAmount).toBeGreaterThan(0);
    });

    it('takes over an active loan to another FSP', async () => {
      const loan = {
        id: 'l1', status: 'active', borrowerId: BORROWER, workflowState: 'FSP_DISBURSED',
      } as unknown as LoanEntity;
      loanRepo.findOne.mockResolvedValue(loan);

      const result = await service.takeoverLoan('l1', {
        fspName: 'NMB Bank', accountNumber: '000111222', deductionCode: 'NMB-DED',
      }, { actorRole: 'borrower' });
      expect(result.fspName).toBe('NMB Bank');
      expect(result.deductionCode).toBe('NMB-DED');
    });
  });

  describe('product catalog', () => {
    it('seeds default products once per tenant', async () => {
      productRepo.count.mockResolvedValue(0);
      productRepo.save.mockImplementation(async (e) => e as LoanProductEntity);
      const count = await service.seedDefaultProducts(TENANT);
      expect(count).toBe(5);
      expect(productRepo.save).toHaveBeenCalledTimes(5);
    });

    it('does not reseed when products exist', async () => {
      const count = await service.seedDefaultProducts(TENANT);
      expect(count).toBe(0);
    });
  });
});