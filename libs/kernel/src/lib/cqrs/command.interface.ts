export interface ICommand {
  readonly commandId: string;
}

export abstract class CommandBase implements ICommand {
  public readonly commandId: string;

  protected constructor() {
    this.commandId = crypto.randomUUID();
  }
}
