import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { CurrentUser, JwtPayload, Roles, RolesGuard } from '@afri-market/identity-infrastructure';
import { ADMIN_ROLES } from '@afri-market/identity-domain';
import { LoanService } from '@afri-market/core-finance';
import { IsArray, IsNumber, IsObject, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

const FINANCE_ADMIN_ROLES = ADMIN_ROLES.filter((r) => r !== 'support_admin' && r !== 'marketing_admin');

class ApplyLoanFspDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  branch?: string;

  @IsOptional()
  @IsString()
  accountNumber?: string;

  @IsOptional()
  @IsString()
  deductionCode?: string;
}

class ApplyLoanDocumentDto {
  @IsString()
  type!: string;

  @IsString()
  fileUrl!: string;

  @IsOptional()
  @IsString()
  fileName?: string;

  @IsOptional()
  @IsString()
  mimeType?: string;
}

class ApplyLoanDto {
  @IsNumber()
  @Min(1)
  principal!: number;

  @IsNumber()
  @Min(1)
  termMonths!: number;

  @IsString()
  productId!: string;

  @IsOptional()
  @IsString()
  mobileNumber?: string;

  @IsOptional()
  @IsString()
  collateral?: string;

  @IsOptional()
  @IsString()
  purpose?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ApplyLoanFspDto)
  fsp?: ApplyLoanFspDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApplyLoanDocumentDto)
  documents?: ApplyLoanDocumentDto[];
}

class RepayLoanDto {
  @IsNumber()
  @Min(1)
  amount!: number;
}

class CreateLoanProductDto {
  @IsString()
  code!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  borrowerType!: string;

  @IsString()
  loanType!: string;

  @IsNumber()
  @Min(1)
  minAmount!: number;

  @IsNumber()
  @Min(1)
  maxAmount!: number;

  @IsNumber()
  @Min(1)
  minTermMonths!: number;

  @IsNumber()
  @Min(1)
  maxTermMonths!: number;

  @IsNumber()
  annualInterestRate!: number;

  @IsOptional()
  @IsNumber()
  processingFeeRate?: number;

  @IsOptional()
  @IsNumber()
  insuranceRate?: number;

  @IsOptional()
  @IsNumber()
  liquidationAmount?: number;

  @IsOptional()
  @IsArray()
  requiredAttachments?: Array<{ type: string; label: string; required: boolean }>;
}

class UpdateLoanProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  minAmount?: number;

  @IsOptional()
  @IsNumber()
  maxAmount?: number;

  @IsOptional()
  @IsNumber()
  minTermMonths?: number;

  @IsOptional()
  @IsNumber()
  maxTermMonths?: number;

  @IsOptional()
  @IsNumber()
  annualInterestRate?: number;

  @IsOptional()
  @IsNumber()
  processingFeeRate?: number;

  @IsOptional()
  @IsNumber()
  insuranceRate?: number;

  @IsOptional()
  @IsNumber()
  liquidationAmount?: number;

  @IsOptional()
  @IsArray()
  requiredAttachments?: Array<{ type: string; label: string; required: boolean }>;

  @IsOptional()
  isActive?: boolean;
}

class WorkflowActionDto {
  @IsOptional()
  @IsString()
  note?: string;
}

class TopUpDto {
  @IsNumber()
  @Min(1)
  extraAmount!: number;
}

class TakeoverDto {
  @IsString()
  fspName!: string;

  @IsString()
  accountNumber!: string;

  @IsString()
  repaymentCode!: string;
}

class RestructureDto {
  @IsNumber()
  @Min(1)
  newTermMonths!: number;

  @IsOptional()
  @IsNumber()
  newRate?: number;
}

