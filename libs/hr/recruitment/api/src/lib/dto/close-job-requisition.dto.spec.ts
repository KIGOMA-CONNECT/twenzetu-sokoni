import { validate } from 'class-validator';
import { CloseJobRequisitionDto } from './close-job-requisition.dto';

describe('CloseJobRequisitionDto', () => {
  it('passes validation with FILLED', async () => {
    const dto = new CloseJobRequisitionDto();
    dto.reason = 'FILLED';

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('passes validation with CANCELLED', async () => {
    const dto = new CloseJobRequisitionDto();
    dto.reason = 'CANCELLED';

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('rejects an invalid reason', async () => {
    const dto = new CloseJobRequisitionDto();
    dto.reason = 'DECLINED' as CloseJobRequisitionDto['reason'];

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'reason')).toBe(true);
  });
});
