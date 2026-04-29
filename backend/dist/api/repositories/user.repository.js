"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRepository = void 0;
const User_model_1 = require("../models/User.model");
exports.userRepository = {
    findByEmail: (email) => User_model_1.UserModel.findOne({ email: email.toLowerCase() }).exec(),
    findById: (id) => User_model_1.UserModel.findById(id).exec(),
    listAll: () => User_model_1.UserModel.find({}).exec(),
    create: (data) => User_model_1.UserModel.create(data),
    updateProfile: (userId, data) => User_model_1.UserModel.updateOne({ _id: userId }, data).exec(),
    setVerificationCode: (email, code, expiry) => User_model_1.UserModel.updateOne({ email: email.toLowerCase() }, { verificationCode: code, verificationExpiry: expiry }).exec(),
    clearVerificationCode: (email) => User_model_1.UserModel.updateOne({ email: email.toLowerCase() }, { verificationCode: null, verificationExpiry: null }).exec(),
    markVerified: (email) => User_model_1.UserModel.updateOne({ email: email.toLowerCase() }, { isVerified: true, verificationCode: null, verificationExpiry: null }).exec()
};
