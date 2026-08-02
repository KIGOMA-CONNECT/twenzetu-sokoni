import {
  Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CurrentUser, JwtPayload, Roles, RolesGuard } from '@afri-market/identity-infrastructure';
import { UserOrmEntity } from '@afri-market/identity-infrastructure';
import { ADMIN_ROLES, UserRole } from '@afri-market/identity-domain';

@ApiTags('Admin Users')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('super_admin')
@Controller('admin/users')
export class AdminUsersController {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly userRepo: Repository<UserOrmEntity>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all admin/super_admin users in tenant' })
  @ApiResponse({ status: 200, description: 'Success' })
  public async listAdmins(@CurrentUser() user: JwtPayload) {
    const entities = await this.userRepo.find({
      where: { tenantId: user.tenantId },
      order: { createdAt: 'DESC' },
    });
    return entities
      .filter(u => ADMIN_ROLES.includes(u.role as UserRole))
      .map(u => ({
        id: u.id,
        fullName: u.fullName,
        phoneNumber: u.phoneNumber,
        role: u.role,
        status: u.status,
        email: u.email,
        permissions: u.permissions ? u.permissions.split(',').filter(Boolean) : [],
        createdAt: u.createdAt,
      }));
  }

  @Post()
  @ApiOperation({ summary: 'Create a new admin/super_admin user' })
  @ApiResponse({ status: 201, description: 'Admin user created' })
  public async createAdmin(
    @CurrentUser() caller: JwtPayload,
    @Body() dto: { phoneNumber: string; fullName: string; password: string; role: string; permissions?: string[]; email?: string },
  ) {
    if (!ADMIN_ROLES.includes(dto.role as UserRole)) {
      return { success: false, message: `Invalid role. Must be one of: ${ADMIN_ROLES.join(', ')}` };
    }
    const existing = await this.userRepo.findOne({ where: { phoneNumber: dto.phoneNumber } });
    if (existing) {
      return { success: false, message: 'Phone number already registered' };
    }

    const argon2 = await import('argon2');
    const passwordHash = await argon2.hash(dto.password);

    const entity = this.userRepo.create({
      tenantId: caller.tenantId,
      phoneNumber: dto.phoneNumber,
      fullName: dto.fullName,
      role: dto.role,
      passwordHash,
      email: dto.email ?? null,
      status: 'ACTIVE',
      permissions: dto.permissions?.length ? dto.permissions.join(',') : null,
    });
    const saved = await this.userRepo.save(entity);
    return { success: true, userId: saved.id };
  }

  @Patch(':id/role')
  @ApiOperation({ summary: 'Change admin user role' })
  @ApiResponse({ status: 200, description: 'Role updated' })
  public async updateAdminRole(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() caller: JwtPayload,
    @Body() body: { role: string },
  ) {
    if (id === caller.sub) {
      return { success: false, message: 'Cannot change your own role' };
    }
    await this.userRepo.update(id, { role: body.role });
    return { success: true };
  }

  @Patch(':id/permissions')
  @ApiOperation({ summary: 'Update admin user permissions' })
  @ApiResponse({ status: 200, description: 'Permissions updated' })
  public async updatePermissions(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { permissions: string[] },
  ) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      return { success: false, message: 'User not found' };
    }
    if (user.role === 'super_admin') {
      return { success: false, message: 'Super admins have all permissions' };
    }
    user.permissions = dto.permissions.length ? dto.permissions.join(',') : null;
    await this.userRepo.save(user);
    return { success: true };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an admin user' })
  @ApiResponse({ status: 200, description: 'Admin user deleted' })
  public async deleteAdmin(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() caller: JwtPayload,
  ) {
    if (id === caller.sub) {
      return { success: false, message: 'Cannot delete your own account' };
    }
    await this.userRepo.delete(id);
    return { success: true };
  }
}
