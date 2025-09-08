import {
    Table,
    Column,
    DataType,
    ForeignKey,
    BelongsTo,
  } from 'sequelize-typescript';
  import { BaseModel } from './base.model';
  import { User } from './user.model';
  
  @Table({
    tableName: 'audit_logs',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['entity_type', 'entity_id'] },
      { fields: ['action'] },
      { fields: ['created_at'] },
    ],
  })
  export class AuditLog extends BaseModel<AuditLog> {
    @ForeignKey(() => User)
    @Column({
      type: DataType.UUID,
      allowNull: true,
    })
    userId?: string;
  
    @Column({
      type: DataType.STRING,
      allowNull: false,
    })
    action: string; // CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT
  
    @Column({
      type: DataType.STRING,
      allowNull: false,
    })
    entityType: string; // User, Patient, Assignment, etc.
  
    @Column({
      type: DataType.UUID,
      allowNull: true,
    })
    entityId?: string;
  
    @Column({
      type: DataType.JSONB,
      defaultValue: {},
    })
    changes: object;
  
    @Column({
      type: DataType.STRING,
      allowNull: true,
    })
    ipAddress?: string;
  
    @Column({
      type: DataType.STRING,
      allowNull: true,
    })
    userAgent?: string;
  
    @Column({
      type: DataType.ENUM('SUCCESS', 'FAILURE'),
      defaultValue: 'SUCCESS',
    })
    status: string;
  
    @Column({
      type: DataType.TEXT,
      allowNull: true,
    })
    reason?: string;
  
    // GDPR Compliance: Purpose of data access
    @Column({
      type: DataType.STRING,
      allowNull: true,
    })
    purpose?: string;
  
    // Associations
    @BelongsTo(() => User)
    user: User;
  }