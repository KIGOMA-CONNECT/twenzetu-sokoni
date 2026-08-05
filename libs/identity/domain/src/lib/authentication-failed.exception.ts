import { DomainException } from '@afri-market/kernel';

export class AuthenticationFailedException extends DomainException {
  public override readonly code = 'AUTH.UNAUTHENTICATED';
  constructor(message: string) {
    super(message);
  }
}
