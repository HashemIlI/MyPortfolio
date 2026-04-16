import 'server-only';

import connectDB from '@/lib/mongodb';
import AuditLog from '@/models/AuditLog';
import { getRequestIp, getUserAgent, sanitizeInput } from '@/lib/security';

type AuditLogInput = {
  request?: Request;
  action: string;
  entityType: string;
  entityId?: string;
  actorUsername?: string;
  success?: boolean;
  details?: Record<string, unknown>;
};

export async function logAuditEvent({
  request,
  action,
  entityType,
  entityId = '',
  actorUsername = '',
  success = true,
  details = {},
}: AuditLogInput) {
  try {
    await connectDB();
    await AuditLog.create({
      action,
      entityType,
      entityId,
      actorUsername,
      ipAddress: request ? getRequestIp(request) : '',
      userAgent: request ? getUserAgent(request) : '',
      success,
      details: sanitizeInput(details),
    });
  } catch (error) {
    console.error('[AuditLog] Failed to write audit event', error);
  }
}
