import {
    Controller,
    Get,
    Post,
    Put,
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
  import { LocationsService } from './locations.service';
  import { CreateLocationDto } from './dto/create-location.dto';
  import { UpdateLocationDto } from './dto/update-location.dto';
  import { LocationResponseDto } from './dto/location-response.dto';
  import { RolesGuard } from '../../common/guards/roles.guard';
  import { Roles } from '../../common/decorators/roles.decorator';
  import { UserRole } from '../../database/models/user.model';
  
  @ApiTags('Locations')
  @Controller('locations')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  export class LocationsController {
    constructor(private readonly locationsService: LocationsService) {}
  
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Create a new location' })
    @ApiResponse({
      status: 201,
      description: 'Location created successfully',
      type: LocationResponseDto,
    })
    @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
    async createLocation(
      @Body() createLocationDto: CreateLocationDto,
      @Request() req,
    ): Promise<LocationResponseDto> {
      return this.locationsService.createLocation(
        createLocationDto,
        req.user.id,
      );
    }
  
    @Get()
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @ApiOperation({ summary: 'Get all locations' })
    @ApiQuery({ name: 'includeStats', required: false, description: 'Include statistics' })
    @ApiResponse({
      status: 200,
      description: 'Locations retrieved successfully',
      type: [LocationResponseDto],
    })
    async getAllLocations(
      @Query('includeStats') includeStats?: boolean,
    ): Promise<LocationResponseDto[]> {
      return this.locationsService.getAllLocations(includeStats);
    }
  
    @Get(':id')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CAREGIVER)
    @ApiOperation({ summary: 'Get location by ID' })
    @ApiQuery({ name: 'includeStats', required: false, description: 'Include statistics' })
    @ApiResponse({
      status: 200,
      description: 'Location retrieved successfully',
      type: LocationResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Location not found' })
    async getLocationById(
      @Param('id') locationId: string,
      @Query('includeStats') includeStats?: boolean,
    ): Promise<LocationResponseDto> {
      return this.locationsService.getLocationById(locationId, includeStats);
    }
  
    @Put(':id')
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Update location' })
    @ApiResponse({
      status: 200,
      description: 'Location updated successfully',
      type: LocationResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Location not found' })
    async updateLocation(
      @Param('id') locationId: string,
      @Body() updateLocationDto: UpdateLocationDto,
      @Request() req,
    ): Promise<LocationResponseDto> {
      return this.locationsService.updateLocation(
        locationId,
        updateLocationDto,
        req.user.id,
      );
    }
  
    @Delete(':id')
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Delete location' })
    @ApiResponse({ status: 200, description: 'Location deleted successfully' })
    @ApiResponse({ status: 404, description: 'Location not found' })
    @ApiResponse({ status: 400, description: 'Cannot delete location with associated data' })
    async deleteLocation(
      @Param('id') locationId: string,
      @Request() req,
    ): Promise<void> {
      return this.locationsService.deleteLocation(locationId, req.user.id);
    }
  
    @Get(':id/stats')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @ApiOperation({ summary: 'Get location statistics' })
    @ApiResponse({ status: 200, description: 'Location statistics retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Location not found' })
    async getLocationStats(@Param('id') locationId: string) {
      return this.locationsService.getLocationStats(locationId);
    }
  
    @Get(':id/room-beds/available')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CAREGIVER)
    @ApiOperation({ summary: 'Get available room/beds for location' })
    @ApiResponse({ status: 200, description: 'Available room/beds retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Location not found' })
    async getAvailableRoomBeds(@Param('id') locationId: string) {
      return this.locationsService.getAvailableRoomBeds(locationId);
    }
  }