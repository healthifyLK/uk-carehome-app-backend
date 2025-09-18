import { IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PromoteCaregiverDto {
  @ApiProperty({ description: 'Caregiver ID to promote to admin' })
  @IsUUID()
  @IsNotEmpty()
  caregiverId: string;
}