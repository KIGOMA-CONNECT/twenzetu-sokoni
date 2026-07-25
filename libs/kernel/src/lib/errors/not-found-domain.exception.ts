import { DomainException } from './domain-exception.base';

export class NotFoundException extends DomainException {
  constructor(entity: string, id?: string) {
    super(id ? `${entity} with id ${id} not found` : `${entity} not found`);
    this.name = 'NotFoundException';
    this.code = 'NOT_FOUND';
  }
}
