import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User, UserRole, UserStatus } from '../../database/models/user.model';
import { Caregiver } from '../../database/models/caregiver.model';
import { Location } from '../../database/models/location.model';
import { AuditLog } from '../../database/models/audit-log.model';
import { NotificationService } from '../../common/services/notification.service';
import { PasswordGeneratorUtil } from '../../common/utils/password-generator.util';
import { CreateAdminDto } from './dto/create-admin.dto';
import { PromoteCaregiverDto } from './dto/promote-caregiver.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminManagementService {
  constructor(
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(Caregiver) private readonly caregiverModel: typeof Caregiver,
    @InjectModel(Location) private readonly locationModel: typeof Location,
    @InjectModel(AuditLog) private readonly auditLogModel: typeof AuditLog,
    private readonly notificationService: NotificationService,
    private readonly passwordGenerator: PasswordGeneratorUtil,
    private readonly configService: ConfigService,
  ) {}

  async createAdminProfile(dto: CreateAdminDto, createdBy: string): Promise<{ user: User; password: string }> {
    // Validate location exists
    const location = await this.locationModel.findByPk(dto.locationId);
    if (!location) {
      throw new BadRequestException('Invalid location ID');
    }

    // Check if email already exists
    const existingUser = await this.userModel.findOne({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    // Generate secure password
    const password = this.passwordGenerator.generateSecurePassword();

    // Create admin user
    const adminUser = await this.userModel.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      password: password, // Will be hashed by the model hook
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      locationId: dto.locationId,
      phoneNumber: dto.phoneNumber,
      consentHistory: {
        dataProcessing: {
          consented: true,
          timestamp: new Date(),
          version: '1.0',
        },
      },
    });

    // Send credentials email
    await this.notificationService.sendCredentialsEmail(
      dto.email,
      dto.firstName,
      dto.lastName,
      'ADMIN',
      {
        email: dto.email,
        password: password,
        loginUrl: this.configService.get('FRONTEND_URL', 'http://localhost:3000/login'),
      },
      location.name
    );

    // Log admin creation
    await this.auditLogModel.create({
      action: 'CREATE',
      entityType: 'Admin',
      entityId: adminUser.id,
      userId: createdBy,
      changes: { 
        created: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          role: 'ADMIN',
          locationId: dto.locationId,
        }
      },
      status: 'SUCCESS',
      purpose: 'Admin Profile Creation',
    });

    return { user: adminUser, password };
  }

  async promoteCaregiverToAdmin(dto: PromoteCaregiverDto, promotedBy: string): Promise<{ user: User; password: string }> {
    // Find caregiver
    const caregiver = await this.caregiverModel.findByPk(dto.caregiverId, {
      include: ['location'],
    });
    if (!caregiver) {
      throw new NotFoundException('Caregiver not found');
    }

    // Check if caregiver already has a user account
    const existingUser = await this.userModel.findOne({
      where: { email: caregiver.email },
    });
    if (existingUser) {
      throw new BadRequestException('Caregiver already has a user account');
    }

    // Generate secure password
    const password = this.passwordGenerator.generateSecurePassword();

    // Create admin user from caregiver data
    const adminUser = await this.userModel.create({
      firstName: caregiver.firstName,
      lastName: caregiver.lastName,
      email: caregiver.email,
      password: password, // Will be hashed by the model hook
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      locationId: caregiver.locationId,
      phoneNumber: caregiver.phoneNumber,
      consentHistory: caregiver.consentHistory,
    });

    // Send credentials email
    await this.notificationService.sendCredentialsEmail(
      caregiver.email,
      caregiver.firstName,
      caregiver.lastName,
      'ADMIN',
      {
        email: caregiver.email,
        password: password,
        loginUrl: this.configService.get('FRONTEND_URL', 'http://localhost:3000/login'),
      },
      caregiver.location?.name
    );

    // Log caregiver promotion
    await this.auditLogModel.create({
      action: 'PROMOTE',
      entityType: 'Caregiver to Admin',
      entityId: caregiver.id,
      userId: promotedBy,
      changes: { 
        promoted: {
          caregiverId: caregiver.id,
          newRole: 'ADMIN',
          locationId: caregiver.locationId,
        }
      },
      status: 'SUCCESS',
      purpose: 'Caregiver Promotion to Admin',
    });

    return { user: adminUser, password };
  }

  async listAdmins(locationId?: string): Promise<User[]> {
    const whereClause: any = { role: UserRole.ADMIN };
    if (locationId) {
      whereClause.locationId = locationId;
    }

    return this.userModel.findAll({
      where: whereClause,
      include: ['location'],
      order: [['createdAt', 'DESC']],
    });
  }
}