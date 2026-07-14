import { ICommand } from '@abms/kernel';

export interface RegisterTenantResult {
  readonly tenantId: string;
  readonly userId: string;
}

export class RegisterTenantCommand implements ICommand<RegisterTenantResult> {
  public readonly _resultType?: RegisterTenantResult;

  public constructor(
    public readonly businessName: string,
    public readonly ceoEmail: string,
    public readonly ceoPassword: string,
  ) {}
}
