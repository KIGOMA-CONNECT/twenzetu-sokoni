import { CommandBusAdapter, QueryBusAdapter } from '@abms/cqrs';
import {
  ChangeEmployeePositionCommand,
  CreateEmployeeCommand,
  CreateEmployeeResult,
  CreatePositionCommand,
  CreatePositionResult,
  EmployeeDocumentReadModel,
  EmployeeReadModel,
  EmploymentHistoryEntryReadModel,
  GetEmployeeByIdQuery,
  GetEmployeeEmploymentHistoryQuery,
  LinkEmployeeUserAccountCommand,
  ListEmployeeDocumentsQuery,
  ListEmployeesQuery,
  ListPositionsQuery,
  PositionReadModel,
  ReactivateEmployeeCommand,
  SuspendEmployeeCommand,
  TerminateEmployeeCommand,
  TransferEmployeeCommand,
  UpdateEmployeePersonalDetailsCommand,
  UploadEmployeeDocumentCommand,
  UploadEmployeeDocumentResult,
} from '@abms/hr-application';
import { Body, Controller, Get, NotFoundException, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ChangeEmployeePositionDto } from './dto/change-employee-position.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { CreatePositionDto } from './dto/create-position.dto';
import { LinkEmployeeUserAccountDto } from './dto/link-employee-user-account.dto';
import { TerminateEmployeeDto } from './dto/terminate-employee.dto';
import { TransferEmployeeDto } from './dto/transfer-employee.dto';
import { UpdateEmployeePersonalDetailsDto } from './dto/update-employee-personal-details.dto';
import { UploadEmployeeDocumentDto } from './dto/upload-employee-document.dto';

// See OrganizationController/WorkflowController for why AuthGuard('jwt') here
// doesn't create an Nx scope:hr -> scope:identity dependency edge.
@Controller('hr')
@UseGuards(AuthGuard('jwt'))
export class HrController {
  public constructor(
    private readonly commandBus: CommandBusAdapter,
    private readonly queryBus: QueryBusAdapter,
  ) {}

  @Post('positions')
  public createPosition(@Body() dto: CreatePositionDto): Promise<CreatePositionResult> {
    return this.commandBus.execute(new CreatePositionCommand(dto.code, dto.title, dto.description));
  }

  @Get('positions')
  public listPositions(): Promise<PositionReadModel[]> {
    return this.queryBus.execute(new ListPositionsQuery());
  }

  @Post('employees')
  public createEmployee(@Body() dto: CreateEmployeeDto): Promise<CreateEmployeeResult> {
    return this.commandBus.execute(
      new CreateEmployeeCommand(
        dto.employeeNumber,
        dto.firstName,
        dto.lastName,
        dto.email,
        dto.hireDate,
        dto.employmentType,
        dto.phone,
        dto.dateOfBirth,
        dto.gender,
        dto.positionId,
        dto.orgUnitId,
        dto.userId,
      ),
    );
  }

  @Get('employees')
  public listEmployees(): Promise<EmployeeReadModel[]> {
    return this.queryBus.execute(new ListEmployeesQuery());
  }

  @Get('employees/:id')
  public async getEmployeeById(@Param('id') id: string): Promise<EmployeeReadModel> {
    const employee = await this.queryBus.execute(new GetEmployeeByIdQuery(id));
    if (!employee) {
      throw new NotFoundException(`Employee "${id}" was not found.`);
    }
    return employee;
  }

  @Patch('employees/:id/personal-details')
  public updatePersonalDetails(
    @Param('id') id: string,
    @Body() dto: UpdateEmployeePersonalDetailsDto,
  ): Promise<void> {
    return this.commandBus.execute(
      new UpdateEmployeePersonalDetailsCommand(
        id,
        dto.firstName,
        dto.lastName,
        dto.email,
        dto.phone,
        dto.dateOfBirth,
        dto.gender,
      ),
    );
  }

  @Patch('employees/:id/position')
  public changePosition(@Param('id') id: string, @Body() dto: ChangeEmployeePositionDto): Promise<void> {
    return this.commandBus.execute(new ChangeEmployeePositionCommand(id, dto.newPositionId ?? null));
  }

  @Patch('employees/:id/transfer')
  public transfer(@Param('id') id: string, @Body() dto: TransferEmployeeDto): Promise<void> {
    return this.commandBus.execute(new TransferEmployeeCommand(id, dto.newOrgUnitId ?? null));
  }

  @Patch('employees/:id/suspend')
  public suspend(@Param('id') id: string): Promise<void> {
    return this.commandBus.execute(new SuspendEmployeeCommand(id));
  }

  @Patch('employees/:id/reactivate')
  public reactivate(@Param('id') id: string): Promise<void> {
    return this.commandBus.execute(new ReactivateEmployeeCommand(id));
  }

  @Patch('employees/:id/terminate')
  public terminate(@Param('id') id: string, @Body() dto: TerminateEmployeeDto): Promise<void> {
    return this.commandBus.execute(new TerminateEmployeeCommand(id, dto.terminationDate));
  }

  @Patch('employees/:id/link-user')
  public linkUserAccount(@Param('id') id: string, @Body() dto: LinkEmployeeUserAccountDto): Promise<void> {
    return this.commandBus.execute(new LinkEmployeeUserAccountCommand(id, dto.userId));
  }

  @Get('employees/:id/history')
  public getEmploymentHistory(@Param('id') id: string): Promise<EmploymentHistoryEntryReadModel[]> {
    return this.queryBus.execute(new GetEmployeeEmploymentHistoryQuery(id));
  }

  @Post('employees/:id/documents')
  public uploadDocument(
    @Param('id') id: string,
    @Body() dto: UploadEmployeeDocumentDto,
  ): Promise<UploadEmployeeDocumentResult> {
    return this.commandBus.execute(
      new UploadEmployeeDocumentCommand(id, dto.documentType, dto.fileName, dto.fileUrl),
    );
  }

  @Get('employees/:id/documents')
  public listDocuments(@Param('id') id: string): Promise<EmployeeDocumentReadModel[]> {
    return this.queryBus.execute(new ListEmployeeDocumentsQuery(id));
  }
}
