import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { LoanEntity } from './entities/loan.entity';
import { LoanRepaymentEntity } from './entities/loan-repayment.entity';
import { LoanProductEntity, RequiredAttachment } from './entities/loan-product.entity';
import { LoanDocumentEntity } from './entities/loan-document.entity';
import {
  LoanWorkflowEventEntity,
  LoanWorkflowStep,
  LOAN_WORKFLOW_STEPS,
} from './entities/loan-workflow-event.entity';

export interface LoanApplicationInput {
  tenantId: string;
  borrowerId: string;
  borrowerType: 'vendor' | 'driver' | 'customer';
  principal: number;
  termMonths: number;
  productId: string;
  mobileNumber?: string;
  collateral?: string;
  purpose?: string;
  fsp?: {
    name?: string;
    code?: string;
    branch?: string;
    accountNumber?: string;
    deductionCode?: string;
  };
  documents?: Array<{ type: string; fileUrl: string; fileName?: string; mimeType?: string }>;
}

export interface LoanActionOptions {
  actorRole: string;
  actorName?: string;
  note?: string;
}

const DEFAULT_FSP = {
  name: 'AfriMarket Financial Services',
  code: 'AMFS',
  branch: 'Dar es Salaam',
  accountNumber: '8822001234567',
  deductionCode: 'AMFS-DED',
};

@Injectable()
export class LoanService {
  private readonly logger = new Logger(LoanService.name);

  static readonly LOAN_RATES = {
    vendor: { annual: 0.15, minAmount: 50000, maxAmount: 10000000, maxTerm: 3 },
    driver: { annual: 0.15, minAmount: 20000, maxAmount: 5000000, maxTerm: 6 },
    customer: { annual: 0.18, minAmount: 10000, maxAmount: 2000000, maxTerm: 1 },
  };

  constructor(
    @InjectRepository(LoanEntity)
    private readonly loanRepo: Repository<LoanEntity>,
    @InjectRepository(LoanRepaymentEntity)
    private readonly repaymentRepo: Repository<LoanRepaymentEntity>,
    @InjectRepository(LoanProductEntity)
    private readonly productRepo: Repository<LoanProductEntity>,
    @InjectRepository(LoanDocumentEntity)
    private readonly documentRepo: Repository<LoanDocumentEntity>,
    @InjectRepository(LoanWorkflowEventEntity)
    private readonly workflowRepo: Repository<LoanWorkflowEventEntity>,
    @InjectDataSource() private readonly ds: DataSource,
  ) {}

  // ---- Product catalog -----------------------------------------------------

  async listProducts(tenantId: string, borrowerType?: string): Promise<LoanProductEntity[]> {
    const where: Record<string, unknown> = { tenantId, isActive: true };
    if (borrowerType) where.borrowerType = borrowerType;
    return this.productRepo.find({ where, order: { minAmount: 'ASC' } });
  }

  async getProduct(tenantId: string, productId: string): Promise<LoanProductEntity> {
    const product = await this.productRepo.findOne({ where: { id: productId, tenantId } });
    if (!product) throw new NotFoundException('Loan product not found');
    return product;
  }

  async createProduct(
    tenantId: string,
    data: {
      code: string;
      name: string;
      description?: string;
      borrowerType: string;
      loanType: string;
      minAmount: number;
      maxAmount: number;
      minTermMonths: number;
      maxTermMonths: number;
      annualInterestRate: number;
      processingFeeRate?: number;
      insuranceRate?: number;
      liquidationAmount?: number;
      requiredAttachments?: RequiredAttachment[];
    },
  ): Promise<LoanProductEntity> {
    const existing = await this.productRepo.findOne({ where: { tenantId, code: data.code } });
    if (existing) throw new BadRequestException(`Product code "${data.code}" already exists`);
    const product = this.productRepo.create({
      tenantId,
      ...data,
      processingFeeRate: data.processingFeeRate ?? 0,
      insuranceRate: data.insuranceRate ?? 0,
      liquidationAmount: data.liquidationAmount ?? 0,
      requiredAttachments: data.requiredAttachments ?? [],
    });
    return this.productRepo.save(product);
  }

  async updateProduct(
    tenantId: string,
    productId: string,
    data: Partial<{
      name: string;
      description: string;
      minAmount: number;
      maxAmount: number;
      minTermMonths: number;
      maxTermMonths: number;
      annualInterestRate: number;
      processingFeeRate: number;
      insuranceRate: number;
      liquidationAmount: number;
      requiredAttachments: RequiredAttachment[];
      isActive: boolean;
    }>,
  ): Promise<LoanProductEntity> {
    const product = await this.getProduct(tenantId, productId);
    Object.assign(product, data);
    return this.productRepo.save(product);
  }

