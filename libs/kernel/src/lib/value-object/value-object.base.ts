export abstract class ValueObject<T> {
  protected readonly _value: T;

  protected constructor(value: T) {
    this._value = value;
  }

  public get value(): T {
    return this._value;
  }

  public abstract equals(other?: ValueObject<T>): boolean;

  public toString(): string {
    return String(this._value);
  }
}
