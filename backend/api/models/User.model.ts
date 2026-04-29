import mongoose from 'mongoose';
import {BaseUserDocument, createBaseUserSchema} from './base/BaseUser.schema';

export interface UserDocument extends BaseUserDocument {}

const UserSchema = createBaseUserSchema<UserDocument>();

export const UserModel = mongoose.model<UserDocument>(
  'User',
  UserSchema,
  'users'
);