import { IsEnum, IsDateString, IsString, IsNotEmpty } from 'class-validator';
import { LeaveType } from '../../../database/models/leave-request.model';

export class CreateLeaveRequestDto {
  @IsDateString()
  date: string;

  @IsEnum(LeaveType)
  type: LeaveType;

  @IsString()
  @IsNotEmpty()
  reason: string;
}