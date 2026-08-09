import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { CurrentUser, JwtPayload, Roles, RolesGuard } from '@afri-market/identity-infrastructure';
import { ADMIN_ROLES } from '@afri-market/identity-domain';
import { FindVendorsUseCase } from '@afri-market/marketplace-application';
import { VendorSubscriptionService } from '@afri-market/core-finance';
import { IsString, IsUUID } from 'class-validator';

const FINANCE_ADMIN_ROLES = ADMIN_ROLES.filter((r) => r !== 'support_admin' && r !== 'marketing_admin');

class SubscribeDto {
  @IsString()
  @IsUUID()
  tierId!: string;
}

@ApiTags('Vendor Subscriptions')
@Controller('vendor-subscriptions')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class VendorSubscriptionsController {
  constructor(
    private readonly subs: VendorSubscriptionService,
    private readonly findVendors: FindVendorsUseCase,
  ) {}

  private async resolveVendorId(user: JwtPayload): Promise<string> {
    if (user.role === 'vendor') {
      const vendor = await this.findVendors.findByUserId(user.sub);
      if (vendor) return vendor.id.value;
    }
    return user.sub;
  }

  @Get('tiers')
  @ApiOperation({ summary: 'List available vendor subscription tiers' })
  @ApiResponse({ status: 200, description: 'Success' })
  public async tiers() {
    return { data: await this.subs.getTiers() };
  }

  @Get('me')
  @ApiOperation({ summary: 'Get my active vendor subscription' })
  @ApiResponse({ status: 200, description: 'Success' })
  public async mine(@CurrentUser() user: JwtPayload) {
    return await this.subs.getVendorSubscription(await this.resolveVendorId(user));
  }

  @Post('subscribe')
  @ApiOperation({ summary: 'Subscribe the current vendor to a tier' })
  @ApiBody({ type: SubscribeDto })
  @ApiResponse({ status: 201, description: 'Subscription created' })
  public async subscribe(@CurrentUser() user: JwtPayload, @Body() body: SubscribeDto) {
    return this.subs.subscribe(await this.resolveVendorId(user), user.tenantId, body.tierId);
  }

  @Get('me/invoices')
  @ApiOperation({ summary: 'Get invoices for my vendor subscription' })
  @ApiResponse({ status: 200, description: 'Success' })
  public async myInvoices(@CurrentUser() user: JwtPayload) {
    return { data: await this.subs.getVendorInvoices(await this.resolveVendorId(user)) };
  }

  @Get(':vendorId')
  @ApiOperation({ summary: 'Get active subscription for a vendor (public view)' })
  @ApiParam({ name: 'vendorId', description: 'Vendor ID' })
  public async byVendor(@Param('vendorId', ParseUUIDPipe) vendorId: string) {
    return await this.subs.getVendorSubscription(vendorId);
  }

  @Post('invoices/:invoiceId/paid')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...FINANCE_ADMIN_ROLES)
  @ApiOperation({ summary: 'Mark an invoice as paid (admin)' })
  @ApiParam({ name: 'invoiceId', description: 'Invoice ID' })
  public async markPaid(@Param('invoiceId', ParseUUIDPipe) invoiceId: string) {
    return this.subs.markInvoicePaid(invoiceId);
  }
}
