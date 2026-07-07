import { DomainException } from './domain-exception.base';

export class ValidationDomainException extends DomainException {
  public readonly code = 'DOMAIN.VALIDATION_FAILED';

  public constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}
