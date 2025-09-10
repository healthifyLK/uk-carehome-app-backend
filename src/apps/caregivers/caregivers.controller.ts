import {
    Controller,
    Post,
    Get,
    Put,
    Patch,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
    HttpCode,
    HttpStatus,
  } from '@nestjs/common';
  import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
  import { AuthGuard } from '@nestjs/passport';
  import { CaregiversService } from './caregivers.service';
  import { CaregiverRegistrationDto } from './dto/caregivers-registration.dto';
  import { CaregiverResponseDto } from './dto/caregivers-response.dto';
  import { RolesGuard } from '../../common/guards/roles.guard';
  import { Roles } from '../../common/decorators/roles.decorator';
  import { UserRole } from '../../database/models/user.model';
  import { CaregiverStatus } from '../../database/models/caregiver.model';
import { CareReceiverResponseDto } from '../patients/dto/care-receiver-response.dto';
import { CareReceiverRegistrationDto } from '../patients/dto/care-receiver-registration.dto';
  
  @ApiTags('Caregivers')
  @Controller('caregivers')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  export class CaregiversController {
    constructor(private readonly caregiversService: CaregiversService) {}
  
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Register a new caregiver with comprehensive data and GDPR compliance' })
    @ApiResponse({
      status: 201,
      description: 'Caregiver registered successfully',
      type: CaregiverResponseDto,
    })
    @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
    @ApiResponse({ status: 404, description: 'Location not found' })
    async registerCaregiver(
      @Body() registrationData: CaregiverRegistrationDto,
      @Request() req,
    ): Promise<CareReceiverResponseDto> {
      return this.caregiversService.registerCaregiver(
        registrationData,
        req.user.id,
      );
    }
  
    @Get()
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CAREGIVER)
    @ApiOperation({ summary: 'Get all caregivers' })
    @ApiQuery({ name: 'locationId', required: false, description: 'Filter by location ID' })
    @ApiResponse({
      status: 200,
      description: 'Caregivers retrieved successfully',
      type: [CaregiverResponseDto],
    })
    async getAllCaregivers(
      @Query('locationId') locationId?: string,
    ): Promise<CareReceiverResponseDto[]> {
      return this.caregiversService.getAllCaregivers(locationId);
    }
  
    @Get(':id')
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CAREGIVER)
    @ApiOperation({ summary: 'Get caregiver details by ID' })
    @ApiResponse({
      status: 200,
      description: 'Caregiver details retrieved successfully',
      type: CaregiverResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Caregiver not found' })
    async getCaregiver(@Param('id') caregiverId: string): Promise<CareReceiverResponseDto> {
      return this.caregiversService.getCaregiverById(caregiverId);
    }
  
    @Put(':id')
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Update caregiver information' })
    @ApiResponse({
      status: 200,
      description: 'Caregiver updated successfully',
      type: CaregiverResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Caregiver not found' })
    async updateCaregiver(
      @Param('id') caregiverId: string,
      @Body() updateData: Partial<CareReceiverRegistrationDto>,
      @Request() req,
    ): Promise<CareReceiverResponseDto> {
      return this.caregiversService.updateCaregiver(
        caregiverId,
        updateData,
        req.user.id,
      );
    }
  
    @Patch(':id/status')
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Update caregiver status' })
    @ApiResponse({
      status: 200,
      description: 'Caregiver status updated successfully',
      type: CaregiverResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Caregiver not found' })
    async updateStatus(
      @Param('id') caregiverId: string,
      @Body() body: { status: CaregiverStatus },
      @Request() req,
    ): Promise<CareReceiverResponseDto> {
      return this.caregiversService.updateStatus(
        caregiverId,
        body.status,
        req.user.id,
      );
    }
  
    @Put(':id/certification')
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Update caregiver certifications' })
    @ApiResponse({ status: 200, description: 'Certification updated successfully' })
    @ApiResponse({ status: 404, description: 'Caregiver not found' })
    async updateCertification(
      @Param('id') caregiverId: string,
      @Body() certificationData: any,
      @Request() req,
    ): Promise<void> {
      return this.caregiversService.updateCertification(
        caregiverId,
        certificationData,
        req.user.id,
      );
    }
  
    @Post(':id/request-deletion')
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Request data deletion for GDPR compliance' })
    @ApiResponse({ status: 200, description: 'Deletion request submitted' })
    @ApiResponse({ status: 404, description: 'Caregiver not found' })
    async requestDataDeletion(
      @Param('id') caregiverId: string,
      @Request() req,
    ): Promise<void> {
      return this.caregiversService.requestDataDeletion(
        caregiverId,
        req.user.id,
      );
    }
  }