import { IsOptional, IsEnum, IsDateString, IsUUID } from 'class-validator';
import { LeaveStatus } from '../../../database/models/leave-request.model';

export class QueryLeaveRequestsDto {
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @IsOptional()
  @IsUUID()
  caregiverId?: string;

  @IsOptional()
  @IsEnum(LeaveStatus)
  status?: LeaveStatus;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;
}