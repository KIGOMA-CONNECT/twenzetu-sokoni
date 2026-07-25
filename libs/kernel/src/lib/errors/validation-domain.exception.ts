import { DomainException } from './domain-exception.base';

export class ValidationDomainException extends DomainException {
  public readonly errors: string[];

  constructor(message: string, errors: string[] = []) {
    super(message);
    this.name = 'ValidationDomainException';
    this.code = 'VALIDATION_ERROR';
    this.errors = errors;
  }
}
