// src/apps/caregivers/caregivers.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Param, 
  Body, 
  UseGuards,
  Patch,
  Req
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { LocationAccessGuard } from '../../common/guards/location-access.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../database/models/user.model';
import { CaregiversService } from './caregivers.service';
import { CaregiverAuthService } from '../auth/caregiver-auth.service';
import { AdminCaregiverRegistrationDto } from './dto/admin-caregiver-registration.dto';
import { CaregiverResponseDto } from './dto/caregivers-response.dto';
import { CaregiverStatus } from '../../database/models/caregiver.model';

@ApiTags('Caregivers')
@Controller('caregivers')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class CaregiversController {
  constructor(
    private readonly caregiversService: CaregiversService,
    private readonly caregiverAuthService: CaregiverAuthService,
  ) {}

  @Post('register')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Register a new caregiver (Admin only)' })
  @ApiResponse({ status: 201, description: 'Caregiver registered successfully', type: CaregiverResponseDto })
  async registerCaregiver(
    @Body() registrationDto: AdminCaregiverRegistrationDto,
    @CurrentUser() user: any,
  ): Promise<CaregiverResponseDto> {
    const caregiver = await this.caregiverAuthService.registerCaregiver(
      registrationDto,
      user.id,
    );
    return this.caregiversService.getCaregiverById(caregiver.id);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all caregivers' })
  async getAllCaregivers(@Req() req: any): Promise<CaregiverResponseDto[]> {
    return this.caregiversService.getAllCaregivers(req.user.locationId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get caregiver by ID' })
  async getCaregiverById(@Param('id') id: string): Promise<CaregiverResponseDto> {
    return this.caregiversService.getCaregiverById(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update caregiver' })
  async updateCaregiver(
    @Param('id') id: string,
    @Body() updateData: Partial<AdminCaregiverRegistrationDto>,
    @CurrentUser() user: any,
  ): Promise<CaregiverResponseDto> {
    return this.caregiversService.updateCaregiver(id, updateData, user.id);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update caregiver status' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: CaregiverStatus },
    @CurrentUser() user: any,
  ): Promise<CaregiverResponseDto> {
    return this.caregiversService.updateStatus(id, body.status, user.id);
  }

  @Put(':id/certification')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update caregiver certification' })
  async updateCertification(
    @Param('id') id: string,
    @Body() certificationData: any,
    @CurrentUser() user: any,
  ): Promise<void> {
    return this.caregiversService.updateCertification(id, certificationData, user.id);
  }

  @Post(':id/request-deletion')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Request caregiver data deletion' })
  async requestDataDeletion(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ): Promise<void> {
    return this.caregiversService.requestDataDeletion(id, user.id);
  }

  @Post(':id/reset-password')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Reset caregiver password (Admin only)' })
  async resetPassword(
    @Param('id') id: string,
    @Body() body: { newPassword: string },
    @CurrentUser() user: any,
  ): Promise<{ message: string }> {
    await this.caregiverAuthService.resetPassword(id, body.newPassword, user.id);
    return { message: 'Password reset successfully' };
  }
}