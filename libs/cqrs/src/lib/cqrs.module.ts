import { Module } from '@nestjs/common';
import { CqrsModule as NestCqrsModule } from '@nestjs/cqrs';
import { CommandBusAdapter } from './bus/command-bus.adapter';
import { EventBusAdapter } from './bus/event-bus.adapter';
import { QueryBusAdapter } from './bus/query-bus.adapter';

@Module({
  imports: [NestCqrsModule],
  providers: [CommandBusAdapter, QueryBusAdapter, EventBusAdapter],
  exports: [NestCqrsModule, CommandBusAdapter, QueryBusAdapter, EventBusAdapter],
})
export class CqrsModule {}
