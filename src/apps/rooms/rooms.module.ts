import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { RoomBedsController } from './rooms.controller';
import { RoomBedsService } from './rooms.service';
import { RoomBed } from '../../database/models/room-bed.model';
import { Location } from '../../database/models/location.model';
import { CareReceiver } from '../../database/models/care-receiver.model';
import { AuditLog } from '../../database/models/audit-log.model';

@Module({
  imports: [SequelizeModule.forFeature([RoomBed, Location,CareReceiver,AuditLog])],
  controllers: [RoomBedsController],
  providers: [RoomBedsService],
  exports: [RoomBedsService],
})
export class RoomBedsModule {}