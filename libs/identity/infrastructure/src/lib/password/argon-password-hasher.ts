import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { IPasswordHasher } from './password-hasher.interface';

// argon2 (not bcrypt) per the user's explicit choice: OWASP-recommended default,
// stronger resistance to GPU cracking. Wrapped behind IPasswordHasher so the
// library choice doesn't leak into handlers/tests.
@Injectable()
export class ArgonPasswordHasher implements IPasswordHasher {
  public hash(plainPassword: string): Promise<string> {
    return argon2.hash(plainPassword);
  }

  public verify(hash: string, plainPassword: string): Promise<boolean> {
    return argon2.verify(hash, plainPassword);
  }
}
