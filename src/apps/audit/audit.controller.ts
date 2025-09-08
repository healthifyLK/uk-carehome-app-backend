import {
    Controller,
    Get,
    Query,
    Param,
    UseGuards,
    Request,
  } from '@nestjs/common';
  import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
  import { AuthGuard } from '@nestjs/passport';
  import { AuditService, AuditQueryOptions } from './audit.service';
  import { RolesGuard } from '../../common/guards/roles.guard';
  import { Roles } from '../../common/decorators/roles.decorator';
  import { UserRole } from '../../database/models/user.model';
  
  @ApiTags('Audit')
  @Controller('audit')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  export class AuditController {
    constructor(private readonly auditService: AuditService) {}
  
    @Get('logs')
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Query audit logs' })
    @ApiResponse({ status: 200, description: 'Audit logs retrieved successfully' })
    async queryAuditLogs(
      @Query() query: AuditQueryOptions,
    ) {
      return this.auditService.queryAuditLogs(query);
    }
  
    @Get('stats')
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Get audit statistics' })
    @ApiResponse({ status: 200, description: 'Audit statistics retrieved successfully' })
    async getAuditStats(
      @Query('startDate') startDate?: string,
      @Query('endDate') endDate?: string,
    ) {
      return this.auditService.getAuditStats(
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined,
      );
    }
  
    @Get('user/:userId/activity')
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Get user activity history' })
    @ApiResponse({ status: 200, description: 'User activity retrieved successfully' })
    async getUserActivity(
      @Param('userId') userId: string,
      @Query('days') days?: number,
    ) {
      return this.auditService.getUserActivity(userId, days);
    }
  
    @Get('entity/:entityType/:entityId')
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Get entity access history' })
    @ApiResponse({ status: 200, description: 'Entity access history retrieved successfully' })
    async getEntityAccessHistory(
      @Param('entityType') entityType: string,
      @Param('entityId') entityId: string,
    ) {
      return this.auditService.getEntityAccessHistory(entityType, entityId);
    }
  
    @Get('export')
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Export audit logs for compliance' })
    @ApiResponse({ status: 200, description: 'Audit logs exported successfully' })
    async exportAuditLogs(
      @Query('startDate') startDate: string,
      @Query('endDate') endDate: string,
      @Query('entityType') entityType?: string,
    ) {
      return this.auditService.exportAuditLogs(
        new Date(startDate),
        new Date(endDate),
        entityType,
      );
    }
  }