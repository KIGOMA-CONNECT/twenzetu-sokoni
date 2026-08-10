import { Body, Controller, ForbiddenException, BadRequestException, Get, Post, Query, UseGuards, UseInterceptors, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse, ApiBody } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CurrentUser, JwtPayload, Roles, RolesGuard } from '@afri-market/identity-infrastructure';
import { WalletCreditDto } from './dto/wallet-credit.dto';
import { WalletDebitDto } from './dto/wallet-debit.dto';
import { WalletTopupDto } from './dto/wallet-topup.dto';
import { WalletWithdrawDto } from './dto/wallet-withdraw.dto';
import { MobileMoneyService, defaultCurrency, getCurrencyForPhone, providerLabel } from '@afri-market/integrations';
import {
  GetWalletUseCase,
  CreditWalletUseCase,
  DebitWalletUseCase,
  ListWalletTransactionsUseCase,
  FindVendorsUseCase,
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
    private readonly findVendors: FindVendorsUseCase,
    @InjectDataSource() private readonly ds: DataSource,
  ) {}

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get current user wallet balance' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async getMyWallet(@CurrentUser() user: JwtPayload) {
    const wallet = await this.getWallet.execute(user.tenantId, await this.resolveWalletOwner(user), getCurrencyForPhone(user.phoneNumber));
    return {
      id: wallet.id,
      balance: wallet.balance,
      pendingBalance: wallet.pendingBalance,
      currency: wallet.currency,
    };
  }

  private async resolveWalletOwner(user: JwtPayload): Promise<string> {
    if (user.role === 'vendor') {
      const vendor = await this.findVendors.findByUserId(user.sub);
      if (vendor) return vendor.id.value;
    }
    return user.sub;
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
    const ownerId = await this.resolveWalletOwner(user);
    const result = await this.listTransactions.execute(user.tenantId, ownerId, { limit: parsedLimit, offset: parsedOffset });
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
    const adminRoles = ['admin', 'super_admin', 'finance_admin', 'operations_admin', 'compliance_admin'];
    if (!adminRoles.includes(user.role)) {
      throw new ForbiddenException('Only finance/admin users can credit wallets');
    }
    const wallet = await this.creditWallet.execute(
      user.tenantId, await this.resolveWalletOwner(user), body.amount,
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
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Debit wallet (payment / withdrawal)' })
  @ApiBody({ type: WalletDebitDto })
  @ApiResponse({ status: 201, description: 'Wallet debited' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden: admin only' })
  public async debit(
    @CurrentUser() user: JwtPayload,
    @Body() body: WalletDebitDto,
  ) {
    const wallet = await this.debitWallet.execute(
      user.tenantId, await this.resolveWalletOwner(user), body.amount,
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
      const cardResult = await this.mobileMoney.initiateCardCheckout({
        amount: body.amount,
        accountReference: cardRef,
        description: `Wallet top-up: ${body.amount} ${currency}`,
        currency,
      });

      if (!cardResult.success || !cardResult.checkoutUrl) {
        return {
          success: false,
          message: cardResult.message || 'Failed to initiate card payment',
        };
      }

      await this.ds.query(
        `INSERT INTO wallet_topup_requests (tenant_id, user_id, amount, phone_number, checkout_request_id, provider, card_reference, status)
         VALUES ($1, $2, $3, $4, $5, 'card', $6, 'PENDING')`,
        [user.tenantId, user.sub, body.amount, body.phoneNumber, cardRef, cardRef],
      );

      return {
        success: true,
        checkoutRequestId: cardRef,
        checkoutUrl: cardResult.checkoutUrl,
        message: 'Card payment initiated. You will be redirected to complete payment.',
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

  @Post('withdraw')
  @UseInterceptors(CacheInvalidationInterceptor)
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Withdraw wallet balance to mobile money (vendors & drivers)' })
  @ApiBody({ type: WalletWithdrawDto })
  @ApiResponse({ status: 201, description: 'Withdrawal initiated' })
  @ApiResponse({ status: 400, description: 'Insufficient balance or failed initiation' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Customers cannot withdraw' })
  public async withdraw(
    @CurrentUser() user: JwtPayload,
    @Body() body: WalletWithdrawDto,
  ) {
    if (user.role !== 'vendor' && user.role !== 'driver') {
      throw new ForbiddenException('Only vendors and drivers can withdraw wallet funds');
    }

    const currency = defaultCurrency();
    const ownerId = await this.resolveWalletOwner(user);

    const reference = `withdrawal_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    let balance: number;
    try {
      const debited = await this.debitWallet.execute(
        user.tenantId,
        ownerId,
        body.amount,
        body.description ?? `Wallet withdrawal to ${body.phoneNumber} (${providerLabel(body.provider)})`,
        reference,
        'withdrawal',
      );
      balance = debited.balance;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Insufficient wallet balance: ${message}`);
    }

    const disburseResult = await this.mobileMoney.disburse({
      phoneNumber: body.phoneNumber,
      amount: body.amount,
      reference,
      description: body.description ?? `Wallet withdrawal ${body.amount} ${currency} (${providerLabel(body.provider)})`,
      provider: body.provider,
      currency,
    });

    if (!disburseResult.success) {
      // Refund the reserved funds so a failed payout never leaves the wallet debited.
      try {
        await this.creditWallet.execute(
          user.tenantId,
          ownerId,
          body.amount,
          `Withdrawal refund (disbursement failed): ${reference}`,
          reference,
          'withdrawal_refund',
        );
        balance = (await this.getWallet.execute(user.tenantId, ownerId, getCurrencyForPhone(user.phoneNumber))).balance;
      } catch (refundError) {
        const refundMessage = refundError instanceof Error ? refundError.message : String(refundError);
        this.logger.error(`Refund failed for withdrawal ${reference}: ${refundMessage}`);
      }
      await this.ds.query(
        `INSERT INTO wallet_withdrawals (tenant_id, user_id, amount, phone_number, provider, reference, status, message)
         VALUES ($1, $2, $3, $4, $5, $6, 'FAILED', $7)`,
        [user.tenantId, user.sub, body.amount, body.phoneNumber, body.provider, reference, disburseResult.message ?? 'Disbursement failed'],
      );
      throw new BadRequestException(disburseResult.message || 'Failed to initiate withdrawal');
    }

    await this.ds.query(
      `INSERT INTO wallet_withdrawals (tenant_id, user_id, amount, phone_number, provider, reference, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'COMPLETED')`,
      [user.tenantId, user.sub, body.amount, body.phoneNumber, body.provider, reference],
    );

    return {
      success: true,
      reference,
      balance,
      message: `${providerLabel(body.provider)} withdrawal of ${body.amount} ${currency} initiated to ${body.phoneNumber}.`,
    };
  }
}
