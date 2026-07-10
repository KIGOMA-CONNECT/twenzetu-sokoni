import { Global, Module } from '@nestjs/common';
import { CqrsModule as NestCqrsModule } from '@nestjs/cqrs';
import { CommandBusAdapter } from './bus/command-bus.adapter';
import { EventBusAdapter } from './bus/event-bus.adapter';
import { QueryBusAdapter } from './bus/query-bus.adapter';

// Global, matching AppConfigModule/AppLoggerModule/TenancyModule/DatabaseModule:
// every future business module needs the command/query/event buses, so none should
// have to re-import this.
@Global()
@Module({
  imports: [NestCqrsModule],
  providers: [CommandBusAdapter, QueryBusAdapter, EventBusAdapter],
  exports: [NestCqrsModule, CommandBusAdapter, QueryBusAdapter, EventBusAdapter],
})
export class CqrsModule {}
