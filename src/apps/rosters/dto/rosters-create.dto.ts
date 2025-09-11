import { 
    IsString, 
    IsDate, 
    IsOptional, 
    IsEnum, 
    IsUUID, 
    IsBoolean,
    IsObject,
    IsTimeZone
  } from 'class-validator';
  import { Type } from 'class-transformer';
  import { ShiftType, RosterStatus } from '../../../database/models/roster.model';
  
  export class RecurrencePatternDto {
    @IsString()
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  
    @IsString()
    interval: string;
  
    @IsString({ each: true })
    @IsOptional()
    daysOfWeek?: string[];
  
    @IsDate()
    @Type(() => Date)
    @IsOptional()
    endDate?: Date;
  
    @IsString()
    @IsOptional()
    endAfter?: string;
  }
  
  export class RosterCreateDto {
    @IsUUID()
    locationId: string;
  
    @IsUUID()
    caregiverId: string;
  
    @IsUUID()
    @IsOptional()
    roomBedId?: string;
  
    @IsDate()
    @Type(() => Date)
    shiftDate: Date;
  
    @IsEnum(ShiftType)
    shiftType: ShiftType;
  
    @IsString()
    startTime: string;
  
    @IsString()
    endTime: string;
  
    @IsEnum(RosterStatus)
    @IsOptional()
    status?: RosterStatus;
  
    @IsString()
    @IsOptional()
    notes?: string;
  
    @IsBoolean()
    @IsOptional()
    isRecurring?: boolean;
  
    @IsObject()
    @IsOptional()
    recurrencePattern?: RecurrencePatternDto;
  
    @IsObject()
    @IsOptional()
    metadata?: any;
  }