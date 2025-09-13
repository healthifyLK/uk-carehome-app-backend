import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { RoomBed } from '../../database/models/room-bed.model';
import { Location } from '../../database/models/location.model';
import { AuditLog } from 'src/database/models';
import { CareReceiver } from 'src/database/models';
import { CreateRoomBedDto } from './dto/create-room.dto';
import { RoomBedResponseDto } from './dto/room-response.dto';

@Injectable()
export class RoomBedsService {
  constructor(
    @InjectModel(RoomBed)
    private readonly roomBedModel: typeof RoomBed,
    @InjectModel(Location)
    private readonly locationModel: typeof Location,
    @InjectModel(CareReceiver)
    private readonly careReceiverModel: typeof CareReceiver,
    @InjectModel(AuditLog)
    private readonly auditLogModel: typeof AuditLog,
  ) {}

  async createRoomBed(
    createRoomBedDto: CreateRoomBedDto,
  ): Promise<RoomBedResponseDto> {
    // Validate location exists
    const location = await this.locationModel.findByPk(
      createRoomBedDto.locationId,
    );
    if (!location) {
      throw new NotFoundException('Location not found');
    }

    // Check if room/bed combination already exists
    const existingRoomBed = await this.roomBedModel.findOne({
      where: {
        roomNumber: createRoomBedDto.roomNumber,
        bedNumber: createRoomBedDto.bedNumber,
        locationId: createRoomBedDto.locationId,
      },
    });

    if (existingRoomBed) {
      throw new BadRequestException(
        'Room/Bed combination already exists in this location',
      );
    }

    const roomBed = await this.roomBedModel.create({
      ...createRoomBedDto,
      isOccupied: createRoomBedDto.isOccupied || false,
      features: createRoomBedDto.features || {},
    });

    return this.mapToResponseDto(roomBed);
  }

  async getRoomBedsByLocation(
    locationId: string,
  ): Promise<RoomBedResponseDto[]> {
    const location = await this.locationModel.findByPk(locationId);
    if (!location) {
      throw new NotFoundException('Location not found');
    }

    const roomBeds = await this.roomBedModel.findAll({
      where: { locationId },
      order: [
        ['roomNumber', 'ASC'],
        ['bedNumber', 'ASC'],
      ],
    });

    return roomBeds.map((roomBed) => this.mapToResponseDto(roomBed));
  }

  async getAvailableRoomBeds(
    locationId: string,
  ): Promise<RoomBedResponseDto[]> {
    const roomBeds = await this.roomBedModel.findAll({
      where: {
        locationId,
        isOccupied: false,
      },
      order: [
        ['roomNumber', 'ASC'],
        ['bedNumber', 'ASC'],
      ],
    });

    return roomBeds.map((roomBed) => this.mapToResponseDto(roomBed));
  }

