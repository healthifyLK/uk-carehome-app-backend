import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { LeaveRequest, LeaveStatus, LeaveType } from '../../database/models/leave-request.model';
import { Caregiver } from '../../database/models/caregiver.model';
import { Location } from '../../database/models/location.model';
import { Roster } from '../../database/models/roster.model';
import { AuditLog } from '../../database/models/audit-log.model';
import { NotificationService } from '../../common/services/notification.service';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveRequestStatusDto } from './dto/update-leave-request-status.dto';
import { QueryLeaveRequestsDto } from './dto/query-leave-requests.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LeavesService {
  constructor(
    @InjectModel(LeaveRequest)
    private leaveRequestModel: typeof LeaveRequest,
    @InjectModel(Caregiver)
    private caregiverModel: typeof Caregiver,
    @InjectModel(Location)
    private locationModel: typeof Location,
    @InjectModel(Roster)
    private rosterModel: typeof Roster,
    @InjectModel(AuditLog)
    private auditLogModel: typeof AuditLog,
    private notificationService: NotificationService,
  ) {}

  async createLeaveRequest(
    caregiverId: string,
    createDto: CreateLeaveRequestDto,
    attachments?: any[],
  ): Promise<LeaveRequest> {
    // Validate caregiver exists and get location
    const caregiver = await this.caregiverModel.findByPk(caregiverId, {
      include: [Location],
    });
    if (!caregiver) {
      throw new NotFoundException('Caregiver not found');
    }

    const leaveDate = new Date(createDto.date);
    
    // Validate time constraints
    await this.validateTimeConstraints(leaveDate, createDto.type);
    
    // Validate no existing roster for full day leave
    if (createDto.type === LeaveType.FULL_DAY) {
      await this.validateNoRosterConflict(caregiverId, leaveDate);
    }

    // Check for existing pending leave request
    const existingRequest = await this.leaveRequestModel.findOne({
      where: {
        caregiverId,
        date: leaveDate,
        status: LeaveStatus.PENDING,
      },
    });
    if (existingRequest) {
      throw new BadRequestException('Pending leave request already exists for this date');
    }

    // Process attachments
    const attachmentMetadata = await this.processAttachments(attachments);

    // Create leave request
    const leaveRequest = await this.leaveRequestModel.create({
      caregiverId,
      locationId: caregiver.locationId,
      date: leaveDate,
      type: createDto.type,
      reason: createDto.reason,
      attachments: attachmentMetadata,
      requestedAt: new Date(),
    });

    // Send notification to admins
    await this.sendLeaveRequestNotification(leaveRequest, caregiver);

    // Create audit log
    await this.auditLogModel.create({
      action: 'LEAVE_REQUEST_CREATE',
      entityType: 'LEAVE_REQUEST',
      entityId: leaveRequest.id,
      userId: caregiverId,
      changes: {
        operation: 'CREATE',
        leaveRequestData: createDto,
      },
    });

    return leaveRequest;
  }

  async getMyLeaveRequests(
    caregiverId: string,
    queryDto: QueryLeaveRequestsDto,
  ): Promise<LeaveRequest[]> {
    const whereClause: any = { caregiverId };
    
    if (queryDto.status) {
      whereClause.status = queryDto.status;
    }
    
    if (queryDto.dateFrom || queryDto.dateTo) {
      whereClause.date = {};
      if (queryDto.dateFrom) {
        whereClause.date[Op.gte] = new Date(queryDto.dateFrom);
      }
      if (queryDto.dateTo) {
        whereClause.date[Op.lte] = new Date(queryDto.dateTo);
      }
    }

    return this.leaveRequestModel.findAll({
      where: whereClause,
      include: [
        { model: Location, attributes: ['id', 'name'] },
      ],
      order: [['date', 'DESC']],
    });
  }

  async getLeaveRequests(
    queryDto: QueryLeaveRequestsDto,
    user: any,
  ): Promise<LeaveRequest[]> {
    const whereClause: any = {};
    
    // Apply location filter for non-super admins
    if (user.role !== 'SUPER_ADMIN' && user.locationId) {
      whereClause.locationId = user.locationId;
    } else if (queryDto.locationId) {
      whereClause.locationId = queryDto.locationId;
    }

    if (queryDto.caregiverId) {
      whereClause.caregiverId = queryDto.caregiverId;
    }
    
    if (queryDto.status) {
      whereClause.status = queryDto.status;
    }
    
    if (queryDto.dateFrom || queryDto.dateTo) {
      whereClause.date = {};
      if (queryDto.dateFrom) {
        whereClause.date[Op.gte] = new Date(queryDto.dateFrom);
      }
      if (queryDto.dateTo) {
        whereClause.date[Op.lte] = new Date(queryDto.dateTo);
      }
    }

    return this.leaveRequestModel.findAll({
      where: whereClause,
      include: [
        { model: Caregiver, attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Location, attributes: ['id', 'name'] },
      ],
      order: [['date', 'DESC']],
    });
  }

  async approveLeaveRequest(
    id: string,
    updateDto: UpdateLeaveRequestStatusDto,
    adminId: string,
  ): Promise<LeaveRequest> {
    const leaveRequest = await this.leaveRequestModel.findByPk(id, {
      include: [Caregiver, Location],
    });
    
    if (!leaveRequest) {
      throw new NotFoundException('Leave request not found');
    }

    if (leaveRequest.status !== LeaveStatus.PENDING) {
      throw new BadRequestException('Only pending leave requests can be approved');
    }

    // Update leave request
    await leaveRequest.update({
      status: LeaveStatus.APPROVED,
      decidedAt: new Date(),
      decidedBy: adminId,
      decisionNote: updateDto.decisionNote,
    });

    // Send notification to caregiver
    await this.sendLeaveDecisionNotification(leaveRequest, 'APPROVED');

    // Create audit log
    await this.auditLogModel.create({
      action: 'LEAVE_REQUEST_APPROVE',
      entityType: 'LEAVE_REQUEST',
      entityId: leaveRequest.id,
      userId: adminId,
      changes: {
        operation: 'UPDATE',
        decision: 'APPROVED',
        decisionNote: updateDto.decisionNote,
      },
    });

    return leaveRequest;
  }

  async rejectLeaveRequest(
    id: string,
    updateDto: UpdateLeaveRequestStatusDto,
    adminId: string,
  ): Promise<LeaveRequest> {
    const leaveRequest = await this.leaveRequestModel.findByPk(id, {
      include: [Caregiver, Location],
    });
    
    if (!leaveRequest) {
      throw new NotFoundException('Leave request not found');
    }

    if (leaveRequest.status !== LeaveStatus.PENDING) {
      throw new BadRequestException('Only pending leave requests can be rejected');
    }

    // Update leave request
    await leaveRequest.update({
      status: LeaveStatus.REJECTED,
      decidedAt: new Date(),
      decidedBy: adminId,
      decisionNote: updateDto.decisionNote,
    });

    // Send notification to caregiver
    await this.sendLeaveDecisionNotification(leaveRequest, 'REJECTED');

    // Create audit log
    await this.auditLogModel.create({
      action: 'LEAVE_REQUEST_REJECT',
      entityType: 'LEAVE_REQUEST',
      entityId: leaveRequest.id,
      userId: adminId,
      changes: {
        operation: 'UPDATE',
        decision: 'REJECTED',
        decisionNote: updateDto.decisionNote,
      },
    });

    return leaveRequest;
  }

  async cancelLeaveRequest(
    id: string,
    caregiverId: string,
  ): Promise<LeaveRequest> {
    const leaveRequest = await this.leaveRequestModel.findByPk(id);
    
    if (!leaveRequest) {
      throw new NotFoundException('Leave request not found');
    }

    if (leaveRequest.caregiverId !== caregiverId) {
      throw new ForbiddenException('You can only cancel your own leave requests');
    }

    if (leaveRequest.status !== LeaveStatus.PENDING) {
      throw new BadRequestException('Only pending leave requests can be cancelled');
    }

    // Update leave request
    await leaveRequest.update({
      status: LeaveStatus.CANCELLED,
    });

    // Create audit log
    await this.auditLogModel.create({
      action: 'LEAVE_REQUEST_CANCEL',
      entityType: 'LEAVE_REQUEST',
      entityId: leaveRequest.id,
      userId: caregiverId,
      changes: {
        operation: 'UPDATE',
        decision: 'CANCELLED',
      },
    });

    return leaveRequest;
  }

  private async validateTimeConstraints(date: Date, type: LeaveType): Promise<void> {
    const now = new Date();
    const leaveDate = new Date(date);
    leaveDate.setHours(0, 0, 0, 0);

    if (type === LeaveType.FULL_DAY) {
      // Must be requested before 6 AM on the leave date
      const cutoffTime = new Date(leaveDate);
      cutoffTime.setHours(6, 0, 0, 0);
      
      if (now >= cutoffTime) {
        throw new BadRequestException(
          'Full day leave requests must be submitted before 6:00 AM on the leave date'
        );
      }
    } else {
      // Half day requests must be made at least 1 hour before 6 AM
      const cutoffTime = new Date(leaveDate);
      cutoffTime.setHours(5, 0, 0, 0); // 1 hour before 6 AM
      
      if (now >= cutoffTime) {
        throw new BadRequestException(
          'Half day leave requests must be submitted before 5:00 AM on the leave date'
        );
      }
    }
  }

  private async validateNoRosterConflict(caregiverId: string, date: Date): Promise<void> {
    const existingRoster = await this.rosterModel.findOne({
      where: {
        caregiverId,
        shiftDate: date,
      },
    });

    if (existingRoster) {
      throw new BadRequestException(
        'Cannot request full day leave when you have a roster assignment for this date'
      );
    }
  }

  private async processAttachments(attachments?: Express.Multer.File[]): Promise<any[]> {
    if (!attachments || attachments.length === 0) {
      return [];
    }

    const uploadDir = 'uploads/leaves';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const attachmentMetadata = [];
    
    for (const file of attachments) {
      const filename = `${Date.now()}-${file.originalname}`;
      const filepath = path.join(uploadDir, filename);
      
      fs.writeFileSync(filepath, file.buffer);
      
      attachmentMetadata.push({
        filename: file.originalname,
        storedFilename: filename,
        filepath,
        size: file.size,
        mimetype: file.mimetype,
        uploadedAt: new Date(),
      });
    }

    return attachmentMetadata;
  }

  private async sendLeaveRequestNotification(
    leaveRequest: LeaveRequest,
    caregiver: Caregiver,
  ): Promise<void> {
    // This would be implemented to send notifications to admins
    // For now, we'll just log it
    console.log(`Leave request submitted by ${caregiver.getFullName()} for ${leaveRequest.date}`);
  }

  private async sendLeaveDecisionNotification(
    leaveRequest: LeaveRequest,
    decision: string,
  ): Promise<void> {
    // This would be implemented to send notifications to caregivers
    // For now, we'll just log it
    console.log(`Leave request ${decision.toLowerCase()} for ${leaveRequest.caregiverId} on ${leaveRequest.date}`);
  }
}