import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RedeemPointsDto {
  @ApiProperty({ description: 'Number of points to redeem' })
  @IsInt()
  @Min(1)
  pointsToRedeem!: number;
}
