import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './apps/auth/auth.module';
import { PatientsModule } from './apps/patients/care-receiver.module';
import { AuditModule } from './apps/audit/audit.module';
import { LocationsModule } from './apps/locations/locations.module';
import { RoomBedsModule } from './apps/rooms/rooms.module';
import databaseConfig from './config/database.config';
import { UsersModule } from './apps/users/users.module';
import { CaregiversModule } from './apps/caregivers/caregivers.module';
import { RostersModule } from './apps/rosters/rosters.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    DatabaseModule,
    AuthModule,
    PatientsModule,
    AuditModule,
    LocationsModule,
    RoomBedsModule,
    UsersModule,
    CaregiversModule,
    RostersModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}