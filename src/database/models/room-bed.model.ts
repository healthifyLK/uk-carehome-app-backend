import {
  Table,
  Column,
  DataType,
  BelongsTo,
  ForeignKey,
  HasMany,
  BeforeValidate,
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
    validate: {
      is: /^CH[0-9A-Za-z]+[A-Z]$/,
    },
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

  @BeforeValidate
  static formatBedNumber(instance: RoomBed) {
    if (!instance.roomNumber) return;
    const current = (instance.bedNumber || '').trim();
    const expectedPrefix = `CH${instance.roomNumber}`;
    // Already matches CH + roomNumber + Letter
    if (/^CH[0-9A-Za-z]+[A-Z]$/.test(current)) return;
    // If only a single letter given
    if (/^[A-Za-z]$/.test(current)) {
      instance.bedNumber = `${expectedPrefix}${current.toUpperCase()}`;
      return;
    }
    // Derive a letter from the last character, else default to A
    const lastChar = current.slice(-1);
    const letter = /[A-Za-z]/.test(lastChar) ? lastChar.toUpperCase() : 'A';
    instance.bedNumber = `${expectedPrefix}${letter}`;
  }
}