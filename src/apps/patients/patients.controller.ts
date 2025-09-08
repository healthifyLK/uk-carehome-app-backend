import {
    Controller,
    Post,
    Get,
    Put,
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
  import { PatientsService } from './patients.service';
  import { PatientRegistrationDto } from './dto/patient-registration.dto';
  import { PatientResponseDto } from './dto/patient-response.dto';
  import { RolesGuard } from '../../common/guards/roles.guard';
  import { Roles } from '../../common/decorators/roles.decorator';
  import { UserRole } from '../../database/models/user.model';
  
  @ApiTags('Patients')
  @Controller('patients')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  export class PatientsController {
    constructor(private readonly patientsService: PatientsService) {}
  
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Register a new patient with GDPR compliance' })
    @ApiResponse({
      status: 201,
      description: 'Patient registered successfully',
      type: PatientResponseDto,
    })
    @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
    @ApiResponse({ status: 404, description: 'Location or Room/Bed not found' })
    async registerPatient(
      @Body() registrationData: PatientRegistrationDto,
      @Request() req,
    ): Promise<PatientResponseDto> {
      return this.patientsService.registerPatient(
        registrationData,
        req.user.id,
      );
    }
  
    @Get()
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CAREGIVER)
    @ApiOperation({ summary: 'Get all patients' })
    @ApiQuery({ name: 'locationId', required: false, description: 'Filter by location ID' })
    @ApiResponse({
      status: 200,
      description: 'Patients retrieved successfully',
      type: [PatientResponseDto],
    })
    async getAllPatients(
      @Query('locationId') locationId?: string,
    ): Promise<PatientResponseDto[]> {
      return this.patientsService.getAllPatients(locationId);
    }
  
    @Get(':id')
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CAREGIVER)
    @ApiOperation({ summary: 'Get patient details by ID' })
    @ApiResponse({
      status: 200,
      description: 'Patient details retrieved successfully',
      type: PatientResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Patient not found' })
    async getPatient(@Param('id') patientId: string): Promise<PatientResponseDto> {
      return this.patientsService.getPatientById(patientId);
    }
  
    @Put(':id')
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Update patient information' })
    @ApiResponse({
      status: 200,
      description: 'Patient updated successfully',
      type: PatientResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Patient not found' })
    async updatePatient(
      @Param('id') patientId: string,
      @Body() updateData: Partial<PatientRegistrationDto>,
      @Request() req,
    ): Promise<PatientResponseDto> {
      return this.patientsService.updatePatient(
        patientId,
        updateData,
        req.user.id,
      );
    }
  
    @Put(':id/gdpr-consent')
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Update GDPR consent for a patient' })
    @ApiResponse({ status: 200, description: 'Consent updated successfully' })
    @ApiResponse({ status: 404, description: 'Patient not found' })
    async updateGdprConsent(
      @Param('id') patientId: string,
      @Body() consentData: any,
      @Request() req,
    ): Promise<void> {
      return this.patientsService.updateGdprConsent(
        patientId,
        consentData,
        req.user.id,
      );
    }
  
    @Post(':id/request-deletion')
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Request data deletion for GDPR compliance' })
    @ApiResponse({ status: 200, description: 'Deletion request submitted' })
    @ApiResponse({ status: 404, description: 'Patient not found' })
    async requestDataDeletion(
      @Param('id') patientId: string,
      @Request() req,
    ): Promise<void> {
      return this.patientsService.requestDataDeletion(
        patientId,
        req.user.id,
      );
    }
  
    @Post(':id/discharge')
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Discharge a patient' })
    @ApiResponse({ status: 200, description: 'Patient discharged successfully' })
    @ApiResponse({ status: 404, description: 'Patient not found' })
    async dischargePatient(
      @Param('id') patientId: string,
      @Request() req,
    ): Promise<void> {
      return this.patientsService.dischargePatient(
        patientId,
        req.user.id,
      );
    }
  }