import {
    Table,
    Column,
    DataType,
    BelongsTo,
    ForeignKey,
    HasMany,
    DefaultScope,
    Scopes,
  } from 'sequelize-typescript';
  import { BaseModel } from './base.model';
  import { Location } from './location.model';
  import { Assignment } from './assignment.model';
  import { encryptField, decryptField } from '../../common/utils/encryption.utils';
  
  export enum Gender {
    MALE = 'MALE',
    FEMALE = 'FEMALE',
    OTHER = 'OTHER',
    PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY'
  }
  
  export enum EmploymentType {
    FULL_TIME = 'FULL_TIME',
    PART_TIME = 'PART_TIME',
    CONTRACT = 'CONTRACT',
    CASUAL = 'CASUAL'
  }
  
  export enum ShiftPreference {
    ANY = 'ANY',
    DAY = 'DAY',
    NIGHT = 'NIGHT',
    ROTATING = 'ROTATING'
  }
  
  export enum CaregiverStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    SUSPENDED = 'SUSPENDED',
    TERMINATED = 'TERMINATED',
    ON_LEAVE = 'ON_LEAVE'
  }
  
  export enum QualificationLevel {
    NONE = 'NONE',
    BASIC_CARE = 'BASIC_CARE',
    NVQ_LEVEL_2 = 'NVQ_LEVEL_2',
    NVQ_LEVEL_3 = 'NVQ_LEVEL_3',
    NVQ_LEVEL_4 = 'NVQ_LEVEL_4',
    NVQ_LEVEL_5 = 'NVQ_LEVEL_5',
    REGISTERED_NURSE = 'REGISTERED_NURSE',
    SENIOR_CARER = 'SENIOR_CARER'
  }
  
  @DefaultScope(() => ({
    attributes: { 
      exclude: [
        'password', 
        'totpSecret',
        'homeAddress',
        'emergencyContact',
        'rightToWorkDocument',
        'biometricData'
      ] 
    },
  }))
  @Scopes(() => ({
    withAuth: {
      attributes: { include: ['password', 'totpSecret'] },
    },
    withSensitiveData: {
      attributes: { 
        include: [
          'homeAddress',
          'emergencyContact',
          'rightToWorkDocument'
        ] 
      },
    },
  }))
  @Table({
    tableName: 'caregivers',
    indexes: [
      { fields: ['email'], unique: true },
      { fields: ['employee_id'], unique: true },
      { fields: ['location_id'] },
      { fields: ['employment_type'] },
      { fields: ['status'] },
      { fields: ['qualification_level'] },
    ],
  })
  export class Caregiver extends BaseModel<Caregiver> {
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
      type: DataType.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    })
    email: string;
  
    @Column({
      type: DataType.STRING,
      allowNull: false,
    })
    password: string;
  
    @Column({
      type: DataType.STRING,
      allowNull: false,
    })
    phoneNumber: string;
  
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
      type: DataType.JSONB,
      allowNull: false,
      comment: 'Encrypted home address',
      get() {
        const value = this.getDataValue('homeAddress');
        return value ? JSON.parse(decryptField(value)) : null;
      },
      set(value: any) {
        this.setDataValue('homeAddress', value ? encryptField(JSON.stringify(value)) : null);
      },
    })
    homeAddress: any;
  
    // Employment Information
    @Column({
      type: DataType.STRING,
      allowNull: false,
      unique: true,
      comment: 'Employee ID - can be custom or system generated',
    })
    employeeId: string;
  
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
    startDate: Date;
  
    @Column({
      type: DataType.ENUM(...Object.values(EmploymentType)),
      allowNull: false,
    })
    employmentType: EmploymentType;
  
    @Column({
      type: DataType.ENUM(...Object.values(ShiftPreference)),
      allowNull: false,
      defaultValue: ShiftPreference.ANY,
    })
    shiftPreference: ShiftPreference;
  
    @Column({
      type: DataType.JSONB,
      allowNull: true,
      comment: 'Additional location assignments for multi-location caregivers',
    })
    additionalLocationAssignments?: string[];
  
    // Professional Qualifications
    @Column({
      type: DataType.ENUM(...Object.values(QualificationLevel)),
      allowNull: false,
      defaultValue: QualificationLevel.BASIC_CARE,
    })
    qualificationLevel: QualificationLevel;
  
    @Column({
      type: DataType.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Years of experience in care',
    })
    yearsOfExperience: number;
  
    @Column({
      type: DataType.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Specializations (dementia care, palliative care, etc.)',
    })
    specializations?: string[];
  
    @Column({
      type: DataType.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'First Aid/CPR certification status',
    })
    firstAidCprCertified: boolean;
  
    @Column({
      type: DataType.DATE,
      allowNull: true,
      comment: 'First Aid/CPR certification expiry date',
    })
    firstAidCprExpiry?: Date;
  
    @Column({
      type: DataType.JSONB,
      allowNull: true,
      comment: 'Additional certifications and qualifications',
    })
    additionalCertifications?: any[];
  
    // Security & Compliance
    @Column({
      type: DataType.JSONB,
      allowNull: false,
      comment: 'Encrypted right to work documentation',
      get() {
        const value = this.getDataValue('rightToWorkDocument');
        return value ? JSON.parse(decryptField(value)) : null;
      },
      set(value: any) {
        this.setDataValue('rightToWorkDocument', value ? encryptField(JSON.stringify(value)) : null);
      },
    })
    rightToWorkDocument: any;
  
    @Column({
      type: DataType.JSONB,
      allowNull: false,
      comment: 'Encrypted emergency contact information',
      get() {
        const value = this.getDataValue('emergencyContact');
        return value ? JSON.parse(decryptField(value)) : null;
      },
      set(value: any) {
        this.setDataValue('emergencyContact', value ? encryptField(JSON.stringify(value)) : null);
      },
    })
    emergencyContact: any;
  
    // System Access
    @Column({
      type: DataType.STRING,
      allowNull: true,
      comment: 'TOTP secret for 2FA',
    })
    totpSecret?: string;
  
    @Column({
      type: DataType.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    })
    totpEnabled: boolean;
  
    @Column({
      type: DataType.JSONB,
      allowNull: true,
      comment: 'Biometric setup data (future implementation)',
    })
    biometricData?: any;
  
    @Column({
      type: DataType.ENUM(...Object.values(CaregiverStatus)),
      allowNull: false,
      defaultValue: CaregiverStatus.ACTIVE,
    })
    status: CaregiverStatus;
  
    @Column({
      type: DataType.DATE,
      allowNull: true,
    })
    lastLoginAt?: Date;
  
    @Column({
      type: DataType.JSONB,
      allowNull: false,
      defaultValue: {},
      comment: 'GDPR consent tracking',
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
  
    @HasMany(() => Assignment, 'caregiverId')
    assignments: Assignment[];
  
    // Methods
    async validatePassword(password: string): Promise<boolean> {
      const bcrypt = require('bcrypt');
      return bcrypt.compare(password, this.password);
    }
  
    getFullName(): string {
      return `${this.firstName} ${this.lastName}`;
    }
  
    isCertificationValid(): boolean {
      if (!this.firstAidCprCertified || !this.firstAidCprExpiry) {
        return false;
      }
      return new Date() < this.firstAidCprExpiry;
    }
  
    getYearsOfExperience(): number {
      const now = new Date();
      const startDate = new Date(this.startDate);
      const yearsDiff = now.getFullYear() - startDate.getFullYear();
      return Math.max(yearsDiff, this.yearsOfExperience);
    }
  }