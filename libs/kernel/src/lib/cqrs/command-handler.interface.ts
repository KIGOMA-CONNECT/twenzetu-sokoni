export interface ICommandHandler<TCommand = unknown, TResult = void> {
  execute(command: TCommand): Promise<TResult>;
}
