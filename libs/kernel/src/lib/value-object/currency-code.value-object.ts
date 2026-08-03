import { ValidationDomainException } from '../errors/validation-domain.exception';
import { Result } from '../result/result';
import { ISO_4217_CURRENCY_CODES } from './iso-4217.constants';
import { ValueObject } from './value-object.base';

interface CurrencyCodeProps extends Record<string, unknown> {
  value: string;
}

export class CurrencyCode extends ValueObject<CurrencyCodeProps> {
  private constructor(props: CurrencyCodeProps) {
    super(props);
  }

  public static create(value: string): Result<CurrencyCode, ValidationDomainException> {
    const normalized = value.trim().toUpperCase();
    if (!ISO_4217_CURRENCY_CODES.has(normalized)) {
      return Result.fail(
        new ValidationDomainException(
          `CurrencyCode "${value}" is not a valid ISO 4217 currency code.`,
          { value },
        ),
      );
    }
    return Result.ok(new CurrencyCode({ value: normalized }));
  }

  public get value(): string {
    return this.props.value;
  }
}