  async deleteProduct(tenantId: string, productId: string): Promise<void> {
    const product = await this.getProduct(tenantId, productId);
    await this.productRepo.remove(product);
  }

  async seedDefaultProducts(tenantId: string): Promise<number> {
    const count = await this.productRepo.count({ where: { tenantId } });
    if (count > 0) return 0;

    const products = [
      {
        code: 'STOCK_FLOAT',
        name: 'Stock Float (Biashara)',
        description: 'Mkopo wa kuongeza bidhaa na stock kwenye duka lako. Malipo ya kila mwezi yanatolewa moja kwa moja.',
        borrowerType: 'vendor',
        loanType: 'STOCK_FLOAT',
        minAmount: 200000, maxAmount: 10000000, minTermMonths: 1, maxTermMonths: 3,
        annualInterestRate: 0.15, processingFeeRate: 0.03, insuranceRate: 0.015, liquidationAmount: 10000,
        requiredAttachments: [
          { type: 'NATIONAL_ID', label: 'Namba ya NIDA / Kitambulisho', required: true },
          { type: 'BUSINESS_REG', label: 'Hati ya Usajili wa Biashara (BRELA)', required: true },
          { type: 'BANK_STATEMENT', label: 'Taarifa za Benki (Miezi 3)', required: true },
          { type: 'MARKETPLACE_VERIFICATION', label: 'Uthibitisho wa Biashara kwenye AfriMarket', required: true },
        ],
      },
      {
        code: 'WORKING_CAPITAL',
        name: 'Working Capital',
        description: 'Mkopo wa mtaji wa kazi kwa ukuaji wa biashara, uliohakikishwa na mapato ya mauzo.',
        borrowerType: 'vendor',
        loanType: 'WORKING_CAPITAL',
        minAmount: 300000, maxAmount: 15000000, minTermMonths: 1, maxTermMonths: 3,
        annualInterestRate: 0.15, processingFeeRate: 0.03, insuranceRate: 0.015, liquidationAmount: 15000,
        requiredAttachments: [
          { type: 'NATIONAL_ID', label: 'Namba ya NIDA / Kitambulisho', required: true },
          { type: 'BUSINESS_REG', label: 'Hati ya Usajili wa Biashara (BRELA)', required: true },
          { type: 'FINANCIAL_STATEMENT', label: 'Taarifa za Kifedha (Mapato ya Miezi 6)', required: true },
          { type: 'MARKETPLACE_VERIFICATION', label: 'Uthibitisho wa Biashara kwenye AfriMarket', required: true },
        ],
      },
      {
        code: 'VEHICLE_LOAN',
        name: 'Mkopo wa Gari / Boda',
        description: 'Mkopo wa kununua au kukarabati gari, boda au gari la usafirishaji wa bidhaa.',
        borrowerType: 'driver',
        loanType: 'VEHICLE_LOAN',
        minAmount: 100000, maxAmount: 8000000, minTermMonths: 1, maxTermMonths: 6,
        annualInterestRate: 0.15, processingFeeRate: 0.025, insuranceRate: 0.02, liquidationAmount: 10000,
        requiredAttachments: [
          { type: 'NATIONAL_ID', label: 'Namba ya NIDA / Kitambulisho', required: true },
          { type: 'DRIVER_LICENSE', label: 'Leseni ya Uendeshaji', required: true },
          { type: 'VEHICLE_OWNERSHIP', label: 'Hati ya Umiliki wa Gari', required: false },
          { type: 'DELIVERY_HISTORY', label: 'Historia ya Usafirishaji (AfriMarket)', required: true },
        ],
      },
      {
        code: 'FUEL_LOAN',
        name: 'Fuel / Bima ya Mafuta',
        description: 'Mkopo wa mafuta na matengenezo ya kila siku, unalipwa kupitia makato ya mapato ya usafirishaji.',
        borrowerType: 'driver',
        loanType: 'FUEL_LOAN',
        minAmount: 50000, maxAmount: 2000000, minTermMonths: 1, maxTermMonths: 3,
        annualInterestRate: 0.15, processingFeeRate: 0.02, insuranceRate: 0.01, liquidationAmount: 5000,
        requiredAttachments: [
          { type: 'NATIONAL_ID', label: 'Namba ya NIDA / Kitambulisho', required: true },
          { type: 'DRIVER_LICENSE', label: 'Leseni ya Uendeshaji', required: true },
          { type: 'DELIVERY_HISTORY', label: 'Historia ya Usafirishaji (AfriMarket)', required: true },
        ],
      },
      {
        code: 'CUSTOMER_PERSONAL',
        name: 'Mkopo wa Kibinafsi',
        description: 'Mkopo wa matumizi binafsi kwa wateja, unalipwa kwa miezi kupitia malipo ya simu au benki.',
        borrowerType: 'customer',
        loanType: 'PERSONAL',
        minAmount: 50000, maxAmount: 2000000, minTermMonths: 1, maxTermMonths: 1,
        annualInterestRate: 0.18, processingFeeRate: 0.03, insuranceRate: 0.015, liquidationAmount: 5000,
        requiredAttachments: [
          { type: 'NATIONAL_ID', label: 'Kitambulisho cha Taifa (NIDA)', required: true },
          { type: 'NEIGHBORHOOD_LETTER', label: 'Barua ya Mwenyekiti wa Mtaa / Serikali ya Mtaa', required: true },
          { type: 'PHOTO_SELFIE', label: 'Picha ya uso (Selfie)', required: true },
        ],
      },
    ];

    for (const p of products) {
      await this.productRepo.save(this.productRepo.create({ tenantId, ...p }));
    }
    this.logger.log(`Seeded ${products.length} default loan products for tenant ${tenantId}`);
    return products.length;
  }

