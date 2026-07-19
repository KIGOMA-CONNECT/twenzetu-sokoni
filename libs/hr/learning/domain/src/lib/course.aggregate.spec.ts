import { TenantId } from '@abms/kernel';
import { Course } from './course.aggregate';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();

describe('Course', () => {
  it('creates as active and emits an event', () => {
    const course = Course.create({
      tenantId: TENANT_ID,
      title: 'Workplace Safety',
      description: null,
      durationHours: 4,
      category: 'COMPLIANCE',
    });

    expect(course.isActive).toBe(true);
    expect(course.domainEvents).toHaveLength(1);
  });

  it('rejects an empty title', () => {
    expect(() =>
      Course.create({
        tenantId: TENANT_ID,
        title: '  ',
        description: null,
        durationHours: 4,
        category: 'TECHNICAL',
      }),
    ).toThrow();
  });

  it('rejects a zero durationHours', () => {
    expect(() =>
      Course.create({
        tenantId: TENANT_ID,
        title: 'Leadership 101',
        description: null,
        durationHours: 0,
        category: 'LEADERSHIP',
      }),
    ).toThrow();
  });

  it('deactivate() is not idempotent', () => {
    const course = Course.create({
      tenantId: TENANT_ID,
      title: 'Communication Skills',
      description: null,
      durationHours: 2,
      category: 'SOFT_SKILLS',
    });
    course.deactivate();

    expect(() => course.deactivate()).toThrow();
  });
});
