import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CurrentUser, JwtPayload } from '@afri-market/identity-infrastructure';
import { CreateProcurementDto } from './dto/create-procurement.dto';
import { SubmitQuoteDto } from './dto/submit-quote.dto';
import { CreateProcurementUseCase, SubmitQuoteUseCase, CreateCustomProcurementCommand, SubmitVendorQuoteCommand, GetProcurementDetailUseCase } from '@afri-market/marketplace-application';

@ApiTags('Procurement')
@Controller('procurement')
@ApiBearerAuth()
export class ProcurementController {
  constructor(
    private readonly createProcurement: CreateProcurementUseCase,
    private readonly submitQuote: SubmitQuoteUseCase,
    private readonly getProcurementDetail: GetProcurementDetailUseCase,
  ) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create a procurement request' })
  @ApiBody({ type: CreateProcurementDto })
  @ApiResponse({ status: 201, description: 'Procurement request created' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async create(@Body() dto: CreateProcurementDto, @CurrentUser() user: JwtPayload) {
    const command = new CreateCustomProcurementCommand(
      user.sub,
      dto.productQuery,
      dto.specifications,
    );
    return this.createProcurement.execute(user.tenantId, command);
  }

  @Post('quotes')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Submit a vendor quote' })
  @ApiBody({ type: SubmitQuoteDto })
  @ApiResponse({ status: 201, description: 'Quote submitted' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async submitQuoteEndpoint(@Body() dto: SubmitQuoteDto, @CurrentUser() user: JwtPayload) {
    const command = new SubmitVendorQuoteCommand(
      dto.procurementId,
      user.sub,
      dto.price,
      dto.currency ?? 'TZS',
      dto.itemCondition,
      dto.warrantyPeriodDays ?? 0,
    );
    return this.submitQuote.execute(user.tenantId, command);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiParam({ name: 'id', description: 'Procurement ID' })
  @ApiOperation({ summary: 'Get procurement request by ID' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public async findOneEndpoint(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.getProcurementDetail.execute(user.tenantId, id);
  }
}
