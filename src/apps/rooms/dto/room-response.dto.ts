import { Expose } from 'class-transformer';

export class RoomBedResponseDto {
  @Expose()
  id: string;

  @Expose()
  roomNumber: string;

  @Expose()
  bedNumber: string;

  @Expose()
  locationId: string;

  @Expose()
  isOccupied: boolean;

  @Expose()
  floor?: string;

  @Expose()
  wing?: string;

  @Expose()
  features: object;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}