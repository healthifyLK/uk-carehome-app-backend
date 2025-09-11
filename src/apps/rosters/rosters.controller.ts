import {
    Controller,
    Post,
    Get,
    Put,
    Patch,
    Delete,
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
  import { RostersService } from './rosters.service';
  import { RosterCreateDto } from './dto/rosters-create.dto';
  import { RosterResponseDto } from './dto/roster-response.dto';
  import { RolesGuard } from '../../common/guards/roles.guard';
  import { Roles } from '../../common/decorators/roles.decorator';
  import { UserRole } from '../../database/models/user.model';
  
  @ApiTags('Rosters')
  @Controller('rosters')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  export class RostersController {
    constructor(private readonly rostersService: RostersService) {}
  
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Create a new roster entry' })
    @ApiResponse({
      status: 201,
      description: 'Roster created successfully',
      type: RosterResponseDto,
    })
    async createRoster(
      @Body() rosterData: RosterCreateDto,
      @Request() req,
    ): Promise<RosterResponseDto> {
      return this.rostersService.createRoster(rosterData, req.user.id);
    }
  
    @Get()
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CAREGIVER)
    @ApiOperation({ summary: 'Get rosters by date range' })
    @ApiQuery({ name: 'startDate', required: true, description: 'Start date (YYYY-MM-DD)' })
    @ApiQuery({ name: 'endDate', required: true, description: 'End date (YYYY-MM-DD)' })
    @ApiQuery({ name: 'locationId', required: false, description: 'Filter by location ID' })
    @ApiResponse({
      status: 200,
      description: 'Rosters retrieved successfully',
      type: [RosterResponseDto],
    })
    async getRosters(
      @Query('startDate') startDate: string,
      @Query('endDate') endDate: string,
      @Query('locationId') locationId?: string,
    ): Promise<RosterResponseDto[]> {
      return this.rostersService.getRostersByDateRange(startDate, endDate, locationId);
    }
  
    @Get(':id')
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CAREGIVER)
    @ApiOperation({ summary: 'Get roster by ID' })
    @ApiResponse({
      status: 200,
      description: 'Roster retrieved successfully',
      type: RosterResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Roster not found' })
    async getRoster(@Param('id') rosterId: string): Promise<RosterResponseDto> {
      return this.rostersService.getRosterById(rosterId);
    }
  
    @Put(':id')
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Update roster' })
    @ApiResponse({
      status: 200,
      description: 'Roster updated successfully',
      type: RosterResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Roster not found' })
    async updateRoster(
      @Param('id') rosterId: string,
      @Body() updateData: Partial<RosterCreateDto>,
      @Request() req,
    ): Promise<RosterResponseDto> {
      return this.rostersService.updateRoster(rosterId, updateData, req.user.id);
    }
  
    @Patch(':id/confirm')
    @Roles(UserRole.CAREGIVER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Confirm shift' })
    @ApiResponse({
      status: 200,
      description: 'Shift confirmed successfully',
      type: RosterResponseDto,
    })
    async confirmShift(
      @Param('id') rosterId: string,
      @Request() req,
    ): Promise<RosterResponseDto> {
      return this.rostersService.confirmShift(rosterId, req.user.id);
    }
  
    @Patch(':id/start')
    @Roles(UserRole.CAREGIVER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Start shift' })
    @ApiResponse({
      status: 200,
      description: 'Shift started successfully',
      type: RosterResponseDto,
    })
    async startShift(
      @Param('id') rosterId: string,
      @Request() req,
    ): Promise<RosterResponseDto> {
      return this.rostersService.startShift(rosterId, req.user.id);
    }
  
    @Patch(':id/complete')
    @Roles(UserRole.CAREGIVER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Complete shift' })
    @ApiResponse({
      status: 200,
      description: 'Shift completed successfully',
      type: RosterResponseDto,
    })
    async completeShift(
      @Param('id') rosterId: string,
      @Request() req,
    ): Promise<RosterResponseDto> {
      return this.rostersService.completeShift(rosterId, req.user.id);
    }
  
    @Delete(':id')
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Delete roster' })
    @ApiResponse({ status: 200, description: 'Roster deleted successfully' })
    @ApiResponse({ status: 404, description: 'Roster not found' })
    async deleteRoster(
      @Param('id') rosterId: string,
      @Request() req,
    ): Promise<void> {
      return this.rostersService.deleteRoster(rosterId, req.user.id);
    }
  }