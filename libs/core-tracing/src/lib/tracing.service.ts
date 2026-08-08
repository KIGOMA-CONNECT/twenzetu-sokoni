import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operation: string;
  startTime: number;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class TracingService {
  private readonly logger = new Logger(TracingService.name);
  private readonly activeTraces = new Map<string, TraceContext>();

  generateTraceId(): string {
    return uuidv4();
  }

  generateSpanId(): string {
    return uuidv4().substring(0, 16);
  }

  startSpan(operation: string, parentTraceId?: string, parentSpanId?: string): TraceContext {
    const traceId = parentTraceId || this.generateTraceId();
    const spanId = this.generateSpanId();

    const context: TraceContext = {
      traceId,
      spanId,
      parentSpanId,
      operation,
      startTime: Date.now(),
    };

    this.activeTraces.set(spanId, context);
    this.logger.debug(`Trace started: ${traceId} / ${spanId} - ${operation}`);

    return context;
  }

  endSpan(spanId: string, metadata?: Record<string, unknown>): void {
    const context = this.activeTraces.get(spanId);
    if (!context) {
      this.logger.warn(`No active trace found for spanId: ${spanId}`);
      return;
    }

    const duration = Date.now() - context.startTime;
    this.logger.debug(`Trace ended: ${context.traceId} / ${spanId} - ${context.operation} (${duration}ms)`);
    this.activeTraces.delete(spanId);
  }

  getTraceContext(traceId: string): TraceContext[] {
    const spans: TraceContext[] = [];
    this.activeTraces.forEach((context) => {
      if (context.traceId === traceId) {
        spans.push(context);
      }
    });
    return spans;
  }

  generateCorrelationId(): string {
    return `${Date.now()}-${uuidv4().substring(0, 8)}`;
  }
}
