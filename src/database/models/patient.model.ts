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
  import { RoomBed } from './room-bed.model';
  import { Assignment } from './assignment.model';
  import { encryptField, decryptField } from '../../common/utils/encryption.utils';
  
  @DefaultScope(() => ({
    attributes: { exclude: ['medicalHistory', 'emergencyContacts'] },
  }))
  @Table({
    tableName: 'patients',
    indexes: [
      { fields: ['location_id'] },
      { fields: ['current_room_bed_id'] },
      { fields: ['nhs_number'], unique: true },
    ],
  })
  export class Patient extends BaseModel<Patient> {
    @Column({
      type: DataType.STRING,
      allowNull: false,
    })
    firstName: string;
  
    @Column({
      type: DataType.STRING,
      allowNull: false,
    })
    lastName: string;
  
    @Column({
      type: DataType.DATE,
      allowNull: false,
    })
    dateOfBirth: Date;
  
    @Column({
      type: DataType.STRING,
      allowNull: true,
      unique: true,
      get() {
        const value = this.getDataValue('nhsNumber');
        return value ? decryptField(value) : null;
      },
      set(value: string) {
        this.setDataValue('nhsNumber', value ? encryptField(value) : null);
      },
    })
    nhsNumber?: string;
  
    @ForeignKey(() => Location)
    @Column({
      type: DataType.UUID,
      allowNull: false,
    })
    locationId: string;
  
    @ForeignKey(() => RoomBed)
    @Column({
      type: DataType.UUID,
      allowNull: true,
    })
    currentRoomBedId?: string;
  
    @Column({
      type: DataType.ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'),
      defaultValue: 'MEDIUM',
    })
    careLevel: string;
  
    @Column({
      type: DataType.TEXT,
      allowNull: true,
      comment: 'Encrypted medical history',
      get() {
        const value = this.getDataValue('medicalHistory');
        return value ? decryptField(value) : null;
      },
      set(value: string) {
        this.setDataValue('medicalHistory', value ? encryptField(value) : null);
      },
    })
    medicalHistory?: string;
  
    @Column({
      type: DataType.JSONB,
      defaultValue: [],
      comment: 'Encrypted emergency contacts',
      get() {
        const value = this.getDataValue('emergencyContacts');
        return value ? JSON.parse(decryptField(value)) : [];
      },
      set(value: any[]) {
        this.setDataValue(
          'emergencyContacts',
          value ? encryptField(JSON.stringify(value)) : null
        );
      },
    })
    emergencyContacts: any[];
  
    @Column({
      type: DataType.DATE,
      allowNull: true,
    })
    admissionDate?: Date;
  
    @Column({
      type: DataType.DATE,
      allowNull: true,
    })
    dischargeDate?: Date;
  
    @Column({
      type: DataType.ENUM('ACTIVE', 'DISCHARGED', 'DECEASED', 'TRANSFERRED'),
      defaultValue: 'ACTIVE',
    })
    status: string;
  
    @Column({
      type: DataType.STRING,
      allowNull: true,
      comment: 'Wearable device ID for health monitoring',
    })
    wearableDeviceId?: string;

    @Column({
      type: DataType.JSONB,
      defaultValue: {},
      comment: 'GDPR consent tracking history',
    })
    consentHistory: object;
    
    @Column({
      type: DataType.BOOLEAN,
      defaultValue: false,
      comment: 'Data deletion requested',
    })
    deletionRequested: boolean;
    
    @Column({
      type: DataType.DATE,
      allowNull: true,
      comment: 'Data deletion request date',
    })
    deletionRequestedAt?: Date;
    
    @Column({
      type: DataType.STRING,
      allowNull: true,
      comment: 'Data deletion request reason',
    })
    deletionRequestReason?: string;
  
    // Associations
    @BelongsTo(() => Location)
    location: Location;
  
    @BelongsTo(() => RoomBed)
    currentRoomBed: RoomBed;
  
    @HasMany(() => Assignment)
    assignments: Assignment[];
  }