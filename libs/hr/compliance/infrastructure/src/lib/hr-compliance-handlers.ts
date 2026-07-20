import { AssignComplianceRequirementHandler } from './handlers/assign-compliance-requirement.handler';
import { CreateComplianceRequirementHandler } from './handlers/create-compliance-requirement.handler';
import { DeactivateComplianceRequirementHandler } from './handlers/deactivate-compliance-requirement.handler';
import { ListComplianceRecordsForEmployeeHandler } from './handlers/list-compliance-records-for-employee.handler';
import { ListComplianceRecordsForRequirementHandler } from './handlers/list-compliance-records-for-requirement.handler';
import { ListComplianceRequirementsHandler } from './handlers/list-compliance-requirements.handler';
import { MarkComplianceRecordCompliantHandler } from './handlers/mark-compliance-record-compliant.handler';
import { MarkComplianceRecordExemptHandler } from './handlers/mark-compliance-record-exempt.handler';
import { MarkComplianceRecordOverdueHandler } from './handlers/mark-compliance-record-overdue.handler';

export const HR_COMPLIANCE_COMMAND_HANDLERS = [
  CreateComplianceRequirementHandler,
  DeactivateComplianceRequirementHandler,
  AssignComplianceRequirementHandler,
  MarkComplianceRecordCompliantHandler,
  MarkComplianceRecordOverdueHandler,
  MarkComplianceRecordExemptHandler,
];

export const HR_COMPLIANCE_QUERY_HANDLERS = [
  ListComplianceRequirementsHandler,
  ListComplianceRecordsForEmployeeHandler,
  ListComplianceRecordsForRequirementHandler,
];
