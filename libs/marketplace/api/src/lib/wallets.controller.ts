import { Body, Controller, Get, Post, Query, UseGuards, UseInterceptors, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse, ApiBody } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CurrentUser, JwtPayload } from '@afri-market/identity-infrastructure';
import { WalletCreditDto } from './dto/wallet-credit.dto';
import { WalletDebitDto } from './dto/wallet-debit.dto';
import { WalletTopupDto } from './dto/wallet-topup.dto';
import { MobileMoneyService, defaultCurrency, getCurrencyForPhone, providerLabel } from '@afri-market/integrations';
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
  private readonly logger = new Logger(WalletsController.name);

  constructor(
    private readonly getWallet: GetWalletUseCase,
    private readonly creditWallet: CreditWalletUseCase,
    private readonly debitWallet: DebitWalletUseCase,
    private readonly listTransactions: ListWalletTransactionsUseCase,
    private readonly mobileMoney: MobileMoneyService,
    @InjectDataSource() private readonly ds: DataSource,
  ) {}

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get current user wallet balance' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async getMyWallet(@CurrentUser() user: JwtPayload) {
    const wallet = await this.getWallet.execute(user.tenantId, user.sub, getCurrencyForPhone(user.phoneNumber));
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
      getCurrencyForPhone(user.phoneNumber),
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

  @Post('top-up')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Top-up wallet via mobile money, card or bank' })
  @ApiBody({ type: WalletTopupDto })
  @ApiResponse({ status: 201, description: 'Payment prompt sent' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async topUp(
    @CurrentUser() user: JwtPayload,
    @Body() body: WalletTopupDto,
  ) {
    const provider = body.provider ?? 'mpesa';
    const accountReference = `topup_${user.tenantId}_${user.sub}`;
    const currency = defaultCurrency();

    if (provider === 'card') {
      const cardRef = `card_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      await this.ds.query(
        `INSERT INTO wallet_topup_requests (tenant_id, user_id, amount, phone_number, checkout_request_id, provider, card_reference, status)
         VALUES ($1, $2, $3, $4, $5, 'card', $6, 'PENDING')`,
        [user.tenantId, user.sub, body.amount, body.phoneNumber, cardRef, cardRef],
      );
      return {
        success: true,
        checkoutRequestId: cardRef,
        message: 'Card payment initiated. Complete the payment to confirm your top-up.',
      };
    }

    if (provider === 'bank') {
      const bankRef = `bank_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      await this.ds.query(
        `INSERT INTO wallet_topup_requests (tenant_id, user_id, amount, phone_number, checkout_request_id, provider, card_reference, status)
         VALUES ($1, $2, $3, $4, $5, 'bank', $6, 'PENDING')`,
        [user.tenantId, user.sub, body.amount, body.phoneNumber, bankRef, bankRef],
      );
      return {
        success: true,
        checkoutRequestId: bankRef,
        message: 'Bank transfer instructions sent. Complete the transfer to confirm your top-up.',
      };
    }

    const stkResult = await this.mobileMoney.initiateStkPush({
      phoneNumber: body.phoneNumber,
      amount: body.amount,
      accountReference,
      description: `Wallet top-up: ${body.amount} ${currency} (${provider})`,
      provider,
      currency,
    });

    if (stkResult.responseCode !== '0') {
      return {
        success: false,
        message: stkResult.responseDescription || 'Failed to initiate payment',
      };
    }

    await this.ds.query(
      `INSERT INTO wallet_topup_requests (tenant_id, user_id, amount, phone_number, checkout_request_id, provider, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')`,
      [user.tenantId, user.sub, body.amount, body.phoneNumber, stkResult.checkoutRequestId, provider],
    );

    return {
      success: true,
      checkoutRequestId: stkResult.checkoutRequestId,
      message: `${providerLabel(provider)} prompt sent to your phone. Confirm to complete top-up.`,
    };
  }
}
