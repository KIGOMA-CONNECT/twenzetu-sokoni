import { EntityId, IRepository } from '@afri-market/kernel';
import { CountryConfig } from './country-config';

export interface ICountryConfigRepository extends IRepository<CountryConfig, EntityId> {
  findByCountryCode(code: string): Promise<CountryConfig | null>;
  findActive(): Promise<CountryConfig[]>;
}
