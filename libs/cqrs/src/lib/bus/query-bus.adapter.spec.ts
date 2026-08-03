import { IQuery } from '@abms/kernel';
import type { QueryBus as NestQueryBus } from '@nestjs/cqrs';
import { QueryBusAdapter } from './query-bus.adapter';

class TestQuery implements IQuery<string> {
  public readonly _resultType?: string;
}

describe('QueryBusAdapter', () => {
  it('delegates execute() to the underlying Nest QueryBus', async () => {
    const nestQueryBus = { execute: jest.fn().mockResolvedValue('hello') } as unknown as NestQueryBus;
    const adapter = new QueryBusAdapter(nestQueryBus);
    const query = new TestQuery();

    const result = await adapter.execute<string>(query);

    expect(nestQueryBus.execute).toHaveBeenCalledWith(query);
    expect(result).toBe('hello');
  });
});
