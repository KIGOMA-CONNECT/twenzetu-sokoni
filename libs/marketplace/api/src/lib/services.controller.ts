import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Inject } from '@nestjs/common';
import { EntityId } from '@afri-market/kernel';
import { CurrentUser, JwtPayload } from '@afri-market/identity-infrastructure';
import { IVendorRepository, IServiceListingRepository } from '@afri-market/marketplace-domain';
import { VENDOR_REPOSITORY, SERVICE_LISTING_REPOSITORY } from '@afri-market/marketplace-application';
import {
  CreateServiceListingUseCase,
  ListServiceListingsUseCase,
  CreateServiceRequestUseCase,
  ListServiceRequestsUseCase,
  SubmitServiceQuoteUseCase,
  AcceptServiceQuoteUseCase,
  SendServiceMessageUseCase,
  ListServiceMessagesUseCase,
  DeleteServiceListingUseCase,
  CreateServiceListingCommand,
  CreateServiceRequestCommand,
  SubmitServiceQuoteCommand,
  AcceptServiceQuoteCommand,
} from '@afri-market/marketplace-application';
import { CreateServiceListingDto } from './dto/create-service-listing.dto';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { SubmitServiceQuoteDto } from './dto/submit-service-quote.dto';
import { AcceptServiceQuoteDto } from './dto/accept-service-quote.dto';
import { SendServiceMessageDto } from './dto/send-service-message.dto';

@ApiTags('Services')
@ApiBearerAuth()
@Controller('services')
export class ServicesController {
  constructor(
    private readonly createListing: CreateServiceListingUseCase,
    private readonly listListings: ListServiceListingsUseCase,
    private readonly createRequest: CreateServiceRequestUseCase,
    private readonly listRequests: ListServiceRequestsUseCase,
    private readonly submitQuote: SubmitServiceQuoteUseCase,
    private readonly acceptQuote: AcceptServiceQuoteUseCase,
    private readonly sendMessage: SendServiceMessageUseCase,
    private readonly listMessages: ListServiceMessagesUseCase,
    private readonly deleteListing: DeleteServiceListingUseCase,
    @Inject(VENDOR_REPOSITORY) private readonly vendorRepo: IVendorRepository,
    @Inject(SERVICE_LISTING_REPOSITORY) private readonly listingRepo: IServiceListingRepository,
  ) {}

