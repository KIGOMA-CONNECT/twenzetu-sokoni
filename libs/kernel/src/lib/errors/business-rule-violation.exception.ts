import { DomainException } from './domain-exception.base';

export class BusinessRuleViolationException extends DomainException {
  constructor(message: string, rule?: string) {
    super(message);
    this.name = 'BusinessRuleViolationException';
    this.code = rule || 'BUSINESS_RULE_VIOLATION';
  }
}
