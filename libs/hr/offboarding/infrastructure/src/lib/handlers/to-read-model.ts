import { OffboardingCaseReadModel, OffboardingTaskReadModel } from '@abms/hr-offboarding-application';
import { OffboardingCase, OffboardingTask } from '@abms/hr-offboarding-domain';

export function toOffboardingCaseReadModel(offboardingCase: OffboardingCase): OffboardingCaseReadModel {
  return {
    id: offboardingCase.id.toValue(),
    employeeId: offboardingCase.employeeId.toValue(),
    exitReason: offboardingCase.exitReason,
    lastWorkingDay: offboardingCase.lastWorkingDay.toISOString().slice(0, 10),
    status: offboardingCase.status,
  };
}

export function toOffboardingTaskReadModel(task: OffboardingTask): OffboardingTaskReadModel {
  return {
    id: task.id.toValue(),
    offboardingCaseId: task.offboardingCaseId.toValue(),
    employeeId: task.employeeId.toValue(),
    name: task.name,
    isCompleted: task.isCompleted,
    completedAt: task.completedAt?.toISOString() ?? null,
  };
}
