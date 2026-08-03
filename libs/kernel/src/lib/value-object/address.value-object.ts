import { ValidationDomainException } from '../errors/validation-domain.exception';
import { Guard } from '../guard/guard';
import { Result } from '../result/result';
import { CountryCode } from './country-code.value-object';
import { ValueObject } from './value-object.base';

interface AddressProps extends Record<string, unknown> {
  line1: string;
  line2: string | null;
  city: string;
  stateOrRegion: string | null;
  postalCode: string | null;
  countryCode: CountryCode;
}

export interface CreateAddressProps {
  readonly line1: string;
  readonly line2?: string | null;
  readonly city: string;
  readonly stateOrRegion?: string | null;
  readonly postalCode?: string | null;
  readonly countryCode: CountryCode;
}

export class Address extends ValueObject<AddressProps> {
  private constructor(props: AddressProps) {
    super(props);
  }

  public static create(props: CreateAddressProps): Result<Address, ValidationDomainException> {
    const guard = Guard.combine([
      Guard.againstEmptyString(props.line1, 'line1'),
      Guard.againstEmptyString(props.city, 'city'),
    ]);
    if (!guard.succeeded) {
      return Result.fail(new ValidationDomainException(guard.message ?? 'Invalid address.', { props }));
    }
    return Result.ok(
      new Address({
        line1: props.line1.trim(),
        line2: props.line2?.trim() ?? null,
        city: props.city.trim(),
        stateOrRegion: props.stateOrRegion?.trim() ?? null,
        postalCode: props.postalCode?.trim() ?? null,
        countryCode: props.countryCode,
      }),
    );
  }

  public get line1(): string {
    return this.props.line1;
  }

  public get line2(): string | null {
    return this.props.line2;
  }

  public get city(): string {
    return this.props.city;
  }

  public get stateOrRegion(): string | null {
    return this.props.stateOrRegion;
  }

  public get postalCode(): string | null {
    return this.props.postalCode;
  }

  public get countryCode(): CountryCode {
    return this.props.countryCode;
  }
}
