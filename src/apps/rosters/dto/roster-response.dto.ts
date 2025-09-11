import { Expose } from 'class-transformer';
import { 
  ShiftType, 
  RosterStatus, 
  ShiftStatus 
} from '../../../database/models/roster.model';

export class RosterResponseDto {
  @Expose()
  id: string;

  @Expose()
  locationId: string;

  @Expose()
  caregiverId: string;

  @Expose()
  roomBedId?: string;

  @Expose()
  shiftDate: Date;

  @Expose()
  shiftType: ShiftType;

  @Expose()
  startTime: string;

  @Expose()
  endTime: string;

  @Expose()
  status: RosterStatus;

  @Expose()
  shiftStatus: ShiftStatus;

  @Expose()
  isRecurring: boolean;

  @Expose()
  recurrencePattern?: any;

  @Expose()
  notes?: string;

  @Expose()
  metadata?: any;

  @Expose()
  confirmedAt?: Date;

  @Expose()
  startedAt?: Date;

  @Expose()
  completedAt?: Date;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  // Computed fields
  @Expose()
  get duration(): number {
    const start = new Date(`2000-01-01T${this.startTime}`);
    const end = new Date(`2000-01-01T${this.endTime}`);
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60); // hours
  }

  @Expose()
  get isActive(): boolean {
    return this.shiftStatus === ShiftStatus.IN_PROGRESS;
  }

  @Expose()
  get isCompleted(): boolean {
    return this.shiftStatus === ShiftStatus.COMPLETED;
  }
}