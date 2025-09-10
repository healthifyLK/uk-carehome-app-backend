import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction } from 'sequelize';
import { CareReceiver } from '../../database/models/care-receiver.model.';
import { Location } from '../../database/models/location.model';
import { RoomBed } from '../../database/models/room-bed.model';
import { AuditLog } from '../../database/models/audit-log.model';
import {
  CareReceiverRegistrationDto,
} from './dto/care-receiver-registration.dto';
import { CareLevel, CareReceiverStatus } from '../../database/models/care-receiver.model.';
import { CareReceiverResponseDto } from './dto/care-receiver-response.dto';

@Injectable()
export class CareReceiversService {
  constructor(
    @InjectModel(CareReceiver)
    private readonly careReceiverModel: typeof CareReceiver,
    @InjectModel(Location)
    private readonly locationModel: typeof Location,
    @InjectModel(RoomBed)
    private readonly roomBedModel: typeof RoomBed,
    @InjectModel(AuditLog)
    private readonly auditLogModel: typeof AuditLog,
  ) {}

  async registerCareReceiver(
    registrationData: CareReceiverRegistrationDto,
    userId: string,
    transaction?: Transaction,
  ): Promise<CareReceiverResponseDto> {
    // Validate location exists
    const location = await this.locationModel.findByPk(
      registrationData.locationId,
    );
    if (!location) {
      throw new NotFoundException('Location not found');
    }

    // Validate room/bed if provided
    if (registrationData.currentRoomBedId) {
      const roomBed = await this.roomBedModel.findByPk(
        registrationData.currentRoomBedId,
      );
      if (!roomBed) {
        throw new NotFoundException('Room/Bed not found');
      }
      if (roomBed.isOccupied) {
        throw new BadRequestException('Room/Bed is already occupied');
      }
    }

    // Check for existing care receiver with same medical record number
    if (registrationData.medicalRecordNumber) {
      const existingCareReceiver = await this.careReceiverModel.findOne({
        where: { medicalRecordNumber: registrationData.medicalRecordNumber },
      });
      if (existingCareReceiver) {
        throw new BadRequestException(
          'Care receiver with this medical record number already exists',
        );
      }
    }

    // Create care receiver with GDPR compliance
    const careReceiver = await this.careReceiverModel.create(
      {
        ...registrationData,
        status: CareReceiverStatus.ACTIVE,
        admissionDate: new Date(),
        careLevel: registrationData.careLevel || CareLevel.MEDIUM,
        consentHistory: {
          initialConsent: {
            ...registrationData.gdprConsent,
            timestamp: new Date(),
            recordedBy: userId,
          },
        },
      },
      { transaction },
    );

    // Update room/bed occupancy if assigned
    if (registrationData.currentRoomBedId) {
      await this.roomBedModel.update(
        { isOccupied: true },
        {
          where: { id: registrationData.currentRoomBedId },
          transaction,
        },
      );
    }

    // Create audit log for GDPR compliance
    await this.auditLogModel.create(
      {
        action: 'CARE_RECEIVER_REGISTRATION',
        entityType: 'CARE_RECEIVER',
        entityId: careReceiver.id,
        userId: userId,
        changes: {
          operation: 'CREATE',
          gdprConsent: registrationData.gdprConsent,
          dataProcessed: [
            'personal_data',
            'health_data',
            'emergency_contacts',
            'location_data',
            'medical_history',
            'medications',
            'allergies',
            'care_plan',
          ],
          legalBasis: 'CONSENT',
          purpose: 'CARE_PROVISION',
        },
        ipAddress: 'system', // Should be passed from controller
        userAgent: 'system', // Should be passed from controller
      },
      { transaction },
    );

    return this.mapToResponseDto(careReceiver);
  }

  async getCareReceiverById(careReceiverId: string): Promise<CareReceiverResponseDto> {
    const careReceiver = await this.careReceiverModel.findByPk(careReceiverId, {
      include: [
        { model: Location, as: 'location' },
        { model: RoomBed, as: 'currentRoomBed' },
      ],
    });

    if (!careReceiver) {
      throw new NotFoundException('Care receiver not found');
    }

    return this.mapToResponseDto(careReceiver);
  }

  async getAllCareReceivers(locationId?: string): Promise<CareReceiverResponseDto[]> {
    const whereClause = locationId ? { locationId } : {};

    const careReceivers = await this.careReceiverModel.findAll({
      where: whereClause,
      include: [
        { model: Location, as: 'location' },
        { model: RoomBed, as: 'currentRoomBed' },
      ],
      order: [['createdAt', 'DESC']],
    });

    return careReceivers.map((careReceiver) => this.mapToResponseDto(careReceiver));
  }

