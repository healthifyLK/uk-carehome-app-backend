import { IsString, IsDate, IsOptional, IsEnum, IsArray, IsUUID, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum CareLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum PatientStatus {
  ACTIVE = 'ACTIVE',
  DISCHARGED = 'DISCHARGED',
  DECEASED = 'DECEASED',
  TRANSFERRED = 'TRANSFERRED'
}

export class EmergencyContactDto {
  @IsString()
  name: string;

  @IsString()
  relationship: string;

  @IsString()
  phoneNumber: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsBoolean()
  isPrimaryContact: boolean;
}

export class GdpConsentDto {
  @IsBoolean()
  dataProcessing: boolean;

  @IsBoolean()
  healthDataSharing: boolean;

  @IsBoolean()
  emergencyContactSharing: boolean;

  @IsBoolean()
  researchParticipation: boolean;

  @IsBoolean()
  marketingCommunications: boolean;

  @IsString()
  consentGivenBy: string; // Name of person giving consent

  @IsString()
  @IsOptional()
  relationshipToPatient?: string;

  @IsBoolean()
  hasLegalAuthority: boolean;
}

export class PatientRegistrationDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsDate()
  @Type(() => Date)
  dateOfBirth: Date;

  @IsString()
  @IsOptional()
  nhsNumber?: string;

  @IsUUID()
  locationId: string;

  @IsUUID()
  @IsOptional()
  currentRoomBedId?: string;

  @IsEnum(CareLevel)
  @IsOptional()
  careLevel?: CareLevel;

  @IsString()
  @IsOptional()
  medicalHistory?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmergencyContactDto)
  emergencyContacts: EmergencyContactDto[];

  @IsString()
  @IsOptional()
  wearableDeviceId?: string;

  @ValidateNested()
  @Type(() => GdpConsentDto)
  gdprConsent: GdpConsentDto;

  @IsString()
  @IsOptional()
  notes?: string;
}