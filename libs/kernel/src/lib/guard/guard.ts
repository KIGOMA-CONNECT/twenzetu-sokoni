import { BusinessRuleViolationException } from '../errors/business-rule-violation.exception';
import { isValidUuid } from '../identity/uuid.util';

export interface IGuardResult {
  readonly succeeded: boolean;
  readonly message?: string;
}

export class Guard {
  public static againstNullOrUndefined(value: unknown, argumentName: string): IGuardResult {
    if (value === null || value === undefined) {
      return { succeeded: false, message: `${argumentName} is null or undefined.` };
    }
    return { succeeded: true };
  }

  public static againstEmptyString(value: string, argumentName: string): IGuardResult {
    if (value.trim().length === 0) {
      return { succeeded: false, message: `${argumentName} must not be empty.` };
    }
    return { succeeded: true };
  }

  public static isValidUUID(value: string, argumentName = 'value'): IGuardResult {
    if (!isValidUuid(value)) {
      return { succeeded: false, message: `${argumentName} must be a valid UUID.` };
    }
    return { succeeded: true };
  }

  public static inRange(
    value: number,
    min: number,
    max: number,
    argumentName: string,
  ): IGuardResult {
    if (value < min || value > max) {
      return {
        succeeded: false,
        message: `${argumentName} must be between ${min} and ${max}.`,
      };
    }
    return { succeeded: true };
  }

  public static combine(results: ReadonlyArray<IGuardResult>): IGuardResult {
    for (const result of results) {
      if (!result.succeeded) {
        return result;
      }
    }
    return { succeeded: true };
  }

  public static assert(result: IGuardResult): void {
    if (!result.succeeded) {
      throw new BusinessRuleViolationException(result.message ?? 'Guard assertion failed.');
    }
  }
}
