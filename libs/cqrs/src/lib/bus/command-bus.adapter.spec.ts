import { ICommand } from '@abms/kernel';
import type { CommandBus as NestCommandBus } from '@nestjs/cqrs';
import { CommandBusAdapter } from './command-bus.adapter';

class TestCommand implements ICommand<number> {
  public readonly _resultType?: number;
}

describe('CommandBusAdapter', () => {
  it('delegates execute() to the underlying Nest CommandBus', async () => {
    const nestCommandBus = { execute: jest.fn().mockResolvedValue(42) } as unknown as NestCommandBus;
    const adapter = new CommandBusAdapter(nestCommandBus);
    const command = new TestCommand();

    const result = await adapter.execute<number>(command);

    expect(nestCommandBus.execute).toHaveBeenCalledWith(command);
    expect(result).toBe(42);
  });
});
