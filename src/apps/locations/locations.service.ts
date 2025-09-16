import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction } from 'sequelize';
import { literal, type ProjectionAlias } from 'sequelize';
import { Location } from '../../database/models/location.model';
import { User } from '../../database/models/user.model';
import { CareReceiver } from '../../database/models/care-receiver.model';
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
    @InjectModel(CareReceiver)
    private readonly patientModel: typeof CareReceiver,
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
    const existingLocation = await this.locationModel.findOne({
      where: { name: createLocationDto.name },
    });

    if (existingLocation) {
      throw new BadRequestException('Location with this name already exists');
    }

    // Derive capacity if numbers provided
    const numberOfRooms = createLocationDto.numberOfRooms ?? 0;
    const bedsPerRoom = createLocationDto.bedsPerRoom ?? 0;
    const capacity =
      createLocationDto.capacity ??
      (numberOfRooms > 0 && bedsPerRoom > 0 ? numberOfRooms * bedsPerRoom : 0);

    const location = await this.locationModel.create(
      {
        ...createLocationDto,
        capacity,
        isActive: createLocationDto.isActive !== undefined ? createLocationDto.isActive : true,
        settings: createLocationDto.settings || {},
      },
      { transaction },
    );

    // // Auto-generate rooms/beds if requested
    // if (numberOfRooms > 0 && bedsPerRoom > 0) {
    //   const beds: { roomNumber: string; bedNumber: string; locationId: string }[] = [];
    //   const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      
    //   // Use location ID prefix to make room numbers unique per location
    //   const locationPrefix = location.id.substring(0, 3).toUpperCase();
      
    //   for (let r = 1; r <= numberOfRooms; r++) {
    //     const roomNumber = `${locationPrefix}${String(r).padStart(3, '0')}`; // e.g., ABC001, ABC002
    //     for (let b = 0; b < bedsPerRoom; b++) {
    //       const letter = letters[b];
    //       beds.push({
    //         roomNumber,
    //         bedNumber: `CH${roomNumber}${letter}`,
    //         locationId: location.id,
    //       });
    //     }
    //   }
      
    //   await this.roomBedModel.bulkCreate(beds as any, { transaction });
    // }
    await this.auditLogModel.create(
      {
        action: 'CREATE', 
        entityType: 'Location',
        entityId: location.id,
        userId: userId,
        changes: { created: { ...createLocationDto, capacity, numberOfRooms, bedsPerRoom } },
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
    const projections: ProjectionAlias[] = includeStats
      ? [
          // Total beds count
          [
            literal(`(SELECT COUNT(1) FROM room_beds rb WHERE rb.location_id = "Location"."id")`),
            'totalBeds',
          ],
          // Occupied beds count
          [
            literal(`(SELECT COUNT(1) FROM room_beds rb WHERE rb.location_id = "Location"."id" AND rb.is_occupied = true)`),
            'occupiedBeds',
          ],
          // Active caregivers count
          [
            literal(`(SELECT COUNT(1) FROM caregivers c WHERE c.location_id = "Location"."id" AND c.status = 'ACTIVE')`),
            'caregiverCount',
          ],
          // Active care receivers count
          [
            literal(`(SELECT COUNT(1) FROM care_receivers cr WHERE cr.location_id = "Location"."id" AND cr.status = 'ACTIVE')`),
            'careReceiverCount',
          ],
        ]
      : [];
  
    const attributes = includeStats ? { include: projections } : undefined;
  
    const locations = await this.locationModel.findAll({
      attributes,
      order: [['name', 'ASC']],
    });
  
    return locations.map((location) => this.mapToResponseDto(location));
  }

  /**
   * Get location by ID
   */
  async getLocationById(locationId: string, includeStats: boolean = false): Promise<LocationResponseDto> {
    const projections: ProjectionAlias[] = includeStats
      ? [
          // Total beds count
          [
            literal(`(SELECT COUNT(1) FROM room_beds rb WHERE rb.location_id = "Location"."id")`),
            'totalBeds',
          ],
          // Occupied beds count
          [
            literal(`(SELECT COUNT(1) FROM room_beds rb WHERE rb.location_id = "Location"."id" AND rb.is_occupied = true)`),
            'occupiedBeds',
          ],
          // Active caregivers count
          [
            literal(`(SELECT COUNT(1) FROM caregivers c WHERE c.location_id = "Location"."id" AND c.status = 'ACTIVE')`),
            'caregiverCount',
          ],
          // Active care receivers count
          [
            literal(`(SELECT COUNT(1) FROM care_receivers cr WHERE cr.location_id = "Location"."id" AND cr.status = 'ACTIVE')`),
            'careReceiverCount',
          ],
        ]
      : [];
  
    const attributes = includeStats ? { include: projections } : undefined;
  
    const location = await this.locationModel.findByPk(locationId, { attributes });
  
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
    const dv = (location as any).dataValues || {};
    
    // Calculate derived stats
    const totalBeds = Number(dv.totalBeds ?? 0);
    const occupiedBeds = Number(dv.occupiedBeds ?? 0);
    const availableBeds = totalBeds - occupiedBeds;
    const caregiverCount = Number(dv.caregiverCount ?? 0);
    const careReceiverCount = Number(dv.careReceiverCount ?? 0);
    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
  
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
      stats: dv.totalBeds !== undefined ? {
        totalBeds,
        occupiedBeds,
        availableBeds,
        caregiverCount,
        careReceiverCount,
        occupancyRate,
      } : undefined,
    };
  }
}