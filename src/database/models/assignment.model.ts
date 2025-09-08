import {
    Table,
    Column,
    DataType,
    BelongsTo,
    ForeignKey,
    BeforeCreate,
    AfterCreate,
    AfterUpdate,
  } from 'sequelize-typescript';
  import { BaseModel } from './base.model';
  import { User } from './user.model';
  import { Patient } from './patient.model';
  import { Schedule } from './schedule.model';
  
  export enum AssignmentType {
    DESIGNATED = 'DESIGNATED', // Long-term one-to-one
    ROTATING = 'ROTATING',     // Daily rotation
    TEMPORARY = 'TEMPORARY',    // Short-term cover
    EMERGENCY = 'EMERGENCY',    // Emergency assignment
  }
  
  @Table({
    tableName: 'assignments',
    indexes: [
      { fields: ['caregiver_id', 'patient_id'] },
      { fields: ['start_time', 'end_time'] },
      { fields: ['assignment_type'] },
      { fields: ['is_active'] },
    ],
  })
  export class Assignment extends BaseModel<Assignment> {
    @ForeignKey(() => User)
    @Column({
      type: DataType.UUID,
      allowNull: false,
    })
    caregiverId: string;
  
    @ForeignKey(() => Patient)
    @Column({
      type: DataType.UUID,
      allowNull: false,
    })
    patientId: string;
  
    @ForeignKey(() => Schedule)
    @Column({
      type: DataType.UUID,
      allowNull: true,
    })
    scheduleId?: string;
  
    @Column({
      type: DataType.ENUM(...Object.values(AssignmentType)),
      allowNull: false,
    })
    assignmentType: AssignmentType;
  
    @Column({
      type: DataType.DATE,
      allowNull: false,
    })
    startTime: Date;
  
    @Column({
      type: DataType.DATE,
      allowNull: true,
    })
    endTime?: Date;
  
    @Column({
      type: DataType.BOOLEAN,
      defaultValue: true,
    })
    isActive: boolean;
  
    @Column({
      type: DataType.TEXT,
      allowNull: true,
    })
    notes?: string;
  
    // Associations
    @BelongsTo(() => User)
    caregiver: User;
  
    @BelongsTo(() => Patient)
    patient: Patient;
  
    @BelongsTo(() => Schedule)
    schedule: Schedule;
  
    // Hooks for access control
    @AfterCreate
    static async grantAccess(assignment: Assignment) {
      // Logic to grant caregiver access to patient data
      console.log(`Access granted for caregiver ${assignment.caregiverId} to patient ${assignment.patientId}`);
    }
  
    @AfterUpdate
    static async updateAccess(assignment: Assignment) {
      if (!assignment.isActive && assignment.previous('isActive')) {
        // Logic to revoke access when assignment becomes inactive
        console.log(`Access revoked for caregiver ${assignment.caregiverId} to patient ${assignment.patientId}`);
      }
    }
  }