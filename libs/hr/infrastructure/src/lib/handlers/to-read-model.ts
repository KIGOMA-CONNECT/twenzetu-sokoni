import {
  EmployeeDocumentReadModel,
  EmployeeReadModel,
  EmploymentHistoryEntryReadModel,
  PositionReadModel,
} from '@abms/hr-application';
import { Employee, EmployeeDocument, EmploymentHistoryEntry, Position } from '@abms/hr-domain';

export function toPositionReadModel(position: Position): PositionReadModel {
  return {
    id: position.id.toValue(),
    code: position.code,
    title: position.title,
    description: position.description,
    isActive: position.isActive,
  };
}

export function toEmployeeReadModel(employee: Employee): EmployeeReadModel {
  return {
    id: employee.id.toValue(),
    userId: employee.userId,
    employeeNumber: employee.employeeNumber,
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email.value,
    phone: employee.phone,
    dateOfBirth: employee.dateOfBirth?.toISOString().slice(0, 10) ?? null,
    gender: employee.gender,
    positionId: employee.positionId?.toValue() ?? null,
    orgUnitId: employee.orgUnitId,
    hireDate: employee.hireDate.toISOString().slice(0, 10),
    employmentType: employee.employmentType,
    status: employee.status,
    terminationDate: employee.terminationDate?.toISOString().slice(0, 10) ?? null,
    version: employee.version,
  };
}

export function toEmploymentHistoryEntryReadModel(
  entry: EmploymentHistoryEntry,
): EmploymentHistoryEntryReadModel {
  return {
    id: entry.id.toValue(),
    employeeId: entry.employeeId.toValue(),
    eventType: entry.eventType,
    effectiveDate: entry.effectiveDate.toISOString().slice(0, 10),
    details: entry.details,
  };
}

export function toEmployeeDocumentReadModel(document: EmployeeDocument): EmployeeDocumentReadModel {
  return {
    id: document.id.toValue(),
    employeeId: document.employeeId.toValue(),
    documentType: document.documentType,
    fileName: document.fileName,
    fileUrl: document.fileUrl,
    uploadedByUserId: document.uploadedByUserId,
    uploadedAt: document.uploadedAt.toISOString(),
  };
}
