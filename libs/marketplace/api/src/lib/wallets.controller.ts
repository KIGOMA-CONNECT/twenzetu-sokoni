import { Body, Controller, Get, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CurrentUser, JwtPayload } from '@afri-market/identity-infrastructure';
import { WalletCreditDto } from './dto/wallet-credit.dto';
import { WalletDebitDto } from './dto/wallet-debit.dto';
import {
  GetWalletUseCase,
  CreditWalletUseCase,
  DebitWalletUseCase,
  ListWalletTransactionsUseCase,
} from '@afri-market/marketplace-application';
import { CacheInvalidationInterceptor } from './cache';
import { parsePagination, paginatedResult } from './pagination';

@ApiTags('Wallets')
@Controller('wallets')
@ApiBearerAuth()
export class WalletsController {
  constructor(
    private readonly getWallet: GetWalletUseCase,
    private readonly creditWallet: CreditWalletUseCase,
    private readonly debitWallet: DebitWalletUseCase,
    private readonly listTransactions: ListWalletTransactionsUseCase,
  ) {}

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get current user wallet balance' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async getMyWallet(@CurrentUser() user: JwtPayload) {
    const wallet = await this.getWallet.execute(user.tenantId, user.sub);
    return {
      id: wallet.id,
      balance: wallet.balance,
      pendingBalance: wallet.pendingBalance,
      currency: wallet.currency,
    };
  }

  @Get('transactions')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'List wallet transactions (paginated)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async getTransactions(
    @CurrentUser() user: JwtPayload,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const { limit: parsedLimit, offset: parsedOffset } = parsePagination({ limit, offset });
    const result = await this.listTransactions.execute(user.tenantId, user.sub, { limit: parsedLimit, offset: parsedOffset });
    return paginatedResult(result.data.map(t => t.toDto()), result.total, parsedLimit, parsedOffset);
  }

  @Post('credit')
  @UseInterceptors(CacheInvalidationInterceptor)
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Credit wallet (top-up / payout received)' })
  @ApiBody({ type: WalletCreditDto })
  @ApiResponse({ status: 201, description: 'Wallet credited' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async credit(
    @CurrentUser() user: JwtPayload,
    @Body() body: WalletCreditDto,
  ) {
    const wallet = await this.creditWallet.execute(
      user.tenantId, user.sub, body.amount,
      body.description ?? 'Wallet top-up',
      body.referenceId,
      body.referenceType,
    );
    return {
      walletId: wallet.walletId,
      balance: wallet.balance,
      message: `Credited ${body.amount}`,
    };
  }

  @Post('debit')
  @UseInterceptors(CacheInvalidationInterceptor)
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Debit wallet (payment / withdrawal)' })
  @ApiBody({ type: WalletDebitDto })
  @ApiResponse({ status: 201, description: 'Wallet debited' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async debit(
    @CurrentUser() user: JwtPayload,
    @Body() body: WalletDebitDto,
  ) {
    const wallet = await this.debitWallet.execute(
      user.tenantId, user.sub, body.amount,
      body.description ?? 'Wallet debit',
      body.referenceId,
      body.referenceType,
    );
    return {
      walletId: wallet.walletId,
      balance: wallet.balance,
      message: `Debited ${body.amount}`,
    };
  }
}
