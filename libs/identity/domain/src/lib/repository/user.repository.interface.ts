import { Email, EntityId, IRepository } from '@abms/kernel';
import { User } from '../user.aggregate';

export interface IUserRepository extends IRepository<User, EntityId> {
  findByEmail(email: Email): Promise<User | null>;
}
