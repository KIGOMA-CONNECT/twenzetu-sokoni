import { randomUUID } from 'node:crypto';
import { ValidationDomainException } from '../errors/validation-domain.exception';
import { Identifier } from './identifier.base';
import { isValidUuid } from './uuid.util';

export class EntityId extends Identifier<string> {
  private constructor(value: string) {
    super(value);
  }

  public static create(value?: string): EntityId {
    if (value === undefined) {
      return new EntityId(randomUUID());
    }
    if (!isValidUuid(value)) {
      throw new ValidationDomainException(`EntityId "${value}" is not a valid UUID.`, {
        value,
      });
    }
    return new EntityId(value);
  }
}
