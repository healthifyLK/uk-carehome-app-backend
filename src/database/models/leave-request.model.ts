import {
    Table,
    Column,
    DataType,
    BelongsTo,
    ForeignKey,
    DefaultScope,
  } from 'sequelize-typescript';
  import { BaseModel } from './base.model';
  import { Location } from './location.model';
  import { Caregiver } from './caregiver.model';
  import { User } from './user.model';
  
  export enum LeaveType {
    FULL_DAY = 'FULL_DAY',
    HALF_DAY_AM = 'HALF_DAY_AM',
    HALF_DAY_PM = 'HALF_DAY_PM',
  }
  
  export enum LeaveStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    CANCELLED = 'CANCELLED',
  }
  
  @DefaultScope(() => ({
    attributes: { exclude: [] },
  }))
  @Table({
    tableName: 'leave_requests',
    indexes: [
      { fields: ['caregiver_id'] },
      { fields: ['location_id'] },
      { fields: ['date'] },
      { fields: ['status'] },
      { fields: ['caregiver_id', 'date'], unique: true },
      { fields: ['location_id', 'date'] },
    ],
  })
  export class LeaveRequest extends BaseModel<LeaveRequest> {
    @ForeignKey(() => Caregiver)
    @Column({
      type: DataType.UUID,
      allowNull: false,
    })
    caregiverId: string;
  
    @ForeignKey(() => Location)
    @Column({
      type: DataType.UUID,
      allowNull: false,
    })
    locationId: string;
  
    @Column({
      type: DataType.DATE,
      allowNull: false,
    })
    date: Date;
  
    @Column({
      type: DataType.ENUM(...Object.values(LeaveType)),
      allowNull: false,
    })
    type: LeaveType;
  
    @Column({
      type: DataType.ENUM(...Object.values(LeaveStatus)),
      allowNull: false,
      defaultValue: LeaveStatus.PENDING,
    })
    status: LeaveStatus;
  
    @Column({
      type: DataType.TEXT,
      allowNull: false,
    })
    reason: string;
  
    @Column({
      type: DataType.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Array of attachment metadata',
    })
    attachments?: any[];
  
    @Column({
      type: DataType.DATE,
      allowNull: false,
      defaultValue: DataType.NOW,
    })
    requestedAt: Date;
  
    @Column({
      type: DataType.DATE,
      allowNull: true,
    })
    decidedAt?: Date;
  
    @ForeignKey(() => User)
    @Column({
      type: DataType.UUID,
      allowNull: true,
    })
    decidedBy?: string;
  
    @Column({
      type: DataType.TEXT,
      allowNull: true,
    })
    decisionNote?: string;
  
    // Associations
    @BelongsTo(() => Caregiver)
    caregiver: Caregiver;
  
    @BelongsTo(() => Location)
    location: Location;
  
    @BelongsTo(() => User, 'decidedBy')
    decidedByUser: User;
  }