import { EntityId, TenantId } from '@abms/kernel';
import { Application } from '@abms/hr-recruitment-domain';
import type { EntityManager, Repository } from 'typeorm';
import { ApplicationOrmEntity } from '../entities/application-orm.entity';
import { TypeOrmApplicationRepository } from './typeorm-application.repository';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();

function fakeOrmRepository(): jest.Mocked<
  Pick<Repository<ApplicationOrmEntity>, 'findOne' | 'find' | 'count' | 'save' | 'delete'>
> {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<
    Pick<Repository<ApplicationOrmEntity>, 'findOne' | 'find' | 'count' | 'save' | 'delete'>
  >;
}

function fakeManager(repository: unknown): jest.Mocked<Pick<EntityManager, 'getRepository'>> {
  return {
    getRepository: jest.fn().mockReturnValue(repository),
  } as unknown as jest.Mocked<Pick<EntityManager, 'getRepository'>>;
}

describe('TypeOrmApplicationRepository', () => {
  it('findById reconstitutes a domain Application', async () => {
    const id = EntityId.create();
    const candidateId = EntityId.create();
    const requisitionId = EntityId.create();
    const ormRepository = fakeOrmRepository();
    ormRepository.findOne.mockResolvedValue({
      id: id.toValue(),
      tenantId: TENANT_ID.value,
      candidateId: candidateId.toValue(),
      jobRequisitionId: requisitionId.toValue(),
      status: 'APPLIED',
      decisionNotes: null,
    } as ApplicationOrmEntity);
    const manager = fakeManager(ormRepository);

    const result = await new TypeOrmApplicationRepository(manager as unknown as EntityManager).findById(id);

    expect(result?.status).toBe('APPLIED');
  });

  it('save() upserts the row', async () => {
    const ormRepository = fakeOrmRepository();
    const manager = fakeManager(ormRepository);
    const application = Application.submit({
      tenantId: TENANT_ID,
      candidateId: EntityId.create(),
      jobRequisitionId: EntityId.create(),
    });

    await new TypeOrmApplicationRepository(manager as unknown as EntityManager).save(application);

    expect(ormRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: application.id.toValue(), status: 'APPLIED' }),
    );
  });
});
