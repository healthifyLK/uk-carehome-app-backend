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
import { CareReceiversService } from './care-receiver.service';
import { CareReceiverRegistrationDto } from './dto/care-receiver-registration.dto';
import { CareReceiverResponseDto } from './dto/care-receiver-response.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../database/models/user.model';

@ApiTags('Care Receivers')
@Controller('care-receivers')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class CareReceiversController {
  constructor(private readonly careReceiversService: CareReceiversService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Register a new care receiver with comprehensive data and GDPR compliance' })
  @ApiResponse({
    status: 201,
    description: 'Care receiver registered successfully',
    type: CareReceiverResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 404, description: 'Location or Room/Bed not found' })
  async registerCareReceiver(
    @Body() registrationData: CareReceiverRegistrationDto,
    @Request() req,
  ): Promise<CareReceiverResponseDto> {
    return this.careReceiversService.registerCareReceiver(
      registrationData,
      req.user.id,
    );
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CAREGIVER)
  @ApiOperation({ summary: 'Get all care receivers' })
  @ApiQuery({ name: 'locationId', required: false, description: 'Filter by location ID' })
  @ApiResponse({
    status: 200,
    description: 'Care receivers retrieved successfully',
    type: [CareReceiverResponseDto],
  })
  async getAllCareReceivers(
    @Query('locationId') locationId?: string,
  ): Promise<CareReceiverResponseDto[]> {
    return this.careReceiversService.getAllCareReceivers(locationId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CAREGIVER)
  @ApiOperation({ summary: 'Get care receiver details by ID' })
  @ApiResponse({
    status: 200,
    description: 'Care receiver details retrieved successfully',
    type: CareReceiverResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Care receiver not found' })
  async getCareReceiver(@Param('id') careReceiverId: string): Promise<CareReceiverResponseDto> {
    return this.careReceiversService.getCareReceiverById(careReceiverId);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update care receiver information' })
  @ApiResponse({
    status: 200,
    description: 'Care receiver updated successfully',
    type: CareReceiverResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Care receiver not found' })
  async updateCareReceiver(
    @Param('id') careReceiverId: string,
    @Body() updateData: Partial<CareReceiverRegistrationDto>,
    @Request() req,
  ): Promise<CareReceiverResponseDto> {
    return this.careReceiversService.updateCareReceiver(
      careReceiverId,
      updateData,
      req.user.id,
    );
  }

  @Put(':id/gdpr-consent')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update GDPR consent for a care receiver' })
  @ApiResponse({ status: 200, description: 'Consent updated successfully' })
  @ApiResponse({ status: 404, description: 'Care receiver not found' })
  async updateGdprConsent(
    @Param('id') careReceiverId: string,
    @Body() consentData: any,
    @Request() req,
  ): Promise<void> {
    return this.careReceiversService.updateGdprConsent(
      careReceiverId,
      consentData,
      req.user.id,
    );
  }

  @Post(':id/request-deletion')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Request data deletion for GDPR compliance' })
  @ApiResponse({ status: 200, description: 'Deletion request submitted' })
  @ApiResponse({ status: 404, description: 'Care receiver not found' })
  async requestDataDeletion(
    @Param('id') careReceiverId: string,
    @Request() req,
  ): Promise<void> {
    return this.careReceiversService.requestDataDeletion(
      careReceiverId,
      req.user.id,
    );
  }

  @Post(':id/discharge')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Discharge a care receiver' })
  @ApiResponse({ status: 200, description: 'Care receiver discharged successfully' })
  @ApiResponse({ status: 404, description: 'Care receiver not found' })
  async dischargeCareReceiver(
    @Param('id') careReceiverId: string,
    @Request() req,
  ): Promise<void> {
    return this.careReceiversService.dischargeCareReceiver(
      careReceiverId,
      req.user.id,
    );
  }

  @Put(':id/health-metrics')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CAREGIVER)
  @ApiOperation({ summary: 'Update health metrics for a care receiver' })
  @ApiResponse({ status: 200, description: 'Health metrics updated successfully' })
  @ApiResponse({ status: 404, description: 'Care receiver not found' })
  async updateHealthMetrics(
    @Param('id') careReceiverId: string,
    @Body() healthMetrics: any,
    @Request() req,
  ): Promise<void> {
    return this.careReceiversService.updateHealthMetrics(
      careReceiverId,
      healthMetrics,
      req.user.id,
    );
  }

  @Post(':id/care-logs')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CAREGIVER)
  @ApiOperation({ summary: 'Add a care log entry for a care receiver' })
  @ApiResponse({ status: 201, description: 'Care log added successfully' })
  @ApiResponse({ status: 404, description: 'Care receiver not found' })
  async addCareLog(
    @Param('id') careReceiverId: string,
    @Body() careLog: any,
    @Request() req,
  ): Promise<void> {
    return this.careReceiversService.addCareLog(
      careReceiverId,
      careLog,
      req.user.id,
    );
  }

  @Post(':id/incident-reports')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CAREGIVER)
  @ApiOperation({ summary: 'Add an incident report for a care receiver' })
  @ApiResponse({ status: 201, description: 'Incident report added successfully' })
  @ApiResponse({ status: 404, description: 'Care receiver not found' })
  async addIncidentReport(
    @Param('id') careReceiverId: string,
    @Body() incidentReport: any,
    @Request() req,
  ): Promise<void> {
    return this.careReceiversService.addIncidentReport(
      careReceiverId,
      incidentReport,
      req.user.id,
    );
  }
}