@ApiTags('Fintech Loans')
@Controller('fintech/loans')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class FintechLoansController {
  constructor(private readonly loans: LoanService) {}

  private borrowerType(role: string): 'vendor' | 'driver' | 'customer' {
    if (role === 'vendor' || role === 'driver') return role;
    return 'customer';
  }

  @Get('config')
  @ApiOperation({ summary: 'Loan rate and limit configuration by borrower type', description: 'Returns loan rate tiers and borrowing limits per borrower type (vendor, driver, customer)' })
  @ApiResponse({ status: 200, description: 'Loan rate configuration returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async config() {
    return LoanService.LOAN_RATES;
  }

  @Get('wallet-info')
  @ApiOperation({ summary: 'Get wallet balance and max loan amount based on wallet balance', description: 'Returns the borrower wallet balance and the maximum loan amount they qualify for' })
  @ApiResponse({ status: 200, description: 'Wallet lending info returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async walletInfo(@CurrentUser() user: JwtPayload) {
    return { data: await this.loans.getWalletLendingInfo(user.tenantId, user.sub) };
  }

  // ---- Product catalog ------------------------------------------------------

  @Get('products')
  @ApiOperation({ summary: 'List active loan products (optionally filtered by borrower type)', description: 'Returns all active loan products; optionally filter by borrowerType query param' })
  @ApiResponse({ status: 200, description: 'Loan products returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async products(
    @CurrentUser() user: JwtPayload,
    @Query('borrowerType') borrowerType?: string,
  ) {
    return { data: await this.loans.listProducts(user.tenantId, borrowerType) };
  }

  @Post('products')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...FINANCE_ADMIN_ROLES)
  @ApiOperation({ summary: 'Create a loan product (admin)', description: 'Creates a new loan product with specified terms and limits' })
  @ApiBody({ type: CreateLoanProductDto })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid product data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async createProduct(@CurrentUser() user: JwtPayload, @Body() body: CreateLoanProductDto) {
    return { data: await this.loans.createProduct(user.tenantId, body) };
  }

  @Patch('products/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...FINANCE_ADMIN_ROLES)
  @ApiOperation({ summary: 'Update a loan product (admin)', description: 'Updates loan product fields such as name, rates, or active status' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiBody({ type: UpdateLoanProductDto })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid update data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async updateProduct(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateLoanProductDto,
  ) {
    return { data: await this.loans.updateProduct(user.tenantId, id, body) };
  }

  @Delete('products/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...FINANCE_ADMIN_ROLES)
  @ApiOperation({ summary: 'Delete a loan product (admin)', description: 'Soft-deletes a loan product by ID' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async deleteProduct(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.loans.deleteProduct(user.tenantId, id);
    return { success: true };
  }

  // ---- Application ----------------------------------------------------------

  @Post()
  @ApiOperation({ summary: 'Apply for a loan (product-based with required attachments)', description: 'Submits a new loan application linked to a product with optional FSP and documents' })
  @ApiBody({ type: ApplyLoanDto })
  @ApiResponse({ status: 201, description: 'Loan application submitted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid application data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async apply(@CurrentUser() user: JwtPayload, @Body() body: ApplyLoanDto) {
    const loan = await this.loans.applyLoan({
      tenantId: user.tenantId,
      borrowerId: user.sub,
      borrowerType: this.borrowerType(user.role),
      principal: body.principal,
      termMonths: body.termMonths,
      productId: body.productId,
      mobileNumber: body.mobileNumber,
      collateral: body.collateral,
      purpose: body.purpose,
      fsp: body.fsp,
      documents: body.documents,
    });
    return { data: loan };
  }

  @Get('me')
  @ApiOperation({ summary: 'List my loans', description: 'Returns all loans belonging to the authenticated borrower' })
  @ApiResponse({ status: 200, description: 'Borrower loans returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async myLoans(@CurrentUser() user: JwtPayload) {
    return { data: await this.loans.getBorrowerLoans(user.sub, this.borrowerType(user.role)) };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full loan detail (application, workflow, documents, schedule)', description: 'Returns complete loan detail including workflow history and attachments' })
  @ApiParam({ name: 'id', description: 'Loan ID' })
  @ApiResponse({ status: 200, description: 'Loan detail returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async detail(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return { data: await this.loans.getLoanDetail(id, user.sub) };
  }

  @Get(':id/schedule')
  @ApiOperation({ summary: 'Get amortization schedule for a loan', description: 'Returns the monthly amortization schedule showing principal, interest, and balance per period' })
  @ApiParam({ name: 'id', description: 'Loan ID' })
  @ApiResponse({ status: 200, description: 'Amortization schedule returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async schedule(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return { data: await this.loans.getLoanSchedule(id, user.sub) };
  }

  @Get(':id/repayments')
  @ApiOperation({ summary: 'List repayments for a loan', description: 'Returns all repayment records made against a specific loan' })
  @ApiParam({ name: 'id', description: 'Loan ID' })
  @ApiResponse({ status: 200, description: 'Repayment records returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async repayments(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return { data: await this.loans.getLoanRepayments(id, user.sub) };
  }

  @Post(':id/repay')
  @ApiOperation({ summary: 'Make a loan repayment', description: 'Records a repayment against a loan, debiting the borrower wallet' })
  @ApiParam({ name: 'id', description: 'Loan ID' })
  @ApiBody({ type: RepayLoanDto })
  @ApiResponse({ status: 200, description: 'Repayment recorded successfully' })
  @ApiResponse({ status: 400, description: 'Insufficient wallet balance or invalid amount' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async repay(@Param('id', ParseUUIDPipe) id: string, @Body() body: RepayLoanDto, @CurrentUser() user: JwtPayload) {
    return this.loans.makeRepayment(id, body.amount, user.sub);
  }

  // ---- Borrower self-service actions ----------------------------------------

  @Post(':id/topup')
  @ApiOperation({ summary: 'Top-up an active loan', description: 'Adds extra principal to an active loan, recalculating the schedule' })
  @ApiParam({ name: 'id', description: 'Loan ID' })
  @ApiBody({ type: TopUpDto })
  @ApiResponse({ status: 200, description: 'Loan topped up successfully' })
  @ApiResponse({ status: 400, description: 'Loan not eligible for top-up' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async topUp(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: TopUpDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.loans.getOwnedLoanForUser(id, user.sub);
    return {
      data: await this.loans.topUpLoan(id, body.extraAmount, {
        actorRole: 'borrower',
        note: `Top-up request by user ${user.sub}`,
      }),
    };
  }

  @Post(':id/takeover')
  @ApiOperation({ summary: 'Takeover an approved/active loan to another FSP', description: 'Transfers the loan to another financial service provider' })
  @ApiParam({ name: 'id', description: 'Loan ID' })
  @ApiBody({ type: TakeoverDto })
  @ApiResponse({ status: 200, description: 'Loan takeover initiated' })
  @ApiResponse({ status: 400, description: 'Loan not eligible for takeover' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async takeover(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: TakeoverDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.loans.getOwnedLoanForUser(id, user.sub);
    return {
      data: await this.loans.takeoverLoan(id, body, {
        actorRole: 'borrower',
        note: `Takeover request by user ${user.sub}`,
      }),
    };
  }

  @Post(':id/restructure')
  @ApiOperation({ summary: 'Restructure an active loan (new term/rate)', description: 'Modifies loan term and/or interest rate, recalculating the amortization schedule' })
  @ApiParam({ name: 'id', description: 'Loan ID' })
  @ApiBody({ type: RestructureDto })
  @ApiResponse({ status: 200, description: 'Loan restructured successfully' })
  @ApiResponse({ status: 400, description: 'Loan not eligible for restructuring' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async restructure(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: RestructureDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.loans.getOwnedLoanForUser(id, user.sub);
    return {
      data: await this.loans.restructureLoan(id, body, {
        actorRole: 'borrower',
        note: `Restructure request by user ${user.sub}`,
      }),
    };
  }

  // ---- Admin actions --------------------------------------------------------

  @Get('admin')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...FINANCE_ADMIN_ROLES)
  @ApiOperation({ summary: 'List all loans with optional status filter (admin)', description: 'Returns all loans across tenants; filter by status query param' })
  @ApiParam({ name: 'status', description: 'pending | approved | active | paid | all' })
  @ApiResponse({ status: 200, description: 'Admin loan list returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async adminList(@Query('status') status?: string) {
    return { data: await this.loans.getAdminLoans(status) };
  }

  @Get('admin/stats')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...FINANCE_ADMIN_ROLES)
  @ApiOperation({ summary: 'Loan portfolio stats (admin)', description: 'Returns aggregate statistics for the loan portfolio' })
  @ApiResponse({ status: 200, description: 'Loan stats returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async adminStats() {
    return { data: await this.loans.getLoanStats() };
  }

  @Post(':id/approve')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...FINANCE_ADMIN_ROLES)
  @ApiOperation({ summary: 'Approve a pending loan (admin) — advances to MARKETPLACE_APPROVED', description: 'Approves a pending loan and advances it in the workflow' })
  @ApiParam({ name: 'id', description: 'Loan ID' })
  @ApiBody({ type: WorkflowActionDto })
  @ApiResponse({ status: 200, description: 'Loan approved successfully' })
  @ApiResponse({ status: 400, description: 'Loan not in pending state' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async approve(@Param('id', ParseUUIDPipe) id: string, @Body() body: WorkflowActionDto) {
    return this.loans.approveLoan(id, { actorRole: 'admin', note: body.note });
  }

  @Post(':id/disburse')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...FINANCE_ADMIN_ROLES)
  @ApiOperation({ summary: 'Disburse an approved loan (admin) — advances to FSP_DISBURSED', description: 'Triggers loan disbursement after approval' })
  @ApiParam({ name: 'id', description: 'Loan ID' })
  @ApiBody({ type: WorkflowActionDto })
  @ApiResponse({ status: 200, description: 'Loan disbursed successfully' })
  @ApiResponse({ status: 400, description: 'Loan not in approved state' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async disburse(@Param('id', ParseUUIDPipe) id: string, @Body() body: WorkflowActionDto) {
    return this.loans.disburseLoan(id, { actorRole: 'fsp', note: body.note });
  }

  @Post(':id/advance')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...FINANCE_ADMIN_ROLES)
  @ApiOperation({ summary: 'Advance a loan one step in the 5-step workflow (admin)', description: 'Moves the loan to the next workflow step' })
  @ApiParam({ name: 'id', description: 'Loan ID' })
  @ApiBody({ type: WorkflowActionDto })
  @ApiResponse({ status: 200, description: 'Loan workflow advanced' })
  @ApiResponse({ status: 400, description: 'Loan cannot be advanced from current state' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async advance(@Param('id', ParseUUIDPipe) id: string, @Body() body: WorkflowActionDto) {
    return {
      data: await this.loans.advanceWorkflow(id, { actorRole: 'admin', note: body.note }),
    };
  }

  @Post(':id/reject')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...FINANCE_ADMIN_ROLES)
  @ApiOperation({ summary: 'Reject a pending/approved loan (admin)', description: 'Rejects a loan with a mandatory reason' })
  @ApiParam({ name: 'id', description: 'Loan ID' })
  @ApiBody({ type: WorkflowActionDto })
  @ApiResponse({ status: 200, description: 'Loan rejected successfully' })
  @ApiResponse({ status: 400, description: 'Rejection reason is required' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: WorkflowActionDto & { reason: string },
  ) {
    if (!body.reason) throw new BadRequestException('Rejection reason is required');
    return {
      data: await this.loans.rejectLoan(id, body.reason, { actorRole: 'admin', note: body.note }),
    };
  }

  @Get('admin/products')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...FINANCE_ADMIN_ROLES)
  @ApiOperation({ summary: 'List all loan products including inactive (admin)', description: 'Returns all loan products including inactive ones for admin management' })
  @ApiResponse({ status: 200, description: 'All loan products returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async adminProducts(@CurrentUser() user: JwtPayload) {
    return {
      data: await this.loans.getAdminProducts(user.tenantId),
    };
  }
}