import mongoose from 'mongoose';
import {env} from './env';

// Cached across invocations on serverless platforms so warm Lambda
// instances reuse the pooled connection instead of reconnecting.
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