import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { User } from '../../database/models/user.model';
import { Location } from '../../database/models/location.model';
import { AuditLog } from '../../database/models/audit-log.model';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(Location) private readonly locationModel: typeof Location,
    @InjectModel(AuditLog) private readonly auditLogModel: typeof AuditLog,
  ) {}

  async list(query: QueryUsersDto): Promise<{ data: UserResponseDto[]; total: number }> {
    const where: any = {};
    if (query.locationId) where.locationId = query.locationId;
    if (query.role) where.role = query.role;
    if (query.status) where.status = query.status;

    const { rows, count } = await this.userModel.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      offset: query.offset,
      limit: query.limit,
    });

    return { data: rows.map(this.toDto), total: count };
  }

  async get(id: string): Promise<UserResponseDto> {
    const user = await this.userModel.findByPk(id, { include: [{ model: Location, as: 'location' }] });
    if (!user) throw new NotFoundException('User not found');
    return this.toDto(user);
  }

  async update(id: string, dto: UpdateUserDto, actorId: string): Promise<UserResponseDto> {
    const user = await this.userModel.findByPk(id);
    if (!user) throw new NotFoundException('User not found');

    if (dto.email && dto.email !== user.email) {
      const dup = await this.userModel.findOne({ where: { email: dto.email, id: { [Op.ne]: id } } });
      if (dup) throw new BadRequestException('Email already in use');
    }

    if (dto.locationId) {
      const loc = await this.locationModel.findByPk(dto.locationId);
      if (!loc) throw new BadRequestException('Invalid locationId');
    }

    const before = user.toJSON();
    await user.update(dto);

    await this.auditLogModel.create({
      action: 'UPDATE',
      entityType: 'User',
      entityId: id,
      userId: actorId,
      changes: { old: { id: before.id, email: before.email }, new: { ...dto, email: dto.email } },
      status: 'SUCCESS',
      purpose: 'User Management',
    });

    return this.toDto(user);
  }

  async updateStatus(id: string, dto: UpdateStatusDto, actorId: string): Promise<UserResponseDto> {
    const user = await this.userModel.findByPk(id);
    if (!user) throw new NotFoundException('User not found');

    await user.update({ status: dto.status });

    await this.auditLogModel.create({
      action: 'UPDATE',
      entityType: 'User',
      entityId: id,
      userId: actorId,
      changes: { status: dto.status },
      status: 'SUCCESS',
      purpose: 'User Lifecycle',
    });

    return this.toDto(user);
  }

  async remove(id: string, actorId: string): Promise<void> {
    const user = await this.userModel.findByPk(id);
    if (!user) throw new NotFoundException('User not found');

    await user.destroy();

    await this.auditLogModel.create({
      action: 'DELETE',
      entityType: 'User',
      entityId: id,
      userId: actorId,
      changes: { deleted: { id: user.id, email: user.email } },
      status: 'SUCCESS',
      purpose: 'GDPR - Account removal',
    });
  }

  private toDto = (u: User): UserResponseDto => ({
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    role: u.role,
    status: (u as any).status,
    locationId: (u as any).locationId,
    phoneNumber: (u as any).phoneNumber,
    lastLoginAt: (u as any).lastLoginAt,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  });
}