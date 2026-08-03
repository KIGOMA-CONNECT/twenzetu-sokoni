export interface BranchProfileReadModel {
  readonly id: string;
  readonly orgUnitId: string;
  readonly addressLine1: string;
  readonly addressLine2: string | null;
  readonly addressCity: string;
  readonly addressStateOrRegion: string | null;
  readonly addressPostalCode: string | null;
  readonly addressCountryCode: string;
  readonly operatingCurrency: string;
  readonly contactPhone: string | null;
  readonly contactEmail: string | null;
  readonly version: number;
}
