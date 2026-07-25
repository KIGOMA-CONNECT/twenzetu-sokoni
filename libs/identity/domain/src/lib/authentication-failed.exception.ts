import { DomainException } from '@afri-market/kernel';

export class AuthenticationFailedException extends DomainException {
  public readonly code = 'AUTH.UNAUTHENTICATED';
  constructor(message: string) {
    super(message);
  }
}
