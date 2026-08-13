import { CommandBase } from '@afri-market/kernel';

export class UpdateVendorProfileCommand extends CommandBase {
  constructor(
    public readonly shopName?: string,
    public readonly description?: string | null,
    public readonly category?: string,
    public readonly latitude?: number | null,
    public readonly longitude?: number | null,
  ) {
    super();
  }
}
