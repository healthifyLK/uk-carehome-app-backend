import { IsEnum } from 'class-validator';
import { UserStatus } from '../../../database/models/user.model';

export class UpdateStatusDto {
  @IsEnum(UserStatus) status: UserStatus;
}