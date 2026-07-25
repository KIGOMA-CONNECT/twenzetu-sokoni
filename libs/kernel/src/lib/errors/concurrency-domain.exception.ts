import { DomainException } from './domain-exception.base';

export class ConcurrencyDomainException extends DomainException {
  constructor(entity: string, id: string) {
    super(`Concurrency conflict on ${entity} (${id}). The entity was modified by another process.`);
    this.name = 'ConcurrencyDomainException';
    this.code = 'CONCURRENCY_CONFLICT';
  }
}
