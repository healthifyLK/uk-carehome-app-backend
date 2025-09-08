import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction } from 'sequelize';
import { AuditLog } from '../../database/models/audit-log.model';

export interface AuditLogData {
  action: string;
  entityType: string;
  entityId?: string;
  userId?: string;
  changes?: object;
  ipAddress?: string;
  userAgent?: string;
  status?: 'SUCCESS' | 'FAILURE';
  reason?: string;
  purpose?: string;
  metadata?: object;
}

export interface AuditQueryOptions {
  userId?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  status?: 'SUCCESS' | 'FAILURE';
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface AuditStats {
  totalLogs: number;
  successCount: number;
  failureCount: number;
  actionBreakdown: Record<string, number>;
  entityTypeBreakdown: Record<string, number>;
  userBreakdown: Record<string, number>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectModel(AuditLog)
    private readonly auditLogModel: typeof AuditLog,
  ) {}

  /**
   * Log an audit event
   */
  async log(
    auditData: AuditLogData,
    transaction?: Transaction,
  ): Promise<AuditLog> {
    try {
      const auditLog = await this.auditLogModel.create(
        {
          action: auditData.action,
          entityType: auditData.entityType,
          entityId: auditData.entityId,
          userId: auditData.userId,
          changes: auditData.changes || {},
          ipAddress: auditData.ipAddress,
          userAgent: auditData.userAgent,
          status: auditData.status || 'SUCCESS',
          reason: auditData.reason,
          purpose: auditData.purpose,
        },
        { transaction },
      );

      this.logger.log(
        `Audit log created: ${auditData.action} on ${auditData.entityType} by user ${auditData.userId}`,
      );

      return auditLog;
    } catch (error) {
      this.logger.error('Failed to create audit log', error);
      throw error;
    }
  }

  /**
   * Log authentication events
   */
  async logAuthEvent(
    action: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'PASSWORD_RESET',
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
    reason?: string,
    transaction?: Transaction,
  ): Promise<AuditLog> {
    return this.log(
      {
        action,
        entityType: 'User',
        entityId: userId,
        userId,
        ipAddress,
        userAgent,
        status: action === 'LOGIN_FAILED' ? 'FAILURE' : 'SUCCESS',
        reason,
        purpose: 'Authentication',
      },
      transaction,
    );
  }

  /**
   * Log data access events for GDPR compliance
   */
  async logDataAccess(
    action: 'READ' | 'CREATE' | 'UPDATE' | 'DELETE',
    entityType: string,
    entityId: string,
    userId: string,
    purpose: string,
    ipAddress?: string,
    userAgent?: string,
    changes?: object,
    transaction?: Transaction,
  ): Promise<AuditLog> {
    return this.log(
      {
        action,
        entityType,
        entityId,
        userId,
        changes,
        ipAddress,
        userAgent,
        status: 'SUCCESS',
        purpose,
      },
      transaction,
    );
  }

  /**
   * Log GDPR consent changes
   */
  async logConsentChange(
    entityType: string,
    entityId: string,
    userId: string,
    consentData: object,
    ipAddress?: string,
    userAgent?: string,
    transaction?: Transaction,
  ): Promise<AuditLog> {
    return this.log(
      {
        action: 'CONSENT_UPDATE',
        entityType,
        entityId,
        userId,
        changes: { consentChange: consentData },
        ipAddress,
        userAgent,
        status: 'SUCCESS',
        purpose: 'GDPR Compliance',
      },
      transaction,
    );
  }

  /**
   * Log data deletion requests
   */
  async logDataDeletionRequest(
    entityType: string,
    entityId: string,
    userId: string,
    reason: string,
    ipAddress?: string,
    userAgent?: string,
    transaction?: Transaction,
  ): Promise<AuditLog> {
    return this.log(
      {
        action: 'DATA_DELETION_REQUEST',
        entityType,
        entityId,
        userId,
        ipAddress,
        userAgent,
        status: 'SUCCESS',
        reason,
        purpose: 'GDPR Right to Erasure',
      },
      transaction,
    );
  }

