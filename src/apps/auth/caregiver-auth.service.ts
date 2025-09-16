// src/apps/auth/caregiver-auth.service.ts
import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel as InjectSequelizeModel } from '@nestjs/sequelize';
import { Caregiver,CaregiverStatus } from '../../database/models/caregiver.model';
import { Location } from '../../database/models/location.model';
import { AuditService } from '../audit/audit.service';
import { LoginDto } from './dto/login.dto';
import { AdminCaregiverRegistrationDto } from '../caregivers/dto/admin-caregiver-registration.dto';
import * as bcrypt from 'bcrypt';

export interface CaregiverAuthResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    locationId: string;
    employeeId: string;
  };
}

@Injectable()
export class CaregiverAuthService {
  constructor(
    @InjectSequelizeModel(Caregiver)
    private caregiverModel: typeof Caregiver,
    @InjectSequelizeModel(Location)
    private locationModel: typeof Location,
    private jwtService: JwtService,
    private auditService: AuditService,
  ) {}

  async validateCaregiver(email: string, password: string): Promise<Caregiver | null> {
    
    
    const caregiver = await this.caregiverModel.scope('withAuth').findOne({
      where: { email },
      include: [{ model: Location, attributes: ['id', 'name'] }],
    });
    
    if (!caregiver || !(await caregiver.validatePassword(password))) {
      return null;
    }

    return caregiver;
  }

  async login(loginDto: LoginDto, req: any): Promise<CaregiverAuthResponse> {
    const caregiver = await this.validateCaregiver(loginDto.email, loginDto.password);
    

    if (!caregiver) {
      await this.auditService.log({
        action: 'LOGIN',
        entityType: 'Caregiver',
        status: 'FAILURE',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        reason: 'Invalid credentials',
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if caregiver is active
    if (caregiver.status !== 'ACTIVE') {
      await this.auditService.log({
        action: 'LOGIN',
        entityType: 'Caregiver',
        entityId: caregiver.id,
        status: 'FAILURE',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        reason: 'Account not active',
      });
      throw new UnauthorizedException('Account is not active');
    }

    // Update last login
    await caregiver.update({ lastLoginAt: new Date() });

    // Log successful login
    await this.auditService.log({
      action: 'LOGIN',
      entityType: 'Caregiver',
      entityId: caregiver.id,
    //   userId: caregiver.id,
      status: 'SUCCESS',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    const payload = {
      sub: caregiver.id,
      email: caregiver.email,
      role: 'CAREGIVER',
      locationId: caregiver.locationId,
    };

    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: caregiver.id,
        email: caregiver.email,
        firstName: caregiver.firstName,
        lastName: caregiver.lastName,
        role: 'CAREGIVER',
        locationId: caregiver.locationId,
        employeeId: caregiver.employeeId,
      },
    };
  }

  async registerCaregiver(
    registrationDto: AdminCaregiverRegistrationDto,
    createdBy: string,
  ): Promise<Caregiver> {
    // Check if caregiver already exists
    const existingCaregiver = await this.caregiverModel.findOne({
      where: { email: registrationDto.email },
    });

    if (existingCaregiver) {
      throw new BadRequestException('Caregiver with this email already exists');
    }
    const employeeId = await this.generateEmployeeId(registrationDto.locationId);

    // // Hash the password
    // const saltRounds = 12;
    // const hashedPassword = await bcrypt.hash(registrationDto.password, saltRounds);

    // Create caregiver with hashed password
    const caregiver = await this.caregiverModel.create({
      ...registrationDto,
      employeeId,
      status: CaregiverStatus.ACTIVE,
      consentHistory: {
        initialConsent: {
          ...registrationDto.gdprConsent,
          timestamp: new Date(),
          recordedBy: createdBy,
        },
      },
    });

    // Log caregiver creation
    await this.auditService.log({
      action: 'CREATE',
      entityType: 'Caregiver',
      entityId: caregiver.id,
      userId: createdBy,
      changes: { created: { ...registrationDto, password: '[HIDDEN]' } },
      status: 'SUCCESS',
    });

    return caregiver;
  }

  async refreshToken(caregiverId: string): Promise<{ access_token: string }> {
    const caregiver = await this.caregiverModel.findByPk(caregiverId, {
      include: [{ model: Location, attributes: ['id', 'name'] }],
    });

    if (!caregiver || caregiver.status !== CaregiverStatus.ACTIVE) {
      throw new UnauthorizedException('Caregiver not found or inactive');
    }

    const payload = {
      sub: caregiver.id,
      email: caregiver.email,
      role: 'CAREGIVER',
      locationId: caregiver.locationId,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async logout(caregiverId: string, req: any): Promise<void> {
    await this.auditService.log({
      action: 'LOGOUT',
      entityType: 'Caregiver',
      entityId: caregiverId,
      userId: caregiverId,
      status: 'SUCCESS',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });
  }

  async changePassword(
    caregiverId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const caregiver = await this.caregiverModel.scope('withAuth').findByPk(caregiverId);

    if (!caregiver) {
      throw new BadRequestException('Caregiver not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await caregiver.validatePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await caregiver.update({ password: hashedNewPassword });

    // Log password change
    await this.auditService.log({
      action: 'PASSWORD_CHANGE',
      entityType: 'Caregiver',
      entityId: caregiverId,
      userId: caregiverId,
      status: 'SUCCESS',
    });
  }

  async resetPassword(
    caregiverId: string,
    newPassword: string,
    resetBy: string,
  ): Promise<void> {
    const caregiver = await this.caregiverModel.findByPk(caregiverId);

    if (!caregiver) {
      throw new BadRequestException('Caregiver not found');
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await caregiver.update({ password: hashedPassword });

    // Log password reset
    await this.auditService.log({
      action: 'PASSWORD_RESET',
      entityType: 'Caregiver',
      entityId: caregiverId,
      userId: resetBy,
      status: 'SUCCESS',
    });
  }

  private async generateEmployeeId(locationId: string): Promise<string> {
    // Get the location to use its prefix or code
    const location = await this.locationModel.findByPk(locationId);
    const locationPrefix = location?.name?.substring(0, 2).toUpperCase() || 'CG'; // Use location code or default 'CG'
    
    // Get the count of existing caregivers for this location
    const count = await this.caregiverModel.count({
      where: { locationId }
    });
    
    // Generate employeeId: LOCATION_CODE + 4-digit number
    const employeeNumber = (count + 1).toString().padStart(4, '0');
    return `${locationPrefix}${employeeNumber}`;
  }
}