import { ICommand, ICommandBus } from '@abms/kernel';
import { CommandBus as NestCommandBus } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CommandBusAdapter implements ICommandBus {
  public constructor(private readonly nestCommandBus: NestCommandBus) {}

  public execute<TResult = void>(command: ICommand<TResult>): Promise<TResult> {
    return this.nestCommandBus.execute(command);
  }
}
