import { Email, EntityId, TenantId } from '@abms/kernel';
import { Candidate } from '@abms/hr-recruitment-domain';
import type { EntityManager, Repository } from 'typeorm';
import { CandidateOrmEntity } from '../entities/candidate-orm.entity';
import { TypeOrmCandidateRepository } from './typeorm-candidate.repository';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();

function fakeOrmRepository(): jest.Mocked<
  Pick<Repository<CandidateOrmEntity>, 'findOne' | 'find' | 'count' | 'save' | 'delete'>
> {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<
    Pick<Repository<CandidateOrmEntity>, 'findOne' | 'find' | 'count' | 'save' | 'delete'>
  >;
}

function fakeManager(repository: unknown): jest.Mocked<Pick<EntityManager, 'getRepository'>> {
  return {
    getRepository: jest.fn().mockReturnValue(repository),
  } as unknown as jest.Mocked<Pick<EntityManager, 'getRepository'>>;
}

describe('TypeOrmCandidateRepository', () => {
  it('findById reconstitutes a domain Candidate', async () => {
    const id = EntityId.create();
    const ormRepository = fakeOrmRepository();
    ormRepository.findOne.mockResolvedValue({
      id: id.toValue(),
      tenantId: TENANT_ID.value,
      firstName: 'Amina',
      lastName: 'Juma',
      email: 'amina.juma@example.com',
      phone: null,
      resumeUrl: null,
      source: 'LinkedIn',
    } as CandidateOrmEntity);
    const manager = fakeManager(ormRepository);

    const result = await new TypeOrmCandidateRepository(manager as unknown as EntityManager).findById(id);

    expect(result?.firstName).toBe('Amina');
    expect(result?.email.value).toBe('amina.juma@example.com');
  });

  it('save() upserts the row', async () => {
    const ormRepository = fakeOrmRepository();
    const manager = fakeManager(ormRepository);
    const candidate = Candidate.register({
      tenantId: TENANT_ID,
      firstName: 'Amina',
      lastName: 'Juma',
      email: Email.create('amina.juma@example.com').getValue(),
      phone: null,
      resumeUrl: null,
      source: null,
    });

    await new TypeOrmCandidateRepository(manager as unknown as EntityManager).save(candidate);

    expect(ormRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: candidate.id.toValue(), email: 'amina.juma@example.com' }),
    );
  });
});
