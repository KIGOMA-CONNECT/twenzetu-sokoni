import {
  ComplianceRequirementReadModel,
  EmployeeComplianceRecordReadModel,
} from '@abms/hr-compliance-application';
import { ComplianceRequirement, EmployeeComplianceRecord } from '@abms/hr-compliance-domain';

export function toComplianceRequirementReadModel(
  requirement: ComplianceRequirement,
): ComplianceRequirementReadModel {
  return {
    id: requirement.id.toValue(),
    name: requirement.name,
    description: requirement.description,
    category: requirement.category,
    recurrence: requirement.recurrence,
    isActive: requirement.isActive,
  };
}

export function toEmployeeComplianceRecordReadModel(
  record: EmployeeComplianceRecord,
): EmployeeComplianceRecordReadModel {
  return {
    id: record.id.toValue(),
    employeeId: record.employeeId.toValue(),
    complianceRequirementId: record.complianceRequirementId.toValue(),
    dueDate: record.dueDate.toISOString().slice(0, 10),
    status: record.status,
    completedDate: record.completedDate?.toISOString().slice(0, 10) ?? null,
    exemptionReason: record.exemptionReason,
  };
}
