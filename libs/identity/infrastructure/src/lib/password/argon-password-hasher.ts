import * as argon2 from 'argon2';
import { IPasswordHasher } from './password-hasher.interface';

export class ArgonPasswordHasher implements IPasswordHasher {
  public async hash(password: string): Promise<string> {
    return argon2.hash(password);
  }

  public async verify(hash: string, password: string): Promise<boolean> {
    return argon2.verify(hash, password);
  }
}
