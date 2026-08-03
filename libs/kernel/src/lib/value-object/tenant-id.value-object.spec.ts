import { ValidationDomainException } from '../errors/validation-domain.exception';
import { TenantId } from './tenant-id.value-object';

describe('TenantId', () => {
  it('creates successfully from a valid UUID', () => {
    const result = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301');

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().value).toBe('3f2504e0-4f89-41d3-9a0c-0305e82c3301');
  });

  it('fails for an invalid UUID', () => {
    const result = TenantId.create('not-a-uuid');

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBeInstanceOf(ValidationDomainException);
  });

  it('two tenant ids with the same value are equal', () => {
    const value = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
    const a = TenantId.create(value).getValue();
    const b = TenantId.create(value).getValue();

    expect(a.equals(b)).toBe(true);
  });
});
