import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CareReceiversController } from './care-receiver.controller';
import { CareReceiversService } from './care-receiver.service';
import { CareReceiver } from '../../database/models/care-receiver.model.';
import { Location } from '../../database/models/location.model';
import { RoomBed } from '../../database/models/room-bed.model';
import { AuditLog } from '../../database/models/audit-log.model';

@Module({
  imports: [
    SequelizeModule.forFeature([CareReceiver, Location, RoomBed, AuditLog]),
  ],
  controllers: [CareReceiversController],
  providers: [CareReceiversService],
  exports: [CareReceiversService],
})
export class PatientsModule {}