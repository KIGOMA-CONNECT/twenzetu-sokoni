import { EntityId, IRepository } from '@afri-market/kernel';
import { User } from '../user.aggregate';

export interface IUserRepository extends IRepository<User, EntityId> {
  findByPhoneNumber(phoneNumber: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  countByTenant(tenantId: string): Promise<number>;
}
