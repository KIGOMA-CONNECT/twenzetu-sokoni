import { ICommand } from '@abms/kernel';

export class UpdateBranchProfileCommand implements ICommand<void> {
  public readonly _resultType?: void;

  public constructor(
    public readonly orgUnitId: string,
    public readonly addressLine1: string,
    public readonly addressLine2: string | null,
    public readonly addressCity: string,
    public readonly addressStateOrRegion: string | null,
    public readonly addressPostalCode: string | null,
    public readonly addressCountryCode: string,
    public readonly operatingCurrency: string,
    public readonly contactPhone: string | null,
    public readonly contactEmail: string | null,
    public readonly expectedVersion: number,
  ) {}
}
