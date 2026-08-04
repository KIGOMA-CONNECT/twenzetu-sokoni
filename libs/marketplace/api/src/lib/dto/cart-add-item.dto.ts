import { IsNotEmpty, IsNumber, IsString, Matches, Min } from 'class-validator';
import { HEX_UUID_REGEX } from '../common/uuid.util';

export class AddCartItemDto {
  @IsString()
  @IsNotEmpty()
  @Matches(HEX_UUID_REGEX)
  productId!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(HEX_UUID_REGEX)
  vendorId!: string;

  @IsNumber()
  @Min(1)
  quantity!: number;
}
