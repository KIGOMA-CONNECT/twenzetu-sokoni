import {
  Body, Controller, Get, Post, Param, ParseUUIDPipe, UseGuards, Logger, BadRequestException, NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CurrentUser, JwtPayload } from '@afri-market/identity-infrastructure';

import { IsString, IsNotEmpty, IsOptional, Length } from 'class-validator';

class GenerateReferralDto {
  @IsString()
  @IsOptional()
  @Length(6, 20)
  customCode?: string;
}

class RegisterReferralDto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 20)
  referralCode!: string;

  @IsString()
  @IsNotEmpty()
  referredPhone!: string;

  @IsString()
  @IsOptional()
  tenantId?: string;
}

class ClaimRewardDto {
  @IsString()
  @IsNotEmpty()
  referralId!: string;
}

@ApiTags('Referrals')
@Controller('referrals')
@ApiBearerAuth()
export class ReferralsController {
  private readonly logger = new Logger(ReferralsController.name);

  constructor(
    @InjectDataSource() private readonly ds: DataSource,
  ) {}

  @Post('generate')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Generate a referral code for the current user' })
  @ApiBody({ schema: { properties: { customCode: { type: 'string' } } } })
  @ApiResponse({ status: 201, description: 'Referral code generated' })
  async generateCode(@CurrentUser() user: JwtPayload, @Body() body: GenerateReferralDto) {
    const existing = await this.ds.query(
      `SELECT referral_code FROM "users" WHERE id = $1`,
      [user.sub],
    );
    if (existing[0]?.referral_code) {
      return { referralCode: existing[0].referral_code };
    }

    const code = body.customCode || this.generateRandomCode();

    const taken = await this.ds.query(
      `SELECT id FROM "users" WHERE referral_code = $1`,
      [code],
    );
    if (taken.length > 0) {
      throw new BadRequestException('Referral code already taken');
    }

    await this.ds.query(
      `UPDATE "users" SET referral_code = $1 WHERE id = $2`,
      [code, user.sub],
    );

    return { referralCode: code };
  }

  @Get('code')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get current user referral code' })
  async getMyCode(@CurrentUser() user: JwtPayload) {
    const result = await this.ds.query(
      `SELECT referral_code FROM "users" WHERE id = $1`,
      [user.sub],
    );
    return { referralCode: result[0]?.referral_code || null };
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'List referrals made by the current user' })
  @ApiResponse({ status: 200, description: 'List of referrals' })
  async getMyReferrals(@CurrentUser() user: JwtPayload) {
    const rows = await this.ds.query(
      `SELECT r.id, r.referral_code, r.referred_phone, r.referred_id,
              r.status, r.reward_amount, r.reward_claimed, r.created_at,
              u.full_name as referred_name
       FROM referrals r
       LEFT JOIN "users" u ON u.id = r.referred_id
       WHERE r.referrer_id = $1 AND r.tenant_id = $2
       ORDER BY r.created_at DESC`,
      [user.sub, user.tenantId],
    );
    return { data: rows };
  }

  @Get('stats')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get referral stats for the current user' })
  async getMyStats(@CurrentUser() user: JwtPayload) {
    const result = await this.ds.query(
      `SELECT
         COUNT(*)::int as total_referrals,
         COUNT(*) FILTER (WHERE status = 'COMPLETED')::int as completed_referrals,
         COALESCE(SUM(reward_amount) FILTER (WHERE reward_claimed = true), 0) as total_earned,
         COALESCE(SUM(reward_amount) FILTER (WHERE reward_claimed = false AND status = 'COMPLETED'), 0) as pending_rewards
       FROM referrals
       WHERE referrer_id = $1 AND tenant_id = $2`,
      [user.sub, user.tenantId],
    );
    return result[0] || { totalReferrals: 0, completedReferrals: 0, totalEarned: 0, pendingRewards: 0 };
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a referral when a new user signs up with a referral code (no auth needed)' })
  @ApiBody({ schema: { properties: { referralCode: { type: 'string' }, referredPhone: { type: 'string' } } } })
  async registerReferral(@Body() body: RegisterReferralDto) {
    const referrer = await this.ds.query(
      `SELECT id, tenant_id FROM "users" WHERE referral_code = $1`,
      [body.referralCode],
    );
    if (referrer.length === 0) {
      throw new NotFoundException('Invalid referral code');
    }

    const existing = await this.ds.query(
      `SELECT id FROM referrals WHERE referral_code = $1 AND referred_phone = $2`,
      [body.referralCode, body.referredPhone],
    );
    if (existing.length > 0) {
      return { message: 'Referral already registered' };
    }

    await this.ds.query(
      `INSERT INTO referrals (tenant_id, referrer_id, referral_code, referred_phone, status)
       VALUES ($1, $2, $3, $4, 'PENDING')`,
      [referrer[0].tenant_id, referrer[0].id, body.referralCode, body.referredPhone],
    );

    return { message: 'Referral registered successfully' };
  }

  @Post('claim')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Claim reward for a completed referral' })
  @ApiBody({ schema: { properties: { referralId: { type: 'string' } } } })
  async claimReward(@CurrentUser() user: JwtPayload, @Body() body: ClaimRewardDto) {
    const referral = await this.ds.query(
      `SELECT * FROM referrals WHERE id = $1 AND referrer_id = $2 AND tenant_id = $3`,
      [body.referralId, user.sub, user.tenantId],
    );
    if (referral.length === 0) {
      throw new NotFoundException('Referral not found');
    }

    const ref = referral[0];
    if (ref.reward_claimed) {
      throw new BadRequestException('Reward already claimed');
    }
    if (ref.status !== 'COMPLETED') {
      throw new BadRequestException('Referral is not yet completed');
    }

    const wallet = await this.ds.query(
      `SELECT id FROM wallets WHERE owner_id = $1`,
      [user.sub],
    );
    if (wallet.length === 0) {
      throw new BadRequestException('No wallet found. Please create a wallet first.');
    }

    await this.ds.query(
      `INSERT INTO wallet_transactions (tenant_id, wallet_id, type, amount, balance_before, balance_after, description, reference_type, reference_id)
       VALUES ($1, $2, 'CREDIT', $3, 0, $3, 'Referral reward', 'referral', $4)`,
      [user.tenantId, wallet[0].id, ref.reward_amount, ref.id],
    );

    await this.ds.query(
      `UPDATE wallets SET balance = balance + $1 WHERE id = $2`,
      [ref.reward_amount, wallet[0].id],
    );

    await this.ds.query(
      `UPDATE referrals SET reward_claimed = true WHERE id = $1`,
      [ref.id],
    );

    return { message: 'Reward claimed successfully', amount: ref.reward_amount };
  }

  @Post(':id/complete')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Mark a referral as completed (called when referred user places first order)' })
  async completeReferral(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    const referral = await this.ds.query(
      `SELECT * FROM referrals WHERE id = $1 AND tenant_id = $2`,
      [id, user.tenantId],
    );
    if (referral.length === 0) {
      throw new NotFoundException('Referral not found');
    }

    const rewardAmount = 5000;

    await this.ds.query(
      `UPDATE referrals SET status = 'COMPLETED', reward_amount = $1, referred_id = $2 WHERE id = $3`,
      [rewardAmount, user.sub, id],
    );

    return { message: 'Referral completed', rewardAmount };
  }

  private generateRandomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}
