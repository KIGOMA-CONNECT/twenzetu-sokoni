export interface IQuery {
  readonly queryId: string;
}

export abstract class QueryBase implements IQuery {
  public readonly queryId: string;

  protected constructor() {
    this.queryId = crypto.randomUUID();
  }
}
