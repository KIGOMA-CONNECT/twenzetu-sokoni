export abstract class ValueObject<T extends Record<string, unknown>> {
  protected readonly props: Readonly<T>;

  protected constructor(props: T) {
    this.props = Object.freeze({ ...props });
  }

  public equals(vo?: ValueObject<T> | null): boolean {
    if (vo === null || vo === undefined) {
      return false;
    }
    if (!(vo instanceof ValueObject)) {
      return false;
    }
    return JSON.stringify(this.props) === JSON.stringify(vo.props);
  }
}
