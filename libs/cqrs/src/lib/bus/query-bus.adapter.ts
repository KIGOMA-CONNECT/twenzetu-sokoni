import { IQuery, IQueryBus } from '@abms/kernel';
import { QueryBus as NestQueryBus } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';

@Injectable()
export class QueryBusAdapter implements IQueryBus {
  public constructor(private readonly nestQueryBus: NestQueryBus) {}

  public execute<TResult>(query: IQuery<TResult>): Promise<TResult> {
    return this.nestQueryBus.execute(query);
  }
}
