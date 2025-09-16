// Establish Database Connection
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from './models/user.model';
import { Location } from './models/location.model';
import { CareReceiver } from './models/care-receiver.model';
import { RoomBed } from './models/room-bed.model';
import { Assignment } from './models/assignment.model';
import { Schedule } from './models/schedule.model';
import { AuditLog } from './models/audit-log.model';
import { Caregiver } from './models/caregiver.model';
import { Roster } from './models/roster.model';
import { LeaveRequest } from './models/leave-request.model';

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        ...configService.get('database'),
        models: [User, Location, CareReceiver, RoomBed, Assignment, Schedule,AuditLog, Caregiver,Roster,LeaveRequest],
        autoLoadModels: true,
        synchronize: process.env.NODE_ENV === 'development',
        logging: false, // Fix the deprecation warning
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}