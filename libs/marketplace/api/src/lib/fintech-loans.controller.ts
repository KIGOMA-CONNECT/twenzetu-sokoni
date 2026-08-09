import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { CurrentUser, JwtPayload, Roles, RolesGuard } from '@afri-market/identity-infrastructure';
import { ADMIN_ROLES } from '@afri-market/identity-domain';
import { LoanService } from '@afri-market/core-finance';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

const FINANCE_ADMIN_ROLES = ADMIN_ROLES.filter((r) => r !== 'support_admin' && r !== 'marketing_admin');

class ApplyLoanDto {
  @IsNumber()
  @Min(1)
  principal!: number;

  @IsNumber()
  @Min(1)
  termMonths!: number;

  @IsOptional()
  @IsString()
  collateral?: string;

  @IsOptional()
  @IsString()
  purpose?: string;
}

class RepayLoanDto {
  @IsNumber()
  @Min(1)
  amount!: number;
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
  @ApiOperation({ summary: 'Loan rate and limit configuration by borrower type' })
  @ApiResponse({ status: 200, description: 'Success' })
  public async config() {
    return LoanService.LOAN_RATES;
  }

  @Post()
  @ApiOperation({ summary: 'Apply for a loan' })
  @ApiBody({ type: ApplyLoanDto })
  @ApiResponse({ status: 201, description: 'Loan application submitted' })
  public async apply(@CurrentUser() user: JwtPayload, @Body() body: ApplyLoanDto) {
    const loan = await this.loans.applyLoan({
      borrowerId: user.sub,
      borrowerType: this.borrowerType(user.role),
      principal: body.principal,
      termMonths: body.termMonths,
      collateral: body.collateral,
      purpose: body.purpose,
    });
    return loan;
  }

  @Get('me')
  @ApiOperation({ summary: 'List my loans' })
  public async myLoans(@CurrentUser() user: JwtPayload) {
    return { data: await this.loans.getBorrowerLoans(user.sub, this.borrowerType(user.role)) };
  }

  @Get(':id/schedule')
  @ApiOperation({ summary: 'Get amortization schedule for a loan' })
  @ApiParam({ name: 'id', description: 'Loan ID' })
  public async schedule(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return { data: await this.loans.getLoanSchedule(id, user.sub) };
  }

  @Get(':id/repayments')
  @ApiOperation({ summary: 'List repayments for a loan' })
  @ApiParam({ name: 'id', description: 'Loan ID' })
  public async repayments(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return { data: await this.loans.getLoanRepayments(id, user.sub) };
  }

  @Post(':id/repay')
  @ApiOperation({ summary: 'Make a loan repayment' })
  @ApiBody({ type: RepayLoanDto })
  public async repay(@Param('id', ParseUUIDPipe) id: string, @Body() body: RepayLoanDto, @CurrentUser() user: JwtPayload) {
    return this.loans.makeRepayment(id, body.amount, user.sub);
  }

  @Get('admin')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...FINANCE_ADMIN_ROLES)
  @ApiOperation({ summary: 'List all loans with optional status filter (admin)' })
  @ApiParam({ name: 'status', description: 'pending | approved | active | paid | all' })
  public async adminList(@Query('status') status?: string) {
    return { data: await this.loans.getAdminLoans(status) };
  }

  @Get('admin/stats')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...FINANCE_ADMIN_ROLES)
  @ApiOperation({ summary: 'Loan portfolio stats (admin)' })
  public async adminStats() {
    return { data: await this.loans.getLoanStats() };
  }

  @Post(':id/approve')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...FINANCE_ADMIN_ROLES)
  @ApiOperation({ summary: 'Approve a pending loan (admin)' })
  @ApiParam({ name: 'id', description: 'Loan ID' })
  public async approve(@Param('id', ParseUUIDPipe) id: string) {
    return this.loans.approveLoan(id);
  }

  @Post(':id/disburse')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...FINANCE_ADMIN_ROLES)
  @ApiOperation({ summary: 'Disburse an approved loan (admin)' })
  @ApiParam({ name: 'id', description: 'Loan ID' })
  public async disburse(@Param('id', ParseUUIDPipe) id: string) {
    return this.loans.disburseLoan(id);
  }
}

