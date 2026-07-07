import { DomainException } from './domain-exception.base';

export class ConcurrencyDomainException extends DomainException {
  public readonly code = 'DOMAIN.CONCURRENCY_CONFLICT';

  public constructor(entityName: string, identifier: string) {
    super(
      `${entityName} with identifier "${identifier}" was modified concurrently by another transaction. Reload and retry.`,
      { entityName, identifier },
    );
  }
}
