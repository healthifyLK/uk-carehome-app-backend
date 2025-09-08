import {
    Table,
    Column,
    DataType,
    HasMany,
    BelongsTo,
    ForeignKey,
    BeforeCreate,
    BeforeUpdate,
    DefaultScope,
    Scopes,
  } from 'sequelize-typescript';
  import * as bcrypt from 'bcrypt';
  import { BaseModel } from './base.model';
  import { Location } from './location.model';
  import { Assignment } from './assignment.model';


  export enum UserRole {
    SUPER_ADMIN = 'SUPER_ADMIN',
    ADMIN = 'ADMIN',
    CAREGIVER = 'CAREGIVER',
    EMERGENCY_CONTACT = 'EMERGENCY_CONTACT',
    PATIENT = 'PATIENT'
  }

  export enum UserStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    SUSPENDED = 'SUSPENDED',
  }

  @DefaultScope(() => ({
    attributes: { exclude: ['password', 'totpSecret'] },
  }))
  @Scopes(() => ({
    withAuth: {
      attributes: { include: ['password', 'totpSecret'] },
    },
  }))
  @Table({
    tableName: 'users',
    indexes: [
      { fields: ['email'], unique: true },
      { fields: ['role'] },
      { fields: ['location_id'] },
    ],
  })

  export class User extends BaseModel<User> {
    @Column({
      type: DataType.STRING,
      allowNull: false,
    })
    firstName: string;
  
    @Column({
      type: DataType.STRING,
      allowNull: false,
    })
    lastName: string;
  
    @Column({
      type: DataType.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    })
    email: string;
  
    @Column({
      type: DataType.STRING,
      allowNull: false,
    })
    password: string;
  
    @Column({
      type: DataType.ENUM(...Object.values(UserRole)),
      allowNull: false,
    })
    role: UserRole;
  
    @Column({
      type: DataType.ENUM(...Object.values(UserStatus)),
      defaultValue: UserStatus.ACTIVE,
    })
    status: UserStatus;
  
    @Column({
      type: DataType.STRING,
      allowNull: true,
    })
    phoneNumber: string;
  
    @Column({
      type: DataType.STRING,
      allowNull: true,
      comment: 'TOTP secret for 2FA',
    })
    totpSecret?: string;
  
    @Column({
      type: DataType.BOOLEAN,
      defaultValue: false,
    })
    totpEnabled: boolean;
  
    @ForeignKey(() => Location)
    @Column({
      type: DataType.UUID,
      allowNull: true,
    })
    locationId?: string;
  
    @Column({
      type: DataType.DATE,
      allowNull: true,
    })
    lastLoginAt?: Date;
  
    @Column({
      type: DataType.JSONB,
      defaultValue: {},
      comment: 'GDPR consent tracking',
    })
    consentHistory: object;
  
    // Associations
    @BelongsTo(() => Location)
    location: Location;
  
    @HasMany(() => Assignment, 'caregiverId')
    assignments: Assignment[];
  
    // Hooks for password hashing
    @BeforeCreate
    @BeforeUpdate
    static async hashPassword(user: User) {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    }
  
    // Methods
    async validatePassword(password: string): Promise<boolean> {
      return bcrypt.compare(password, this.password);
    }
  }



