import mongoose, {Schema} from 'mongoose';

export interface RefreshSessionDocument extends mongoose.Document {
  jti: string;
  userId: string;
  type: 'user' | 'admin';
  familyId: string;
  expiresAt: Date;
  revokedAt: Date | null;
  rotatedAt: Date | null;
  replacedByJti: string | null;
  userAgent: string | null;
  ip: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const RefreshSessionSchema = new Schema<RefreshSessionDocument>(
  {
    jti: {type: String, required: true, unique: true},
    userId: {type: String, required: true},
    type: {type: String, enum: ['user', 'admin'], required: true},
    familyId: {type: String, required: true, index: true},
    expiresAt: {type: Date, required: true},
    revokedAt: {type: Date, default: null},
    rotatedAt: {type: Date, default: null},
    replacedByJti: {type: String, default: null},
    userAgent: {type: String, default: null},
    ip: {type: String, default: null}
  },
  {timestamps: true}
);

RefreshSessionSchema.index({expiresAt: 1}, {expireAfterSeconds: 0});

export const RefreshSessionModel = mongoose.model<RefreshSessionDocument>(
  'RefreshSession',
  RefreshSessionSchema,
  'refresh_sessions'
);
