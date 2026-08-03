import { ValidationDomainException } from '../errors/validation-domain.exception';
import { Guard } from '../guard/guard';
import { Result } from '../result/result';
import { CountryCode } from './country-code.value-object';
import { ValueObject } from './value-object.base';

const MAX_TAX_NUMBER_LENGTH = 64;

interface TaxIdentifierProps extends Record<string, unknown> {
  countryCode: CountryCode;
  taxNumber: string;
}

/**
 * Structural validation only (non-empty, bounded length) — no per-country
 * tax-number format validation. See ADR-0004: flagged as future work.
 */
export class TaxIdentifier extends ValueObject<TaxIdentifierProps> {
  private constructor(props: TaxIdentifierProps) {
    super(props);
  }

  public static create(
    countryCode: CountryCode,
    taxNumber: string,
  ): Result<TaxIdentifier, ValidationDomainException> {
    const normalized = taxNumber.trim();
    const guard = Guard.combine([
      Guard.againstEmptyString(normalized, 'taxNumber'),
      normalized.length > MAX_TAX_NUMBER_LENGTH
        ? { succeeded: false, message: `taxNumber must not exceed ${MAX_TAX_NUMBER_LENGTH} characters.` }
        : { succeeded: true },
    ]);
    if (!guard.succeeded) {
      return Result.fail(
        new ValidationDomainException(guard.message ?? 'Invalid tax identifier.', { taxNumber }),
      );
    }
    return Result.ok(new TaxIdentifier({ countryCode, taxNumber: normalized }));
  }

  public get countryCode(): CountryCode {
    return this.props.countryCode;
  }

  public get taxNumber(): string {
    return this.props.taxNumber;
  }
}
