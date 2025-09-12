import {
  Table,
  Column,
  DataType,
  BelongsTo,
  ForeignKey,
  HasMany,
  DefaultScope,
} from 'sequelize-typescript';
import { BaseModel } from './base.model';
import { Location } from './location.model';
import { Caregiver } from './caregiver.model';
import { RoomBed } from './room-bed.model';

export enum ShiftType {
  MORNING = 'MORNING',
  AFTERNOON = 'AFTERNOON',
  NIGHT = 'NIGHT',
  FULL_DAY = 'FULL_DAY',
}

export enum RosterStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum ShiftStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

@DefaultScope(() => ({
  attributes: { exclude: ['googleCalendarEventId'] },
}))
@Table({
  tableName: 'rosters',
  indexes: [
    { fields: ['location_id'] },
    { fields: ['shift_date'] },
    { fields: ['shift_type'] },
    { fields: ['status'] },
    { fields: ['caregiver_id'] },
  ],
})
export class Roster extends BaseModel<Roster> {
  @ForeignKey(() => Location)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  locationId: string;

  @ForeignKey(() => Caregiver)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  caregiverId: string;

  @ForeignKey(() => RoomBed)
  @Column({
    type: DataType.UUID,
    allowNull: true,
    comment: 'Specific room/bed assignment',
  })
  roomBedId?: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  shiftDate: Date;

  @Column({
    type: DataType.ENUM(...Object.values(ShiftType)),
    allowNull: false,
  })
  shiftType: ShiftType;

  @Column({
    type: DataType.TIME,
    allowNull: false,
  })
  startTime: string;

  @Column({
    type: DataType.TIME,
    allowNull: false,
  })
  endTime: string;

  @Column({
    type: DataType.ENUM(...Object.values(RosterStatus)),
    allowNull: false,
    defaultValue: RosterStatus.DRAFT,
  })
  status: RosterStatus;

  @Column({
    type: DataType.ENUM(...Object.values(ShiftStatus)),
    allowNull: false,
    defaultValue: ShiftStatus.SCHEDULED,
  })
  shiftStatus: ShiftStatus;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment: 'Google Calendar Event ID',
  })
  googleCalendarEventId?: string;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    comment: 'Recurrence pattern for recurring shifts',
  })
  recurrencePattern?: any;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Is this a recurring shift',
  })
  isRecurring: boolean;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: 'Shift notes and special instructions',
  })
  notes?: string;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    comment: 'Additional shift metadata',
  })
  metadata?: any;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: 'When the shift was confirmed by caregiver',
  })
  confirmedAt?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: 'When the shift was started',
  })
  startedAt?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: 'When the shift was completed',
  })
  completedAt?: Date;

  // Associations
  @BelongsTo(() => Location)
  location: Location;

  @BelongsTo(() => Caregiver)
  caregiver: Caregiver;

  @BelongsTo(() => RoomBed)
  roomBed: RoomBed;
}
