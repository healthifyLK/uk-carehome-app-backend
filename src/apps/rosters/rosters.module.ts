import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { RostersController } from './rosters.controller';
import { RostersService } from './rosters.service';
import { Roster } from '../../database/models/roster.model';
import { Caregiver } from '../../database/models/caregiver.model';
import { Location } from '../../database/models/location.model';
import { RoomBed } from '../../database/models/room-bed.model';
import { AuditLog } from '../../database/models/audit-log.model';
import { ServicesModule } from '../../common/services/services.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Roster, Caregiver, Location, RoomBed, AuditLog]),
    ServicesModule, // Import the shared services module
  ],
  controllers: [RostersController],
  providers: [RostersService],
  exports: [RostersService],
})
export class RostersModule {}