  private mapToResponseDto(roomBed: RoomBed): RoomBedResponseDto {
    return {
      id: roomBed.id,
      roomNumber: roomBed.roomNumber,
      bedNumber: roomBed.bedNumber,
      locationId: roomBed.locationId,
      isOccupied: roomBed.isOccupied,
      floor: roomBed.floor,
      wing: roomBed.wing,
      features: roomBed.features,
      createdAt: roomBed.createdAt,
      updatedAt: roomBed.updatedAt,
    };
  }
  async assignCareReceiverToBed(
    careReceiverId: string,
    roomBedId: string,
    userId: string,
  ): Promise<{
    success: boolean;
    message: string;
    roomBed: RoomBedResponseDto;
  }> {
    // Validate care receiver exists
    const careReceiver = await this.careReceiverModel.findByPk(careReceiverId);
    if (!careReceiver) {
      throw new NotFoundException('Care receiver not found');
    }

    // Validate room/bed exists
    const roomBed = await this.roomBedModel.findByPk(roomBedId);
    if (!roomBed) {
      throw new NotFoundException('Room/Bed not found');
    }

    // Check if care receiver is in the same location as the room/bed
    if (careReceiver.locationId !== roomBed.locationId) {
      throw new BadRequestException(
        'Care receiver and room/bed must be in the same location',
      );
    }

    // Check if room/bed is available
    if (roomBed.isOccupied) {
      throw new BadRequestException('Room/Bed is already occupied');
    }

    // Check if care receiver is already assigned to a bed
    if (careReceiver.currentRoomBedId) {
      // Free up the current bed
      await this.roomBedModel.update(
        { isOccupied: false },
        { where: { id: careReceiver.currentRoomBedId } },
      );
    }

    // Assign care receiver to new bed
    await Promise.all([
      // Update room/bed as occupied
      this.roomBedModel.update(
        { isOccupied: true },
        { where: { id: roomBedId } },
      ),
      // Update care receiver's current room/bed
      this.careReceiverModel.update(
        { currentRoomBedId: roomBedId },
        {
          where: { id: careReceiverId },
          validate: false,
          hooks: false,
        },
      ),
    ]);

    // Create audit log
    await this.auditLogModel.create({
      action: 'ASSIGN_ROOM_BED',
      entityType: 'CARE_RECEIVER',
      entityId: careReceiverId,
      userId: userId,
      changes: {
        assigned: {
          careReceiverId,
          roomBedId,
          roomNumber: roomBed.roomNumber,
          bedNumber: roomBed.bedNumber,
          previousRoomBedId: careReceiver.currentRoomBedId,
        },
      },
      status: 'SUCCESS',
      purpose: 'Care Receiver Room Assignment',
    });

    // Get updated room/bed data
    const updatedRoomBed = await this.roomBedModel.findByPk(roomBedId);

    return {
      success: true,
      message: `Care receiver ${careReceiver.firstName} ${careReceiver.lastName} has been assigned to room ${roomBed.roomNumber}, bed ${roomBed.bedNumber}`,
      roomBed: this.mapToResponseDto(updatedRoomBed),
    };
  }

  async unassignCareReceiverFromBed(
    careReceiverId: string,
    userId: string,
  ): Promise<{ success: boolean; message: string }> {
    // Validate care receiver exists
    const careReceiver = await this.careReceiverModel.findByPk(careReceiverId);
    if (!careReceiver) {
      throw new NotFoundException('Care receiver not found');
    }

    // Check if care receiver is assigned to a bed
    if (!careReceiver.currentRoomBedId) {
      throw new BadRequestException('Care receiver is not assigned to any bed');
    }

    // Free up the bed using raw SQL to avoid encryption issues
    await Promise.all([
      // Update room/bed as available
      this.roomBedModel.update(
        { isOccupied: false },
        { where: { id: careReceiver.currentRoomBedId } },
      ),
      // Update care receiver's current room/bed using raw SQL
      this.careReceiverModel.update(
        { currentRoomBedId: null },
        {
          where: { id: careReceiverId },
          // Skip validation and hooks to avoid encryption issues
          validate: false,
          hooks: false,
        },
      ),
    ]);

    // Create audit log
    await this.auditLogModel.create({
      action: 'UNASSIGN_ROOM_BED',
      entityType: 'CARE_RECEIVER',
      entityId: careReceiverId,
      userId: userId,
      changes: {
        unassigned: {
          careReceiverId,
          roomBedId: careReceiver.currentRoomBedId,
        },
      },
      status: 'SUCCESS',
      purpose: 'Care Receiver Room Unassignment',
    });

    return {
      success: true,
      message: `Care receiver ${careReceiver.firstName} ${careReceiver.lastName} has been unassigned from their current bed`,
    };
  }

  async getCareReceiverBedAssignment(careReceiverId: string): Promise<{
    careReceiver: any;
    currentRoomBed: RoomBedResponseDto | null;
  }> {
    const careReceiver = await this.careReceiverModel.findByPk(careReceiverId, {
      include: [
        {
          model: RoomBed,
          as: 'currentRoomBed',
        },
      ],
    });

    if (!careReceiver) {
      throw new NotFoundException('Care receiver not found');
    }

    return {
      careReceiver: {
        id: careReceiver.id,
        firstName: careReceiver.firstName,
        lastName: careReceiver.lastName,
        locationId: careReceiver.locationId,
        currentRoomBedId: careReceiver.currentRoomBedId,
      },
      currentRoomBed: careReceiver.currentRoomBed
        ? this.mapToResponseDto(careReceiver.currentRoomBed)
        : null,
    };
  }
}
