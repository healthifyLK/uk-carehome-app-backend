import { IsEmail, IsNotEmpty, IsString, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAdminDto {
  @ApiProperty({ description: 'Admin first name' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ description: 'Admin last name' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ description: 'Admin work email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Location ID where admin will work' })
  @IsUUID()
  @IsNotEmpty()
  locationId: string;

  @ApiProperty({ description: 'Admin phone number', required: false })
  @IsString()
  @IsOptional()
  phoneNumber?: string;
}