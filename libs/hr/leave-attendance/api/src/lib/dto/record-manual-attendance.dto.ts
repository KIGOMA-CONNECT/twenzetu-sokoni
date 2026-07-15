import { IsDateString, IsIn } from 'class-validator';

const MANUAL_ATTENDANCE_STATUSES = ['ABSENT', 'LATE', 'HALF_DAY'] as const;

export class RecordManualAttendanceDto {
  @IsDateString()
  public date!: string;

  @IsIn(MANUAL_ATTENDANCE_STATUSES)
  public status!: (typeof MANUAL_ATTENDANCE_STATUSES)[number];
}
