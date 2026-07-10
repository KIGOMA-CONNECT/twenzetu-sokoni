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
import { Body, Controller, Get, NotFoundException, Param, Patch, Post, Query } from '@nestjs/common';
import { CreateOrgUnitTypeDto } from './dto/create-org-unit-type.dto';
import { CreateOrgUnitDto } from './dto/create-org-unit.dto';
import { MoveOrgUnitDto } from './dto/move-org-unit.dto';
import { RenameOrgUnitDto } from './dto/rename-org-unit.dto';

@Controller('organization')
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
