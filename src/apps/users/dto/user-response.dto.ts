import { Expose } from 'class-transformer';

export class UserResponseDto {
  @Expose() id: string;
  @Expose() firstName: string;
  @Expose() lastName: string;
  @Expose() email: string;
  @Expose() role: string;
  @Expose() status: string;
  @Expose() locationId?: string;
  @Expose() phoneNumber?: string;
  @Expose() lastLoginAt?: Date;
  @Expose() createdAt: Date;
  @Expose() updatedAt: Date;
}