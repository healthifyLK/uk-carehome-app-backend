import { 
  IsString, 
  IsDate, 
  IsOptional, 
  IsEnum, 
  IsArray, 
  IsUUID, 
  IsBoolean, 
  ValidateNested, 
  IsNumber,
  IsObject
} from 'class-validator';
import { Type } from 'class-transformer';
import { 
  Gender, 
  CareLevel, 
  CareReceiverStatus, 
  MobilityLevel, 
  MentalCapacityLevel, 
  FundingSource 
} from '../../../database/models/care-receiver.model.';

export class MedicationDto {
  @IsString()
  drug: string;

  @IsString()
  dose: string;

  @IsString()
  interval: string;

  @IsString()
  @IsOptional()
  instructions?: string;
}

export class AllergyDto {
  @IsString()
  allergen: string;

  @IsString()
  reaction: string;

  @IsString()
  @IsOptional()
  severity?: string;
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

  @IsString()
  @IsOptional()
  address?: string;
}

export class LegalGuardianDto {
  @IsString()
  name: string;

  @IsString()
  relationship: string;

  @IsString()
  phoneNumber: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  legalDocumentType?: string;

  @IsString()
  @IsOptional()
  legalDocumentNumber?: string;
}

export class GpDetailsDto {
  @IsString()
  name: string;

  @IsString()
  practiceName: string;

  @IsString()
  phoneNumber: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  address?: string;
}

export class AccessibilityNeedDto {
  @IsString()
  need: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isCritical?: boolean;
}

export class SpecialEquipmentDto {
  @IsString()
  equipment: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  supplier?: string;
}

export class WearableDevicePreferenceDto {
  @IsString()
  @IsOptional()
  deviceType?: string;

  @IsBoolean()
  @IsOptional()
  enableHealthMonitoring?: boolean;

  @IsBoolean()
  @IsOptional()
  enableLocationTracking?: boolean;

  @IsBoolean()
  @IsOptional()
  enableFallDetection?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  alertPreferences?: string[];
}

export class DataSharingPermissionDto {
  @IsBoolean()
  shareWithNHS: boolean;

  @IsBoolean()
  shareWithFamily: boolean;

  @IsBoolean()
  shareWithCareTeam: boolean;

  @IsBoolean()
  shareForResearch: boolean;

  @IsBoolean()
  shareWithEmergencyServices: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  additionalPermissions?: string[];
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
  consentGivenBy: string;

  @IsString()
  @IsOptional()
  relationshipToCareReceiver?: string;

  @IsBoolean()
  hasLegalAuthority: boolean;

  @IsObject()
  @IsOptional()
  dataSharingPermissions?: DataSharingPermissionDto;
}

export class CareReceiverRegistrationDto {
  // Personal Information
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsDate()
  @Type(() => Date)
  dateOfBirth: Date;

  @IsEnum(Gender)
  gender: Gender;

  @IsString()
  @IsOptional()
  medicalRecordNumber?: string;

  @IsString()
  presentAddress: string;

  @IsString()
  @IsOptional()
  nationality?: string;

  // Medical Information
  @IsString()
  @IsOptional()
  medicalHistory?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicationDto)
  @IsOptional()
  currentMedications?: MedicationDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AllergyDto)
  @IsOptional()
  allergies?: AllergyDto[];

  @IsEnum(MobilityLevel)
  @IsOptional()
  mobilityLevel?: MobilityLevel;

  @IsEnum(MentalCapacityLevel)
  @IsOptional()
  mentalCapacityLevel?: MentalCapacityLevel;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  mentalHealthIllnesses?: string[];

  @IsBoolean()
  dnrStatus: boolean;

  @ValidateNested()
  @Type(() => GpDetailsDto)
  @IsOptional()
  gpDetails?: GpDetailsDto;

  // Care Home Placement
  @IsEnum(CareLevel)
  careLevel: CareLevel;

  @IsUUID()
  locationId: string;

  @IsUUID()
  @IsOptional()
  currentRoomBedId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AccessibilityNeedDto)
  @IsOptional()
  accessibilityNeeds?: AccessibilityNeedDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpecialEquipmentDto)
  @IsOptional()
  specialEquipmentRequirements?: SpecialEquipmentDto[];

  // Emergency Contacts
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmergencyContactDto)
  emergencyContacts: EmergencyContactDto[];

  @ValidateNested()
  @Type(() => LegalGuardianDto)
  @IsOptional()
  legalGuardianDetails?: LegalGuardianDto;

  // Wearable Device Preferences
  @ValidateNested()
  @Type(() => WearableDevicePreferenceDto)
  @IsOptional()
  wearableDevicePreferences?: WearableDevicePreferenceDto;

  @IsBoolean()
  healthMonitoringConsent: boolean;

  @ValidateNested()
  @Type(() => DataSharingPermissionDto)
  @IsOptional()
  dataSharingPermissions?: DataSharingPermissionDto;

  // Care Information
  @IsString()
  @IsOptional()
  reasonForAdmission?: string;

  @IsNumber()
  @IsOptional()
  expectedLengthOfStay?: number;

  @IsEnum(FundingSource)
  @IsOptional()
  fundingSource?: FundingSource;

  @IsString()
  @IsOptional()
  carePlanSummary?: string;

  @ValidateNested()
  @Type(() => GdpConsentDto)
  gdprConsent: GdpConsentDto;

  @IsString()
  @IsOptional()
  notes?: string;
}