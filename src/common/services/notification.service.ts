import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      secure: false,
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  async sendShiftNotification(
    caregiverEmail: string,
    caregiverName: string,
    shiftData: {
      date: string;
      startTime: string;
      endTime: string;
      location: string;
      roomBed?: string;
    },
    type: 'SCHEDULED' | 'UPDATED' | 'CANCELLED'
  ): Promise<void> {
    try {
      const subject = this.getSubjectByType(type);
      const html = this.generateShiftEmailHTML(caregiverName, shiftData, type);

      await this.transporter.sendMail({
        from: this.configService.get('SMTP_FROM'),
        to: caregiverEmail,
        subject,
        html,
      });

      this.logger.log(`Sent ${type} notification to ${caregiverEmail}`);
    } catch (error) {
      this.logger.error('Failed to send notification:', error);
      throw error;
    }
  }

  async sendGeneralNotification(
    to: string,
    subject: string,
    html: string
  ): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.configService.get('SMTP_FROM'),
        to,
        subject,
        html,
      });

      this.logger.log(`Sent general notification to ${to}`);
    } catch (error) {
      this.logger.error('Failed to send general notification:', error);
      throw error;
    }
  }

  private getSubjectByType(type: string): string {
    switch (type) {
      case 'SCHEDULED':
        return 'New Shift Scheduled - Care Home Roster';
      case 'UPDATED':
        return 'Shift Updated - Care Home Roster';
      case 'CANCELLED':
        return 'Shift Cancelled - Care Home Roster';
      default:
        return 'Roster Update - Care Home';
    }
  }

  private generateShiftEmailHTML(
    caregiverName: string,
    shiftData: any,
    type: string
  ): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Care Home Roster Update</h2>
        <p>Dear ${caregiverName},</p>
        <p>Your shift has been ${type.toLowerCase()}:</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #495057;">Shift Details</h3>
          <p><strong>Date:</strong> ${shiftData.date}</p>
          <p><strong>Time:</strong> ${shiftData.startTime} - ${shiftData.endTime}</p>
          <p><strong>Location:</strong> ${shiftData.location}</p>
          ${shiftData.roomBed ? `<p><strong>Room/Bed:</strong> ${shiftData.roomBed}</p>` : ''}
        </div>
        <p>Please confirm your availability or contact the admin if you have any questions.</p>
        <p>Best regards,<br>Care Home Management Team</p>
      </div>
    `;
  }
}