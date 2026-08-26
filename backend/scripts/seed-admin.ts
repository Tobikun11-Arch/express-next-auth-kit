import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import {AdminModel} from '../api/models/Admin.model';

dotenv.config();

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
    await mongoose.connect(MONGO_URI!);
    console.log('Connected to MongoDB');

    const existing = await AdminModel.findOne({email: ADMIN_EMAIL});
    if (existing) {
      console.log(`Admin with email "${ADMIN_EMAIL}" already exists. Skipping.`);
      await mongoose.disconnect();
      return;
    }

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    await AdminModel.create({
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

    await mongoose.disconnect();
  } catch (error) {
    console.error('Seed failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seed();
