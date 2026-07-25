import { Guard } from '@afri-market/kernel';

export class Otp {
  private constructor(
    private readonly _code: string,
    private readonly _expiresAt: Date,
    private _isUsed: boolean,
  ) {}

  public static create(code: string, expiryMinutes: number): Otp {
    Guard.assert(Guard.againstEmptyString(code, 'code'));
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);
    return new Otp(code, expiresAt, false);
  }

  public get code(): string { return this._code; }
  public get isUsed(): boolean { return this._isUsed; }
  public get isExpired(): boolean { return new Date() > this._expiresAt; }

  public markUsed(): void { this._isUsed = true; }

  public verify(input: string): boolean {
    if (this._isUsed) return false;
    if (this.isExpired) return false;
    return this._code === input;
  }
}
