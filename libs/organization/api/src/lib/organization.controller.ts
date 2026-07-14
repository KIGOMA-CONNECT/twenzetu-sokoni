import { CommandBusAdapter, QueryBusAdapter } from '@abms/cqrs';
import {
  CreateOrgUnitCommand,
  CreateOrgUnitResult,
  CreateOrgUnitTypeCommand,
  CreateOrgUnitTypeResult,
  DeactivateOrgUnitCommand,
  GetOrgUnitAncestorsQuery,
  GetOrgUnitByIdQuery,
  GetOrgUnitTreeQuery,
  ListOrgUnitTypesQuery,
  MoveOrgUnitCommand,
  OrgUnitReadModel,
  OrgUnitTreeNode,
  OrgUnitTypeReadModel,
  ReactivateOrgUnitCommand,
  RenameOrgUnitCommand,
} from '@abms/organization-application';
import { Body, Controller, Get, NotFoundException, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreateOrgUnitTypeDto } from './dto/create-org-unit-type.dto';
import { CreateOrgUnitDto } from './dto/create-org-unit.dto';
import { MoveOrgUnitDto } from './dto/move-org-unit.dto';
import { RenameOrgUnitDto } from './dto/rename-org-unit.dto';

// AuthGuard('jwt') looks up the 'jwt' Passport strategy by name from the process-wide
// Passport registry — it's a generic @nestjs/passport factory, not an identity-module
// import, so this doesn't create an Nx scope:organization -> scope:identity edge. The
// strategy itself is registered once identity's JwtStrategy is instantiated. Without
// this guard request.user is never populated, so ICurrentUserProvider (and therefore
// the audit log's userId) silently stays null for every organization command.
@Controller('organization')
@UseGuards(AuthGuard('jwt'))
export class OrganizationController {
  public constructor(
    private readonly commandBus: CommandBusAdapter,
    private readonly queryBus: QueryBusAdapter,
  ) {}

  @Post('types')
  public createType(@Body() dto: CreateOrgUnitTypeDto): Promise<CreateOrgUnitTypeResult> {
    return this.commandBus.execute(
      new CreateOrgUnitTypeCommand(
        dto.code,
        dto.name,
        dto.description ?? null,
        dto.allowedParentTypeIds,
        dto.sortOrder,
      ),
    );
  }

  @Get('types')
  public listTypes(): Promise<OrgUnitTypeReadModel[]> {
    return this.queryBus.execute(new ListOrgUnitTypesQuery());
  }

  @Post('units')
  public createUnit(@Body() dto: CreateOrgUnitDto): Promise<CreateOrgUnitResult> {
    return this.commandBus.execute(
      new CreateOrgUnitCommand(dto.orgUnitTypeId, dto.parentId ?? null, dto.code, dto.name, dto.sortOrder),
    );
  }

  @Get('units/tree')
  public getTree(@Query('rootId') rootId?: string): Promise<OrgUnitTreeNode[]> {
    return this.queryBus.execute(new GetOrgUnitTreeQuery(rootId));
  }

  @Get('units/:id')
  public async getById(@Param('id') id: string): Promise<OrgUnitReadModel> {
    const orgUnit = await this.queryBus.execute(new GetOrgUnitByIdQuery(id));
    if (!orgUnit) {
      throw new NotFoundException(`Org unit "${id}" was not found.`);
    }
    return orgUnit;
  }

  @Get('units/:id/ancestors')
  public getAncestors(@Param('id') id: string): Promise<OrgUnitReadModel[]> {
    return this.queryBus.execute(new GetOrgUnitAncestorsQuery(id));
  }

  @Patch('units/:id/rename')
  public rename(@Param('id') id: string, @Body() dto: RenameOrgUnitDto): Promise<void> {
    return this.commandBus.execute(new RenameOrgUnitCommand(id, dto.name));
  }

  @Patch('units/:id/move')
  public move(@Param('id') id: string, @Body() dto: MoveOrgUnitDto): Promise<void> {
    return this.commandBus.execute(
      new MoveOrgUnitCommand(id, dto.newParentId ?? null, dto.expectedVersion),
    );
  }

  @Patch('units/:id/deactivate')
  public deactivate(@Param('id') id: string): Promise<void> {
    return this.commandBus.execute(new DeactivateOrgUnitCommand(id));
  }

  @Patch('units/:id/reactivate')
  public reactivate(@Param('id') id: string): Promise<void> {
    return this.commandBus.execute(new ReactivateOrgUnitCommand(id));
  }
}