  // ── Listings ────────────────────────────────────────────────
  @Get('listings')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'List active service listings (optionally by category)' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'vendorId', required: false })
  @ApiResponse({ status: 200, description: 'List of service listings' })
  public async listListingsEndpoint(
    @CurrentUser() user: JwtPayload,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('vendorId') vendorId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    let resolvedVendorId = vendorId;
    if (vendorId === 'mine') {
      const vendor = await this.vendorRepo.findByUserId(user.sub);
      if (!vendor) {
        return { data: [], total: 0 };
      }
      resolvedVendorId = vendor.id.value;
    }
    return this.listListings.execute(user.tenantId, {
      category,
      search,
      vendorId: resolvedVendorId,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  @Post('listings')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create a service listing (vendor)' })
  @ApiBody({ type: CreateServiceListingDto })
  @ApiResponse({ status: 201, description: 'Listing created' })
  public async createListingEndpoint(@Body() dto: CreateServiceListingDto, @CurrentUser() user: JwtPayload) {
    const vendor = await this.vendorRepo.findByUserId(user.sub);
    if (!vendor) {
      return { success: false, error: 'Vendor profile not found' };
    }
    return this.createListing.execute(user.tenantId, new CreateServiceListingCommand(
      vendor.id.value,
      dto.name,
      dto.description,
      dto.category,
      dto.pricingModel,
      dto.basePrice,
      dto.currency ?? 'TZS',
      dto.unitLabel,
      dto.imageUrl,
    ));
  }

  @Get('listings/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiParam({ name: 'id', description: 'Listing ID' })
  @ApiOperation({ summary: 'Get a single service listing' })
  public async getListingEndpoint(@Param('id', ParseUUIDPipe) id: string) {
    const listing = await this.listingRepo.findById(EntityId.from(id));
    return { data: listing?.toDto() ?? null };
  }

  @Delete('listings/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiParam({ name: 'id', description: 'Listing ID' })
  @ApiOperation({ summary: 'Delete a service listing (vendor, only if no active requests)' })
  @ApiResponse({ status: 200, description: 'Listing deleted' })
  public async deleteListingEndpoint(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    const vendor = await this.vendorRepo.findByUserId(user.sub);
    if (!vendor) {
      return { success: false, error: 'Vendor profile not found' };
    }
    return this.deleteListing.execute(user.tenantId, id, vendor.id.value);
  }

  // ── Requests ────────────────────────────────────────────────
  @Post('requests')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create a service request (customer)' })
  @ApiBody({ type: CreateServiceRequestDto })
  @ApiResponse({ status: 201, description: 'Request created' })
  public async createRequestEndpoint(@Body() dto: CreateServiceRequestDto, @CurrentUser() user: JwtPayload) {
    return this.createRequest.execute(user.tenantId, new CreateServiceRequestCommand(
      user.sub,
      dto.vendorId,
      dto.listingId,
      dto.title,
      dto.quantity,
      dto.unitLabel ?? 'unit',
      dto.details ?? '',
      dto.photoUrls ?? [],
      dto.currency ?? 'TZS',
    ));
  }

  @Get('requests')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'List my service requests (customer or vendor)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiResponse({ status: 200, description: 'List of service requests' })
  public async listRequestsEndpoint(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
  ) {
    let scopeUserId = user.sub;
    if (user.role === 'vendor') {
      const vendor = await this.vendorRepo.findByUserId(user.sub);
      if (!vendor) {
        return { data: [], total: 0 };
      }
      scopeUserId = vendor.id.value;
    }
    return this.listRequests.execute(user.tenantId, user.role, scopeUserId, { status });
  }

  @Get('requests/:id/messages')
  @UseGuards(AuthGuard('jwt'))
  @ApiParam({ name: 'id', description: 'Request ID' })
  @ApiOperation({ summary: 'Get negotiation messages for a service request' })
  public async getRequestMessages(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    const data = await this.listMessages.execute(user.tenantId, id);
    return { data };
  }

  // ── Quotes ──────────────────────────────────────────────────
  @Post('quotes')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Submit a quote for a service request (vendor)' })
  @ApiBody({ type: SubmitServiceQuoteDto })
  @ApiResponse({ status: 201, description: 'Quote submitted' })
  public async submitQuoteEndpoint(@Body() dto: SubmitServiceQuoteDto, @CurrentUser() user: JwtPayload) {
    const vendor = await this.vendorRepo.findByUserId(user.sub);
    if (!vendor) {
      return { success: false, error: 'Vendor profile not found' };
    }
    return this.submitQuote.execute(user.tenantId, new SubmitServiceQuoteCommand(
      dto.requestId,
      vendor.id.value,
      dto.price,
      dto.currency ?? 'TZS',
      dto.message,
    ));
  }

  @Post('quotes/accept')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Accept a quote and create the order (customer)' })
  @ApiBody({ type: AcceptServiceQuoteDto })
  @ApiResponse({ status: 201, description: 'Order created' })
  public async acceptQuoteEndpoint(@Body() dto: AcceptServiceQuoteDto, @CurrentUser() user: JwtPayload) {
    return this.acceptQuote.execute(
      user.tenantId,
      new AcceptServiceQuoteCommand(dto.quoteId, user.sub),
      dto.paymentMethod,
      user.phoneNumber,
      user.phoneNumber,
      dto.deliveryAddress,
      dto.specialInstructions,
    );
  }

  // ── Negotiation messages ────────────────────────────────────
  @Post('messages')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Send a negotiation message on a service request' })
  @ApiBody({ type: SendServiceMessageDto })
  @ApiResponse({ status: 201, description: 'Message sent' })
  public async sendMessageEndpoint(@Body() dto: SendServiceMessageDto, @CurrentUser() user: JwtPayload) {
    const data = await this.sendMessage.execute(
      user.tenantId,
      dto.requestId,
      { id: user.sub, name: user.phoneNumber ?? user.sub, role: user.role ?? 'customer' },
      dto.message,
    );
    return { data };
  }
}
