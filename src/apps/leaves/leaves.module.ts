import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { LeavesController } from './leaves.controller';
import { LeavesService } from './leaves.service';
import { LeaveRequest } from '../../database/models/leave-request.model';
import { Caregiver } from '../../database/models/caregiver.model';
import { Location } from '../../database/models/location.model';
import { Roster } from '../../database/models/roster.model';
import { AuditLog } from '../../database/models/audit-log.model';
import { ServicesModule } from '../../common/services/services.module';

@Module({
  imports: [
    SequelizeModule.forFeature([LeaveRequest, Caregiver, Location, Roster, AuditLog]),
    ServicesModule,
  ],
  controllers: [LeavesController],
  providers: [LeavesService],
  exports: [LeavesService],
})
export class LeavesModule {}