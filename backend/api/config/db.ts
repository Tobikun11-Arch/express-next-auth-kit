import mongoose from 'mongoose';
import {env} from './env';

export async function connectDb() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.MONGO_URI);
}