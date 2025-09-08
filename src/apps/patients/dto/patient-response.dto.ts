import { Exclude, Expose } from 'class-transformer';

export class PatientResponseDto {
  @Expose()
  id: string;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  dateOfBirth: Date;

  @Expose()
  nhsNumber?: string;

  @Expose()
  locationId: string;

  @Expose()
  currentRoomBedId?: string;

  @Expose()
  careLevel: string;

  @Exclude()
  medicalHistory?: string;

  @Expose()
  emergencyContacts: any[];

  @Expose()
  admissionDate?: Date;

  @Expose()
  dischargeDate?: Date;

  @Expose()
  status: string;

  @Expose()
  wearableDeviceId?: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}