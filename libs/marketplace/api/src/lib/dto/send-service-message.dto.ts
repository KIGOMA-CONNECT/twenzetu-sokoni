import { IsNotEmpty, IsString } from 'class-validator';

export class SendServiceMessageDto {
  @IsString()
  @IsNotEmpty()
  requestId!: string;

  @IsString()
  @IsNotEmpty()
  message!: string;
}
