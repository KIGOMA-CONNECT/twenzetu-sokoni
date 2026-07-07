export abstract class Identifier<T> {
  protected readonly _value: T;

  protected constructor(value: T) {
    this._value = value;
  }

  public equals(id?: Identifier<T> | null): boolean {
    if (id === null || id === undefined) {
      return false;
    }
    if (!(id instanceof Identifier)) {
      return false;
    }
    return this._value === id._value;
  }

  public toValue(): T {
    return this._value;
  }

  public toString(): string {
    return String(this._value);
  }
}
