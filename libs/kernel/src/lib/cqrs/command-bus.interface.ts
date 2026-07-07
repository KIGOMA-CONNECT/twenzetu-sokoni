import { ICommand } from './command.interface';

export interface ICommandBus {
  execute<TResult = void>(command: ICommand<TResult>): Promise<TResult>;
}
