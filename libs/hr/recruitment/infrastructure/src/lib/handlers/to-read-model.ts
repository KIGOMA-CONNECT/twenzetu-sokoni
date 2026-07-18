import {
  ApplicationReadModel,
  CandidateReadModel,
  JobRequisitionReadModel,
  OnboardingTaskReadModel,
} from '@abms/hr-recruitment-application';
import { Application, Candidate, JobRequisition, OnboardingTask } from '@abms/hr-recruitment-domain';

export function toJobRequisitionReadModel(requisition: JobRequisition): JobRequisitionReadModel {
  return {
    id: requisition.id.toValue(),
    positionId: requisition.positionId.toValue(),
    title: requisition.title,
    headcount: requisition.headcount,
    status: requisition.status,
    closeReason: requisition.closeReason,
  };
}

export function toCandidateReadModel(candidate: Candidate): CandidateReadModel {
  return {
    id: candidate.id.toValue(),
    firstName: candidate.firstName,
    lastName: candidate.lastName,
    email: candidate.email.value,
    phone: candidate.phone,
    resumeUrl: candidate.resumeUrl,
    source: candidate.source,
  };
}

export function toApplicationReadModel(application: Application): ApplicationReadModel {
  return {
    id: application.id.toValue(),
    candidateId: application.candidateId.toValue(),
    jobRequisitionId: application.jobRequisitionId.toValue(),
    status: application.status,
    decisionNotes: application.decisionNotes,
  };
}

export function toOnboardingTaskReadModel(task: OnboardingTask): OnboardingTaskReadModel {
  return {
    id: task.id.toValue(),
    employeeId: task.employeeId.toValue(),
    name: task.name,
    isCompleted: task.isCompleted,
    completedAt: task.completedAt?.toISOString() ?? null,
  };
}
