import { IsEmail, IsNotEmpty, IsString, IsEnum, IsUUID, IsOptional } from 'class-validator';
import { UserRole } from '../../../database/models';

export class RegisterDto {
    @IsString()
    @IsNotEmpty()
    firstName: string;
  
    @IsString()
    @IsNotEmpty()
    lastName: string;
  
    @IsEmail()
    @IsNotEmpty()
    email: string;
  
    @IsString()
    @IsNotEmpty()
    password: string;
  
    @IsEnum(UserRole)
    @IsNotEmpty()
    role: UserRole;
  
    @IsUUID()
    @IsOptional()
    locationId?: string;
  
    @IsString()
    @IsOptional()
    phoneNumber?: string;
  }