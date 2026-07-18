import { EntityId, TenantId } from '@abms/kernel';
import { JobRequisition } from '@abms/hr-recruitment-domain';
import type { EntityManager, Repository } from 'typeorm';
import { JobRequisitionOrmEntity } from '../entities/job-requisition-orm.entity';
import { TypeOrmJobRequisitionRepository } from './typeorm-job-requisition.repository';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();

function fakeOrmRepository(): jest.Mocked<
  Pick<Repository<JobRequisitionOrmEntity>, 'findOne' | 'find' | 'count' | 'save' | 'delete'>
> {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<
    Pick<Repository<JobRequisitionOrmEntity>, 'findOne' | 'find' | 'count' | 'save' | 'delete'>
  >;
}

function fakeManager(repository: unknown): jest.Mocked<Pick<EntityManager, 'getRepository'>> {
  return {
    getRepository: jest.fn().mockReturnValue(repository),
  } as unknown as jest.Mocked<Pick<EntityManager, 'getRepository'>>;
}

describe('TypeOrmJobRequisitionRepository', () => {
  it('findById reconstitutes a domain JobRequisition', async () => {
    const id = EntityId.create();
    const positionId = EntityId.create();
    const ormRepository = fakeOrmRepository();
    ormRepository.findOne.mockResolvedValue({
      id: id.toValue(),
      tenantId: TENANT_ID.value,
      positionId: positionId.toValue(),
      title: 'Software Engineer',
      headcount: 2,
      status: 'OPEN',
      closeReason: null,
    } as JobRequisitionOrmEntity);
    const manager = fakeManager(ormRepository);

    const result = await new TypeOrmJobRequisitionRepository(manager as unknown as EntityManager).findById(id);

    expect(result?.title).toBe('Software Engineer');
    expect(result?.status).toBe('OPEN');
  });

  it('save() upserts the row', async () => {
    const ormRepository = fakeOrmRepository();
    const manager = fakeManager(ormRepository);
    const requisition = JobRequisition.open({
      tenantId: TENANT_ID,
      positionId: EntityId.create(),
      title: 'Software Engineer',
      headcount: 2,
    });

    await new TypeOrmJobRequisitionRepository(manager as unknown as EntityManager).save(requisition);

    expect(ormRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: requisition.id.toValue(), title: 'Software Engineer', status: 'OPEN' }),
    );
  });
});
