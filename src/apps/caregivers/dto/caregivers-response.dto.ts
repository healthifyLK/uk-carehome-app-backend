import { Exclude, Expose } from 'class-transformer';
import { 
  Gender, 
  EmploymentType, 
  ShiftPreference, 
  CaregiverStatus, 
  QualificationLevel 
} from '../../../database/models/caregiver.model';

export class CaregiverResponseDto {
  @Expose()
  id: string;

  // Personal Information
  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  email: string;

  @Expose()
  phoneNumber: string;

  @Expose()
  dateOfBirth: Date;

  @Expose()
  gender: Gender;

  @Exclude()
  homeAddress?: any;

  // Employment Information
  @Expose()
  employeeId: string;

  @Expose()
  locationId: string;

  @Expose()
  startDate: Date;

  @Expose()
  employmentType: EmploymentType;

  @Expose()
  shiftPreference: ShiftPreference;

  @Expose()
  additionalLocationAssignments?: string[];

  // Professional Qualifications
  @Expose()
  qualificationLevel: QualificationLevel;

  @Expose()
  yearsOfExperience: number;

  @Expose()
  specializations?: string[];

  @Expose()
  firstAidCprCertified: boolean;

  @Expose()
  firstAidCprExpiry?: Date;

  @Expose()
  additionalCertifications?: any[];

  // Security & Compliance
  @Exclude()
  rightToWorkDocument?: any;

  @Exclude()
  emergencyContact?: any;

  // System Access
  @Expose()
  totpEnabled: boolean;

  @Expose()
  status: CaregiverStatus;

  @Expose()
  lastLoginAt?: Date;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  // Computed fields
  @Expose()
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  @Expose()
  get isCertificationValid(): boolean {
    if (!this.firstAidCprCertified || !this.firstAidCprExpiry) {
      return false;
    }
    return new Date() < this.firstAidCprExpiry;
  }
}