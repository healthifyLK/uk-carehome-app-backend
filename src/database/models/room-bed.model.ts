import {
    Table,
    Column,
    DataType,
    BelongsTo,
    ForeignKey,
    HasMany,
  } from 'sequelize-typescript';
  import { BaseModel } from './base.model';
  import { Location } from './location.model';
  import { CareReceiver } from './care-receiver.model.';
  
  @Table({
    tableName: 'room_beds',
    indexes: [
      { fields: ['location_id'] },
      { fields: ['room_number', 'bed_number'], unique: true },
      { fields: ['is_occupied'] },
    ],
  })
  export class RoomBed extends BaseModel<RoomBed> {
    @Column({
      type: DataType.STRING,
      allowNull: false,
    })
    roomNumber: string;
  
    @Column({
      type: DataType.STRING,
      allowNull: false,
    })
    bedNumber: string;
  
    @ForeignKey(() => Location)
    @Column({
      type: DataType.UUID,
      allowNull: false,
    })
    locationId: string;
  
    @Column({
      type: DataType.BOOLEAN,
      defaultValue: false,
    })
    isOccupied: boolean;
  
    @Column({
      type: DataType.STRING,
      allowNull: true,
    })
    floor?: string;
  
    @Column({
      type: DataType.STRING,
      allowNull: true,
    })
    wing?: string;
  
    @Column({
      type: DataType.JSONB,
      defaultValue: {},
      comment: 'Additional room/bed features',
    })
    features: object;
  
    // Associations
    @BelongsTo(() => Location)
    location: Location;
  
    @HasMany(() => CareReceiver, 'currentRoomBedId')
    currentPatients: CareReceiver[];
  }