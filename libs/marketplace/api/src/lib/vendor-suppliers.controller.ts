import { Body, Controller, Delete, ForbiddenException, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser, JwtPayload } from '@afri-market/identity-infrastructure';
import {
  CreateSupplierUseCase,
  ListSuppliersUseCase,
  DeleteSupplierUseCase,
  VendorAccessService,
} from '@afri-market/marketplace-application';
import { CreateSupplierDto } from './dto/create-supplier.dto';

@ApiTags('Vendor Suppliers')
@Controller('vendor/suppliers')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class VendorSuppliersController {
  constructor(
    private readonly createSupplier: CreateSupplierUseCase,
    private readonly listSuppliers: ListSuppliersUseCase,
    private readonly deleteSupplier: DeleteSupplierUseCase,
    private readonly vendorAccess: VendorAccessService,
  ) {}

  private async resolveContext(user: JwtPayload) {
    const ctx = await this.vendorAccess.assertPermission(user, 'manage_products');
    if (!ctx) {
      throw new ForbiddenException('You do not have permission to manage inventory');
    }
    return ctx;
  }

  @Get()
  @ApiOperation({ summary: 'List the vendor supplier registry (requires manage_products)' })
  public async list(@CurrentUser() user: JwtPayload) {
    const ctx = await this.resolveContext(user);
    return { data: await this.listSuppliers.execute(ctx.vendorId) };
  }

  @Post()
  @ApiOperation({ summary: 'Create a supplier record (requires manage_products)' })
  public async create(@Body() dto: CreateSupplierDto, @CurrentUser() user: JwtPayload) {
    const ctx = await this.resolveContext(user);
    return this.createSupplier.execute({
      tenantId: user.tenantId,
      vendorId: ctx.vendorId,
      name: dto.name,
      phone: dto.phone,
      contactPerson: dto.contactPerson,
      notes: dto.notes,
      linkedVendorId: dto.linkedVendorId,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate a supplier record (requires manage_products)' })
  public async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    const ctx = await this.resolveContext(user);
    return { data: await this.deleteSupplier.execute({ vendorId: ctx.vendorId, supplierId: id }) };
  }
}