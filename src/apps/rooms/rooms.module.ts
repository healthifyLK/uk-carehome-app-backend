import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { RoomBedsController } from './rooms.controller';
import { RoomBedsService } from './rooms.service';
import { RoomBed } from '../../database/models/room-bed.model';
import { Location } from '../../database/models/location.model';

@Module({
  imports: [SequelizeModule.forFeature([RoomBed, Location])],
  controllers: [RoomBedsController],
  providers: [RoomBedsService],
  exports: [RoomBedsService],
})
export class RoomBedsModule {}