  /**
   * Log security events
   */
  async logSecurityEvent(
    action: 'UNAUTHORIZED_ACCESS' | 'SUSPICIOUS_ACTIVITY' | 'RATE_LIMIT_EXCEEDED',
    entityType: string,
    entityId: string,
    userId: string,
    reason: string,
    ipAddress?: string,
    userAgent?: string,
    transaction?: Transaction,
  ): Promise<AuditLog> {
    return this.log(
      {
        action,
        entityType,
        entityId,
        userId,
        ipAddress,
        userAgent,
        status: 'FAILURE',
        reason,
        purpose: 'Security Monitoring',
      },
      transaction,
    );
  }

  /**
   * Query audit logs with filters
   */
  async queryAuditLogs(
    options: AuditQueryOptions,
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const whereClause: any = {};

    if (options.userId) whereClause.userId = options.userId;
    if (options.entityType) whereClause.entityType = options.entityType;
    if (options.entityId) whereClause.entityId = options.entityId;
    if (options.action) whereClause.action = options.action;
    if (options.status) whereClause.status = options.status;

    if (options.startDate || options.endDate) {
      whereClause.createdAt = {};
      if (options.startDate) whereClause.createdAt[Symbol.for('gte')] = options.startDate;
      if (options.endDate) whereClause.createdAt[Symbol.for('lte')] = options.endDate;
    }

    const { count, rows } = await this.auditLogModel.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: options.limit || 100,
      offset: options.offset || 0,
      include: ['user'],
    });

    return { logs: rows, total: count };
  }

  /**
   * Get audit statistics
   */
  async getAuditStats(
    startDate?: Date,
    endDate?: Date,
  ): Promise<AuditStats> {
    const whereClause: any = {};

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt[Symbol.for('gte')] = startDate;
      if (endDate) whereClause.createdAt[Symbol.for('lte')] = endDate;
    }

    const logs = await this.auditLogModel.findAll({
      where: whereClause,
      attributes: ['action', 'entityType', 'userId', 'status'],
    });

    const stats: AuditStats = {
      totalLogs: logs.length,
      successCount: logs.filter(log => log.status === 'SUCCESS').length,
      failureCount: logs.filter(log => log.status === 'FAILURE').length,
      actionBreakdown: {},
      entityTypeBreakdown: {},
      userBreakdown: {},
    };

    // Calculate breakdowns
    logs.forEach(log => {
      // Action breakdown
      stats.actionBreakdown[log.action] = (stats.actionBreakdown[log.action] || 0) + 1;
      
      // Entity type breakdown
      stats.entityTypeBreakdown[log.entityType] = (stats.entityTypeBreakdown[log.entityType] || 0) + 1;
      
      // User breakdown
      if (log.userId) {
        stats.userBreakdown[log.userId] = (stats.userBreakdown[log.userId] || 0) + 1;
      }
    });

    return stats;
  }

  /**
   * Get user activity summary
   */
  async getUserActivity(
    userId: string,
    days: number = 30,
  ): Promise<AuditLog[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.auditLogModel.findAll({
      where: {
        userId,
        createdAt: {
          [Symbol.for('gte')]: startDate,
        },
      },
      order: [['createdAt', 'DESC']],
      limit: 100,
    });
  }

  /**
   * Get entity access history
   */
  async getEntityAccessHistory(
    entityType: string,
    entityId: string,
  ): Promise<AuditLog[]> {
    return this.auditLogModel.findAll({
      where: {
        entityType,
        entityId,
      },
      order: [['createdAt', 'DESC']],
      include: ['user'],
    });
  }

  /**
   * Clean up old audit logs (for data retention policies)
   */
  async cleanupOldLogs(retentionDays: number = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const deletedCount = await this.auditLogModel.destroy({
      where: {
        createdAt: {
          [Symbol.for('lt')]: cutoffDate,
        },
      },
    });

    this.logger.log(`Cleaned up ${deletedCount} old audit logs`);
    return deletedCount;
  }

  /**
   * Export audit logs for compliance reporting
   */
  async exportAuditLogs(
    startDate: Date,
    endDate: Date,
    entityType?: string,
  ): Promise<AuditLog[]> {
    const whereClause: any = {
      createdAt: {
        [Symbol.for('gte')]: startDate,
        [Symbol.for('lte')]: endDate,
      },
    };

    if (entityType) {
      whereClause.entityType = entityType;
    }

    return this.auditLogModel.findAll({
      where: whereClause,
      order: [['createdAt', 'ASC']],
      include: ['user'],
    });
  }
}