  async updateCareReceiver(
    careReceiverId: string,
    updateData: Partial<CareReceiverRegistrationDto>,
    userId: string,
  ): Promise<CareReceiverResponseDto> {
    const careReceiver = await this.careReceiverModel.findByPk(careReceiverId);
    if (!careReceiver) {
      throw new NotFoundException('Care receiver not found');
    }

    // Handle room/bed changes
    if (updateData.currentRoomBedId !== careReceiver.currentRoomBedId) {
      // Free up old room/bed
      if (careReceiver.currentRoomBedId) {
        await this.roomBedModel.update(
          { isOccupied: false },
          { where: { id: careReceiver.currentRoomBedId } },
        );
      }

      // Assign new room/bed
      if (updateData.currentRoomBedId) {
        const roomBed = await this.roomBedModel.findByPk(
          updateData.currentRoomBedId,
        );
        if (!roomBed) {
          throw new NotFoundException('Room/Bed not found');
        }
        if (roomBed.isOccupied) {
          throw new BadRequestException('Room/Bed is already occupied');
        }

        await this.roomBedModel.update(
          { isOccupied: true },
          { where: { id: updateData.currentRoomBedId } },
        );
      }
    }

    await careReceiver.update(updateData);

    // Audit log for update
    await this.auditLogModel.create({
      action: 'CARE_RECEIVER_UPDATE',
      entityType: 'CARE_RECEIVER',
      entityId: careReceiverId,
      userId: userId,
      changes: {
        operation: 'UPDATE',
        changes: updateData,
      },
    });

    return this.mapToResponseDto(careReceiver);
  }

  async updateGdprConsent(
    careReceiverId: string,
    newConsent: any,
    userId: string,
    transaction?: Transaction,
  ): Promise<void> {
    const careReceiver = await this.careReceiverModel.findByPk(careReceiverId);
    if (!careReceiver) {
      throw new NotFoundException('Care receiver not found');
    }

    const consentHistory = careReceiver.consentHistory || {};
    consentHistory[new Date().toISOString()] = {
      ...newConsent,
      timestamp: new Date(),
      recordedBy: userId,
    };

    await careReceiver.update({ consentHistory }, { transaction });

    // Audit log for consent update
    await this.auditLogModel.create(
      {
        action: 'GDPR_CONSENT_UPDATE',
        entityType: 'CARE_RECEIVER',
        entityId: careReceiverId,
        userId: userId,
        changes: {
          operation: 'UPDATE',
          consentChanges: newConsent,
          previousConsent: careReceiver.consentHistory,
        },
      },
      { transaction },
    );
  }

  async requestDataDeletion(careReceiverId: string, userId: string): Promise<void> {
    const careReceiver = await this.careReceiverModel.findByPk(careReceiverId);
    if (!careReceiver) {
      throw new NotFoundException('Care receiver not found');
    }

    // Mark for deletion (soft delete)
    await careReceiver.update({
      status: CareReceiverStatus.DISCHARGED,
      // Add deletion request metadata
      consentHistory: {
        ...careReceiver.consentHistory,
        deletionRequest: {
          requestedAt: new Date(),
          requestedBy: userId,
          status: 'PENDING',
        },
      },
    });

    // Audit log for deletion request
    await this.auditLogModel.create({
      action: 'DATA_DELETION_REQUEST',
      entityType: 'CARE_RECEIVER',
      entityId: careReceiverId,
      userId: userId,
      changes: {
        operation: 'DELETE_REQUEST',
        reason: 'GDPR_RIGHT_TO_ERASURE',
      },
    });
  }

  async dischargeCareReceiver(careReceiverId: string, userId: string): Promise<void> {
    const careReceiver = await this.careReceiverModel.findByPk(careReceiverId);
    if (!careReceiver) {
      throw new NotFoundException('Care receiver not found');
    }

    // Free up room/bed
    if (careReceiver.currentRoomBedId) {
      await this.roomBedModel.update(
        { isOccupied: false },
        { where: { id: careReceiver.currentRoomBedId } },
      );
    }

    await careReceiver.update({
      status: CareReceiverStatus.DISCHARGED,
      dischargeDate: new Date(),
    });

    // Audit log for discharge
    await this.auditLogModel.create({
      action: 'CARE_RECEIVER_DISCHARGE',
      entityType: 'CARE_RECEIVER',
      entityId: careReceiverId,
      userId: userId,
      changes: {
        operation: 'UPDATE',
        statusChange: 'DISCHARGED',
      },
    });
  }

  async updateHealthMetrics(
    careReceiverId: string,
    healthMetrics: any,
    userId: string,
  ): Promise<void> {
    const careReceiver = await this.careReceiverModel.findByPk(careReceiverId);
    if (!careReceiver) {
      throw new NotFoundException('Care receiver not found');
    }

    const currentMetrics = careReceiver.healthMetrics || {};
    const updatedMetrics = {
      ...currentMetrics,
      [new Date().toISOString()]: {
        ...healthMetrics,
        recordedBy: userId,
        timestamp: new Date(),
      },
    };

    await careReceiver.update({ healthMetrics: updatedMetrics });

    // Audit log for health metrics update
    await this.auditLogModel.create({
      action: 'HEALTH_METRICS_UPDATE',
      entityType: 'CARE_RECEIVER',
      entityId: careReceiverId,
      userId: userId,
      changes: {
        operation: 'UPDATE',
        healthMetrics: healthMetrics,
      },
    });
  }

