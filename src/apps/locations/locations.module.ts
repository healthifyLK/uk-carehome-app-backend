import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';
import { Location } from '../../database/models/location.model';
import { User } from '../../database/models/user.model';
import { Patient } from '../../database/models/patient.model';
import { RoomBed } from '../../database/models/room-bed.model';
import { AuditLog } from '../../database/models/audit-log.model';

@Module({
  imports: [
    SequelizeModule.forFeature([Location, User, Patient, RoomBed, AuditLog]),
  ],
  controllers: [LocationsController],
  providers: [LocationsService],
  exports: [LocationsService],
})
export class LocationsModule {}