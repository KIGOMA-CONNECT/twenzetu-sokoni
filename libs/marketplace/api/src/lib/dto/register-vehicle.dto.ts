import { IsEnum, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterVehicleDto {
  @ApiProperty({ description: 'Vehicle type', enum: ['boda', 'bajaji', 'carry', 'guta', 'fuso'] })
  @IsEnum(['boda', 'bajaji', 'carry', 'guta', 'fuso'])
  vehicleType!: string;

  @ApiProperty({ description: 'Plate number' })
  @IsString()
  @IsNotEmpty()
  plateNumber!: string;

  @ApiProperty({ description: 'Capacity in kg' })
  @IsNumber()
  @Min(0)
  capacityKg!: number;
}
