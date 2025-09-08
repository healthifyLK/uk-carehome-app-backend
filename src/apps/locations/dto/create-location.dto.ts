import { IsString, IsEmail, IsOptional, IsInt, IsBoolean, Min, MaxLength } from 'class-validator';

export class CreateLocationDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  @MaxLength(500)
  address: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  city?: string;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  postcode?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  capacity?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsOptional()
  settings?: object;
}