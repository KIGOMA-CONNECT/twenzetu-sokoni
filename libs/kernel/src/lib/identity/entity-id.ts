import { Identifier } from './identifier.base';
import { v4 as uuidv4 } from 'uuid';

export class EntityId extends Identifier<string> {
  private constructor(value: string) {
    super(value);
  }

  public static create(): EntityId {
    return new EntityId(uuidv4());
  }

  public static from(value: string): EntityId {
    if (!value || value.trim().length === 0) {
      throw new Error('EntityId cannot be created from empty string');
    }
    return new EntityId(value);
  }

  public equals(other?: Identifier<string>): boolean {
    if (other === null || other === undefined) return false;
    return this.value === other.value;
  }

  public override toString(): string {
    return this.value;
  }
}
