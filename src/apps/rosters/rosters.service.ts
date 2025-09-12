import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction } from 'sequelize';
import { Roster } from '../../database/models/roster.model';
import { Caregiver } from '../../database/models/caregiver.model';
import { Location } from '../../database/models/location.model';
import { RoomBed } from '../../database/models/room-bed.model';
import { AuditLog } from '../../database/models/audit-log.model';
import { GoogleCalendarService } from '../../common/services/google-calendar.service';
import { NotificationService } from '../../common/services/notification.service';
import { RosterCreateDto } from './dto/rosters-create.dto';
import { RosterResponseDto } from './dto/roster-response.dto';
import { RosterStatus, ShiftStatus } from '../../database/models/roster.model';

@Injectable()
export class RostersService {
  constructor(
    @InjectModel(Roster)
    private readonly rosterModel: typeof Roster,
    @InjectModel(Caregiver)
    private readonly caregiverModel: typeof Caregiver,
    @InjectModel(Location)
    private readonly locationModel: typeof Location,
    @InjectModel(RoomBed)
    private readonly roomBedModel: typeof RoomBed,
    @InjectModel(AuditLog)
    private readonly auditLogModel: typeof AuditLog,
    private readonly googleCalendarService: GoogleCalendarService,
    private readonly notificationService: NotificationService,
  ) {}

  async createRoster(
    rosterData: RosterCreateDto,
    userId: string,
    transaction?: Transaction,
  ): Promise<RosterResponseDto> {
    console.log('Roster data',rosterData);
    
    
    // Validate caregiver exists
    const caregiver = await this.caregiverModel.findByPk(
      rosterData.caregiverId,
    );
    if (!caregiver) {
      throw new NotFoundException('Caregiver not found');
    }

    // Validate location exists
    const location = await this.locationModel.findByPk(rosterData.locationId);
    if (!location) {
      throw new NotFoundException('Location not found');
    }

    // Validate room/bed if provided
    if (rosterData.roomBedId) {
      const roomBed = await this.roomBedModel.findByPk(rosterData.roomBedId);
      if (!roomBed) {
        throw new NotFoundException('Room/Bed not found');
      }
    }

    // Check for conflicts
    await this.checkShiftConflicts(rosterData);

    // Create roster entry
    const roster = await this.rosterModel.create(
      {
        ...rosterData,
        status: rosterData.status,
      },
      { transaction },
    );

    // Create Google Calendar event if status is PUBLISHED
    if (roster.status === RosterStatus.PUBLISHED) {
      await this.createGoogleCalendarEvent(roster, caregiver, location);
    }

    // Send notification if published
    if (roster.status === RosterStatus.PUBLISHED) {
      await this.sendShiftNotification(
        roster,
        caregiver,
        location,
        'SCHEDULED',
      );
    }

    // Create audit log
    await this.auditLogModel.create(
      {
        action: 'ROSTER_CREATE',
        entityType: 'ROSTER',
        entityId: roster.id,
        userId: userId,
        changes: {
          operation: 'CREATE',
          rosterData: rosterData,
        },
      },
      { transaction },
    );

    return this.mapToResponseDto(roster);
  }

  async getRosterById(rosterId: string): Promise<RosterResponseDto> {
    const roster = await this.rosterModel.findByPk(rosterId, {
      include: [
        { model: Caregiver, as: 'caregiver' },
        { model: Location, as: 'location' },
        { model: RoomBed, as: 'roomBed' },
      ],
    });

    if (!roster) {
      throw new NotFoundException('Roster not found');
    }

    return this.mapToResponseDto(roster);
  }

  async getRostersByDateRange(
    startDate: string,
    endDate: string,
    locationId?: string,
  ): Promise<RosterResponseDto[]> {
    const whereClause: any = {
      shiftDate: {
        [require('sequelize').Op.between]: [startDate, endDate],
      },
    };

    if (locationId) {
      whereClause.locationId = locationId;
    }

    const rosters = await this.rosterModel.findAll({
      where: whereClause,
      include: [
        { model: Caregiver, as: 'caregiver' },
        { model: Location, as: 'location' },
        { model: RoomBed, as: 'roomBed' },
      ],
      order: [
        ['shiftDate', 'ASC'],
        ['startTime', 'ASC'],
      ],
    });

    return rosters.map((roster) => this.mapToResponseDto(roster));
  }

