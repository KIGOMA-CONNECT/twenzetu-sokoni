import { DomainException } from './domain-exception.base';

export class NotFoundDomainException extends DomainException {
  public readonly code = 'DOMAIN.NOT_FOUND';

  public constructor(entityName: string, identifier: string) {
    super(`${entityName} with identifier "${identifier}" was not found.`, {
      entityName,
      identifier,
    });
  }
}
