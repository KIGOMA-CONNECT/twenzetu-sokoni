export interface JobRequisitionReadModel {
  readonly id: string;
  readonly positionId: string;
  readonly title: string;
  readonly headcount: number;
  readonly status: string;
  readonly closeReason: string | null;
}
