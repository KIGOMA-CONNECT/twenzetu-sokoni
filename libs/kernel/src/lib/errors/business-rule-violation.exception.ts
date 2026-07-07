import { DomainException } from './domain-exception.base';

export class BusinessRuleViolationException extends DomainException {
  public readonly code = 'DOMAIN.BUSINESS_RULE_VIOLATION';

  public constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}
