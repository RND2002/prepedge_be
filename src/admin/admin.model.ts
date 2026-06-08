import mongoose, { Schema, Document } from 'mongoose';

// 1. Admin Model
export interface IAdmin extends Document {
  name: string;
  email: string;
  password_hash: string;
  role: 'SUPER_ADMIN' | 'ADMIN';
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AdminSchema = new Schema<IAdmin>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true },
    role: { type: String, enum: ['SUPER_ADMIN', 'ADMIN'], default: 'ADMIN' },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date, default: null }
  },
  { timestamps: true }
);

export const Admin = mongoose.model<IAdmin>('Admin', AdminSchema);

// 2. Admin Refresh Token Model
export interface IAdminRefreshToken extends Document {
  adminId: mongoose.Types.ObjectId;
  token: string;
  expiresAt: Date;
  isRevoked: boolean;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const AdminRefreshTokenSchema = new Schema<IAdminRefreshToken>(
  {
    adminId: { type: Schema.Types.ObjectId, ref: 'Admin', required: true, index: true },
    token: { type: String, required: true, unique: true }, // Hashed token
    expiresAt: { type: Date, required: true },
    isRevoked: { type: Boolean, default: false },
    ipAddress: { type: String },
    userAgent: { type: String }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const AdminRefreshToken = mongoose.model<IAdminRefreshToken>('AdminRefreshToken', AdminRefreshTokenSchema);

// 3. Audit Log Model
export interface IAuditLog extends Document {
  adminId: mongoose.Types.ObjectId;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    adminId: { type: Schema.Types.ObjectId, ref: 'Admin', required: true, index: true },
    action: { type: String, required: true }, // 'Admin Login', 'User Suspension', etc.
    entity: { type: String, required: true }, // 'Admin', 'User', 'InterviewSession'
    entityId: { type: String },
    metadata: { type: Schema.Types.Map, of: Schema.Types.Mixed }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

// 4. User Moderation Model (for user suspensions)
export interface IUserModeration extends Document {
  userId: mongoose.Types.ObjectId;
  isSuspended: boolean;
  suspendedAt?: Date;
  suspendedBy?: mongoose.Types.ObjectId;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserModerationSchema = new Schema<IUserModeration>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    isSuspended: { type: Boolean, default: false },
    suspendedAt: { type: Date },
    suspendedBy: { type: Schema.Types.ObjectId, ref: 'Admin' },
    reason: { type: String, trim: true }
  },
  { timestamps: true }
);

export const UserModeration = mongoose.model<IUserModeration>('UserModeration', UserModerationSchema);
