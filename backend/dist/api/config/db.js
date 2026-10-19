"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDb = connectDb;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
// Cached across invocations on serverless platforms so warm Lambda
// instances reuse the pooled connection instead of reconnecting.
let connectionPromise = null;
async function connectDb() {
    if (mongoose_1.default.connection.readyState === 1) {
        return mongoose_1.default;
    }
    if (!connectionPromise) {
        mongoose_1.default.set('strictQuery', true);
        connectionPromise = mongoose_1.default.connect(env_1.env.MONGO_URI).catch(error => {
            connectionPromise = null;
            throw error;
        });
    }
    return connectionPromise;
}
