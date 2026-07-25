export interface ICommandBus {
  execute<TCommand, TResult>(command: TCommand): Promise<TResult>;
}
