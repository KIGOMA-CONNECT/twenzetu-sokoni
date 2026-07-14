import { IsEmail, IsNotEmpty, IsString, IsStrongPassword } from 'class-validator';

export class RegisterTenantDto {
  @IsString()
  @IsNotEmpty()
  public businessName!: string;

  @IsEmail()
  public ceoEmail!: string;

  @IsStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 0 })
  public ceoPassword!: string;
}
