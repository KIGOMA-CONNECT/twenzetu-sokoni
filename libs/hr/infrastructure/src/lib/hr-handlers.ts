import { ChangeEmployeePositionHandler } from './handlers/change-employee-position.handler';
import { CreateEmployeeHandler } from './handlers/create-employee.handler';
import { CreatePositionHandler } from './handlers/create-position.handler';
import { GetEmployeeByIdHandler } from './handlers/get-employee-by-id.handler';
import { GetEmployeeEmploymentHistoryHandler } from './handlers/get-employee-employment-history.handler';
import { LinkEmployeeUserAccountHandler } from './handlers/link-employee-user-account.handler';
import { ListEmployeeDocumentsHandler } from './handlers/list-employee-documents.handler';
import { ListEmployeesHandler } from './handlers/list-employees.handler';
import { ListPositionsHandler } from './handlers/list-positions.handler';
import { ReactivateEmployeeHandler } from './handlers/reactivate-employee.handler';
import { SuspendEmployeeHandler } from './handlers/suspend-employee.handler';
import { TerminateEmployeeHandler } from './handlers/terminate-employee.handler';
import { TransferEmployeeHandler } from './handlers/transfer-employee.handler';
import { UpdateEmployeePersonalDetailsHandler } from './handlers/update-employee-personal-details.handler';
import { UploadEmployeeDocumentHandler } from './handlers/upload-employee-document.handler';

export const HR_COMMAND_HANDLERS = [
  CreatePositionHandler,
  CreateEmployeeHandler,
  UpdateEmployeePersonalDetailsHandler,
  ChangeEmployeePositionHandler,
  TransferEmployeeHandler,
  SuspendEmployeeHandler,
  ReactivateEmployeeHandler,
  TerminateEmployeeHandler,
  LinkEmployeeUserAccountHandler,
  UploadEmployeeDocumentHandler,
];

export const HR_QUERY_HANDLERS = [
  GetEmployeeByIdHandler,
  ListEmployeesHandler,
  ListPositionsHandler,
  GetEmployeeEmploymentHistoryHandler,
  ListEmployeeDocumentsHandler,
];
