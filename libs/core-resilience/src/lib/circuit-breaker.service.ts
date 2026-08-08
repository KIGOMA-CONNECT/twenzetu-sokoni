import { Injectable, Logger } from '@nestjs/common';

export interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
}

export interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  lastFailureTime: number;
  successCount: number;
}

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private readonly circuits = new Map<string, CircuitBreakerState>();

  private readonly defaultOptions: CircuitBreakerOptions = {
    failureThreshold: 5,
    resetTimeout: 30000,
    monitoringPeriod: 60000,
  };

  getCircuit(name: string, options?: Partial<CircuitBreakerOptions>): CircuitBreakerState {
    const opts = { ...this.defaultOptions, ...options };
    
    if (!this.circuits.has(name)) {
      this.circuits.set(name, {
        state: 'CLOSED',
        failureCount: 0,
        lastFailureTime: 0,
        successCount: 0,
      });
    }

    const circuit = this.circuits.get(name)!;
    const now = Date.now();

    // Check if we should transition from OPEN to HALF_OPEN
    if (circuit.state === 'OPEN' && now - circuit.lastFailureTime > opts.resetTimeout) {
      circuit.state = 'HALF_OPEN';
      circuit.successCount = 0;
      this.logger.debug(`Circuit ${name} transitioned to HALF_OPEN`);
    }

    return circuit;
  }

  async execute<T>(
    name: string,
    fn: () => Promise<T>,
    options?: Partial<CircuitBreakerOptions>,
  ): Promise<T> {
    const circuit = this.getCircuit(name, options);

    if (circuit.state === 'OPEN') {
      this.logger.warn(`Circuit ${name} is OPEN, rejecting request`);
      throw new Error(`Circuit breaker ${name} is OPEN`);
    }

    try {
      const result = await fn();
      this.onSuccess(name);
      return result;
    } catch (error) {
      this.onFailure(name);
      throw error;
    }
  }

  private onSuccess(name: string): void {
    const circuit = this.circuits.get(name);
    if (!circuit) return;

    if (circuit.state === 'HALF_OPEN') {
      circuit.successCount++;
      if (circuit.successCount >= 3) {
        circuit.state = 'CLOSED';
        circuit.failureCount = 0;
        this.logger.debug(`Circuit ${name} transitioned to CLOSED`);
      }
    } else {
      circuit.failureCount = 0;
    }
  }

  private onFailure(name: string): void {
    const circuit = this.circuits.get(name);
    if (!circuit) return;

    circuit.failureCount++;
    circuit.lastFailureTime = Date.now();

    if (circuit.failureCount >= this.defaultOptions.failureThreshold) {
      circuit.state = 'OPEN';
      this.logger.warn(`Circuit ${name} transitioned to OPEN after ${circuit.failureCount} failures`);
    }
  }

  getStats(): Record<string, CircuitBreakerState> {
    const stats: Record<string, CircuitBreakerState> = {};
    this.circuits.forEach((state, name) => {
      stats[name] = { ...state };
    });
    return stats;
  }
}
