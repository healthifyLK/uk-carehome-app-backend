import {
    Table,
    Column,
    DataType,
    HasMany,
    ForeignKey,
    BelongsTo,
  } from 'sequelize-typescript';
  import { BaseModel } from './base.model';
  import { Location } from './location.model';
  import { Assignment } from './assignment.model';
  
  @Table({
    tableName: 'schedules',
    indexes: [
      { fields: ['location_id'] },
      { fields: ['shift_date'] },
      { fields: ['shift_type'] },
    ],
  })
  export class Schedule extends BaseModel<Schedule> {
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
    shiftDate: Date;
  
    @Column({
      type: DataType.ENUM('MORNING', 'AFTERNOON', 'NIGHT', 'FULL_DAY'),
      allowNull: false,
    })
    shiftType: string;
  
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
      type: DataType.STRING,
      allowNull: true,
      comment: 'Google Calendar Event ID',
    })
    googleCalendarEventId?: string;
  
    @Column({
      type: DataType.JSONB,
      defaultValue: {},
      comment: 'Additional schedule metadata',
    })
    metadata: object;
  
    // Associations
    @BelongsTo(() => Location)
    location: Location;
  
    @HasMany(() => Assignment)
    assignments: Assignment[];
  }