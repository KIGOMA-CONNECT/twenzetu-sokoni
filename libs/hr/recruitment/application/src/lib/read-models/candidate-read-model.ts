export interface CandidateReadModel {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly phone: string | null;
  readonly resumeUrl: string | null;
  readonly source: string | null;
}
