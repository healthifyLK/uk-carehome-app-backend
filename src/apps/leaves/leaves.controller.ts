import { 
    Controller, 
    Get, 
    Post, 
    Patch, 
    Param, 
    Body, 
    Query, 
    UseGuards, 
    UseInterceptors,
    UploadedFiles,
    Req
  } from '@nestjs/common';
  import { FilesInterceptor } from '@nestjs/platform-express';
  import { Roles } from '../../common/decorators/roles.decorator';
  import { RolesGuard } from '../../common/guards/roles.guard';
  import { LocationAccessGuard } from '../../common/guards/location-access.guard';
  import { CurrentUser } from '../../common/decorators/current-user.decorator';
  import { UserRole } from '../../database/models/user.model';
  import { LeavesService } from './leaves.service';
  import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
  import { UpdateLeaveRequestStatusDto } from './dto/update-leave-request-status.dto';
  import { QueryLeaveRequestsDto } from './dto/query-leave-requests.dto';
  

  
  @Controller('leaves')
  export class LeavesController {
    constructor(private readonly leavesService: LeavesService) {}

    @Get('health')
    health() {
      return { ok: true };
    }
  
    @Post()
    @UseGuards(LocationAccessGuard)
    @Roles(UserRole.CAREGIVER)
    @UseInterceptors(FilesInterceptor('attachments', 5))
    async createLeaveRequest(
      @CurrentUser() user: any,
      @Body() createLeaveRequestDto: CreateLeaveRequestDto,
      @UploadedFiles() attachments?: any[],
    ) {
      return this.leavesService.createLeaveRequest(
        user.id,
        createLeaveRequestDto,
        attachments,
      );
    }
  
    @Get('my')
    @UseGuards(RolesGuard,LocationAccessGuard)
    @Roles(UserRole.CAREGIVER)
    async getMyLeaveRequests(
      @CurrentUser() user: any,
      @Query() queryDto: QueryLeaveRequestsDto,
    ) {
      return this.leavesService.getMyLeaveRequests(user.id, queryDto);
    }
  
    @Get()
    @UseGuards(RolesGuard,LocationAccessGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
    async getLeaveRequests(
      @Query() queryDto: QueryLeaveRequestsDto,
      @Req() req: any,
    ) {
      return this.leavesService.getLeaveRequests(queryDto, req.user);
    }
  
    @Patch(':id/approve')
    @UseGuards(RolesGuard,LocationAccessGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
    async approveLeaveRequest(
      @Param('id') id: string,
      @Body() updateDto: UpdateLeaveRequestStatusDto,
      @CurrentUser() user: any,
    ) {
      return this.leavesService.approveLeaveRequest(id, updateDto, user.id);
    }
  
    @Patch(':id/reject')
    @UseGuards(RolesGuard,LocationAccessGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
    async rejectLeaveRequest(
      @Param('id') id: string,
      @Body() updateDto: UpdateLeaveRequestStatusDto,
      @CurrentUser() user: any,
    ) {
      return this.leavesService.rejectLeaveRequest(id, updateDto, user.id);
    }
  
    @Patch(':id/cancel')
    @UseGuards(RolesGuard,LocationAccessGuard)
    @Roles(UserRole.CAREGIVER)
    async cancelLeaveRequest(
      @Param('id') id: string,
      @CurrentUser() user: any,
    ) {
      return this.leavesService.cancelLeaveRequest(id, user.id);
    }
  
    
  }