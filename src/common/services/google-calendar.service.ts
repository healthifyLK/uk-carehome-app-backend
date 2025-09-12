import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';

@Injectable()
export class GoogleCalendarService {
  private readonly logger = new Logger(GoogleCalendarService.name);
  private calendar: any;
  private isConfigured = false;

  constructor(private configService: ConfigService) {
    this.initializeCalendar();
  }

  private initializeCalendar() {
    const keyFile = this.configService.get<string>('GOOGLE_CREDENTIALS_PATH') || process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const subject = this.configService.get<string>('GOOGLE_IMPERSONATE_SUBJECT');
    const scopes = ['https://www.googleapis.com/auth/calendar'];

    try {
      let client_email: string | undefined;
      let private_key: string | undefined;

      if (keyFile && fs.existsSync(keyFile)) {
        const raw = JSON.parse(fs.readFileSync(keyFile, 'utf8'));
        client_email = raw.client_email;
        private_key = raw.private_key;
      } else {
        client_email = this.configService.get<string>('GOOGLE_CLIENT_EMAIL');
        private_key = this.configService.get<string>('GOOGLE_PRIVATE_KEY')?.replace(/\\n/g, '\n');
      }

      if (!client_email || !private_key || !subject) {
        this.logger.warn('Missing GOOGLE_CREDENTIALS_PATH/CLIENT_EMAIL/PRIVATE_KEY or GOOGLE_IMPERSONATE_SUBJECT.');
        return;
      }

      const jwt = new google.auth.JWT({
        email: client_email,
        key: private_key,
        scopes,
        subject, // DWD impersonation
      });

      this.calendar = google.calendar({ version: 'v3', auth: jwt });
      this.isConfigured = true;
      this.logger.log(`Google Calendar initialized with DWD for subject: ${subject}`);
    } catch (err: any) {
      this.logger.error('Failed to initialize Google Calendar:', err?.message || err);
    }
  }

  async createEvent(eventData: {
    summary: string;
    start: { dateTime: string; timeZone: string };
    end: { dateTime: string; timeZone: string };
    description?: string;
    attendees?: { email: string }[];
    location?: string;
  }): Promise<string> {
    if (!this.isConfigured) {
      this.logger.warn('Google Calendar not configured. Skipping event creation.');
      return 'mock-event-id-' + Date.now();
    }
    const calendarId = this.configService.get<string>('GOOGLE_CALENDAR_ID') || 'primary';
    const res = await this.calendar.events.insert({
      calendarId,
      resource: eventData,
    });
    return res.data.id as string;
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