import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AdminManagementService } from './admin-management.service';
import { PasswordGeneratorUtil } from 'src/common/utils/password-generator.util';
import { NotificationService } from 'src/common/services';
import { User } from '../../database/models/user.model';
import { Location } from '../../database/models/location.model';
import { AuditLog } from '../../database/models/audit-log.model';
import { Caregiver } from 'src/database/models/caregiver.model';

@Module({
  imports: [SequelizeModule.forFeature([User, Location, AuditLog, Caregiver])],
  controllers: [UsersController],
  providers: [
    UsersService,
    AdminManagementService,
    PasswordGeneratorUtil,
    NotificationService,
  ],
  exports: [UsersService, AdminManagementService],
})
export class UsersModule {}
