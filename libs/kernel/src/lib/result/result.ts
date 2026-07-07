export class Result<T, E = Error> {
  public readonly isSuccess: boolean;
  public readonly isFailure: boolean;
  private readonly _value?: T;
  private readonly _error?: E;

  private constructor(isSuccess: boolean, value?: T, error?: E) {
    if (isSuccess && error !== undefined) {
      throw new Error('A successful Result cannot carry an error.');
    }
    if (!isSuccess && error === undefined) {
      throw new Error('A failed Result must carry an error.');
    }
    this.isSuccess = isSuccess;
    this.isFailure = !isSuccess;
    this._value = value;
    this._error = error;
    Object.freeze(this);
  }

  public static ok<U = void, F = Error>(value?: U): Result<U, F> {
    return new Result<U, F>(true, value, undefined);
  }

  public static fail<U = void, F = Error>(error: F): Result<U, F> {
    return new Result<U, F>(false, undefined, error);
  }

  public static combine<F = Error>(results: ReadonlyArray<Result<unknown, F>>): Result<void, F> {
    for (const result of results) {
      if (result.isFailure) {
        return Result.fail<void, F>(result.getError());
      }
    }
    return Result.ok<void, F>();
  }

  public getValue(): T {
    if (!this.isSuccess) {
      throw new Error(
        'Cannot get the value of a failed Result. Check isSuccess before calling getValue().',
      );
    }
    return this._value as T;
  }

  public getError(): E {
    if (this.isSuccess) {
      throw new Error(
        'Cannot get the error of a successful Result. Check isFailure before calling getError().',
      );
    }
    return this._error as E;
  }
}
