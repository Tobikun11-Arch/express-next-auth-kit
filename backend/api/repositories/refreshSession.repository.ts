import {RefreshSessionModel} from '../models/RefreshSession.model';

export const refreshSessionRepository = {
  create: (data: {
    jti: string;
    userId: string;
    type: 'user' | 'admin';
    familyId: string;
    expiresAt: Date;
    userAgent?: string | null;
    ip?: string | null;
  }) => RefreshSessionModel.create(data),

  findByJti: (jti: string) => RefreshSessionModel.findOne({jti}).exec(),

  rotate: (jti: string, replacedByJti: string) =>
    RefreshSessionModel.findOneAndUpdate(
      {jti, revokedAt: null, rotatedAt: null},
      {rotatedAt: new Date(), replacedByJti},
      {new: true}
    ).exec(),

  revokeFamily: (familyId: string) =>
    RefreshSessionModel.updateMany(
      {familyId, revokedAt: null},
      {revokedAt: new Date()}
    ).exec()
};
