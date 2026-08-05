import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CurrentUser, JwtPayload } from '@afri-market/identity-infrastructure';
import { RequestLoanDto } from './dto/request-loan.dto';
import { RepayLoanDto } from './dto/repay-loan.dto';
import { RequestLoanUseCase, RepayLoanUseCase, CalculateCreditScoreUseCase, ListMyLoansUseCase } from '@afri-market/marketplace-application';

@ApiTags('Finance')
@Controller('finance')
@ApiBearerAuth()
export class FinanceController {
  constructor(
    private readonly requestLoan: RequestLoanUseCase,
    private readonly repayLoan: RepayLoanUseCase,
    private readonly creditScore: CalculateCreditScoreUseCase,
    private readonly listMyLoans: ListMyLoansUseCase,
  ) {}

  @Post('loans')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Request a loan' })
  @ApiBody({ type: RequestLoanDto })
  @ApiResponse({ status: 201, description: 'Loan requested' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async requestLoanEndpoint(@Body() dto: RequestLoanDto, @CurrentUser() user: JwtPayload) {
    return this.requestLoan.execute(user.tenantId, {
      borrowerId: user.sub,
      borrowerType: 'vendor',
      loanType: dto.loanType,
      requestedAmount: dto.requestedAmount,
      interestRate: 10,
      dailyRepaymentAmount: Math.ceil(dto.requestedAmount / 30),
      totalDays: 30,
    });
  }

  @Get('loans/me')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'List current user loans' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async myLoansEndpoint(
    @CurrentUser() user: JwtPayload,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.listMyLoans.execute(user.sub, { limit, offset });
  }

  @Get('credit-score')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get current user credit score' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async myCreditScore(@CurrentUser() user: JwtPayload) {
    const result = await this.creditScore.execute(user.tenantId, {
      userId: user.sub,
    });
    return { data: result };
  }

  @Post('loans/:id/repay')
  @UseGuards(AuthGuard('jwt'))
  @ApiParam({ name: 'id', description: 'Loan ID' })
  @ApiOperation({ summary: 'Repay a loan installment' })
  @ApiBody({ type: RepayLoanDto })
  @ApiResponse({ status: 201, description: 'Repayment recorded' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async repayLoanEndpoint(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RepayLoanDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.repayLoan.execute({
      loanId: id,
      amount: dto.amount,
      actor: { tenantId: user.tenantId, borrowerId: user.sub },
    });
  }
}
