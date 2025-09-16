import { IsOptional, IsString } from 'class-validator';

export class UpdateLeaveRequestStatusDto {
  @IsOptional()
  @IsString()
  decisionNote?: string;
}