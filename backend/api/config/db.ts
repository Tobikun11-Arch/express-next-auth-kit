import mongoose from 'mongoose';
import {env} from './env';

let connectionPromise: Promise<typeof mongoose> | null = null;

export async function connectDb() {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (!connectionPromise) {
    mongoose.set('strictQuery', true);
    connectionPromise = mongoose.connect(env.MONGO_URI).catch(error => {
      connectionPromise = null;
      throw error;
    });
  }

  return connectionPromise;
}