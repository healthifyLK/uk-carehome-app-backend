import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CaregiversController } from './caregivers.controller';
import { CaregiversService } from './caregivers.service';
import { Caregiver } from '../../database/models/caregiver.model';
import { Location } from '../../database/models/location.model';
import { AuditLog } from '../../database/models/audit-log.model';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Caregiver, Location, AuditLog]),
    AuthModule
  ],
  controllers: [CaregiversController],
  providers: [CaregiversService],
  exports: [CaregiversService],
})
export class CaregiversModule {}