import { ValidationDomainException } from '../errors/validation-domain.exception';
import { Result } from '../result/result';
import { ValueObject } from './value-object.base';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface EmailProps extends Record<string, unknown> {
  value: string;
}

export class Email extends ValueObject<EmailProps> {
  private constructor(props: EmailProps) {
    super(props);
  }

  public static create(value: string): Result<Email, ValidationDomainException> {
    const normalized = value.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(normalized)) {
      return Result.fail(
        new ValidationDomainException(`Email "${value}" is not a valid email address.`, { value }),
      );
    }
    return Result.ok(new Email({ value: normalized }));
  }

  public get value(): string {
    return this.props.value;
  }
}
