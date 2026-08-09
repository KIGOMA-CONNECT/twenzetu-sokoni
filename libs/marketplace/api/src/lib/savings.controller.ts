import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CurrentUser, JwtPayload } from '@afri-market/identity-infrastructure';
import { SavingsService } from '@afri-market/core-finance';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

class DepositDto {
  @IsNumber()
  @Min(1)
  amount!: number;

  @IsOptional()
  @IsString()
  reference?: string;
}

class WithdrawDto {
  @IsNumber()
  @Min(1)
  amount!: number;

  @IsOptional()
  @IsString()
  reference?: string;
}

class CreateFixedDepositDto {
  @IsNumber()
  @Min(1)
  principal!: number;

  @IsNumber()
  @Min(1)
  durationMonths!: number;
}

@ApiTags('Savings')
@Controller('savings')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class SavingsController {
  constructor(private readonly savings: SavingsService) {}

  private ownerType(role: string): string {
    if (role === 'vendor' || role === 'driver') return role;
    return 'customer';
  }

  @Get('me')
  @ApiOperation({ summary: 'Get or create my savings account' })
  @ApiResponse({ status: 200, description: 'Success' })
  public async myAccount(@CurrentUser() user: JwtPayload) {
    const account = await this.savings.getOrCreateAccount(user.sub, this.ownerType(user.role));
    return account;
  }

  @Get('rates')
  @ApiOperation({ summary: 'Available fixed deposit rates' })
  @ApiResponse({ status: 200, description: 'Success' })
  public async rates() {
    return this.savings.getAvailableRates();
  }

  @Get(':accountId/transactions')
  @ApiOperation({ summary: 'List savings account transactions' })
  public async transactions(
    @Param('accountId', ParseUUIDPipe) accountId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const account = await this.savings.getOrCreateAccount(user.sub, this.ownerType(user.role));
    if (account.id !== accountId) {
      const owned = await this.savings.getAccountTransactions(accountId);
      return { data: owned };
    }
    return { data: await this.savings.getAccountTransactions(accountId) };
  }

  @Get(':accountId/fixed-deposits')
  @ApiOperation({ summary: 'List fixed deposits for an account' })
  public async fixedDeposits(@Param('accountId', ParseUUIDPipe) accountId: string) {
    return { data: await this.savings.getFixedDeposits(accountId) };
  }

  @Post('deposit')
  @ApiOperation({ summary: 'Deposit into my savings account' })
  @ApiBody({ type: DepositDto })
  public async deposit(@CurrentUser() user: JwtPayload, @Body() body: DepositDto) {
    const account = await this.savings.getOrCreateAccount(user.sub, this.ownerType(user.role));
    const tx = await this.savings.deposit(account.id, body.amount, body.reference);
    return {
      transaction: tx,
      balance: (await this.savings.getOrCreateAccount(user.sub, this.ownerType(user.role))).balance,
    };
  }

  @Post('withdraw')
  @ApiOperation({ summary: 'Withdraw from my savings account' })
  @ApiBody({ type: WithdrawDto })
  public async withdraw(@CurrentUser() user: JwtPayload, @Body() body: WithdrawDto) {
    const account = await this.savings.getOrCreateAccount(user.sub, this.ownerType(user.role));
    const tx = await this.savings.withdraw(account.id, body.amount, body.reference);
    return {
      transaction: tx,
      balance: (await this.savings.getOrCreateAccount(user.sub, this.ownerType(user.role))).balance,
    };
  }

  @Post('fixed-deposits')
  @ApiOperation({ summary: 'Create a fixed deposit from my savings balance' })
  @ApiBody({ type: CreateFixedDepositDto })
  public async createFixedDeposit(@CurrentUser() user: JwtPayload, @Body() body: CreateFixedDepositDto) {
    const account = await this.savings.getOrCreateAccount(user.sub, this.ownerType(user.role));
    const fd = await this.savings.createFixedDeposit(account.id, body.principal, body.durationMonths);
    return {
      fixedDeposit: fd,
      balance: (await this.savings.getOrCreateAccount(user.sub, this.ownerType(user.role))).balance,
    };
  }
}
