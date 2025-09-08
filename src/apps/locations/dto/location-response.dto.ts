import { Expose, Type } from 'class-transformer';

export class LocationStatsDto {
  @Expose()
  userCount: number;

  @Expose()
  patientCount: number;
}

export class LocationResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  address: string;

  @Expose()
  city?: string;

  @Expose()
  postcode?: string;

  @Expose()
  phoneNumber?: string;

  @Expose()
  email?: string;

  @Expose()
  capacity: number;

  @Expose()
  isActive: boolean;

  @Expose()
  settings: object;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  @Type(() => LocationStatsDto)
  stats?: LocationStatsDto;
}