  async updateRoster(
    rosterId: string,
    updateData: Partial<RosterCreateDto>,
    userId: string,
  ): Promise<RosterResponseDto> {
    const roster = await this.rosterModel.findByPk(rosterId, {
      include: [
        { model: Caregiver, as: 'caregiver' },
        { model: Location, as: 'location' },
      ],
    });

    if (!roster) {
      throw new NotFoundException('Roster not found');
    }

    const oldStatus = roster.status;
    await roster.update(updateData);

    // Update Google Calendar if status changed to PUBLISHED
    if (
      updateData.status === RosterStatus.PUBLISHED &&
      oldStatus !== RosterStatus.PUBLISHED
    ) {
      await this.createGoogleCalendarEvent(
        roster,
        roster.caregiver,
        roster.location,
      );
      await this.sendShiftNotification(
        roster,
        roster.caregiver,
        roster.location,
        'SCHEDULED',
      );
    }

    // Update Google Calendar event if already published
    if (
      roster.googleCalendarEventId &&
      roster.status === RosterStatus.PUBLISHED
    ) {
      await this.updateGoogleCalendarEvent(
        roster,
        roster.caregiver,
        roster.location,
      );
      await this.sendShiftNotification(
        roster,
        roster.caregiver,
        roster.location,
        'UPDATED',
      );
    }

    // Audit log
    await this.auditLogModel.create({
      action: 'ROSTER_UPDATE',
      entityType: 'ROSTER',
      entityId: rosterId,
      userId: userId,
      changes: {
        operation: 'UPDATE',
        changes: updateData,
      },
    });

    return this.mapToResponseDto(roster);
  }

  async confirmShift(
    rosterId: string,
    userId: string,
  ): Promise<RosterResponseDto> {
    const roster = await this.rosterModel.findByPk(rosterId);
    if (!roster) {
      throw new NotFoundException('Roster not found');
    }

    await roster.update({
      shiftStatus: ShiftStatus.CONFIRMED,
      confirmedAt: new Date(),
    });

    // Audit log
    await this.auditLogModel.create({
      action: 'SHIFT_CONFIRM',
      entityType: 'ROSTER',
      entityId: rosterId,
      userId: userId,
      changes: {
        operation: 'CONFIRM',
        confirmedAt: new Date(),
      },
    });

    return this.mapToResponseDto(roster);
  }

  async startShift(
    rosterId: string,
    userId: string,
  ): Promise<RosterResponseDto> {
    const roster = await this.rosterModel.findByPk(rosterId);
    if (!roster) {
      throw new NotFoundException('Roster not found');
    }

    await roster.update({
      shiftStatus: ShiftStatus.IN_PROGRESS,
      startedAt: new Date(),
    });

    // Audit log
    await this.auditLogModel.create({
      action: 'SHIFT_START',
      entityType: 'ROSTER',
      entityId: rosterId,
      userId: userId,
      changes: {
        operation: 'START',
        startedAt: new Date(),
      },
    });

    return this.mapToResponseDto(roster);
  }

  async completeShift(
    rosterId: string,
    userId: string,
  ): Promise<RosterResponseDto> {
    const roster = await this.rosterModel.findByPk(rosterId);
    if (!roster) {
      throw new NotFoundException('Roster not found');
    }

    await roster.update({
      shiftStatus: ShiftStatus.COMPLETED,
      completedAt: new Date(),
    });

    // Audit log
    await this.auditLogModel.create({
      action: 'SHIFT_COMPLETE',
      entityType: 'ROSTER',
      entityId: rosterId,
      userId: userId,
      changes: {
        operation: 'COMPLETE',
        completedAt: new Date(),
      },
    });

    return this.mapToResponseDto(roster);
  }

  async deleteRoster(rosterId: string, userId: string): Promise<void> {
    const roster = await this.rosterModel.findByPk(rosterId);
    if (!roster) {
      throw new NotFoundException('Roster not found');
    }

    // Delete Google Calendar event if exists
    if (roster.googleCalendarEventId) {
      await this.googleCalendarService.deleteEvent(
        roster.googleCalendarEventId,
      );
    }

    // Send cancellation notification
    if (roster.status === RosterStatus.PUBLISHED) {
      const caregiver = await this.caregiverModel.findByPk(roster.caregiverId);
      const location = await this.locationModel.findByPk(roster.locationId);
      if (caregiver && location) {
        await this.sendShiftNotification(
          roster,
          caregiver,
          location,
          'CANCELLED',
        );
      }
    }

    await roster.destroy();

    // Audit log
    await this.auditLogModel.create({
      action: 'ROSTER_DELETE',
      entityType: 'ROSTER',
      entityId: rosterId,
      userId: userId,
      changes: {
        operation: 'DELETE',
        deletedRoster: { id: roster.id, shiftDate: roster.shiftDate },
      },
    });
  }

