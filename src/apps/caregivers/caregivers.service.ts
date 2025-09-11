import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction } from 'sequelize';
import { Caregiver } from '../../database/models/caregiver.model';
import { Location } from '../../database/models/location.model';
import { AuditLog } from '../../database/models/audit-log.model';
import {
  EmploymentType,
  CaregiverStatus,
} from '../../database/models/caregiver.model';
import { CaregiverRegistrationDto } from './dto/caregivers-registration.dto';
import { CaregiverResponseDto } from './dto/caregivers-response.dto';
import { CareReceiverResponseDto } from '../patients/dto/care-receiver-response.dto';

@Injectable()
export class CaregiversService {
  constructor(
    @InjectModel(Caregiver)
    private readonly caregiverModel: typeof Caregiver,
    @InjectModel(Location)
    private readonly locationModel: typeof Location,
    @InjectModel(AuditLog)
    private readonly auditLogModel: typeof AuditLog,
  ) {}

  async registerCaregiver(
    registrationData: CaregiverRegistrationDto,
    userId: string,
    transaction?: Transaction,
  ): Promise<CaregiverResponseDto> {
    // Validate location exists
    const location = await this.locationModel.findByPk(
      registrationData.locationId,
    );
    if (!location) {
      throw new NotFoundException('Location not found');
    }

    // Check for existing caregiver with same email
    const existingCaregiver = await this.caregiverModel.findOne({
      where: { email: registrationData.email },
    });
    if (existingCaregiver) {
      throw new BadRequestException('Caregiver with this email already exists');
    }

    // Generate employee ID if not provided
    const employeeId =
      registrationData.employeeId || (await this.generateEmployeeId());

    // Create caregiver with GDPR compliance
    const caregiver = await this.caregiverModel.create(
      {
        ...registrationData,
        employeeId,
        status: CaregiverStatus.ACTIVE,
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

    // Create audit log for GDPR compliance
    await this.auditLogModel.create(
      {
        action: 'CAREGIVER_REGISTRATION',
        entityType: 'CAREGIVER',
        entityId: caregiver.id,
        userId: userId,
        changes: {
          operation: 'CREATE',
          gdprConsent: registrationData.gdprConsent,
          dataProcessed: [
            'personal_data',
            'employment_data',
            'emergency_contacts',
            'location_data',
            'qualifications',
            'right_to_work',
          ],
          legalBasis: 'CONSENT',
          purpose: 'EMPLOYMENT',
        },
        ipAddress: 'system',
        userAgent: 'system',
      },
      { transaction },
    );

    return this.mapToResponseDto(caregiver);
  }

  async getCaregiverById(caregiverId: string): Promise<CaregiverResponseDto> {
    const caregiver = await this.caregiverModel.findByPk(caregiverId, {
      include: [{ model: Location, as: 'location' }],
    });

    if (!caregiver) {
      throw new NotFoundException('Caregiver not found');
    }

    return this.mapToResponseDto(caregiver);
  }

  async getAllCaregivers(locationId?: string): Promise<CaregiverResponseDto[]> {
    const whereClause = locationId ? { locationId } : {};

    const caregivers = await this.caregiverModel.findAll({
      where: whereClause,
      include: [{ model: Location, as: 'location' }],
      order: [['createdAt', 'DESC']],
    });

    return caregivers.map((caregiver) => this.mapToResponseDto(caregiver));
  }

  async updateCaregiver(
    caregiverId: string,
    updateData: Partial<CaregiverRegistrationDto>,
    userId: string,
  ): Promise<CaregiverResponseDto> {
    const caregiver = await this.caregiverModel.findByPk(caregiverId);
    if (!caregiver) {
      throw new NotFoundException('Caregiver not found');
    }

    await caregiver.update(updateData);

    // Audit log for update
    await this.auditLogModel.create({
      action: 'CAREGIVER_UPDATE',
      entityType: 'CAREGIVER',
      entityId: caregiverId,
      userId: userId,
      changes: {
        operation: 'UPDATE',
        changes: updateData,
      },
    });

    return this.mapToResponseDto(caregiver);
  }

  async updateStatus(
    caregiverId: string,
    status: CaregiverStatus,
    userId: string,
  ): Promise<CaregiverResponseDto> {
    const caregiver = await this.caregiverModel.findByPk(caregiverId);
    if (!caregiver) {
      throw new NotFoundException('Caregiver not found');
    }

    await caregiver.update({ status });

    // Audit log for status update
    await this.auditLogModel.create({
      action: 'CAREGIVER_STATUS_UPDATE',
      entityType: 'CAREGIVER',
      entityId: caregiverId,
      userId: userId,
      changes: {
        operation: 'UPDATE',
        statusChange: status,
      },
    });

    return this.mapToResponseDto(caregiver);
  }

  async updateCertification(
    caregiverId: string,
    certificationData: any,
    userId: string,
  ): Promise<void> {
    const caregiver = await this.caregiverModel.findByPk(caregiverId);
    if (!caregiver) {
      throw new NotFoundException('Caregiver not found');
    }

    await caregiver.update(certificationData);

    // Audit log for certification update
    await this.auditLogModel.create({
      action: 'CAREGIVER_CERTIFICATION_UPDATE',
      entityType: 'CAREGIVER',
      entityId: caregiverId,
      userId: userId,
      changes: {
        operation: 'UPDATE',
        certificationData: certificationData,
      },
    });
  }

  async requestDataDeletion(
    caregiverId: string,
    userId: string,
  ): Promise<void> {
    const caregiver = await this.caregiverModel.findByPk(caregiverId);
    if (!caregiver) {
      throw new NotFoundException('Caregiver not found');
    }

    // Mark for deletion (soft delete)
    await caregiver.update({
      status: CaregiverStatus.TERMINATED,
      deletionRequested: true,
      deletionRequestedAt: new Date(),
      consentHistory: {
        ...caregiver.consentHistory,
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
      entityType: 'CAREGIVER',
      entityId: caregiverId,
      userId: userId,
      changes: {
        operation: 'DELETE_REQUEST',
        reason: 'GDPR_RIGHT_TO_ERASURE',
      },
    });
  }

  private async generateEmployeeId(): Promise<string> {
    const prefix = 'CG';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  }

  private mapToResponseDto(caregiver: Caregiver): CaregiverResponseDto {
    return {
      id: caregiver.id,
      firstName: caregiver.firstName,
      lastName: caregiver.lastName,
      email: caregiver.email,
      phoneNumber: caregiver.phoneNumber,
      dateOfBirth: caregiver.dateOfBirth,
      gender: caregiver.gender,
      homeAddress: caregiver.homeAddress,
      employeeId: caregiver.employeeId,
      locationId: caregiver.locationId,
      startDate: caregiver.startDate,
      employmentType: caregiver.employmentType,
      shiftPreference: caregiver.shiftPreference,
      additionalLocationAssignments: caregiver.additionalLocationAssignments,
      qualificationLevel: caregiver.qualificationLevel,
      yearsOfExperience: caregiver.yearsOfExperience,
      specializations: caregiver.specializations,
      firstAidCprCertified: caregiver.firstAidCprCertified,
      firstAidCprExpiry: caregiver.firstAidCprExpiry,
      additionalCertifications: caregiver.additionalCertifications,
      rightToWorkDocument: caregiver.rightToWorkDocument,
      emergencyContact: caregiver.emergencyContact,
      totpEnabled: caregiver.totpEnabled,
      status: caregiver.status,
      lastLoginAt: caregiver.lastLoginAt,
      createdAt: caregiver.createdAt,
      updatedAt: caregiver.updatedAt,
      // Add computed properties
      fullName: `${caregiver.firstName} ${caregiver.lastName}`,
      isCertificationValid:
        caregiver.firstAidCprCertified && caregiver.firstAidCprExpiry
          ? new Date() < caregiver.firstAidCprExpiry
          : false,
    };
  }
}
