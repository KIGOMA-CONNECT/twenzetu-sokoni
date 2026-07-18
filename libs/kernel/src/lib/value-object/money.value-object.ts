import { ValidationDomainException } from '../errors/validation-domain.exception';
import { Result } from '../result/result';
import { CurrencyCode } from './currency-code.value-object';
import { ValueObject } from './value-object.base';

const DECIMAL_AMOUNT_PATTERN = /^\d+(\.\d{1,4})?$/;

// Matches Money's own max-4-fraction-digit precision (DECIMAL_AMOUNT_PATTERN
// above) — all arithmetic below happens in this scaled integer space so it
// never touches a JS float, per the platform-wide "no floats for money,
// ever" rule.
const DECIMAL_SCALE = 10_000n;

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

  /**
   * Adds two Money values of the same currency. Integer arithmetic in
   * scaled-BigInt space — never a JS float.
   */
  public add(other: Money): Result<Money, ValidationDomainException> {
    const currencyCheck = this.assertSameCurrency(other, 'add');
    if (currencyCheck.isFailure) {
      return Result.fail(currencyCheck.getError());
    }
    const sum = this.toScaledBigInt() + other.toScaledBigInt();
    return Money.create(Money.fromScaledBigInt(sum), this.currency);
  }

  /**
   * Subtracts `other` from this Money. Fails rather than going negative —
   * Money represents a non-negative amount (see `create()`'s own guard).
   */
  public subtract(other: Money): Result<Money, ValidationDomainException> {
    const currencyCheck = this.assertSameCurrency(other, 'subtract');
    if (currencyCheck.isFailure) {
      return Result.fail(currencyCheck.getError());
    }
    const difference = this.toScaledBigInt() - other.toScaledBigInt();
    if (difference < 0n) {
      return Result.fail(
        new ValidationDomainException(
          `Cannot subtract ${other.amount} ${other.currency.value} from ${this.amount} ${this.currency.value}: result would be negative.`,
        ),
      );
    }
    return Money.create(Money.fromScaledBigInt(difference), this.currency);
  }

  /**
   * Returns `this * rateBasisPoints / 10000` (e.g. 800 basis points = 8%),
   * rounded down to Money's own precision. Basis points, not a float
   * percentage, so the rate itself can never introduce float error.
   */
  public percentageOf(rateBasisPoints: number): Money {
    const scaled = (this.toScaledBigInt() * BigInt(rateBasisPoints)) / 10_000n;
    return Money.create(Money.fromScaledBigInt(scaled), this.currency).getValue();
  }

  public isGreaterThan(other: Money): boolean {
    return this.toScaledBigInt() > other.toScaledBigInt();
  }

  public isZero(): boolean {
    return this.toScaledBigInt() === 0n;
  }

  private assertSameCurrency(
    other: Money,
    operation: string,
  ): Result<void, ValidationDomainException> {
    if (!this.currency.equals(other.currency)) {
      return Result.fail(
        new ValidationDomainException(
          `Cannot ${operation} Money in different currencies: ${this.currency.value} vs ${other.currency.value}.`,
        ),
      );
    }
    return Result.ok();
  }

  private toScaledBigInt(): bigint {
    const [whole, fraction = ''] = this.props.amount.split('.');
    const paddedFraction = fraction.padEnd(4, '0');
    return BigInt(whole) * DECIMAL_SCALE + BigInt(paddedFraction);
  }

  private static fromScaledBigInt(scaled: bigint): string {
    const whole = scaled / DECIMAL_SCALE;
    const fraction = scaled % DECIMAL_SCALE;
    return `${whole}.${fraction.toString().padStart(4, '0')}`;
  }
}
