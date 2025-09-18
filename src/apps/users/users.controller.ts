import {
  Controller,
  Get,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { AdminManagementService } from './admin-management.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../database/models/user.model';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { PromoteCaregiverDto } from './dto/promote-caregiver.dto';

@ApiTags('Users')
@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly adminManagementService: AdminManagementService,
  ) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'List users' })
  @ApiResponse({ status: 200, type: [UserResponseDto] })
  list(@Query() query: QueryUsersDto) {
    return this.usersService.list(query);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get user by id' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  get(@Param('id') id: string) {
    return this.usersService.get(id);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user (no password here)' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto, @Request() req) {
    return this.usersService.update(id, dto, req.user.id);
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user status' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @Request() req,
  ) {
    return this.usersService.updateStatus(id, dto, req.user.id);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete user (soft delete enabled in models)' })
  remove(@Param('id') id: string, @Request() req) {
    return this.usersService.remove(id, req.user.id);
  }

  @Post('admin/create')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create admin profile' })
  @ApiResponse({
    status: 201,
    description: 'Admin profile created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data or email already exists',
  })
  async createAdmin(@Body() dto: CreateAdminDto, @Request() req) {
    return this.adminManagementService.createAdminProfile(dto, req.user.id);
  }

  @Post('admin/promote-caregiver')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Promote caregiver to admin' })
  @ApiResponse({
    status: 201,
    description: 'Caregiver promoted to admin successfully',
  })
  @ApiResponse({ status: 404, description: 'Caregiver not found' })
  async promoteCaregiver(@Body() dto: PromoteCaregiverDto, @Request() req) {
    return this.adminManagementService.promoteCaregiverToAdmin(
      dto,
      req.user.id,
    );
  }

  @Get('admin/list')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all admins' })
  @ApiResponse({ status: 200, description: 'List of admins' })
  async listAdmins(@Query('locationId') locationId?: string) {
    return this.adminManagementService.listAdmins(locationId);
  }
}
