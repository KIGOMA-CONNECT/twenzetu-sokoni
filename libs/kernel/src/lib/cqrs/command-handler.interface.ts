import { ICommand } from './command.interface';

export interface ICommandHandler<TCommand extends ICommand<TResult>, TResult = void> {
  execute(command: TCommand): Promise<TResult>;
}
