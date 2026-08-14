import { applyDecorators } from '@nestjs/common';
import { IsString, Matches, MinLength } from 'class-validator';

export const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
export const PASSWORD_POLICY_MESSAGE =
  'Password must be at least 8 characters and contain uppercase, lowercase, and a number';

export function IsStrongPassword(): PropertyDecorator {
  return applyDecorators(
    IsString(),
    MinLength(8),
    Matches(PASSWORD_PATTERN, { message: PASSWORD_POLICY_MESSAGE }),
  );
}
