import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { RoomBed } from '../../database/models/room-bed.model';
import { Location } from '../../database/models/location.model';
import { CreateRoomBedDto } from './dto/create-room.dto';
import { RoomBedResponseDto } from './dto/room-response.dto';

@Injectable()
export class RoomBedsService {
  constructor(
    @InjectModel(RoomBed)
    private readonly roomBedModel: typeof RoomBed,
    @InjectModel(Location)
    private readonly locationModel: typeof Location,
  ) {}

  async createRoomBed(createRoomBedDto: CreateRoomBedDto): Promise<RoomBedResponseDto> {
    // Validate location exists
    const location = await this.locationModel.findByPk(createRoomBedDto.locationId);
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
      throw new BadRequestException('Room/Bed combination already exists in this location');
    }

    const roomBed = await this.roomBedModel.create({
      ...createRoomBedDto,
      isOccupied: createRoomBedDto.isOccupied || false,
      features: createRoomBedDto.features || {},
    });

    return this.mapToResponseDto(roomBed);
  }

  async getRoomBedsByLocation(locationId: string): Promise<RoomBedResponseDto[]> {
    const location = await this.locationModel.findByPk(locationId);
    if (!location) {
      throw new NotFoundException('Location not found');
    }

    const roomBeds = await this.roomBedModel.findAll({
      where: { locationId },
      order: [['roomNumber', 'ASC'], ['bedNumber', 'ASC']],
    });

    return roomBeds.map(roomBed => this.mapToResponseDto(roomBed));
  }

  async getAvailableRoomBeds(locationId: string): Promise<RoomBedResponseDto[]> {
    const roomBeds = await this.roomBedModel.findAll({
      where: {
        locationId,
        isOccupied: false,
      },
      order: [['roomNumber', 'ASC'], ['bedNumber', 'ASC']],
    });

    return roomBeds.map(roomBed => this.mapToResponseDto(roomBed));
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
}