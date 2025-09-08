import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction } from 'sequelize';
import { Patient } from '../../database/models/patient.model';
import { Location } from '../../database/models/location.model';
import { RoomBed } from '../../database/models/room-bed.model';
import { AuditLog } from '../../database/models/audit-log.model';
import {
  PatientRegistrationDto,
  CareLevel,
  PatientStatus,
} from './dto/patient-registration.dto';
import { PatientResponseDto } from './dto/patient-response.dto';

@Injectable()
export class PatientsService {
  constructor(
    @InjectModel(Patient)
    private readonly patientModel: typeof Patient,
    @InjectModel(Location)
    private readonly locationModel: typeof Location,
    @InjectModel(RoomBed)
    private readonly roomBedModel: typeof RoomBed,
    @InjectModel(AuditLog)
    private readonly auditLogModel: typeof AuditLog,
  ) {}

  async registerPatient(
    registrationData: PatientRegistrationDto,
    userId: string,
    transaction?: Transaction,
  ): Promise<PatientResponseDto> {
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

    // Check for existing patient with same NHS number
    if (registrationData.nhsNumber) {
      const existingPatient = await this.patientModel.findOne({
        where: { nhsNumber: registrationData.nhsNumber },
      });
      if (existingPatient) {
        throw new BadRequestException(
          'Patient with this NHS number already exists',
        );
      }
    }

    // Create patient with GDPR compliance
    const patient = await this.patientModel.create(
      {
        ...registrationData,
        status: PatientStatus.ACTIVE,
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
        action: 'PATIENT_REGISTRATION',
        entityType: 'PATIENT',
        entityId: patient.id,
        userId: userId,
        changes: {
          operation: 'CREATE',
          gdprConsent: registrationData.gdprConsent,
          dataProcessed: [
            'personal_data',
            'health_data',
            'emergency_contacts',
            'location_data',
          ],
          legalBasis: 'CONSENT',
          purpose: 'CARE_PROVISION',
        },
        ipAddress: 'system', // Should be passed from controller
        userAgent: 'system', // Should be passed from controller
      },
      { transaction },
    );

    return this.mapToResponseDto(patient);
  }

  async getPatientById(patientId: string): Promise<PatientResponseDto> {
    const patient = await this.patientModel.findByPk(patientId, {
      include: [
        { model: Location, as: 'location' },
        { model: RoomBed, as: 'currentRoomBed' },
      ],
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    return this.mapToResponseDto(patient);
  }

  async getAllPatients(locationId?: string): Promise<PatientResponseDto[]> {
    const whereClause = locationId ? { locationId } : {};

    const patients = await this.patientModel.findAll({
      where: whereClause,
      include: [
        { model: Location, as: 'location' },
        { model: RoomBed, as: 'currentRoomBed' },
      ],
      order: [['createdAt', 'DESC']],
    });

    return patients.map((patient) => this.mapToResponseDto(patient));
  }

  async updatePatient(
    patientId: string,
    updateData: Partial<PatientRegistrationDto>,
    userId: string,
  ): Promise<PatientResponseDto> {
    const patient = await this.patientModel.findByPk(patientId);
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // Handle room/bed changes
    if (updateData.currentRoomBedId !== patient.currentRoomBedId) {
      // Free up old room/bed
      if (patient.currentRoomBedId) {
        await this.roomBedModel.update(
          { isOccupied: false },
          { where: { id: patient.currentRoomBedId } },
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

    await patient.update(updateData);

    // Audit log for update
    await this.auditLogModel.create({
      action: 'PATIENT_UPDATE',
      entityType: 'PATIENT',
      entityId: patientId,
      userId: userId,
      changes: {
        operation: 'UPDATE',
        changes: updateData,
      },
    });

    return this.mapToResponseDto(patient);
  }

  async updateGdprConsent(
    patientId: string,
    newConsent: any,
    userId: string,
    transaction?: Transaction,
  ): Promise<void> {
    const patient = await this.patientModel.findByPk(patientId);
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    const consentHistory = patient.consentHistory || {};
    consentHistory[new Date().toISOString()] = {
      ...newConsent,
      timestamp: new Date(),
      recordedBy: userId,
    };

    await patient.update({ consentHistory }, { transaction });

    // Audit log for consent update
    await this.auditLogModel.create(
      {
        action: 'GDPR_CONSENT_UPDATE',
        entityType: 'PATIENT',
        entityId: patientId,
        userId: userId,
        changes: {
          operation: 'UPDATE',
          consentChanges: newConsent,
          previousConsent: patient.consentHistory,
        },
      },
      { transaction },
    );
  }

  async requestDataDeletion(patientId: string, userId: string): Promise<void> {
    const patient = await this.patientModel.findByPk(patientId);
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // Mark for deletion (soft delete)
    await patient.update({
      status: PatientStatus.DISCHARGED,
      // Add deletion request metadata
      consentHistory: {
        ...patient.consentHistory,
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
      entityType: 'PATIENT',
      entityId: patientId,
      userId: userId,
      changes: {
        operation: 'DELETE_REQUEST',
        reason: 'GDPR_RIGHT_TO_ERASURE',
      },
    });
  }

  async dischargePatient(patientId: string, userId: string): Promise<void> {
    const patient = await this.patientModel.findByPk(patientId);
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // Free up room/bed
    if (patient.currentRoomBedId) {
      await this.roomBedModel.update(
        { isOccupied: false },
        { where: { id: patient.currentRoomBedId } },
      );
    }

    await patient.update({
      status: PatientStatus.DISCHARGED,
      dischargeDate: new Date(),
    });

    // Audit log for discharge
    await this.auditLogModel.create({
      action: 'PATIENT_DISCHARGE',
      entityType: 'PATIENT',
      entityId: patientId,
      userId: userId,
      changes: {
        operation: 'UPDATE',
        statusChange: 'DISCHARGED',
      },
    });
  }

  private mapToResponseDto(patient: Patient): PatientResponseDto {
    return {
      id: patient.id,
      firstName: patient.firstName,
      lastName: patient.lastName,
      dateOfBirth: patient.dateOfBirth,
      nhsNumber: patient.nhsNumber,
      locationId: patient.locationId,
      currentRoomBedId: patient.currentRoomBedId,
      careLevel: patient.careLevel,
      emergencyContacts: patient.emergencyContacts,
      admissionDate: patient.admissionDate,
      dischargeDate: patient.dischargeDate,
      status: patient.status,
      wearableDeviceId: patient.wearableDeviceId,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt,
    };
  }
}
