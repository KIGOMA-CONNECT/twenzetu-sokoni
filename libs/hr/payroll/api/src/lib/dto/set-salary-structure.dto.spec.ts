import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SetSalaryStructureDto } from './set-salary-structure.dto';

function validPayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    basicSalary: 500000,
    allowances: [{ name: 'Transport', amount: 50000 }],
    effectiveFrom: '2026-01-01',
    ...overrides,
  };
}

function toDto(payload: Record<string, unknown>): SetSalaryStructureDto {
  return plainToInstance(SetSalaryStructureDto, payload);
}

describe('SetSalaryStructureDto', () => {
  it('passes validation with a valid payload', async () => {
    const errors = await validate(toDto(validPayload()));

    expect(errors).toHaveLength(0);
  });

  it('allows an empty allowances array', async () => {
    const errors = await validate(toDto(validPayload({ allowances: [] })));

    expect(errors).toHaveLength(0);
  });

  it('rejects a negative basicSalary', async () => {
    const errors = await validate(toDto(validPayload({ basicSalary: -1 })));

    expect(errors.some((error) => error.property === 'basicSalary')).toBe(true);
  });

  it('rejects a non-ISO-date effectiveFrom', async () => {
    const errors = await validate(toDto(validPayload({ effectiveFrom: 'not-a-date' })));

    expect(errors.some((error) => error.property === 'effectiveFrom')).toBe(true);
  });

  it('rejects an allowance with a negative amount', async () => {
    const errors = await validate(
      toDto(validPayload({ allowances: [{ name: 'Transport', amount: -5 }] })),
    );

    expect(errors.some((error) => error.property === 'allowances')).toBe(true);
  });
});