  // ---- Application ---------------------------------------------------------

  async applyLoan(input: LoanApplicationInput, opts?: LoanActionOptions): Promise<LoanEntity> {
    const product = await this.getProduct(input.tenantId, input.productId);
    if (!product.isActive) throw new BadRequestException('This loan product is inactive');
    if (product.borrowerType !== input.borrowerType) {
      throw new BadRequestException(
        `Product ${product.name} is not available for ${input.borrowerType}s`,
      );
    }

    const maxTerm = Math.min(product.maxTermMonths, LoanService.LOAN_RATES[input.borrowerType]?.maxTerm ?? product.maxTermMonths);
    if (input.principal < product.minAmount || input.principal > product.maxAmount) {
      throw new BadRequestException(
        `Amount must be between ${product.minAmount} and ${product.maxAmount} for ${product.name}`,
      );
    }
    if (input.termMonths < product.minTermMonths || input.termMonths > maxTerm) {
      throw new BadRequestException(
        `Term must be between ${product.minTermMonths} and ${maxTerm} months for ${product.name}`,
      );
    }

    // Validate required attachments against the product's catalog.
    const required = (product.requiredAttachments ?? []).filter((a) => a.required);
    const provided = input.documents ?? [];
    for (const req of required) {
      const ok = provided.some((d) => d.type === req.type);
      if (!ok) {
        throw new BadRequestException(`Missing required attachment: ${req.label}`);
      }
    }

    // Wallet-based lending: max loan = 3x wallet balance
    const walletRows = await this.ds.query(
      `SELECT balance FROM wallets WHERE owner_id = $1 AND tenant_id = $2 LIMIT 1`,
      [input.borrowerId, input.tenantId],
    );
    const walletBalance = walletRows.length > 0 ? parseFloat(walletRows[0].balance) : 0;
    const maxWalletLoan = Math.round(walletBalance * 3 * 100) / 100;

    // If wallet has balance, cap loan at 3x wallet balance
    // If wallet is empty, use product max as fallback (new users)
    if (maxWalletLoan > 0 && input.principal > maxWalletLoan) {
      throw new BadRequestException(
        `Loan amount cannot exceed 3x your wallet balance (max: ${maxWalletLoan.toLocaleString()} ${input.borrowerType === 'customer' ? 'TZS' : 'TZS'}). Your wallet balance: ${walletBalance.toLocaleString()} TZS`,
      );
    }

    // Cost breakdown.
    const annualRate = product.annualInterestRate;
    const monthlyRate = annualRate / 12;
    const monthlyPayment =
      Math.round(
        ((input.principal * monthlyRate * Math.pow(1 + monthlyRate, input.termMonths)) /
          (Math.pow(1 + monthlyRate, input.termMonths) - 1)) * 100,
      ) / 100;

    const interestAmount =
      Math.round((monthlyPayment * input.termMonths - input.principal) * 100) / 100;
    const processingFeeAmount =
      Math.round((input.principal * product.processingFeeRate) * 100) / 100;
    const insuranceAmount =
      Math.round((input.principal * product.insuranceRate) * 100) / 100;
    const liquidationAmount = product.liquidationAmount;
    const totalAmountToPay =
      Math.round(
        (input.principal + interestAmount + processingFeeAmount + insuranceAmount + liquidationAmount) * 100,
      ) / 100;
    const deductibleAmount = Math.round((totalAmountToPay / input.termMonths) * 100) / 100;

    const fsp = input.fsp ?? DEFAULT_FSP;
    const applicationNumber = await this.generateApplicationNumber(input.tenantId);

    const loan = this.loanRepo.create({
      borrowerId: input.borrowerId,
      borrowerType: input.borrowerType,
      principal: input.principal,
      interestRate: annualRate,
      termMonths: input.termMonths,
      monthlyPayment,
      remainingBalance: input.principal,
      collateral: input.collateral,
      purpose: input.purpose,
      status: 'pending',
      applicationNumber,
      productId: product.id,
      mobileNumber: input.mobileNumber,
      netAmount: input.principal,
      interestAmount,
      insuranceAmount,
      processingFeeAmount,
      liquidationAmount,
      totalAmountToPay,
      deductibleAmount,
      fspName: fsp.name,
      fspCode: fsp.code,
      branchName: fsp.branch,
      accountNumber: fsp.accountNumber,
      deductionCode: fsp.deductionCode,
      workflowState: 'SUBMITTED_TO_FSP',
    });

    const saved = await this.loanRepo.save(loan);

    // Persist attachments.
    if (input.documents?.length) {
      for (const doc of input.documents) {
        await this.documentRepo.save(
          this.documentRepo.create({
            loanId: saved.id,
            tenantId: input.tenantId,
            documentType: doc.type,
            documentLabel:
              required.find((r) => r.type === doc.type)?.label ?? doc.type,
            fileUrl: doc.fileUrl,
            fileName: doc.fileName,
            mimeType: doc.mimeType,
            uploadedBy: input.borrowerId,
          }),
        );
      }
    }

    await this.recordWorkflow(saved.id, 'SUBMITTED_TO_FSP', opts ?? { actorRole: 'borrower' });
    return saved;
  }

