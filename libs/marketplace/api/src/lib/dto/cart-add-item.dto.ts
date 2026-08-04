import { IsNotEmpty, IsNumber, IsString, IsUUID, Min } from 'class-validator';

export class AddCartItemDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  productId!: string;

  @IsString()
  @IsNotEmpty()
  @IsUUID()
  vendorId!: string;

  @IsNumber()
  @Min(1)
  quantity!: number;
}
