import { validate } from 'class-validator';
import { LeaveRequestDecisionDto } from './leave-request-decision.dto';

describe('LeaveRequestDecisionDto', () => {
  it('passes validation with no comment', async () => {
    const errors = await validate(new LeaveRequestDecisionDto());

    expect(errors).toHaveLength(0);
  });

  it('passes validation with a string comment', async () => {
    const dto = new LeaveRequestDecisionDto();
    dto.comment = 'Approved, enjoy your leave.';

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('rejects a non-string comment', async () => {
    const dto = new LeaveRequestDecisionDto();
    dto.comment = 42 as unknown as string;

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'comment')).toBe(true);
  });
});
