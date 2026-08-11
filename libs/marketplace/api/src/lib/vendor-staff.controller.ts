import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CurrentUser, JwtPayload } from '@afri-market/identity-infrastructure';
import {
  InviteVendorStaffUseCase,
  ListVendorStaffUseCase,
  UpdateVendorStaffUseCase,
  RemoveVendorStaffUseCase,
  VendorAccessService,
} from '@afri-market/marketplace-application';
import { InviteVendorStaffDto } from './dto/invite-vendor-staff.dto';
import { UpdateVendorStaffDto } from './dto/update-vendor-staff.dto';

@ApiTags('Vendor Staff')
@Controller('vendor-staff')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class VendorStaffController {
  constructor(
    private readonly inviteStaff: InviteVendorStaffUseCase,
    private readonly listStaff: ListVendorStaffUseCase,
    private readonly updateStaff: UpdateVendorStaffUseCase,
    private readonly removeStaff: RemoveVendorStaffUseCase,
    private readonly vendorAccess: VendorAccessService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Get the current user vendor staff context (vendorId, role, permissions)' })
  @ApiResponse({ status: 200, description: 'Vendor access context or null' })
  public async me(@CurrentUser() user: JwtPayload) {
    const ctx = await this.vendorAccess.resolve(user);
    return { data: ctx };
  }

  @Get()
  @ApiOperation({ summary: 'List staff for the current vendor (owner and staff only)' })
  @ApiResponse({ status: 200, description: 'Staff list' })
  public async list(@CurrentUser() user: JwtPayload) {
    const ctx = await this.vendorAccess.resolve(user);
    if (!ctx) {
      throw new ForbiddenException('Not a vendor');
    }
    return { data: await this.listStaff.execute(ctx.vendorId) };
  }

  @Post('invite')
  @ApiOperation({ summary: 'Invite staff by phone (owner only)' })
  @ApiBody({ type: InviteVendorStaffDto })
  @ApiResponse({ status: 201, description: 'Staff invited' })
  public async invite(@Body() dto: InviteVendorStaffDto, @CurrentUser() user: JwtPayload) {
    const ctx = await this.vendorAccess.resolve(user);
    if (!ctx || !ctx.isOwner) {
      throw new ForbiddenException('Only the vendor owner can invite staff');
    }
    return await this.inviteStaff.execute({
      tenantId: user.tenantId,
      vendorId: ctx.vendorId,
      phoneNumber: dto.phoneNumber,
      fullName: dto.fullName,
      role: dto.role,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Change a staff member role (owner only)' })
  @ApiParam({ name: 'id', description: 'Staff member ID' })
  @ApiBody({ type: UpdateVendorStaffDto })
  @ApiResponse({ status: 200, description: 'Staff updated' })
  public async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVendorStaffDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const ctx = await this.vendorAccess.resolve(user);
    if (!ctx || !ctx.isOwner) {
      throw new ForbiddenException('Only the vendor owner can manage staff');
    }
    return { data: await this.updateStaff.execute(ctx.vendorId, id, dto.role) };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a staff member (owner only)' })
  @ApiParam({ name: 'id', description: 'Staff member ID' })
  @ApiResponse({ status: 200, description: 'Staff removed' })
  public async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    const ctx = await this.vendorAccess.resolve(user);
    if (!ctx || !ctx.isOwner) {
      throw new ForbiddenException('Only the vendor owner can manage staff');
    }
    return { data: await this.removeStaff.execute(ctx.vendorId, id) };
  }
}
