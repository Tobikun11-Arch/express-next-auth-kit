"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const dotenv_1 = __importDefault(require("dotenv"));
const Admin_model_1 = require("../api/models/Admin.model");
dotenv_1.default.config();
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
    console.error('MONGO_URI is not defined in .env');
    process.exit(1);
}
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Admin123!';
const ADMIN_FIRST_NAME = process.env.SEED_ADMIN_FIRST_NAME || 'Admin';
const ADMIN_LAST_NAME = process.env.SEED_ADMIN_LAST_NAME || 'User';
async function seed() {
    try {
        await mongoose_1.default.connect(MONGO_URI);
        console.log('Connected to MongoDB');
        const existing = await Admin_model_1.AdminModel.findOne({ email: ADMIN_EMAIL });
        if (existing) {
            console.log(`Admin with email "${ADMIN_EMAIL}" already exists. Skipping.`);
            await mongoose_1.default.disconnect();
            return;
        }
        const passwordHash = await bcrypt_1.default.hash(ADMIN_PASSWORD, 10);
        await Admin_model_1.AdminModel.create({
            firstName: ADMIN_FIRST_NAME,
            lastName: ADMIN_LAST_NAME,
            email: ADMIN_EMAIL,
            passwordHash,
            isVerified: true
        });
        console.log(`Admin created successfully:`);
        console.log(`  Email:    ${ADMIN_EMAIL}`);
        console.log(`  Password: ${ADMIN_PASSWORD}`);
        console.log(`\nChange the default password after first login!`);
        await mongoose_1.default.disconnect();
    }
    catch (error) {
        console.error('Seed failed:', error);
        await mongoose_1.default.disconnect();
        process.exit(1);
    }
}
seed();
