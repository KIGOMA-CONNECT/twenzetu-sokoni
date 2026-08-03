import { EntityId, TenantId } from '@abms/kernel';
import { Course } from '@abms/hr-learning-domain';
import type { EntityManager, Repository } from 'typeorm';
import { CourseOrmEntity } from '../entities/course-orm.entity';
import { TypeOrmCourseRepository } from './typeorm-course.repository';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();

function fakeOrmRepository(): jest.Mocked<
  Pick<Repository<CourseOrmEntity>, 'findOne' | 'find' | 'count' | 'save' | 'delete'>
> {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<
    Pick<Repository<CourseOrmEntity>, 'findOne' | 'find' | 'count' | 'save' | 'delete'>
  >;
}

function fakeManager(repository: unknown): jest.Mocked<Pick<EntityManager, 'getRepository'>> {
  return {
    getRepository: jest.fn().mockReturnValue(repository),
  } as unknown as jest.Mocked<Pick<EntityManager, 'getRepository'>>;
}

describe('TypeOrmCourseRepository', () => {
  it('findAllByTenant reconstitutes domain Courses', async () => {
    const id = EntityId.create();
    const ormRepository = fakeOrmRepository();
    ormRepository.find.mockResolvedValue([
      {
        id: id.toValue(),
        tenantId: TENANT_ID.value,
        title: 'Workplace Safety',
        description: null,
        durationHours: 4,
        category: 'COMPLIANCE',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as CourseOrmEntity,
    ]);
    const manager = fakeManager(ormRepository);

    const result = await new TypeOrmCourseRepository(manager as unknown as EntityManager).findAllByTenant(
      TENANT_ID,
    );

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Workplace Safety');
  });

  it('save() upserts the row', async () => {
    const ormRepository = fakeOrmRepository();
    const manager = fakeManager(ormRepository);
    const course = Course.create({
      tenantId: TENANT_ID,
      title: 'Workplace Safety',
      description: null,
      durationHours: 4,
      category: 'COMPLIANCE',
    });

    await new TypeOrmCourseRepository(manager as unknown as EntityManager).save(course);

    expect(ormRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: course.id.toValue(), title: 'Workplace Safety', isActive: true }),
    );
  });
});
