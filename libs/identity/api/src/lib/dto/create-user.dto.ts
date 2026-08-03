import { USER_ROLES, UserRole } from '@abms/identity-domain';
import { IsEmail, IsIn, IsStrongPassword } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  public email!: string;

  @IsStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 0 })
  public password!: string;

  @IsIn(USER_ROLES)
  public role!: UserRole;
}