  async addCareLog(
    careReceiverId: string,
    careLog: any,
    userId: string,
  ): Promise<void> {
    const careReceiver = await this.careReceiverModel.findByPk(careReceiverId);
    if (!careReceiver) {
      throw new NotFoundException('Care receiver not found');
    }

    const currentLogs = careReceiver.careLogs || [];
    const newLog = {
      ...careLog,
      recordedBy: userId,
      timestamp: new Date(),
    };

    await careReceiver.update({ 
      careLogs: [...currentLogs, newLog] 
    });

    // Audit log for care log addition
    await this.auditLogModel.create({
      action: 'CARE_LOG_ADDITION',
      entityType: 'CARE_RECEIVER',
      entityId: careReceiverId,
      userId: userId,
      changes: {
        operation: 'ADD',
        careLog: careLog,
      },
    });
  }

  async addIncidentReport(
    careReceiverId: string,
    incidentReport: any,
    userId: string,
  ): Promise<void> {
    const careReceiver = await this.careReceiverModel.findByPk(careReceiverId);
    if (!careReceiver) {
      throw new NotFoundException('Care receiver not found');
    }

    const currentReports = careReceiver.incidentReports || [];
    const newReport = {
      ...incidentReport,
      reportedBy: userId,
      timestamp: new Date(),
    };

    await careReceiver.update({ 
      incidentReports: [...currentReports, newReport] 
    });

    // Audit log for incident report
    await this.auditLogModel.create({
      action: 'INCIDENT_REPORT_ADDITION',
      entityType: 'CARE_RECEIVER',
      entityId: careReceiverId,
      userId: userId,
      changes: {
        operation: 'ADD',
        incidentReport: incidentReport,
      },
    });
  }

  private mapToResponseDto(careReceiver: CareReceiver): CareReceiverResponseDto {
    return {
      id: careReceiver.id,
      firstName: careReceiver.firstName,
      lastName: careReceiver.lastName,
      dateOfBirth: careReceiver.dateOfBirth,
      gender: careReceiver.gender,
      medicalRecordNumber: careReceiver.medicalRecordNumber,
      presentAddress: careReceiver.presentAddress,
      nationality: careReceiver.nationality,
      medicalHistory: careReceiver.medicalHistory,
      currentMedications: careReceiver.currentMedications,
      allergies: careReceiver.allergies,
      mobilityLevel: careReceiver.mobilityLevel,
      mentalCapacityLevel: careReceiver.mentalCapacityLevel,
      mentalHealthIllnesses: careReceiver.mentalHealthIllnesses,
      dnrStatus: careReceiver.dnrStatus,
      gpDetails: careReceiver.gpDetails,
      careLevel: careReceiver.careLevel,
      locationId: careReceiver.locationId,
      currentRoomBedId: careReceiver.currentRoomBedId,
      accessibilityNeeds: careReceiver.accessibilityNeeds,
      specialEquipmentRequirements: careReceiver.specialEquipmentRequirements,
      emergencyContacts: careReceiver.emergencyContacts,
      legalGuardianDetails: careReceiver.legalGuardianDetails,
      wearableDevicePreferences: careReceiver.wearableDevicePreferences,
      healthMonitoringConsent: careReceiver.healthMonitoringConsent,
      dataSharingPermissions: careReceiver.dataSharingPermissions,
      admissionDate: careReceiver.admissionDate,
      dischargeDate: careReceiver.dischargeDate,
      reasonForAdmission: careReceiver.reasonForAdmission,
      expectedLengthOfStay: careReceiver.expectedLengthOfStay,
      fundingSource: careReceiver.fundingSource,
      carePlanSummary: careReceiver.carePlanSummary,
      status: careReceiver.status,
      wearableDeviceId: careReceiver.wearableDeviceId,
      healthMetrics: careReceiver.healthMetrics,
      healthAlerts: careReceiver.healthAlerts,
      careLogs: careReceiver.careLogs,
      mealDietPlan: careReceiver.mealDietPlan,
      incidentReports: careReceiver.incidentReports,
      communicationLog: careReceiver.communicationLog,
      carePlanMeetingNotes: careReceiver.carePlanMeetingNotes,
      connectedWearableDevices: careReceiver.connectedWearableDevices,
      healthDataSyncInfo: careReceiver.healthDataSyncInfo,
      alertThresholds: careReceiver.alertThresholds,
      createdAt: careReceiver.createdAt,
      updatedAt: careReceiver.updatedAt,
    };
  }
}