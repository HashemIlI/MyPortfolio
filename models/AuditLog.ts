import 'server-only';

import { Schema, type Document, type Model, type InferSchemaType, models, model } from 'mongoose';

const AuditLogSchema = new Schema(
  {
    action: { type: String, required: true, index: true },
    entityType: { type: String, required: true, index: true },
    entityId: { type: String, default: '' },
    actorUsername: { type: String, default: '' },
    ipAddress: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    success: { type: Boolean, default: true, index: true },
    details: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export interface IAuditLog extends Document, InferSchemaType<typeof AuditLogSchema> {}

const AuditLog =
  (models.AuditLog as Model<IAuditLog>) || model<IAuditLog>('AuditLog', AuditLogSchema);

export default AuditLog;
