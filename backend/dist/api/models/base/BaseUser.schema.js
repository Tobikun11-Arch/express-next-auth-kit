"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBaseUserSchema = createBaseUserSchema;
const mongoose_1 = require("mongoose");
function createBaseUserSchema() {
    const schema = new mongoose_1.Schema({
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        passwordHash: { type: String, required: true },
        username: { type: String, unique: true, sparse: true },
        isVerified: { type: Boolean, default: false },
        verificationCode: { type: String, default: null },
        verificationExpiry: { type: Date, default: null },
        resetCode: { type: String, default: null },
        resetExpiry: { type: Date, default: null }
    }, { timestamps: true });
    return schema;
}
