import { validate } from 'class-validator';
import { RejectApplicationDto } from './reject-application.dto';

describe('RejectApplicationDto', () => {
  it('passes validation with no reason', async () => {
    const errors = await validate(new RejectApplicationDto());

    expect(errors).toHaveLength(0);
  });

  it('passes validation with a string reason', async () => {
    const dto = new RejectApplicationDto();
    dto.reason = 'Not enough experience';

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('rejects a non-string reason', async () => {
    const dto = new RejectApplicationDto();
    dto.reason = 42 as unknown as string;

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'reason')).toBe(true);
  });
});
