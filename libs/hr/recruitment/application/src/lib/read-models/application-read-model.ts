export interface ApplicationReadModel {
  readonly id: string;
  readonly candidateId: string;
  readonly jobRequisitionId: string;
  readonly status: string;
  readonly decisionNotes: string | null;
}
