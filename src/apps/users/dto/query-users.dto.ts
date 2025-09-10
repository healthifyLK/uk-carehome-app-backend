import { IsEnum, IsOptional, IsUUID, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole, UserStatus } from '../../../database/models/user.model';

export class QueryUsersDto {
  @IsUUID() @IsOptional() locationId?: string;
  @IsEnum(UserRole) @IsOptional() role?: UserRole;
  @IsEnum(UserStatus) @IsOptional() status?: UserStatus;
  @Type(() => Number) @IsInt() @Min(0) @IsOptional() offset?: number = 0;
  @Type(() => Number) @IsInt() @Min(1) @IsOptional() limit?: number = 25;
}