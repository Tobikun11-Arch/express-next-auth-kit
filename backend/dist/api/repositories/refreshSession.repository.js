"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshSessionRepository = void 0;
const RefreshSession_model_1 = require("../models/RefreshSession.model");
exports.refreshSessionRepository = {
    create: (data) => RefreshSession_model_1.RefreshSessionModel.create(data),
    findByJti: (jti) => RefreshSession_model_1.RefreshSessionModel.findOne({ jti }).exec(),
    rotate: (jti, replacedByJti) => RefreshSession_model_1.RefreshSessionModel.findOneAndUpdate({ jti, revokedAt: null, rotatedAt: null }, { rotatedAt: new Date(), replacedByJti }, { new: true }).exec(),
    revokeFamily: (familyId) => RefreshSession_model_1.RefreshSessionModel.updateMany({ familyId, revokedAt: null }, { revokedAt: new Date() }).exec()
};
