import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/sequelize';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { User, UserRole } from '../../database/models';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User) private userModel: typeof User,
    private jwtService: JwtService,
    private auditService: AuditService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userModel.scope('withAuth').findOne({
      where: { email },
    });

    if (user && await user.validatePassword(password)) {
      return user;
    }
    return null;
  }

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    
    if (!user) {
      await this.auditService.log({
        action: 'LOGIN',
        entityType: 'User',
        status: 'FAILURE',
        ipAddress,
        userAgent,
        reason: 'Invalid credentials',
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check TOTP if enabled
    if (user.totpEnabled) {
      if (!loginDto.totpCode) {
        throw new BadRequestException('TOTP code required');
      }

      const verified = speakeasy.totp.verify({
        secret: user.totpSecret,
        encoding: 'base32',
        token: loginDto.totpCode,
        window: 2,
      });

      if (!verified) {
        await this.auditService.log({
          action: 'LOGIN',
          entityType: 'User',
          entityId: user.id,
          userId: user.id,
          status: 'FAILURE',
          ipAddress,
          userAgent,
          reason: 'Invalid TOTP code',
        });
        throw new UnauthorizedException('Invalid TOTP code');
      }
    }

    // Update last login
    await user.update({ lastLoginAt: new Date() });

    // Log successful login
    await this.auditService.log({
      action: 'LOGIN',
      entityType: 'User',
      entityId: user.id,
      userId: user.id,
      status: 'SUCCESS',
      ipAddress,
      userAgent,
    });

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      locationId: user.locationId,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        locationId: user.locationId,
      },
    };
  }

  async register(registerDto: RegisterDto, createdBy?: string) {
    const existingUser = await this.userModel.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const user = await this.userModel.create({
      ...registerDto,
      consentHistory: {
        dataProcessing: {
          consented: true,
          timestamp: new Date(),
          version: '1.0',
        },
      },
    });

    // Log user creation
    await this.auditService.log({
      action: 'CREATE',
      entityType: 'User',
      entityId: user.id,
      userId: createdBy,
      changes: { created: registerDto },
      status: 'SUCCESS',
    });

    return user;
  }

  async enableTotp(userId: string) {
    const secret = speakeasy.generateSecret({
      name: `CareHome:${userId}`,
    });

    await this.userModel.update(
      { totpSecret: secret.base32 },
      { where: { id: userId } },
    );

    const qrCode = await qrcode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCode,
    };
  }

  async verifyTotp(userId: string, token: string) {
    const user = await this.userModel.scope('withAuth').findByPk(userId);
    
    if (!user || !user.totpSecret) {
      throw new BadRequestException('TOTP not set up');
    }

    const verified = speakeasy.totp.verify({
      secret: user.totpSecret,
      encoding: 'base32',
      token,
      window: 2,
    });

    if (verified) {
      await user.update({ totpEnabled: true });
      return { success: true };
    }

    throw new BadRequestException('Invalid TOTP code');
  }
}