  private async generateApplicationNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = 'AMF';
    const short = tenantId.replace(/-/g, '').slice(0, 4).toUpperCase();
    // Loop a few times to avoid collisions.
    for (let attempt = 0; attempt < 10; attempt++) {
      const random = Math.floor(1000 + Math.random() * 9000);
      const number = `${prefix}-${year}-${short}-${random}`;
      const existing = await this.loanRepo.findOne({ where: { applicationNumber: number } });
      if (!existing) return number;
    }
    throw new BadRequestException('Could not generate a unique application number');
  }

  // ---- Workflow ------------------------------------------------------------

  async recordWorkflow(
    loanId: string,
    step: LoanWorkflowStep,
    opts: LoanActionOptions,
  ): Promise<LoanWorkflowEventEntity> {
    const event = this.workflowRepo.create({
      loanId,
      step,
      actorRole: opts.actorRole,
      actorName: opts.actorName,
      note: opts.note,
    });
    return this.workflowRepo.save(event);
  }

  async getWorkflow(loanId: string): Promise<LoanWorkflowEventEntity[]> {
    return this.workflowRepo.find({ where: { loanId }, order: { createdAt: 'ASC' } });
  }

  /** Advance a pending/approved loan to the next workflow step. */
  async advanceWorkflow(loanId: string, opts: LoanActionOptions): Promise<LoanEntity> {
    const loan = await this.getOwnedLoan(loanId);
    const idx = LOAN_WORKFLOW_STEPS.indexOf(loan.workflowState as LoanWorkflowStep);
    if (idx < 0) throw new BadRequestException(`Unknown workflow state ${loan.workflowState}`);
    if (idx >= LOAN_WORKFLOW_STEPS.length - 1) {
      throw new BadRequestException('Loan is already in the final workflow state');
    }
    const next = LOAN_WORKFLOW_STEPS[idx + 1];

    loan.workflowState = next;
    if (next === 'MARKETPLACE_APPROVED') {
      loan.status = 'approved';
      loan.approvedAt = new Date();
    }
    if (next === 'FSP_DISBURSED') {
      loan.status = 'active';
      loan.disbursedAt = new Date();
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + loan.termMonths);
      loan.dueDate = dueDate;

      // Auto-credit wallet on loan disbursement
      try {
        const tenantId = loan.productId
          ? (await this.productRepo.findOne({ where: { id: loan.productId } }))?.tenantId
          : undefined;
        if (!tenantId) {
          this.logger.error(`Cannot credit wallet for loan ${loanId}: no tenantId found from product`);
        } else {
          const walletRows = await this.ds.query(
            `SELECT id, balance FROM wallets WHERE owner_id = $1 AND tenant_id = $2 LIMIT 1`,
            [loan.borrowerId, tenantId],
          );
          let walletId: string;
          let balanceBefore: number;
          if (walletRows.length > 0) {
            walletId = walletRows[0].id;
            balanceBefore = parseFloat(walletRows[0].balance);
            await this.ds.query(
              `UPDATE wallets SET balance = balance + $1, version = version + 1
               WHERE id = $2`,
              [loan.principal, walletId],
            );
          } else {
            walletId = (await this.ds.query(`SELECT gen_random_uuid() as id`))[0].id;
            balanceBefore = 0;
            await this.ds.query(
              `INSERT INTO wallets (id, tenant_id, owner_id, owner_type, balance, pending_balance, currency, version, created_at, updated_at)
               VALUES ($1, $2, $3, $4, $5, 0, 'TZS', 1, NOW(), NOW())`,
              [walletId, tenantId, loan.borrowerId, loan.borrowerType, loan.principal],
            );
          }
          const balanceAfter = balanceBefore + loan.principal;
          await this.ds.query(
            `INSERT INTO wallet_transactions (id, tenant_id, owner_id, owner_type, type, amount, currency, balance_before, balance_after, description, reference_id, reference_type, created_at)
             VALUES (gen_random_uuid(), $1, $2, $3, 'CREDIT', $4, 'TZS', $5, $6, 'Loan disbursement', $7, 'loan_disbursement', NOW())`,
            [tenantId, loan.borrowerId, loan.borrowerType, loan.principal, balanceBefore, balanceAfter, loanId],
          );
          this.logger.log(`Wallet credited with ${loan.principal} for loan ${loanId} disbursement`);
        }
      } catch (err) {
        this.logger.error(`Failed to credit wallet for loan ${loanId}: ${err}`);
      }
    }
    await this.loanRepo.save(loan);
    await this.recordWorkflow(loanId, next, opts);
    return loan;
  }

  async rejectLoan(loanId: string, reason: string, opts: LoanActionOptions): Promise<LoanEntity> {
    const loan = await this.getOwnedLoan(loanId);
    if (loan.status !== 'pending' && loan.status !== 'approved') {
      throw new BadRequestException('Only pending/approved loans can be rejected');
    }
    loan.status = 'rejected';
    loan.rejectionReason = reason;
    await this.loanRepo.save(loan);
    await this.recordWorkflow(loanId, loan.workflowState as LoanWorkflowStep, {
      ...opts,
      note: `Rejected: ${reason}`,
    });
    return loan;
  }

  // ---- Legacy actions (kept for backward compatibility) ---------------------

  async approveLoan(loanId: string, opts?: LoanActionOptions): Promise<LoanEntity> {
    const loan = await this.getOwnedLoan(loanId);
    if (loan.status !== 'pending') throw new BadRequestException('Loan is not pending');

    loan.status = 'approved';
    loan.approvedAt = new Date();
    if (loan.workflowState === 'SUBMITTED_TO_FSP') {
      loan.workflowState = 'MARKETPLACE_APPROVED';
      await this.recordWorkflow(loanId, 'FSP_ACCEPTED', opts ?? { actorRole: 'fsp' });
      await this.recordWorkflow(loanId, 'SUBMITTED_TO_MARKETPLACE', opts ?? { actorRole: 'fsp' });
      await this.recordWorkflow(loanId, 'MARKETPLACE_APPROVED', opts ?? { actorRole: 'marketplace' });
    }
    return this.loanRepo.save(loan);
  }

  async disburseLoan(loanId: string, opts?: LoanActionOptions): Promise<LoanEntity> {
    const loan = await this.getOwnedLoan(loanId);
    if (loan.status !== 'approved') throw new BadRequestException('Loan must be approved first');

    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + loan.termMonths);

    loan.status = 'active';
    loan.disbursedAt = new Date();
    loan.dueDate = dueDate;
    loan.workflowState = 'FSP_DISBURSED';
    await this.loanRepo.save(loan);

    // Auto-credit wallet on loan disbursement (same logic as advanceWorkflow)
    try {
      const tenantId = loan.productId
        ? (await this.productRepo.findOne({ where: { id: loan.productId } }))?.tenantId
        : undefined;
      if (!tenantId) {
        this.logger.error(`Cannot credit wallet for loan ${loanId}: no tenantId found from product`);
      } else {
        const walletRows = await this.ds.query(
          `SELECT id, balance FROM wallets WHERE owner_id = $1 AND tenant_id = $2 LIMIT 1`,
          [loan.borrowerId, tenantId],
        );
        let walletId: string;
        let balanceBefore: number;
        if (walletRows.length > 0) {
          walletId = walletRows[0].id;
          balanceBefore = parseFloat(walletRows[0].balance);
          await this.ds.query(
            `UPDATE wallets SET balance = balance + $1, version = version + 1
             WHERE id = $2`,
            [loan.principal, walletId],
          );
        } else {
          walletId = (await this.ds.query(`SELECT gen_random_uuid() as id`))[0].id;
          balanceBefore = 0;
          await this.ds.query(
            `INSERT INTO wallets (id, tenant_id, owner_id, owner_type, balance, pending_balance, currency, version, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, 0, 'TZS', 1, NOW(), NOW())`,
            [walletId, tenantId, loan.borrowerId, loan.borrowerType, loan.principal],
          );
        }
        const balanceAfter = balanceBefore + loan.principal;
        await this.ds.query(
          `INSERT INTO wallet_transactions (id, tenant_id, owner_id, owner_type, type, amount, currency, balance_before, balance_after, description, reference_id, reference_type, created_at)
           VALUES (gen_random_uuid(), $1, $2, $3, 'CREDIT', $4, 'TZS', $5, $6, 'Loan disbursement', $7, 'loan_disbursement', NOW())`,
          [tenantId, loan.borrowerId, loan.borrowerType, loan.principal, balanceBefore, balanceAfter, loanId],
        );
        this.logger.log(`Wallet credited with ${loan.principal} for loan ${loanId} disbursement`);
      }
    } catch (err) {
      this.logger.error(`Failed to credit wallet for loan ${loanId}: ${err}`);
    }

    await this.recordWorkflow(loanId, 'FSP_DISBURSED', opts ?? { actorRole: 'fsp' });
    return loan;
  }

  // ---- Top-up / Takeover / Restructuring ------------------------------------

  async topUpLoan(
    loanId: string,
    extraAmount: number,
    opts: LoanActionOptions,
  ): Promise<LoanEntity> {
    const loan = await this.getOwnedLoan(loanId);
    if (loan.status !== 'active') throw new BadRequestException('Only active loans can be topped up');
    if (extraAmount <= 0) throw new BadRequestException('Top-up amount must be positive');

    const product = loan.productId
      ? await this.productRepo.findOne({ where: { id: loan.productId } })
      : undefined;
    const rate = product?.annualInterestRate ?? loan.interestRate;
    const newPrincipal = Math.round((loan.remainingBalance + extraAmount) * 100) / 100;
    const monthlyRate = rate / 12;
    const term = loan.termMonths;

    const monthlyPayment =
      Math.round(
        ((newPrincipal * monthlyRate * Math.pow(1 + monthlyRate, term)) /
          (Math.pow(1 + monthlyRate, term) - 1)) * 100,
      ) / 100;

    const interestAmount =
      Math.round((monthlyPayment * term - newPrincipal) * 100) / 100;
    const totalAmountToPay =
      Math.round((newPrincipal + interestAmount + loan.processingFeeAmount + loan.insuranceAmount + loan.liquidationAmount) * 100) / 100;
    const deductibleAmount = Math.round((totalAmountToPay / term) * 100) / 100;

    loan.principal = newPrincipal;
    loan.interestRate = rate;
    loan.monthlyPayment = monthlyPayment;
    loan.interestAmount = interestAmount;
    loan.totalAmountToPay = totalAmountToPay;
    loan.deductibleAmount = deductibleAmount;
    loan.remainingBalance = newPrincipal;
    await this.loanRepo.save(loan);

    await this.recordWorkflow(loanId, loan.workflowState as LoanWorkflowStep, {
      ...opts,
      note: `Top-up of ${extraAmount} applied. New principal ${newPrincipal}.`,
    });
    return loan;
  }

  async takeoverLoan(
    loanId: string,
    params: { fspName: string; accountNumber: string; repaymentCode?: string; deductionCode?: string; borrowerId?: string; borrowerType?: string },
    opts: LoanActionOptions,
  ): Promise<LoanEntity> {
    const loan = await this.getOwnedLoan(loanId, params.borrowerId);
    if (loan.status !== 'active' && loan.status !== 'approved') {
      throw new BadRequestException('Loan must be approved or active to be taken over');
    }

    const code = params.repaymentCode ?? params.deductionCode ?? '';
    loan.fspName = params.fspName;
    loan.accountNumber = params.accountNumber;
    loan.deductionCode = code;
    await this.loanRepo.save(loan);

    await this.recordWorkflow(loanId, loan.workflowState as LoanWorkflowStep, {
      ...opts,
      note: `Loan taken over by ${params.fspName} (account ${params.accountNumber}, repayment code ${code}).`,
    });
    return loan;
  }

  async restructureLoan(
    loanId: string,
    params: { newTermMonths: number; newRate?: number },
    opts: LoanActionOptions,
  ): Promise<LoanEntity> {
    const loan = await this.getOwnedLoan(loanId);
    if (loan.status !== 'active') throw new BadRequestException('Only active loans can be restructured');
    if (params.newTermMonths <= 0) throw new BadRequestException('Term must be positive');

    const rate = params.newRate ?? loan.interestRate;
    const balance = loan.remainingBalance;
    const monthlyRate = rate / 12;
    const monthlyPayment =
      Math.round(
        ((balance * monthlyRate * Math.pow(1 + monthlyRate, params.newTermMonths)) /
          (Math.pow(1 + monthlyRate, params.newTermMonths) - 1)) * 100,
      ) / 100;
    const interestAmount =
      Math.round((monthlyPayment * params.newTermMonths - balance) * 100) / 100;
    const totalAmountToPay =
      Math.round((balance + interestAmount + loan.processingFeeAmount + loan.insuranceAmount + loan.liquidationAmount) * 100) / 100;
    const deductibleAmount = Math.round((totalAmountToPay / params.newTermMonths) * 100) / 100;

    loan.termMonths = params.newTermMonths;
    loan.interestRate = rate;
    loan.monthlyPayment = monthlyPayment;
    loan.interestAmount = interestAmount;
    loan.totalAmountToPay = totalAmountToPay;
    loan.deductibleAmount = deductibleAmount;
    await this.loanRepo.save(loan);

    await this.recordWorkflow(loanId, loan.workflowState as LoanWorkflowStep, {
      ...opts,
      note: `Restructured to ${params.newTermMonths} months at ${(rate * 100).toFixed(1)}% annual.`,
    });
    return loan;
  }

  // ---- Repayment ------------------------------------------------------------

  private async getOwnedLoan(loanId: string, borrowerId?: string): Promise<LoanEntity> {
    const loan = await this.loanRepo.findOne({ where: { id: loanId } });
    if (!loan) throw new NotFoundException('Loan not found');
    if (borrowerId && loan.borrowerId !== borrowerId) {
      throw new NotFoundException('Loan not found');
    }
    return loan;
  }

  /** Throws NotFoundException if the loan does not belong to the user. */
  async getOwnedLoanForUser(loanId: string, userId: string): Promise<LoanEntity> {
    return this.getOwnedLoan(loanId, userId);
  }

  async makeRepayment(loanId: string, amount: number, borrowerId?: string): Promise<LoanRepaymentEntity> {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');
    const loan = await this.getOwnedLoan(loanId, borrowerId);
    if (loan.status !== 'active') throw new BadRequestException('Loan is not active');
    if (amount > loan.remainingBalance) throw new BadRequestException('Amount exceeds remaining balance');

    const monthlyRate = loan.interestRate / 12;
    const interestPortion = Math.round(loan.remainingBalance * monthlyRate * 100) / 100;
    const principalPortion = Math.round((amount - interestPortion) * 100) / 100;
    const newBalance = Math.round((loan.remainingBalance - principalPortion) * 100) / 100;

    const repayment = this.repaymentRepo.create({
      loanId,
      amount,
      principalPortion,
      interestPortion,
      remainingBalance: Math.max(newBalance, 0),
    });

    loan.totalRepaid += amount;
    loan.remainingBalance = Math.max(newBalance, 0);
    if (loan.remainingBalance <= 0) {
      loan.status = 'paid';
    }
    await this.loanRepo.save(loan);

    const savedRepayment = await this.repaymentRepo.save(repayment);

    // Auto-debit wallet for loan repayment
    try {
      const tenantId = loan.productId
        ? (await this.productRepo.findOne({ where: { id: loan.productId } }))?.tenantId
        : undefined;
      if (tenantId) {
        const walletRows = await this.ds.query(
          `SELECT id, balance FROM wallets WHERE owner_id = $1 AND tenant_id = $2 AND balance >= $3 LIMIT 1`,
          [loan.borrowerId, tenantId, amount],
        );
        if (walletRows.length > 0) {
          const walletId = walletRows[0].id;
          const balanceBefore = parseFloat(walletRows[0].balance);
          await this.ds.query(
            `UPDATE wallets SET balance = balance - $1, version = version + 1
             WHERE id = $2`,
            [amount, walletId],
          );
          const balanceAfter = balanceBefore - amount;
          await this.ds.query(
            `INSERT INTO wallet_transactions (id, tenant_id, owner_id, owner_type, type, amount, currency, balance_before, balance_after, description, reference_id, reference_type, created_at)
             VALUES (gen_random_uuid(), $1, $2, $3, 'DEBIT', $4, 'TZS', $5, $6, 'Loan repayment', $7, 'loan_repayment', NOW())`,
            [tenantId, loan.borrowerId, loan.borrowerType, amount, balanceBefore, balanceAfter, loanId],
          );
          this.logger.log(`Wallet debited ${amount} for loan ${loanId} repayment`);
        }
      }
    } catch (err) {
      this.logger.error(`Failed to debit wallet for loan ${loanId} repayment: ${err}`);
      // Don't fail the repayment if wallet debit fails — the repayment is still recorded
    }

    return savedRepayment;
  }

  async getBorrowerLoans(borrowerId: string, borrowerType: string): Promise<LoanEntity[]> {
    return this.loanRepo.find({
      where: { borrowerId, borrowerType },
      order: { createdAt: 'DESC' },
    });
  }

  async getAdminLoans(status?: string): Promise<LoanEntity[]> {
    const where = status && status !== 'all' ? { status } : {};
    return this.loanRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async getAdminProducts(tenantId: string): Promise<LoanProductEntity[]> {
    return this.productRepo.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async getLoanStats(): Promise<{
    pending: number;
    approved: number;
    active: number;
    paid: number;
    totalDisbursed: number;
    outstanding: number;
  }> {
    const [pending, approved, active, paid, activeLoans] = await Promise.all([
      this.loanRepo.count({ where: { status: 'pending' } }),
      this.loanRepo.count({ where: { status: 'approved' } }),
      this.loanRepo.count({ where: { status: 'active' } }),
      this.loanRepo.count({ where: { status: 'paid' } }),
      this.loanRepo.find({ where: { status: 'active' } }),
    ]);

    const totalDisbursed = Math.round(
      activeLoans.reduce((sum, l) => sum + l.principal, 0) * 100,
    ) / 100;
    const outstanding = Math.round(
      activeLoans.reduce((sum, l) => sum + l.remainingBalance, 0) * 100,
    ) / 100;

    return { pending, approved, active, paid, totalDisbursed, outstanding };
  }

  async getWalletLendingInfo(tenantId: string, borrowerId: string): Promise<{ walletBalance: number; maxLoanAmount: number }> {
    const rows = await this.ds.query(
      `SELECT balance FROM wallets WHERE owner_id = $1 AND tenant_id = $2 LIMIT 1`,
      [borrowerId, tenantId],
    );
    const walletBalance = rows.length > 0 ? parseFloat(rows[0].balance) : 0;
    const maxLoanAmount = Math.round(walletBalance * 3 * 100) / 100;
    return { walletBalance, maxLoanAmount };
  }

  async getLoanRepayments(loanId: string, borrowerId?: string): Promise<LoanRepaymentEntity[]> {
    await this.getOwnedLoan(loanId, borrowerId);
    return this.repaymentRepo.find({
      where: { loanId },
      order: { paidAt: 'DESC' },
    });
  }

  async getLoanDetail(loanId: string, borrowerId?: string) {
    const loan = await this.getOwnedLoan(loanId, borrowerId);
    const [workflow, documents, repayments, schedule, product] = await Promise.all([
      this.getWorkflow(loanId),
      this.documentRepo.find({ where: { loanId }, order: { createdAt: 'ASC' } }),
      this.repaymentRepo.find({ where: { loanId }, order: { paidAt: 'DESC' } }),
      this.getLoanSchedule(loanId, borrowerId),
      loan.productId
        ? this.productRepo.findOne({ where: { id: loan.productId } }).catch(() => undefined)
        : Promise.resolve(undefined),
    ]);

    return { loan, product, workflow, documents, repayments, schedule };
  }

  async getLoanSchedule(loanId: string, borrowerId?: string) {
    const loan = await this.getOwnedLoan(loanId, borrowerId);

    const schedule = [];
    let balance = loan.principal;
    const monthlyRate = loan.interestRate / 12;

    for (let i = 1; i <= loan.termMonths; i++) {
      const interest = Math.round(balance * monthlyRate * 100) / 100;
      const principal = Math.round((loan.monthlyPayment - interest) * 100) / 100;
      balance = Math.round((balance - principal) * 100) / 100;

      const dueDate = new Date(loan.disbursedAt || new Date());
      dueDate.setMonth(dueDate.getMonth() + i);

      schedule.push({
        month: i,
        payment: loan.monthlyPayment,
        principal,
        interest,
        balance: Math.max(balance, 0),
        dueDate,
      });
    }

    return schedule;
  }
}