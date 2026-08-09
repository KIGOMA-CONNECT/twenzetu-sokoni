import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { CurrentUser, JwtPayload } from '@afri-market/identity-infrastructure';
import { LoanService } from '@afri-market/core-finance';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

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
  public async schedule(@Param('id', ParseUUIDPipe) id: string) {
    return { data: await this.loans.getLoanSchedule(id) };
  }

  @Get(':id/repayments')
  @ApiOperation({ summary: 'List repayments for a loan' })
  @ApiParam({ name: 'id', description: 'Loan ID' })
  public async repayments(@Param('id', ParseUUIDPipe) id: string) {
    return { data: await this.loans.getLoanRepayments(id) };
  }

  @Post(':id/repay')
  @ApiOperation({ summary: 'Make a loan repayment' })
  @ApiBody({ type: RepayLoanDto })
  public async repay(@Param('id', ParseUUIDPipe) id: string, @Body() body: RepayLoanDto) {
    return this.loans.makeRepayment(id, body.amount);
  }
}
