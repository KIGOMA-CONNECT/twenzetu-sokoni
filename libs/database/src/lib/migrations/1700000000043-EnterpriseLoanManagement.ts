import { MigrationInterface, QueryRunner } from 'typeorm';

const TENANT_DAR = 'a0000000-0000-0000-0000-000000000002';

// Enterprise-grade loan management modeled on FSP (Financing Services Provider)
// lending (e.g. SWENEN-style salary/asset-backed lending):
//
//  1. `loan_products` – a catalog of loan products per borrower type, each
//     defining amounts, term, rates and the list of REQUIRED attachments that
//     must be uploaded before an application is accepted.
//  2. `loans` extension – application number (auto-generated), chosen product,
//     full cost breakdown (net amount, interest, insurance, processing fee,
//     liquidation amount, total to pay, deductible per month), FSP details
//     (name, code, branch, account, deduction code) and a 5-step workflow state:
//     SUBMITTED_TO_FSP -> FSP_ACCEPTED -> SUBMITTED_TO_EMPLOYER ->
//     EMPLOYER_APPROVED -> FSP_DISBURSED.
//  3. `loan_documents` – attachments uploaded per application (validated against
//     the product's required_attachments).
//  4. `loan_workflow_events` – an audit timeline of every step the application
//     goes through (actor, note, timestamp).
export class EnterpriseLoanManagement1700000000043 implements MigrationInterface {
  name = 'EnterpriseLoanManagement1700000000043';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ---- 1. Loan products catalog -----------------------------------------
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "loan_products" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "code" varchar(30) NOT NULL,
        "name" varchar(120) NOT NULL,
        "description" text,
        "borrower_type" varchar(20) NOT NULL,
        "loan_type" varchar(30) NOT NULL,
        "min_amount" numeric(14,2) NOT NULL,
        "max_amount" numeric(14,2) NOT NULL,
        "min_term_months" integer NOT NULL DEFAULT 1,
        "max_term_months" integer NOT NULL,
        "annual_interest_rate" numeric(5,4) NOT NULL,
        "processing_fee_rate" numeric(5,4) NOT NULL DEFAULT 0,
        "insurance_rate" numeric(5,4) NOT NULL DEFAULT 0,
        "liquidation_amount" numeric(12,2) NOT NULL DEFAULT 0,
        "required_attachments" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_loan_products_tenant_code"
      ON "loan_products" ("tenant_id", "code")
    `);

    // ---- 2. Extend loans ----------------------------------------------------
    await queryRunner.query(`ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "application_number" varchar(40)`);
    await queryRunner.query(`ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "product_id" uuid`);
    await queryRunner.query(`ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "mobile_number" varchar(20)`);
    await queryRunner.query(`ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "net_amount" numeric(14,2)`);
    await queryRunner.query(`ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "interest_amount" numeric(14,2)`);
    await queryRunner.query(`ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "insurance_amount" numeric(14,2) NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "processing_fee_amount" numeric(14,2) NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "liquidation_amount" numeric(14,2) NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "total_amount_to_pay" numeric(14,2)`);
    await queryRunner.query(`ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "deductible_amount" numeric(12,2)`);
    await queryRunner.query(`ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "fsp_name" varchar(120)`);
    await queryRunner.query(`ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "fsp_code" varchar(40)`);
    await queryRunner.query(`ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "branch_name" varchar(120)`);
    await queryRunner.query(`ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "account_number" varchar(60)`);
    await queryRunner.query(`ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "deduction_code" varchar(40)`);
    await queryRunner.query(`ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "workflow_state" varchar(40) NOT NULL DEFAULT 'SUBMITTED_TO_FSP'`);
    await queryRunner.query(`ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "rejection_reason" text`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_loans_application_number"
      ON "loans" ("application_number")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_loans_product_id"
      ON "loans" ("product_id")
    `);

    // ---- 3. Loan documents (attachments) ------------------------------------
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "loan_documents" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "loan_id" uuid NOT NULL REFERENCES "loans" ("id") ON DELETE CASCADE,
        "tenant_id" uuid NOT NULL,
        "document_type" varchar(40) NOT NULL,
        "document_label" varchar(120) NOT NULL,
        "file_url" text NOT NULL,
        "file_name" varchar(200),
        "mime_type" varchar(100),
        "size_bytes" bigint,
        "uploaded_by" uuid,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_loan_documents_loan"
      ON "loan_documents" ("loan_id")
    `);

    // ---- 4. Loan workflow timeline ------------------------------------------
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "loan_workflow_events" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "loan_id" uuid NOT NULL REFERENCES "loans" ("id") ON DELETE CASCADE,
        "step" varchar(40) NOT NULL,
        "actor_role" varchar(30) NOT NULL,
        "actor_name" varchar(200),
        "note" text,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_loan_workflow_events_loan"
      ON "loan_workflow_events" ("loan_id")
    `);

    // ---- 5. Seed default loan product catalog for the primary tenant ---------
    const products: Array<{
      code: string; name: string; description: string; borrowerType: string; loanType: string;
      minAmount: number; maxAmount: number; minTerm: number; maxTerm: number; interest: number;
      processingFee: number; insurance: number; liquidation: number;
      attachments: Array<{ type: string; label: string; required: boolean }>;
    }> = [
      {
        code: 'STOCK_FLOAT',
        name: 'Stock Float (Biashara)',
        description: 'Mkopo wa kuongeza bidhaa na stock kwenye duka lako. Malipo ya kila mwezi yanatolewa moja kwa moja.',
        borrowerType: 'vendor',
        loanType: 'STOCK_FLOAT',
        minAmount: 200000, maxAmount: 10000000, minTerm: 3, maxTerm: 24,
        interest: 0.15, processingFee: 0.03, insurance: 0.015, liquidation: 10000,
        attachments: [
          { type: 'NATIONAL_ID', label: 'Namba ya NIDA / Kitambulisho', required: true },
          { type: 'BUSINESS_REG', label: 'Hati ya Usajili wa Biashara (BRELA)', required: true },
          { type: 'BANK_STATEMENT', label: 'Taarifa za Benki (Miezi 3)', required: true },
          { type: 'VENDOR_APPROVAL', label: 'Ridhaa ya AfriMarket kama Mwajiri', required: true },
        ],
      },
      {
        code: 'WORKING_CAPITAL',
        name: 'Working Capital',
        description: 'Mkopo wa mtaji wa kazi kwa ukuaji wa biashara, uliohakikishwa na mapato ya mauzo.',
        borrowerType: 'vendor',
        loanType: 'WORKING_CAPITAL',
        minAmount: 300000, maxAmount: 15000000, minTerm: 6, maxTerm: 36,
        interest: 0.15, processingFee: 0.03, insurance: 0.015, liquidation: 15000,
        attachments: [
          { type: 'NATIONAL_ID', label: 'Namba ya NIDA / Kitambulisho', required: true },
          { type: 'BUSINESS_REG', label: 'Hati ya Usajili wa Biashara (BRELA)', required: true },
          { type: 'FINANCIAL_STATEMENT', label: 'Taarifa za Kifedha (Mapato ya Miezi 6)', required: true },
          { type: 'VENDOR_APPROVAL', label: 'Ridhaa ya AfriMarket kama Mwajiri', required: true },
        ],
      },
      {
        code: 'VEHICLE_LOAN',
        name: 'Mkopo wa Gari / Boda',
        description: 'Mkopo wa kununua au kukarabati gari, boda au gari la usafirishaji wa bidhaa.',
        borrowerType: 'driver',
        loanType: 'VEHICLE_LOAN',
        minAmount: 100000, maxAmount: 8000000, minTerm: 6, maxTerm: 24,
        interest: 0.15, processingFee: 0.025, insurance: 0.02, liquidation: 10000,
        attachments: [
          { type: 'NATIONAL_ID', label: 'Namba ya NIDA / Kitambulisho', required: true },
          { type: 'DRIVER_LICENSE', label: 'Leseni ya Uendeshaji', required: true },
          { type: 'VEHICLE_OWNERSHIP', label: 'Hati ya Umiliki wa Gari', required: false },
          { type: 'EMPLOYER_APPROVAL', label: 'Ridhaa ya Mwajiri / AfriMarket', required: true },
        ],
      },
      {
        code: 'FUEL_LOAN',
        name: 'Fuel / Bima ya Mafuta',
        description: 'Mkopo wa mafuta na matengenezo ya kila siku, unalipwa kupitia makato ya mapato ya usafirishaji.',
        borrowerType: 'driver',
        loanType: 'FUEL_LOAN',
        minAmount: 50000, maxAmount: 2000000, minTerm: 1, maxTerm: 6,
        interest: 0.15, processingFee: 0.02, insurance: 0.01, liquidation: 5000,
        attachments: [
          { type: 'NATIONAL_ID', label: 'Namba ya NIDA / Kitambulisho', required: true },
          { type: 'DRIVER_LICENSE', label: 'Leseni ya Uendeshaji', required: true },
          { type: 'DELIVERY_HISTORY', label: 'Historia ya Usafirishaji (AfriMarket)', required: true },
        ],
      },
      {
        code: 'CUSTOMER_PERSONAL',
        name: 'Mkopo wa Kibinafsi (Customer)',
        description: 'Mkopo wa matumizi binafsi kwa wateja, unalipwa kwa miezi kwa makato ya mshahara au mafao.',
        borrowerType: 'customer',
        loanType: 'PERSONAL',
        minAmount: 50000, maxAmount: 2000000, minTerm: 3, maxTerm: 12,
        interest: 0.18, processingFee: 0.03, insurance: 0.015, liquidation: 5000,
        attachments: [
          { type: 'NATIONAL_ID', label: 'Namba ya NIDA / Kitambulisho', required: true },
          { type: 'EMPLOYMENT_LETTER', label: 'Barua ya Mwajiri / Stub ya Mshahara', required: true },
          { type: 'BANK_STATEMENT', label: 'Taarifa za Benki (Miezi 3)', required: true },
        ],
      },
    ];

    for (const p of products) {
      const inserted = await queryRunner.query(
        `SELECT "id" FROM "loan_products" WHERE "tenant_id" = $1 AND "code" = $2`,
        [TENANT_DAR, p.code],
      );
      if (inserted.length > 0) continue;
      await queryRunner.query(
        `INSERT INTO "loan_products"
          ("tenant_id", "code", "name", "description", "borrower_type", "loan_type",
           "min_amount", "max_amount", "min_term_months", "max_term_months",
           "annual_interest_rate", "processing_fee_rate", "insurance_rate",
           "liquidation_amount", "required_attachments")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15::jsonb)`,
        [
          TENANT_DAR, p.code, p.name, p.description, p.borrowerType, p.loanType,
          p.minAmount, p.maxAmount, p.minTerm, p.maxTerm,
          p.interest, p.processingFee, p.insurance, p.liquidation,
          JSON.stringify(p.attachments),
        ],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "loan_workflow_events"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "loan_documents"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_loans_product_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_loans_application_number"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "loan_products"`);
    const columns = [
      'application_number', 'product_id', 'mobile_number', 'net_amount', 'interest_amount',
      'insurance_amount', 'processing_fee_amount', 'liquidation_amount', 'total_amount_to_pay',
      'deductible_amount', 'fsp_name', 'fsp_code', 'branch_name', 'account_number',
      'deduction_code', 'workflow_state', 'rejection_reason',
    ];
    for (const c of columns) {
      await queryRunner.query(`ALTER TABLE "loans" DROP COLUMN IF EXISTS "${c}"`);
    }
  }
}