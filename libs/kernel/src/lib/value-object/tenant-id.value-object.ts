import { ValidationDomainException } from '../errors/validation-domain.exception';
import { isValidUuid } from '../identity/uuid.util';
import { Result } from '../result/result';
import { ValueObject } from './value-object.base';

interface TenantIdProps extends Record<string, unknown> {
  value: string;
}

export class TenantId extends ValueObject<TenantIdProps> {
  private constructor(props: TenantIdProps) {
    super(props);
  }

  public static create(value: string): Result<TenantId, ValidationDomainException> {
    if (!isValidUuid(value)) {
      return Result.fail(
        new ValidationDomainException(`TenantId "${value}" is not a valid UUID.`, { value }),
      );
    }
    return Result.ok(new TenantId({ value }));
  }

  public get value(): string {
    return this.props.value;
  }
}
