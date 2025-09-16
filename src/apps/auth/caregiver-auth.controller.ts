// src/apps/auth/caregiver-auth.controller.ts
import { Controller, Post, Body, Request, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/sequelize';
import { Caregiver } from '../../database/models/caregiver.model';
import { Location } from 'src/database/models/location.model';
import { LoginDto } from './dto/login.dto';
import { AuditService } from '../audit/audit.service';
import { CaregiverAuthService } from './caregiver-auth.service';

@ApiTags('Caregiver Authentication')
@Controller('auth/caregiver')
export class CaregiverAuthController {
  constructor(
    @InjectModel(Caregiver) private caregiverModel: typeof Caregiver,
    private jwtService: JwtService,
    private auditService: AuditService,
    private caregiverAuthService:CaregiverAuthService
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'Caregiver login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto, @Request() req) {
    return this.caregiverAuthService.login(loginDto, req);
  }
}