import { ValidationDomainException } from '../errors/validation-domain.exception';
import { Result } from '../result/result';
import { ISO_3166_1_ALPHA_2_CODES } from './iso-3166-1-alpha-2.constants';
import { ValueObject } from './value-object.base';

interface CountryCodeProps extends Record<string, unknown> {
  value: string;
}

export class CountryCode extends ValueObject<CountryCodeProps> {
  private constructor(props: CountryCodeProps) {
    super(props);
  }

  public static create(value: string): Result<CountryCode, ValidationDomainException> {
    const normalized = value.trim().toUpperCase();
    if (!ISO_3166_1_ALPHA_2_CODES.has(normalized)) {
      return Result.fail(
        new ValidationDomainException(
          `CountryCode "${value}" is not a valid ISO 3166-1 alpha-2 code.`,
          { value },
        ),
      );
    }
    return Result.ok(new CountryCode({ value: normalized }));
  }

  public get value(): string {
    return this.props.value;
  }
}
