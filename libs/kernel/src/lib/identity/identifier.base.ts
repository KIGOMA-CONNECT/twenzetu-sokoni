export abstract class Identifier<T> {
  protected readonly _value: T;

  protected constructor(value: T) {
    this._value = value;
  }

  public get value(): T {
    return this._value;
  }

  public abstract equals(other?: Identifier<T>): boolean;
}
