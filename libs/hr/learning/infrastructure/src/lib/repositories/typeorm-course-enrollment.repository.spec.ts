import { EntityId, TenantId } from '@abms/kernel';
import { CourseEnrollment } from '@abms/hr-learning-domain';
import type { EntityManager, Repository } from 'typeorm';
import { CourseEnrollmentOrmEntity } from '../entities/course-enrollment-orm.entity';
import { TypeOrmCourseEnrollmentRepository } from './typeorm-course-enrollment.repository';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();

function fakeOrmRepository(): jest.Mocked<
  Pick<Repository<CourseEnrollmentOrmEntity>, 'findOne' | 'find' | 'count' | 'save' | 'delete'>
> {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<
    Pick<Repository<CourseEnrollmentOrmEntity>, 'findOne' | 'find' | 'count' | 'save' | 'delete'>
  >;
}

function fakeManager(repository: unknown): jest.Mocked<Pick<EntityManager, 'getRepository'>> {
  return {
    getRepository: jest.fn().mockReturnValue(repository),
  } as unknown as jest.Mocked<Pick<EntityManager, 'getRepository'>>;
}

describe('TypeOrmCourseEnrollmentRepository', () => {
  it('findActiveByEmployeeAndCourse reconstitutes a domain CourseEnrollment', async () => {
    const id = EntityId.create();
    const employeeId = EntityId.create();
    const courseId = EntityId.create();
    const ormRepository = fakeOrmRepository();
    ormRepository.findOne.mockResolvedValue({
      id: id.toValue(),
      tenantId: TENANT_ID.value,
      employeeId: employeeId.toValue(),
      courseId: courseId.toValue(),
      enrolledDate: '2026-08-01',
      status: 'IN_PROGRESS',
      score: null,
      completedDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as CourseEnrollmentOrmEntity);
    const manager = fakeManager(ormRepository);

    const result = await new TypeOrmCourseEnrollmentRepository(
      manager as unknown as EntityManager,
    ).findActiveByEmployeeAndCourse(TENANT_ID, employeeId, courseId);

    expect(result?.status).toBe('IN_PROGRESS');
  });

  it('save() upserts the row', async () => {
    const ormRepository = fakeOrmRepository();
    const manager = fakeManager(ormRepository);
    const enrollment = CourseEnrollment.enroll({
      tenantId: TENANT_ID,
      employeeId: EntityId.create(),
      courseId: EntityId.create(),
      enrolledDate: new Date('2026-08-01'),
    });

    await new TypeOrmCourseEnrollmentRepository(manager as unknown as EntityManager).save(enrollment);

    expect(ormRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: enrollment.id.toValue(), status: 'IN_PROGRESS' }),
    );
  });
});
