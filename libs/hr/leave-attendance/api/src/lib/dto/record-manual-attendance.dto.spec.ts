import { validate } from 'class-validator';
import { RecordManualAttendanceDto } from './record-manual-attendance.dto';

function validDto(overrides: Partial<RecordManualAttendanceDto> = {}): RecordManualAttendanceDto {
  const dto = new RecordManualAttendanceDto();
  dto.date = '2026-08-01';
  dto.status = 'ABSENT';
  return Object.assign(dto, overrides);
}

describe('RecordManualAttendanceDto', () => {
  it('passes validation with a valid payload', async () => {
    const errors = await validate(validDto());

    expect(errors).toHaveLength(0);
  });

  it('rejects a non-ISO-date date', async () => {
    const errors = await validate(validDto({ date: 'not-a-date' }));

    expect(errors.some((error) => error.property === 'date')).toBe(true);
  });

  it('rejects an invalid status', async () => {
    const errors = await validate(validDto({ status: 'PRESENT' as RecordManualAttendanceDto['status'] }));

    expect(errors.some((error) => error.property === 'status')).toBe(true);
  });
});
