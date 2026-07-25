export class DomainException extends Error {
  public code: string;

  constructor(message: string, _context?: Record<string, unknown>) {
    super(message);
    this.name = 'DomainException';
    this.code = 'DOMAIN_ERROR';
  }
}
