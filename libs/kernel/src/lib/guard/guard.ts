export class Guard {
  public static againstEmptyString(value: unknown, fieldName: string): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new Error(`${fieldName} must not be empty`);
    }
    return value;
  }

  public static assert(condition: unknown, message?: string): void {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  }

  public static againstNullOrUndefined(value: unknown, fieldName: string): void {
    if (value === null || value === undefined) {
      throw new Error(`${fieldName} must not be null or undefined`);
    }
  }

  public static inRange(value: number, min: number, max: number, fieldName: string): void {
    if (value < min || value > max) {
      throw new Error(`${fieldName} must be between ${min} and ${max}`);
    }
  }
}
