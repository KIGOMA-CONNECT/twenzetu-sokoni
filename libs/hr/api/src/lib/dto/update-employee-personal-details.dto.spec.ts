import { validate } from 'class-validator';
import { UpdateEmployeePersonalDetailsDto } from './update-employee-personal-details.dto';

describe('UpdateEmployeePersonalDetailsDto', () => {
  it('passes validation with no fields set (all optional)', async () => {
    const errors = await validate(new UpdateEmployeePersonalDetailsDto());

    expect(errors).toHaveLength(0);
  });

  it('passes validation with a valid partial payload', async () => {
    const dto = new UpdateEmployeePersonalDetailsDto();
    dto.firstName = 'Janet';
    dto.email = 'janet.doe@example.com';

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('rejects an invalid email', async () => {
    const dto = new UpdateEmployeePersonalDetailsDto();
    dto.email = 'not-an-email';

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'email')).toBe(true);
  });

  it('rejects an invalid gender', async () => {
    const dto = new UpdateEmployeePersonalDetailsDto();
    dto.gender = 'UNKNOWN' as UpdateEmployeePersonalDetailsDto['gender'];

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'gender')).toBe(true);
  });
});
