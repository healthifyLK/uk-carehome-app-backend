import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction } from 'sequelize';
import { Location } from '../../database/models/location.model';
import { User } from '../../database/models/user.model';
import { Patient } from '../../database/models/patient.model';
import { RoomBed } from '../../database/models/room-bed.model';
import { AuditLog } from '../../database/models/audit-log.model';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { LocationResponseDto } from './dto/location-response.dto';

@Injectable()
export class LocationsService {
  constructor(
    @InjectModel(Location)
    private readonly locationModel: typeof Location,
    @InjectModel(User)
    private readonly userModel: typeof User,
    @InjectModel(Patient)
    private readonly patientModel: typeof Patient,
    @InjectModel(RoomBed)
    private readonly roomBedModel: typeof RoomBed,
    @InjectModel(AuditLog)
    private readonly auditLogModel: typeof AuditLog,
  ) {}

  /**
   * Create a new location
   */
  async createLocation(
    createLocationDto: CreateLocationDto,
    userId: string,
    transaction?: Transaction,
  ): Promise<LocationResponseDto> {
    // Check if location with same name already exists
    const existingLocation = await this.locationModel.findOne({
      where: { name: createLocationDto.name },
    });

    if (existingLocation) {
      throw new BadRequestException('Location with this name already exists');
    }

    const location = await this.locationModel.create(
      {
        ...createLocationDto,
        capacity: createLocationDto.capacity || 0,
        isActive: createLocationDto.isActive !== undefined ? createLocationDto.isActive : true,
        settings: createLocationDto.settings || {},
      },
      { transaction },
    );

    // Audit log
    await this.auditLogModel.create(
      {
        action: 'CREATE',
        entityType: 'Location',
        entityId: location.id,
        userId: userId,
        changes: { created: createLocationDto },
        status: 'SUCCESS',
        purpose: 'Location Management',
      },
      { transaction },
    );

    return this.mapToResponseDto(location);
  }

  /**
   * Get all locations
   */
  async getAllLocations(includeStats: boolean = false): Promise<LocationResponseDto[]> {
    const includeOptions = includeStats ? ['withStats'] : [];
    
    const locations = await this.locationModel.scope(includeOptions).findAll({
      order: [['name', 'ASC']],
    });

    return locations.map(location => this.mapToResponseDto(location));
  }

  /**
   * Get location by ID
   */
  async getLocationById(locationId: string, includeStats: boolean = false): Promise<LocationResponseDto> {
    const includeOptions = includeStats ? ['withStats'] : [];
    
    const location = await this.locationModel.scope(includeOptions).findByPk(locationId);

    if (!location) {
      throw new NotFoundException('Location not found');
    }

    return this.mapToResponseDto(location);
  }

  /**
   * Update location
   */
  async updateLocation(
    locationId: string,
    updateLocationDto: UpdateLocationDto,
    userId: string,
    transaction?: Transaction,
  ): Promise<LocationResponseDto> {
    const location = await this.locationModel.findByPk(locationId);

    if (!location) {
      throw new NotFoundException('Location not found');
    }

    // Check if new name conflicts with existing location
    if (updateLocationDto.name && updateLocationDto.name !== location.name) {
      const existingLocation = await this.locationModel.findOne({
        where: { name: updateLocationDto.name },
      });

      if (existingLocation) {
        throw new BadRequestException('Location with this name already exists');
      }
    }

    const oldData = { ...location.toJSON() };
    await location.update(updateLocationDto, { transaction });

    // Audit log
    await this.auditLogModel.create(
      {
        action: 'UPDATE',
        entityType: 'Location',
        entityId: locationId,
        userId: userId,
        changes: { 
          old: oldData, 
          new: updateLocationDto 
        },
        status: 'SUCCESS',
        purpose: 'Location Management',
      },
      { transaction },
    );

    return this.mapToResponseDto(location);
  }

  /**
   * Delete location (soft delete)
   */
  async deleteLocation(locationId: string, userId: string): Promise<void> {
    const location = await this.locationModel.findByPk(locationId);

    if (!location) {
      throw new NotFoundException('Location not found');
    }

    // Check if location has associated users
    const userCount = await this.userModel.count({
      where: { locationId },
    });

    if (userCount > 0) {
      throw new BadRequestException('Cannot delete location with associated users');
    }

    // Check if location has patients
    const patientCount = await this.patientModel.count({
      where: { locationId },
    });

    if (patientCount > 0) {
      throw new BadRequestException('Cannot delete location with patients');
    }

    // Check if location has room/beds
    const roomBedCount = await this.roomBedModel.count({
      where: { locationId },
    });

    if (roomBedCount > 0) {
      throw new BadRequestException('Cannot delete location with room/beds');
    }

    await location.destroy();

    // Audit log
    await this.auditLogModel.create({
      action: 'DELETE',
      entityType: 'Location',
      entityId: locationId,
      userId: userId,
      changes: { deleted: location.toJSON() },
      status: 'SUCCESS',
      purpose: 'Location Management',
    });
  }

  /**
   * Get location statistics
   */
  async getLocationStats(locationId: string): Promise<{
    userCount: number;
    patientCount: number;
    roomBedCount: number;
    occupiedRoomBeds: number;
    availableRoomBeds: number;
  }> {
    const location = await this.locationModel.findByPk(locationId);

    if (!location) {
      throw new NotFoundException('Location not found');
    }

    const [userCount, patientCount, roomBedCount, occupiedRoomBeds] = await Promise.all([
      this.userModel.count({ where: { locationId } }),
      this.patientModel.count({ where: { locationId } }),
      this.roomBedModel.count({ where: { locationId } }),
      this.roomBedModel.count({ where: { locationId, isOccupied: true } }),
    ]);

    return {
      userCount,
      patientCount,
      roomBedCount,
      occupiedRoomBeds,
      availableRoomBeds: roomBedCount - occupiedRoomBeds,
    };
  }

  /**
   * Get available room/beds for a location
   */
  async getAvailableRoomBeds(locationId: string): Promise<RoomBed[]> {
    const location = await this.locationModel.findByPk(locationId);

    if (!location) {
      throw new NotFoundException('Location not found');
    }

    return this.roomBedModel.findAll({
      where: {
        locationId,
        isOccupied: false,
      },
      order: [['roomNumber', 'ASC'], ['bedNumber', 'ASC']],
    });
  }

  /**
   * Map Location model to response DTO
   */
  private mapToResponseDto(location: Location): LocationResponseDto {
    return {
      id: location.id,
      name: location.name,
      address: location.address,
      city: location.city,
      postcode: location.postcode,
      phoneNumber: location.phoneNumber,
      email: location.email,
      capacity: location.capacity,
      isActive: location.isActive,
      settings: location.settings,
      createdAt: location.createdAt,
      updatedAt: location.updatedAt,
      stats: (location as any).dataValues?.userCount !== undefined ? {
        userCount: (location as any).dataValues.userCount,
        patientCount: (location as any).dataValues.patientCount,
      } : undefined,
    };
  }
}