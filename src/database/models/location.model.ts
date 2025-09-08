import {
  Table,
  Column,
  DataType,
  HasMany,
  Scopes,
} from 'sequelize-typescript';
import { BaseModel } from './base.model';
import { User } from './user.model';
import { Patient } from './patient.model';
import { RoomBed } from './room-bed.model';
import { fn, col } from 'sequelize';

@Scopes(() => ({
  withStats: {
    include: [
      {
        model: User,
        attributes: [],
      },
      {
        model: Patient,
        attributes: [],
      },
    ],
    attributes: {
      include: [
        [fn('COUNT', col('users.id')), 'userCount'],
        [fn('COUNT', col('patients.id')), 'patientCount'],
      ],
    },
    group: ['Location.id'],
  },
}))
@Table({
  tableName: 'locations',
  indexes: [
    { fields: ['name'] },
    { fields: ['is_active'] },
  ],
})
export class Location extends BaseModel<Location> {
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  address: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  city: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  postcode: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  phoneNumber: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    validate: {
      isEmail: true,
    },
  })
  email: string;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  capacity: number;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  isActive: boolean;

  @Column({
    type: DataType.JSONB,
    defaultValue: {},
    comment: 'Additional settings per location',
  })
  settings: object;

  // Associations
  @HasMany(() => User)
  users: User[];

  @HasMany(() => Patient)
  patients: Patient[];

  @HasMany(() => RoomBed)
  roomBeds: RoomBed[];
}