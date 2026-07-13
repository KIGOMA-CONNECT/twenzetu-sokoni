import { ValidationDomainException } from '../errors/validation-domain.exception';
import { Result } from '../result/result';
import { CurrencyCode } from './currency-code.value-object';
import { ValueObject } from './value-object.base';

const DECIMAL_AMOUNT_PATTERN = /^\d+(\.\d{1,4})?$/;

interface MoneyProps extends Record<string, unknown> {
  amount: string;
  currency: CurrencyCode;
}

/**
 * Represents a non-negative monetary amount as a decimal string (matching
 * Postgres `numeric` columns, which TypeORM already returns as strings) to
 * avoid floating-point rounding. See ADR-0004 for why this is a decimal
 * string rather than integer minor units.
 */
export class Money extends ValueObject<MoneyProps> {
  private constructor(props: MoneyProps) {
    super(props);
  }

  public static create(
    amount: string,
    currency: CurrencyCode,
  ): Result<Money, ValidationDomainException> {
    const normalized = amount.trim();
    if (!DECIMAL_AMOUNT_PATTERN.test(normalized)) {
      return Result.fail(
        new ValidationDomainException(
          `Money amount "${amount}" must be a non-negative decimal with at most 4 fraction digits.`,
          { amount },
        ),
      );
    }
    return Result.ok(new Money({ amount: normalized, currency }));
  }

  public get amount(): string {
    return this.props.amount;
  }

  public get currency(): CurrencyCode {
    return this.props.currency;
  }
}
