import { Injectable, Logger } from '@nestjs/common';

/**
 * Audit Logger — records all security-relevant events.
 * Per Volume IV §3.12: Decision Logging
 * Per Volume V Chapter 7 §7.14: Logging Architecture
 *
 * Logs include: Timestamp, Service name, Event type, Severity, Error information
 * Log levels: Debug, Information, Warning, Error, Critical
 */

export enum AuditEvent {
  // Authentication events
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGIN_LOCKED = 'LOGIN_LOCKED',
  LOGOUT = 'LOGOUT',
  SIGNUP = 'SIGNUP',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  
  // Authorization events
  ACCESS_DENIED = 'ACCESS_DENIED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  
  // API events
  RATE_LIMIT_HIT = 'RATE_LIMIT_HIT',
  INVALID_INPUT = 'INVALID_INPUT',
  SUSPICIOUS_REQUEST = 'SUSPICIOUS_REQUEST',
  
  // AI events
  AI_ANALYSIS_REQUEST = 'AI_ANALYSIS_REQUEST',
  AI_ANALYSIS_COMPLETE = 'AI_ANALYSIS_COMPLETE',
  AI_ANALYSIS_FAILED = 'AI_ANALYSIS_FAILED',
  
  // System events
  SERVICE_STARTED = 'SERVICE_STARTED',
  SERVICE_ERROR = 'SERVICE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
}

export enum AuditSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

interface AuditEntry {
  timestamp: string;
  event: AuditEvent;
  severity: AuditSeverity;
  service: string;
  ip?: string;
  userId?: string;
  details?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class AuditLoggerService {
  private readonly logger = new Logger('AuditLogger');
  private static auditLog: AuditEntry[] = [];
  private static readonly MAX_LOG_SIZE = 10000;

  /**
   * Log a security event.
   */
  log(
    event: AuditEvent,
    severity: AuditSeverity,
    service: string,
    details?: {
      ip?: string;
      userId?: string;
      message?: string;
      metadata?: Record<string, any>;
    },
  ): void {
    const entry: AuditEntry = {
      timestamp: new Date().toISOString(),
      event,
      severity,
      service,
      ip: details?.ip,
      userId: details?.userId,
      details: details?.message,
      metadata: details?.metadata,
    };

    // Store in memory (in production, write to database or log service)
    AuditLoggerService.auditLog.push(entry);
    
    // Trim log if too large
    if (AuditLoggerService.auditLog.length > AuditLoggerService.MAX_LOG_SIZE) {
      AuditLoggerService.auditLog = AuditLoggerService.auditLog.slice(-5000);
    }

    // Console output with severity coloring
    const logMessage = `[${event}] ${service} | ${details?.message || ''} | IP: ${details?.ip || 'N/A'} | User: ${details?.userId || 'N/A'}`;
    
    switch (severity) {
      case AuditSeverity.CRITICAL:
      case AuditSeverity.ERROR:
        this.logger.error(logMessage);
        break;
      case AuditSeverity.WARNING:
        this.logger.warn(logMessage);
        break;
      case AuditSeverity.INFO:
        this.logger.log(logMessage);
        break;
      default:
        this.logger.debug(logMessage);
    }
  }

  /**
   * Get recent audit entries.
   */
  getRecentEntries(limit: number = 100): AuditEntry[] {
    return AuditLoggerService.auditLog.slice(-limit);
  }

  /**
   * Get entries for a specific user.
   */
  getUserEntries(userId: string, limit: number = 50): AuditEntry[] {
    return AuditLoggerService.auditLog
      .filter(e => e.userId === userId)
      .slice(-limit);
  }

  /**
   * Get security alerts (failed logins, rate limits, etc.).
   */
  getSecurityAlerts(limit: number = 50): AuditEntry[] {
    const securityEvents = [
      AuditEvent.LOGIN_FAILED,
      AuditEvent.LOGIN_LOCKED,
      AuditEvent.ACCESS_DENIED,
      AuditEvent.RATE_LIMIT_HIT,
      AuditEvent.SUSPICIOUS_REQUEST,
      AuditEvent.TOKEN_INVALID,
    ];
    
    return AuditLoggerService.auditLog
      .filter(e => securityEvents.includes(e.event))
      .slice(-limit);
  }
}
