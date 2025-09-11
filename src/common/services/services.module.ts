import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GoogleCalendarService } from './google-calendar.service';
import { NotificationService } from './notification.service';

@Module({
  imports: [ConfigModule],
  providers: [GoogleCalendarService, NotificationService],
  exports: [GoogleCalendarService, NotificationService],
})
export class ServicesModule {}