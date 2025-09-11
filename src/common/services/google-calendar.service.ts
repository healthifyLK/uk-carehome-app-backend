import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleCalendarService {
  private readonly logger = new Logger(GoogleCalendarService.name);
  private calendar: any;

  constructor(private configService: ConfigService) {
    this.initializeCalendar();
  }

  private initializeCalendar() {  
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: this.configService.get('GOOGLE_CLIENT_EMAIL'),
        private_key: this.configService.get('GOOGLE_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    this.calendar = google.calendar({ version: 'v3', auth });
  }

  async createEvent(eventData: {
    summary: string;
    description?: string;
    start: { dateTime: string; timeZone: string };
    end: { dateTime: string; timeZone: string };
    attendees?: { email: string }[];
    location?: string;
  }): Promise<string> {
    try {
      const calendarId = this.configService.get('GOOGLE_CALENDAR_ID');
      
      const response = await this.calendar.events.insert({
        calendarId,
        resource: {
          ...eventData, 
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'email', minutes: 24 * 60 }, // 24 hours before
              { method: 'popup', minutes: 60 }, // 1 hour before
            ],
          },
        },
      });

      this.logger.log(`Created Google Calendar event: ${response.data.id}`);
      return response.data.id;
    } catch (error) {
      this.logger.error('Failed to create Google Calendar event:', error);
      throw error;
    }
  }

  async updateEvent(eventId: string, eventData: any): Promise<void> {
    try {
      const calendarId = this.configService.get('GOOGLE_CALENDAR_ID');
      
      await this.calendar.events.update({
        calendarId,
        eventId,
        resource: eventData,
      });

      this.logger.log(`Updated Google Calendar event: ${eventId}`);
    } catch (error) {
      this.logger.error('Failed to update Google Calendar event:', error);
      throw error;
    }
  }

  async deleteEvent(eventId: string): Promise<void> {
    try {
      const calendarId = this.configService.get('GOOGLE_CALENDAR_ID');
      
      await this.calendar.events.delete({
        calendarId,
        eventId,
      });

      this.logger.log(`Deleted Google Calendar event: ${eventId}`);
    } catch (error) {
      this.logger.error('Failed to delete Google Calendar event:', error);
      throw error;
    }
  }

  async getEvents(startDate: string, endDate: string): Promise<any[]> {
    try {
      const calendarId = this.configService.get('GOOGLE_CALENDAR_ID');
      
      const response = await this.calendar.events.list({
        calendarId,
        timeMin: startDate,
        timeMax: endDate,
        singleEvents: true,
        orderBy: 'startTime',
      });

      return response.data.items || [];
    } catch (error) {
      this.logger.error('Failed to fetch Google Calendar events:', error);
      throw error;
    }
  }
}