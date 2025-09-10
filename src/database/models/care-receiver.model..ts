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

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
  PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY'
}

export enum CareLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum CareReceiverStatus {
  ACTIVE = 'ACTIVE',
  DISCHARGED = 'DISCHARGED',
  DECEASED = 'DECEASED',
  TRANSFERRED = 'TRANSFERRED'
}

export enum MobilityLevel {
  INDEPENDENT = 'INDEPENDENT',
  ASSISTED_WALKING = 'ASSISTED_WALKING',
  WHEELCHAIR_BOUND = 'WHEELCHAIR_BOUND',
  BED_BOUND = 'BED_BOUND'
}

export enum MentalCapacityLevel {
  FULL_CAPACITY = 'FULL_CAPACITY',
  PARTIAL_CAPACITY = 'PARTIAL_CAPACITY',
  LIMITED_CAPACITY = 'LIMITED_CAPACITY',
  NO_CAPACITY = 'NO_CAPACITY'
}

export enum FundingSource {
  NHS = 'NHS',
  PRIVATE = 'PRIVATE',
  SOCIAL_SERVICES = 'SOCIAL_SERVICES',
  INSURANCE = 'INSURANCE',
  SELF_FUNDED = 'SELF_FUNDED'
}

@DefaultScope(() => ({
  attributes: { 
    exclude: [
      'medicalRecordNumber', 
      'medicalHistory', 
      'currentMedications',
      'allergies',
      'emergencyContacts',
      'gpDetails',
      'legalGuardianDetails',
      'carePlanSummary',
      'incidentReports',
      'healthMetrics',
      'communicationLog'
    ] 
  },
}))
@Table({
  tableName: 'care_receivers',
  indexes: [
    { fields: ['location_id'] },
    { fields: ['current_room_bed_id'] },
    { fields: ['medical_record_number'], unique: true },
    { fields: ['care_level'] },
    { fields: ['status'] },
    { fields: ['admission_date'] },
  ],
})
export class CareReceiver extends BaseModel<CareReceiver> {
  // Personal Information
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
    type: DataType.ENUM(...Object.values(Gender)),
    allowNull: false,
  })
  gender: Gender;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    unique: true,
    comment: 'Encrypted medical record number',
    get() {
      const value = this.getDataValue('medicalRecordNumber');
      return value ? decryptField(value) : null;
    },
    set(value: string) {
      this.setDataValue('medicalRecordNumber', value ? encryptField(value) : null);
    },
  })
  medicalRecordNumber?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    comment: 'Present address',
  })
  presentAddress: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  nationality?: string;

  // Medical Information
  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: 'Encrypted medical & surgical history',
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
    allowNull: true,
    defaultValue: [],
    comment: 'Encrypted current medications list',
    get() {
      const value = this.getDataValue('currentMedications');
      return value ? JSON.parse(decryptField(value)) : [];
    },
    set(value: any[]) {
      this.setDataValue(
        'currentMedications',
        value ? encryptField(JSON.stringify(value)) : null
      );
    },
  })
  currentMedications?: any[];

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: [],
    comment: 'Encrypted allergies and dietary restrictions',
    get() {
      const value = this.getDataValue('allergies');
      return value ? JSON.parse(decryptField(value)) : [];
    },
    set(value: any[]) {
      this.setDataValue(
        'allergies',
        value ? encryptField(JSON.stringify(value)) : null
      );
    },
  })
  allergies?: any[];

  @Column({
    type: DataType.ENUM(...Object.values(MobilityLevel)),
    allowNull: true,
    defaultValue: MobilityLevel.INDEPENDENT,
  })
  mobilityLevel?: MobilityLevel;

  @Column({
    type: DataType.ENUM(...Object.values(MentalCapacityLevel)),
    allowNull: true,
    defaultValue: MentalCapacityLevel.FULL_CAPACITY,
  })
  mentalCapacityLevel?: MentalCapacityLevel;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    comment: 'Encrypted mental health illnesses',
    get() {
      const value = this.getDataValue('mentalHealthIllnesses');
      return value ? JSON.parse(decryptField(value)) : [];
    },
    set(value: any[]) {
      this.setDataValue(
        'mentalHealthIllnesses',
        value ? encryptField(JSON.stringify(value)) : null
      );
    },
  })
  mentalHealthIllnesses?: any[];

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Do Not Resuscitate status',
  })
  dnrStatus: boolean;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    comment: 'Encrypted GP details',
    get() {
      const value = this.getDataValue('gpDetails');
      return value ? JSON.parse(decryptField(value)) : null;
    },
    set(value: any) {
      this.setDataValue(
        'gpDetails',
        value ? encryptField(JSON.stringify(value)) : null
      );
    },
  })
  gpDetails?: any;

  // Care Home Placement
  @Column({
    type: DataType.ENUM(...Object.values(CareLevel)),
    allowNull: false,
    defaultValue: CareLevel.MEDIUM,
  })
  careLevel: CareLevel;

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
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: [],
    comment: 'Accessibility needs and special equipment requirements',
  })
  accessibilityNeeds?: any[];

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: [],
    comment: 'Special equipment requirements and other needs',
  })
  specialEquipmentRequirements?: any[];

  // Emergency Contacts
  @Column({
    type: DataType.JSONB,
    allowNull: false,
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
    type: DataType.JSONB,
    allowNull: true,
    comment: 'Encrypted legal guardian/Power of Attorney details',
    get() {
      const value = this.getDataValue('legalGuardianDetails');
      return value ? JSON.parse(decryptField(value)) : null;
    },
    set(value: any) {
      this.setDataValue(
        'legalGuardianDetails',
        value ? encryptField(JSON.stringify(value)) : null
      );
    },
  })
  legalGuardianDetails?: any;

  // Wearable Device Preferences
  @Column({
    type: DataType.JSONB,
    allowNull: true,
    comment: 'Wearable device preferences and settings',
  })
  wearableDevicePreferences?: any;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Health monitoring consent',
  })
  healthMonitoringConsent: boolean;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    comment: 'Data sharing permissions',
  })
  dataSharingPermissions?: any;

  // Care Information
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
    type: DataType.TEXT,
    allowNull: true,
    comment: 'Reason for admission',
  })
  reasonForAdmission?: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: 'Expected length of stay in days',
  })
  expectedLengthOfStay?: number;

  @Column({
    type: DataType.ENUM(...Object.values(FundingSource)),
    allowNull: true,
  })
  fundingSource?: FundingSource;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: 'Encrypted care plan summary',
    get() {
      const value = this.getDataValue('carePlanSummary');
      return value ? decryptField(value) : null;
    },
    set(value: string) {
      this.setDataValue('carePlanSummary', value ? encryptField(value) : null);
    },
  })
  carePlanSummary?: string;

  @Column({
    type: DataType.ENUM(...Object.values(CareReceiverStatus)),
    allowNull: false,
    defaultValue: CareReceiverStatus.ACTIVE,
  })
  status: CareReceiverStatus;

  // Health Monitoring
  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment: 'Wearable device ID for health monitoring',
  })
  wearableDeviceId?: string;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    comment: 'Recent vital signs and health metrics',
  })
  healthMetrics?: any;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    comment: 'Recent health alerts and trends',
  })
  healthAlerts?: any;

  // Care Activities
  @Column({
    type: DataType.JSONB,
    allowNull: true,
    comment: 'Recent care logs and activities',
  })
  careLogs?: any;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    comment: 'Meal and diet plan',
  })
  mealDietPlan?: any;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    comment: 'Incident reports',
  })
  incidentReports?: any;

  // Communication
  @Column({
    type: DataType.JSONB,
    allowNull: true,
    comment: 'Recent communications log',
  })
  communicationLog?: any;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    comment: 'Care plan meeting notes',
  })
  carePlanMeetingNotes?: any;

  // Technology Integration
  @Column({
    type: DataType.JSONB,
    allowNull: true,
    comment: 'Connected wearable devices information',
  })
  connectedWearableDevices?: any;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    comment: 'Health data sync information',
  })
  healthDataSyncInfo?: any;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    comment: 'Alert thresholds and configurations',
  })
  alertThresholds?: any;

  // GDPR Compliance
  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: {},
    comment: 'GDPR consent tracking history',
  })
  consentHistory: object;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
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