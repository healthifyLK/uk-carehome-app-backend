import { Controller, Get, Post, Body, Param, UseGuards,Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RoomBedsService } from './rooms.service';
import { CreateRoomBedDto } from './dto/create-room.dto';
import { RoomBedResponseDto } from './dto/room-response.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../database/models/user.model';

@ApiTags('Room Beds')
@Controller('room-beds')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class RoomBedsController {
  constructor(private readonly roomBedsService: RoomBedsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new room/bed' })
  @ApiResponse({
    status: 201,
    description: 'Room/Bed created successfully',
    type: RoomBedResponseDto,
  })
  async createRoomBed(@Body() createRoomBedDto: CreateRoomBedDto): Promise<RoomBedResponseDto> {
    return this.roomBedsService.createRoomBed(createRoomBedDto);
  }

  @Get('location/:locationId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CAREGIVER)
  @ApiOperation({ summary: 'Get all room/beds for a location' })
  @ApiResponse({
    status: 200,
    description: 'Room/Beds retrieved successfully',
    type: [RoomBedResponseDto],
  })
  async getRoomBedsByLocation(@Param('locationId') locationId: string): Promise<RoomBedResponseDto[]> {
    return this.roomBedsService.getRoomBedsByLocation(locationId);
  }

  @Get('location/:locationId/available')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CAREGIVER)
  @ApiOperation({ summary: 'Get available room/beds for a location' })
  @ApiResponse({
    status: 200,
    description: 'Available room/beds retrieved successfully',
    type: [RoomBedResponseDto],
  })
  async getAvailableRoomBeds(@Param('locationId') locationId: string): Promise<RoomBedResponseDto[]> {
    return this.roomBedsService.getAvailableRoomBeds(locationId);
  }

  @Post('assign')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Assign a care receiver to an available bed' })
  @ApiResponse({
    status: 200,
    description: 'Care receiver assigned to bed successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 404, description: 'Care receiver or room/bed not found' })
  async assignCareReceiverToBed(
    @Body() body: { careReceiverId: string; roomBedId: string },
    @Request() req,
  ) {
    return this.roomBedsService.assignCareReceiverToBed(
      body.careReceiverId,
      body.roomBedId,
      req.user.id,
    );
  }

  @Post('unassign/:careReceiverId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Unassign a care receiver from their current bed' })
  @ApiResponse({
    status: 200,
    description: 'Care receiver unassigned from bed successfully',
  })
  @ApiResponse({ status: 400, description: 'Care receiver is not assigned to any bed' })
  @ApiResponse({ status: 404, description: 'Care receiver not found' })
  async unassignCareReceiverFromBed(
    @Param('careReceiverId') careReceiverId: string,
    @Request() req,
  ) {
    return this.roomBedsService.unassignCareReceiverFromBed(
      careReceiverId,
      req.user.id,
    );
  }

  @Get('assignment/:careReceiverId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CAREGIVER)
  @ApiOperation({ summary: 'Get room/bed assignment details for a care receiver' })
  @ApiResponse({
    status: 200,
    description: 'Assignment details retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Care receiver not found' })
  async getCareReceiverBedAssignment(@Param('careReceiverId') careReceiverId: string) {
    return this.roomBedsService.getCareReceiverBedAssignment(careReceiverId);
  }

  
}