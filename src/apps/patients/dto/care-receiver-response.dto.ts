import { Exclude, Expose } from 'class-transformer';
import { 
  Gender, 
  CareLevel, 
  CareReceiverStatus, 
  MobilityLevel, 
  MentalCapacityLevel, 
  FundingSource 
} from '../../../database/models/care-receiver.model.';

export class CareReceiverResponseDto {
  @Expose()
  id: string;

  // Personal Information
  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  dateOfBirth: Date;

  @Expose()
  gender: Gender;

  @Expose()
  medicalRecordNumber?: string;

  @Expose()
  presentAddress: string;

  @Expose()
  nationality?: string;

  // Medical Information
  @Exclude()
  medicalHistory?: string;

  @Exclude()
  currentMedications?: any[];

  @Exclude()
  allergies?: any[];

  @Expose()
  mobilityLevel?: MobilityLevel;

  @Expose()
  mentalCapacityLevel?: MentalCapacityLevel;

  @Exclude()
  mentalHealthIllnesses?: any[];

  @Expose()
  dnrStatus: boolean;

  @Exclude()
  gpDetails?: any;

  // Care Home Placement
  @Expose()
  careLevel: CareLevel;

  @Expose()
  locationId: string;

  @Expose()
  currentRoomBedId?: string;

  @Expose()
  accessibilityNeeds?: any[];

  @Expose()
  specialEquipmentRequirements?: any[];

  // Emergency Contacts
  @Expose()
  emergencyContacts: any[];

  @Exclude()
  legalGuardianDetails?: any;

  // Wearable Device Preferences
  @Expose()
  wearableDevicePreferences?: any;

  @Expose()
  healthMonitoringConsent: boolean;

  @Expose()
  dataSharingPermissions?: any;

  // Care Information
  @Expose()
  admissionDate?: Date;

  @Expose()
  dischargeDate?: Date;

  @Expose()
  reasonForAdmission?: string;

  @Expose()
  expectedLengthOfStay?: number;

  @Expose()
  fundingSource?: FundingSource;

  @Exclude()
  carePlanSummary?: string;

  @Expose()
  status: CareReceiverStatus;

  // Health Monitoring
  @Expose()
  wearableDeviceId?: string;

  @Expose()
  healthMetrics?: any;

  @Expose()
  healthAlerts?: any;

  // Care Activities
  @Expose()
  careLogs?: any;

  @Expose()
  mealDietPlan?: any;

  @Expose()
  incidentReports?: any;

  // Communication
  @Expose()
  communicationLog?: any;

  @Expose()
  carePlanMeetingNotes?: any;

  // Technology Integration
  @Expose()
  connectedWearableDevices?: any;

  @Expose()
  healthDataSyncInfo?: any;

  @Expose()
  alertThresholds?: any;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}