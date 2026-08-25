import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser, JwtPayload } from '@afri-market/identity-infrastructure';
import { SmsCreditsService } from './sms-credits.service';
import { PurchaseSmsCreditsDto } from './dto/purchase-sms-credits.dto';
import { SendSmsDto } from './dto/send-sms.dto';

@ApiTags('SMS Credits')
@Controller('sms')
@ApiBearerAuth()
export class SmsController {
  constructor(private readonly smsCreditsService: SmsCreditsService) {}

  @Get('credits')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get SMS credits balance' })
  async getCredits(@CurrentUser() user: JwtPayload) {
    return this.smsCreditsService.getCredits(user.tenantId, user.sub);
  }

  @Get('bundles')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get available SMS bundles' })
  async getBundles() {
    return [
      { credits: 100, price: 1500, label: '100 SMS' },
      { credits: 500, price: 6500, label: '500 SMS', savings: '13%' },
      { credits: 1000, price: 12000, label: '1000 SMS', savings: '20%' },
      { credits: 5000, price: 55000, label: '5000 SMS', savings: '27%' },
    ];
  }

  @Post('credits/purchase')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Purchase SMS credits' })
  async purchaseCredits(@CurrentUser() user: JwtPayload, @Body() body: PurchaseSmsCreditsDto) {
    return this.smsCreditsService.purchaseCredits(user.tenantId, user.sub, body.credits, body.amount);
  }

  @Post('send')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Send SMS to supplier or customer' })
  async sendSms(@CurrentUser() user: JwtPayload, @Body() body: SendSmsDto) {
    return this.smsCreditsService.sendSms(user.tenantId, user.sub, body.recipientPhone, body.message, body.recipientType);
  }

  @Get('logs')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get SMS sending history' })
  async getLogs(@CurrentUser() user: JwtPayload, @Query('limit') limit?: number, @Query('offset') offset?: number) {
    return this.smsCreditsService.getLogs(user.tenantId, user.sub, limit ?? 50, offset ?? 0);
  }

  @Get('phone-sms')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Generate phone SMS deep link' })
  async getPhoneSmsLink(@CurrentUser() user: JwtPayload, @Query('phone') phone: string, @Query('message') message: string) {
    const encodedMessage = encodeURIComponent(message);
    return {
      smsUrl: `sms:${phone}?body=${encodedMessage}`,
      note: 'Open this URL on your phone to send SMS from your phone directly (uses your airtime)',
    };
  }
}