  private async checkShiftConflicts(
    rosterData: RosterCreateDto,
  ): Promise<void> {
    const conflictingRoster = await this.rosterModel.findOne({
      where: {
        caregiverId: rosterData.caregiverId,
        shiftDate: rosterData.shiftDate,
        status: [RosterStatus.PUBLISHED, RosterStatus.ACTIVE],
        [require('sequelize').Op.or]: [
          {
            startTime: {
              [require('sequelize').Op.between]: [
                rosterData.startTime,
                rosterData.endTime,
              ],
            },
          },
          {
            endTime: {
              [require('sequelize').Op.between]: [
                rosterData.startTime,
                rosterData.endTime,
              ],
            },
          },
        ],
      },
    });

    if (conflictingRoster) {
      throw new BadRequestException(
        'Caregiver has a conflicting shift at this time',
      );
    }
  }

  private async createGoogleCalendarEvent(
    roster: Roster,
    caregiver: Caregiver,
    location: Location,
  ): Promise<void> {
    try {
      const startDateTime = new Date(
        `${roster.shiftDate.toISOString().split('T')[0]}T${roster.startTime}`,
      );
      const endDateTime = new Date(
        `${roster.shiftDate.toISOString().split('T')[0]}T${roster.endTime}`,
      );

      const eventId = await this.googleCalendarService.createEvent({
        summary: `Care Shift - ${caregiver.firstName} ${caregiver.lastName}`,
        description: `Care shift at ${location.name}${roster.notes ? `\n\nNotes: ${roster.notes}` : ''}`,
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: 'Europe/London',
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: 'Europe/London',
        },
        attendees: [{ email: caregiver.email }],
        location: location.address,
      });

      await roster.update({ googleCalendarEventId: eventId });
    } catch (error) {
      console.error('Failed to create Google Calendar event:', error);
    }
  }

  private async updateGoogleCalendarEvent(
    roster: Roster,
    caregiver: Caregiver,
    location: Location,
  ): Promise<void> {
    try {
      const startDateTime = new Date(
        `${roster.shiftDate.toISOString().split('T')[0]}T${roster.startTime}`,
      );
      const endDateTime = new Date(
        `${roster.shiftDate.toISOString().split('T')[0]}T${roster.endTime}`,
      );

      await this.googleCalendarService.updateEvent(
        roster.googleCalendarEventId,
        {
          summary: `Care Shift - ${caregiver.firstName} ${caregiver.lastName}`,
          description: `Care shift at ${location.name}${roster.notes ? `\n\nNotes: ${roster.notes}` : ''}`,
          start: {
            dateTime: startDateTime.toISOString(),
            timeZone: 'Europe/London',
          },
          end: {
            dateTime: endDateTime.toISOString(),
            timeZone: 'Europe/London',
          },
          attendees: [{ email: caregiver.email }],
          location: location.address,
        },
      );
    } catch (error) {
      console.error('Failed to update Google Calendar event:', error);
    }
  }

  private async sendShiftNotification(
    roster: Roster,
    caregiver: Caregiver,
    location: Location,
    type: 'SCHEDULED' | 'UPDATED' | 'CANCELLED',
  ): Promise<void> {
    try {
      await this.notificationService.sendShiftNotification(
        caregiver.email,
        `${caregiver.firstName} ${caregiver.lastName}`,
        {
          date: roster.shiftDate.toDateString(),
          startTime: roster.startTime,
          endTime: roster.endTime,
          location: location.name,
          roomBed: roster.roomBedId ? 'Room/Bed Assignment' : undefined,
        },
        type,
      );
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  private mapToResponseDto(roster: Roster): RosterResponseDto {
    return {
      id: roster.id,
      locationId: roster.locationId,
      caregiverId: roster.caregiverId,
      roomBedId: roster.roomBedId,
      shiftDate: roster.shiftDate,
      shiftType: roster.shiftType,
      startTime: roster.startTime,
      endTime: roster.endTime,
      status: roster.status,
      shiftStatus: roster.shiftStatus,
      isRecurring: roster.isRecurring,
      recurrencePattern: roster.recurrencePattern,
      notes: roster.notes,
      metadata: roster.metadata,
      confirmedAt: roster.confirmedAt,
      startedAt: roster.startedAt,
      completedAt: roster.completedAt,
      createdAt: roster.createdAt,
      updatedAt: roster.updatedAt,
      // Add computed properties
      duration: this.calculateDuration(roster.startTime, roster.endTime),
      isActive: roster.shiftStatus === ShiftStatus.IN_PROGRESS,
      isCompleted: roster.shiftStatus === ShiftStatus.COMPLETED,
    };
  }

  private calculateDuration(startTime: string, endTime: string): number {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60); // hours
  }
}
