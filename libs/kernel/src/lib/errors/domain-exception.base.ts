export abstract class DomainException extends Error {
  public abstract readonly code: string;
  public readonly context?: Readonly<Record<string, unknown>>;

  protected constructor(message: string, context?: Record<string, unknown>) {
    super(message);
    this.name = new.target.name;
    this.context = context;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
