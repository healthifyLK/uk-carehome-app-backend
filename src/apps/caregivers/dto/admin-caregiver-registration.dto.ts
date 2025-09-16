// src/apps/caregivers/dto/admin-caregiver-registration.dto.ts
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
    IsObject,
    IsEmail,
    MinLength,
    MaxLength
  } from 'class-validator';
  import { Type } from 'class-transformer';
  import { 
    Gender, 
    EmploymentType, 
    ShiftPreference, 
    QualificationLevel 
  } from '../../../database/models/caregiver.model';
  
  export class AddressDto {
    @IsString()
    street: string;
  
    @IsString()
    city: string;
  
    @IsString()
    county: string;
  
    @IsString()
    postcode: string;
  
    @IsString()
    country: string;
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
  
    @IsString()
    @IsOptional()
    address?: string;
  }
  
  export class RightToWorkDocumentDto {
    @IsString()
    documentType: string;
  
    @IsString()
    documentNumber: string;
  
    @IsDate()
    @Type(() => Date)
    expiryDate: Date;
  
    @IsString()
    @IsOptional()
    issuingAuthority?: string;
  
    @IsString()
    @IsOptional()
    notes?: string;
  }
  
  export class CertificationDto {
    @IsString()
    name: string;
  
    @IsString()
    issuingBody: string;
  
    @IsDate()
    @Type(() => Date)
    issueDate: Date;
  
    @IsDate()
    @Type(() => Date)
    expiryDate: Date;
  
    @IsString()
    @IsOptional()
    certificateNumber?: string;
  }
  
  export class GdpConsentDto {
    @IsBoolean()
    dataProcessing: boolean;
  
    @IsBoolean()
    employmentDataSharing: boolean;
  
    @IsBoolean()
    emergencyContactSharing: boolean;
  
    @IsBoolean()
    backgroundCheckConsent: boolean;
  
    @IsBoolean()
    trainingRecordSharing: boolean;
  
    @IsString()
    consentGivenBy: string;
  
    @IsBoolean()
    hasLegalAuthority: boolean;
  }
  
  export class AdminCaregiverRegistrationDto {
    // Personal Information
    @IsString()
    @MinLength(2)
    @MaxLength(50)
    firstName: string;
  
    @IsString()
    @MinLength(2)
    @MaxLength(50)
    lastName: string;
  
    @IsEmail()
    email: string;
  
    @IsString()
    @MinLength(8)
    @MaxLength(100)
    password: string;
  
    @IsString()
    phoneNumber: string;
  
    @IsDate()
    @Type(() => Date)
    dateOfBirth: Date;
  
    @IsEnum(Gender)
    gender: Gender;
  
    @ValidateNested()
    @Type(() => AddressDto)
    homeAddress: AddressDto;
  
    // Employment Information
    @IsString()
    @IsOptional()
    employeeId?: string;
  
    @IsUUID()
    locationId: string;
  
    @IsDate()
    @Type(() => Date)
    startDate: Date;
  
    @IsEnum(EmploymentType)
    employmentType: EmploymentType;
  
    @IsEnum(ShiftPreference)
    shiftPreference: ShiftPreference;
  
    @IsArray()
    @IsUUID('all', { each: true })
    @IsOptional()
    additionalLocationAssignments?: string[];
  
    // Professional Qualifications
    @IsEnum(QualificationLevel)
    qualificationLevel: QualificationLevel;
  
    @IsNumber()
    @IsOptional()
    yearsOfExperience?: number;
  
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    specializations?: string[];
  
    @IsBoolean()
    firstAidCprCertified: boolean;
  
    @IsDate()
    @Type(() => Date)
    @IsOptional()
    firstAidCprExpiry?: Date;
  
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CertificationDto)
    @IsOptional()
    additionalCertifications?: CertificationDto[];
  
    // Security & Compliance
    @ValidateNested()
    @IsOptional()
    @Type(() => RightToWorkDocumentDto)
    rightToWorkDocument?: RightToWorkDocumentDto;
  
    @ValidateNested()
    @Type(() => EmergencyContactDto)
    emergencyContact: EmergencyContactDto;
  
    @ValidateNested()
    @Type(() => GdpConsentDto)
    gdprConsent: GdpConsentDto;
  
    @IsString()
    @IsOptional()
    notes?: string;
  }