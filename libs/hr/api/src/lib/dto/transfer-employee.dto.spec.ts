import { validate } from 'class-validator';
import { TransferEmployeeDto } from './transfer-employee.dto';

describe('TransferEmployeeDto', () => {
  it('passes validation with no newOrgUnitId (clearing the assignment)', async () => {
    const errors = await validate(new TransferEmployeeDto());

    expect(errors).toHaveLength(0);
  });

  it('rejects a non-uuid newOrgUnitId', async () => {
    const dto = new TransferEmployeeDto();
    dto.newOrgUnitId = 'not-a-uuid';

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'newOrgUnitId')).toBe(true);
  });
});
