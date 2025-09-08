import { IsString, IsUUID, IsOptional, IsBoolean } from 'class-validator';

export class CreateRoomBedDto {
  @IsString()
  roomNumber: string;

  @IsString()
  bedNumber: string;

  @IsUUID()
  locationId: string;

  @IsString()
  @IsOptional()
  floor?: string;

  @IsString()
  @IsOptional()
  wing?: string;

  @IsBoolean()
  @IsOptional()
  isOccupied?: boolean;

  @IsOptional()
  features?: object;
}