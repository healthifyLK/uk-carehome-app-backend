import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';
import { Patient } from '../../database/models/patient.model';
import { Location } from '../../database/models/location.model';
import { RoomBed } from '../../database/models/room-bed.model';
import { AuditLog } from '../../database/models/audit-log.model';

@Module({
  imports: [
    SequelizeModule.forFeature([Patient, Location, RoomBed, AuditLog]),
  ],
  controllers: [PatientsController],
  providers: [PatientsService],
  exports: [PatientsService],
})
export class PatientsModule {}