import { CommandBusAdapter, QueryBusAdapter } from '@abms/cqrs';
import {
  BranchProfileReadModel,
  CompanyProfileReadModel,
  CostCenterProfileReadModel,
  CreateBranchProfileCommand,
  CreateBranchProfileResult,
  CreateCompanyProfileCommand,
  CreateCompanyProfileResult,
  CreateCostCenterProfileCommand,
  CreateCostCenterProfileResult,
  CreateDepartmentProfileCommand,
  CreateDepartmentProfileResult,
  CreateProfitCenterProfileCommand,
  CreateProfitCenterProfileResult,
  DepartmentProfileReadModel,
  GetBranchProfileByOrgUnitIdQuery,
  GetCompanyProfileByOrgUnitIdQuery,
  GetCostCenterProfileByOrgUnitIdQuery,
  GetDepartmentProfileByOrgUnitIdQuery,
  GetProfitCenterProfileByOrgUnitIdQuery,
  ProfitCenterProfileReadModel,
  UpdateBranchProfileCommand,
  UpdateCompanyProfileCommand,
  UpdateCostCenterProfileCommand,
  UpdateDepartmentProfileCommand,
  UpdateProfitCenterProfileCommand,
} from '@abms/organization-application';
import { Body, Controller, Get, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { CreateBranchProfileDto } from './dto/profiles/create-branch-profile.dto';
import { CreateCompanyProfileDto } from './dto/profiles/create-company-profile.dto';
import { CreateCostCenterProfileDto } from './dto/profiles/create-cost-center-profile.dto';
import { CreateDepartmentProfileDto } from './dto/profiles/create-department-profile.dto';
import { CreateProfitCenterProfileDto } from './dto/profiles/create-profit-center-profile.dto';
import { UpdateBranchProfileDto } from './dto/profiles/update-branch-profile.dto';
import { UpdateCompanyProfileDto } from './dto/profiles/update-company-profile.dto';
import { UpdateCostCenterProfileDto } from './dto/profiles/update-cost-center-profile.dto';
import { UpdateDepartmentProfileDto } from './dto/profiles/update-department-profile.dto';
import { UpdateProfitCenterProfileDto } from './dto/profiles/update-profit-center-profile.dto';

@Controller('organization/units/:orgUnitId/profile')
export class OrganizationProfileController {
  public constructor(
    private readonly commandBus: CommandBusAdapter,
    private readonly queryBus: QueryBusAdapter,
  ) {}

  @Post('company')
  public createCompany(
    @Param('orgUnitId') orgUnitId: string,
    @Body() dto: CreateCompanyProfileDto,
  ): Promise<CreateCompanyProfileResult> {
    return this.commandBus.execute(
      new CreateCompanyProfileCommand(
        orgUnitId,
        dto.legalName,
        dto.registrationNumber,
        dto.taxCountryCode,
        dto.taxNumber,
        dto.functionalCurrency,
        dto.fiscalYearStartMonth,
      ),
    );
  }

  @Get('company')
  public async getCompany(@Param('orgUnitId') orgUnitId: string): Promise<CompanyProfileReadModel> {
    const profile = await this.queryBus.execute(new GetCompanyProfileByOrgUnitIdQuery(orgUnitId));
    if (!profile) {
      throw new NotFoundException(`No company profile found for org unit "${orgUnitId}".`);
    }
    return profile;
  }

  @Patch('company')
  public updateCompany(
    @Param('orgUnitId') orgUnitId: string,
    @Body() dto: UpdateCompanyProfileDto,
  ): Promise<void> {
    return this.commandBus.execute(
      new UpdateCompanyProfileCommand(
        orgUnitId,
        dto.legalName,
        dto.registrationNumber,
        dto.taxCountryCode,
        dto.taxNumber,
        dto.functionalCurrency,
        dto.fiscalYearStartMonth,
        dto.expectedVersion,
      ),
    );
  }

  @Post('branch')
  public createBranch(
    @Param('orgUnitId') orgUnitId: string,
    @Body() dto: CreateBranchProfileDto,
  ): Promise<CreateBranchProfileResult> {
    return this.commandBus.execute(
      new CreateBranchProfileCommand(
        orgUnitId,
        dto.addressLine1,
        dto.addressLine2 ?? null,
        dto.addressCity,
        dto.addressStateOrRegion ?? null,
        dto.addressPostalCode ?? null,
        dto.addressCountryCode,
        dto.operatingCurrency,
        dto.contactPhone ?? null,
        dto.contactEmail ?? null,
      ),
    );
  }

  @Get('branch')
  public async getBranch(@Param('orgUnitId') orgUnitId: string): Promise<BranchProfileReadModel> {
    const profile = await this.queryBus.execute(new GetBranchProfileByOrgUnitIdQuery(orgUnitId));
    if (!profile) {
      throw new NotFoundException(`No branch profile found for org unit "${orgUnitId}".`);
    }
    return profile;
  }

  @Patch('branch')
  public updateBranch(
    @Param('orgUnitId') orgUnitId: string,
    @Body() dto: UpdateBranchProfileDto,
  ): Promise<void> {
    return this.commandBus.execute(
      new UpdateBranchProfileCommand(
        orgUnitId,
        dto.addressLine1,
        dto.addressLine2 ?? null,
        dto.addressCity,
        dto.addressStateOrRegion ?? null,
        dto.addressPostalCode ?? null,
        dto.addressCountryCode,
        dto.operatingCurrency,
        dto.contactPhone ?? null,
        dto.contactEmail ?? null,
        dto.expectedVersion,
      ),
    );
  }

  @Post('department')
  public createDepartment(
    @Param('orgUnitId') orgUnitId: string,
    @Body() dto: CreateDepartmentProfileDto,
  ): Promise<CreateDepartmentProfileResult> {
    return this.commandBus.execute(
      new CreateDepartmentProfileCommand(
        orgUnitId,
        dto.costCenterOrgUnitId ?? null,
        dto.managerReference ?? null,
      ),
    );
  }

  @Get('department')
  public async getDepartment(@Param('orgUnitId') orgUnitId: string): Promise<DepartmentProfileReadModel> {
    const profile = await this.queryBus.execute(new GetDepartmentProfileByOrgUnitIdQuery(orgUnitId));
    if (!profile) {
      throw new NotFoundException(`No department profile found for org unit "${orgUnitId}".`);
    }
    return profile;
  }

  @Patch('department')
  public updateDepartment(
    @Param('orgUnitId') orgUnitId: string,
    @Body() dto: UpdateDepartmentProfileDto,
  ): Promise<void> {
    return this.commandBus.execute(
      new UpdateDepartmentProfileCommand(
        orgUnitId,
        dto.costCenterOrgUnitId ?? null,
        dto.managerReference ?? null,
        dto.expectedVersion,
      ),
    );
  }

  @Post('cost-center')
  public createCostCenter(
    @Param('orgUnitId') orgUnitId: string,
    @Body() dto: CreateCostCenterProfileDto,
  ): Promise<CreateCostCenterProfileResult> {
    return this.commandBus.execute(
      new CreateCostCenterProfileCommand(
        orgUnitId,
        dto.budgetAmount,
        dto.budgetCurrency,
        dto.budgetPeriodStart,
        dto.budgetPeriodEnd,
        dto.glAccountCode ?? null,
      ),
    );
  }

  @Get('cost-center')
  public async getCostCenter(@Param('orgUnitId') orgUnitId: string): Promise<CostCenterProfileReadModel> {
    const profile = await this.queryBus.execute(new GetCostCenterProfileByOrgUnitIdQuery(orgUnitId));
    if (!profile) {
      throw new NotFoundException(`No cost center profile found for org unit "${orgUnitId}".`);
    }
    return profile;
  }

  @Patch('cost-center')
  public updateCostCenter(
    @Param('orgUnitId') orgUnitId: string,
    @Body() dto: UpdateCostCenterProfileDto,
  ): Promise<void> {
    return this.commandBus.execute(
      new UpdateCostCenterProfileCommand(
        orgUnitId,
        dto.budgetAmount,
        dto.budgetCurrency,
        dto.budgetPeriodStart,
        dto.budgetPeriodEnd,
        dto.glAccountCode ?? null,
        dto.expectedVersion,
      ),
    );
  }

  @Post('profit-center')
  public createProfitCenter(
    @Param('orgUnitId') orgUnitId: string,
    @Body() dto: CreateProfitCenterProfileDto,
  ): Promise<CreateProfitCenterProfileResult> {
    return this.commandBus.execute(
      new CreateProfitCenterProfileCommand(
        orgUnitId,
        dto.revenueTargetAmount,
        dto.revenueTargetCurrency,
        dto.reportingCurrency,
        dto.glAccountCode ?? null,
      ),
    );
  }

  @Get('profit-center')
  public async getProfitCenter(
    @Param('orgUnitId') orgUnitId: string,
  ): Promise<ProfitCenterProfileReadModel> {
    const profile = await this.queryBus.execute(new GetProfitCenterProfileByOrgUnitIdQuery(orgUnitId));
    if (!profile) {
      throw new NotFoundException(`No profit center profile found for org unit "${orgUnitId}".`);
    }
    return profile;
  }

  @Patch('profit-center')
  public updateProfitCenter(
    @Param('orgUnitId') orgUnitId: string,
    @Body() dto: UpdateProfitCenterProfileDto,
  ): Promise<void> {
    return this.commandBus.execute(
      new UpdateProfitCenterProfileCommand(
        orgUnitId,
        dto.revenueTargetAmount,
        dto.revenueTargetCurrency,
        dto.reportingCurrency,
        dto.glAccountCode ?? null,
        dto.expectedVersion,
      ),
    );
  }
}
